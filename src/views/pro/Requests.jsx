import { SERVICE_BY_ID } from "../../data/catalog.js";
import { viberChatLink, whatsappLink } from "../../lib/messaging.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const STATUS_TONE = { new: "warn", seen: "", quoted: "ok", closed: "" };
const STATUSES = ["new", "seen", "quoted", "closed"];

export default function Requests({ list, me, onQuote, onStatus, onRefresh }) {
  const { t, tn, pick, unit, fmt } = useI18n();

  const toolbar = (
    <div className="row between">
      <button type="button" className="btn btn-s" onClick={onRefresh}>{t("pro.refresh")}</button>
      <button type="button" className="btn" onClick={() => onQuote(null)}>{t("pro.newQuoteNoRequest")}</button>
    </div>
  );

  if (list === null) return <div className="card empty">{t("common.loading")}</div>;
  if (!list.length) {
    return (
      <div className="stack">
        {toolbar}
        <div className="card empty">{t("pro.noRequests")}</div>
      </div>
    );
  }

  return (
    <div className="stack">
      {toolbar}
      {list.map((r) => {
        const negotiable = r.items.filter((it) => me.prices[it.sid]?.off).length;
        const own = r.items.reduce((a, it) => {
          const p = me.prices[it.sid];
          return a + (p && !p.off ? p.price * it.qty : 0);
        }, 0);
        return (
          <article key={r.id} className="card req">
            <div className="q-head">
              <div>
                <h3>{r.client.name}</h3>
                <div className="small muted">
                  {fmt.date(r.date)} · {r.client.city || "—"} · <span className="phone">{r.client.phone}</span>
                  {r.client.email && <> · <span className="phone">{r.client.email}</span></>}
                </div>
              </div>
              <label className="status-pick">
                <span className="sr-only">{t("pro.status")}</span>
                <select
                  id={`st-${r.id}`}
                  className={"inp pill " + STATUS_TONE[r.status]}
                  value={r.status}
                  onChange={(e) => onStatus(r, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`pro.status_${s}`)}</option>)}
                </select>
              </label>
            </div>
            <div className="small">
              {r.items
                .filter((it) => SERVICE_BY_ID[it.sid])
                .map((it) => `${pick(SERVICE_BY_ID[it.sid].name)} – ${fmt.qty(it.qty)} ${unit(SERVICE_BY_ID[it.sid].unit)}`)
                .join(" · ")}
            </div>
            {r.custom && <div className="small"><strong>{t("pro.customService")}:</strong> {r.custom}</div>}
            {r.comment && <div className="small muted">„{r.comment}“</div>}
            <div className="row between">
              <div className="small">
                {t("pro.byYourPrices")}: <strong>{fmt.eur(own)}</strong>
                {negotiable > 0 && <> · <span className="pill neg">{tn("pro.negotiableCount", negotiable)}</span></>}
              </div>
              <div className="actions">
                <a className="btn btn-s btn-viber" href={viberChatLink(r.client.phone)}>Viber</a>
                <a className="btn btn-s btn-wa" href={whatsappLink(r.client.phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <button type="button" className="btn btn-s btn-p primary" onClick={() => onQuote(r)}>{t("pro.makeQuote")}</button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
