import { useCallback, useEffect, useRef, useState } from "react";
import AuthPanel from "./AuthPanel.jsx";
import Onboarding from "./Onboarding.jsx";
import Requests from "./Requests.jsx";
import PriceList from "./PriceList.jsx";
import Profile from "./Profile.jsx";
import QuoteBuilder from "./QuoteBuilder.jsx";
import { createQuote, quoteNumber } from "../../lib/quote.js";
import { getMyContractor, listMyRequests, setRequestStatus, signOut, updateContractor } from "../../lib/api.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const SAVE_DELAY = 700;

export default function ProView({ auth, market, notify, onProfileSaved }) {
  const { t } = useI18n();
  const user = auth.session?.user;

  if (auth.loading) return <div className="card empty">{t("common.loading")}</div>;
  if (!user || auth.recovery) return <AuthPanel recovery={auth.recovery} onRecoveryDone={auth.clearRecovery} notify={notify} />;
  return <Workspace key={user.id} user={user} market={market} notify={notify} onProfileSaved={onProfileSaved} />;
}

function Workspace({ user, market, notify, onProfileSaved }) {
  const { t, lang } = useI18n();
  const [me, setMe] = useState(undefined); // undefined = зареждане, null = няма профил
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState("requests");
  const [quote, setQuote] = useState(null);
  const [requests, setRequests] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const pending = useRef({});
  const timer = useRef();

  useEffect(() => {
    getMyContractor(user.id)
      .then(setMe)
      .catch((e) => {
        console.error(e);
        setLoadError(true);
      });
  }, [user.id]);

  const loadRequests = useCallback(async () => {
    if (!me) return;
    try {
      setRequests(await listMyRequests(me.id));
    } catch (e) {
      console.error(e);
      notify(t("pro.requestsError"));
    }
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Отложено записване: събира промените и ги праща наведнъж.
  const flush = useCallback(async () => {
    const patch = pending.current;
    pending.current = {};
    if (!me || !Object.keys(patch).length) return;
    setSaveState("saving");
    try {
      await updateContractor(me.id, patch);
      setSaveState("saved");
      onProfileSaved();
    } catch (e) {
      console.error(e);
      setSaveState("error");
      notify(t("pro.saveError"));
    }
  }, [me?.id, onProfileSaved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timer.current), []);

  const updateMe = (fn) =>
    setMe((prev) => {
      const next = fn(prev);
      for (const k of ["name", "person", "phone", "email", "city", "trades", "prices", "quoteSeq"]) {
        if (next[k] !== prev[k]) pending.current[k] = next[k];
      }
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY);
      setSaveState("saving");
      return next;
    });

  if (loadError) return <div className="card empty">{t("pro.loadError")}</div>;
  if (me === undefined) return <div className="card empty">{t("common.loading")}</div>;
  if (me === null) {
    return (
      <Onboarding
        user={user}
        onCreated={(c) => {
          setMe(c);
          onProfileSaved();
          setTab("prices");
        }}
        notify={notify}
      />
    );
  }

  const openQuote = (request) => {
    const seq = me.quoteSeq + 1;
    updateMe((c) => ({ ...c, quoteSeq: seq }));
    if (request?.status === "new") {
      setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, status: "seen" } : r)));
      setRequestStatus(request.id, "seen").catch((e) => console.error(e));
    }
    setQuote(createQuote({ no: quoteNumber(seq), contractor: me, request, lang, defaultNotes: t("quote.defaultNotes") }));
    setTab("quote");
  };

  const changeStatus = async (request, status) => {
    setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, status } : r)));
    try {
      await setRequestStatus(request.id, status);
    } catch (e) {
      console.error(e);
      notify(t("pro.saveError"));
    }
  };

  const newCount = (requests || []).filter((r) => r.status === "new").length;
  const tabs = [
    { id: "requests", label: t("pro.tabRequests", { n: newCount }) },
    { id: "prices", label: t("pro.tabPrices") },
    { id: "quote", label: quote ? t("pro.tabQuoteNo", { no: quote.no }) : t("pro.tabQuote") },
    { id: "profile", label: t("pro.tabProfile") },
  ];

  return (
    <>
      <section className="intro">
        <span className="label">{t("pro.eyebrow")}</span>
        <div className="row between end">
          <h1>{me.name}</h1>
          <div className="row gap12 small muted">
            <span>{user.email}</span>
            <span className={"save-state " + saveState}>{saveState === "idle" ? "" : t(`pro.save_${saveState}`)}</span>
            <button type="button" className="btn btn-s" onClick={() => signOut()}>{t("auth.signOut")}</button>
          </div>
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

      {tab === "requests" && (
        <Requests list={requests} me={me} onQuote={openQuote} onStatus={changeStatus} onRefresh={loadRequests} />
      )}
      {tab === "prices" && <PriceList me={me} updateMe={updateMe} market={market} />}
      {tab === "quote" && quote && <QuoteBuilder quote={quote} setQuote={setQuote} me={me} notify={notify} />}
      {tab === "profile" && <Profile me={me} updateMe={updateMe} />}
    </>
  );
}
