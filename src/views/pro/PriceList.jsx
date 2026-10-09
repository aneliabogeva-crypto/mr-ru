import { useState } from "react";
import { CATEGORIES, SERVICES, priceOf } from "../../data/catalog.js";
import CategoryChips from "../../components/CategoryChips.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function PriceList({ me, updateMe, market }) {
  const { t, pick, unit, fmt } = useI18n();
  const [cat, setCat] = useState("all");
  const setPrice = (sid, patch) =>
    updateMe((c) => ({ ...c, prices: { ...c.prices, [sid]: { ...priceOf(c, sid), ...patch } } }));
  const offered = SERVICES.filter((s) => !priceOf(me, s.id).off).length;
  const catName = (id) => pick(CATEGORIES.find((c) => c.id === id)?.name);

  return (
    <div className="stack">
      <p className="muted measure">{t("pro.pricesLead")}</p>
      <div className="row between">
        <CategoryChips value={cat} onChange={setCat} />
        <span className="small muted">{t("pro.offeredCount", { a: offered, b: SERVICES.length })}</span>
      </div>
      <div className="card tbl-wrap">
        <table className="tbl-cards price-tbl">
          <thead>
            <tr>
              <th>{t("pro.colService")}</th>
              <th>{t("pro.colUnit")}</th>
              <th className="num">{t("pro.colYourPrice")}</th>
              <th />
              <th className="num">{t("pro.colMarket")}</th>
              <th className="num">{t("pro.colDiff")}</th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.filter((s) => cat === "all" || s.cat === cat).map((s) => {
              const p = priceOf(me, s.id);
              const m = market[s.id];
              const diff = p.off ? null : ((p.price - m.avg) / m.avg) * 100;
              const tone = diff === null ? "" : diff > 10 ? "warn" : diff < -10 ? "ok" : "";
              return (
                <tr key={s.id} className={p.off ? "off" : ""}>
                  <td className="w-name c-name">
                    {pick(s.name)}
                    <div className="small muted">{catName(s.cat)}</div>
                  </td>
                  <td className="c-unit">{unit(s.unit)}</td>
                  <td className="num c-price" data-label={`${t("pro.colYourPrice")} / ${unit(s.unit)}`}>
                    {p.off ? (
                      <span className="pill neg">{t("common.negotiable")}</span>
                    ) : (
                      <input
                        id={`p-${s.id}`}
                        className="inp w-price"
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        aria-label={t("pro.priceFor", { name: pick(s.name) })}
                        value={p.price}
                        onChange={(e) => setPrice(s.id, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                      />
                    )}
                  </td>
                  <td className="c-off">
                    <label className="sw">
                      <input id={`o-${s.id}`} type="checkbox" checked={p.off} onChange={(e) => setPrice(s.id, { off: e.target.checked })} />
                      {t("pro.notOffered")}
                    </label>
                  </td>
                  <td className="num c-market" data-label={t("pro.colMarket")}>{fmt.eur(m.avg)}</td>
                  <td className="num c-diff">
                    {diff === null ? "—" : <span className={"pill " + tone}>{diff > 0 ? "+" : ""}{fmt.pct(diff)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
