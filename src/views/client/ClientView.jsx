import { useMemo, useState } from "react";
import Calculator from "./Calculator.jsx";
import EstimatePanel from "./EstimatePanel.jsx";
import ContractorCard from "./ContractorCard.jsx";
import { BATHROOM_EXAMPLE } from "../../data/seed.js";
import { SERVICES } from "../../data/catalog.js";
import { contractorQuote, estimate } from "../../lib/market.js";
import { phoneDigits } from "../../lib/messaging.js";
import { usePersistentState } from "../../lib/storage.js";
import { sendRequest } from "../../lib/api.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const EMPTY_CLIENT = { name: "", phone: "", email: "", city: "" };

export default function ClientView({ contractors, loading, market, notify }) {
  const { t } = useI18n();
  // Чернови на клиента остават в браузъра, докато не изпрати запитване.
  const [qty, setQty] = usePersistentState("client.qty", BATHROOM_EXAMPLE);
  const [client, setClient] = usePersistentState("client.info", EMPTY_CLIENT);
  const [comment, setComment] = usePersistentState("client.comment", "");
  const [custom, setCustom] = usePersistentState("client.custom", "");
  const [sendingTo, setSendingTo] = useState(null);

  const selected = useMemo(() => SERVICES.filter((s) => qty[s.id] > 0), [qty]);
  const est = useMemo(() => estimate(qty, market), [qty, market]);

  const ranked = useMemo(
    () =>
      contractors
        .map((c) => ({ contractor: c, ...contractorQuote(c, qty) }))
        .sort((a, b) => a.contractor.demo - b.contractor.demo || b.offered - a.offered || a.total - b.total),
    [contractors, qty],
  );

  const setQuantity = (id, raw) =>
    setQty((prev) => {
      const next = { ...prev };
      const n = parseFloat(String(raw).replace(",", "."));
      if (n > 0) next[id] = n;
      else delete next[id];
      return next;
    });

  const submit = async (contractor) => {
    if (!selected.length && !custom.trim()) return notify(t("client.errNoItems"));
    if (!client.name.trim() || phoneDigits(client.phone).length < 6) {
      document.getElementById(client.name.trim() ? "c-phone" : "c-name")?.focus();
      return notify(t("client.errContact"));
    }
    setSendingTo(contractor.id);
    try {
      await sendRequest({
        contractorId: contractor.id,
        client,
        items: selected.map((s) => ({ sid: s.id, qty: qty[s.id] })),
        comment,
        custom,
      });
      notify(t("client.sent", { name: contractor.name }));
      setComment("");
      setCustom("");
    } catch (e) {
      console.error(e);
      notify(t("client.sendError"));
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <>
      <section className="intro">
        <span className="label">{t("client.eyebrow")}</span>
        <h1>{t("client.title")}</h1>
        <p className="muted">{t("client.lead")}</p>
      </section>

      <div className="disc" role="note">
        <span className="mark" aria-hidden="true">!</span>
        <p>
          <strong>{t("client.disclaimerTitle")}</strong> {t("client.disclaimer")}
        </p>
      </div>

      <div className="cols">
        <Calculator qty={qty} market={market} onQuantity={setQuantity} />
        <EstimatePanel
          selected={selected}
          qty={qty}
          market={market}
          est={est}
          client={client}
          onClient={setClient}
          comment={comment}
          onComment={setComment}
          custom={custom}
          onCustom={setCustom}
          onExample={() => setQty(BATHROOM_EXAMPLE)}
          onClear={() => setQty({})}
        />
      </div>

      <section id="masters" className="stack masters">
        <div className="stack tight">
          <span className="label">{t("client.mastersEyebrow")}</span>
          <h2>{t("client.mastersTitle")}</h2>
        </div>
        {loading && <div className="card empty">{t("common.loading")}</div>}
        <div className="grid-c">
          {ranked.map((r) => (
            <ContractorCard
              key={r.contractor.id}
              {...r}
              selected={selected}
              qty={qty}
              estimateTotal={est.avg}
              sending={sendingTo === r.contractor.id}
              onSend={() => submit(r.contractor)}
            />
          ))}
        </div>
        <p className="note">{t("client.appsNote")}</p>
      </section>
    </>
  );
}
