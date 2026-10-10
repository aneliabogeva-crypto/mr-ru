import { useEffect, useRef, useState } from "react";
import { FAQ } from "../data/faq.js";
import { answer } from "../lib/chatbot.js";
import { openConsult } from "../lib/consult.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function Chatbot({ market }) {
  const { t, pick, unit, fmt, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const body = useRef(null);

  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [messages, open]);

  // Лентата с оценката на телефона отваря чата със събитие.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("mrru:open-chat", onOpen);
    return () => window.removeEventListener("mrru:open-chat", onOpen);
  }, []);

  /** Отговор: { text, action }. action „consult“ показва бутон за връзка с майстор. */
  const reply = (text) => {
    const r = answer(text, lang);
    if (r?.type === "price") {
      const m = market[r.service.id];
      return { text: t("chat.priceAnswer", { name: pick(r.service.name), avg: fmt.eur(m.avg), unit: unit(r.service.unit), min: fmt.eur(m.min), max: fmt.eur(m.max) }) };
    }
    if (r?.type === "faq") return { text: pick(r.faq.a), action: r.faq.action };
    return { text: t("chat.fallback"), action: "consult" };
  };

  const ask = (text) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { who: "me", text: q }, { who: "bot", ...reply(q) }]);
  };

  const startConsult = () => {
    setOpen(false);
    openConsult();
  };

  return (
    <>
      <button
        type="button"
        className={"btn btn-p fab" + (open ? " is-open" : "")}
        aria-expanded={open}
        aria-label={open ? t("chat.close") : t("chat.open")}
        onClick={() => setOpen(!open)}
      >
        <svg className="fab-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          ) : (
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          )}
        </svg>
        <span className="fab-label">{open ? t("chat.close") : t("chat.open")}</span>
      </button>
      {open && (
        <section className="card chat" aria-label={t("chat.title")}>
          <div className="chat-h">
            <div>
              <strong>{t("chat.title")}</strong>
              <div className="small muted">{t("chat.subtitle")}</div>
            </div>
            <button type="button" className="btn btn-s" aria-label={t("chat.close")} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-b" ref={body} aria-live="polite">
            <div className="msg bot">{t("chat.welcome")}</div>
            {messages.map((m, i) => (
              <div key={i} className={"msg " + m.who}>
                {m.text}
                {m.action === "consult" && (
                  <button type="button" className="btn btn-s chat-consult" onClick={startConsult}>{t("chat.consultBtn")}</button>
                )}
              </div>
            ))}
          </div>
          <div className="chat-f">
            <div className="chips">
              <button type="button" className="chip chip-consult" onClick={startConsult}>{t("chat.consultChip")}</button>
              {FAQ.slice(1, 8).map((f) => (
                <button type="button" key={f.id} className="chip" onClick={() => ask(pick(f.q))}>{pick(f.q)}</button>
              ))}
            </div>
            <form
              className="row nowrap"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input id="chat-in" className="inp" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("chat.placeholder")} aria-label={t("chat.placeholder")} />
              <button className="btn btn-p" type="submit">{t("chat.send")}</button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
