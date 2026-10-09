import { SERVICES, priceOf } from "../data/catalog.js";
import { quantile } from "../data/marketReference.js";

/**
 * Пазарна цена по услуга.
 *
 * Вземат се цените на всички майстори, които предлагат услугата, плюс
 * референтната цена от проучването (тя пази оценката, докато майсторите са
 * малко). Пазарната цена е МЕДИАНАТА им: средната по ред стойност, а не
 * средно аритметично, затова една много ниска или висока цена не я мести.
 * Типичният диапазон е от 25-ия до 75-ия перцентил (без крайностите).
 *
 * Връща { avg, min, max, n }: avg = медиана, min/max = типичен диапазон,
 * n = брой майстори с цена.
 */
export function computeMarket(contractors) {
  const market = {};
  for (const svc of SERVICES) {
    const offered = contractors
      .map((c) => priceOf(c, svc.id))
      .filter((p) => !p.off && p.price > 0)
      .map((p) => Number(p.price));
    const values = [...offered, svc.base];
    market[svc.id] = {
      avg: quantile(values, 0.5),
      min: quantile(values, 0.25),
      max: quantile(values, 0.75),
      n: offered.length,
    };
  }
  return market;
}

/** Оценка за избраните количества: пазарна сума и типичен диапазон. */
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
    const p = priceOf(contractor, sid);
    if (p.off) negotiable.push(sid);
    else {
      offered += 1;
      total += p.price * q;
    }
  }
  return { total, offered, negotiable };
}
