import { useState } from "react";
import { CATEGORIES, SERVICES, isCountUnit } from "../../data/catalog.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import { useMediaQuery } from "../../lib/useMediaQuery.js";
import CategoryChips from "../../components/CategoryChips.jsx";

const ALL = CATEGORIES.map((c) => c.id);

export default function Calculator({ qty, market, onQuantity }) {
  const { t, tn, pick, unit, fmt } = useI18n();
  const isMobile = useMediaQuery();
  const [cat, setCat] = useState("all");
  // На телефон категориите са сгънати, за да не се превърта през 40 услуги.
  const [open, setOpen] = useState(() => new Set(isMobile ? [] : ALL));

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const shown = CATEGORIES.filter((c) => isMobile || cat === "all" || c.id === cat);
  const selectedIn = (cid) => SERVICES.filter((s) => s.cat === cid && qty[s.id] > 0);
  const sumIn = (cid) => selectedIn(cid).reduce((a, s) => a + qty[s.id] * market[s.id].avg, 0);

  const step = (s, delta) => {
    const next = Math.max(0, Math.round(((qty[s.id] || 0) + delta) * 10) / 10);
    onQuantity(s.id, next);
  };

  return (
    <div className="stack min0">
      {!isMobile && <CategoryChips value={cat} onChange={setCat} counts={(cid) => selectedIn(cid).length} />}
      <div className="card calc">
        {shown.map((c) => {
          const services = SERVICES.filter((s) => s.cat === c.id);
          const picked = selectedIn(c.id).length;
          const isOpen = open.has(c.id) || (!isMobile && cat !== "all");
          return (
            <section key={c.id} className={"cat" + (isOpen ? " open" : "")}>
              <h3 className="cat-h-wrap">
                <button type="button" className="cat-h" aria-expanded={isOpen} onClick={() => toggle(c.id)}>
                  <span className="cat-name">{pick(c.name)}</span>
                  <span className="cat-meta small">
                    {picked
                      ? <><b>{tn("client.selectedCount", picked)}</b> · {fmt.eur0(sumIn(c.id))}</>
                      : tn("client.servicesCount", services.length)}
                  </span>
                  <svg className="chev" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </h3>
              {isOpen &&
                services.map((s) => {
                  const m = market[s.id];
                  const q = qty[s.id] || 0;
                  const u = unit(s.unit);
                  const name = pick(s.name);
                  return (
                    <div key={s.id} className={"svc" + (q ? " on" : "")}>
                      <div className="min0">
                        <div className="nm">{name}</div>
                        <div className="meta">
                          {m.n
                            ? t("client.priceMeta", { avg: fmt.eur(m.avg), unit: u, min: fmt.eur(m.min), max: fmt.eur(m.max), masters: tn("client.mastersCount", m.n) })
                            : t("client.priceMetaNone", { avg: fmt.eur(m.avg), unit: u })}
                        </div>
                      </div>
                      <div className="qty">
                        <div className="stepper">
                          <button type="button" className="step" aria-label={t("client.decrease", { name })} disabled={!q} onClick={() => step(s, -1)}>−</button>
                          <input
                            className="inp"
                            id={`q-${s.id}`}
                            type="number"
                            min="0"
                            step={isCountUnit(s.unit) ? 1 : 0.5}
                            inputMode="decimal"
                            aria-label={t("client.qtyFor", { name })}
                            placeholder="0"
                            value={q || ""}
                            onChange={(e) => onQuantity(s.id, e.target.value)}
                          />
                          <button type="button" className="step" aria-label={t("client.increase", { name })} onClick={() => step(s, 1)}>+</button>
                        </div>
                        <span className="u">{u}</span>
                        <span className="line-sum">{q ? fmt.eur0(q * m.avg) : ""}</span>
                      </div>
                    </div>
                  );
                })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
