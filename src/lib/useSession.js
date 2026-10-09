import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

/**
 * Текуща сесия на Supabase Auth.
 * `recovery` е true, когато потребителят е дошъл от линк за нова парола.
 */
export function useSession() {
  const [state, setState] = useState({ session: null, loading: true, recovery: false, event: null });

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState((s) => ({ ...s, session: data.session, loading: false }));
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({
        session,
        loading: false,
        event,
        recovery: event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : s.recovery,
      }));
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const clearRecovery = () => setState((s) => ({ ...s, recovery: false }));
  return { ...state, clearRecovery };
}
