const cache = new Map();
const numberFormat = (locale, digits) => {
  const key = locale + digits;
  if (!cache.has(key)) {
    cache.set(key, new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  }
  return cache.get(key);
};

export const LOCALES = { bg: "bg-BG", en: "en-GB" };

/** Създава форматиращи функции за даден език. */
export function makeFormat(lang) {
  const locale = LOCALES[lang] || LOCALES.bg;
  return {
    num: (n, digits = 2) => numberFormat(locale, digits).format(n),
    qty: (n) => numberFormat(locale, Number(n) % 1 ? 1 : 0).format(Number(n) || 0),
    eur: (n) => numberFormat(locale, 2).format(n) + " €",
    eur0: (n) => numberFormat(locale, 0).format(n) + " €",
    pct: (n) => numberFormat(locale, 0).format(n) + "%",
    date: (d) => new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

export const initials = (s) =>
  String(s || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Премахва неразделящите интервали (за PDF шрифта). */
export const plainSpaces = (s) => String(s).replace(/[  ]/g, " ");
