import { useMemo } from "react";
import Calculator from "./Calculator.jsx";
import EstimatePanel from "./EstimatePanel.jsx";
import ContractorCard from "./ContractorCard.jsx";
import { BATHROOM_EXAMPLE } from "../../data/seed.js";
import { SERVICES } from "../../data/catalog.js";
import { contractorQuote, estimate } from "../../lib/market.js";
import { phoneDigits } from "../../lib/messaging.js";
import { usePersistentState } from "../../lib/storage.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const EMPTY_CLIENT = { name: "", phone: "", email: "", city: "" };

export default function ClientView({ state, setState, market, notify }) {
  const { t } = useI18n();
  const [qty, setQty] = usePersistentState("client.qty", BATHROOM_EXAMPLE);
  const [client, setClient] = usePersistentState("client.info", EMPTY_CLIENT);
  const [comment, setComment] = usePersistentState("client.comment", "");
  const [custom, setCustom] = usePersistentState("client.custom", "");

  const selected = useMemo(() => SERVICES.filter((s) => qty[s.id] > 0), [qty]);
  const est = useMemo(() => estimate(qty, market), [qty, market]);

  const ranked = useMemo(
    () =>
      state.contractors
        .map((c) => ({ contractor: c, ...contractorQuote(c, qty) }))
        .sort((a, b) => b.offered - a.offered || a.total - b.total),
    [state.contractors, qty],
  );

  const setQuantity = (id, raw) =>
    setQty((prev) => {
      const next = { ...prev };
      const n = parseFloat(String(raw).replace(",", "."));
      if (n > 0) next[id] = n;
      else delete next[id];
      return next;
    });

  const sendRequest = (contractor) => {
    if (!selected.length && !custom.trim()) return notify(t("client.errNoItems"));
    if (!client.name.trim() || !phoneDigits(client.phone)) {
      document.getElementById("c-name")?.focus();
      return notify(t("client.errContact"));
    }
    const request = {
      id: `r${Date.now()}`,
      to: contractor.id,
      date: new Date().toISOString(),
      status: "new",
      client: { ...client },
      items: selected.map((s) => ({ sid: s.id, qty: qty[s.id] })),
      comment,
      custom,
    };
    setState((s) => ({ ...s, requests: [request, ...s.requests] }));
    notify(t("client.sent", { name: contractor.name }));
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
        <div className="row between end">
          <div className="stack tight">
            <span className="label">{t("client.mastersEyebrow")}</span>
            <h2>{t("client.mastersTitle")}</h2>
          </div>
          <span className="demo">{t("common.sampleProfiles")}</span>
        </div>
        <div className="grid-c">
          {ranked.map((r) => (
            <ContractorCard
              key={r.contractor.id}
              {...r}
              selected={selected}
              qty={qty}
              estimateTotal={est.avg}
              onSend={() => sendRequest(r.contractor)}
            />
          ))}
        </div>
        <p className="note">{t("client.appsNote")}</p>
      </section>
    </>
  );
}
