import { createContext, useContext, useEffect, useMemo } from "react";
import bg from "./bg.js";
import en from "./en.js";
import { UNITS } from "../data/catalog.js";
import { makeFormat } from "../lib/format.js";
import { usePersistentState } from "../lib/storage.js";

const DICTS = { bg, en };
export const LANGUAGES = [
  { id: "bg", label: "BG" },
  { id: "en", label: "EN" },
];

const I18nContext = createContext(null);

const interpolate = (str, vars) =>
  vars ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`)) : str;

export function I18nProvider({ children }) {
  const [lang, setLang] = usePersistentState("lang", "bg");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const dict = DICTS[lang] || bg;
    const pluralRules = new Intl.PluralRules(lang);
    /** Превод по ключ; липсващ превод пада към български, после към самия ключ. */
    const t = (key, vars) => interpolate(dict[key] ?? bg[key] ?? key, vars);
    /** Множествено число: търси ключ `key_one` / `key_other`. */
    const tn = (key, n, vars = {}) => t(`${key}_${pluralRules.select(n) === "one" ? "one" : "other"}`, { n, ...vars });
    /** Избира превод от обект { bg, en } (каталог, ЧЗВ). */
    const pick = (obj) => (obj ? obj[lang] ?? obj.bg : "");
    const unit = (code) => pick(UNITS[code]) || code;
    return { lang, setLang, t, tn, pick, unit, fmt: makeFormat(lang) };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n трябва да се използва в I18nProvider");
  return ctx;
}
