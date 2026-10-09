import { createClient } from "@supabase/supabase-js";

// Публичен адрес и публичен (publishable) ключ на проекта. Не са тайна:
// достъпът се пази от правилата (RLS) в supabase/schema.sql.
// Могат да се сменят с VITE_SUPABASE_URL и VITE_SUPABASE_KEY в .env файл.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://udbkecvhkzrkpjcstfmz.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_ty9vF10JeFD84TJDWlnEUA_YWUkBORC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Адресът, към който води линкът за потвърждение в имейла. */
export const appUrl = () => window.location.origin + window.location.pathname;
