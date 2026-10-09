// Често задавани въпроси за чатбота. `keys` са корени на думи (на малки букви),
// по които се разпознава въпросът. Добавяйте нови записи тук.

export const FAQ = [
  {
    id: "pricing",
    keys: ["изчисл", "пресмят", "средн", "пазар", "calculat", "average", "market"],
    q: { bg: "Как се изчислява цената?", en: "How is the price calculated?" },
    a: {
      bg: "Оценката е сбор от количествата, умножени по средната пазарна цена за всяка услуга. Средната цена се изчислява от ценоразписите на всички майстори, които предлагат услугата, и се обновява при всяка промяна. Показваме и диапазон от най-ниската до най-високата цена.",
      en: "The estimate multiplies each quantity by the average market price of the service. The average comes from the price lists of all contractors who offer the service and updates whenever they change. We also show the range from the lowest to the highest price.",
    },
  },
  {
    id: "accuracy",
    keys: ["точн", "гаранц", "различ", "окончател", "реалн", "accura", "exact", "final"],
    q: { bg: "Точна ли е оценката?", en: "Is the estimate accurate?" },
    a: {
      bg: "Не, тя е ориентировъчна. Реалната цена зависи от състоянието на обекта, достъпа и материалите. Окончателна цена дава майсторът в своята оферта, обикновено след оглед.",
      en: "No, it is indicative. The real price depends on the site condition, access and materials. The contractor gives the final price in their quote, usually after a site visit.",
    },
  },
  {
    id: "materials",
    keys: ["материал", "лепил", "material"],
    q: { bg: "Включени ли са материалите?", en: "Are materials included?" },
    a: {
      bg: "Не. Цените в калкулатора са за труд. Материалите се купуват от клиента или се фактурират отделно от майстора по реална стойност.",
      en: "No. Calculator prices cover labour only. Materials are bought by the client or invoiced separately by the contractor at cost.",
    },
  },
  {
    id: "contact",
    keys: ["свърж", "контакт", "вайбър", "viber", "whatsapp", "уатсап", "телефон", "обад", "contact", "phone", "call"],
    q: { bg: "Как да се свържа с майстор?", en: "How do I contact a contractor?" },
    a: {
      bg: "В секцията „Майстори за вашия ремонт“ всеки профил има бутони Viber и WhatsApp. Те отварят чат директно в приложението. Телефонният номер е изписан под името, ако предпочитате да се обадите.",
      en: "In the contractors section every profile has Viber and WhatsApp buttons that open a chat in the app. The phone number is also shown if you prefer to call.",
    },
  },
  {
    id: "negotiable",
    keys: ["договар", "не се предлага", "negotia", "not offered"],
    q: { bg: "Какво значи „По договаряне“?", en: "What does “Negotiable” mean?" },
    a: {
      bg: "Майсторът не е посочил фиксирана цена за тази услуга. Изпратете запитване и предложете своя цена в полето за коментар. Майсторът ще отговори в офертата си.",
      en: "The contractor has not set a fixed price for this service. Send a request and propose your price in the comment field. The contractor will answer in their quote.",
    },
  },
  {
    id: "quote",
    keys: ["оферт", "запитван", "заявк", "поръч", "quote", "request", "offer"],
    q: { bg: "Как да получа оферта?", en: "How do I get a quote?" },
    a: {
      bg: "Изберете услугите и количествата, попълнете име и телефон и натиснете „Изпрати запитване“ при избрания майстор. Той ще ви изпрати PDF оферта по имейл, Viber или WhatsApp.",
      en: "Pick services and quantities, enter your name and phone, and press “Send request” on a contractor's card. They will send you a PDF quote by email, Viber or WhatsApp.",
    },
  },
  {
    id: "duration",
    keys: ["време", "срок", "колко дни", "седмиц", "продължи", "баня", "how long", "duration", "bathroom"],
    q: { bg: "Колко време отнема ремонт на баня?", en: "How long does a bathroom renovation take?" },
    a: {
      bg: "Стандартна баня от 4–6 м² обикновено отнема 10–15 работни дни: къртене 1–2 дни, ВиК и ел. инсталация 2–3 дни, замазка и изсъхване 3–5 дни, плочки 3–4 дни, монтаж на санитария 1 ден. Сроковете зависят от майстора и доставката на материали.",
      en: "A standard 4–6 m² bathroom usually takes 10–15 working days: demolition 1–2 days, plumbing and electrics 2–3, screed and drying 3–5, tiling 3–4, fixtures 1. Timing depends on the contractor and material delivery.",
    },
  },
  {
    id: "measure",
    keys: ["измер", "квадрат", "м2", "м²", "площ", "measure", "area", "square"],
    q: { bg: "Как да измеря квадратурата?", en: "How do I measure the area?" },
    a: {
      bg: "За под: дължина × ширина на помещението. За стени: периметър × височина, минус вратите и прозорците (врата е около 1,6–2 м²). Добавете 10% резерв за плочки. Ако не сте сигурни, въведете приблизително и уточнете при огледа.",
      en: "Floor: length × width. Walls: perimeter × height, minus doors and windows (a door is about 1.6–2 m²). Add 10% extra for tiles. If unsure, enter an approximate figure and confirm at the site visit.",
    },
  },
  {
    id: "vat",
    keys: ["ддс", "данък", "фактур", "vat", "tax", "invoice"],
    q: { bg: "Има ли ДДС в цените?", en: "Do prices include VAT?" },
    a: {
      bg: "Цените в ценоразписите са без ДДС. Регистрираните по ДДС майстори добавят 20% в офертата си и това се вижда отделно.",
      en: "Price-list prices exclude VAT. VAT-registered contractors add 20% in their quote as a separate line.",
    },
  },
  {
    id: "payment",
    keys: ["плащ", "капаро", "аванс", "превод", "кеш", "pay", "deposit", "cash"],
    q: { bg: "Как се плаща?", en: "How do I pay?" },
    a: {
      bg: "Плащането се договаря директно с майстора. Често се дава аванс за материали и се плаща на етапи след приемане на свършената работа. Mr.Ru не обработва плащания.",
      en: "Payment is agreed directly with the contractor, often a deposit for materials and staged payments after each part of the work is accepted. Mr.Ru does not process payments.",
    },
  },
  {
    id: "free",
    keys: ["безплат", "такса", "регистр", "абонамент", "free", "fee", "subscri"],
    q: { bg: "Платено ли е използването?", en: "Is it free to use?" },
    a: {
      bg: "За клиентите калкулаторът и запитванията са безплатни.",
      en: "The calculator and requests are free for clients.",
    },
  },
];
