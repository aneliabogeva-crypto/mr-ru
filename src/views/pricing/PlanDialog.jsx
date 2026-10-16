import { useEffect, useRef, useState } from "react";
import { PLAN_BY_ID, TRIAL_DAYS, yearlyPrice } from "../../lib/plans.js";
import { sendPlanRequest } from "../../lib/api.js";
import { phoneDigits } from "../../lib/messaging.js";
import { usePersistentState } from "../../lib/storage.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

/**
 * Прозорец за заявка на план. Отваря се със събитие „mrru:open-plan“ (openPlan в lib/plans.js).
 * Онлайн плащане още няма: заявката се записва и екипът се свързва с човека.
 */
export default function PlanDialog({ notify }) {
  const { t, fmt } = useI18n();
  const [state, setState] = useState(null); // { plan, billing }
  const [contact, setContact] = usePersistentState("plan.contact", { name: "", email: "", phone: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const panel = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    const onOpen = (e) => {
      if (!PLAN_BY_ID[e.detail?.plan]) return;
      lastFocus.current = document.activeElement;
      setState({ plan: e.detail.plan, billing: e.detail.billing || "monthly" });
      setDone(false);
      setNote("");
    };
    window.addEventListener("mrru:open-plan", onOpen);
    return () => window.removeEventListener("mrru:open-plan", onOpen);
  }, []);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    panel.current?.querySelector("[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [!!state]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setState(null);
    lastFocus.current?.focus?.();
  };

  if (!state) return null;
  const p = PLAN_BY_ID[state.plan];
  const billing = p.kind === "once" ? "once" : state.billing;
  const price =
    billing === "once" ? t("plan.sumOnce", { price: fmt.eur(p.price) })
      : billing === "yearly" ? t("plan.sumYearly", { price: yearlyPrice(p) % 1 ? fmt.eur(yearlyPrice(p)) : fmt.eur0(yearlyPrice(p)) })
        : t("plan.sumMonthly", { price: p.price % 1 ? fmt.eur(p.price) : fmt.eur0(p.price) });

  const field = (k) => (e) => setContact({ ...contact, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!contact.name.trim()) {
      document.getElementById("pl-name")?.focus();
      return notify(t("plan.errName"));
    }
    if (!/\S+@\S+\.\S+/.test(contact.email) && phoneDigits(contact.phone).length < 6) {
      document.getElementById("pl-email")?.focus();
      return notify(t("plan.errContact"));
    }
    setBusy(true);
    try {
      await sendPlanRequest({ plan: p.id, audience: p.audience, billing, ...contact, note });
      setDone(true);
    } catch (err) {
      console.error(err);
      notify(t("plan.sendError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section className="modal-panel plan-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-title" ref={panel}>
        <header className={"modal-h plan-h tone-" + p.id}>
          <div>
            <span className="plan-h-for">{t(`pricing.for.${p.audience}`)}</span>
            <h2 id="plan-title">{t(`plan.${p.id}.name`)}</h2>
            <p className="plan-h-price">{price}{p.trial && billing !== "once" ? ` · ${t("plan.trialNote", { n: TRIAL_DAYS })}` : ""}</p>
          </div>
          <button type="button" className="btn btn-s" aria-label={t("chat.close")} onClick={close}>✕</button>
        </header>
        <div className="modal-b">
          {done ? (
            <div className="stack plan-done">
              <span className="done-badge" aria-hidden="true">✓</span>
              <h3>{t("plan.doneTitle")}</h3>
              <p className="muted">{t("plan.doneText", { plan: t(`plan.${p.id}.name`) })}</p>
              <button type="button" className="btn btn-p" onClick={close} data-autofocus="">{t("plan.close")}</button>
            </div>
          ) : (
            <form className="stack" onSubmit={submit} noValidate>
              <p className="muted">{t("plan.lead")}</p>
              <div className="grid-f">
                <label className="field"><span>{t("form.name")}</span><input id="pl-name" className="inp" value={contact.name} onChange={field("name")} autoComplete="name" data-autofocus="" /></label>
                <label className="field"><span>{t("form.email")}</span><input id="pl-email" className="inp" type="email" value={contact.email} onChange={field("email")} autoComplete="email" /></label>
                <label className="field"><span>{t("form.phone")}</span><input id="pl-phone" className="inp" type="tel" value={contact.phone} onChange={field("phone")} placeholder="+359…" autoComplete="tel" /></label>
              </div>
              <label className="field">
                <span>{t("plan.noteLabel")}</span>
                <textarea className="inp" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(`plan.notePh.${p.audience}`)} />
              </label>
              <p className="note">{t("plan.payNote")}</p>
              <button type="submit" className="btn btn-p plan-submit" disabled={busy}>{busy ? t("client.sending") : t("plan.submit")}</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
