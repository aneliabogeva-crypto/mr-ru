import { useMemo, useState } from "react";
import CitySelect from "../../../components/CitySelect.jsx";
import MobileEstimateBar from "../MobileEstimateBar.jsx";
import Rating from "../../../components/Rating.jsx";
import { Choice, Section } from "../rooms/RoomControls.jsx";
import { SERVICE_BY_ID } from "../../../data/catalog.js";
import {
  CEILING_NOW, FLOOR_NOW, FLOW_DEFAULTS, LIMITS, OPENING_KINDS, REVEAL_MODES, WALLS_NOW,
  flowGeometry, flowServices, floorsNewFor, matchContractors, newOpening, selectedQty, wallsNewFor,
} from "../../../lib/flow/roomFlow.js";
import { canonicalCity, normalizeCity, sameCity } from "../../../lib/cities.js";
import { openConsult } from "../../../lib/consult.js";
import { estimate } from "../../../lib/market.js";
import { initials } from "../../../lib/format.js";
import { phoneDigits, viberChatLink, whatsappLink } from "../../../lib/messaging.js";
import { sendRequest } from "../../../lib/api.js";
import { usePersistentState } from "../../../lib/storage.js";
import { useI18n } from "../../../i18n/I18nProvider.jsx";

const GROUPS = ["ceiling", "walls", "floor", "openings", "extra"];

/**
 * Калкулатор за една стая на един екран:
 * вход (град, размери, отвори, режим „Обръщане“, състояние) → цена → услуги → местни майстори.
 */
export default function RoomFlow({ room, contractors, loading, market, client, onClient, notify }) {
  const { t, tn, pick, unit, fmt } = useI18n();
  const defaults = FLOW_DEFAULTS[room];
  const [saved, setSaved] = usePersistentState(`client.flow.${room}`, defaults);
  const [sort, setSort] = usePersistentState("client.flow.sort", "price");
  const [sendingTo, setSendingTo] = useState(null);
  const [sentTo, setSentTo] = useState([]);

  const c = { ...defaults, ...saved };
  const city = client.city || "";
  /** Промяна във входа нулира ръчно въведените количества, но пази отметките. */
  const setInput = (patch) => {
    const ov = Object.fromEntries(Object.entries(c.overrides || {}).map(([k, v]) => [k, v.on === undefined ? {} : { on: v.on }]));
    setSaved({ ...c, ...patch, overrides: ov });
  };
  const setOverride = (key, patch) => setSaved({ ...c, overrides: { ...c.overrides, [key]: { ...(c.overrides?.[key] || {}), ...patch } } });
  const setOpening = (id, patch) => setInput({ openings: c.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) });

  const g = flowGeometry(c);
  const gA = flowGeometry({ ...c, revealMode: "A" });
  const gB = flowGeometry({ ...c, revealMode: "B" });
  const list = useMemo(() => flowServices(room, c), [room, saved]); // eslint-disable-line react-hooks/exhaustive-deps
  const qty = useMemo(() => selectedQty(list), [list]);
  const est = useMemo(() => estimate(qty, market), [qty, market]);
  const localMatch = useMemo(() => matchContractors(contractors, city, qty, sort), [contractors, city, qty, sort]);
  // Ако в града още няма майстори, показваме майстори от други градове (може да пътуват).
  const otherMatch = useMemo(
    () => (city && !localMatch.localCount ? matchContractors(contractors.filter((x) => !sameCity(x.city, city)), null, qty, sort) : null),
    [contractors, city, qty, sort, localMatch.localCount],
  );
  const fromOther = !!otherMatch && otherMatch.localCount > 0;
  const match = fromOther ? otherMatch : localMatch;
  const nLocal = match.full.length + match.partial.length;
  const chosen = list.filter((a) => a.on && a.qty > 0);
  const diy = list.filter((a) => !a.on && a.suggestedOn);
  const isSofia = normalizeCity(city) === "софия";
  const name = (sid) => pick(SERVICE_BY_ID[sid]?.name);
  const roomName = t(`rooms.${room}`);

  const requireCity = () => {
    if (city) return true;
    document.getElementById("fl-city")?.focus();
    notify(t("assist.errCity"));
    return false;
  };

  const context = () => {
    const dims = c.dimMode === "area" ? t("flow.ctxArea", { floor: fmt.num(g.floor) }) : t("flow.ctxLw", { l: fmt.num(g.l), w: fmt.num(g.w), floor: fmt.num(g.floor) });
    const openings = g.openings.filter((o) => o.n > 0).map((o) => t("flow.openingShort", { kind: t(`flow.kind.${o.kind}`), w: fmt.num(o.w * 100, 0), h: fmt.num(o.h * 100, 0), n: o.n })).join(", ") || "—";
    return (
      t("flow.requestContext", {
        room: roomName, dims, h: fmt.num(g.h), city,
        ceiling: t(`flow.state.${c.ceilingNow}`), walls: t(`flow.state.${c.wallsNow}`),
        floorNow: t(`assist.floorNow.${c.floorNow}`), floorNew: t(`assist.floorNew.${c.floorNew}`),
        openings, mode: t(`flow.mode.${c.revealMode}`), lm: fmt.num(g.reveals),
      }) + (diy.length ? " " + t("assist.diyNote", { list: diy.map((a) => `${name(a.sid)} (${t(`flow.group.${a.group}`).toLowerCase()})`).join(", ") }) : "")
    );
  };

  const send = async (row) => {
    if (!requireCity()) return;
    if (!Object.keys(qty).length) return notify(t("assist.errNone"));
    if (!client.name.trim() || phoneDigits(client.phone).length < 6) {
      document.getElementById(client.name.trim() ? "fl-phone" : "fl-name")?.focus();
      return notify(t("client.errContact"));
    }
    setSendingTo(row.contractor.id);
    try {
      await sendRequest({ contractorId: row.contractor.id, client, items: Object.entries(qty).map(([sid, q]) => ({ sid, qty: q })), comment: context(), custom: "" });
      setSentTo((s) => [...s, row.contractor.id]);
      notify(t("client.sent", { name: row.contractor.name }));
    } catch (e) {
      console.error(e);
      notify(t("client.sendError"));
    } finally {
      setSendingTo(null);
    }
  };

  const toServices = () => {
    if (!requireCity()) return;
    document.getElementById("fl-services")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stateOptions = (states) => states.map((v) => ({ value: v, label: t(`flow.state.${v}`), hint: t(`flow.state.${v}_h`) }));
  const floorNews = floorsNewFor(c.floorNow);

  return (
    <div className="flow">
      <div className="cols">
        <div className="stack">
          {/* Град */}
          <section className={"card pad city-card" + (city ? "" : " need")}>
            <label className="field">
              <span className="city-label">{t("assist.cityLabel")} <span className="req-star">*</span></span>
              <CitySelect id="fl-city" large required value={city} onChange={(v) => onClient({ ...client, city: v })} />
            </label>
            <p className="note">{t("assist.cityNote")}</p>
          </section>

          {/* Размери */}
          <Section id="fl-dims" title={t("flow.secDims")}>
            <div className="seg" role="group" aria-label={t("flow.secDims")}>
              {["lw", "area"].map((m) => (
                <button key={m} type="button" aria-pressed={c.dimMode === m} onClick={() => setInput({ dimMode: m })}>{t(`flow.dimMode.${m}`)}</button>
              ))}
            </div>
            <div className="dims">
              {(c.dimMode === "area" ? ["area", "h"] : ["l", "w", "h"]).map((k) => (
                <label key={k} className="field">
                  <span>{t(`flow.dim_${k}`)}</span>
                  <input id={`fl-${k}`} className="inp" type="number" inputMode="decimal" step={k === "area" ? 0.5 : 0.05} min={LIMITS[k][0]} max={LIMITS[k][1]} value={c[k]} onChange={(e) => setInput({ [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <p className="geo">
              {t("flow.dimsSummary", { floor: fmt.num(g.floor), perimeter: fmt.num(g.perimeter) })}
              {g.approx && <span className="muted"> {t("flow.approx")}</span>}
            </p>
          </Section>

          {/* Прозорци и врати + Обръщане */}
          <Section id="fl-openings" title={t("flow.secOpenings")}>
            <p className="small muted">{t("flow.openingsLead")}</p>
            {c.openings.length === 0 && <p className="small">{t("flow.noOpenings")}</p>}
            <div className="openings">
              {c.openings.map((o) => (
                <div key={o.id} className="opening">
                  <label className="field o-kind">
                    <span>{t("flow.kindLabel")}</span>
                    <select className="inp" value={o.kind} onChange={(e) => setOpening(o.id, { kind: e.target.value })}>
                      {OPENING_KINDS.map((k) => <option key={k} value={k}>{t(`flow.kind.${k}`)}</option>)}
                    </select>
                  </label>
                  {[["w", "ow"], ["h", "oh"], ["n", "n"]].map(([k, lim]) => (
                    <label key={k} className="field">
                      <span>{t(`flow.o_${k}`)}</span>
                      <input className="inp" type="number" inputMode="numeric" min={LIMITS[lim][0]} max={LIMITS[lim][1]} step={1} value={o[k]} onChange={(e) => setOpening(o.id, { [k]: e.target.value })} />
                    </label>
                  ))}
                  <button type="button" className="icon-btn o-del" aria-label={t("flow.remove", { name: t(`flow.kind.${o.kind}`) })} onClick={() => setInput({ openings: c.openings.filter((x) => x.id !== o.id) })}>×</button>
                </div>
              ))}
            </div>
            <div className="row gap8 fwrap">
              {OPENING_KINDS.map((k) => (
                <button key={k} type="button" className="btn btn-s" onClick={() => setInput({ openings: [...c.openings, newOpening(k)] })}>+ {t(`flow.kind.${k}`)}</button>
              ))}
            </div>

            <div className="reveal-key">
              <h4 className="reveal-h"><KeyIcon /> {t("flow.revealTitle")}</h4>
              <div className="choice cols-2" role="radiogroup" aria-label={t("flow.revealTitle")}>
                {REVEAL_MODES.map((m) => {
                  const gm = m === "A" ? gA : gB;
                  return (
                    <label key={m} className={"opt reveal-opt" + (c.revealMode === m ? " on" : "")}>
                      <input type="radio" name="fl-reveal" value={m} checked={c.revealMode === m} onChange={() => setInput({ revealMode: m })} />
                      <span className="opt-body">
                        <span className="opt-label">{t(`flow.reveal.${m}`)}</span>
                        <span className="opt-hint">{t(`flow.reveal.${m}_h`)}</span>
                        <span className="reveal-nums">{t("flow.revealNums", { walls: fmt.num(gm.walls), lm: fmt.num(gm.reveals) })}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="note">{t("flow.revealNote", { gross: fmt.num(g.gross), area: fmt.num(g.openingsArea) })}</p>
            </div>
          </Section>

          {/* Сегашно състояние */}
          <Section id="fl-state" title={t("flow.secState")}>
            <h4 className="sub-h">{t("flow.ceilingNow")}</h4>
            <Choice name="fl-ceiling" value={c.ceilingNow} onChange={(v) => setInput({ ceilingNow: v })} options={stateOptions(CEILING_NOW)} />
            <h4 className="sub-h">{t("flow.wallsNow")}</h4>
            <Choice name="fl-walls" value={c.wallsNow} onChange={(v) => setInput({ wallsNow: v })} options={stateOptions(WALLS_NOW)} />
            {wallsNewFor(room).length > 1 && (
              <>
                <h4 className="sub-h">{t("flow.wallsNewTitle")}</h4>
                <Choice name="fl-walls-new" value={c.wallsNew} onChange={(v) => setInput({ wallsNew: v })} options={wallsNewFor(room).map((v) => ({ value: v, label: t(`flow.wallsNew.${v}`) }))} />
              </>
            )}
            <h4 className="sub-h">{t("flow.floorNow")}</h4>
            <Choice
              name="fl-floor-now"
              value={c.floorNow}
              onChange={(v) => setInput({ floorNow: v, floorNew: v === "parquet" ? "sand" : c.floorNew === "sand" ? (room === "bath" ? "tiles" : "laminate") : c.floorNew })}
              options={FLOOR_NOW.map((v) => ({ value: v, label: t(`assist.floorNow.${v}`) }))}
            />
            <h4 className="sub-h">{t("flow.floorNewTitle")}</h4>
            <Choice name="fl-floor-new" value={floorNews.includes(c.floorNew) ? c.floorNew : "laminate"} onChange={(v) => setInput({ floorNew: v })} options={floorNews.map((v) => ({ value: v, label: t(`assist.floorNew.${v}`) }))} />
          </Section>
          <div>
            <button type="button" className="btn-link" onClick={() => setSaved(defaults)}>{t("flow.reset")}</button>
          </div>
        </div>

        {/* Крайна цена */}
        <aside className="rail" id="estimate">
          <div className="card pad flow-price">
            <span className="label">{t("flow.priceTitle", { room: roomName })}</span>
            {city ? (
              <>
                <div className="total">{fmt.eur0(est.avg)}</div>
                <div className="range">{t("client.range", { min: fmt.eur0(est.min), max: fmt.eur0(est.max) })}</div>
                <p className="small muted">{t("flow.priceBasis", { walls: fmt.num(g.walls), floor: fmt.num(g.floor), lm: fmt.num(g.reveals), mode: t(`flow.mode.${c.revealMode}`) })}</p>
                {!isSofia && <p className="note">{t("assist.sofiaNote", { city })}</p>}
                <OffersPreview rows={[...match.full, ...match.partial].slice(0, 3)} total={Object.keys(qty).length} more={nLocal} city={city} fromOther={fromOther} loading={loading} />
                <button type="button" className="btn btn-p" onClick={toServices}>{nLocal ? tn("flow.toResults", nLocal) : t("flow.toResults")}</button>
              </>
            ) : (
              <p className="need-city">{t("flow.needCity")}</p>
            )}
          </div>
        </aside>
      </div>

      {city && (
        <>
          {/* 1. Нужни услуги */}
          <section id="fl-services" className="stack">
            <div className="stack tight">
              <span className="label">{t("flow.servicesEyebrow")}</span>
              <h2>{t("flow.servicesTitle")}</h2>
              <p className="muted measure">{t("flow.servicesLead")}</p>
            </div>
            {GROUPS.map((grp) => {
              const items = list.filter((a) => a.group === grp);
              if (!items.length) return null;
              const sum = items.filter((a) => a.on).reduce((s, a) => s + a.qty * (market[a.sid]?.avg || 0), 0);
              return (
                <Section key={grp} id={`fl-g-${grp}`} title={t(`flow.group.${grp}`)} total={sum}>
                  <div className="acts">
                    {items.map((a) => {
                      const s = SERVICE_BY_ID[a.sid];
                      return (
                        <div key={a.key} className={"act" + (a.on ? " on" : "")}>
                          <label className="act-main" htmlFor={`fl-on-${grp}-${a.sid}`}>
                            <input id={`fl-on-${grp}-${a.sid}`} type="checkbox" checked={a.on} onChange={(e) => setOverride(a.key, { on: e.target.checked })} />
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
                              className="inp"
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step={s.unit === "pc" || s.unit === "trip" ? 1 : 0.5}
                              aria-label={t("client.qtyFor", { name: pick(s.name) })}
                              value={a.qty}
                              onChange={(e) => setOverride(a.key, { qty: e.target.value === "" ? 0 : Number(e.target.value.replace(",", ".")) })}
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
              </div>
            </div>
          </section>

          {/* 2. Местни майстори */}
          <section id="masters" className="stack masters">
            <div className="row between end fwrap gap12">
              <div className="stack tight">
                <span className="label">{t("flow.mastersEyebrow")}</span>
                <h2>{fromOther ? t("flow.mastersOther") : t("flow.mastersTitle", { city })}</h2>
              </div>
              <div className="seg" role="group" aria-label={t("flow.sortLabel")}>
                {["price", "rating"].map((s) => (
                  <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>{t(`flow.sort.${s}`)}</button>
                ))}
              </div>
            </div>
            <div className="card pad stack">
              <h3 className="small-h">{t("flow.contactTitle")}</h3>
              <div className="grid-f">
                <label className="field"><span>{t("form.name")}</span><input id="fl-name" className="inp" value={client.name} onChange={(e) => onClient({ ...client, name: e.target.value })} autoComplete="name" /></label>
                <label className="field"><span>{t("form.phone")}</span><input id="fl-phone" className="inp" type="tel" value={client.phone} onChange={(e) => onClient({ ...client, phone: e.target.value })} placeholder="+359…" autoComplete="tel" /></label>
              </div>
              <p className="note">{t("client.privacyNote")}</p>
            </div>

            {loading && <div className="card empty">{t("common.loading")}</div>}
            {fromOther && <p className="card pad other-note">{t("flow.noneCityOther", { city })}</p>}
            {!loading && match.full.length === 0 && match.partial.length > 0 && <p className="small muted">{t("flow.partialOnly")}</p>}
            {!loading && match.full.length === 0 && match.partial.length === 0 && (
              <div className="card pad empty-left">
                <p>{match.localCount ? t("assist.noneFull", { city }) : t("assist.noneCity", { city })}</p>
                <div className="row">
                  <button type="button" className="btn promo-mini" onClick={() => openConsult("diy")}>{t("consult.cta")}</button>
                </div>
              </div>
            )}
            <div className="experts">
              {match.full.map((row) => (
                <ExpertCard key={row.contractor.id} row={row} room={roomName} name={name} onSend={send} sending={sendingTo === row.contractor.id} sent={sentTo.includes(row.contractor.id)} />
              ))}
            </div>
            {match.partial.length > 0 && (
              <>
                <h3 className="as-h small-h">{t("assist.partialTitle", { n: match.partial.length })}</h3>
                <div className="experts">
                  {match.partial.map((row) => (
                    <ExpertCard key={row.contractor.id} row={row} room={roomName} name={name} onSend={send} sending={sendingTo === row.contractor.id} sent={sentTo.includes(row.contractor.id)} partial total={Object.keys(qty).length} />
                  ))}
                </div>
              </>
            )}
            <p className="note">{t("client.appsNote")}</p>
          </section>
        </>
      )}
      <MobileEstimateBar est={est} count={chosen.length} />
    </div>
  );
}

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="8" cy="15" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M11 12l8-8M16 7l3 3M14 9l2 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
  </svg>
);

/** Първите оферти в картата с цената, за да се виждат веднага след въвеждането. */
function OffersPreview({ rows, total, more, city, fromOther, loading }) {
  const { t, fmt } = useI18n();
  const go = (id) => {
    const el = document.getElementById(`ex-${id}`) || document.getElementById("masters");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  if (loading) return null;
  if (!rows.length) return <p className="small muted">{t("assist.noneCity", { city })}</p>;
  return (
    <div className="offers-mini">
      <span className="offer-label">{fromOther ? t("flow.offersOther", { city }) : t("flow.offersTitle", { city })}</span>
      {rows.map((r) => (
        <button key={r.contractor.id} type="button" className="offer-mini" onClick={() => go(r.contractor.id)}>
          <span className="min0">
            <span className="om-name">{r.contractor.name}</span>
            <span className="om-meta">
              {fromOther ? `${canonicalCity(r.contractor.city) || r.contractor.city} · ` : ""}
              {r.contractor.reviews > 0 ? `★ ${fmt.num(r.contractor.rating, 1)}` : t("flow.newShort")}
              {r.missing.length ? ` · ${t("assist.covers", { a: r.covered, b: total })}` : ` · ${t("flow.coversAll")}`}
            </span>
          </span>
          <span className="om-price">~{fmt.eur0(r.total)}</span>
        </button>
      ))}
      {more > rows.length && <span className="small muted">{t("flow.moreOffers", { n: more - rows.length })}</span>}
    </div>
  );
}

function ExpertCard({ row, room, name, onSend, sending, sent, partial, total }) {
  const { t, unit, fmt } = useI18n();
  const c = row.contractor;
  const msg = t("flow.waMessage", { person: c.person || c.name, room, list: row.lines.filter((l) => l.price !== null).map((l) => name(l.sid)).join(", "), total: fmt.eur0(row.total) });
  return (
    <article className="card expert" id={`ex-${c.id}`}>
      <div className="expert-top">
        <div className="ava ava-lg" aria-hidden="true">{initials(c.name)}</div>
        <div className="min0">
          <h3>{c.name} {c.demo && <span className="demo">{t("common.demo")}</span>}</h3>
          <Rating c={c} />
          <div className="row gap8">
            <span className="pin-city"><PinIcon /> {canonicalCity(c.city) || c.city}</span>
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
      {partial && row.missing.length > 0 && <p className="small muted">{t("assist.missing", { list: row.missing.map(name).join(", ") })}</p>}
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
