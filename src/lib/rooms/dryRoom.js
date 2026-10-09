// Модел за „сухи“ помещения: спалня, хол, коридор и кухня.
// От размерите и опциите изчислява количествата по услуги от каталога.

/** Отвор на врата 90 × 200 см и прозорец 140 × 140 см. */
export const DOOR_AREA = 0.9 * 2.0;
export const DOOR_WIDTH = 0.9;
export const WINDOW = { w: 1.4, h: 1.4 };
export const WINDOW_AREA = WINDOW.w * WINDOW.h;
/** Обръщане около прозорец: две страни и горе. */
export const REVEAL_PER_WINDOW = WINDOW.w + 2 * WINDOW.h;
/** Кабел и канал на ел. точка при нова инсталация. */
export const CABLE_PER_POINT = 5;

export const LIMITS = { l: [1, 12], w: [1, 12], h: [2.2, 4] };

const r2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, [lo, hi]) => Math.min(hi, Math.max(lo, Number(x) || lo));
const n = (x) => Math.max(0, Number(x) || 0);

export function dryGeometry(cfg) {
  const l = clamp(cfg.l, LIMITS.l);
  const w = clamp(cfg.w, LIMITS.w);
  const h = clamp(cfg.h, LIMITS.h);
  const doors = n(cfg.doors);
  const windows = n(cfg.windows);
  const floor = l * w;
  const perimeter = 2 * (l + w);
  const walls = Math.max(0, perimeter * h - doors * DOOR_AREA - windows * WINDOW_AREA - n(cfg.backsplash === "tiles" ? cfg.backsplashArea : 0));
  const skirting = Math.max(0, perimeter - doors * DOOR_WIDTH);
  return { l, w, h, floor: r2(floor), perimeter: r2(perimeter), walls: r2(walls), ceiling: r2(floor), skirting: r2(skirting), doors, windows };
}

/** ВиК точки в кухнята: мивка, съдомиялна, пералня. */
export const kitchenPoints = (cfg) => !!cfg.sink + !!cfg.dishwasher + !!cfg.washer;

/** Редове: [{ section, sid, qty }]. */
export function dryRoomLines(cfg) {
  const g = dryGeometry(cfg);
  const out = [];
  const add = (section, sid, qty) => {
    if (qty > 0) out.push({ section, sid, qty: r2(qty) });
  };

  // Подготовка
  if (cfg.removeFloor) add("prep", "d2", g.floor);
  if (cfg.removeWallpaper) add("prep", "a6", g.walls);
  if (cfg.scrapePaint) add("prep", "a7", g.walls + g.ceiling);

  // Таван
  if (cfg.ceiling === "paint") {
    add("ceiling", "p2", g.ceiling);
    add("ceiling", "a1", g.ceiling);
    add("ceiling", "a5", g.ceiling);
  } else if (cfg.ceiling === "drywall") {
    add("ceiling", "p4", g.ceiling);
    add("ceiling", "p2", g.ceiling);
    add("ceiling", "a1", g.ceiling);
    add("ceiling", "a5", g.ceiling);
  }

  // Стени
  if (cfg.walls !== "none") {
    if (cfg.wallPlaster) add("walls", "p1", g.walls);
    add("walls", "p2", g.walls);
    add("walls", "a1", g.walls);
    add("walls", cfg.walls === "wallpaper" ? "a4" : cfg.walls === "decor" ? "a3" : "a2", g.walls);
  }

  // Гръб в кухнята
  if (cfg.backsplash === "tiles") add("backsplash", "t2", n(cfg.backsplashArea));

  // Под
  if (cfg.floor !== "none") {
    if (cfg.selfLevel && cfg.floor !== "parquet") add("floor", "t5", g.floor);
    if (cfg.floor === "laminate") add("floor", "t3", g.floor);
    if (cfg.floor === "tiles") add("floor", "t1", g.floor);
    if (cfg.floor === "parquet") add("floor", "t11", g.floor);
    if (cfg.floor !== "parquet") add("floor", "t4", g.skirting);
  }

  // ВиК (кухня)
  if (cfg.plumbing === "new") add("plumbing", "v1", kitchenPoints(cfg));
  if (cfg.sink) {
    add("plumbing", "v6", 1);
    add("plumbing", "v4", 1);
  }

  // Електро
  const points = n(cfg.sockets) + n(cfg.lights) + n(cfg.appliances);
  if (cfg.rewire) {
    add("electrical", "el1", points * CABLE_PER_POINT);
    add("electrical", "el6", points * CABLE_PER_POINT);
  }
  add("electrical", "el2", n(cfg.sockets));
  add("electrical", "el3", n(cfg.replaceSockets));
  add("electrical", "el4", n(cfg.lights));
  add("electrical", "el8", n(cfg.appliances));

  // Врати и прозорци
  add("openings", "j1", n(cfg.newDoors));
  if (cfg.entranceDoor) add("openings", "j2", 1);
  if (cfg.newWindows) add("openings", "j3", g.windows * WINDOW_AREA);
  if (cfg.reveals) add("openings", "j5", g.windows * REVEAL_PER_WINDOW);
  if (cfg.sills) add("openings", "j4", g.windows * WINDOW.w);

  return out;
}

const BASE = {
  h: 2.6,
  doors: 1,
  windows: 1,
  removeFloor: true,
  removeWallpaper: false,
  scrapePaint: false,
  ceiling: "paint", // none | paint | drywall
  walls: "paint", // none | paint | wallpaper | decor
  wallPlaster: false,
  floor: "laminate", // none | laminate | tiles | parquet
  selfLevel: false,
  rewire: false,
  sockets: 4,
  replaceSockets: 2,
  lights: 1,
  appliances: 0,
  newDoors: 1,
  entranceDoor: false,
  newWindows: false,
  reveals: false,
  sills: false,
};

export const BEDROOM_DEFAULT = { ...BASE, l: 4, w: 3.5 };
export const LIVING_DEFAULT = { ...BASE, l: 5, w: 4, windows: 2, ceiling: "drywall", sockets: 6, replaceSockets: 3, lights: 4 };
export const HALL_DEFAULT = { ...BASE, l: 4, w: 1.6, doors: 4, windows: 0, floor: "tiles", sockets: 2, lights: 2, newDoors: 0 };
export const KITCHEN_DEFAULT = {
  ...BASE,
  l: 3.5,
  w: 3,
  floor: "tiles",
  backsplash: "tiles", // none | tiles
  backsplashArea: 3,
  plumbing: "new", // keep | new
  sink: true,
  dishwasher: true,
  washer: false,
  appliances: 3,
  sockets: 6,
  lights: 2,
  newDoors: 0,
};
