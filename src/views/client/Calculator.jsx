import { Fragment, useState } from "react";
import { CATEGORIES, SERVICES, isCountUnit } from "../../data/catalog.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import CategoryChips from "../../components/CategoryChips.jsx";

export default function Calculator({ qty, market, onQuantity }) {
  const { t, tn, pick, unit, fmt } = useI18n();
  const [cat, setCat] = useState("all");
  const shown = CATEGORIES.filter((c) => cat === "all" || c.id === cat);
  const countIn = (cid) => SERVICES.filter((s) => s.cat === cid && qty[s.id] > 0).length;

  return (
    <div className="stack min0">
      <CategoryChips value={cat} onChange={setCat} counts={countIn} />
      <div className="card">
        {shown.map((c) => {
          const services = SERVICES.filter((s) => s.cat === c.id);
          return (
            <Fragment key={c.id}>
              <div className="cat-h">
                <span>{pick(c.name)}</span>
                <span className="small muted">{tn("client.servicesCount", services.length)}</span>
              </div>
              {services.map((s) => {
                const m = market[s.id];
                const q = qty[s.id] || 0;
                const u = unit(s.unit);
                return (
                  <div key={s.id} className={"svc" + (q ? " on" : "")}>
                    <div className="min0">
                      <div className="nm">{pick(s.name)}</div>
                      <div className="meta">
                        {m.n
                          ? t("client.priceMeta", { avg: fmt.eur(m.avg), unit: u, min: fmt.eur(m.min), max: fmt.eur(m.max), masters: tn("client.mastersCount", m.n) })
                          : t("client.priceMetaNone", { avg: fmt.eur(m.avg), unit: u })}
                      </div>
                    </div>
                    <div className="qty">
                      <input
                        className="inp"
                        id={`q-${s.id}`}
                        type="number"
                        min="0"
                        step={isCountUnit(s.unit) ? 1 : 0.5}
                        inputMode="decimal"
                        aria-label={t("client.qtyFor", { name: pick(s.name) })}
                        placeholder="0"
                        value={q || ""}
                        onChange={(e) => onQuantity(s.id, e.target.value)}
                      />
                      <span className="u">{u}</span>
                    </div>
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
