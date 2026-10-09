import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Toast, { useToast } from "./components/Toast.jsx";
import Chatbot from "./components/Chatbot.jsx";
import ClientView from "./views/client/ClientView.jsx";
import ProView from "./views/pro/ProView.jsx";
import { listContractors } from "./lib/api.js";
import { computeMarket } from "./lib/market.js";
import { usePersistentState } from "./lib/storage.js";
import { useSession } from "./lib/useSession.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

export default function App() {
  const { t } = useI18n();
  const [role, setRole] = usePersistentState("role", "client");
  const [toast, notify] = useToast();
  const auth = useSession();
  const [contractors, setContractors] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error

  const reloadContractors = useCallback(async () => {
    try {
      setContractors(await listContractors());
      setLoadState("ready");
    } catch (e) {
      console.error(e);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    reloadContractors();
  }, [reloadContractors]);

  // Линкът от имейла (потвърждение или нова парола) отваря кабинета на майстора.
  useEffect(() => {
    if (auth.event === "PASSWORD_RECOVERY" || (auth.event === "SIGNED_IN" && /type=(signup|recovery|magiclink)/.test(window.location.hash))) {
      setRole("pro");
    }
  }, [auth.event, setRole]);

  const market = useMemo(() => computeMarket(contractors), [contractors]);

  return (
    <>
      <Header role={role} onRole={setRole} />
      <main className="wrap">
        {loadState === "error" && (
          <div className="disc error" role="alert">
            <span className="mark" aria-hidden="true">!</span>
            <p>
              {t("app.loadError")}{" "}
              <button type="button" className="btn-link" onClick={reloadContractors}>{t("common.retry")}</button>
            </p>
          </div>
        )}
        {role === "client" ? (
          <ClientView contractors={contractors} loading={loadState === "loading"} market={market} notify={notify} />
        ) : (
          <ProView auth={auth} market={market} notify={notify} onProfileSaved={reloadContractors} />
        )}
        <p className="note demo-note">{t("app.demoNote")}</p>
      </main>
      {role === "client" && <Chatbot market={market} />}
      <Toast message={toast} />
    </>
  );
}
