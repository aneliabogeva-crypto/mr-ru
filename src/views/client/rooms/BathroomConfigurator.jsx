import { useMemo } from "react";
import { Choice, Counter, Section, Toggle } from "./RoomControls.jsx";
import { LIMITS, bathroomLines, geometry, plumbingPoints } from "../../../lib/rooms/bathroom.js";
import { useI18n } from "../../../i18n/I18nProvider.jsx";

const SECTIONS = ["prep", "ceiling", "walls", "floor", "plumbing", "electrical", "door"];

export default function BathroomConfigurator({ cfg, setCfg, market }) {
  const { t, fmt } = useI18n();
  const set = (patch) => setCfg({ ...cfg, ...patch });

  // Суми по секции и цена на всяка опция, по пазарните цени.
  const price = (lines) => lines.reduce((a, l) => a + l.qty * (market[l.sid]?.avg || 0), 0);
  const total = (c) => price(bathroomLines(c));
  const sectionTotal = (c, sec) => price(bathroomLines(c).filter((l) => l.section === sec));
  const sections = useMemo(() => Object.fromEntries(SECTIONS.map((s) => [s, sectionTotal(cfg, s)])), [cfg, market]); // eslint-disable-line react-hooks/exhaustive-deps

  const g = geometry(cfg);
  const optSection = (key, sec, values) => values.map((v) => ({ value: v, price: sectionTotal({ ...cfg, [key]: v }, sec) }));
  const optItem = (key, none, values) => values.map((v) => ({ value: v, price: v === none ? 0 : total({ ...cfg, [key]: v }) - total({ ...cfg, [key]: none }) }));
  const delta = (key) => total({ ...cfg, [key]: true }) - total({ ...cfg, [key]: false });
  const labelled = (opts, prefix, hints = {}) => opts.map((o) => ({ ...o, label: t(`${prefix}.${o.value}`), hint: hints[o.value] }));

  const tiledWalls = cfg.walls === "full" || cfg.walls === "half";
  const dim = (key) => (
    <label className="field">
      <span>{t(`bath.dim_${key}`)}</span>
      <input
        id={`bath-${key}`}
        className="inp"
        type="number"
        inputMode="decimal"
        step="0.05"
        min={LIMITS[key][0]}
        max={LIMITS[key][1]}
        value={cfg[key]}
        onChange={(e) => set({ [key]: e.target.value.replace(",", ".") })}
      />
    </label>
  );

  return (
    <div className="stack min0 room">
      <Section id="dims" title={t("bath.secDims")} total={0}>
        <div className="dims">
          {dim("l")}
          {dim("w")}
          {dim("h")}
        </div>
        <p className="geo">
          {t("bath.geo", { floor: fmt.num(g.floor), walls: fmt.num(g.walls), ceiling: fmt.num(g.ceiling) })}
        </p>
        <p className="note">{t("bath.geoNote")}</p>
      </Section>

      <Section id="prep" title={t("bath.secPrep")} total={sections.prep}>
        <Choice
          name="prep"
          value={cfg.prep}
          onChange={(v) => set({ prep: v })}
          options={labelled(optSection("prep", "prep", ["none", "demolish"]), "bath.prep", { demolish: t("bath.prepHint", { m2: fmt.num(g.floor + g.walls) }) })}
        />
        {cfg.prep === "demolish" && (
          <Toggle id="bath-rs" checked={cfg.removeSanitary} onChange={(v) => set({ removeSanitary: v })} label={t("bath.removeSanitary")} hint={t("bath.removeSanitaryHint")} delta={delta("removeSanitary")} />
        )}
      </Section>

      <Section id="ceiling" title={t("bath.secCeiling")} total={sections.ceiling}>
        <Choice
          name="ceiling"
          value={cfg.ceiling}
          onChange={(v) => set({ ceiling: v })}
          options={labelled(optSection("ceiling", "ceiling", ["none", "paint", "drywall", "pvc"]), "bath.ceiling", {
            paint: t("bath.ceilingPaintHint"),
            drywall: t("bath.ceilingDrywallHint"),
            pvc: t("bath.ceilingPvcHint"),
          })}
        />
      </Section>

      <Section id="walls" title={t("bath.secWalls")} total={sections.walls}>
        <Choice
          name="walls"
          value={cfg.walls}
          onChange={(v) => set({ walls: v })}
          options={labelled(optSection("walls", "walls", ["none", "paint", "half", "full"]), "bath.walls", {
            half: t("bath.wallsHalfHint", { m2: fmt.num(g.halfTiles) }),
            full: t("bath.wallsFullHint", { m2: fmt.num(g.walls) }),
          })}
        />
        {tiledWalls && (
          <div className="subopts">
            <Toggle id="bath-wl" checked={cfg.wallLevel} onChange={(v) => set({ wallLevel: v })} label={t("bath.wallLevel")} hint={t("bath.wallLevelHint")} delta={delta("wallLevel")} />
            <Toggle id="bath-wz" checked={cfg.wetZone} disabled={cfg.bath === "none"} onChange={(v) => set({ wetZone: v })} label={t("bath.wetZone")} hint={t(cfg.bath === "none" ? "bath.wetZoneNone" : "bath.wetZoneHint")} delta={delta("wetZone")} />
          </div>
        )}
      </Section>

      <Section id="floor" title={t("bath.secFloor")} total={sections.floor}>
        <Choice
          name="floor"
          value={cfg.floor}
          onChange={(v) => set({ floor: v })}
          options={labelled(optSection("floor", "floor", ["none", "tiles"]), "bath.floor", { tiles: t("bath.floorTilesHint", { m2: fmt.num(g.floor) }) })}
        />
        {cfg.floor === "tiles" && (
          <div className="subopts">
            <Toggle id="bath-fs" checked={cfg.floorScreed} onChange={(v) => set({ floorScreed: v })} label={t("bath.floorScreed")} hint={t("bath.floorScreedHint")} delta={delta("floorScreed")} />
            <Toggle id="bath-fw" checked={cfg.floorWaterproof} onChange={(v) => set({ floorWaterproof: v })} label={t("bath.floorWaterproof")} hint={t("bath.floorWaterproofHint")} delta={delta("floorWaterproof")} />
          </div>
        )}
        {(tiledWalls || cfg.floor === "tiles") && (
          <div className="subopts">
            <Toggle id="bath-lt" checked={cfg.largeTiles} onChange={(v) => set({ largeTiles: v })} label={t("bath.largeTiles")} hint={t("bath.largeTilesHint")} delta={delta("largeTiles")} />
          </div>
        )}
      </Section>

      <Section id="plumbing" title={t("bath.secPlumbing")} total={sections.plumbing}>
        <h4 className="sub-h">{t("bath.plumbingInstall")}</h4>
        <Choice
          name="plumbing"
          value={cfg.plumbing}
          onChange={(v) => set({ plumbing: v })}
          options={labelled(optItem("plumbing", "keep", ["keep", "new"]), "bath.plumbing", { new: t("bath.plumbingNewHint", { n: plumbingPoints(cfg) }) })}
        />
        <h4 className="sub-h">{t("bath.toiletTitle")}</h4>
        <Choice name="toilet" columns={3} value={cfg.toilet} onChange={(v) => set({ toilet: v })} options={labelled(optItem("toilet", "none", ["none", "floor", "wall"]), "bath.toilet")} />
        <h4 className="sub-h">{t("bath.bathTitle")}</h4>
        <Choice name="bath" value={cfg.bath} onChange={(v) => set({ bath: v })} options={labelled(optItem("bath", "none", ["none", "shower", "bathtub", "bathtub_screen"]), "bath.bath")} />
        <div className="subopts">
          <Toggle id="bath-sink" checked={cfg.sink} onChange={(v) => set({ sink: v })} label={t("bath.sink")} delta={delta("sink")} />
          <Toggle id="bath-boiler" checked={cfg.boiler} onChange={(v) => set({ boiler: v })} label={t("bath.boiler")} delta={delta("boiler")} />
          <Toggle id="bath-washer" checked={cfg.washer} onChange={(v) => set({ washer: v })} label={t("bath.washer")} hint={t("bath.washerHint")} delta={delta("washer")} />
          <Counter id="bath-acc" value={Number(cfg.accessories) || 0} onChange={(v) => set({ accessories: v })} label={t("bath.accessories")} hint={t("bath.accessoriesHint")} unitPrice={market.v13?.avg} />
        </div>
      </Section>

      <Section id="electrical" title={t("bath.secElectrical")} total={sections.electrical}>
        <div className="subopts flush">
          <Counter id="bath-lights" value={Number(cfg.lights) || 0} onChange={(v) => set({ lights: v })} label={t("bath.lights")} unitPrice={market.el4?.avg} />
          <Counter id="bath-sockets" value={Number(cfg.sockets) || 0} onChange={(v) => set({ sockets: v })} label={t("bath.sockets")} hint={t("bath.socketsHint")} unitPrice={market.el2?.avg} />
          <Toggle id="bath-fan" checked={cfg.fan} onChange={(v) => set({ fan: v })} label={t("bath.fan")} delta={delta("fan")} />
        </div>
      </Section>

      <Section id="door" title={t("bath.secDoor")} total={sections.door}>
        <div className="subopts flush">
          <Toggle id="bath-door" checked={cfg.door} onChange={(v) => set({ door: v })} label={t("bath.door")} hint={t("bath.doorHint")} delta={delta("door")} />
        </div>
      </Section>
    </div>
  );
}
