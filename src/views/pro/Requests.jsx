import { SERVICE_BY_ID } from "../../data/catalog.js";
import { viberChatLink, whatsappLink } from "../../lib/messaging.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function Requests({ list, me, onQuote }) {
  const { t, tn, pick, unit, fmt } = useI18n();

  if (!list.length) {
    return (
      <div className="card empty">
        {t("pro.noRequests", { name: me.name })}
        <div className="mt12">
          <button type="button" className="btn btn-p" onClick={() => onQuote(null)}>{t("pro.newQuote")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row end-x">
        <button type="button" className="btn" onClick={() => onQuote(null)}>{t("pro.newQuoteNoRequest")}</button>
      </div>
      {list.map((r) => {
        const negotiable = r.items.filter((it) => me.prices[it.sid]?.off).length;
        const own = r.items.reduce((a, it) => {
          const p = me.prices[it.sid];
          return a + (p && !p.off ? p.price * it.qty : 0);
        }, 0);
        const isNew = r.status === "new";
        return (
          <article key={r.id} className="card req">
            <div className="q-head">
              <div>
                <h3>
                  {r.client.name} {r.demo && <span className="demo">{t("common.example")}</span>}
                </h3>
                <div className="small muted">{fmt.date(r.date)} · {r.client.city || "—"} · {r.client.phone}</div>
              </div>
              <span className={"pill " + (isNew ? "warn" : "ok")}>{isNew ? t("pro.statusNew") : t("pro.statusSeen")}</span>
            </div>
            <div className="small">
              {r.items.map((it) => `${pick(SERVICE_BY_ID[it.sid].name)} – ${fmt.qty(it.qty)} ${unit(SERVICE_BY_ID[it.sid].unit)}`).join(" · ")}
            </div>
            {r.custom && <div className="small"><strong>{t("pro.customService")}:</strong> {r.custom}</div>}
            {r.comment && <div className="small muted">„{r.comment}“</div>}
            <div className="row between">
              <div className="small">
                {t("pro.byYourPrices")}: <strong>{fmt.eur(own)}</strong>
                {negotiable > 0 && <> · <span className="pill neg">{tn("pro.negotiableCount", negotiable)}</span></>}
              </div>
              <div className="row">
                <a className="btn btn-s btn-viber" href={viberChatLink(r.client.phone)}>Viber</a>
                <a className="btn btn-s btn-wa" href={whatsappLink(r.client.phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <button type="button" className="btn btn-s btn-p" onClick={() => onQuote(r)}>{t("pro.makeQuote")}</button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
