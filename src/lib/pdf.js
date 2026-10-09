import { jsPDF } from "jspdf";
import { DEJAVU_BOLD, DEJAVU_REGULAR } from "./pdfFonts.js";
import { isNegotiable, validUntil } from "./quote.js";
import { plainSpaces } from "./format.js";

const TEAL = [15, 124, 134];
const AMBER = [242, 165, 22];
const AMBER_INK = [63, 43, 0];
const INK = [14, 42, 51];
const MUTED = [90, 112, 119];
const LINE = [213, 225, 228];
const NEG = [150, 95, 0];

/**
 * Генерира PDF оферта с логото на Mr.Ru.
 * @returns {jsPDF} документът; извикайте .save(name) или .output("blob")
 */
export function buildQuotePdf(q, contractor, totals, { t, fmt, unit }) {
  const d = new jsPDF({ unit: "mm", format: "a4" });
  d.addFileToVFS("DejaVuSans.ttf", DEJAVU_REGULAR);
  d.addFont("DejaVuSans.ttf", "DejaVu", "normal");
  d.addFileToVFS("DejaVuSans-Bold.ttf", DEJAVU_BOLD);
  d.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");

  const W = 210;
  const M = 16;
  const txt = (s) => plainSpaces(s ?? "");
  const money = (n) => txt(fmt.eur(n));
  const font = (bold, size) => {
    d.setFont("DejaVu", bold ? "bold" : "normal");
    d.setFontSize(size);
  };
  const color = (c) => d.setTextColor(...c);

  // Заглавна лента с „ролетка“
  d.setFillColor(...TEAL);
  d.rect(0, 0, W, 30, "F");
  d.setFillColor(...AMBER);
  d.rect(0, 30, W, 3.2, "F");
  d.setDrawColor(...AMBER_INK);
  d.setLineWidth(0.2);
  for (let x = 0; x <= W; x += 2) d.line(x, 33.2, x, x % 10 === 0 ? 30 : 31.6);

  color([255, 255, 255]);
  font(true, 22);
  d.text("Mr.Ru", M, 18);
  font(false, 8.5);
  d.text(txt(t("brand.tagline")), M, 24);
  font(false, 9);
  d.text(txt(t("pdf.quote")), W - M, 12, { align: "right" });
  font(true, 15);
  d.text(q.no, W - M, 19.5, { align: "right" });
  font(false, 8.5);
  d.text(txt(`${t("pdf.date")}: ${fmt.date(q.date)}   ${t("quote.validUntil")}: ${fmt.date(validUntil(q))}`), W - M, 25, { align: "right" });

  // Страни
  let y = 44;
  const col2 = W / 2 + 4;
  color(MUTED);
  font(true, 7.5);
  d.text(txt(t("pdf.contractor")), M, y);
  d.text(txt(t("pdf.client")), col2, y);
  y += 5.5;
  color(INK);
  font(true, 11);
  d.text(txt(contractor.name), M, y);
  d.text(txt(q.client.name || "—"), col2, y);
  font(false, 9);
  const left = [contractor.person, contractor.phone, contractor.email, contractor.city].filter(Boolean);
  const right = [q.client.phone, q.client.email, q.client.city].filter(Boolean);
  left.forEach((s, i) => d.text(txt(s), M, y + 5 + i * 4.6));
  right.forEach((s, i) => d.text(txt(s), col2, y + 5 + i * 4.6));
  y += 6 + Math.max(left.length, right.length) * 4.6 + 6;

  // Таблица
  const X = { n: M + 2, desc: M + 10, unit: M + 104, qty: M + 132, price: M + 158, sum: W - M - 2 };
  const header = () => {
    d.setFillColor(220, 239, 240);
    d.rect(M, y - 5, W - 2 * M, 8, "F");
    color(INK);
    font(true, 8);
    d.text("№", X.n, y);
    d.text(txt(t("pdf.description")), X.desc, y);
    d.text(txt(t("pdf.unit")), X.unit, y);
    d.text(txt(t("pdf.qty")), X.qty, y, { align: "right" });
    d.text(txt(t("pdf.unitPrice")), X.price, y, { align: "right" });
    d.text(txt(t("pdf.amount")), X.sum, y, { align: "right" });
    y += 8;
  };
  header();

  q.lines.forEach((l, i) => {
    font(false, 9);
    const wrapped = d.splitTextToSize(txt(l.name), 90);
    const h = wrapped.length * 4.2 + 3;
    if (y + h > 262) {
      d.addPage();
      y = 22;
      header();
      font(false, 9);
    }
    color(INK);
    d.text(String(i + 1), X.n, y);
    d.text(wrapped, X.desc, y);
    d.text(txt(unit(l.unit)), X.unit, y);
    d.text(txt(fmt.num(Number(l.qty) || 0)), X.qty, y, { align: "right" });
    if (isNegotiable(l)) {
      color(NEG);
      d.text(txt(t("quote.negotiableLower")), X.price, y, { align: "right" });
      color(INK);
      d.text("—", X.sum, y, { align: "right" });
    } else {
      d.text(money(Number(l.price)), X.price, y, { align: "right" });
      d.text(money((Number(l.price) || 0) * (Number(l.qty) || 0)), X.sum, y, { align: "right" });
    }
    d.setDrawColor(...LINE);
    d.setLineWidth(0.2);
    d.line(M, y + h - 4, W - M, y + h - 4);
    y += h;
  });

  // Суми
  if (y > 225) {
    d.addPage();
    y = 22;
  }
  y += 4;
  const tx = W - M - 70;
  const row = (label, value) => {
    color(MUTED);
    font(false, 9.5);
    d.text(txt(label), tx, y);
    color(INK);
    d.text(txt(value), W - M - 2, y, { align: "right" });
    y += 5.5;
  };
  row(t("quote.subtotal"), money(totals.subtotal));
  if (totals.discount > 0) row(t("quote.discountLine", { p: q.discount }), "−" + money(totals.discount));
  row(t("quote.vatLine"), q.vat ? money(totals.vat) : t("pdf.noVat"));
  d.setFillColor(...TEAL);
  d.rect(tx - 3, y - 4, 73, 10, "F");
  color([255, 255, 255]);
  font(true, 11);
  d.text(txt(t("pdf.total")), tx, y + 2.6);
  d.text(money(totals.total), W - M - 2, y + 2.6, { align: "right" });
  y += 13;
  if (totals.negotiable) {
    color(NEG);
    font(false, 8.5);
    d.text(txt(t("pdf.negotiableNote", { n: totals.negotiable })), W - M - 2, y, { align: "right" });
    y += 7;
  }

  // Бележки
  if (q.notes) {
    y += 2;
    color(MUTED);
    font(true, 7.5);
    d.text(txt(t("pdf.notes")), M, y);
    y += 5;
    color(INK);
    font(false, 9);
    const notes = d.splitTextToSize(txt(q.notes), W - 2 * M);
    if (y + notes.length * 4.4 > 280) {
      d.addPage();
      y = 22;
    }
    d.text(notes, M, y);
  }

  // Долен колонтитул на всяка страница
  const pages = d.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    d.setPage(p);
    color(MUTED);
    font(false, 7.5);
    d.setDrawColor(...LINE);
    d.line(M, 284, W - M, 284);
    d.text(txt(t("pdf.footer")), M, 288.5);
    d.text(`${p} / ${pages}`, W - M, 288.5, { align: "right" });
  }
  return d;
}
