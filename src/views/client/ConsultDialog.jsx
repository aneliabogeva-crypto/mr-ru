import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "../../data/catalog.js";
import { CONSULT_SID, CONSULT_TOPICS, offersConsult } from "../../lib/consult.js";
import { initials } from "../../lib/format.js";
import { phoneDigits, viberChatLink, whatsappLink } from "../../lib/messaging.js";
import { sendRequest } from "../../lib/api.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

/**
 * Прозорец „Консултация с майстор“: тема, описание, контакти и списък с
 * майстори, които консултират. Отваря се със събитие „mrru:open-consult“.
 */
export default function ConsultDialog({ contractors, client, onClient, notify }) {
  const { t, pick } = useI18n();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("diy");
  const [details, setDetails] = useState("");
  const [sendingTo, setSendingTo] = useState(null);
  const [sentTo, setSentTo] = useState([]);
  const panel = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    const onOpen = (e) => {
      lastFocus.current = document.activeElement;
      if (e.detail?.topic && CONSULT_TOPICS.includes(e.detail.topic)) setTopic(e.detail.topic);
      setSentTo([]);
      setOpen(true);
    };
    window.addEventListener("mrru:open-consult", onOpen);
    return () => window.removeEventListener("mrru:open-consult", onOpen);
  }, []);

  // Затваряне с Esc, фокус в прозореца, без превъртане на страницата отдолу.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    panel.current?.querySelector("[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setOpen(false);
    lastFocus.current?.focus?.();
  };

  const consultants = useMemo(
    () => contractors.filter(offersConsult).sort((a, b) => a.demo - b.demo || a.name.localeCompare(b.name)),
    [contractors],
  );

  if (!open) return null;

  const field = (key) => (e) => onClient({ ...client, [key]: e.target.value });
  const topicLabel = t(`consult.topic.${topic}`);
  const message = (c) =>
    t("consult.message", { person: c.person || c.name, topic: topicLabel, details: details.trim() ? ` ${details.trim()}` : "" });
  const catName = (id) => pick(CATEGORIES.find((x) => x.id === id)?.name);

  const send = async (c) => {
    if (!client.name.trim() || phoneDigits(client.phone).length < 6) {
      document.getElementById(client.name.trim() ? "cs-phone" : "cs-name")?.focus();
      return notify(t("client.errContact"));
    }
    setSendingTo(c.id);
    try {
      await sendRequest({
        contractorId: c.id,
        client,
        items: [{ sid: CONSULT_SID, topic, qty: 1 }],
        comment: details,
        custom: `${t("consult.requestPrefix")}: ${topicLabel}`,
      });
      setSentTo((s) => [...s, c.id]);
      notify(t("consult.sent", { name: c.name }));
    } catch (e) {
      console.error(e);
      notify(t("client.sendError"));
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section className="modal-panel consult" role="dialog" aria-modal="true" aria-labelledby="consult-title" ref={panel}>
        <header className="modal-h">
          <div>
            <span className="promo-eyebrow">{t("consult.eyebrow")}</span>
            <h2 id="consult-title">{t("consult.title")}</h2>
          </div>
          <button type="button" className="btn btn-s" aria-label={t("chat.close")} onClick={close}>✕</button>
        </header>

        <div className="modal-b stack">
          <p className="muted">{t("consult.lead")}</p>

          <div className="field">
            <span>{t("consult.topicLabel")}</span>
            <div className="chips" role="radiogroup" aria-label={t("consult.topicLabel")}>
              {CONSULT_TOPICS.map((k, i) => (
                <button type="button" key={k} role="radio" aria-checked={topic === k} className="chip" data-autofocus={i === 0 ? "" : undefined} onClick={() => setTopic(k)}>
                  {t(`consult.topic.${k}`)}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>{t("consult.detailsLabel")}</span>
            <textarea id="cs-details" className="inp" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t(`consult.placeholder.${topic}`)} />
          </label>

          <div className="grid-f">
            <label className="field"><span>{t("form.name")}</span><input id="cs-name" className="inp" value={client.name} onChange={field("name")} autoComplete="name" /></label>
            <label className="field"><span>{t("form.phone")}</span><input id="cs-phone" className="inp" type="tel" value={client.phone} onChange={field("phone")} placeholder="+359…" autoComplete="tel" /></label>
            <label className="field"><span>{t("form.email")}</span><input id="cs-email" className="inp" type="email" value={client.email} onChange={field("email")} autoComplete="email" /></label>
            <label className="field"><span>{t("form.city")}</span><input id="cs-city" className="inp" value={client.city} onChange={field("city")} /></label>
          </div>

          <div className="consult-price">
            <strong>{t("consult.priceTitle")}</strong> {t("consult.priceText")}
          </div>

          <h3 className="sub-h">{t("consult.mastersTitle", { n: consultants.length })}</h3>
          {consultants.length === 0 && <div className="card empty">{t("consult.none")}</div>}
          <div className="consultants">
            {consultants.map((c) => {
              const sent = sentTo.includes(c.id);
              return (
                <article key={c.id} className="consultant">
                  <div className="ctr-top">
                    <div className="ava" aria-hidden="true">{initials(c.name)}</div>
                    <div className="min0">
                      <h3>{c.name} {c.demo && <span className="demo">{t("common.demo")}</span>}</h3>
                      <div className="small muted">{[c.person, c.city].filter(Boolean).join(" · ")}</div>
                      <div className="small muted">{c.trades.map(catName).join(", ")}</div>
                    </div>
                  </div>
                  <div className="actions">
                    <a className="btn btn-s btn-viber" href={viberChatLink(c.phone)}>Viber</a>
                    <a className="btn btn-s btn-wa" href={whatsappLink(c.phone, message(c))} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    <button type="button" className="btn btn-s btn-p primary" disabled={sendingTo === c.id || sent} onClick={() => send(c)}>
                      {sent ? t("consult.sentShort") : sendingTo === c.id ? t("client.sending") : t("consult.send")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="note">{t("client.privacyNote")}</p>
        </div>
      </section>
    </div>
  );
}
