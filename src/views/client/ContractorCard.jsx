import { CATEGORIES, SERVICE_BY_ID } from "../../data/catalog.js";
import { initials } from "../../lib/format.js";
import { viberChatLink, whatsappLink } from "../../lib/messaging.js";
import Rating from "../../components/Rating.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function ContractorCard({ contractor: c, total, offered, negotiable, selected, qty, estimateTotal, onSend, sending }) {
  const { t, pick, unit, fmt } = useI18n();
  const catName = (id) => pick(CATEGORIES.find((x) => x.id === id)?.name);

  const items = selected.slice(0, 6).map((s) => `${pick(s.name)} – ${fmt.qty(qty[s.id])} ${unit(s.unit)}`).join("; ");
  const waText = t("client.waGreeting", {
    person: c.person,
    items: items + (selected.length > 6 ? t("client.andMore") : ""),
    total: fmt.eur0(estimateTotal),
  });

  return (
    <article className="card ctr">
      <div className="ctr-top">
        <div className="ava" aria-hidden="true">{initials(c.name)}</div>
        <div className="min0">
          <h3>
            {c.name} {c.demo && <span className="demo">{t("common.demo")}</span>}
          </h3>
          <Rating c={c} />
          <div className="small muted">{c.person} · {c.city}</div>
        </div>
      </div>
      <div className="chips">
        {c.trades.map((tr) => <span key={tr} className="pill">{catName(tr)}</span>)}
      </div>

      {selected.length > 0 && (
        <div className="stack tight">
          <div className="row between">
            <span className="small">{t("client.covers", { a: offered, b: selected.length })}</span>
            <strong>{offered ? fmt.eur0(total) : "—"}</strong>
          </div>
          <div className="bar"><i style={{ width: `${(offered / selected.length) * 100}%` }} /></div>
          {negotiable.length > 0 && (
            <div className="small muted">
              <span className="pill neg">{t("common.negotiable")}</span>{" "}
              {negotiable.slice(0, 3).map((sid) => pick(SERVICE_BY_ID[sid].name)).join(", ")}
              {negotiable.length > 3 && t("client.andN", { n: negotiable.length - 3 })}
            </div>
          )}
        </div>
      )}

      <div className="phone muted">{c.phone}</div>
      <div className="actions">
        <a className="btn btn-s btn-viber" href={viberChatLink(c.phone)}>Viber</a>
        <a className="btn btn-s btn-wa" href={whatsappLink(c.phone, waText)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <button type="button" className="btn btn-s btn-p primary" onClick={onSend} disabled={sending}>
          {sending ? t("client.sending") : t("client.sendRequest")}
        </button>
      </div>
    </article>
  );
}
