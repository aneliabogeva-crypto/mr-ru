import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider.jsx";

/**
 * Лента най-долу на телефона с текущата оценка. Скрива се, докато
 * панелът с оценката или списъкът с майстори е на екрана.
 */
export default function MobileEstimateBar({ est, count }) {
  const { t, tn, fmt } = useI18n();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const targets = ["estimate", "masters"].map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length || !window.IntersectionObserver) return undefined;
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
        setHidden(visible.size > 0);
      },
      { threshold: 0.15 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = () => document.getElementById("estimate")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={"mbar" + (hidden ? " is-hidden" : "")} aria-hidden={hidden}>
      <div className="min0">
        <div className="mbar-total">{fmt.eur0(est.avg)}</div>
        <div className="mbar-sub">
          {count ? `${tn("client.selectedCount", count)} · ${fmt.eur0(est.min)}–${fmt.eur0(est.max)}` : t("client.enterQty")}
        </div>
      </div>
      <button type="button" className="btn btn-a" onClick={go} tabIndex={hidden ? -1 : 0}>
        {t("client.toRequest")}
      </button>
    </div>
  );
}
