-- Заявки за абонамент и еднократни планове.
-- Пуска се веднъж в Supabase → SQL Editor. Може да се пусне повторно.
-- Всеки може да изпрати заявка; само собственикът на проекта ги вижда (Table Editor).

create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('project', 'home', 'pro', 'business')),
  audience text not null check (audience in ('client', 'pro')),
  billing text not null default 'monthly' check (billing in ('once', 'monthly', 'yearly')),
  name text not null check (length(name) between 1 and 120),
  email text not null default '' check (length(email) <= 200),
  phone text not null default '' check (length(phone) <= 40),
  note text not null default '' check (length(note) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'active', 'declined')),
  created_at timestamptz not null default now(),
  constraint plan_requests_contact check (length(email) > 3 or length(phone) > 5)
);

alter table public.plan_requests enable row level security;

drop policy if exists "anyone can request a plan" on public.plan_requests;
create policy "anyone can request a plan" on public.plan_requests
  for insert to anon, authenticated
  with check (status = 'new');

grant insert on public.plan_requests to anon, authenticated;
