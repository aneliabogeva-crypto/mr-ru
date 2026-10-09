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

  // Докато лентата се вижда, кръглият бутон на чата е в нея, а не над съдържанието.
  useEffect(() => {
    document.body.classList.toggle("mbar-on", !hidden);
    return () => document.body.classList.remove("mbar-on");
  }, [hidden]);

  const go = () => document.getElementById("estimate")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={"mbar" + (hidden ? " is-hidden" : "")} aria-hidden={hidden}>
      <div className="min0">
        <div className="mbar-total">{fmt.eur0(est.avg)}</div>
        <div className="mbar-sub">
          {count ? `${tn("client.selectedCount", count)} · ${fmt.eur0(est.min)}–${fmt.eur0(est.max)}` : t("client.enterQty")}
        </div>
      </div>
      <div className="mbar-actions">
        <button
          type="button"
          className="btn mbar-chat"
          aria-label={t("chat.open")}
          tabIndex={hidden ? -1 : 0}
          onClick={() => window.dispatchEvent(new Event("mrru:open-chat"))}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="btn btn-a" onClick={go} tabIndex={hidden ? -1 : 0}>
          {t("client.toRequest")}
        </button>
      </div>
    </div>
  );
}
