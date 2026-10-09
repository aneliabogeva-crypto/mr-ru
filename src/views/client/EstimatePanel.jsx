import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function EstimatePanel({
  selected, qty, market, est, client, onClient, comment, onComment, custom, onCustom, onExample, onClear,
}) {
  const { t, pick, unit, fmt } = useI18n();
  const field = (key) => (e) => onClient({ ...client, [key]: e.target.value });

  return (
    <aside className="rail stack" id="estimate">
      <div className="card pad stack">
        <div className="row between">
          <span className="label">{t("client.yourEstimate")}</span>
          <span className="row gap12">
            <button type="button" className="btn-link" onClick={onExample}>{t("client.exampleBath")}</button>
            <button type="button" className="btn-link" onClick={onClear}>{t("client.clear")}</button>
          </span>
        </div>
        <div>
          <div className="total">{fmt.eur0(est.avg)}</div>
          <div className="range">
            {selected.length ? t("client.range", { min: fmt.eur0(est.min), max: fmt.eur0(est.max) }) : t("client.enterQty")}
          </div>
        </div>
        {selected.length > 0 && (
          <div className="lines">
            {selected.map((s) => (
              <div key={s.id}>
                <span title={pick(s.name)}>
                  {pick(s.name)} × {fmt.qty(qty[s.id])} {unit(s.unit)}
                </span>
                <span>{fmt.eur(qty[s.id] * market[s.id].avg)}</span>
              </div>
            ))}
          </div>
        )}
        <hr />
        <span className="label">{t("client.requestDetails")}</span>
        <label className="field">
          <span>{t("form.name")}</span>
          <input id="c-name" className="inp" value={client.name} onChange={field("name")} placeholder={t("form.namePh")} autoComplete="name" />
        </label>
        <div className="row nowrap">
          <label className="field grow">
            <span>{t("form.phone")}</span>
            <input id="c-phone" className="inp" type="tel" value={client.phone} onChange={field("phone")} placeholder="+359…" autoComplete="tel" />
          </label>
          <label className="field grow">
            <span>{t("form.city")}</span>
            <input id="c-city" className="inp" value={client.city} onChange={field("city")} />
          </label>
        </div>
        <label className="field">
          <span>{t("form.emailForQuote")}</span>
          <input id="c-email" className="inp" type="email" value={client.email} onChange={field("email")} autoComplete="email" />
        </label>
        <label className="field">
          <span>{t("client.customService")}</span>
          <input id="c-custom" className="inp" value={custom} onChange={(e) => onCustom(e.target.value)} placeholder={t("client.customPh")} />
        </label>
        <label className="field">
          <span>{t("client.comment")}</span>
          <textarea id="c-comment" className="inp" value={comment} onChange={(e) => onComment(e.target.value)} placeholder={t("client.commentPh")} />
        </label>
        <p className="note">{t("client.privacyNote")}</p>
        <a className="btn btn-p" href="#masters">{t("client.chooseMaster")}</a>
      </div>
    </aside>
  );
}
