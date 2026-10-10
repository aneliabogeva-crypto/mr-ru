// Интелигентен асистент „Спалня“: от сегашното състояние предлага дейности,
// а клиентът маха тези, които ще направи сам. После намира майстори от същия
// град, които извършват всички избрани дейности, и смята оферта по техните цени.
import { SERVICE_BY_ID, priceOf } from "../../data/catalog.js";
import { sameCity } from "../cities.js";
import { REVEAL_PER_WINDOW, WINDOW, dryGeometry } from "../rooms/dryRoom.js";

/** Сегашно състояние на стените и тавана. */
export const SURFACES = ["wallpaper", "oldPaint", "bare", "cracked"];
/** Сегашна настилка. */
export const FLOORS_NOW = ["laminate", "parquet", "carpet", "linoleum", "screed"];
/** Желан нов под. */
export const FLOORS_NEW = ["laminate", "tiles", "sand", "keep"];

export const ASSISTANT_DEFAULT = {
  city: "",
  l: 4,
  w: 3.5,
  h: 2.6,
  doors: 1,
  windows: 1,
  surface: "oldPaint",
  floorNow: "laminate",
  floorNew: "laminate",
  overrides: {}, // { sid: { on?: boolean, qty?: number } }
};

/** Кои нови подове имат смисъл при сегашния под. */
export const floorsNewFor = (floorNow) => FLOORS_NEW.filter((f) => f !== "sand" || floorNow === "parquet");

const r2 = (x) => Math.round(x * 100) / 100;
const REMOVABLE = ["laminate", "carpet", "linoleum"];

/**
 * Предложени дейности: [{ sid, qty, group, on }].
 * group: "walls" (стени и таван) | "floor" | "extra" (по желание).
 * on: дали системата я отмята по подразбиране.
 */
export function suggestActivities(cfg) {
  const g = dryGeometry(cfg);
  const W = g.walls;
  const C = g.ceiling;
  const out = [];
  const add = (group, sid, qty, on = true) => qty > 0 && out.push({ group, sid, qty: r2(qty), on });

  // Стени и таван
  if (cfg.surface === "wallpaper") add("walls", "a6", W);
  if (cfg.surface === "oldPaint") add("walls", "a7", W + C, false);
  if (cfg.surface === "bare") add("walls", "p1", W + C);
  if (cfg.surface === "cracked") add("walls", "p1", W);
  add("walls", "a1", W + C);
  add("walls", "p2", W + C);
  add("walls", "a2", W);
  add("walls", "a5", C);

  // Под
  const newFloor = cfg.floorNew;
  if (newFloor !== "keep") {
    if (REMOVABLE.includes(cfg.floorNow) && newFloor !== "sand") add("floor", "d2", g.floor);
    if (newFloor === "sand") add("floor", "t11", g.floor);
    else {
      add("floor", "t5", g.floor, cfg.floorNow === "screed");
      add("floor", newFloor === "tiles" ? "t1" : "t3", g.floor);
      add("floor", "t4", g.skirting);
    }
  }

  // Допълнително, по желание
  add("extra", "el3", 3, false);
  add("extra", "el2", 2, false);
  add("extra", "el4", 1, false);
  add("extra", "j1", 1, false);
  if (g.windows) {
    add("extra", "j5", g.windows * REVEAL_PER_WINDOW, false);
    add("extra", "j4", g.windows * WINDOW.w, false);
  }
  return out;
}

/** Предложенията с промените на клиента (отметки и количества). */
export function activities(cfg) {
  const ov = cfg.overrides || {};
  return suggestActivities(cfg).map((a) => {
    const o = ov[a.sid] || {};
    const qty = o.qty !== undefined && Number(o.qty) >= 0 ? Number(o.qty) : a.qty;
    return { ...a, suggestedOn: a.on, suggestedQty: a.qty, qty, on: o.on !== undefined ? o.on : a.on };
  });
}

/** Избраните дейности като { sid: количество }. */
export const selectedQty = (list) => Object.fromEntries(list.filter((a) => a.on && a.qty > 0).map((a) => [a.sid, a.qty]));

/**
 * Майстори за избраните дейности.
 * full – от същия град и извършват всички дейности; partial – от същия град,
 * извършват част от тях. Всеки с оферта по собствените му цени.
 */
export function matchContractors(contractors, cfg, qty) {
  const sids = Object.keys(qty);
  const local = contractors.filter((c) => sameCity(c.city, cfg.city));
  const rows = local.map((c) => {
    const lines = sids.map((sid) => {
      const p = priceOf(c, sid);
      return { sid, qty: qty[sid], price: p.off ? null : Number(p.price), sum: p.off ? 0 : Number(p.price) * qty[sid] };
    });
    const missing = lines.filter((l) => l.price === null).map((l) => l.sid);
    return { contractor: c, lines, total: lines.reduce((a, l) => a + l.sum, 0), missing, covered: sids.length - missing.length };
  });
  const byPrice = (a, b) => a.contractor.demo - b.contractor.demo || a.total - b.total;
  return {
    full: rows.filter((r) => sids.length && r.missing.length === 0).sort(byPrice),
    partial: rows.filter((r) => r.missing.length > 0 && r.covered > 0).sort((a, b) => b.covered - a.covered || byPrice(a, b)),
    localCount: local.length,
  };
}

export const serviceExists = (sid) => !!SERVICE_BY_ID[sid];
