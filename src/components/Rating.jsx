import { useI18n } from "../i18n/I18nProvider.jsx";

/** Звезди 0–5 с половинки. */
function Stars({ value }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="stars" aria-hidden="true">
      <span className="stars-bg">★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

export default function Rating({ c }) {
  const { t, tn, fmt } = useI18n();
  if (!(c.reviews > 0)) return <span className="rating new">{t("flow.noReviews")}</span>;
  return (
    <span className="rating" aria-label={t("flow.ratingAria", { r: fmt.num(c.rating, 1), n: c.reviews })}>
      <Stars value={c.rating} />
      <strong>{fmt.num(c.rating, 1)}</strong>
      <span className="muted">({tn("flow.reviews", c.reviews)})</span>
    </span>
  );
}
