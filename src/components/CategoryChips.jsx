import { CATEGORIES } from "../data/catalog.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

/** Филтър по категории. `counts(id)` по желание показва брояч върху чипа. */
export default function CategoryChips({ value, onChange, counts }) {
  const { t, pick } = useI18n();
  return (
    <div className="chips" role="group" aria-label={t("common.categories")}>
      <button type="button" className="chip" aria-pressed={value === "all"} onClick={() => onChange("all")}>
        {t("common.all")}
      </button>
      {CATEGORIES.map((c) => {
        const n = counts ? counts(c.id) : 0;
        return (
          <button type="button" key={c.id} className="chip" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
            {pick(c.name)}
            {n > 0 && <span className="n">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
