import { useI18n } from "../../../i18n/I18nProvider.jsx";

// Готовите помещения. `ready: false` се показва като „Скоро“.
export const ROOMS = [
  { id: "bath", ready: true },
  { id: "kitchen", ready: false },
  { id: "bedroom", ready: false },
  { id: "living", ready: false },
  { id: "hall", ready: false },
];

const ICONS = {
  bath: "M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  kitchen: "M4 10h16v10H4zM4 14h16M8 6v4M12 4v6M16 6v4",
  bedroom: "M3 18V8M3 14h18v4M21 18v-6a3 3 0 0 0-3-3H10v5M6 11.5a1.5 1.5 0 1 0 0-.01",
  living: "M4 13V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M3 13h18v5H3zM5 18v2M19 18v2",
  hall: "M7 3h10v18H7zM14 12h.01M4 21h16",
};

export default function RoomPicker({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="rooms" role="radiogroup" aria-label={t("rooms.pick")}>
      {ROOMS.map((r) => (
        <button
          type="button"
          key={r.id}
          role="radio"
          aria-checked={value === r.id}
          disabled={!r.ready}
          className={"room-card" + (value === r.id ? " on" : "")}
          onClick={() => onChange(r.id)}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d={ICONS[r.id]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="room-name">{t(`rooms.${r.id}`)}</span>
          {!r.ready && <span className="room-soon">{t("rooms.soon")}</span>}
        </button>
      ))}
    </div>
  );
}
