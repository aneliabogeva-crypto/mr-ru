import { useState } from "react";
import { CATEGORIES } from "../../data/catalog.js";
import { createContractor, signOut } from "../../lib/api.js";
import { phoneDigits } from "../../lib/messaging.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

/** Първо влизане: майсторът попълва профила си. */
export default function Onboarding({ user, onCreated, notify }) {
  const { t, pick } = useI18n();
  const [form, setForm] = useState({ name: "", person: "", phone: "", email: user.email || "", city: "", trades: [] });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (id) => setForm({ ...form, trades: form.trades.includes(id) ? form.trades.filter((x) => x !== id) : [...form.trades, id] });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify(t("onboard.errName"));
    if (phoneDigits(form.phone).length < 6) return notify(t("onboard.errPhone"));
    if (!form.trades.length) return notify(t("onboard.errTrades"));
    setBusy(true);
    try {
      const c = await createContractor(user.id, {
        name: form.name.trim(),
        person: form.person.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        trades: form.trades,
      });
      notify(t("onboard.created"));
      onCreated(c);
    } catch (err) {
      console.error(err);
      notify(t("pro.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="intro">
        <span className="label">{t("pro.eyebrow")}</span>
        <h1>{t("onboard.title")}</h1>
        <p className="muted">{t("onboard.lead")}</p>
      </section>
      <form className="card pad stack narrow" onSubmit={submit} noValidate>
        <label className="field"><span>{t("pro.fCompany")}</span><input id="ob-name" className="inp" value={form.name} onChange={set("name")} autoComplete="organization" /></label>
        <label className="field"><span>{t("pro.fPerson")}</span><input id="ob-person" className="inp" value={form.person} onChange={set("person")} autoComplete="name" /></label>
        <label className="field"><span>{t("pro.fPhone")}</span><input id="ob-phone" className="inp" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="+359…" /></label>
        <label className="field"><span>{t("pro.fEmail")}</span><input id="ob-email" className="inp" type="email" value={form.email} onChange={set("email")} /></label>
        <label className="field"><span>{t("pro.fCity")}</span><input id="ob-city" className="inp" value={form.city} onChange={set("city")} /></label>
        <div className="field">
          <span>{t("pro.trades")}</span>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} className="chip" aria-pressed={form.trades.includes(c.id)} onClick={() => toggle(c.id)}>
                {pick(c.name)}
              </button>
            ))}
          </div>
        </div>
        <p className="note">{t("onboard.publicNote")}</p>
        <button className="btn btn-p" type="submit" disabled={busy}>{busy ? t("common.wait") : t("onboard.create")}</button>
        <button type="button" className="btn-link" onClick={() => signOut()}>{t("auth.signOut")}</button>
      </form>
    </>
  );
}
