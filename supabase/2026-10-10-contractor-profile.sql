-- Mr.Ru: опит и описание в профила на майстора.
-- Пуска се веднъж в Supabase → SQL Editor → New query → Run.
-- Приложението работи и преди това, само без тези две полета.

alter table public.contractors add column if not exists bio text not null default ''
  check (char_length(bio) <= 600);
alter table public.contractors add column if not exists experience_years integer
  check (experience_years is null or experience_years between 0 and 60);

grant update (bio, experience_years) on public.contractors to authenticated;

-- Градът на демо майсторите без квартал, за да съвпада точно с избора на клиента.
update public.contractors set city = trim(split_part(city, ',', 1)) where city like '%,%';
