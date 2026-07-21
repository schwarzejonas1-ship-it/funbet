-- v3: multi-option bets. Yes/No becomes a 2-option preset.
-- Pools move from bets.yes_pool/no_pool onto a new bet_options table; stakes point
-- at an option instead of a boolean side; resolve picks one winning option.

-- 1. bet_options table
create table bet_options (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  pool int not null default 0 check (pool >= 0),
  position int not null,
  created_at timestamptz not null default now(),
  unique (bet_id, position)
);
create index idx_bet_options_bet on bet_options(bet_id);

-- 2. backfill options from existing binary bets
insert into bet_options (bet_id, label, pool, position)
select id, 'Yes', yes_pool, 1 from bets
union all
select id, 'No', no_pool, 2 from bets;

-- 3. stakes.option_id
alter table stakes add column option_id uuid references bet_options(id) on delete cascade;
update stakes s
set option_id = o.id
from bet_options o
where o.bet_id = s.bet_id and o.label = (case when s.side then 'Yes' else 'No' end);
alter table stakes alter column option_id set not null;

-- 4. bets.winning_option_id
alter table bets add column winning_option_id uuid references bet_options(id);
update bets b
set winning_option_id = o.id
from bet_options o
where b.status = 'resolved' and b.outcome is not null
  and o.bet_id = b.id and o.label = (case when b.outcome then 'Yes' else 'No' end);

-- 5. drop legacy binary columns
alter table stakes drop column side;
alter table bets drop column yes_pool, drop column no_pool, drop column outcome;

-- 6. RLS + realtime for bet_options
alter table bet_options enable row level security;
create policy bet_options_select on bet_options
  for select to authenticated
  using (exists (select 1 from bets b where b.id = bet_id and is_room_member(b.room_id)));
alter publication supabase_realtime add table bet_options;

-- 7. reworked RPCs
drop function if exists create_bet(uuid, text);
drop function if exists place_stake(uuid, boolean, integer);
drop function if exists resolve_bet(uuid, boolean);

create or replace function create_bet(p_room_id uuid, p_question text, p_options text[])
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_bet bets;
  v_creator_name text;
  v_clean text[] := array[]::text[];
  v_label text;
begin
  select display_name into v_creator_name
  from room_members where room_id = p_room_id and user_id = v_uid;
  if not found then
    raise exception 'Not a member of this room';
  end if;

  if p_options is null then
    raise exception 'A bet needs at least 2 options';
  end if;
  foreach v_label in array p_options loop
    v_label := trim(v_label);
    if v_label = '' then
      continue;
    end if;
    if char_length(v_label) > 60 then
      raise exception 'An option is too long (max 60 characters)';
    end if;
    if exists (select 1 from unnest(v_clean) x where lower(x) = lower(v_label)) then
      raise exception 'Options must be different from each other';
    end if;
    v_clean := array_append(v_clean, v_label);
  end loop;
  if coalesce(array_length(v_clean, 1), 0) < 2 then
    raise exception 'A bet needs at least 2 options';
  end if;
  if array_length(v_clean, 1) > 8 then
    raise exception 'A bet can have at most 8 options';
  end if;

  insert into bets (room_id, creator_id, question)
  values (p_room_id, v_uid, trim(p_question))
  returning * into v_bet;

  insert into bet_options (bet_id, label, position)
  select v_bet.id, lbl, ord
  from unnest(v_clean) with ordinality as t(lbl, ord);

  insert into notifications (room_id, user_id, type, bet_id, message)
  select p_room_id, m.user_id, 'bet_created', v_bet.id,
         v_creator_name || ' created a bet: "' || v_bet.question || '"'
  from room_members m
  where m.room_id = p_room_id and m.user_id <> v_uid;

  return row_to_json(v_bet);
end;
$$;

create or replace function place_stake(p_bet_id uuid, p_option_id uuid, p_amount int)
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

  select * into v_bet from bets where id = p_bet_id for update;
  if not found then
    raise exception 'Bet not found';
  end if;
  if v_bet.status <> 'open' then
    raise exception 'This bet has already been resolved';
  end if;

  if not exists (select 1 from bet_options where id = p_option_id and bet_id = p_bet_id) then
    raise exception 'Invalid option for this bet';
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

  insert into stakes (bet_id, user_id, option_id, amount)
  values (p_bet_id, v_uid, p_option_id, p_amount)
  returning * into v_stake;

  update bet_options set pool = pool + p_amount where id = p_option_id;

  return row_to_json(v_stake);
end;
$$;

create or replace function resolve_bet(p_bet_id uuid, p_winning_option_id uuid)
returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_bet bets;
  v_total bigint;
  v_winning bigint;
  v_losing bigint;
  v_dust bigint;
  v_resolver_name text;
  v_win_label text;
  v_refunded boolean := false;
begin
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

  select label, pool into v_win_label, v_winning
  from bet_options where id = p_winning_option_id and bet_id = p_bet_id;
  if not found then
    raise exception 'Invalid winning option for this bet';
  end if;

  select coalesce(sum(pool), 0) into v_total from bet_options where bet_id = p_bet_id;
  v_losing := v_total - v_winning;

  if v_total > 0 and (v_winning = 0 or v_losing = 0) then
    v_refunded := true;
    update stakes set payout = amount where bet_id = p_bet_id;
  elsif v_total > 0 then
    update stakes
    set payout = case
      when option_id = p_winning_option_id then ((amount::bigint * v_total) / v_winning)::int
      else 0
    end
    where bet_id = p_bet_id;

    select v_total - coalesce(sum(payout), 0) into v_dust from stakes where bet_id = p_bet_id;
    if v_dust > 0 then
      update stakes set payout = payout + v_dust
      where id = (
        select id from stakes
        where bet_id = p_bet_id and option_id = p_winning_option_id
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
  set status = 'resolved', winning_option_id = p_winning_option_id, resolved_at = now()
  where id = p_bet_id
  returning * into v_bet;

  select display_name into v_resolver_name
  from room_members where room_id = v_bet.room_id and user_id = v_uid;

  insert into notifications (room_id, user_id, type, bet_id, message)
  select v_bet.room_id, m.user_id, 'bet_resolved', p_bet_id,
         case
           when v_refunded then '"' || v_bet.question || '" was resolved: ' || v_win_label || ' — all stakes refunded (one-sided pool)'
           else '"' || v_bet.question || '" was resolved: ' || v_win_label
         end
  from room_members m
  where m.room_id = v_bet.room_id and m.user_id <> v_uid;

  return row_to_json(v_bet);
end;
$$;

-- 8. grants (new funcs default-grant EXECUTE to PUBLIC; lock down)
revoke execute on function create_bet(uuid, text, text[]) from public, anon;
revoke execute on function place_stake(uuid, uuid, int) from public, anon;
revoke execute on function resolve_bet(uuid, uuid) from public, anon;
grant execute on function create_bet(uuid, text, text[]) to authenticated;
grant execute on function place_stake(uuid, uuid, int) to authenticated;
grant execute on function resolve_bet(uuid, uuid) to authenticated;
