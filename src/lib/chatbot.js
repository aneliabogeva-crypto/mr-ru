import { FAQ } from "../data/faq.js";
import { SERVICES } from "../data/catalog.js";

const normalize = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}² ]/gu, " ");
const stems = (s) =>
  normalize(s)
    .split(/\s+/)
    .filter((w) => w.length >= 5)
    .map((w) => w.slice(0, 5));

const PRICE_WORDS = /цен|колко|струва|price|cost|how much/i;

/** Намира най-подходящия ЧЗВ запис по ключови думи. */
export function matchFaq(text) {
  const t = normalize(text);
  let best = null;
  let score = 0;
  for (const f of FAQ) {
    const s = f.keys.reduce((acc, k) => acc + (t.includes(k) ? k.length : 0), 0);
    if (s > score) {
      score = s;
      best = f;
    }
  }
  return score >= 3 ? best : null;
}

/** Намира услуга, за която се пита (по корени на думите в името ѝ). */
export function matchService(text, lang) {
  const words = stems(text);
  let best = null;
  let hits = 0;
  for (const svc of SERVICES) {
    const h = stems(svc.name[lang] || svc.name.bg).filter((w) => words.includes(w)).length;
    if (h > hits) {
      hits = h;
      best = svc;
    }
  }
  return best;
}

/**
 * Правилов отговор. Връща { type: "price", service } | { type: "faq", faq } | null.
 * За LLM отговор при null: извикайте собствен бекенд (не слагайте API ключ във фронтенда).
 */
export function answer(text, lang) {
  if (PRICE_WORDS.test(text)) {
    const service = matchService(text, lang);
    if (service) return { type: "price", service };
  }
  const faq = matchFaq(text);
  return faq ? { type: "faq", faq } : null;
}
