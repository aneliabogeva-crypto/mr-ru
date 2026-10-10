// Консултации с майстор: теми, разпознаване на запитване за консултация
// и кои майстори предлагат консултации.
//
// Консултацията се записва като обикновено запитване (таблица requests) с
// един елемент { sid: "consult", topic } – не е нужна промяна в базата.
// Цената се договаря директно с майстора.

export const CONSULT_SID = "consult";

export const CONSULT_TOPICS = ["diy", "materials", "plan", "offer", "site", "other"];

/** Запитването консултация ли е? */
export const isConsult = (request) => (request?.items || []).some((it) => it.sid === CONSULT_SID);

/** Тема на консултацията (ключ от CONSULT_TOPICS). */
export const consultTopic = (request) => (request?.items || []).find((it) => it.sid === CONSULT_SID)?.topic || "other";

/**
 * Предлага ли майсторът консултации? Пази се в ценоразписа под ключ „consult“
 * (извън каталога на услугите). По подразбиране – да.
 */
export const offersConsult = (contractor) => {
  const p = contractor?.prices?.[CONSULT_SID];
  return p ? !p.off : true;
};

/** Отваря прозореца за консултация от всяко място (бутон, чатбот). */
export const openConsult = (topic) => window.dispatchEvent(new CustomEvent("mrru:open-consult", { detail: { topic } }));
