import { useMemo, useState } from "react";
import Calculator from "./Calculator.jsx";
import EstimatePanel from "./EstimatePanel.jsx";
import ContractorCard from "./ContractorCard.jsx";
import MobileEstimateBar from "./MobileEstimateBar.jsx";
import RoomPicker from "./rooms/RoomPicker.jsx";
import BathroomConfigurator from "./rooms/BathroomConfigurator.jsx";
import { BATHROOM_EXAMPLE } from "../../data/seed.js";
import { SERVICES } from "../../data/catalog.js";
import { BATH_DEFAULT, bathroomLines, geometry, linesToQty } from "../../lib/rooms/bathroom.js";
import { contractorQuote, estimate } from "../../lib/market.js";
import { phoneDigits } from "../../lib/messaging.js";
import { usePersistentState } from "../../lib/storage.js";
import { sendRequest } from "../../lib/api.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const EMPTY_CLIENT = { name: "", phone: "", email: "", city: "" };

export default function ClientView({ contractors, loading, market, notify }) {
  const { t, fmt } = useI18n();
  // Чернови на клиента остават в браузъра, докато не изпрати запитване.
  const [mode, setMode] = usePersistentState("client.mode", "rooms"); // rooms | services
  const [room, setRoom] = usePersistentState("client.room", "bath");
  const [bath, setBath] = usePersistentState("client.bath", BATH_DEFAULT);
  const [serviceQty, setServiceQty] = usePersistentState("client.qty", BATHROOM_EXAMPLE);
  const [client, setClient] = usePersistentState("client.info", EMPTY_CLIENT);
  const [comment, setComment] = usePersistentState("client.comment", "");
  const [custom, setCustom] = usePersistentState("client.custom", "");
  const [sendingTo, setSendingTo] = useState(null);

  const bathCfg = useMemo(() => ({ ...BATH_DEFAULT, ...bath }), [bath]);
  const roomQty = useMemo(() => linesToQty(bathroomLines(bathCfg)), [bathCfg]);
  const qty = mode === "rooms" ? roomQty : serviceQty;

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
    setServiceQty((prev) => {
      const next = { ...prev };
      const n = parseFloat(String(raw).replace(",", "."));
      if (n > 0) next[id] = n;
      else delete next[id];
      return next;
    });

  /** Прехвърля количествата от помещението в подробния калкулатор. */
  const editAsServices = () => {
    setServiceQty(roomQty);
    setMode("services");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const roomContext = () => {
    const g = geometry(bathCfg);
    return t("bath.requestContext", { l: fmt.num(g.l), w: fmt.num(g.w), h: fmt.num(g.h), floor: fmt.num(g.floor) });
  };

  const submit = async (contractor) => {
    if (!selected.length && !custom.trim()) return notify(t("client.errNoItems"));
    if (!client.name.trim() || phoneDigits(client.phone).length < 6) {
      document.getElementById(client.name.trim() ? "c-phone" : "c-name")?.focus();
      return notify(t("client.errContact"));
    }
    setSendingTo(contractor.id);
    try {
      const fullComment = mode === "rooms" ? [roomContext(), comment.trim()].filter(Boolean).join("\n") : comment;
      await sendRequest({
        contractorId: contractor.id,
        client,
        items: selected.map((s) => ({ sid: s.id, qty: qty[s.id] })),
        comment: fullComment,
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
        <h1>{t(mode === "rooms" ? "rooms.title" : "client.title")}</h1>
        <p className="muted">{t(mode === "rooms" ? "rooms.lead" : "client.lead")}</p>
      </section>

      <div className="seg mode-seg" role="group" aria-label={t("rooms.modeLabel")}>
        <button type="button" aria-pressed={mode === "rooms"} onClick={() => setMode("rooms")}>{t("rooms.modeRooms")}</button>
        <button type="button" aria-pressed={mode === "services"} onClick={() => setMode("services")}>{t("rooms.modeServices")}</button>
      </div>

      <div className="disc" role="note">
        <span className="mark" aria-hidden="true">!</span>
        <p>
          <strong>{t("client.disclaimerTitle")}</strong> {t("client.disclaimer")}
        </p>
      </div>

      {mode === "rooms" && <RoomPicker value={room} onChange={setRoom} />}

      <div className="cols">
        {mode === "rooms" ? (
          <BathroomConfigurator cfg={bathCfg} setCfg={setBath} market={market} />
        ) : (
          <Calculator qty={serviceQty} market={market} onQuantity={setQuantity} />
        )}
        <EstimatePanel
          title={mode === "rooms" ? t("rooms.estimateTitle", { room: t(`rooms.${room}`) }) : undefined}
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
          onExample={mode === "services" ? () => setServiceQty(BATHROOM_EXAMPLE) : undefined}
          onClear={mode === "services" ? () => setServiceQty({}) : undefined}
          onReset={mode === "rooms" ? () => setBath(BATH_DEFAULT) : undefined}
          onEditServices={mode === "rooms" ? editAsServices : undefined}
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
      <MobileEstimateBar est={est} count={selected.length} />
    </>
  );
}
