import { SERVICES } from "./catalog.js";

// Детерминистично отклонение 0.90–1.10, за да изглеждат демо цените реалистично.
const jitter = (key) => {
  let h = 7;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return 0.9 + (h % 21) / 100;
};
const roundHalf = (x) => Math.round(x * 2) / 2;

function makeContractor({ id, name, person, phone, email, city, trades, factor, notOffered = [] }) {
  const prices = {};
  for (const svc of SERVICES) {
    prices[svc.id] = {
      price: roundHalf(svc.base * factor * jitter(id + svc.id)),
      off: !trades.includes(svc.cat) || notOffered.includes(svc.id),
    };
  }
  return { id, name, person, phone, email, city, trades, prices, demo: true };
}

/** Примерно състояние на приложението (демо майстори и едно запитване). */
export function createSeed() {
  return {
    seq: 41,
    contractors: [
      makeContractor({ id: "c1", name: "Ремонти Петров", person: "Иван Петров", phone: "+359 888 123 456", email: "ivan@remonti-petrov.bg", city: "София", trades: ["pl", "pa", "tf", "de"], factor: 1.0, notOffered: ["a3", "p5"] }),
      makeContractor({ id: "c2", name: "Електро Стил ЕООД", person: "Георги Димитров", phone: "+359 877 204 118", email: "office@elektrostil.bg", city: "София", trades: ["el"], factor: 1.1 }),
      makeContractor({ id: "c3", name: "АкваФикс", person: "Стоян Николов", phone: "+359 899 551 020", email: "aquafix@abv.bg", city: "София", trades: ["vik", "tf"], factor: 0.95, notOffered: ["v3"] }),
      makeContractor({ id: "c4", name: "Мария Колева", person: "Мария Колева", phone: "+359 886 330 742", email: "m.koleva@mail.bg", city: "Перник", trades: ["pa", "pl", "jo"], factor: 1.05, notOffered: ["j2"] }),
      makeContractor({ id: "c5", name: "Бригада Странджа", person: "Петко Янев", phone: "+359 878 902 615", email: "strandzha.brigada@gmail.com", city: "София", trades: ["de", "pl", "tf", "jo"], factor: 0.9 }),
    ],
    requests: [
      {
        id: "r-demo",
        to: "c1",
        date: "2026-10-07T09:12:00",
        status: "new",
        demo: true,
        client: { name: "Елена Георгиева", phone: "+359 887 410 233", email: "elena.g@example.com", city: "София, кв. Лозенец" },
        items: [
          { sid: "d1", qty: 24 }, { sid: "d4", qty: 1 }, { sid: "t1", qty: 5 },
          { sid: "t2", qty: 19 }, { sid: "t6", qty: 24 }, { sid: "a3", qty: 6 },
        ],
        comment: "Баня около 5 м², височина 2,50 м. Искам да започнем след 20 октомври.",
        custom: "",
      },
    ],
  };
}

/** Примерни количества за ремонт на баня ~5 м². */
export const BATHROOM_EXAMPLE = { d1: 24, d4: 1, v2: 1, v4: 2, v6: 1, t1: 5, t2: 19, t6: 24, el2: 2, el4: 2 };
