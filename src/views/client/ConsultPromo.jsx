import { openConsult } from "../../lib/consult.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const POINTS = ["diy", "materials", "plan", "offer"];

/** Открояващ се модул на началния екран: консултации с майстор. */
export default function ConsultPromo() {
  const { t } = useI18n();
  return (
    <section className="promo" aria-labelledby="promo-title">
      <div className="promo-text">
        <span className="promo-eyebrow">{t("consult.eyebrow")}</span>
        <h2 id="promo-title">{t("consult.promoTitle")}</h2>
        <p className="promo-lead">{t("consult.promoLead")}</p>
        <ul className="promo-points">
          {POINTS.map((p) => (
            <li key={p}>
              <button type="button" className="promo-point" onClick={() => openConsult(p)}>
                {t(`consult.topic.${p}`)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="promo-cta">
        <button type="button" className="btn promo-btn" onClick={() => openConsult()}>
          {t("consult.cta")}
        </button>
        <p className="promo-price">{t("consult.priceNote")}</p>
      </div>
    </section>
  );
}
