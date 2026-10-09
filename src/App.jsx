import { useMemo } from "react";
import Header from "./components/Header.jsx";
import Toast, { useToast } from "./components/Toast.jsx";
import Chatbot from "./components/Chatbot.jsx";
import ClientView from "./views/client/ClientView.jsx";
import ProView from "./views/pro/ProView.jsx";
import { createSeed } from "./data/seed.js";
import { computeMarket } from "./lib/market.js";
import { usePersistentState } from "./lib/storage.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

export default function App() {
  const { t } = useI18n();
  // Цялото състояние на демото. В продукция: API + база данни.
  const [state, setState] = usePersistentState("state.v1", createSeed);
  const [role, setRole] = usePersistentState("role", "client");
  const [toast, notify] = useToast();

  const market = useMemo(() => computeMarket(state.contractors), [state.contractors]);
  const newRequests = state.requests.filter((r) => r.status === "new").length;

  const resetDemo = () => {
    setState(createSeed());
    notify(t("app.demoRestored"));
  };

  const shared = { state, setState, market, notify };

  return (
    <>
      <Header role={role} onRole={setRole} newRequests={newRequests} />
      <main className="wrap">
        {role === "client" ? <ClientView {...shared} /> : <ProView {...shared} />}
        <p className="note demo-note">
          {t("app.demoNote")}{" "}
          <button type="button" className="btn-link" onClick={resetDemo}>
            {t("app.resetDemo")}
          </button>
        </p>
      </main>
      {role === "client" && <Chatbot market={market} />}
      <Toast message={toast} />
    </>
  );
}
