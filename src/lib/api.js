// Достъп до базата (Supabase). Всички функции хвърлят грешка при неуспех.
import { appUrl, supabase } from "./supabase.js";
import { defaultPrices } from "../data/catalog.js";

const BASE_COLUMNS = "id,user_id,name,person,phone,email,city,trades,prices,is_demo,quote_seq";
/** Колони от supabase/2026-10-10-contractor-profile.sql. Без тях приложението пак работи. */
const PROFILE_COLUMNS = ["bio", "experience_years"];
let hasProfileColumns = true;
const columns = () => (hasProfileColumns ? `${BASE_COLUMNS},${PROFILE_COLUMNS.join(",")}` : BASE_COLUMNS);
const isMissingColumn = (e) => e && (e.code === "42703" || e.code === "PGRST204" || /column/i.test(e.message || ""));

/** Изпълнява заявка; ако новите колони липсват в базата, повтаря без тях. */
async function withColumns(run) {
  const res = await run(columns());
  if (res.error && hasProfileColumns && isMissingColumn(res.error)) {
    hasProfileColumns = false;
    return run(columns());
  }
  return res;
}

const toContractor = (r) => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  person: r.person,
  phone: r.phone,
  email: r.email,
  city: r.city,
  trades: r.trades || [],
  prices: r.prices || {},
  demo: r.is_demo,
  quoteSeq: r.quote_seq || 0,
  bio: r.bio || "",
  experience: r.experience_years ?? null,
});

const toRequest = (r) => ({
  id: r.id,
  to: r.contractor_id,
  date: r.created_at,
  status: r.status,
  client: { name: r.client_name, phone: r.client_phone, email: r.client_email, city: r.client_city },
  items: r.items || [],
  comment: r.comment,
  custom: r.custom,
});

/** Полетата на профила, които майсторът може да редактира. */
const EDITABLE = { name: "name", person: "person", phone: "phone", email: "email", city: "city", trades: "trades", prices: "prices", quoteSeq: "quote_seq", bio: "bio", experience: "experience_years" };

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// ─── Майстори ──────────────────────────────────────────────────────────────
export async function listContractors() {
  const rows = unwrap(await withColumns((cols) => supabase.from("contractors").select(cols).order("is_demo").order("created_at")));
  return rows.map(toContractor);
}

export async function getMyContractor(userId) {
  const row = unwrap(await withColumns((cols) => supabase.from("contractors").select(cols).eq("user_id", userId).maybeSingle()));
  return row ? toContractor(row) : null;
}

export async function createContractor(userId, { name, person, phone, email, city, trades }) {
  const row = unwrap(
    await supabase
      .from("contractors")
      .insert({ user_id: userId, name, person, phone, email, city, trades, prices: defaultPrices(trades) })
      .select(BASE_COLUMNS)
      .single(),
  );
  return toContractor(row);
}

/** Записва само подадените полета (patch с имена като в приложението). */
export async function updateContractor(id, patch) {
  const row = {};
  for (const [key, column] of Object.entries(EDITABLE)) if (key in patch) row[column] = patch[key];
  if (!hasProfileColumns) PROFILE_COLUMNS.forEach((c) => delete row[c]);
  if (!Object.keys(row).length) return;
  const res = await supabase.from("contractors").update(row).eq("id", id);
  if (res.error && isMissingColumn(res.error) && PROFILE_COLUMNS.some((c) => c in row)) {
    hasProfileColumns = false;
    PROFILE_COLUMNS.forEach((c) => delete row[c]);
    if (Object.keys(row).length) unwrap(await supabase.from("contractors").update(row).eq("id", id));
    return;
  }
  unwrap(res);
}

// ─── Запитвания ────────────────────────────────────────────────────────────
export async function sendRequest({ contractorId, client, items, comment, custom }) {
  unwrap(
    await supabase.from("requests").insert({
      contractor_id: contractorId,
      client_name: client.name.trim(),
      client_phone: client.phone.trim(),
      client_email: client.email.trim(),
      client_city: client.city.trim(),
      items,
      comment: comment.trim(),
      custom: custom.trim(),
    }),
  );
}

export async function listMyRequests(contractorId) {
  const rows = unwrap(
    await supabase.from("requests").select("*").eq("contractor_id", contractorId).order("created_at", { ascending: false }),
  );
  return rows.map(toRequest);
}

export async function setRequestStatus(id, status) {
  unwrap(await supabase.from("requests").update({ status }).eq("id", id));
}

// ─── Вход за майстори ──────────────────────────────────────────────────────
export async function signUp(email, password) {
  const data = unwrap(await supabase.auth.signUp({ email, password, options: { emailRedirectTo: appUrl() } }));
  return { needsConfirmation: !data.session };
}

export async function signIn(email, password) {
  unwrap(await supabase.auth.signInWithPassword({ email, password }));
}

export async function sendPasswordReset(email) {
  unwrap(await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() }));
}

export async function updatePassword(password) {
  unwrap(await supabase.auth.updateUser({ password }));
}

export async function signOut() {
  await supabase.auth.signOut();
}
