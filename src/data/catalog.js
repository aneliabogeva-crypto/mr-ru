// Каталог на услугите. `base` е референтната пазарна цена за труд в София, в евро
// (медиана на обявени цени, виж marketReference.js). Тя участва в пазарната
// цена заедно с ценоразписите на майсторите и е начална цена за нов майстор.
import { referencePrice } from "./marketReference.js";

export const CATEGORIES = [
  { id: "el", name: { bg: "Електро", en: "Electrical" } },
  { id: "vik", name: { bg: "ВиК", en: "Plumbing" } },
  { id: "pl", name: { bg: "Шпакловка и сухо строителство", en: "Plastering & Drywall" } },
  { id: "tf", name: { bg: "Плочки и настилки", en: "Tiling & Flooring" } },
  { id: "pa", name: { bg: "Боядисване и тапети", en: "Painting & Wallpaper" } },
  { id: "de", name: { bg: "Къртене и извозване", en: "Demolition & Disposal" } },
  { id: "jo", name: { bg: "Дограма и врати", en: "Joinery & Doors" } },
];

export const UNITS = {
  m2: { bg: "м²", en: "m²" },
  lm: { bg: "м.л.", en: "lin. m" },
  pc: { bg: "бр.", en: "pc" },
  set: { bg: "компл.", en: "set" },
  trip: { bg: "курс", en: "load" },
  t: { bg: "т", en: "t" },
};

const s = (id, cat, unit, bg, en) => {
  const ref = referencePrice(id);
  return { id, cat, unit, base: ref.price, estimated: ref.estimated, national: ref.national, name: { bg, en } };
};

export const SERVICES = [
  s("el1", "el", "lm", "Полагане на нов кабел (скрит монтаж)", "New cable run (concealed)"),
  s("el2", "el", "pc", "Нова ел. точка (контакт или ключ)", "New socket or switch point"),
  s("el3", "el", "pc", "Смяна на контакт или ключ", "Replace socket or switch"),
  s("el4", "el", "pc", "Монтаж на осветително тяло", "Install light fixture"),
  s("el5", "el", "pc", "Монтаж на ел. табло до 12 модула", "Install distribution board (up to 12 modules)"),
  s("el6", "el", "lm", "Канал за кабел в тухла", "Cable chase in brick"),
  s("el7", "el", "pc", "Монтаж на вентилатор за баня", "Install bathroom fan"),
  s("el8", "el", "pc", "Свързване на ел. уред (фурна, плот, аспиратор)", "Connect an appliance (oven, hob, hood)"),
  s("v1", "vik", "pc", "Нова ВиК точка (студена/топла вода и канал)", "New plumbing point (water and drain)"),
  s("v2", "vik", "pc", "Монтаж на стояща тоалетна", "Install floor-standing toilet"),
  s("v3", "vik", "pc", "Монтаж на окачена тоалетна с конструкция", "Install wall-hung toilet with frame"),
  s("v4", "vik", "pc", "Монтаж на смесител за мивка", "Install basin mixer"),
  s("v5", "vik", "pc", "Монтаж на бойлер", "Install water heater"),
  s("v6", "vik", "pc", "Монтаж на мивка или шкаф с мивка", "Install washbasin or vanity unit"),
  s("v7", "vik", "pc", "Смяна на водомер", "Replace water meter"),
  s("v8", "vik", "pc", "Монтаж на душ корито или душ канал", "Install shower tray or channel"),
  s("v9", "vik", "pc", "Монтаж на вана", "Install bathtub"),
  s("v10", "vik", "pc", "Монтаж на душ параван или душ кабина", "Install shower screen or cabin"),
  s("v11", "vik", "pc", "Монтаж на смесител за душ или вана", "Install shower or bath mixer"),
  s("v12", "vik", "set", "Демонтаж на стара санитария (с извозване)", "Remove old sanitary ware (with disposal)"),
  s("v13", "vik", "pc", "Монтаж на огледало или аксесоар", "Install mirror or accessory"),
  s("v14", "vik", "pc", "Монтаж на вграден (скрит) смесител за душ", "Install concealed shower mixer"),
  s("p1", "pl", "m2", "Гипсова мазилка", "Gypsum plaster"),
  s("p2", "pl", "m2", "Шпакловка (2 слоя)", "Skim coat (2 layers)"),
  s("p3", "pl", "m2", "Преградна стена от гипсокартон", "Drywall partition"),
  s("p4", "pl", "m2", "Окачен таван от гипсокартон", "Drywall suspended ceiling"),
  s("p5", "pl", "m2", "Топлоизолация с каменна вата", "Stone wool insulation"),
  s("p6", "pl", "lm", "Монтаж на ъглов профил", "Corner bead"),
  s("p7", "pl", "m2", "Хидроизолация", "Waterproofing"),
  s("p8", "pl", "m2", "Окачен таван от PVC пана", "PVC panel ceiling"),
  s("p9", "pl", "m2", "Изправяне на стени с мазилка под плочки", "Wall levelling plaster before tiling"),
  s("p10", "pl", "m2", "Окачен таван в баня (влагоустойчив гипсокартон, шпакловка и боя)", "Bathroom suspended ceiling (moisture-resistant, finished)"),
  s("t1", "tf", "m2", "Лепене на подови плочки", "Floor tiling"),
  s("t2", "tf", "m2", "Лепене на стенни плочки", "Wall tiling"),
  s("t3", "tf", "m2", "Полагане на ламинат", "Laminate flooring"),
  s("t4", "tf", "lm", "Монтаж на первази", "Skirting boards"),
  s("t5", "tf", "m2", "Саморазливна замазка", "Self-levelling screed"),
  s("t6", "tf", "m2", "Фугиране", "Grouting"),
  s("t7", "tf", "m2", "Циментова замазка до 5 см", "Cement screed up to 5 cm"),
  s("t8", "tf", "m2", "Надценка за плочки голям формат (над 60×60)", "Large-format tile surcharge (over 60×60)"),
  s("t9", "tf", "m2", "Лепене на подови плочки в баня (с наклон)", "Bathroom floor tiling (with slope)"),
  s("t10", "tf", "m2", "Лепене на стенни плочки в баня", "Bathroom wall tiling"),
  s("t11", "tf", "m2", "Циклене и лакиране на паркет (с лака)", "Parquet sanding and varnishing (varnish incl.)"),
  s("a1", "pa", "m2", "Грундиране", "Priming"),
  s("a2", "pa", "m2", "Боядисване с латекс (2 ръце)", "Latex paint (2 coats)"),
  s("a3", "pa", "m2", "Декоративна мазилка", "Decorative plaster"),
  s("a4", "pa", "m2", "Лепене на тапет", "Wallpapering"),
  s("a5", "pa", "m2", "Боядисване на таван", "Ceiling painting"),
  s("a6", "pa", "m2", "Сваляне на стари тапети", "Wallpaper removal"),
  s("a7", "pa", "m2", "Изстъргване на стара боя", "Scraping off old paint"),
  s("d1", "de", "m2", "Къртене на плочки (с извозване)", "Tile removal (with disposal)"),
  s("d2", "de", "m2", "Премахване на стара настилка", "Old flooring removal"),
  s("d3", "de", "m2", "Разбиване на тухлена стена", "Brick wall demolition"),
  s("d4", "de", "trip", "Извозване на строителни отпадъци", "Debris disposal"),
  s("d5", "de", "t", "Пренасяне на материали (до 4 ет.)", "Carrying materials (up to 4th floor)"),
  s("j1", "jo", "pc", "Монтаж на интериорна врата", "Install interior door"),
  s("j2", "jo", "pc", "Монтаж на входна врата", "Install entrance door"),
  s("j3", "jo", "m2", "Монтаж на PVC прозорец", "Install PVC window"),
  s("j4", "jo", "lm", "Монтаж на подпрозоречна дъска", "Install window sill"),
  s("j5", "jo", "lm", "Обръщане на прозорец (шпакловка)", "Window reveal finishing"),
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((x) => [x.id, x]));

/**
 * Начален ценоразпис за нов майстор: референтната цена за услугите от неговите
 * дейности, а останалите са „Не се предлага“. Майсторът ги редактира после.
 */
export function defaultPrices(trades) {
  return Object.fromEntries(SERVICES.map((s) => [s.id, { price: s.base, off: !trades.includes(s.cat) }]));
}

/**
 * Цената на майстора за услуга. Услуга, добавена в каталога след като
 * майсторът е попълнил ценоразписа си, се води „Не се предлага“.
 */
export function priceOf(contractor, sid) {
  return contractor?.prices?.[sid] ?? { price: SERVICE_BY_ID[sid]?.base ?? 0, off: true };
}

/** Цели бройки ли са (за стъпката на полето за количество). */
export const isCountUnit = (unit) => unit === "pc" || unit === "trip" || unit === "set";
