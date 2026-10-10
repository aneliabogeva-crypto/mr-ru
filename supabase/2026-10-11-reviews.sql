-- Отзиви и рейтинг на майсторите.
-- Пуска се веднъж в Supabase → SQL Editor. Може да се пусне повторно.
--
-- Рейтингът е средната оценка (1–5) от таблицата reviews.
-- Засега отзиви се добавят само от собственика на проекта (Table Editor),
-- защото отворено гласуване без проверка лесно се манипулира.
-- Следваща стъпка: клиент оценява майстор след приключено запитване.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  author text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_contractor_idx on public.reviews (contractor_id);

alter table public.reviews enable row level security;

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews for select using (true);

create or replace view public.contractor_ratings
with (security_invoker = true) as
select contractor_id, round(avg(stars)::numeric, 1) as rating, count(*)::int as reviews
from public.reviews
group by contractor_id;

grant select on public.reviews to anon, authenticated;
grant select on public.contractor_ratings to anon, authenticated;

-- Примерни отзиви само за демо майсторите (не се дублират при повторно пускане).
insert into public.reviews (contractor_id, stars, author, comment)
select c.id, v.stars, v.author, v.comment
from (values
  ('Ремонти Петров', 5, 'Николай', 'Чисто и в срок, шпакловката е перфектна.'),
  ('Ремонти Петров', 5, 'Десислава', 'Спалня и коридор за 9 дни.'),
  ('Ремонти Петров', 4, 'Георги', 'Добра работа, малко закъсня с началото.'),
  ('Електро Стил ЕООД', 5, 'Ива', 'Нова инсталация с протокол от измерване.'),
  ('Електро Стил ЕООД', 4, 'Петър', 'Коректни цени.'),
  ('АкваФикс', 4, 'Мартин', 'Баня за две седмици, добри наклони.'),
  ('АкваФикс', 5, 'Елена', 'Много прецизни плочки.'),
  ('АкваФикс', 3, 'Стефан', 'Хубав резултат, но трудно се свързвахме.'),
  ('Мария Колева', 5, 'Росица', 'Чудесни съвети за цветовете.'),
  ('Бригада Странджа', 4, 'Калин', 'Бързо къртене и извозване.')
) as v (name, stars, author, comment)
join public.contractors c on c.name = v.name and c.is_demo
where not exists (
  select 1 from public.reviews r where r.contractor_id = c.id and r.author = v.author and r.comment = v.comment
);
