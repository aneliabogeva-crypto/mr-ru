-- „Обръщане около прозорци и врати“ (j5) е шпакловъчна работа.
-- Включва я в ценоразписа на всички майстори със специалност „Мазилки и шпакловки“ (pl),
-- които досега я имат като „Не се предлага“. Цената им се запазва (или 18 € / л.м., ако няма).
-- Пуска се веднъж в Supabase → SQL Editor. Може да се пусне повторно.
update public.contractors
set prices = jsonb_set(
  prices, '{j5}',
  jsonb_build_object('price', coalesce((prices -> 'j5' ->> 'price')::numeric, 18), 'off', false)
)
where 'pl' = any (trades)
  and coalesce((prices -> 'j5' ->> 'off')::boolean, true);
