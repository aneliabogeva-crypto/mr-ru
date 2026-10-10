import { useI18n } from "../../../i18n/I18nProvider.jsx";
import { ROOM_IDS } from "../../../lib/flow/roomFlow.js";

const ICONS = {
  bath: "M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  kitchen: "M4 10h16v10H4zM4 14h16M8 6v4M12 4v6M16 6v4",
  bedroom: "M3 18V8M3 14h18v4M21 18v-6a3 3 0 0 0-3-3H10v5M6 11.5a1.5 1.5 0 1 0 0-.01",
  living: "M4 13V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M3 13h18v5H3zM5 18v2M19 18v2",
  hall: "M7 3h10v18H7zM14 12h.01M4 21h16",
};

export const RoomIcon = ({ id, size = 26 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d={ICONS[id]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Избор на празна стая. Без примерни цени: цената излиза едва след
 * като клиентът въведе града, размерите и състоянието.
 * Голям изглед (начален екран) и компактен (над калкулатора) за смяна.
 */
export default function RoomPicker({ value, onChange, compact = false }) {
  const { t } = useI18n();
  return (
    <div className={compact ? "rooms rooms-compact" : "rooms-start"} role="radiogroup" aria-label={t("rooms.pick")}>
      {ROOM_IDS.map((id) => (
        <button
          type="button"
          key={id}
          role="radio"
          aria-checked={value === id}
          className={(compact ? "room-card" : "room-tile") + (value === id ? " on" : "")}
          onClick={() => onChange(id)}
        >
          <span className="room-ico"><RoomIcon id={id} size={compact ? 24 : 32} /></span>
          <span className="room-name">{t(`rooms.${id}`)}</span>
          {!compact && <span className="room-cta">{t("rooms.choose")}</span>}
        </button>
      ))}
    </div>
  );
}
