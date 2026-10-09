import { SERVICE_BY_ID } from "../data/catalog.js";

export const VAT_RATE = 0.2;

export const isNegotiable = (line) => line.price === null || line.price === "";

export const quoteNumber = (seq, year = new Date().getFullYear()) => `MR-${year}-${String(seq).padStart(4, "0")}`;

/** Създава нова оферта, по желание от клиентско запитване. */
export function createQuote({ no, contractor, request, lang, defaultNotes }) {
  const lines = request
    ? request.items.map((it, i) => {
        const svc = SERVICE_BY_ID[it.sid];
        const p = contractor.prices[it.sid];
        return {
          key: `l${i}`,
          name: svc.name[lang] || svc.name.bg,
          unit: svc.unit,
          qty: it.qty,
          price: !p || p.off ? null : p.price,
        };
      })
    : [];
  if (request?.custom) lines.push({ key: "lc", name: request.custom, unit: "pc", qty: 1, price: null });
  return {
    no,
    date: new Date().toISOString(),
    validDays: 14,
    discount: 0,
    vat: false,
    requestId: request?.id ?? null,
    client: request ? { ...request.client } : { name: "", phone: "", email: "", city: "" },
    lines,
    notes: defaultNotes,
  };
}

export function quoteTotals(q) {
  const priced = q.lines.filter((l) => !isNegotiable(l));
  const subtotal = priced.reduce((a, l) => a + (Number(l.price) || 0) * (Number(l.qty) || 0), 0);
  const discount = (subtotal * (Number(q.discount) || 0)) / 100;
  const base = subtotal - discount;
  const vat = q.vat ? base * VAT_RATE : 0;
  return { subtotal, discount, base, vat, total: base + vat, negotiable: q.lines.length - priced.length };
}

export function validUntil(q) {
  const d = new Date(q.date);
  d.setDate(d.getDate() + (Number(q.validDays) || 0));
  return d;
}

/** Кратко текстово резюме за имейл, Viber и WhatsApp. */
export function quoteSummary(q, contractor, totals, { t, fmt, unit }) {
  const max = 12;
  const lines = q.lines.slice(0, max).map((l) => {
    const sum = isNegotiable(l) ? t("quote.negotiableLower") : fmt.eur((Number(l.price) || 0) * (Number(l.qty) || 0));
    return `• ${l.name} – ${fmt.qty(l.qty)} ${unit(l.unit)}: ${sum}`;
  });
  if (q.lines.length > max) lines.push(t("quote.moreLines", { n: q.lines.length - max }));
  const out = [
    t("quote.summaryTitle", { no: q.no, name: contractor.name }),
    t("quote.summaryFor", { name: q.client.name || t("quote.clientFallback") }),
    "",
    ...lines,
    "",
    `${q.vat ? t("quote.totalWithVat") : t("quote.total")}: ${fmt.eur(totals.total)}` +
      (totals.negotiable ? ` ${t("quote.plusNegotiable", { n: totals.negotiable })}` : ""),
    `${t("quote.validUntil")}: ${fmt.date(validUntil(q))}`,
    `${t("quote.contact")}: ${contractor.person}, ${contractor.phone}`,
  ];
  return out.join("\n");
}
