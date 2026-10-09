-- Mr.Ru: схема на базата в Supabase.
-- Пуска се веднъж в Supabase → SQL Editor → New query → Run.
-- Може да се пусне повторно: не трие данни и не дублира демо майсторите.

-- ─── Майстори ────────────────────────────────────────────────────────────────
create table if not exists public.contractors (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users (id) on delete cascade,  -- null за демо профилите
  name        text not null check (char_length(name) between 1 and 120),
  person      text not null default '' check (char_length(person) <= 120),
  phone       text not null default '' check (char_length(phone) <= 40),
  email       text not null default '' check (char_length(email) <= 200),
  city        text not null default '' check (char_length(city) <= 120),
  trades      text[] not null default '{}',
  prices      jsonb not null default '{}'::jsonb,   -- {"t1": {"price": 18, "off": false}, ...}
  quote_seq   integer not null default 0,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Запитвания от клиенти ──────────────────────────────────────────────────
create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  status        text not null default 'new' check (status in ('new', 'seen', 'quoted', 'closed')),
  client_name   text not null check (char_length(client_name) between 1 and 120),
  client_phone  text not null check (char_length(client_phone) between 3 and 40),
  client_email  text not null default '' check (char_length(client_email) <= 200),
  client_city   text not null default '' check (char_length(client_city) <= 200),
  items         jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60),
  comment       text not null default '' check (char_length(comment) <= 2000),
  custom        text not null default '' check (char_length(custom) <= 500),
  created_at    timestamptz not null default now()
);
create index if not exists requests_contractor_idx on public.requests (contractor_id, created_at desc);

-- updated_at при всяка промяна на майстор
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists contractors_touch on public.contractors;
create trigger contractors_touch before update on public.contractors
  for each row execute function public.touch_updated_at();

-- ─── Права (Row Level Security) ──────────────────────────────────────────────
alter table public.contractors enable row level security;
alter table public.requests    enable row level security;

grant select on public.contractors to anon, authenticated;
grant insert, update on public.contractors to authenticated;
grant insert on public.requests to anon, authenticated;
grant select on public.requests to authenticated;
grant update (status) on public.requests to authenticated;

-- Всеки вижда профилите и ценоразписите на майсторите.
drop policy if exists "contractors are public" on public.contractors;
create policy "contractors are public" on public.contractors
  for select using (true);

-- Майсторът създава и редактира само своя профил.
drop policy if exists "contractor creates own profile" on public.contractors;
create policy "contractor creates own profile" on public.contractors
  for insert to authenticated with check (user_id = auth.uid() and is_demo = false);

drop policy if exists "contractor edits own profile" on public.contractors;
create policy "contractor edits own profile" on public.contractors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_demo = false);

-- Всеки може да изпрати запитване (само със статус „ново“), но не може да чете запитвания.
drop policy if exists "anyone can send a request" on public.requests;
create policy "anyone can send a request" on public.requests
  for insert to anon, authenticated with check (status = 'new');

-- Майсторът вижда и сменя статуса само на запитванията към себе си.
drop policy if exists "contractor reads own requests" on public.requests;
create policy "contractor reads own requests" on public.requests
  for select to authenticated
  using (contractor_id in (select id from public.contractors where user_id = auth.uid()));

drop policy if exists "contractor updates own requests" on public.requests;
create policy "contractor updates own requests" on public.requests
  for update to authenticated
  using (contractor_id in (select id from public.contractors where user_id = auth.uid()))
  with check (contractor_id in (select id from public.contractors where user_id = auth.uid()));

-- ─── Демо майстори (за да има пазарни цени от първия ден) ────────────────────
-- Изтриване по-късно: delete from public.contractors where is_demo;
insert into public.contractors (name, person, phone, email, city, trades, prices, is_demo)
select * from (values
  ('Ремонти Петров', 'Иван Петров', '+359 888 123 456', 'ivan@remonti-petrov.bg', 'София', array['pl','pa','tf','de']::text[], '{"el1":{"price":7,"off":true},"el2":{"price":22,"off":true},"el3":{"price":7.5,"off":true},"el4":{"price":18.5,"off":true},"el5":{"price":172,"off":true},"el6":{"price":5,"off":true},"el7":{"price":24,"off":true},"v1":{"price":91.5,"off":true},"v2":{"price":84,"off":true},"v3":{"price":198.5,"off":true},"v4":{"price":30.5,"off":true},"v5":{"price":82,"off":true},"v6":{"price":75.5,"off":true},"v7":{"price":30.5,"off":true},"v8":{"price":91,"off":true},"v9":{"price":263.5,"off":true},"v10":{"price":153.5,"off":true},"v11":{"price":56.5,"off":true},"v12":{"price":111.5,"off":true},"v13":{"price":14,"off":true},"p1":{"price":14,"off":false},"p2":{"price":11,"off":false},"p3":{"price":21,"off":false},"p4":{"price":23.5,"off":false},"p5":{"price":12,"off":true},"p6":{"price":5,"off":false},"p7":{"price":17.5,"off":false},"p8":{"price":17.5,"off":false},"p9":{"price":16.5,"off":false},"t1":{"price":42,"off":false},"t2":{"price":42.5,"off":false},"t3":{"price":5.5,"off":false},"t4":{"price":10.5,"off":false},"t5":{"price":13.5,"off":false},"t6":{"price":10.5,"off":false},"t7":{"price":20.5,"off":false},"t8":{"price":9,"off":false},"a1":{"price":1.5,"off":false},"a2":{"price":5,"off":false},"a3":{"price":15,"off":true},"a4":{"price":14,"off":false},"a5":{"price":5.5,"off":false},"d1":{"price":19.5,"off":false},"d2":{"price":4,"off":false},"d3":{"price":12.5,"off":false},"d4":{"price":119.5,"off":false},"d5":{"price":34.5,"off":false},"j1":{"price":26.5,"off":true},"j2":{"price":72,"off":true},"j3":{"price":28.5,"off":true},"j4":{"price":31.5,"off":true},"j5":{"price":17.5,"off":true}}'::jsonb, true),
  ('Електро Стил ЕООД', 'Георги Димитров', '+359 877 204 118', 'office@elektrostil.bg', 'София', array['el']::text[], '{"el1":{"price":7.5,"off":false},"el2":{"price":29.5,"off":false},"el3":{"price":9.5,"off":false},"el4":{"price":20,"off":false},"el5":{"price":185,"off":false},"el6":{"price":5.5,"off":false},"el7":{"price":25.5,"off":false},"v1":{"price":95.5,"off":true},"v2":{"price":88,"off":true},"v3":{"price":208.5,"off":true},"v4":{"price":39.5,"off":true},"v5":{"price":106,"off":true},"v6":{"price":97.5,"off":true},"v7":{"price":39.5,"off":true},"v8":{"price":117.5,"off":true},"v9":{"price":274.5,"off":true},"v10":{"price":165.5,"off":true},"v11":{"price":75.5,"off":true},"v12":{"price":148,"off":true},"v13":{"price":15,"off":true},"p1":{"price":18,"off":true},"p2":{"price":14,"off":true},"p3":{"price":27.5,"off":true},"p4":{"price":30,"off":true},"p5":{"price":15,"off":true},"p6":{"price":5.5,"off":true},"p7":{"price":18,"off":true},"p8":{"price":18,"off":true},"p9":{"price":17.5,"off":true},"t1":{"price":44,"off":true},"t2":{"price":44.5,"off":true},"t3":{"price":7,"off":true},"t4":{"price":13.5,"off":true},"t5":{"price":17,"off":true},"t6":{"price":14,"off":true},"t7":{"price":26.5,"off":true},"t8":{"price":9.5,"off":true},"a1":{"price":1.5,"off":true},"a2":{"price":5,"off":true},"a3":{"price":16,"off":true},"a4":{"price":15,"off":true},"a5":{"price":6,"off":true},"d1":{"price":20.5,"off":true},"d2":{"price":4,"off":true},"d3":{"price":13.5,"off":true},"d4":{"price":127,"off":true},"d5":{"price":36.5,"off":true},"j1":{"price":34,"off":true},"j2":{"price":92.5,"off":true},"j3":{"price":29.5,"off":true},"j4":{"price":33,"off":true},"j5":{"price":18,"off":true}}'::jsonb, true),
  ('АкваФикс', 'Стоян Николов', '+359 899 551 020', 'aquafix@abv.bg', 'София', array['vik','tf']::text[], '{"el1":{"price":6.5,"off":true},"el2":{"price":25,"off":true},"el3":{"price":8,"off":true},"el4":{"price":20.5,"off":true},"el5":{"price":193.5,"off":true},"el6":{"price":4.5,"off":true},"el7":{"price":21.5,"off":true},"v1":{"price":78.5,"off":false},"v2":{"price":72.5,"off":false},"v3":{"price":171.5,"off":true},"v4":{"price":32.5,"off":false},"v5":{"price":87,"off":false},"v6":{"price":80,"off":false},"v7":{"price":32.5,"off":false},"v8":{"price":97,"off":false},"v9":{"price":279.5,"off":false},"v10":{"price":140.5,"off":false},"v11":{"price":64,"off":false},"v12":{"price":125.5,"off":false},"v13":{"price":15.5,"off":false},"p1":{"price":15,"off":true},"p2":{"price":11.5,"off":true},"p3":{"price":22.5,"off":true},"p4":{"price":24.5,"off":true},"p5":{"price":12.5,"off":true},"p6":{"price":5.5,"off":true},"p7":{"price":18.5,"off":true},"p8":{"price":18.5,"off":true},"p9":{"price":17.5,"off":true},"t1":{"price":36,"off":false},"t2":{"price":36.5,"off":false},"t3":{"price":6,"off":false},"t4":{"price":11,"off":false},"t5":{"price":14,"off":false},"t6":{"price":11.5,"off":false},"t7":{"price":22,"off":false},"t8":{"price":9.5,"off":false},"a1":{"price":1.5,"off":true},"a2":{"price":4,"off":true},"a3":{"price":13.5,"off":true},"a4":{"price":12.5,"off":true},"a5":{"price":5,"off":true},"d1":{"price":21,"off":true},"d2":{"price":4,"off":true},"d3":{"price":13.5,"off":true},"d4":{"price":128.5,"off":true},"d5":{"price":30,"off":true},"j1":{"price":28,"off":true},"j2":{"price":76.5,"off":true},"j3":{"price":30,"off":true},"j4":{"price":33.5,"off":true},"j5":{"price":18.5,"off":true}}'::jsonb, true),
  ('Мария Колева', 'Мария Колева', '+359 886 330 742', 'm.koleva@mail.bg', 'Перник', array['pa','pl','jo']::text[], '{"el1":{"price":7,"off":true},"el2":{"price":27,"off":true},"el3":{"price":9,"off":true},"el4":{"price":22.5,"off":true},"el5":{"price":210,"off":true},"el6":{"price":6.5,"off":true},"el7":{"price":29,"off":true},"v1":{"price":82.5,"off":true},"v2":{"price":76,"off":true},"v3":{"price":180,"off":true},"v4":{"price":34.5,"off":true},"v5":{"price":91.5,"off":true},"v6":{"price":84.5,"off":true},"v7":{"price":34.5,"off":true},"v8":{"price":102,"off":true},"v9":{"price":294.5,"off":true},"v10":{"price":152.5,"off":true},"v11":{"price":69.5,"off":true},"v12":{"price":136.5,"off":true},"v13":{"price":17,"off":true},"p1":{"price":15.5,"off":false},"p2":{"price":12,"off":false},"p3":{"price":23.5,"off":false},"p4":{"price":26,"off":false},"p5":{"price":13,"off":false},"p6":{"price":6,"off":false},"p7":{"price":19.5,"off":false},"p8":{"price":19.5,"off":false},"p9":{"price":18.5,"off":false},"t1":{"price":38,"off":true},"t2":{"price":38.5,"off":true},"t3":{"price":6,"off":true},"t4":{"price":11.5,"off":true},"t5":{"price":15,"off":true},"t6":{"price":12,"off":true},"t7":{"price":23,"off":true},"t8":{"price":10,"off":true},"a1":{"price":1.5,"off":false},"a2":{"price":4.5,"off":false},"a3":{"price":14,"off":false},"a4":{"price":13,"off":false},"a5":{"price":5,"off":false},"d1":{"price":22,"off":true},"d2":{"price":4.5,"off":true},"d3":{"price":14,"off":true},"d4":{"price":135.5,"off":true},"d5":{"price":39,"off":true},"j1":{"price":29.5,"off":false},"j2":{"price":80.5,"off":true},"j3":{"price":32,"off":false},"j4":{"price":35.5,"off":false},"j5":{"price":19.5,"off":false}}'::jsonb, true),
  ('Бригада Странджа', 'Петко Янев', '+359 878 902 615', 'strandzha.brigada@gmail.com', 'София', array['de','pl','tf','jo']::text[], '{"el1":{"price":6,"off":true},"el2":{"price":22.5,"off":true},"el3":{"price":7.5,"off":true},"el4":{"price":19,"off":true},"el5":{"price":176.5,"off":true},"el6":{"price":5.5,"off":true},"el7":{"price":24.5,"off":true},"v1":{"price":83,"off":true},"v2":{"price":76,"off":true},"v3":{"price":146,"off":true},"v4":{"price":28,"off":true},"v5":{"price":74.5,"off":true},"v6":{"price":68.5,"off":true},"v7":{"price":28,"off":true},"v8":{"price":83,"off":true},"v9":{"price":240,"off":true},"v10":{"price":128,"off":true},"v11":{"price":58.5,"off":true},"v12":{"price":114.5,"off":true},"v13":{"price":14,"off":true},"p1":{"price":12.5,"off":false},"p2":{"price":10,"off":false},"p3":{"price":19.5,"off":false},"p4":{"price":21,"off":false},"p5":{"price":10.5,"off":false},"p6":{"price":5,"off":false},"p7":{"price":15.5,"off":false},"p8":{"price":16,"off":false},"p9":{"price":15,"off":false},"t1":{"price":38,"off":false},"t2":{"price":31,"off":false},"t3":{"price":5,"off":false},"t4":{"price":9.5,"off":false},"t5":{"price":12,"off":false},"t6":{"price":9.5,"off":false},"t7":{"price":19,"off":false},"t8":{"price":8,"off":false},"a1":{"price":1.5,"off":true},"a2":{"price":4.5,"off":true},"a3":{"price":11.5,"off":true},"a4":{"price":10.5,"off":true},"a5":{"price":4,"off":true},"d1":{"price":18,"off":false},"d2":{"price":3.5,"off":false},"d3":{"price":11.5,"off":false},"d4":{"price":110.5,"off":false},"d5":{"price":32,"off":false},"j1":{"price":24,"off":false},"j2":{"price":65.5,"off":false},"j3":{"price":26,"off":false},"j4":{"price":29,"off":false},"j5":{"price":16,"off":false}}'::jsonb, true)
) as v(name, person, phone, email, city, trades, prices, is_demo)
where not exists (select 1 from public.contractors where is_demo);
