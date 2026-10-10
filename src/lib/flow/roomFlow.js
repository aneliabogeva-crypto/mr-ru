// Поток на калкулатора за всички помещения:
//   вход (град, размери, прозорци и врати, сегашно състояние, режим „Обръщане“)
//   → логика (състояние → нужни услуги, площи според режима)
//   → резултат (пазарна цена, услуги с количества, майстори от същия град).
import { priceOf } from "../../data/catalog.js";
import { sameCity } from "../cities.js";

export const ROOM_IDS = ["bath", "kitchen", "bedroom", "living", "hall"];

/** Видове отвори. Размерите се въвеждат в сантиметри. */
export const OPENING_KINDS = ["window", "door", "balcony"];
export const OPENING_PRESET = {
  window: { w: 140, h: 140 },
  door: { w: 90, h: 200 },
  balcony: { w: 80, h: 220 },
};

/**
 * Режим „Обръщане“ за прозорците и вратите.
 * A – площта им се приспада от стените и се добавят линейни метри обръщане;
 * B – площта им остава към стените, 0 линейни метра обръщане.
 */
export const REVEAL_MODES = ["A", "B"];

/** Сегашно състояние. */
export const CEILING_NOW = ["good", "oldPaint", "peeling", "cracked", "bare"];
export const WALLS_NOW = ["good", "oldPaint", "peeling", "wallpaper", "cracked", "bare", "tiles"];
export const FLOOR_NOW = ["laminate", "parquet", "tiles", "carpet", "linoleum", "screed"];
/** Желан резултат. */
export const FLOOR_NEW = ["laminate", "tiles", "sand", "keep"];
export const WALLS_NEW = ["paint", "tiles"];

/** Перваз/цокъл не се лепи под вратите. */
const DOOR_KINDS = ["door", "balcony"];
/** Хидроизолация в зоната на душа (баня). */
export const WET_ZONE = 3.6;
/** Хидроизолацията на пода в баня се обръща 20 см по стените. */
export const WATERPROOF_UPSTAND = 0.2;
/** При въведена квадратура периметърът се приема за правоъгълник 1 : 1,4. */
export const PERIMETER_PER_SQRT_AREA = 4.06;

export const LIMITS = { l: [0.8, 15], w: [0.8, 15], area: [1, 150], h: [2, 4.5], ow: [30, 400], oh: [30, 300], n: [0, 10] };

let seq = 0;
export const newOpening = (kind) => ({ id: `${kind}-${Date.now().toString(36)}-${seq++}`, kind, ...OPENING_PRESET[kind], n: 1 });

const op = (kind, n = 1, size = OPENING_PRESET[kind]) => ({ id: `${kind}0`, kind, w: size.w, h: size.h, n });

const BASE = {
  dimMode: "lw", // lw – дължина × ширина | area – квадратура
  h: 2.6,
  revealMode: "A",
  ceilingNow: "oldPaint",
  wallsNow: "oldPaint",
  wallsNew: "paint",
  floorNow: "laminate",
  floorNew: "laminate",
  overrides: {}, // { sid: { on?: boolean, qty?: number } }
};

/** Начални стойности на празна стая от всеки вид. */
export const FLOW_DEFAULTS = {
  bath: { ...BASE, l: 2.5, w: 2, area: 5, h: 2.5, openings: [op("door", 1, { w: 80, h: 200 })], wallsNow: "tiles", wallsNew: "tiles", floorNow: "tiles", floorNew: "tiles" },
  kitchen: { ...BASE, l: 3.5, w: 3, area: 10.5, openings: [op("door"), op("window")], floorNow: "tiles", floorNew: "tiles" },
  bedroom: { ...BASE, l: 4, w: 3.5, area: 14, openings: [op("door"), op("window")] },
  living: { ...BASE, l: 5, w: 4, area: 20, openings: [op("door"), op("window"), op("balcony")] },
  hall: { ...BASE, l: 4, w: 1.6, area: 6.4, openings: [op("door", 4)], floorNow: "tiles", floorNew: "tiles" },
};

/** Стени от плочки има смисъл да се избират само в банята. */
export const wallsNewFor = (room) => (room === "bath" ? WALLS_NEW : ["paint"]);
/** Циклене има смисъл само при естествен паркет. */
export const floorsNewFor = (floorNow) => FLOOR_NEW.filter((f) => f !== "sand" || floorNow === "parquet");

const r2 = (x) => Math.round(x * 100) / 100;
const num = (x) => Number(String(x ?? "").replace(",", "."));
const clamp = (x, [lo, hi]) => {
  const v = num(x);
  return Number.isFinite(v) && v > 0 ? Math.min(hi, Math.max(lo, v)) : lo;
};
const count = (x) => Math.min(LIMITS.n[1], Math.max(0, Math.round(num(x)) || 0));

/** Отворите в метри: [{ kind, w, h, n, area, reveal }]. */
export function openingsM(cfg, roomH) {
  return (cfg.openings || []).map((o) => {
    const w = clamp(o.w, LIMITS.ow) / 100;
    const h = Math.min(clamp(o.h, LIMITS.oh) / 100, roomH);
    const n = count(o.n);
    // Обръщане: двете страни и горе (долу е подпрозоречната дъска или прагът).
    return { id: o.id, kind: o.kind, w, h, n, area: r2(n * w * h), reveal: r2(n * (w + 2 * h)) };
  });
}

/**
 * Геометрия на стаята според режима „Обръщане“.
 * Режим A: стени = периметър × височина − Σ отвори; обръщане = Σ (ширина + 2 × височина).
 * Режим B: стени = периметър × височина; обръщане = 0.
 */
export function flowGeometry(cfg) {
  const h = clamp(cfg.h, LIMITS.h);
  let l;
  let w;
  let floor;
  let perimeter;
  let approx = false;
  if (cfg.dimMode === "area") {
    floor = clamp(cfg.area, LIMITS.area);
    perimeter = PERIMETER_PER_SQRT_AREA * Math.sqrt(floor);
    approx = true;
  } else {
    l = clamp(cfg.l, LIMITS.l);
    w = clamp(cfg.w, LIMITS.w);
    floor = l * w;
    perimeter = 2 * (l + w);
  }
  const ops = openingsM(cfg, h);
  const gross = perimeter * h;
  const openingsArea = ops.reduce((s, o) => s + o.area, 0);
  const modeA = cfg.revealMode !== "B";
  const walls = modeA ? Math.max(0, gross - openingsArea) : gross;
  const reveals = modeA ? ops.reduce((s, o) => s + o.reveal, 0) : 0;
  const doorWidth = ops.filter((o) => DOOR_KINDS.includes(o.kind)).reduce((s, o) => s + o.n * o.w, 0);
  const windowWidth = ops.filter((o) => o.kind === "window").reduce((s, o) => s + o.n * o.w, 0);
  const doorCount = ops.filter((o) => o.kind === "door").reduce((s, o) => s + o.n, 0);
  return {
    l, w, h, approx,
    floor: r2(floor),
    ceiling: r2(floor),
    perimeter: r2(perimeter),
    gross: r2(gross),
    openingsArea: r2(openingsArea),
    walls: r2(walls),
    reveals: r2(reveals),
    skirting: r2(Math.max(0, perimeter - doorWidth)),
    windowWidth: r2(windowWidth),
    doorCount,
    openings: ops,
  };
}

/** Какво значи сегашното състояние за стени/таван с крайно покритие боя. */
function surfaceWork(state, area, add, group, paintSid) {
  if (area <= 0) return;
  if (state === "wallpaper") add(group, "a6", area);
  if (state === "peeling") add(group, "a7", area);
  if (state === "tiles") add(group, "d1", area);
  if (state === "cracked" || state === "bare" || state === "tiles") add(group, "p1", area);
  add(group, "a1", area);
  if (state !== "good") add(group, "p2", area);
  add(group, paintSid, area);
}

/**
 * Логика: от състоянието към нужните услуги.
 * Връща [{ group, sid, qty, on }], group: ceiling | walls | floor | openings | extra.
 * on – дали услугата влиза в цената по подразбиране.
 */
export function suggestServices(room, cfg) {
  const g = flowGeometry(cfg);
  const out = [];
  const add = (group, sid, qty, on = true) => {
    if (!(qty > 0)) return;
    const same = out.find((x) => x.group === group && x.sid === sid);
    if (same) same.qty = r2(same.qty + qty);
    else out.push({ key: `${group}:${sid}`, group, sid, qty: r2(qty), on });
  };
  const bath = room === "bath";

  // Таван
  surfaceWork(cfg.ceilingNow, g.ceiling, add, "ceiling", "a5");

  // Стени
  const wallsNew = bath ? cfg.wallsNew : "paint";
  if (wallsNew === "tiles") {
    if (cfg.wallsNow === "wallpaper") add("walls", "a6", g.walls);
    if (cfg.wallsNow === "tiles") add("walls", "d1", g.walls);
    if (["tiles", "cracked", "bare"].includes(cfg.wallsNow)) add("walls", "p9", g.walls);
    add("walls", "p7", WET_ZONE);
    add("walls", "t10", g.walls);
  } else {
    surfaceWork(cfg.wallsNow, g.walls, add, "walls", "a2");
  }

  // Под
  const fNew = cfg.floorNew === "sand" && cfg.floorNow !== "parquet" ? "laminate" : cfg.floorNew;
  if (fNew === "sand") add("floor", "t11", g.floor);
  else if (fNew !== "keep") {
    if (cfg.floorNow === "tiles") add("floor", "d1", g.floor);
    else if (cfg.floorNow !== "screed") add("floor", "d2", g.floor);
    if (fNew === "laminate") {
      add("floor", "t5", g.floor, cfg.floorNow === "tiles" || cfg.floorNow === "screed");
      add("floor", "t3", g.floor);
      add("floor", "t4", g.skirting);
    } else if (bath) {
      add("floor", "t7", g.floor);
      add("floor", "p7", g.floor + g.perimeter * WATERPROOF_UPSTAND);
      add("floor", "t9", g.floor);
    } else {
      add("floor", "t1", g.floor);
      add("floor", "t4", g.skirting);
    }
  }

  // Прозорци и врати: обръщане само в режим A
  add("openings", "j5", g.reveals);

  // Извозване, ако има къртене
  if (out.some((x) => x.sid === "d1")) add("extra", "d4", 1);

  // Допълнително, по желание
  if (bath) {
    add("extra", "p10", g.ceiling, false);
    add("extra", "v1", 4, false);
    add("extra", "el7", 1, false);
  }
  if (room === "kitchen") {
    add("extra", "t2", 3, false);
    add("extra", "v1", 2, false);
  }
  add("extra", "el3", bath ? 1 : 3, false);
  add("extra", "el2", 2, false);
  add("extra", "el4", 1, false);
  add("extra", "j1", g.doorCount, false);
  add("extra", "j4", g.windowWidth, false);
  return out;
}

/**
 * Предложенията с промените на клиента (отметки и количества).
 * Една услуга може да е в няколко групи (напр. грунд на тавана и на стените),
 * затова промените се пазят по ключ „група:услуга“.
 */
export function flowServices(room, cfg) {
  const ov = cfg.overrides || {};
  return suggestServices(room, cfg).map((a) => {
    const o = ov[a.key] || {};
    const qty = o.qty !== undefined && Number(o.qty) >= 0 ? Number(o.qty) : a.qty;
    return { ...a, suggestedOn: a.on, suggestedQty: a.qty, qty, on: o.on !== undefined ? o.on : a.on };
  });
}

/** Избраните услуги като { sid: количество }; една услуга от няколко групи се събира. */
export function selectedQty(list) {
  const qty = {};
  for (const a of list) if (a.on && a.qty > 0) qty[a.sid] = r2((qty[a.sid] || 0) + a.qty);
  return qty;
}

/** Рейтинг за подреждане: майстори без отзиви са след тези с отзиви. */
const ratingKey = (c) => (c.reviews > 0 ? c.rating : 0);

/**
 * Местни майстори (същият град) с персонализирана цена по собствените им цени.
 * full – извършват всички избрани услуги; partial – част от тях.
 * sort: "price" | "rating".
 */
export function matchContractors(contractors, city, qty, sort = "price") {
  const sids = Object.keys(qty);
  const local = contractors.filter((c) => sameCity(c.city, city));
  const rows = local.map((c) => {
    const lines = sids.map((sid) => {
      const p = priceOf(c, sid);
      return { sid, qty: qty[sid], price: p.off ? null : Number(p.price), sum: p.off ? 0 : Number(p.price) * qty[sid] };
    });
    const missing = lines.filter((l) => l.price === null).map((l) => l.sid);
    return { contractor: c, lines, total: lines.reduce((a, l) => a + l.sum, 0), missing, covered: sids.length - missing.length };
  });
  const cmp = (a, b) =>
    a.contractor.demo - b.contractor.demo ||
    (sort === "rating" ? ratingKey(b.contractor) - ratingKey(a.contractor) || a.total - b.total : a.total - b.total || ratingKey(b.contractor) - ratingKey(a.contractor));
  return {
    full: rows.filter((r) => sids.length && r.missing.length === 0).sort(cmp),
    partial: rows.filter((r) => r.missing.length > 0 && r.covered > 0).sort((a, b) => b.covered - a.covered || cmp(a, b)),
    localCount: local.length,
  };
}
