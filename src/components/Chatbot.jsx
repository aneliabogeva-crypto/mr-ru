import { useEffect, useRef, useState } from "react";
import { FAQ } from "../data/faq.js";
import { answer } from "../lib/chatbot.js";
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

  const reply = (text) => {
    const r = answer(text, lang);
    if (r?.type === "price") {
      const m = market[r.service.id];
      return t("chat.priceAnswer", { name: pick(r.service.name), avg: fmt.eur(m.avg), unit: unit(r.service.unit), min: fmt.eur(m.min), max: fmt.eur(m.max) });
    }
    if (r?.type === "faq") return pick(r.faq.a);
    return t("chat.fallback");
  };

  const ask = (text) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { who: "me", text: q }, { who: "bot", text: reply(q) }]);
  };

  return (
    <>
      <button type="button" className="btn btn-p fab" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? t("chat.close") : t("chat.open")}
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
              <div key={i} className={"msg " + m.who}>{m.text}</div>
            ))}
          </div>
          <div className="chat-f">
            <div className="chips">
              {FAQ.slice(0, 8).map((f) => (
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
