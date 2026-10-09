// Модел „Баня“: от размерите и избраните опции изчислява количествата
// по услуги от каталога (с отделните цени за баня: плочки t9/t10, таван p10). Използва се като шаблон за другите помещения.

/** Стандартна врата 80 × 200 см. */
export const DOOR = { w: 0.8, h: 2.0 };
/** Височина на плочките при „до средата“. */
export const HALF_TILE_HEIGHT = 1.5;
/** Хидроизолация в зоната на душа: две стени 90 см × 2 м; при вана – 1,5 м². */
export const WET_ZONE = { shower: 3.6, bathtub: 1.5 };
/** Хидроизолацията на пода се обръща 20 см нагоре по стените. */
export const WATERPROOF_UPSTAND = 0.2;

export const BATH_DEFAULT = {
  l: 2.5,
  w: 2.0,
  h: 2.5,
  prep: "demolish", // demolish | none
  removeSanitary: true,
  ceiling: "drywall", // none | paint | drywall | pvc
  walls: "full", // none | paint | half | full
  wallLevel: false,
  wetZone: true,
  largeTiles: false,
  floor: "tiles", // none | tiles
  floorScreed: true,
  floorWaterproof: true,
  plumbing: "new", // keep | new
  toilet: "wall", // none | floor | wall
  sink: true,
  bath: "shower", // none | shower | bathtub | bathtub_screen
  concealedMixer: false,
  boiler: true,
  washer: true,
  accessories: 3,
  lights: 2,
  sockets: 2,
  fan: true,
  door: false,
};

/** Граници за размерите в метри. */
export const LIMITS = { l: [0.8, 8], w: [0.8, 8], h: [2, 4] };

const r2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, [lo, hi]) => Math.min(hi, Math.max(lo, Number(x) || lo));

export function geometry(cfg) {
  const l = clamp(cfg.l, LIMITS.l);
  const w = clamp(cfg.w, LIMITS.w);
  const h = clamp(cfg.h, LIMITS.h);
  const floor = l * w;
  const perimeter = 2 * (l + w);
  const door = DOOR.w * Math.min(DOOR.h, h);
  const walls = Math.max(0, perimeter * h - door);
  const halfTiles = Math.max(0, perimeter * HALF_TILE_HEIGHT - DOOR.w * HALF_TILE_HEIGHT);
  return { l, w, h, floor: r2(floor), perimeter: r2(perimeter), walls: r2(walls), ceiling: r2(floor), halfTiles: r2(halfTiles) };
}

/** Брой ВиК точки: всеки уред, който има нужда от вода и канал. */
export function plumbingPoints(cfg) {
  return (cfg.toilet !== "none") + !!cfg.sink + (cfg.bath !== "none") + !!cfg.washer + !!cfg.boiler;
}

/**
 * Редове на офертата: [{ section, sid, qty }].
 * Секции: prep, ceiling, walls, floor, plumbing, electrical, door.
 */
export function bathroomLines(cfg) {
  const g = geometry(cfg);
  const out = [];
  const add = (section, sid, qty) => {
    if (qty > 0) out.push({ section, sid, qty: r2(qty) });
  };

  // Подготовка
  if (cfg.prep === "demolish") {
    add("prep", "d1", g.floor + g.walls);
    if (cfg.removeSanitary) add("prep", "v12", 1);
  }

  // Таван
  if (cfg.ceiling === "paint") {
    add("ceiling", "p2", g.ceiling);
    add("ceiling", "a1", g.ceiling);
    add("ceiling", "a5", g.ceiling);
  } else if (cfg.ceiling === "drywall") {
    add("ceiling", "p10", g.ceiling);
  } else if (cfg.ceiling === "pvc") {
    add("ceiling", "p8", g.ceiling);
  }

  // Стени
  const tiledWalls = cfg.walls === "full" ? g.walls : cfg.walls === "half" ? g.halfTiles : 0;
  const paintedWalls = cfg.walls === "paint" ? g.walls : cfg.walls === "half" ? Math.max(0, g.walls - g.halfTiles) : 0;
  if (tiledWalls > 0) {
    if (cfg.wallLevel) add("walls", "p9", tiledWalls);
    if (cfg.wetZone && cfg.bath !== "none") add("walls", "p7", cfg.bath === "shower" ? WET_ZONE.shower : WET_ZONE.bathtub);
    add("walls", "t10", tiledWalls);
    if (cfg.largeTiles) add("walls", "t8", tiledWalls);
  }
  if (paintedWalls > 0) {
    add("walls", "p2", paintedWalls);
    add("walls", "a1", paintedWalls);
    add("walls", "a2", paintedWalls);
  }

  // Под
  if (cfg.floor === "tiles") {
    if (cfg.floorScreed) add("floor", "t7", g.floor);
    if (cfg.floorWaterproof) add("floor", "p7", g.floor + g.perimeter * WATERPROOF_UPSTAND);
    add("floor", "t9", g.floor);
    if (cfg.largeTiles) add("floor", "t8", g.floor);
  }

  // ВиК и санитария
  if (cfg.plumbing === "new") add("plumbing", "v1", plumbingPoints(cfg));
  if (cfg.toilet === "wall") add("plumbing", "v3", 1);
  if (cfg.toilet === "floor") add("plumbing", "v2", 1);
  if (cfg.sink) {
    add("plumbing", "v6", 1);
    add("plumbing", "v4", 1);
  }
  if (cfg.bath === "shower") {
    add("plumbing", "v8", 1);
    add("plumbing", "v10", 1);
  }
  if (cfg.bath === "bathtub" || cfg.bath === "bathtub_screen") add("plumbing", "v9", 1);
  if (cfg.bath === "bathtub_screen") add("plumbing", "v10", 1);
  if (cfg.bath !== "none") add("plumbing", cfg.bath === "shower" && cfg.concealedMixer ? "v14" : "v11", 1);
  if (cfg.boiler) add("plumbing", "v5", 1);
  add("plumbing", "v13", Number(cfg.accessories) || 0);

  // Електро
  add("electrical", "el2", Number(cfg.sockets) || 0);
  add("electrical", "el4", Number(cfg.lights) || 0);
  if (cfg.fan) add("electrical", "el7", 1);

  // Врата
  if (cfg.door) add("door", "j1", 1);

  return out;
}

/** Обединява редовете в { sid: количество } за калкулатора и запитването. */
export function linesToQty(lines) {
  const qty = {};
  for (const l of lines) qty[l.sid] = r2((qty[l.sid] || 0) + l.qty);
  return qty;
}
