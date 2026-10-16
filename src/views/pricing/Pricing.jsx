import { FOUNDER, PLANS, TRIAL_DAYS, ANNUAL_DISCOUNT, openPlan, yearlyPerMonth, yearlyPrice } from "../../lib/plans.js";
import { usePersistentState } from "../../lib/storage.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

/** Страница „Цени“: планове за клиенти и за майстори, годишна отстъпка, отстъпки. */
export default function Pricing() {
  const { t, fmt } = useI18n();
  const [audience, setAudience] = usePersistentState("pricing.audience", "client");
  const [billing, setBilling] = usePersistentState("pricing.billing", "monthly");
  const pct = Math.round(ANNUAL_DISCOUNT * 100);
  const plans = PLANS[audience];
  const money = (n) => (n % 1 ? fmt.eur(n) : fmt.eur0(n));

  return (
    <div className="pricing">
      <section className="intro pricing-intro">
        <h1>{t("pricing.title")}</h1>
        <p className="muted">{t("pricing.lead")}</p>
      </section>

      <div className="pricing-switches">
        <div className="seg seg-lg" role="group" aria-label={t("pricing.audienceLabel")}>
          {["client", "pro"].map((a) => (
            <button key={a} type="button" aria-pressed={audience === a} onClick={() => setAudience(a)}>{t(`pricing.for.${a}`)}</button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t("pricing.billingLabel")}>
          <button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>{t("pricing.monthly")}</button>
          <button type="button" aria-pressed={billing === "yearly"} onClick={() => setBilling("yearly")}>
            {t("pricing.yearly")} <span className="save-tag">−{pct}%</span>
          </button>
        </div>
      </div>

      <div className="plans">
        {plans.map((p) => {
          const yearly = billing === "yearly" && p.kind === "monthly";
          return (
            <article key={p.id} className={"plan plan-" + p.id + (p.featured ? " featured" : "")}>
              {p.featured && <span className="plan-flag">{t(`pricing.flag.${audience}`)}</span>}
              <h2 className="plan-name">{t(`plan.${p.id}.name`)}</h2>
              <p className="plan-for">{t(`plan.${p.id}.for`)}</p>
              <div className="plan-price">
                {p.kind === "free" ? (
                  <span className="amount">{t("pricing.free")}</span>
                ) : (
                  <>
                    <span className="amount">{money(yearly ? yearlyPerMonth(p) : p.price)}</span>
                    <span className="per">{p.kind === "once" ? t("pricing.perProject") : t("pricing.perMonth")}</span>
                  </>
                )}
              </div>
              <p className="plan-note">
                {yearly
                  ? t("pricing.billedYearly", { total: money(yearlyPrice(p)), was: money(Math.round(p.price * 12 * 100) / 100) })
                  : p.kind === "monthly"
                    ? t("pricing.cancelAnytime")
                    : t(`plan.${p.id}.note`)}
              </p>
              <ul className="plan-features">
                {Array.from({ length: p.features }, (_, i) => (
                  <li key={i}><Check /> {t(`plan.${p.id}.f${i + 1}`)}</li>
                ))}
              </ul>
              {p.kind === "free" ? (
                <a className="btn plan-cta" href="#top" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("mrru:go", { detail: audience === "pro" ? "pro" : "client" })); }}>
                  {t(`plan.${p.id}.cta`)}
                </a>
              ) : (
                <button type="button" className={"btn plan-cta" + (p.featured ? " btn-p" : "")} onClick={() => openPlan(p.id, p.kind === "once" ? "once" : billing)}>
                  {p.trial ? t("pricing.trial", { n: TRIAL_DAYS }) : t(`plan.${p.id}.cta`)}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <section className="deals" aria-labelledby="deals-title">
        <h2 id="deals-title">{t("pricing.dealsTitle")}</h2>
        <div className="deal-grid">
          <Deal tone="butter" big={`−${pct}%`} title={t("deal.yearly.title")} text={t("deal.yearly.text", { pct })} />
          {audience === "pro" ? (
            <>
              <Deal tone="lilac" big={`${TRIAL_DAYS}`} title={t("deal.trial.title", { n: TRIAL_DAYS })} text={t("deal.trial.text")} />
              <Deal tone="sage" big={`−${FOUNDER.pct}%`} title={t("deal.founder.title")} text={t("deal.founder.text", { seats: FOUNDER.seats, pct: FOUNDER.pct, months: FOUNDER.months })} />
              <Deal tone="blush" big="+1" title={t("deal.referral.title")} text={t("deal.referral.text")} />
            </>
          ) : (
            <>
              <Deal tone="lilac" big="0 €" title={t("deal.upgrade.title")} text={t("deal.upgrade.text")} />
              <Deal tone="sage" big="14" title={t("deal.refund.title")} text={t("deal.refund.text")} />
              <Deal tone="blush" big="+1" title={t("deal.friend.title")} text={t("deal.friend.text")} />
            </>
          )}
        </div>
      </section>

      <section className="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">{t("pricing.faqTitle")}</h2>
        {[1, 2, 3, 4].map((i) => (
          <details key={i} className="faq-item">
            <summary>{t(`pricing.q${i}`)}</summary>
            <p>{t(`pricing.a${i}`)}</p>
          </details>
        ))}
      </section>
    </div>
  );
}

const Check = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="ck">
    <circle cx="10" cy="10" r="9" fill="currentColor" opacity=".16" />
    <path d="M6 10.2l2.6 2.6L14 7.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Deal({ tone, big, title, text }) {
  return (
    <article className={"deal tone-" + tone}>
      <span className="deal-big">{big}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
