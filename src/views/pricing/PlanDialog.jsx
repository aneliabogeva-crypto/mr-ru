import { useEffect, useRef, useState } from "react";
import { PLAN_BY_ID, TRIAL_DAYS, yearlyPrice } from "../../lib/plans.js";
import { METHODS, PAYMENTS, cardLink, methodReady, newReference, revolutLink } from "../../config/payments.js";
import { requestEasyPayCode, sendPlanRequest } from "../../lib/api.js";
import { copyToClipboard, phoneDigits } from "../../lib/messaging.js";
import { usePersistentState } from "../../lib/storage.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

/**
 * Прозорец за план: контакт и начин на плащане (карта, Revolut, банков превод, EasyPay),
 * после указания за плащане с основание MR-XXXXXX, по което се разпознава плащането.
 * Отваря се със събитие „mrru:open-plan“ (openPlan в lib/plans.js).
 */
export default function PlanDialog({ notify }) {
  const { t, fmt } = useI18n();
  const [state, setState] = useState(null); // { plan, billing }
  const [contact, setContact] = usePersistentState("plan.contact", { name: "", email: "", phone: "" });
  const [method, setMethod] = usePersistentState("plan.method", "card");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null); // { reference, method, amount, easypay?: { idn, expires } | { error } }
  const panel = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    const onOpen = (e) => {
      if (!PLAN_BY_ID[e.detail?.plan]) return;
      lastFocus.current = document.activeElement;
      setState({ plan: e.detail.plan, billing: e.detail.billing || "monthly" });
      setOrder(null);
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
  }, [!!state, !!order]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setState(null);
    lastFocus.current?.focus?.();
  };

  if (!state) return null;
  const p = PLAN_BY_ID[state.plan];
  const billing = p.kind === "once" ? "once" : state.billing;
  const planKey = `${p.id}_${billing}`;
  const amount = billing === "once" ? p.price : billing === "yearly" ? yearlyPrice(p) : p.price;
  const money = (n) => (n % 1 ? fmt.eur(n) : fmt.eur0(n));
  const priceLine = t(`plan.sum.${billing}`, { price: money(amount) });
  const trial = !!p.trial && billing !== "once";
  const ready = Object.fromEntries(METHODS.map((m) => [m, methodReady(m, planKey)]));
  const chosen = ready[method] ? method : METHODS.find((m) => ready[m]) || method;
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
    if (!ready[chosen]) return notify(t("pay.errMethod"));
    setBusy(true);
    const reference = newReference();
    try {
      await sendPlanRequest({ plan: p.id, audience: p.audience, billing, ...contact, note, paymentMethod: chosen, reference, amount });
      const next = { reference, method: chosen, amount };
      if (chosen === "easypay" && !trial) {
        try {
          next.easypay = await requestEasyPayCode(reference);
        } catch (err) {
          console.error(err);
          next.easypay = { error: true };
        }
      }
      setOrder(next);
    } catch (err) {
      console.error(err);
      notify(t("plan.sendError"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value) => {
    (await copyToClipboard(value)) ? notify(t("pay.copied")) : notify(value);
  };

  return (
    <div className="modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section className="modal-panel plan-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-title" ref={panel}>
        <header className="modal-h plan-h">
          <div>
            <span className="plan-h-for">{t(`pricing.for.${p.audience}`)}</span>
            <h2 id="plan-title">{t(`plan.${p.id}.name`)}</h2>
            <p className="plan-h-price">{priceLine}{trial ? ` · ${t("plan.trialNote", { n: TRIAL_DAYS })}` : ""}</p>
          </div>
          <button type="button" className="btn btn-s" aria-label={t("chat.close")} onClick={close}>✕</button>
        </header>
        <div className="modal-b">
          {order ? (
            <PayStep order={order} p={p} planKey={planKey} contact={contact} trial={trial} money={money} copy={copy} onClose={close} onBack={() => setOrder(null)} />
          ) : (
            <form className="stack" onSubmit={submit} noValidate>
              <div className="grid-f">
                <label className="field"><span>{t("form.name")}</span><input id="pl-name" className="inp" value={contact.name} onChange={field("name")} autoComplete="name" data-autofocus="" /></label>
                <label className="field"><span>{t("form.email")}</span><input id="pl-email" className="inp" type="email" value={contact.email} onChange={field("email")} autoComplete="email" /></label>
                <label className="field"><span>{t("form.phone")}</span><input id="pl-phone" className="inp" type="tel" value={contact.phone} onChange={field("phone")} placeholder="+359…" autoComplete="tel" /></label>
              </div>

              <fieldset className="pay-methods">
                <legend>{t("pay.methodLabel")}</legend>
                {METHODS.map((m) => (
                  <label key={m} className={"pay-opt" + (chosen === m ? " on" : "") + (ready[m] ? "" : " off")}>
                    <input type="radio" name="pl-method" value={m} checked={chosen === m} disabled={!ready[m]} onChange={() => setMethod(m)} />
                    <PayIcon m={m} />
                    <span className="opt-body">
                      <span className="opt-label">{t(`pay.${m}.name`)}</span>
                      <span className="opt-hint">{ready[m] ? t(`pay.${m}.hint`) : t("pay.notReady")}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <label className="field">
                <span>{t("plan.noteLabel")}</span>
                <textarea className="inp" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(`plan.notePh.${p.audience}`)} />
              </label>
              <button type="submit" className="btn btn-p plan-submit" disabled={busy || !ready[chosen]}>
                {busy ? t("client.sending") : trial ? t("pay.submitTrial", { n: TRIAL_DAYS }) : t("pay.submit", { price: money(amount) })}
              </button>
              <p className="note">{t("pay.secureNote")}</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

/** Указания за плащане след записа на заявката. */
function PayStep({ order, p, planKey, contact, trial, money, copy, onClose, onBack }) {
  const { t } = useI18n();
  const { reference, method, amount } = order;
  const Row = ({ label, value, mono }) => (
    <div className="pay-row">
      <span className="pay-k">{label}</span>
      <span className={"pay-v" + (mono ? " mono" : "")}>{value}</span>
      <button type="button" className="btn btn-s pay-copy" onClick={() => copy(String(value))} aria-label={t("pay.copyAria", { label })}>{t("pay.copy")}</button>
    </div>
  );

  return (
    <div className="stack pay-step">
      <p className="pay-lead">{trial ? t("pay.trialLead", { n: TRIAL_DAYS }) : t(`pay.${method}.lead`)}</p>

      {method === "card" && (
        <a className="btn btn-p plan-submit" href={cardLink(planKey, { email: contact.email, reference })} target="_blank" rel="noopener noreferrer" data-autofocus="">
          {t("pay.card.go", { price: money(amount) })}
        </a>
      )}

      {method === "revolut" && (
        <>
          <a className="btn btn-p plan-submit" href={revolutLink()} target="_blank" rel="noopener noreferrer" data-autofocus="">{t("pay.revolut.go")}</a>
          <div className="pay-box">
            <Row label={t("pay.amount")} value={money(amount)} />
            <Row label={t("pay.reference")} value={reference} mono />
            <Row label={t("pay.revolut.to")} value={`@${PAYMENTS.revolut.tag}`} />
          </div>
        </>
      )}

      {method === "bank" && (
        <div className="pay-box">
          <Row label={t("pay.bank.holder")} value={PAYMENTS.bank.holder} />
          <Row label="IBAN" value={PAYMENTS.bank.iban} mono />
          {PAYMENTS.bank.bic && <Row label="BIC" value={PAYMENTS.bank.bic} mono />}
          {PAYMENTS.bank.bank && <Row label={t("pay.bank.bank")} value={PAYMENTS.bank.bank} />}
          <Row label={t("pay.amount")} value={money(amount)} />
          <Row label={t("pay.reference")} value={reference} mono />
        </div>
      )}

      {method === "easypay" && !trial && (
        order.easypay?.idn ? (
          <div className="pay-box">
            <Row label={t("pay.easypay.code")} value={order.easypay.idn} mono />
            <Row label={t("pay.amount")} value={money(order.easypay.amount ?? amount)} />
            <p className="note">{t("pay.easypay.until", { date: order.easypay.expires })}</p>
          </div>
        ) : (
          <div className="disc error"><span className="mark" aria-hidden="true">!</span><p>{t("pay.easypay.error", { reference })}</p></div>
        )
      )}

      {method !== "card" && <p className="note">{t("pay.referenceNote", { reference })}</p>}
      <p className="note">{t("pay.after", { plan: t(`plan.${p.id}.name`) })}</p>
      <div className="row between">
        <button type="button" className="btn-link" onClick={onBack}>{t("pay.otherMethod")}</button>
        <button type="button" className="btn" onClick={onClose}>{t("plan.close")}</button>
      </div>
    </div>
  );
}

const ICONS = {
  card: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h3",
  revolut: "M7 20V4h6.5a4.5 4.5 0 0 1 0 9H7M12 13l5 7",
  bank: "M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
  easypay: "M4 4h16v16H4zM8 8h3v3H8zM13 8h3M13 11h3M8 14h8M8 17h5",
};

function PayIcon({ m }) {
  return (
    <span className={"pay-ico pay-ico-" + m} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22"><path d={ICONS[m]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}
