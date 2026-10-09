import { useState } from "react";
import { sendPasswordReset, signIn, signUp, updatePassword } from "../../lib/api.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const MIN_PASSWORD = 8;

/** Вход, регистрация и смяна на парола за майстори. */
export default function AuthPanel({ recovery, onRecoveryDone, notify }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(recovery ? "newPassword" : "signIn"); // signIn | signUp | reset | newPassword
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const errorText = (e) => {
    const m = String(e?.message || "").toLowerCase();
    if (m.includes("invalid login")) return t("auth.errInvalid");
    if (m.includes("not confirmed")) return t("auth.errNotConfirmed");
    if (m.includes("already registered") || m.includes("already been registered")) return t("auth.errExists");
    if (m.includes("rate limit") || e?.status === 429) return t("auth.errRate");
    if (m.includes("password")) return t("auth.errPassword", { n: MIN_PASSWORD });
    return t("auth.errGeneric");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode !== "reset" && password.length < MIN_PASSWORD) return setError(t("auth.errPassword", { n: MIN_PASSWORD }));
    setBusy(true);
    try {
      if (mode === "signIn") await signIn(email.trim(), password);
      if (mode === "signUp") {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) setInfo(t("auth.checkEmail", { email: email.trim() }));
      }
      if (mode === "reset") {
        await sendPasswordReset(email.trim());
        setInfo(t("auth.resetSent", { email: email.trim() }));
      }
      if (mode === "newPassword") {
        await updatePassword(password);
        notify(t("auth.passwordChanged"));
        onRecoveryDone();
      }
    } catch (err) {
      console.error(err);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const titles = { signIn: "auth.signInTitle", signUp: "auth.signUpTitle", reset: "auth.resetTitle", newPassword: "auth.newPasswordTitle" };
  const buttons = { signIn: "auth.signIn", signUp: "auth.signUp", reset: "auth.sendReset", newPassword: "auth.savePassword" };

  return (
    <div className="auth">
      <section className="intro">
        <span className="label">{t("pro.eyebrow")}</span>
        <h1>{t(titles[mode])}</h1>
        {mode === "signUp" && <p className="muted">{t("auth.signUpLead")}</p>}
        {mode === "signIn" && <p className="muted">{t("auth.signInLead")}</p>}
      </section>
      <form className="card pad stack narrow" onSubmit={submit} noValidate>
        {mode !== "newPassword" && (
          <label className="field">
            <span>{t("form.email")}</span>
            <input id="auth-email" className="inp" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        )}
        {mode !== "reset" && (
          <label className="field">
            <span>{mode === "newPassword" ? t("auth.newPassword") : t("auth.password")}</span>
            <input
              id="auth-password"
              className="inp"
              type="password"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              required
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {info && <p className="form-info" role="status">{info}</p>}
        <button className="btn btn-p" type="submit" disabled={busy}>{busy ? t("common.wait") : t(buttons[mode])}</button>
        {mode !== "newPassword" && (
          <div className="row between small">
            {mode === "signIn" ? (
              <button type="button" className="btn-link" onClick={() => setMode("signUp")}>{t("auth.toSignUp")}</button>
            ) : (
              <button type="button" className="btn-link" onClick={() => setMode("signIn")}>{t("auth.toSignIn")}</button>
            )}
            {mode === "signIn" && (
              <button type="button" className="btn-link" onClick={() => setMode("reset")}>{t("auth.forgot")}</button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
