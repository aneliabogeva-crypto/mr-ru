// Настройки на плащанията. Попълнете данните си тук; празно поле означава,
// че начинът на плащане се показва като „Очаква настройка“ и не може да се избере.
// Тук няма тайни: IBAN, Revolut таг и линкове за плащане са публични.
// Тайният ключ на ePay е само в Supabase (виж supabase/functions/easypay).

export const PAYMENTS = {
  /** Банков превод. */
  bank: {
    holder: "", // напр. "Мр. Ру ЕООД"
    iban: "", // напр. "BG80BNBG96611020345678"
    bic: "", // напр. "BNBGBGSD"
    bank: "", // напр. "Банка ДСК"
  },

  /** Revolut: личен/фирмен таг за revolut.me (без @). Клиентът превежда сумата с основанието. */
  revolut: {
    tag: "", // напр. "mrru" → https://revolut.me/mrru
  },

  /**
   * Карта, Apple Pay, Google Pay: готови линкове за плащане от Stripe (Payment Links)
   * или Revolut Business (Payment Links), по един за всеки план и период.
   * Към линка се добавят имейлът и основанието, за да се свържат с заявката.
   */
  card: {
    provider: "stripe", // "stripe" | "revolut"
    links: {
      project_once: "",
      home_monthly: "",
      home_yearly: "",
      pro_monthly: "",
      pro_yearly: "",
      business_monthly: "",
      business_yearly: "",
    },
  },

  /**
   * EasyPay / ePay.bg: кодът се генерира от функцията easypay в Supabase.
   * Включете след като функцията е публикувана и има EPAY_MIN и EPAY_SECRET.
   */
  easypay: {
    enabled: false,
  },
};

export const METHODS = ["card", "revolut", "bank", "easypay"];

/** Кои начини са настроени. */
export function methodReady(method, planKey) {
  if (method === "bank") return !!PAYMENTS.bank.iban;
  if (method === "revolut") return !!PAYMENTS.revolut.tag;
  if (method === "card") return !!PAYMENTS.card.links[planKey];
  if (method === "easypay") return !!PAYMENTS.easypay.enabled;
  return false;
}

/** Линк за плащане с карта с попълнен имейл и основание (Stripe). */
export function cardLink(planKey, { email, reference }) {
  const base = PAYMENTS.card.links[planKey];
  if (!base) return "";
  if (PAYMENTS.card.provider !== "stripe") return base;
  const u = new URL(base);
  if (email) u.searchParams.set("prefilled_email", email);
  if (reference) u.searchParams.set("client_reference_id", reference);
  return u.toString();
}

export const revolutLink = () => (PAYMENTS.revolut.tag ? `https://revolut.me/${encodeURIComponent(PAYMENTS.revolut.tag)}` : "");

/** Основание за превод: MR- и 6 знака без лесни за бъркане символи. */
export function newReference() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  return "MR-" + Array.from(bytes, (b) => abc[b % abc.length]).join("");
}
