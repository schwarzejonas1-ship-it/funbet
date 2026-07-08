-- Fix linter warning: pin search_path on generate_room_code

create or replace function generate_room_code()
returns text
language sql volatile set search_path = public as $$
  -- 8 chars from an unambiguous alphabet (no 0/O/1/l/i)
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', (floor(random() * 31))::int + 1, 1), '')
  from generate_series(1, 8);
$$;
