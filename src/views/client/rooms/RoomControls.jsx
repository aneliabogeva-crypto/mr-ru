// Общи контроли за конфигураторите на помещения.
import { useI18n } from "../../../i18n/I18nProvider.jsx";

/** Цена до опцията: „≈ 650 €“, „+ 120 €“ или „включено“. */
function PriceTag({ value, delta }) {
  const { t, fmt } = useI18n();
  if (value === undefined) return null;
  if (delta) {
    if (Math.abs(value) < 0.5) return <span className="opt-price muted">{t("rooms.included")}</span>;
    return <span className="opt-price">{value > 0 ? "+ " : "− "}{fmt.eur0(Math.abs(value))}</span>;
  }
  return <span className="opt-price">{value > 0.5 ? `≈ ${fmt.eur0(value)}` : "—"}</span>;
}

/** Избор на една опция като карти. options: [{ value, label, hint, price }] */
export function Choice({ name, value, options, onChange, columns = 2 }) {
  return (
    <div className={`choice cols-${columns}`} role="radiogroup">
      {options.map((o) => (
        <label key={o.value} className={"opt" + (value === o.value ? " on" : "") + (o.disabled ? " disabled" : "")}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
          <span className="opt-body">
            <span className="opt-label">{o.label}</span>
            {o.hint && <span className="opt-hint">{o.hint}</span>}
          </span>
          <PriceTag value={o.price} />
        </label>
      ))}
    </div>
  );
}

/** Отметка с цена на промяната. */
export function Toggle({ id, checked, onChange, label, hint, delta, disabled }) {
  return (
    <label className={"tog" + (checked ? " on" : "") + (disabled ? " disabled" : "")} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="opt-body">
        <span className="opt-label">{label}</span>
        {hint && <span className="opt-hint">{hint}</span>}
      </span>
      {!disabled && <PriceTag value={delta} delta />}
    </label>
  );
}

/** Брояч с бутони − и +. */
export function Counter({ id, value, onChange, label, hint, min = 0, max = 20, unitPrice }) {
  const { t, fmt } = useI18n();
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="tog counter-row">
      <span className="opt-body">
        <label className="opt-label" htmlFor={id}>{label}</label>
        <span className="opt-hint">
          {hint}
          {hint && unitPrice ? " · " : ""}
          {unitPrice ? t("rooms.perPiece", { price: fmt.eur0(unitPrice) }) : ""}
        </span>
      </span>
      <span className="stepper">
        <button type="button" className="step" aria-label={t("client.decrease", { name: label })} disabled={value <= min} onClick={() => set(value - 1)}>−</button>
        <input id={id} className="inp" type="number" inputMode="numeric" min={min} max={max} value={value} onChange={(e) => set(parseInt(e.target.value, 10) || 0)} />
        <button type="button" className="step" aria-label={t("client.increase", { name: label })} disabled={value >= max} onClick={() => set(value + 1)}>+</button>
      </span>
    </div>
  );
}

/** Карта-секция със заглавие и междинна сума. */
export function Section({ id, title, total, children, note }) {
  const { fmt } = useI18n();
  return (
    <section className="card room-sec" aria-labelledby={`sec-${id}`}>
      <header className="room-sec-h">
        <h3 id={`sec-${id}`}>{title}</h3>
        {total !== undefined && <span className={"room-sec-total" + (total > 0.5 ? "" : " zero")}>{total > 0.5 ? fmt.eur0(total) : "—"}</span>}
      </header>
      <div className="room-sec-b">{children}</div>
      {note && <p className="note">{note}</p>}
    </section>
  );
}
