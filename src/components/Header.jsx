import { LANGUAGES, useI18n } from "../i18n/I18nProvider.jsx";

export default function Header({ role, onRole, newRequests }) {
  const { t, lang, setLang } = useI18n();
  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <div className="brand">
          <span className="logo">
            Mr<i>.</i>
            <b>Ru</b>
          </span>
          <span className="tag">{t("brand.tagline")}</span>
        </div>
        <div className="seg" role="group" aria-label={t("header.mode")}>
          <button type="button" aria-pressed={role === "client"} onClick={() => onRole("client")}>
            {t("header.client")}
          </button>
          <button type="button" aria-pressed={role === "pro"} onClick={() => onRole("pro")}>
            {t("header.pro")}
            {newRequests > 0 && <span className="badge">{newRequests}</span>}
          </button>
        </div>
        <div className="seg seg-sm" role="group" aria-label={t("header.language")}>
          {LANGUAGES.map((l) => (
            <button type="button" key={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tape" aria-hidden="true" />
    </header>
  );
}
