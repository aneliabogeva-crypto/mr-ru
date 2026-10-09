import { useMemo } from "react";
import { Choice, Counter, Section, Toggle } from "./RoomControls.jsx";
import { useI18n } from "../../../i18n/I18nProvider.jsx";

/** Конфигуратор на помещение по схемата му (src/lib/rooms/index.js). */
export default function RoomConfigurator({ room, cfg, setCfg, market }) {
  const { t, fmt } = useI18n();
  const set = (patch) => setCfg({ ...cfg, ...patch });
  const g = room.geometry(cfg);

  // Цени по пазарната цена за всяка услуга.
  const price = (lines) => lines.reduce((a, l) => a + l.qty * (market[l.sid]?.avg || 0), 0);
  const total = (c) => price(room.lines(c));
  const sectionTotal = (c, sec) => price(room.lines(c).filter((l) => l.section === sec));
  const sections = useMemo(
    () => Object.fromEntries(room.schema.map((s) => [s.id, sectionTotal(cfg, s.id)])),
    [cfg, market, room], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const num = (v) => (typeof v === "number" ? (Number.isInteger(v) ? String(v) : fmt.num(v)) : v);
  const fmtVars = (vars) => Object.fromEntries(Object.entries(vars || {}).map(([k, v]) => [k, num(v)]));
  /** Подсказка: ключ, [ключ, vars], функция от cfg, или нищо. */
  const hintText = (spec) => {
    const s = typeof spec === "function" ? spec(cfg) : spec;
    if (!s) return undefined;
    if (Array.isArray(s)) return t(s[0], fmtVars(s[1](g, cfg)));
    return t(s);
  };
  const exists = (key) => t(key) !== key;
  const delta = (key) => total({ ...cfg, [key]: true }) - total({ ...cfg, [key]: false });
  const id = (key) => `${room.id}-${key}`;

  const renderItem = (it, i, sectionId) => {
    if (it.show && !it.show(cfg)) return null;
    if (it.type === "group") {
      return (
        <div key={i} className={"subopts" + (it.flush ? " flush" : "")}>
          {it.items.map((x, j) => renderItem(x, j, sectionId))}
        </div>
      );
    }
    if (it.type === "choice") {
      const options = it.values.map((v) => {
        const c = { ...cfg, [it.key]: v };
        const p = it.price === "item" ? (v === it.none ? 0 : total(c) - total({ ...cfg, [it.key]: it.none })) : sectionTotal(c, sectionId);
        const hintSpec = it.hints?.[v] ?? (exists(`${it.prefix}.${v}_h`) ? `${it.prefix}.${v}_h` : undefined);
        return { value: v, label: t(`${it.prefix}.${v}`), hint: hintText(hintSpec), price: p };
      });
      return (
        <div key={i} className="stack choice-block">
          {it.title && <h4 className="sub-h">{t(it.title)}</h4>}
          <Choice name={id(it.key)} value={cfg[it.key]} columns={it.cols || 2} onChange={(v) => set({ [it.key]: v })} options={options} />
        </div>
      );
    }
    if (it.type === "toggle") {
      return (
        <Toggle
          key={i}
          id={id(it.key)}
          checked={!!cfg[it.key]}
          disabled={it.disabled ? it.disabled(cfg) : false}
          onChange={(v) => set({ [it.key]: v })}
          label={t(it.label)}
          hint={hintText(it.hint)}
          delta={delta(it.key)}
        />
      );
    }
    if (it.type === "counter") {
      return (
        <Counter
          key={i}
          id={id(it.key)}
          value={Number(cfg[it.key]) || 0}
          min={it.min ?? 0}
          max={it.max ?? 20}
          onChange={(v) => set({ [it.key]: v })}
          label={t(it.label)}
          hint={hintText(it.hint)}
          unitPrice={it.sid ? market[it.sid]?.avg : undefined}
        />
      );
    }
    if (it.type === "number") {
      return (
        <label key={i} className="field num-field">
          <span>{t(it.label)}</span>
          <input
            id={id(it.key)}
            className="inp"
            type="number"
            inputMode="decimal"
            step={it.step || 0.5}
            min={it.min}
            max={it.max}
            value={cfg[it.key]}
            onChange={(e) => set({ [it.key]: e.target.value.replace(",", ".") })}
          />
          {it.hint && <small className="opt-hint">{hintText(it.hint)}</small>}
        </label>
      );
    }
    return null;
  };

  return (
    <div className="stack min0 room">
      {room.schema.map((sec) =>
        sec.dims ? (
          <Section key={sec.id} id={`${room.id}-${sec.id}`} title={t(sec.title)} total={0}>
            <div className="dims">
              {sec.dims.map((k) => (
                <label key={k} className="field">
                  <span>{t(`r.dim_${k}`)}</span>
                  <input
                    id={id(k)}
                    className="inp"
                    type="number"
                    inputMode="decimal"
                    step="0.05"
                    min={room.limits[k][0]}
                    max={room.limits[k][1]}
                    value={cfg[k]}
                    onChange={(e) => set({ [k]: e.target.value.replace(",", ".") })}
                  />
                </label>
              ))}
            </div>
            {sec.counters && (
              <div className="subopts flush">
                {sec.counters.map((c) => (
                  <Counter key={c.key} id={id(c.key)} value={Number(cfg[c.key]) || 0} min={c.min} max={c.max} onChange={(v) => set({ [c.key]: v })} label={t(c.label)} hint={hintText(c.hint)} />
                ))}
              </div>
            )}
            <p className="geo">{t(sec.geo, fmtVars({ floor: g.floor, walls: g.walls, ceiling: g.ceiling }))}</p>
            {sec.note && <p className="note">{t(sec.note)}</p>}
          </Section>
        ) : (
          <Section key={sec.id} id={`${room.id}-${sec.id}`} title={t(sec.title)} total={sections[sec.id]}>
            {sec.items.map((it, i) => renderItem(it, i, sec.id))}
          </Section>
        ),
      )}
    </div>
  );
}
