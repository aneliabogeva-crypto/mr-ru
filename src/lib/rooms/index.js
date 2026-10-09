// Описания на помещенията: модел (редове по услуги) и схема на екрана.
//
// Схема: секции с елементи. Типове елементи:
//   choice  – избор на една опция; price: "section" (сума на секцията при
//             тази опция) или "item" (разлика спрямо `none`)
//   toggle  – отметка с цена на промяната
//   counter – брой (−/+), sid показва цената за брой
//   number  – число с десетични (напр. площ на гръб)
// Подсказка (hint) е ключ от речника или [ключ, (geometry, cfg) => променливи].
import { BATH_DEFAULT, bathroomLines, geometry as bathGeometry, plumbingPoints, LIMITS as BATH_LIMITS } from "./bathroom.js";
import { BEDROOM_DEFAULT, HALL_DEFAULT, KITCHEN_DEFAULT, LIMITS as DRY_LIMITS, LIVING_DEFAULT, dryGeometry, dryRoomLines, kitchenPoints } from "./dryRoom.js";

// ─── Баня ──────────────────────────────────────────────────────────────────
const bathSchema = [
  { id: "dims", title: "bath.secDims", dims: ["l", "w", "h"], geo: "bath.geo", note: "bath.geoNote" },
  {
    id: "prep",
    title: "bath.secPrep",
    items: [
      { type: "choice", key: "prep", values: ["none", "demolish"], price: "section", prefix: "bath.prep", hints: { demolish: ["bath.prepHint", (g) => ({ m2: g.floor + g.walls })] } },
      { type: "toggle", key: "removeSanitary", label: "bath.removeSanitary", hint: "bath.removeSanitaryHint", show: (c) => c.prep === "demolish" },
    ],
  },
  {
    id: "ceiling",
    title: "bath.secCeiling",
    items: [
      { type: "choice", key: "ceiling", values: ["none", "paint", "drywall", "pvc"], price: "section", prefix: "bath.ceiling", hints: { paint: "bath.ceilingPaintHint", drywall: "bath.ceilingDrywallHint", pvc: "bath.ceilingPvcHint" } },
    ],
  },
  {
    id: "walls",
    title: "bath.secWalls",
    items: [
      { type: "choice", key: "walls", values: ["none", "paint", "half", "full"], price: "section", prefix: "bath.walls", hints: { half: ["bath.wallsHalfHint", (g) => ({ m2: g.halfTiles })], full: ["bath.wallsFullHint", (g) => ({ m2: g.walls })] } },
      { type: "group", show: (c) => c.walls === "full" || c.walls === "half", items: [
        { type: "toggle", key: "wallLevel", label: "bath.wallLevel", hint: "bath.wallLevelHint" },
        { type: "toggle", key: "wetZone", label: "bath.wetZone", hint: (c) => (c.bath === "none" ? "bath.wetZoneNone" : "bath.wetZoneHint"), disabled: (c) => c.bath === "none" },
      ] },
    ],
  },
  {
    id: "floor",
    title: "bath.secFloor",
    items: [
      { type: "choice", key: "floor", values: ["none", "tiles"], price: "section", prefix: "bath.floor", hints: { tiles: ["bath.floorTilesHint", (g) => ({ m2: g.floor })] } },
      { type: "group", show: (c) => c.floor === "tiles", items: [
        { type: "toggle", key: "floorScreed", label: "bath.floorScreed", hint: "bath.floorScreedHint" },
        { type: "toggle", key: "floorWaterproof", label: "bath.floorWaterproof", hint: "bath.floorWaterproofHint" },
      ] },
      { type: "group", show: (c) => c.floor === "tiles" || c.walls === "full" || c.walls === "half", items: [
        { type: "toggle", key: "largeTiles", label: "bath.largeTiles", hint: "bath.largeTilesHint" },
      ] },
    ],
  },
  {
    id: "plumbing",
    title: "bath.secPlumbing",
    items: [
      { type: "choice", key: "plumbing", title: "bath.plumbingInstall", values: ["keep", "new"], price: "item", none: "keep", prefix: "bath.plumbing", hints: { new: ["bath.plumbingNewHint", (g, c) => ({ n: plumbingPoints(c) })] } },
      { type: "choice", key: "toilet", title: "bath.toiletTitle", values: ["none", "floor", "wall"], price: "item", none: "none", cols: 3, prefix: "bath.toilet" },
      { type: "choice", key: "bath", title: "bath.bathTitle", values: ["none", "shower", "bathtub", "bathtub_screen"], price: "item", none: "none", prefix: "bath.bath" },
      { type: "toggle", key: "concealedMixer", label: "bath.concealedMixer", hint: "bath.concealedMixerHint", show: (c) => c.bath === "shower" },
      { type: "group", items: [
        { type: "toggle", key: "sink", label: "bath.sink" },
        { type: "toggle", key: "boiler", label: "bath.boiler" },
        { type: "toggle", key: "washer", label: "bath.washer", hint: "bath.washerHint" },
        { type: "counter", key: "accessories", label: "bath.accessories", hint: "bath.accessoriesHint", sid: "v13" },
      ] },
    ],
  },
  {
    id: "electrical",
    title: "bath.secElectrical",
    items: [
      { type: "group", flush: true, items: [
        { type: "counter", key: "lights", label: "bath.lights", sid: "el4" },
        { type: "counter", key: "sockets", label: "bath.sockets", hint: "bath.socketsHint", sid: "el2" },
        { type: "toggle", key: "fan", label: "bath.fan" },
      ] },
    ],
  },
  {
    id: "door",
    title: "bath.secDoor",
    items: [{ type: "group", flush: true, items: [{ type: "toggle", key: "door", label: "bath.door", hint: "bath.doorHint" }] }],
  },
];

// ─── Сухи помещения ────────────────────────────────────────────────────────
const drySchema = ({ kitchen = false, hall = false } = {}) => [
  { id: "dims", title: "r.secDims", dims: ["l", "w", "h"], counters: [
    { key: "doors", label: "r.doors", hint: "r.doorsHint", min: 0, max: 8 },
    { key: "windows", label: "r.windows", hint: "r.windowsHint", min: 0, max: 8 },
  ], geo: "r.geo", note: "r.geoNote" },
  {
    id: "prep",
    title: "r.secPrep",
    items: [{ type: "group", flush: true, items: [
      { type: "toggle", key: "removeFloor", label: "r.removeFloor", hint: ["r.removeFloorHint", (g) => ({ m2: g.floor })] },
      { type: "toggle", key: "removeWallpaper", label: "r.removeWallpaper" },
      { type: "toggle", key: "scrapePaint", label: "r.scrapePaint", hint: "r.scrapePaintHint" },
    ] }],
  },
  {
    id: "ceiling",
    title: "r.secCeiling",
    items: [{ type: "choice", key: "ceiling", values: ["none", "paint", "drywall"], price: "section", prefix: "r.ceiling" }],
  },
  {
    id: "walls",
    title: "r.secWalls",
    items: [
      { type: "choice", key: "walls", values: ["none", "paint", "wallpaper", "decor"], price: "section", prefix: "r.walls", hints: { paint: ["r.walls.paint_h", (g) => ({ m2: g.walls })] } },
      { type: "group", show: (c) => c.walls !== "none", items: [{ type: "toggle", key: "wallPlaster", label: "r.wallPlaster", hint: "r.wallPlasterHint" }] },
    ],
  },
  ...(kitchen
    ? [{
        id: "backsplash",
        title: "r.secBacksplash",
        items: [
          { type: "choice", key: "backsplash", values: ["none", "tiles"], price: "section", prefix: "r.backsplash" },
          { type: "number", key: "backsplashArea", label: "r.backsplashArea", hint: "r.backsplashAreaHint", step: 0.5, min: 0.5, max: 20, show: (c) => c.backsplash === "tiles" },
        ],
      }]
    : []),
  {
    id: "floor",
    title: "r.secFloor",
    items: [
      { type: "choice", key: "floor", values: ["none", "laminate", "tiles", "parquet"], price: "section", prefix: "r.floor", hints: { laminate: ["r.floor.laminate_h", (g) => ({ m2: g.floor })], tiles: ["r.floor.tiles_h", (g) => ({ m2: g.floor })] } },
      { type: "group", show: (c) => c.floor === "laminate" || c.floor === "tiles", items: [{ type: "toggle", key: "selfLevel", label: "r.selfLevel", hint: "r.selfLevelHint" }] },
    ],
  },
  ...(kitchen
    ? [{
        id: "plumbing",
        title: "r.secPlumbing",
        items: [
          { type: "choice", key: "plumbing", values: ["keep", "new"], price: "item", none: "keep", prefix: "r.plumbing", hints: { new: ["r.plumbing.new_h", (g, c) => ({ n: kitchenPoints(c) })] } },
          { type: "group", items: [
            { type: "toggle", key: "sink", label: "r.sink" },
            { type: "toggle", key: "dishwasher", label: "r.dishwasher" },
            { type: "toggle", key: "washer", label: "r.washer" },
          ] },
        ],
      }]
    : []),
  {
    id: "electrical",
    title: "r.secElectrical",
    items: [{ type: "group", flush: true, items: [
      { type: "toggle", key: "rewire", label: "r.rewire", hint: "r.rewireHint" },
      { type: "counter", key: "sockets", label: "r.sockets", hint: "r.socketsHint", sid: "el2" },
      { type: "counter", key: "replaceSockets", label: "r.replaceSockets", sid: "el3" },
      { type: "counter", key: "lights", label: "r.lights", sid: "el4" },
      ...(kitchen ? [{ type: "counter", key: "appliances", label: "r.appliances", hint: "r.appliancesHint", sid: "el8" }] : []),
    ] }],
  },
  {
    id: "openings",
    title: "r.secOpenings",
    items: [{ type: "group", flush: true, items: [
      { type: "counter", key: "newDoors", label: "r.newDoors", hint: "r.newDoorsHint", sid: "j1", max: 8 },
      ...(hall ? [{ type: "toggle", key: "entranceDoor", label: "r.entranceDoor", hint: "r.entranceDoorHint" }] : []),
      { type: "toggle", key: "newWindows", label: "r.newWindows", hint: "r.newWindowsHint", disabled: (c) => !(Number(c.windows) > 0) },
      { type: "toggle", key: "reveals", label: "r.reveals", hint: "r.revealsHint", disabled: (c) => !(Number(c.windows) > 0) },
      { type: "toggle", key: "sills", label: "r.sills", disabled: (c) => !(Number(c.windows) > 0) },
    ] }],
  },
];

const dry = (id, defaults, opts) => ({ id, defaults, limits: DRY_LIMITS, geometry: dryGeometry, lines: dryRoomLines, schema: drySchema(opts) });

/** Всички помещения в реда на показване. */
export const ROOM_DEFS = [
  { id: "bath", defaults: BATH_DEFAULT, limits: BATH_LIMITS, geometry: bathGeometry, lines: bathroomLines, schema: bathSchema },
  dry("kitchen", KITCHEN_DEFAULT, { kitchen: true }),
  dry("bedroom", BEDROOM_DEFAULT),
  dry("living", LIVING_DEFAULT),
  dry("hall", HALL_DEFAULT, { hall: true }),
];

export const ROOM_BY_ID = Object.fromEntries(ROOM_DEFS.map((r) => [r.id, r]));

/** Обединява редовете в { sid: количество }. */
export function linesToQty(lines) {
  const qty = {};
  for (const l of lines) qty[l.sid] = Math.round(((qty[l.sid] || 0) + l.qty) * 100) / 100;
  return qty;
}
