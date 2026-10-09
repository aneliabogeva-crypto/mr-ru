// Дълбоки връзки към Viber, WhatsApp и имейл.

export const phoneDigits = (phone) => String(phone || "").replace(/\D/g, "");

/** Отваря чат във Viber с конкретен номер. */
export const viberChatLink = (phone) => `viber://chat?number=%2B${phoneDigits(phone)}`;

/** Отваря Viber с готов текст за препращане (потребителят избира получател). */
export const viberForwardLink = (text) => `viber://forward?text=${encodeURIComponent(text)}`;

/** WhatsApp чат с номер и по желание готов текст; без номер – избор на получател. */
export const whatsappLink = (phone, text) => {
  const digits = phoneDigits(phone);
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
};

export const mailtoLink = (to, subject, body) =>
  `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
