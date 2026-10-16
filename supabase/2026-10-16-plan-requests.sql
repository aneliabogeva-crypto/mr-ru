-- Заявки за абонамент и еднократни планове, с начин на плащане.
-- Пуска се веднъж в Supabase → SQL Editor. Може да се пусне повторно.
-- Всеки може да изпрати заявка; само собственикът на проекта ги вижда (Table Editor),
-- а функцията easypay (supabase/functions/easypay) ги обновява със служебния ключ.

create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('project', 'home', 'pro', 'business')),
  audience text not null check (audience in ('client', 'pro')),
  billing text not null default 'monthly' check (billing in ('once', 'monthly', 'yearly')),
  name text not null check (length(name) between 1 and 120),
  email text not null default '' check (length(email) <= 200),
  phone text not null default '' check (length(phone) <= 40),
  note text not null default '' check (length(note) <= 1000),
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint plan_requests_contact check (length(email) > 3 or length(phone) > 5)
);

-- Плащане: начин, основание за превода, сума, номер на фактура за ePay, код EasyPay.
alter table public.plan_requests add column if not exists payment_method text not null default 'none';
alter table public.plan_requests add column if not exists reference text;
alter table public.plan_requests add column if not exists amount numeric(10, 2);
alter table public.plan_requests add column if not exists invoice bigint generated always as identity;
alter table public.plan_requests add column if not exists epay_idn text;
alter table public.plan_requests add column if not exists paid_at timestamptz;

create unique index if not exists plan_requests_reference_key on public.plan_requests (reference);
create unique index if not exists plan_requests_invoice_key on public.plan_requests (invoice);

alter table public.plan_requests drop constraint if exists plan_requests_status_check;
alter table public.plan_requests add constraint plan_requests_status_check
  check (status in ('new', 'awaiting_payment', 'paid', 'denied', 'expired', 'contacted', 'active', 'declined'));
alter table public.plan_requests drop constraint if exists plan_requests_payment_method_check;
alter table public.plan_requests add constraint plan_requests_payment_method_check
  check (payment_method in ('none', 'card', 'revolut', 'bank', 'easypay'));
alter table public.plan_requests drop constraint if exists plan_requests_reference_check;
alter table public.plan_requests add constraint plan_requests_reference_check
  check (reference is null or reference ~ '^MR-[A-Z0-9]{6}$');

alter table public.plan_requests enable row level security;

-- Посетителите само добавят нови заявки; не могат да четат чужди и да маркират „платено“.
drop policy if exists "anyone can request a plan" on public.plan_requests;
create policy "anyone can request a plan" on public.plan_requests
  for insert to anon, authenticated
  with check (status = 'new' and epay_idn is null and paid_at is null);

grant insert on public.plan_requests to anon, authenticated;
