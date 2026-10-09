import { useState } from "react";
import Requests from "./Requests.jsx";
import PriceList from "./PriceList.jsx";
import Profile from "./Profile.jsx";
import QuoteBuilder from "./QuoteBuilder.jsx";
import { createQuote, quoteNumber } from "../../lib/quote.js";
import { usePersistentState } from "../../lib/storage.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function ProView({ state, setState, market, notify }) {
  const { t, lang } = useI18n();
  // Демо: избор на профил вместо вход. В продукция идва от автентикацията.
  const [meId, setMeId] = usePersistentState("pro.me", "c1");
  const [tab, setTab] = useState("requests");
  const [quote, setQuote] = useState(null);

  const me = state.contractors.find((c) => c.id === meId) || state.contractors[0];
  const myRequests = state.requests.filter((r) => r.to === me.id);

  const updateMe = (fn) =>
    setState((s) => ({ ...s, contractors: s.contractors.map((c) => (c.id === me.id ? fn(c) : c)) }));

  const openQuote = (request) => {
    const no = quoteNumber(state.seq + 1);
    setState((s) => ({
      ...s,
      seq: s.seq + 1,
      requests: s.requests.map((r) => (request && r.id === request.id ? { ...r, status: "seen" } : r)),
    }));
    setQuote(createQuote({ no, contractor: me, request, lang, defaultNotes: t("quote.defaultNotes") }));
    setTab("quote");
  };

  const switchProfile = (id) => {
    setMeId(id);
    setQuote(null);
    setTab("requests");
  };

  const tabs = [
    { id: "requests", label: t("pro.tabRequests", { n: myRequests.length }) },
    { id: "prices", label: t("pro.tabPrices") },
    { id: "quote", label: quote ? t("pro.tabQuoteNo", { no: quote.no }) : t("pro.tabQuote") },
    { id: "profile", label: t("pro.tabProfile") },
  ];

  return (
    <>
      <section className="intro">
        <span className="label">{t("pro.eyebrow")}</span>
        <div className="row end gap14">
          <h1>{me.name}</h1>
          <label className="field profile-pick">
            <span>
              {t("pro.loggedInAs")} <span className="demo">{t("common.demo")}</span>
            </span>
            <select id="me" className="inp" value={me.id} onChange={(e) => switchProfile(e.target.value)}>
              {state.contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="tabs" role="tablist">
        {tabs.map((x) => (
          <button
            type="button"
            role="tab"
            key={x.id}
            aria-selected={tab === x.id}
            onClick={() => (x.id === "quote" && !quote ? openQuote(null) : setTab(x.id))}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "requests" && <Requests list={myRequests} me={me} onQuote={openQuote} />}
      {tab === "prices" && <PriceList me={me} updateMe={updateMe} market={market} />}
      {tab === "quote" && quote && <QuoteBuilder quote={quote} setQuote={setQuote} me={me} notify={notify} />}
      {tab === "profile" && <Profile me={me} updateMe={updateMe} />}
    </>
  );
}
