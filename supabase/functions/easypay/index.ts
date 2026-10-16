// Supabase Edge Function „easypay“: код за плащане в EasyPay / ePay.bg и известия от ePay.
//
// Тайни (Supabase → Edge Functions → Secrets):
//   EPAY_MIN     – клиентски номер на търговеца в ePay (KIN/MIN)
//   EPAY_SECRET  – тайната дума (64 знака) от профила на търговеца
//   EPAY_DEMO    – "1" за тестовата среда demo.epay.bg, иначе реална
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY се подават автоматично.
//
// POST /easypay            { reference }  → { idn, amount, expires }
// POST /easypay/notify     ENCODED, CHECKSUM (от ePay) → "INVOICE=…:STATUS=OK" по редове
// В профила на търговеца в ePay задайте адрес за известия:
//   https://<project>.supabase.co/functions/v1/easypay/notify
// и публикувайте функцията с --no-verify-jwt (ePay не изпраща токен).
import { createClient } from "jsr:@supabase/supabase-js@2";

// Цените са тук, а не от браузъра, за да не може сумата да се подмени.
const PRICES: Record<string, number> = {
  project_once: 9.9,
  home_monthly: 4.9,
  home_yearly: 46.8,
  pro_monthly: 19,
  pro_yearly: 180,
  business_monthly: 39,
  business_yearly: 372,
};
const NAMES: Record<string, string> = { project: "Един ремонт", home: "Дом+", pro: "Про", business: "Бизнес" };
const EXPIRES_DAYS = 7;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const env = (k: string) => Deno.env.get(k) ?? "";
const db = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function hmacSha1Hex(data: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
const b64encode = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64decode = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
const pad = (n: number) => String(n).padStart(2, "0");

async function createCode(req: Request) {
  const { reference } = await req.json().catch(() => ({}));
  if (!/^MR-[A-Z0-9]{6}$/.test(reference || "")) return json({ error: "bad_reference" }, 400);
  const min = env("EPAY_MIN");
  const secret = env("EPAY_SECRET");
  if (!min || !secret) return json({ error: "not_configured" }, 503);

  const sb = db();
  const { data: row, error } = await sb.from("plan_requests").select("id, plan, billing, invoice, epay_idn, status").eq("reference", reference).maybeSingle();
  if (error || !row) return json({ error: "not_found" }, 404);
  const key = `${row.plan}_${row.billing}`;
  const amount = PRICES[key];
  if (!amount) return json({ error: "bad_plan" }, 400);

  const exp = new Date(Date.now() + EXPIRES_DAYS * 86400000);
  const expires = `${pad(exp.getUTCDate())}.${pad(exp.getUTCMonth() + 1)}.${exp.getUTCFullYear()}`;
  if (row.epay_idn) return json({ idn: row.epay_idn, amount, expires });

  const lines = [
    `MIN=${min}`,
    `INVOICE=${row.invoice}`,
    `AMOUNT=${amount.toFixed(2)}`,
    "CURRENCY=EUR",
    `EXP_TIME=${expires}`,
    `DESCR=Mr.Ru ${NAMES[row.plan]} ${reference}`,
    "ENCODING=utf-8",
  ].join("\n");
  const encoded = b64encode(lines);
  const checksum = await hmacSha1Hex(encoded, secret);
  const host = env("EPAY_DEMO") === "1" ? "https://demo.epay.bg" : "https://www.epay.bg";
  const res = await fetch(`${host}/ezp/reg_bill.cgi?ENCODED=${encodeURIComponent(encoded)}&CHECKSUM=${checksum}`);
  const text = (await res.text()).trim();
  const idn = /IDN=(\d{10})/.exec(text)?.[1];
  if (!idn) return json({ error: "epay", detail: text.slice(0, 200) }, 502);

  await sb.from("plan_requests").update({ epay_idn: idn, amount, status: "awaiting_payment" }).eq("id", row.id);
  return json({ idn, amount, expires });
}

async function notify(req: Request) {
  const form = await req.formData();
  const encoded = String(form.get("encoded") ?? form.get("ENCODED") ?? "");
  const checksum = String(form.get("checksum") ?? form.get("CHECKSUM") ?? "").toLowerCase();
  const text = (body: string) => new Response(body + "\n", { headers: { "Content-Type": "text/plain" } });
  if (!encoded || checksum !== (await hmacSha1Hex(encoded, env("EPAY_SECRET")))) return text("ERR=Not valid CHECKSUM");

  const sb = db();
  const out: string[] = [];
  for (const line of b64decode(encoded).split(/\r?\n/).filter(Boolean)) {
    const f = Object.fromEntries(line.split(":").map((p) => p.split("=") as [string, string]));
    const invoice = Number(f.INVOICE);
    if (!invoice) continue;
    const status = f.STATUS === "PAID" ? "paid" : f.STATUS === "DENIED" ? "denied" : f.STATUS === "EXPIRED" ? "expired" : null;
    if (!status) {
      out.push(`INVOICE=${invoice}:STATUS=ERR`);
      continue;
    }
    const patch: Record<string, unknown> = { status };
    if (status === "paid") patch.paid_at = new Date().toISOString();
    const { data, error } = await sb.from("plan_requests").update(patch).eq("invoice", invoice).select("id");
    out.push(`INVOICE=${invoice}:STATUS=${error ? "ERR" : data?.length ? "OK" : "NO"}`);
  }
  return text(out.join("\n"));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const path = new URL(req.url).pathname;
  try {
    return path.endsWith("/notify") ? await notify(req) : await createCode(req);
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
});
