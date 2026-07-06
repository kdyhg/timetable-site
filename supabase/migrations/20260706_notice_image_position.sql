alter table public.notices
  add column if not exists image_position text not null default 'bottom';

alter table public.notices
  alter column image_position set default 'bottom';

update public.notices
set image_position = 'bottom'
where image_position is null
  or image_position not in ('top', 'bottom', 'hidden');

alter table public.notices
  alter column image_position set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_image_position_check'
  ) then
    alter table public.notices
      add constraint notices_image_position_check
      check (image_position in ('top', 'bottom', 'hidden'));
  end if;
end $$;
