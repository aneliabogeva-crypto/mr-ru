import { useState } from "react";
import { CATEGORIES, SERVICES, SERVICE_BY_ID, priceOf } from "../../data/catalog.js";
import { isNegotiable, quoteSummary, quoteTotals, validUntil } from "../../lib/quote.js";
import { copyToClipboard, mailtoLink, viberForwardLink, whatsappLink } from "../../lib/messaging.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function QuoteBuilder({ quote: q, setQuote, me, notify }) {
  const i18n = useI18n();
  const { t, pick, unit, fmt } = i18n;
  const [busy, setBusy] = useState(false);
  const totals = quoteTotals(q);
  const summary = quoteSummary(q, me, totals, i18n);

  const update = (patch) => setQuote({ ...q, ...patch });
  const updateClient = (patch) => setQuote({ ...q, client: { ...q.client, ...patch } });
  const updateLine = (key, patch) => setQuote({ ...q, lines: q.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) });
  const removeLine = (key) => setQuote({ ...q, lines: q.lines.filter((l) => l.key !== key) });

  const addLine = (sid) => {
    const key = `l${Date.now()}`;
    if (sid === "custom") {
      setQuote({ ...q, lines: [...q.lines, { key, name: t("quote.newLine"), unit: "pc", qty: 1, price: 0 }] });
    } else if (SERVICE_BY_ID[sid]) {
      const s = SERVICE_BY_ID[sid];
      const p = priceOf(me, sid);
      setQuote({ ...q, lines: [...q.lines, { key, name: pick(s.name), unit: s.unit, qty: 1, price: p.off ? null : p.price }] });
    }
  };

  const downloadPdf = async () => {
    if (!q.lines.length) return notify(t("quote.errEmpty"));
    setBusy(true);
    try {
      // jsPDF и шрифтовете се зареждат само при нужда (по-малък начален бъндъл).
      const { buildQuotePdf } = await import("../../lib/pdf.js");
      buildQuotePdf(q, me, totals, i18n).save(`Oferta-${q.no}.pdf`);
      notify(t("quote.pdfDone"));
    } catch (e) {
      notify(t("quote.pdfError", { msg: e?.message || String(e) }));
    } finally {
      setBusy(false);
    }
  };

  const copySummary = async () => notify((await copyToClipboard(summary)) ? t("common.copied") : t("common.copyFailed"));

  const mail = mailtoLink(q.client.email, t("quote.mailSubject", { no: q.no, name: me.name }), `${summary}\n\n${t("quote.mailAttached")}`);
  const wa = whatsappLink(q.client.phone, summary);

  return (
    <div className="cols">
      <div className="stack min0">
        <div className="card pad stack">
          <div className="q-head">
            <div>
              <span className="label">{t("quote.label")}</span>
              <div className="qno">{q.no}</div>
            </div>
            <div className="row">
              <label className="field w-120">
                <span>{t("quote.validDays")}</span>
                <input id="q-valid" className="inp" type="number" min="1" value={q.validDays} onChange={(e) => update({ validDays: e.target.value })} />
              </label>
              <div className="small muted pt18">
                {t("quote.period", { from: fmt.date(q.date), to: fmt.date(validUntil(q)) })}
              </div>
            </div>
          </div>
          <div className="grid-f">
            <label className="field"><span>{t("form.client")}</span><input id="q-cn" className="inp" value={q.client.name} onChange={(e) => updateClient({ name: e.target.value })} /></label>
            <label className="field"><span>{t("form.phone")}</span><input id="q-cp" className="inp" type="tel" value={q.client.phone} onChange={(e) => updateClient({ phone: e.target.value })} /></label>
            <label className="field"><span>{t("form.email")}</span><input id="q-ce" className="inp" type="email" value={q.client.email} onChange={(e) => updateClient({ email: e.target.value })} /></label>
            <label className="field"><span>{t("form.siteAddress")}</span><input id="q-ca" className="inp" value={q.client.city} onChange={(e) => updateClient({ city: e.target.value })} /></label>
          </div>
        </div>

        <div className="card tbl-wrap">
          <table className="tbl-cards quote-tbl">
            <thead>
              <tr>
                <th>{t("quote.colItem")}</th>
                <th>{t("pro.colUnit")}</th>
                <th className="num">{t("pdf.qty")}</th>
                <th className="num">{t("quote.colUnitPrice")}</th>
                <th className="num">{t("pdf.amount")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {q.lines.map((l) => (
                <tr key={l.key}>
                  <td className="w-name c-name" data-label={t("pdf.description")}>
                    <input id={`ln-${l.key}`} className="inp" aria-label={t("pdf.description")} value={l.name} onChange={(e) => updateLine(l.key, { name: e.target.value })} />
                  </td>
                  <td className="c-unit" data-label={t("pro.colUnit")}>
                    <input id={`lu-${l.key}`} className="inp w-unit" aria-label={t("pro.colUnit")} value={unit(l.unit)} onChange={(e) => updateLine(l.key, { unit: e.target.value })} />
                  </td>
                  <td className="num c-qty" data-label={t("pdf.qty")}>
                    <input id={`lq-${l.key}`} className="inp w-qty" type="number" min="0" step="0.5" aria-label={t("pdf.qty")} value={l.qty} onChange={(e) => updateLine(l.key, { qty: e.target.value })} />
                  </td>
                  <td className="num c-price" data-label={t("quote.colUnitPrice")}>
                    <input
                      id={`lp-${l.key}`}
                      className="inp w-price"
                      type="number"
                      min="0"
                      step="0.5"
                      aria-label={t("pdf.unitPrice")}
                      placeholder={t("quote.negotiableLower")}
                      value={l.price ?? ""}
                      onChange={(e) => updateLine(l.key, { price: e.target.value === "" ? null : e.target.value })}
                    />
                  </td>
                  <td className="num nowrap c-sum">
                    {isNegotiable(l) ? <span className="pill neg">{t("common.negotiable")}</span> : fmt.eur((Number(l.price) || 0) * (Number(l.qty) || 0))}
                  </td>
                  <td className="c-del">
                    <button type="button" className="btn btn-s" aria-label={t("quote.remove", { name: l.name })} onClick={() => removeLine(l.key)}>✕</button>
                  </td>
                </tr>
              ))}
              {!q.lines.length && (
                <tr><td colSpan="6" className="empty">{t("quote.emptyLines")}</td></tr>
              )}
            </tbody>
          </table>
          <div className="row pad add-row">
            <select id="q-add" className="inp grow" value="" onChange={(e) => addLine(e.target.value)}>
              <option value="">{t("quote.addFromList")}</option>
              {CATEGORIES.map((c) => (
                <optgroup key={c.id} label={pick(c.name)}>
                  {SERVICES.filter((s) => s.cat === c.id).map((s) => (
                    <option key={s.id} value={s.id}>
                      {pick(s.name)}
                      {priceOf(me, s.id).off ? ` (${t("quote.negotiableLower")})` : ` – ${fmt.eur(priceOf(me, s.id).price)}/${unit(s.unit)}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button type="button" className="btn" onClick={() => addLine("custom")}>{t("quote.addCustom")}</button>
          </div>
        </div>

        <label className="field">
          <span>{t("quote.notes")}</span>
          <textarea id="q-notes" className="inp" value={q.notes} onChange={(e) => update({ notes: e.target.value })} />
        </label>
      </div>

      <aside className="rail stack">
        <div className="card pad stack">
          <div className="row">
            <label className="field w-110">
              <span>{t("quote.discount")}</span>
              <input id="q-disc" className="inp" type="number" min="0" max="100" value={q.discount} onChange={(e) => update({ discount: e.target.value })} />
            </label>
            <label className="sw pt18">
              <input id="q-vat" className="teal" type="checkbox" checked={q.vat} onChange={(e) => update({ vat: e.target.checked })} />
              {t("quote.addVat")}
            </label>
          </div>
          <div className="tot-box">
            <div><span className="muted">{t("quote.subtotal")}</span><span>{fmt.eur(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div><span className="muted">{t("quote.discountLine", { p: q.discount })}</span><span>−{fmt.eur(totals.discount)}</span></div>}
            {q.vat && <div><span className="muted">{t("quote.vatLine")}</span><span>{fmt.eur(totals.vat)}</span></div>}
            <div className="big"><span>{t("quote.total")}</span><span>{fmt.eur(totals.total)}</span></div>
            {totals.negotiable > 0 && <div className="small"><span className="pill neg">{t("quote.plusNegotiable", { n: totals.negotiable })}</span></div>}
          </div>
          <button type="button" className="btn btn-a" disabled={busy} onClick={downloadPdf}>
            {busy ? t("quote.generating") : t("quote.downloadPdf")}
          </button>
          <hr />
          <span className="label">{t("quote.sendToClient")}</span>
          <div className="share">
            <a className="btn btn-s" href={mail}>{t("quote.email")}</a>
            <button type="button" className="btn btn-s" onClick={copySummary}>{t("quote.copyText")}</button>
            <a className="btn btn-s btn-viber" href={viberForwardLink(summary)}>Viber</a>
            <a className="btn btn-s btn-wa" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
          <p className="note">
            {t("quote.shareNote")}
            {q.client.email && <> {t("quote.clientEmail")}: <span className="phone">{q.client.email}</span></>}
          </p>
        </div>
      </aside>
    </div>
  );
}
