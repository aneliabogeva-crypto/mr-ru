// Каталог на услугите. `base` е ориентировъчна цена за труд в евро,
// използва се само за генериране на демо ценоразписи и като резервна стойност.

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
  trip: { bg: "курс", en: "load" },
  t: { bg: "т", en: "t" },
};

const s = (id, cat, unit, base, bg, en) => ({ id, cat, unit, base, name: { bg, en } });

export const SERVICES = [
  s("el1", "el", "lm", 4.5, "Полагане на нов кабел (скрит монтаж)", "New cable run (concealed)"),
  s("el2", "el", "pc", 22, "Нова ел. точка (контакт или ключ)", "New socket or switch point"),
  s("el3", "el", "pc", 8, "Смяна на контакт или ключ", "Replace socket or switch"),
  s("el4", "el", "pc", 15, "Монтаж на осветително тяло", "Install light fixture"),
  s("el5", "el", "pc", 120, "Монтаж на ел. табло до 12 модула", "Install distribution board (up to 12 modules)"),
  s("el6", "el", "lm", 5, "Канал за кабел в тухла", "Cable chase in brick"),
  s("v1", "vik", "pc", 45, "Нова ВиК точка (студена/топла вода)", "New water point (cold/hot)"),
  s("v2", "vik", "pc", 55, "Монтаж на стояща тоалетна", "Install floor-standing toilet"),
  s("v3", "vik", "pc", 110, "Монтаж на окачена тоалетна с конструкция", "Install wall-hung toilet with frame"),
  s("v4", "vik", "pc", 25, "Монтаж на смесител", "Install mixer tap"),
  s("v5", "vik", "pc", 60, "Монтаж на бойлер", "Install water heater"),
  s("v6", "vik", "pc", 35, "Монтаж на мивка или умивалник", "Install sink or washbasin"),
  s("v7", "vik", "pc", 40, "Смяна на водомер", "Replace water meter"),
  s("p1", "pl", "m2", 9, "Гипсова мазилка", "Gypsum plaster"),
  s("p2", "pl", "m2", 6, "Шпакловка (2 слоя)", "Skim coat (2 layers)"),
  s("p3", "pl", "m2", 24, "Преградна стена от гипсокартон", "Drywall partition"),
  s("p4", "pl", "m2", 26, "Окачен таван от гипсокартон", "Drywall suspended ceiling"),
  s("p5", "pl", "m2", 12, "Топлоизолация с каменна вата", "Stone wool insulation"),
  s("p6", "pl", "lm", 3, "Монтаж на ъглов профил", "Corner bead"),
  s("t1", "tf", "m2", 18, "Лепене на подови плочки", "Floor tiling"),
  s("t2", "tf", "m2", 20, "Лепене на стенни плочки", "Wall tiling"),
  s("t3", "tf", "m2", 6, "Полагане на ламинат", "Laminate flooring"),
  s("t4", "tf", "lm", 3, "Монтаж на первази", "Skirting boards"),
  s("t5", "tf", "m2", 9, "Саморазливна замазка", "Self-leveling screed"),
  s("t6", "tf", "m2", 4, "Фугиране", "Grouting"),
  s("a1", "pa", "m2", 1.2, "Грундиране", "Priming"),
  s("a2", "pa", "m2", 3.5, "Боядисване с латекс (2 ръце)", "Latex paint (2 coats)"),
  s("a3", "pa", "m2", 14, "Декоративна мазилка", "Decorative plaster"),
  s("a4", "pa", "m2", 7, "Лепене на тапет", "Wallpapering"),
  s("a5", "pa", "m2", 4, "Боядисване на таван", "Ceiling painting"),
  s("d1", "de", "m2", 8, "Къртене на плочки", "Tile removal"),
  s("d2", "de", "m2", 3, "Премахване на стара настилка", "Old flooring removal"),
  s("d3", "de", "m2", 15, "Разбиване на тухлена стена", "Brick wall demolition"),
  s("d4", "de", "trip", 130, "Извозване на строителни отпадъци", "Debris disposal"),
  s("d5", "de", "t", 35, "Пренасяне на материали (до 4 ет.)", "Carrying materials (up to 4th floor)"),
  s("j1", "jo", "pc", 75, "Монтаж на интериорна врата", "Install interior door"),
  s("j2", "jo", "pc", 140, "Монтаж на входна врата", "Install entrance door"),
  s("j3", "jo", "m2", 30, "Монтаж на PVC прозорец", "Install PVC window"),
  s("j4", "jo", "lm", 18, "Монтаж на подпрозоречна дъска", "Install window sill"),
  s("j5", "jo", "lm", 12, "Обръщане на прозорец (шпакловка)", "Window reveal finishing"),
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((x) => [x.id, x]));

/**
 * Начален ценоразпис за нов майстор: каталожната цена за услугите от неговите
 * дейности, а останалите са „Не се предлага“. Майсторът ги редактира после.
 */
export function defaultPrices(trades) {
  return Object.fromEntries(SERVICES.map((s) => [s.id, { price: s.base, off: !trades.includes(s.cat) }]));
}

/** Цели бройки ли са (за стъпката на полето за количество). */
export const isCountUnit = (unit) => unit === "pc" || unit === "trip";
