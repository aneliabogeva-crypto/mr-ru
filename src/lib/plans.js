// Планове и отстъпки. Цените са в евро с ДДС.
//
// Ориентири от пазара (октомври 2026):
//  - Checkatrade (UK): ~£50–200 на месец за майстор;
//  - Houzz Pro (DE): Starter €59, Essential €134 на месец;
//  - Bark / MyBuilder (UK): ~£7–50 за едно запитване;
//  - Budget My Reno: $12.99 еднократно или $1.99 на месец за собственик на жилище;
//  - Snaptimate: безплатни оценки, Premium $19.99 на месец.
// В България покупателната способност е по-ниска, затова цените са под западните.

/** Годишно плащане: 20 % отстъпка (близо 2,5 месеца безплатно). */
export const ANNUAL_DISCOUNT = 0.2;
/** Пробен период за майсторите. */
export const TRIAL_DAYS = 30;
/** Отстъпка „Основател“: първите 100 майстори, 50 % за 6 месеца. */
export const FOUNDER = { seats: 100, pct: 50, months: 6 };

export const AUDIENCES = ["client", "pro"];

/**
 * kind: "free" | "once" (еднократно) | "monthly".
 * features: ключове за текстове plan.<id>.f1…fN.
 */
export const PLANS = {
  client: [
    { id: "free", kind: "free", price: 0, features: 4 },
    { id: "project", kind: "once", price: 9.9, features: 5, featured: true },
    { id: "home", kind: "monthly", price: 4.9, yearly: 3.9, features: 5 },
  ],
  pro: [
    { id: "start", kind: "free", price: 0, features: 4 },
    { id: "pro", kind: "monthly", price: 19, yearly: 15, features: 6, featured: true, trial: true },
    { id: "business", kind: "monthly", price: 39, yearly: 31, features: 6 },
  ],
};

export const PLAN_BY_ID = Object.fromEntries(
  Object.entries(PLANS).flatMap(([audience, list]) => list.map((p) => [p.id, { ...p, audience }])),
);

/**
 * При годишно плащане цената на месец е закръглена (около 20 % по-ниска):
 * Дом+ 3,90 € вместо 4,90 €, Про 15 € вместо 19 €, Бизнес 31 € вместо 39 €.
 */
export const yearlyPerMonth = (plan) => plan.yearly ?? Math.round(plan.price * (1 - ANNUAL_DISCOUNT) * 10) / 10;
/** Сумата, която се плаща веднъж годишно. */
export const yearlyPrice = (plan) => Math.round(yearlyPerMonth(plan) * 12 * 100) / 100;

/** Отваря прозореца за заявка на план отвсякъде в приложението. */
export const openPlan = (plan, billing = "monthly") =>
  window.dispatchEvent(new CustomEvent("mrru:open-plan", { detail: { plan, billing } }));
