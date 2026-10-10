import { CITIES, canonicalCity } from "../lib/cities.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

/** Падащо меню с градовете. Стойност извън списъка се показва като опция. */
export default function CitySelect({ id, value, onChange, className = "inp", required, large }) {
  const { t } = useI18n();
  const current = value ? canonicalCity(value) : "";
  const options = current && !CITIES.includes(current) ? [current, ...CITIES] : CITIES;
  return (
    <select id={id} className={className + (large ? " city-lg" : "")} value={current} required={required} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>{t("city.pick")}</option>
      {options.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
