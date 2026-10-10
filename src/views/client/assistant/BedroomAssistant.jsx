import { useMemo, useState } from "react";
import CitySelect from "../../../components/CitySelect.jsx";
import { Choice, Counter, Section } from "../rooms/RoomControls.jsx";
import { SERVICE_BY_ID } from "../../../data/catalog.js";
import { ASSISTANT_DEFAULT, FLOORS_NOW, SURFACES, activities, floorsNewFor, matchContractors, selectedQty } from "../../../lib/assistant/bedroom.js";
import { LIMITS, dryGeometry } from "../../../lib/rooms/dryRoom.js";
import { normalizeCity } from "../../../lib/cities.js";
import { openConsult } from "../../../lib/consult.js";
import { estimate } from "../../../lib/market.js";
import { initials } from "../../../lib/format.js";
import { phoneDigits, viberChatLink, whatsappLink } from "../../../lib/messaging.js";
import { sendRequest } from "../../../lib/api.js";
import { usePersistentState } from "../../../lib/storage.js";
import { useI18n } from "../../../i18n/I18nProvider.jsx";

const GROUPS = ["walls", "floor", "extra"];

/** Асистент „Спалня“: състояние → дейности → майстори от същия град. */
export default function BedroomAssistant({ contractors, market, client, onClient, notify }) {
  const { t, pick, unit, fmt } = useI18n();
  const [cfg, setCfgRaw] = usePersistentState("client.assistant.bedroom", ASSISTANT_DEFAULT);
  const [step, setStep] = useState(1);
  const [sendingTo, setSendingTo] = useState(null);
  const [sentTo, setSentTo] = useState([]);

  const c = { ...ASSISTANT_DEFAULT, ...cfg };
  /** Промяна в състоянието нулира ръчните корекции на дейностите. */
  const setState = (patch) => setCfgRaw({ ...c, ...patch, overrides: {} });
  const setOverride = (sid, patch) => setCfgRaw({ ...c, overrides: { ...c.overrides, [sid]: { ...(c.overrides?.[sid] || {}), ...patch } } });

  const g = dryGeometry(c);
  const list = useMemo(() => activities(c), [cfg]); // eslint-disable-line react-hooks/exhaustive-deps
  const qty = useMemo(() => selectedQty(list), [list]);
  const est = useMemo(() => estimate(qty, market), [qty, market]);
  const match = useMemo(() => matchContractors(contractors, c, qty), [contractors, cfg, qty]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = list.filter((a) => a.on && a.qty > 0);
  /** Дейности, които системата е предложила, но клиентът ще направи сам. */
  const diy = list.filter((a) => !a.on && a.suggestedOn);
  const isSofia = normalizeCity(c.city) === "софия";
  const name = (sid) => pick(SERVICE_BY_ID[sid]?.name);

  const go = (n) => {
    if (n > 1 && !c.city) {
      document.getElementById("as-city")?.focus();
      return notify(t("assist.errCity"));
    }
    if (n === 3 && !chosen.length) return notify(t("assist.errNone"));
    setStep(n);
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const context = () =>
    t("assist.requestContext", {
      l: fmt.num(g.l), w: fmt.num(g.w), city: c.city,
      surface: t(`assist.surface.${c.surface}`), floorNow: t(`assist.floorNow.${c.floorNow}`), floorNew: t(`assist.floorNew.${c.floorNew}`),
    }) + (diy.length ? " " + t("assist.diyNote", { list: diy.map((a) => name(a.sid)).join(", ") }) : "");

  const send = async (row) => {
    if (!client.name.trim() || phoneDigits(client.phone).length < 6) {
      document.getElementById(client.name.trim() ? "as-phone" : "as-name")?.focus();
      return notify(t("client.errContact"));
    }
    setSendingTo(row.contractor.id);
    try {
      await sendRequest({
        contractorId: row.contractor.id,
        client: { ...client, city: client.city || c.city },
        items: chosen.map((a) => ({ sid: a.sid, qty: a.qty })),
        comment: context(),
        custom: "",
      });
      setSentTo((s) => [...s, row.contractor.id]);
      notify(t("client.sent", { name: row.contractor.name }));
    } catch (e) {
      console.error(e);
      notify(t("client.sendError"));
    } finally {
      setSendingTo(null);
    }
  };

  const steps = [t("assist.step1"), t("assist.step2"), t("assist.step3")];

  return (
    <div className="assistant" id="assistant">
      <ol className="steps" aria-label={t("assist.stepsLabel")}>
        {steps.map((s, i) => (
          <li key={i} className={step === i + 1 ? "on" : step > i + 1 ? "done" : ""}>
            <button type="button" onClick={() => go(i + 1)} aria-current={step === i + 1 ? "step" : undefined}>
              <span className="step-n">{i + 1}</span>
              <span className="step-t">{s}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="stack">
          <section className="card pad city-card">
            <label className="field">
              <span className="city-label">{t("assist.cityLabel")}</span>
              <CitySelect id="as-city" large required value={c.city} onChange={(v) => setCfgRaw({ ...c, city: v })} />
            </label>
            <p className="note">{t("assist.cityNote")}</p>
          </section>

          <Section id="as-dims" title={t("r.secDims")} total={0}>
            <div className="dims">
              {["l", "w", "h"].map((k) => (
                <label key={k} className="field">
                  <span>{t(`r.dim_${k}`)}</span>
                  <input id={`as-${k}`} className="inp" type="number" inputMode="decimal" step="0.05" min={LIMITS[k][0]} max={LIMITS[k][1]} value={c[k]} onChange={(e) => setState({ [k]: e.target.value.replace(",", ".") })} />
                </label>
              ))}
            </div>
            <div className="subopts flush">
              <Counter id="as-doors" value={Number(c.doors) || 0} min={0} max={6} onChange={(v) => setState({ doors: v })} label={t("r.doors")} />
              <Counter id="as-windows" value={Number(c.windows) || 0} min={0} max={6} onChange={(v) => setState({ windows: v })} label={t("r.windows")} />
            </div>
            <p className="geo">{t("r.geo", { floor: fmt.num(g.floor), walls: fmt.num(g.walls), ceiling: fmt.num(g.ceiling) })}</p>
          </Section>

          <Section id="as-surface" title={t("assist.surfaceTitle")} total={0}>
            <Choice name="as-surface" value={c.surface} onChange={(v) => setState({ surface: v })} options={SURFACES.map((v) => ({ value: v, label: t(`assist.surface.${v}`), hint: t(`assist.surface.${v}_h`) }))} />
          </Section>

          <Section id="as-floor" title={t("assist.floorTitle")} total={0}>
            <h4 className="sub-h">{t("assist.floorNowTitle")}</h4>
            <Choice
              name="as-floor-now"
              value={c.floorNow}
              onChange={(v) => setState({ floorNow: v, floorNew: v === "parquet" ? "sand" : c.floorNew === "sand" ? "laminate" : c.floorNew })}
              options={FLOORS_NOW.map((v) => ({ value: v, label: t(`assist.floorNow.${v}`) }))}
            />
            <h4 className="sub-h">{t("assist.floorNewTitle")}</h4>
            <Choice name="as-floor-new" value={c.floorNew} onChange={(v) => setState({ floorNew: v })} options={floorsNewFor(c.floorNow).map((v) => ({ value: v, label: t(`assist.floorNew.${v}`) }))} />
          </Section>

          <div className="step-nav">
            <span />
            <button type="button" className="btn btn-p" onClick={() => go(2)}>{t("assist.next2")}</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <p className="muted measure">{t("assist.step2Lead")}</p>
          {GROUPS.map((grp) => {
            const items = list.filter((a) => a.group === grp);
            if (!items.length) return null;
            const sum = items.filter((a) => a.on).reduce((s, a) => s + a.qty * (market[a.sid]?.avg || 0), 0);
            return (
              <Section key={grp} id={`as-g-${grp}`} title={t(`assist.group.${grp}`)} total={sum}>
                <div className="acts">
                  {items.map((a) => {
                    const s = SERVICE_BY_ID[a.sid];
                    return (
                      <div key={a.sid} className={"act" + (a.on ? " on" : "")}>
                        <label className="act-main" htmlFor={`as-on-${a.sid}`}>
                          <input id={`as-on-${a.sid}`} type="checkbox" checked={a.on} onChange={(e) => setOverride(a.sid, { on: e.target.checked })} />
                          <span className="opt-body">
                            <span className="opt-label">{pick(s.name)}</span>
                            <span className="opt-hint">
                              {a.on ? t("assist.byMaster") : a.suggestedOn ? t("assist.diy") : t("assist.optional")}
                              {" · "}
                              {t("assist.marketUnit", { price: fmt.eur(market[a.sid]?.avg || 0), unit: unit(s.unit) })}
                            </span>
                          </span>
                        </label>
                        <span className="act-qty">
                          <input
                            id={`as-q-${a.sid}`}
                            className="inp"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step={s.unit === "pc" ? 1 : 0.5}
                            aria-label={t("client.qtyFor", { name: pick(s.name) })}
                            value={a.qty}
                            onChange={(e) => setOverride(a.sid, { qty: e.target.value === "" ? 0 : Number(e.target.value.replace(",", ".")) })}
                          />
                          <span className="u">{unit(s.unit)}</span>
                        </span>
                        <span className="act-sum">{a.on ? fmt.eur0(a.qty * (market[a.sid]?.avg || 0)) : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            );
          })}
          <div className="card pad as-total">
            <div>
              <span className="label">{t("assist.marketTotal")}</span>
              <div className="total">{fmt.eur0(est.avg)}</div>
              <div className="range">{t("client.range", { min: fmt.eur0(est.min), max: fmt.eur0(est.max) })}</div>
              {!isSofia && <p className="note">{t("assist.sofiaNote", { city: c.city })}</p>}
            </div>
            <div className="step-nav">
              <button type="button" className="btn" onClick={() => go(1)}>{t("assist.back")}</button>
              <button type="button" className="btn btn-p" onClick={() => go(3)}>{t("assist.next3", { city: c.city })}</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="stack">
          <div className="card pad stack as-summary">
            <div className="row between">
              <span className="pin-city"><PinIcon /> {c.city}</span>
              <button type="button" className="btn-link" onClick={() => go(2)}>{t("assist.editActs")}</button>
            </div>
            <p className="small">{chosen.map((a) => name(a.sid)).join(" · ")}</p>
            {diy.length > 0 && <p className="small muted">{t("assist.diyNote", { list: diy.map((a) => name(a.sid)).join(", ") })}</p>}
            <div className="grid-f">
              <label className="field"><span>{t("form.name")}</span><input id="as-name" className="inp" value={client.name} onChange={(e) => onClient({ ...client, name: e.target.value })} autoComplete="name" /></label>
              <label className="field"><span>{t("form.phone")}</span><input id="as-phone" className="inp" type="tel" value={client.phone} onChange={(e) => onClient({ ...client, phone: e.target.value })} placeholder="+359…" autoComplete="tel" /></label>
            </div>
            <p className="note">{t("client.privacyNote")}</p>
          </div>

          <h2 className="as-h">{t("assist.fullTitle", { n: match.full.length, city: c.city })}</h2>
          {match.full.length === 0 && (
            <div className="card pad empty-left">
              <p>{match.localCount ? t("assist.noneFull", { city: c.city }) : t("assist.noneCity", { city: c.city })}</p>
              <div className="row">
                <button type="button" className="btn" onClick={() => go(2)}>{t("assist.editActs")}</button>
                <button type="button" className="btn promo-mini" onClick={() => openConsult("diy")}>{t("consult.cta")}</button>
              </div>
            </div>
          )}
          <div className="experts">
            {match.full.map((row) => (
              <ExpertCard key={row.contractor.id} row={row} city={c.city} name={name} onSend={send} sending={sendingTo === row.contractor.id} sent={sentTo.includes(row.contractor.id)} />
            ))}
          </div>

          {match.partial.length > 0 && (
            <>
              <h3 className="as-h small-h">{t("assist.partialTitle", { n: match.partial.length })}</h3>
              <div className="experts">
                {match.partial.map((row) => (
                  <ExpertCard key={row.contractor.id} row={row} city={c.city} name={name} onSend={send} sending={sendingTo === row.contractor.id} sent={sentTo.includes(row.contractor.id)} partial total={chosen.length} />
                ))}
              </div>
            </>
          )}
          <div className="step-nav">
            <button type="button" className="btn" onClick={() => go(2)}>{t("assist.back")}</button>
            <span />
          </div>
        </div>
      )}
    </div>
  );
}

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
  </svg>
);

function ExpertCard({ row, city, name, onSend, sending, sent, partial, total }) {
  const { t, unit, fmt } = useI18n();
  const c = row.contractor;
  const msg = t("assist.waMessage", { person: c.person || c.name, list: row.lines.filter((l) => l.price !== null).map((l) => name(l.sid)).join(", "), total: fmt.eur0(row.total) });
  return (
    <article className="card expert">
      <div className="expert-top">
        <div className="ava ava-lg" aria-hidden="true">{initials(c.name)}</div>
        <div className="min0">
          <h3>{c.name} {c.demo && <span className="demo">{t("common.demo")}</span>}</h3>
          <div className="row gap8">
            <span className="pin-city"><PinIcon /> {city}</span>
            {c.experience ? <span className="small muted">{t("assist.experience", { n: c.experience })}</span> : null}
          </div>
        </div>
      </div>
      {c.bio && <p className="expert-bio">{c.bio}</p>}
      <div className="offer">
        <span className="offer-label">{t("assist.offerLabel")}</span>
        <span className="offer-total">~{fmt.eur0(row.total)}</span>
        {partial && <span className="small">{t("assist.covers", { a: row.covered, b: total })}</span>}
      </div>
      {partial && row.missing.length > 0 && (
        <p className="small muted">{t("assist.missing", { list: row.missing.map(name).join(", ") })}</p>
      )}
      <details className="offer-lines">
        <summary>{t("assist.offerDetails")}</summary>
        <div className="lines">
          {row.lines.map((l) => (
            <div key={l.sid}>
              <span title={name(l.sid)}>{name(l.sid)} × {fmt.qty(l.qty)} {unit(SERVICE_BY_ID[l.sid].unit)}</span>
              <span>{l.price === null ? t("quote.negotiableLower") : fmt.eur(l.sum)}</span>
            </div>
          ))}
        </div>
      </details>
      <div className="actions">
        <a className="btn btn-s btn-viber" href={viberChatLink(c.phone)}>Viber</a>
        <a className="btn btn-s btn-wa" href={whatsappLink(c.phone, msg)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <button type="button" className="btn btn-s btn-p primary" disabled={sending || sent} onClick={() => onSend(row)}>
          {sent ? t("consult.sentShort") : sending ? t("client.sending") : t("client.sendRequest")}
        </button>
      </div>
    </article>
  );
}
