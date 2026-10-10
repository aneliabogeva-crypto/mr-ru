import { CATEGORIES } from "../../data/catalog.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import { CONSULT_SID, offersConsult } from "../../lib/consult.js";

const FIELDS = [
  { key: "name", label: "pro.fCompany" },
  { key: "person", label: "pro.fPerson" },
  { key: "phone", label: "pro.fPhone", type: "tel" },
  { key: "email", label: "pro.fEmail", type: "email" },
  { key: "city", label: "pro.fCity" },
];

export default function Profile({ me, updateMe }) {
  const { t, pick } = useI18n();
  const toggleTrade = (id) =>
    updateMe((c) => ({ ...c, trades: c.trades.includes(id) ? c.trades.filter((x) => x !== id) : [...c.trades, id] }));

  return (
    <div className="card pad stack narrow">
      <p className="muted">{t("pro.profileLead")}</p>
      {FIELDS.map((f) => (
        <label key={f.key} className="field">
          <span>{t(f.label)}</span>
          <input
            id={`pf-${f.key}`}
            className="inp"
            type={f.type || "text"}
            value={me[f.key]}
            onChange={(e) => updateMe((c) => ({ ...c, [f.key]: e.target.value }))}
          />
        </label>
      ))}
      <label className="tog consult-tog" htmlFor="pf-consult">
        <input
          id="pf-consult"
          type="checkbox"
          checked={offersConsult(me)}
          onChange={(e) => updateMe((c) => ({ ...c, prices: { ...c.prices, [CONSULT_SID]: { price: 0, off: !e.target.checked } } }))}
        />
        <span className="opt-body">
          <span className="opt-label">{t("consult.proToggle")}</span>
          <span className="opt-hint">{t("consult.proToggleHint")}</span>
        </span>
      </label>
      <div className="field">
        <span>{t("pro.trades")}</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} className="chip" aria-pressed={me.trades.includes(c.id)} onClick={() => toggleTrade(c.id)}>
              {pick(c.name)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
