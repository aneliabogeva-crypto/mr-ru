import { SERVICES } from "../data/catalog.js";

/**
 * Пазарна статистика по услуга от ценоразписите на майсторите.
 * Взимат се само майсторите, които предлагат услугата с цена > 0.
 * Ако никой не я предлага, връща базовата цена от каталога и n = 0.
 */
export function computeMarket(contractors) {
  const market = {};
  for (const svc of SERVICES) {
    const prices = contractors
      .map((c) => c.prices[svc.id])
      .filter((p) => p && !p.off && p.price > 0)
      .map((p) => p.price);
    market[svc.id] = prices.length
      ? {
          avg: prices.reduce((a, b) => a + b, 0) / prices.length,
          min: Math.min(...prices),
          max: Math.max(...prices),
          n: prices.length,
        }
      : { avg: svc.base, min: svc.base, max: svc.base, n: 0 };
  }
  return market;
}

/** Оценка за избраните количества: средна, минимална и максимална сума. */
export function estimate(qty, market) {
  return Object.entries(qty).reduce(
    (acc, [sid, q]) => {
      const m = market[sid];
      if (!m || !(q > 0)) return acc;
      return { avg: acc.avg + q * m.avg, min: acc.min + q * m.min, max: acc.max + q * m.max };
    },
    { avg: 0, min: 0, max: 0 },
  );
}

/** Колко струва избраното при конкретен майстор и кои услуги са по договаряне. */
export function contractorQuote(contractor, qty) {
  let total = 0;
  let offered = 0;
  const negotiable = [];
  for (const [sid, q] of Object.entries(qty)) {
    if (!(q > 0)) continue;
    const p = contractor.prices[sid];
    if (!p || p.off) negotiable.push(sid);
    else {
      offered += 1;
      total += p.price * q;
    }
  }
  return { total, offered, negotiable };
}
