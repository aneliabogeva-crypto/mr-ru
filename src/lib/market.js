import { SERVICES, priceOf } from "../data/catalog.js";
import { REFERENCE_POINTS, quantile } from "../data/marketReference.js";

/** Референтната (софийска) цена тежи колкото толкова майстори. */
export const REFERENCE_WEIGHT = 3;

/** В пазарната цена влизат истински майстори от София (без демо профилите). */
export const countsForMarket = (c) => !c.demo && (!c.city || /соф|sof/i.test(c.city));

/**
 * Пазарна цена по услуга за София.
 *
 * Вземат се цените на истинските майстори от София, които предлагат
 * услугата, и референтната цена от проучването, преброена REFERENCE_WEIGHT
 * пъти. Така няколко профила с ниски или стари цени не могат да свалят
 * оценката, а при много майстори решават техните цени.
 * Пазарната цена е МЕДИАНАТА: средната по ред стойност, а не средно
 * аритметично. Типичният диапазон е от 25-ия до 75-ия перцентил на
 * публикуваните цени и цените на майсторите (без крайностите).
 *
 * Връща { avg, min, max, n }: avg = медиана, min/max = типичен диапазон,
 * n = брой майстори с цена.
 */
export function computeMarket(contractors) {
  const counted = contractors.filter(countsForMarket);
  const market = {};
  for (const svc of SERVICES) {
    const offered = counted
      .map((c) => priceOf(c, svc.id))
      .filter((p) => !p.off && p.price > 0)
      .map((p) => Number(p.price));
    const weighted = [...offered, ...Array(REFERENCE_WEIGHT).fill(svc.base)];
    const points = (REFERENCE_POINTS[svc.id] || []).map((x) => x.value);
    const ref = points.length ? points : [svc.base];
    const spread = [...offered, ...Array(REFERENCE_WEIGHT).fill(ref).flat()];
    const avg = quantile(weighted, 0.5);
    market[svc.id] = {
      avg,
      min: Math.min(avg, quantile(spread, 0.25)),
      max: Math.max(avg, quantile(spread, 0.75)),
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
