-- FunBet initial schema: tables, RLS, atomic RPCs, realtime
-- (applied to project ohaoxrteiamxcnafgkhp as migration "initial_schema")

-- ============ TABLES ============

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  code text not null unique,
  starting_balance int not null check (starting_balance between 1 and 1000000000),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  balance int not null check (balance >= 0),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table bets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  creator_id uuid not null,
  question text not null check (char_length(question) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'resolved')),
  outcome boolean,
  yes_pool int not null default 0 check (yes_pool >= 0),
  no_pool int not null default 0 check (no_pool >= 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table stakes (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  user_id uuid not null,
  side boolean not null,
  amount int not null check (amount > 0),
  payout int,
  created_at timestamptz not null default now(),
  unique (bet_id, user_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null,
  type text not null check (type in ('bet_created', 'bet_resolved')),
  bet_id uuid references bets(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_room_members_room on room_members(room_id);
create index idx_room_members_user on room_members(user_id);
create index idx_bets_room on bets(room_id);
create index idx_stakes_bet on stakes(bet_id);
create index idx_notifications_user on notifications(user_id, room_id);

-- ============ RLS HELPERS (security definer to avoid recursive RLS) ============

create or replace function is_room_member(p_room_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from room_members
    where room_id = p_room_id and user_id = (select auth.uid())
  );
$$;

create or replace function is_bet_room_member(p_bet_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from bets b
    join room_members m on m.room_id = b.room_id
    where b.id = p_bet_id and m.user_id = (select auth.uid())
  );
$$;

-- ============ RLS POLICIES ============
-- Reads are member-scoped. ALL writes that move coins go through
-- security-definer RPCs; no direct INSERT/UPDATE policies exist for them.

alter table rooms enable row level security;
alter table room_members enable row level security;
alter table bets enable row level security;
alter table stakes enable row level security;
alter table notifications enable row level security;

create policy rooms_select on rooms
  for select to authenticated using (is_room_member(id));

create policy room_members_select on room_members
  for select to authenticated using (is_room_member(room_id));

create policy bets_select on bets
  for select to authenticated using (is_room_member(room_id));

create policy stakes_select on stakes
  for select to authenticated using (is_bet_room_member(bet_id));

create policy notifications_select on notifications
  for select to authenticated using (user_id = (select auth.uid()));

create policy notifications_update on notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============ ROOM CODE GENERATION ============

create or replace function generate_room_code()
returns text
language sql volatile as $$
  -- 8 chars from an unambiguous alphabet (no 0/O/1/l/i)
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', (floor(random() * 31))::int + 1, 1), '')
  from generate_series(1, 8);
$$;

-- ============ RPCs ============

create or replace function create_room(p_name text, p_starting_balance int, p_display_name text)
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_room rooms;
  v_code text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  if p_starting_balance is null or p_starting_balance < 1 or p_starting_balance > 1000000000 then
    raise exception 'Starting balance must be between 1 and 1,000,000,000';
  end if;

  loop
    v_code := generate_room_code();
    begin
      insert into rooms (name, code, starting_balance, created_by)
      values (trim(p_name), v_code, p_starting_balance, v_uid)
      returning * into v_room;
      exit;
    exception when unique_violation then
      -- rare code collision, retry
    end;
  end loop;

  insert into room_members (room_id, user_id, display_name, balance)
  values (v_room.id, v_uid, trim(p_display_name), p_starting_balance);

  return row_to_json(v_room);
end;
$$;

create or replace function get_room_preview(p_code text)
returns json
language plpgsql stable security definer set search_path = public as $$
declare
  v_room rooms;
  v_member_count int;
begin
  select * into v_room from rooms where code = lower(trim(p_code));
  if not found then
    raise exception 'Room not found';
  end if;
  select count(*) into v_member_count from room_members where room_id = v_room.id;
  return json_build_object(
    'id', v_room.id,
    'name', v_room.name,
    'starting_balance', v_room.starting_balance,
    'member_count', v_member_count,
    'already_member', exists (
      select 1 from room_members where room_id = v_room.id and user_id = auth.uid()
    )
  );
end;
$$;

create or replace function join_room(p_code text, p_display_name text)
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_room rooms;
  v_member room_members;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select * into v_room from rooms where code = lower(trim(p_code));
  if not found then
    raise exception 'Room not found';
  end if;

  select * into v_member from room_members where room_id = v_room.id and user_id = v_uid;
  if not found then
    insert into room_members (room_id, user_id, display_name, balance)
    values (v_room.id, v_uid, trim(p_display_name), v_room.starting_balance)
    returning * into v_member;
  end if;

  return json_build_object('room_id', v_room.id, 'room_name', v_room.name, 'member_id', v_member.id);
end;
$$;

create or replace function create_bet(p_room_id uuid, p_question text)
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_bet bets;
  v_creator_name text;
begin
  select display_name into v_creator_name
  from room_members where room_id = p_room_id and user_id = v_uid;
  if not found then
    raise exception 'Not a member of this room';
  end if;

  insert into bets (room_id, creator_id, question)
  values (p_room_id, v_uid, trim(p_question))
  returning * into v_bet;

  insert into notifications (room_id, user_id, type, bet_id, message)
  select p_room_id, m.user_id, 'bet_created', v_bet.id,
         v_creator_name || ' created a bet: "' || v_bet.question || '"'
  from room_members m
  where m.room_id = p_room_id and m.user_id <> v_uid;

  return row_to_json(v_bet);
end;
$$;

create or replace function place_stake(p_bet_id uuid, p_side boolean, p_amount int)
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_bet bets;
  v_member room_members;
  v_stake stakes;
begin
  if p_amount is null or p_amount < 1 then
    raise exception 'Stake must be at least 1 coin';
  end if;

  -- lock the bet row: serializes concurrent stakes/resolution on this bet
  select * into v_bet from bets where id = p_bet_id for update;
  if not found then
    raise exception 'Bet not found';
  end if;
  if v_bet.status <> 'open' then
    raise exception 'This bet has already been resolved';
  end if;

  select * into v_member
  from room_members
  where room_id = v_bet.room_id and user_id = v_uid
  for update;
  if not found then
    raise exception 'Not a member of this room';
  end if;

  if exists (select 1 from stakes where bet_id = p_bet_id and user_id = v_uid) then
    raise exception 'You already have a stake on this bet';
  end if;

  if v_member.balance < p_amount then
    raise exception 'Insufficient balance: you have % coins', v_member.balance;
  end if;

  update room_members set balance = balance - p_amount where id = v_member.id;

  insert into stakes (bet_id, user_id, side, amount)
  values (p_bet_id, v_uid, p_side, p_amount)
  returning * into v_stake;

  if p_side then
    update bets set yes_pool = yes_pool + p_amount where id = p_bet_id;
  else
    update bets set no_pool = no_pool + p_amount where id = p_bet_id;
  end if;

  return row_to_json(v_stake);
end;
$$;

create or replace function resolve_bet(p_bet_id uuid, p_outcome boolean)
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_bet bets;
  v_total bigint;
  v_winning_pool bigint;
  v_losing_pool bigint;
  v_dust bigint;
  v_resolver_name text;
  v_refunded boolean := false;
begin
  -- lock the bet row: blocks concurrent place_stake calls
  select * into v_bet from bets where id = p_bet_id for update;
  if not found then
    raise exception 'Bet not found';
  end if;
  if v_bet.creator_id <> v_uid then
    raise exception 'Only the bet creator can resolve it';
  end if;
  if v_bet.status <> 'open' then
    raise exception 'This bet has already been resolved';
  end if;

  v_total := v_bet.yes_pool + v_bet.no_pool;
  v_winning_pool := case when p_outcome then v_bet.yes_pool else v_bet.no_pool end;
  v_losing_pool := v_total - v_winning_pool;

  if v_total > 0 and (v_winning_pool = 0 or v_losing_pool = 0) then
    -- one side empty: refund everyone in full
    v_refunded := true;
    update stakes set payout = amount where bet_id = p_bet_id;
  elsif v_total > 0 then
    -- winners split the whole pool proportionally (floor), losers get 0
    update stakes
    set payout = case
      when side = p_outcome then ((amount::bigint * v_total) / v_winning_pool)::int
      else 0
    end
    where bet_id = p_bet_id;

    -- credit rounding dust to the largest winning stake so coins are conserved
    select v_total - coalesce(sum(payout), 0) into v_dust
    from stakes where bet_id = p_bet_id;
    if v_dust > 0 then
      update stakes set payout = payout + v_dust
      where id = (
        select id from stakes
        where bet_id = p_bet_id and side = p_outcome
        order by amount desc, created_at asc
        limit 1
      );
    end if;
  end if;

  update room_members m
  set balance = m.balance + s.payout
  from stakes s
  where s.bet_id = p_bet_id
    and s.payout > 0
    and m.room_id = v_bet.room_id
    and m.user_id = s.user_id;

  update bets
  set status = 'resolved', outcome = p_outcome, resolved_at = now()
  where id = p_bet_id
  returning * into v_bet;

  select display_name into v_resolver_name
  from room_members where room_id = v_bet.room_id and user_id = v_uid;

  insert into notifications (room_id, user_id, type, bet_id, message)
  select v_bet.room_id, m.user_id, 'bet_resolved', p_bet_id,
         case
           when v_refunded then '"' || v_bet.question || '" was resolved ' || (case when p_outcome then 'YES' else 'NO' end) || ' — all stakes refunded (one-sided pool)'
           else '"' || v_bet.question || '" was resolved: ' || (case when p_outcome then 'YES' else 'NO' end)
         end
  from room_members m
  where m.room_id = v_bet.room_id and m.user_id <> v_uid;

  return row_to_json(v_bet);
end;
$$;

-- ============ FUNCTION GRANTS ============
-- Anonymous sign-in users get the `authenticated` role; lock everything to it.

revoke execute on all functions in schema public from public, anon;
grant execute on function is_room_member(uuid) to authenticated;
grant execute on function is_bet_room_member(uuid) to authenticated;
grant execute on function create_room(text, int, text) to authenticated;
grant execute on function get_room_preview(text) to authenticated;
grant execute on function join_room(text, text) to authenticated;
grant execute on function create_bet(uuid, text) to authenticated;
grant execute on function place_stake(uuid, boolean, int) to authenticated;
grant execute on function resolve_bet(uuid, boolean) to authenticated;

-- ============ REALTIME ============

alter publication supabase_realtime add table bets, stakes, room_members, notifications;
