import { useState, useEffect, useCallback } from "react";

// ── CONSTANTS ──────────────────────────────────────────────
const NUM_SEGMENTS  = 6;
const SUB_PULSE_SEC = 30;
const NUM_PULSES    = 6;
const MAJOR_EVERY   = 3;
const MAX_POS       = 8;
const TOTAL_RES     = { manpower: 18, equipment: 18, food: 18 };
const DEFAULT_RES   = { manpower: 6,  equipment: 6,  food: 6  };
const SEG_NAMES     = ["Nord", "Ypres", "Somme", "Verdun", "Alsace", "Rhine"];

const RES      = ["manpower", "equipment", "food"];
const RES_ICON = { manpower: "👥", equipment: "⚙️", food: "🌾" };
const RES_COL  = { manpower: "#7b3f00", equipment: "#1a3c5e", food: "#2d5a1b" };
const RES_BG   = { manpower: "#f5e6d3", equipment: "#dce8f5", food: "#ddf0dd" };

// Weights must sum to 1.0
const RES_WEIGHT = { manpower: 0.4, equipment: 0.3, food: 0.3 };

const RES_DESC = {
  manpower:  { short: "Troop numbers", long: "Raw bodies on the line. Biggest single factor (40% of strength)." },
  equipment: { short: "Arms & ammunition", long: "Combat hitting power and defensive capability (30% of strength)." },
  food:      { short: "Supply lines", long: "Sustains effectiveness across the full 3-minute campaign (30% of strength)." },
};

const RES_OUTCOME = {
  manpower:  { adv: "troop weight told", ret: "outmanned on the line" },
  equipment: { adv: "superior firepower", ret: "outgunned" },
  food:      { adv: "well-supplied troops", ret: "supply lines failing" },
};

// ── AIRCRAFT ───────────────────────────────────────────────
const AIRCRAFT_START   = { dogfight: 4, bombing: 3, recon: 3 };
const AIR_ICONS        = { dogfight: "✈", bombing: "💣", recon: "📷" };
const AIR_LABELS       = { dogfight: "Fighters", bombing: "Bombers", recon: "Recon" };
const ATTRITION_RISK   = {
  dogfight: { sub: 0.22, major: 0.38 },  // most dangerous
  bombing:  { sub: 0.15, major: 0.28 },
  recon:    { sub: 0.10, major: 0.20 },  // least dangerous
};

// ── HELPERS ────────────────────────────────────────────────
function segStr(res, airBonus = 0) {
  return res.manpower * RES_WEIGHT.manpower
       + res.equipment * RES_WEIGHT.equipment
       + res.food * RES_WEIGHT.food
       + (airBonus || 0);
}

function decidingFactor(res, result) {
  // Which resource contributed most (advance) or least (retreat)?
  if (result === "advance" || result === "hold") {
    const best = RES.reduce((a, r) =>
      res[r] * RES_WEIGHT[r] > res[a] * RES_WEIGHT[a] ? r : a, RES[0]);
    return { res: best, reason: RES_OUTCOME[best].adv };
  } else {
    const worst = RES.reduce((a, r) =>
      res[r] * RES_WEIGHT[r] < res[a] * RES_WEIGHT[a] ? r : a, RES[0]);
    return { res: worst, reason: RES_OUTCOME[worst].ret };
  }
}

function resLevel(val) {
  if (val >= 4) return "good";
  if (val >= 2) return "low";
  return "critical";
}

function rollSegment(res, enemyStr, airBonus, isMajor) {
  const pw = segStr(res, airBonus);
  const threshold = pw / (pw + enemyStr);
  const r = Math.random();
  if (isMajor) {
    if (r < threshold * 0.40)  return { result: "advance", amount: 3 };
    if (r < threshold * 0.75)  return { result: "advance", amount: 2 };
    if (r < threshold)          return { result: "advance", amount: 1 };
    if (r < threshold + 0.10)  return { result: "hold",    amount: 0 };
    if (r < threshold + 0.25)  return { result: "retreat", amount: 1 };
    if (r < threshold + 0.40)  return { result: "retreat", amount: 2 };
    return                      { result: "retreat", amount: 3 };
  } else {
    if (r < threshold * 0.50)  return { result: "advance", amount: 1 };
    if (r < threshold + 0.20)  return { result: "hold",    amount: 0 };
    return                      { result: "retreat", amount: 1 };
  }
}

function makeSegments() {
  return SEG_NAMES.map((name, i) => ({
    id: i, name,
    position: 0,
    resources: { manpower: 2, equipment: 2, food: 2 },
    enemyStrength: 2.8 + Math.random() * 1.4,
    airBonus: 0,
    airType: null,   // which action type is active
    lastResult: null,
    lastAmount: 0,
    lastFactor: null,
    lastAirNote: null,  // feedback string from air action
    flash: false,
  }));
}

// ── STYLES ─────────────────────────────────────────────────
const S = {
  root:  { minHeight: "100vh", background: "#faf3e0", fontFamily: "'Georgia', serif", padding: "14px", color: "#3a2800" },
  wrap:  { maxWidth: "900px", margin: "0 auto" },
  card:  { background: "#f5e6c8", border: "1px solid #c9a96e", borderRadius: "6px", padding: "12px" },
  lbl:   { fontSize: "10px", color: "#8b6914", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" },
  btn:   (bg, fg, ex) => ({ background: bg, color: fg || "white", border: "none", borderRadius: "4px", padding: "6px 14px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", fontFamily: "'Georgia', serif", letterSpacing: "1px", ...(ex || {}) }),
  smBtn: (bg, fg) => ({ width: "26px", height: "26px", background: bg, border: "1px solid #c9a96e", borderRadius: "3px", cursor: "pointer", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: fg || "#5c3a00" }),
};

const LEVEL_COL = { good: "#2d6a2d", low: "#b7770d", critical: "#c0392b" };
const LEVEL_BG  = { good: "#d4efdf", low: "#fef3cd", critical: "#fde8e8" };

// ── COMPONENT ──────────────────────────────────────────────
export default function FrontlineV5() {
  const [phase,      setPhase]      = useState("allocation");
  const [segments,   setSegments]   = useState(makeSegments);
  const [reserves,   setReserves]   = useState(() => ({ ...DEFAULT_RES }));
  const [pulseTimer, setPulseTimer] = useState(SUB_PULSE_SEC);
  const [pulseCount, setPulseCount] = useState(0);
  const [score,      setScore]      = useState(0);
  const [log,        setLog]        = useState([]);
  const [selSeg,     setSelSeg]     = useState(null);
  const [rolling,    setRolling]    = useState(false);
  const [majorFlash, setMajorFlash] = useState(false);
  const [tooltip,    setTooltip]    = useState(null);
  const [aircraft,   setAircraft]   = useState(() => ({ ...AIRCRAFT_START }));

  const allocated = segments.reduce((a, s) => ({
    manpower:  a.manpower  + s.resources.manpower,
    equipment: a.equipment + s.resources.equipment,
    food:      a.food      + s.resources.food,
  }), { manpower: 0, equipment: 0, food: 0 });

  const free = {
    manpower:  TOTAL_RES.manpower  - allocated.manpower  - reserves.manpower,
    equipment: TOTAL_RES.equipment - allocated.equipment - reserves.equipment,
    food:      TOTAL_RES.food      - allocated.food      - reserves.food,
  };

  const nextPulseNum   = pulseCount + 1;
  const isMajorNext    = nextPulseNum % MAJOR_EVERY === 0;
  const timerUrgent    = pulseTimer <= 6 && phase === "battle";
  const totalAdvanced  = segments.filter(s => s.position > 0).length;
  const totalRetreated = segments.filter(s => s.position < 0).length;

  const handlePulse = useCallback(() => {
    setRolling(true);
    setPulseCount(count => {
      const newCount = count + 1;
      const isMajor  = newCount % MAJOR_EVERY === 0;
      if (isMajor) setMajorFlash(true);

      setTimeout(() => {
        // Attrition: roll for each segment with an active air action
        const attritionLosses = {};  // { dogfight: N, bombing: N, recon: N }
        const attritionNotes  = [];  // strings for dispatch

        setSegments(segs => {
          // First pass: calculate attrition
          segs.forEach(seg => {
            if (!seg.airType || !seg.airBonus) return;
            const risk = ATTRITION_RISK[seg.airType][isMajor ? "major" : "sub"];
            if (Math.random() < risk) {
              attritionLosses[seg.airType] = (attritionLosses[seg.airType] || 0) + 1;
              attritionNotes.push(`${AIR_ICONS[seg.airType]} ${AIR_LABELS[seg.airType]} lost over ${seg.name}`);
            }
          });

          // Apply attrition to aircraft pool
          if (Object.keys(attritionLosses).length > 0) {
            setAircraft(ac => {
              const updated = { ...ac };
              Object.entries(attritionLosses).forEach(([type, n]) => {
                updated[type] = Math.max(0, updated[type] - n);
              });
              return updated;
            });
          }

          // Second pass: roll segments and generate air feedback
          const updated = segs.map(seg => {
            const roll   = rollSegment(seg.resources, seg.enemyStrength, seg.airBonus, isMajor);
            const delta  = roll.result === "advance" ? roll.amount : roll.result === "retreat" ? -roll.amount : 0;
            const factor = decidingFactor(seg.resources, roll.result);

            // Air action outcome note
            let airNote = null;
            if (seg.airType && seg.airBonus > 0) {
              const icon = AIR_ICONS[seg.airType];
              if (roll.result === "advance") {
                airNote = `${icon} ${seg.airType} supported the advance`;
              } else if (roll.result === "retreat") {
                airNote = `${icon} ${seg.airType} active — still lost ground`;
              } else {
                airNote = `${icon} ${seg.airType} helped hold the line`;
              }
            }

            return {
              ...seg,
              position:    Math.max(-MAX_POS, Math.min(MAX_POS, seg.position + delta)),
              airBonus:    isMajor ? 0 : seg.airBonus,
              airType:     isMajor ? null : seg.airType,
              lastResult:  roll.result,
              lastAmount:  roll.amount,
              lastFactor:  factor,
              lastAirNote: airNote,
              flash:       true,
            };
          });

          const adv  = updated.filter(s => s.lastResult === "advance").length;
          const ret  = updated.filter(s => s.lastResult === "retreat").length;
          const hold = updated.filter(s => s.lastResult === "hold").length;
          const pos  = updated.reduce((sum, s) => sum + s.position, 0);
          setScore(Math.max(0, pos * 12 + updated.filter(s => s.position > 0).length * 8));

          // Build dispatch log — ground summary + air notes + attrition
          const notable = updated
            .filter(s => s.lastResult !== "hold")
            .sort((a, b) => Math.abs(b.lastAmount) - Math.abs(a.lastAmount))
            .slice(0, 2)
            .map(s => `${s.name} ${s.lastResult === "advance" ? "▲" : "▼"}${s.lastAmount} — ${s.lastFactor?.reason}`)
            .join(" · ");

          const airLines = [
            ...updated.filter(s => s.lastAirNote).map(s => s.lastAirNote),
            ...attritionNotes,
          ];

          setLog(l => [{
            pulse:    newCount,
            major:    isMajor,
            summary:  `${adv} adv · ${hold} hold · ${ret} ret`,
            detail:   notable || "front held across all segments",
            airLines: airLines,
          }, ...l.slice(0, 4)]);

          setTimeout(() => {
            setSegments(ss => ss.map(s => ({ ...s, flash: false })));
            setMajorFlash(false);
          }, 900);

          return updated;
        });

        if (newCount >= NUM_PULSES) setPhase("complete");
        setRolling(false);
      }, 400);

      return newCount;
    });
  }, []);

  useEffect(() => {
    if (phase !== "battle") return;
    let t = SUB_PULSE_SEC;
    setPulseTimer(SUB_PULSE_SEC);
    const iv = setInterval(() => {
      t -= 1;
      if (t <= 0) { handlePulse(); t = SUB_PULSE_SEC; }
      setPulseTimer(t);
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, handlePulse]);

  function adjSegRes(id, res, d) {
    if (phase !== "allocation") return;
    setSegments(ss => ss.map(s => {
      if (s.id !== id) return s;
      const nv = s.resources[res] + d;
      if (nv < 0) return s;
      if (d > 0 && free[res] <= 0) return s;
      return { ...s, resources: { ...s.resources, [res]: nv } };
    }));
  }

  function adjReserve(res, d) {
    if (phase !== "allocation") return;
    const nv = reserves[res] + d;
    if (nv < 0) return;
    if (d > 0 && free[res] <= 0) return;
    setReserves(r => ({ ...r, [res]: nv }));
  }

  function deployReserve(segId, res) {
    if (phase !== "battle" || reserves[res] <= 0) return;
    setReserves(r => ({ ...r, [res]: r[res] - 1 }));
    setSegments(ss => ss.map(s => s.id !== segId ? s : { ...s, resources: { ...s.resources, [res]: s.resources[res] + 1 } }));
    setLog(l => [{ pulse: "—", major: false, summary: `${RES_ICON[res]} reserve → ${SEG_NAMES[segId]}`, detail: `+1 ${RES_DESC[res].short}` }, ...l.slice(0, 4)]);
  }

  function applyAir(segId, type) {
    if (aircraft[type] <= 0) return;  // no aircraft available
    const bonuses = { dogfight: 1.5, bombing: 1.2, recon: 0.8 };
    setSegments(ss => ss.map(s => s.id !== segId ? s : {
      ...s,
      airBonus: +(s.airBonus + (bonuses[type] || 0)).toFixed(1),
      airType:  type,
    }));
    setLog(l => [{
      pulse: "—", major: false,
      summary: `${AIR_ICONS[type]} ${AIR_LABELS[type]} deployed → ${SEG_NAMES[segId]}`,
      detail:  `+${bonuses[type]} bonus active until ⚡ Major Push`,
      airLines: [],
    }, ...l.slice(0, 4)]);
  }

  function restart() {
    setPhase("allocation"); setSegments(makeSegments()); setReserves({ ...DEFAULT_RES });
    setPulseTimer(SUB_PULSE_SEC); setPulseCount(0); setScore(0);
    setLog([]); setSelSeg(null); setRolling(false); setMajorFlash(false);
    setTooltip(null); setAircraft({ ...AIRCRAFT_START });
  }

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div style={S.root} onClick={() => setTooltip(null)}>
      <div style={S.wrap}>

        {/* HEADER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2px solid #c9a96e", paddingBottom:"10px", marginBottom:"12px" }}>
          <div>
            <div style={{ fontSize:"20px", fontWeight:"bold", color:"#5c3a00", letterSpacing:"3px", textTransform:"uppercase" }}>The Front Line</div>
            <div style={{ fontSize:"10px", color:"#9a7a3a", letterSpacing:"1px" }}>Campaign · 3 min · 6 sub-pulses · ⚡ Major Push every 3rd</div>
          </div>
          {phase === "battle" && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"38px", fontWeight:"bold", lineHeight:1, color: timerUrgent ? "#c0392b" : isMajorNext ? "#7d1c8d" : "#5c3a00", transition:"color 0.3s" }}>
                {pulseTimer}s
              </div>
              <div style={{ fontSize:"10px", fontWeight: isMajorNext ? "bold" : "normal", color: isMajorNext ? "#7d1c8d" : "#9a7a3a", letterSpacing:"1px" }}>
                {isMajorNext ? "⚡ MAJOR PUSH NEXT" : `sub-pulse ${pulseCount + 1}/${NUM_PULSES}`}
              </div>
              <div style={{ marginTop:"4px", display:"flex", gap:"3px", justifyContent:"flex-end" }}>
                {Array.from({ length: NUM_PULSES }).map((_, i) => (
                  <div key={i} style={{ width:"11px", height:"11px", borderRadius:"50%", background: i < pulseCount ? "#5c3a00" : "#e8d5a3", border:`1px solid ${(i+1) % MAJOR_EVERY === 0 ? "#7d1c8d" : "#c9a96e"}`, boxShadow:(i+1) % MAJOR_EVERY === 0 ? "0 0 0 1px #c9b3d4" : "none" }} />
                ))}
              </div>
            </div>
          )}
          {phase === "allocation" && <div style={{ color:"#8b6914", fontWeight:"bold", fontSize:"13px", letterSpacing:"1px" }}>⚔ ALLOCATION PHASE</div>}
          {phase === "complete"   && <div style={{ color:"#27ae60", fontWeight:"bold", fontSize:"13px" }}>✓ COMPLETE</div>}
        </div>

        {/* MAJOR PUSH BANNER */}
        {majorFlash && (
          <div style={{ background:"#f3e5f5", border:"2px solid #7d1c8d", borderRadius:"6px", padding:"8px 16px", marginBottom:"10px", textAlign:"center", fontSize:"14px", fontWeight:"bold", color:"#7d1c8d", letterSpacing:"2px" }}>
            ⚡ MAJOR PUSH — larger movements · air bonuses reset
          </div>
        )}

        {/* RESOURCE LEGEND — shown during allocation */}
        {phase === "allocation" && (
          <div style={{ ...S.card, marginBottom:"10px", background:"#fef9ec", border:"1px solid #a07830" }}>
            <div style={{ ...S.lbl, color:"#7d5a00" }}>What each resource does</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
              {RES.map(res => (
                <div key={res} style={{ background: RES_BG[res], borderRadius:"4px", padding:"8px", border:`1px solid ${RES_COL[res]}30` }}>
                  <div style={{ fontSize:"13px", fontWeight:"bold", color: RES_COL[res], marginBottom:"3px" }}>
                    {RES_ICON[res]} {res}
                    <span style={{ float:"right", fontSize:"11px", background: RES_COL[res], color:"white", borderRadius:"3px", padding:"0 4px" }}>
                      {Math.round(RES_WEIGHT[res] * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize:"11px", color:"#5c3a00", lineHeight:"1.4" }}>{RES_DESC[res].long}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESERVES — full width */}
        <div style={{ ...S.card, border:"2px solid #a07830", background:"#fef9ec", marginBottom:"10px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <div style={{ ...S.lbl, color:"#7d5a00", marginBottom:0 }}>⚑ Reserves</div>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ fontSize:"10px", color:"#9a7a3a", fontStyle:"italic" }}>
                {phase === "allocation" ? "Hold back resources for mid-battle deployment" : selSeg !== null ? `deploying → ${SEG_NAMES[selSeg]}` : "click a segment to deploy"}
              </div>
              {phase === "allocation" && (
                <button onClick={() => setPhase("battle")} style={S.btn("#3a6b2a")}>BEGIN →</button>
              )}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
            {RES.map(res => (
              <div key={res} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background: RES_BG[res], borderRadius:"4px", border:`1px solid ${RES_COL[res]}40` }}>
                <div style={{ fontSize:"12px", color: RES_COL[res], fontWeight:"bold" }}>{RES_ICON[res]} {res}</div>
                {phase === "allocation" ? (
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <button onClick={() => adjReserve(res, -1)} style={S.smBtn("#e8d5a3")}>−</button>
                    <span style={{ fontSize:"22px", fontWeight:"bold", color:"#5c3a00", minWidth:"28px", textAlign:"center" }}>{reserves[res]}</span>
                    <button onClick={() => adjReserve(res, 1)} style={S.smBtn("#c9a96e", "white")}>+</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"26px", fontWeight:"bold", color: reserves[res] > 0 ? "#2471a3" : "#ccc" }}>{reserves[res]}</span>
                    {reserves[res] > 0 && selSeg !== null && (
                      <button onClick={() => deployReserve(selSeg, res)} style={S.btn("#2471a3", "white", { padding:"4px 12px", fontSize:"11px" })}>Send 1</button>
                    )}
                    {reserves[res] === 0 && <span style={{ fontSize:"10px", color:"#ccc", fontStyle:"italic" }}>depleted</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {phase === "battle" && selSeg === null && Object.values(reserves).some(v => v > 0) && (
            <div style={{ fontSize:"11px", color:"#7d5a00", fontStyle:"italic", textAlign:"center", marginTop:"8px" }}>
              ↑ Click a front segment to deploy reserves to it
            </div>
          )}
        </div>

        {/* FRONT SEGMENTS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:"6px", marginBottom:"10px" }}>
          {segments.map(seg => {
            const isSelected = selSeg === seg.id;
            const strength   = segStr(seg.resources, seg.airBonus);
            const enemyStr   = seg.enemyStrength;
            const strengthPct = Math.round((strength / (strength + enemyStr)) * 100);
            const bg = rolling && seg.flash ? "#fff9c4"
              : seg.lastResult === "advance" ? "#d4efdf"
              : seg.lastResult === "retreat" ? "#fde8e8"
              : "#f5e6c8";
            const pct = 50 - (seg.position / MAX_POS) * 44;

            return (
              <div key={seg.id}
                onClick={() => phase === "battle" && setSelSeg(isSelected ? null : seg.id)}
                style={{ border:`2px solid ${isSelected ? "#5c3a00" : "#c9a96e"}`, borderRadius:"6px", background:bg, cursor: phase === "battle" ? "pointer" : "default", transition:"background 0.5s", overflow:"hidden", boxShadow: isSelected ? "0 0 0 2px #c9a96e" : "none" }}
              >
                {/* Name */}
                <div style={{ background:"#5c3a00", color:"#f5e6c8", textAlign:"center", padding:"3px 2px", fontSize:"9px", fontWeight:"bold", letterSpacing:"1px" }}>
                  {seg.name.toUpperCase()}
                </div>

                {/* Strength vs enemy bar */}
                <div style={{ margin:"3px 4px 2px", height:"5px", background:"#f5c6cb", borderRadius:"3px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${strengthPct}%`, background: strengthPct > 55 ? "#2d6a2d" : strengthPct > 45 ? "#b7770d" : "#c0392b", transition:"width 0.5s", borderRadius:"3px" }} />
                </div>
                <div style={{ textAlign:"center", fontSize:"8px", color: strengthPct > 55 ? "#2d6a2d" : strengthPct > 45 ? "#b7770d" : "#c0392b", fontWeight:"bold", marginBottom:"2px" }}>
                  {strengthPct}% str
                </div>

                {/* Front position bar */}
                <div style={{ height:"60px", position:"relative", background:"linear-gradient(to bottom, #c8e6c9 0%, #f5c6cb 100%)", margin:"0 4px 2px" }}>
                  <div style={{ position:"absolute", top:"2px", left:"3px", fontSize:"7px", color:"#2d5a1b", fontWeight:"bold" }}>GRN</div>
                  <div style={{ position:"absolute", bottom:"2px", left:"3px", fontSize:"7px", color:"#7b1e1e", fontWeight:"bold" }}>RED</div>
                  <div style={{ position:"absolute", width:"100%", height:"2px", background:"#333", top:`${pct}%`, transition:"top 0.8s cubic-bezier(0.4,0,0.2,1)", boxShadow:"0 1px 4px rgba(0,0,0,0.5)" }} />
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"flex-end", justifyContent:"center", paddingRight:"4px" }}>
                    <span style={{ fontSize:"12px", opacity:0.8 }}>
                      {seg.position > 3 ? "⬆⬆" : seg.position > 0 ? "⬆" : seg.position === 0 ? "—" : seg.position > -3 ? "⬇" : "⬇⬇"}
                    </span>
                    <span style={{ fontSize:"9px", fontWeight:"bold", color: seg.position > 0 ? "#1a5c2d" : seg.position < 0 ? "#7b1e1e" : "#666" }}>
                      {seg.position > 0 ? "+" : ""}{seg.position}
                    </span>
                  </div>
                  {/* Last result */}
                  {seg.lastResult && !rolling && (
                    <div style={{ position:"absolute", bottom:"2px", right:"3px", fontSize:"8px", fontWeight:"bold", color: seg.lastResult === "advance" ? "#1a5c2d" : seg.lastResult === "retreat" ? "#7b1e1e" : "#666" }}>
                      {seg.lastResult === "advance" ? `▲${seg.lastAmount}` : seg.lastResult === "retreat" ? `▼${seg.lastAmount}` : "●"}
                    </div>
                  )}
                </div>

                {/* Per-resource mini bars */}
                <div style={{ padding:"2px 4px 3px" }}>
                  {RES.map(res => {
                    const val   = seg.resources[res];
                    const level = resLevel(val);
                    const maxVal = 6;
                    const barW  = Math.min(100, (val / maxVal) * 100);
                    return (
                      <div key={res} style={{ marginBottom:"3px" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1px" }}>
                          <span style={{ fontSize:"9px", color: RES_COL[res] }}>{RES_ICON[res]}</span>
                          <span style={{ fontSize:"9px", fontWeight:"bold", color: LEVEL_COL[level] }}>{val}</span>
                          {phase === "allocation" && (
                            <div style={{ display:"flex", gap:"1px" }}>
                              <button onClick={e => { e.stopPropagation(); adjSegRes(seg.id, res, -1); }}
                                style={{ width:"14px", height:"14px", background:"#e8d5a3", border:"1px solid #c9a96e", borderRadius:"2px", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>−</button>
                              <button onClick={e => { e.stopPropagation(); adjSegRes(seg.id, res, 1); }}
                                style={{ width:"14px", height:"14px", background:"#e8d5a3", border:"1px solid #c9a96e", borderRadius:"2px", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>+</button>
                            </div>
                          )}
                        </div>
                        {/* Resource bar */}
                        <div style={{ height:"3px", background:"#e8d5a3", borderRadius:"2px", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${barW}%`, background: LEVEL_COL[level], transition:"width 0.4s", borderRadius:"2px" }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Air bonus */}
                  {seg.airBonus > 0 && (
                    <div style={{ textAlign:"center", fontSize:"9px", color:"#2471a3", fontWeight:"bold", background:"#d6eaf8", borderRadius:"2px", padding:"1px", marginTop:"2px" }}>
                      ✈ +{seg.airBonus} active
                    </div>
                  )}

                  {/* Deciding factor from last pulse */}
                  {seg.lastFactor && !rolling && phase === "battle" && (
                    <div style={{ fontSize:"8px", color: seg.lastResult === "advance" ? "#2d6a2d" : seg.lastResult === "retreat" ? "#922b21" : "#666", fontStyle:"italic", textAlign:"center", marginTop:"2px", lineHeight:"1.2" }}>
                      {RES_ICON[seg.lastFactor.res]} {seg.lastFactor.reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AIR ACTIONS */}
        {phase === "battle" && (
          <div style={{ ...S.card, background:"#e8f4fd", border:"1px solid #aed6f1", marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
              <div style={{ ...S.lbl, color:"#1a5276", marginBottom:0 }}>Air Actions</div>
              <div style={{ display:"flex", gap:"14px" }}>
                {Object.entries(AIR_LABELS).map(([type, label]) => (
                  <div key={type} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"11px", fontWeight:"bold", color: aircraft[type] === 0 ? "#c0392b" : "#1a5276" }}>
                      {AIR_ICONS[type]} {aircraft[type]}/{AIRCRAFT_START[type]}
                    </div>
                    <div style={{ fontSize:"9px", color:"#5d8aa8" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            {selSeg !== null ? (
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-start" }}>
                {[
                  { type:"dogfight", label:"✈ Dogfight", bonus:"+1.5", bg:"#2471a3", desc:"Air superiority · ~22% attrition risk" },
                  { type:"bombing",  label:"💣 Bombing",  bonus:"+1.2", bg:"#922b21", desc:"Strikes enemy positions · ~15% risk" },
                  { type:"recon",    label:"📷 Recon",    bonus:"+0.8", bg:"#7d6608", desc:"Intelligence advantage · ~10% risk" },
                ].map(({ type, label, bonus, bg, desc }) => {
                  const depleted = aircraft[type] <= 0;
                  return (
                    <div key={type}>
                      <button onClick={() => applyAir(selSeg, type)} disabled={depleted}
                        style={S.btn(depleted ? "#999" : bg, "white", { padding:"6px 10px", opacity: depleted ? 0.5 : 1, cursor: depleted ? "not-allowed" : "pointer" })}>
                        {label} <span style={{ opacity:0.7, fontSize:"10px" }}>{bonus}</span>
                      </button>
                      <div style={{ fontSize:"9px", color: depleted ? "#c0392b" : "#5d8aa8", marginTop:"2px" }}>
                        {depleted ? "no aircraft remaining" : desc}
                      </div>
                    </div>
                  );
                })}
                <span style={{ fontSize:"11px", color:"#5d8aa8", fontStyle:"italic", alignSelf:"center" }}>→ {SEG_NAMES[selSeg]}</span>
              </div>
            ) : (
              <div style={{ fontSize:"12px", color:"#5d8aa8", fontStyle:"italic" }}>Click a front segment above to assign air actions</div>
            )}
          </div>
        )}

        {/* SCORE + LOG */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          <div style={S.card}>
            <div style={S.lbl}>Campaign Score</div>
            <div style={{ fontSize:"40px", fontWeight:"bold", color:"#5c3a00", lineHeight:1 }}>{score}</div>
            <div style={{ fontSize:"11px", color:"#8b6914", marginTop:"4px" }}>
              {totalAdvanced} advanced · {totalRetreated} retreated · {NUM_SEGMENTS - totalAdvanced - totalRetreated} held
            </div>
            {phase === "battle" && (
              <div style={{ marginTop:"8px" }}>
                <div style={{ fontSize:"10px", color:"#9a7a3a", marginBottom:"3px" }}>
                  ~{Math.max(0, Math.ceil(((NUM_PULSES - pulseCount - 1) * SUB_PULSE_SEC + pulseTimer) / 60 * 10) / 10)} min remaining
                </div>
                <div style={{ background:"#e8d5a3", borderRadius:"3px", height:"5px", overflow:"hidden" }}>
                  <div style={{ height:"100%", background:"#5c3a00", width:`${(pulseCount / NUM_PULSES) * 100}%`, transition:"width 0.5s", borderRadius:"3px" }} />
                </div>
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={S.lbl}>Dispatch</div>
            {log.length === 0 && <div style={{ fontSize:"12px", color:"#c9a96e", fontStyle:"italic" }}>Awaiting contact with the enemy...</div>}
            {log.map((e, i) => (
              <div key={i} style={{ marginBottom:"6px", padding:"4px 6px", background: i === 0 ? "rgba(92,58,0,0.08)" : "transparent", borderLeft:`2px solid ${i === 0 ? (e.major ? "#7d1c8d" : "#5c3a00") : "transparent"}`, borderRadius:"2px" }}>
                <div style={{ fontSize:"11px", color: i === 0 ? (e.major ? "#7d1c8d" : "#5c3a00") : "#9a7a3a", fontWeight: i === 0 ? "bold" : "normal" }}>
                  {e.pulse !== "—" && <span style={{ fontSize:"9px", marginRight:"5px" }}>{e.major ? "⚡P" : "P"}{e.pulse}</span>}
                  {e.summary}
                </div>
                {e.detail && i === 0 && (
                  <div style={{ fontSize:"10px", color:"#7a6030", marginTop:"2px", fontStyle:"italic" }}>{e.detail}</div>
                )}
                {/* Air action outcomes */}
                {i === 0 && e.airLines && e.airLines.map((line, j) => {
                  const isLoss = line.includes("lost");
                  return (
                    <div key={j} style={{ fontSize:"10px", color: isLoss ? "#c0392b" : "#2471a3", marginTop:"2px", fontStyle:"italic", display:"flex", alignItems:"center", gap:"4px" }}>
                      {isLoss && <span style={{ fontWeight:"bold" }}>✕</span>}
                      {line}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* COMPLETE */}
        {phase === "complete" && (
          <div style={{ marginTop:"12px", background:"#f5e6c8", border:"2px solid #5c3a00", borderRadius:"8px", padding:"20px", textAlign:"center" }}>
            <div style={{ fontSize:"10px", letterSpacing:"3px", color:"#9a7a3a", textTransform:"uppercase", marginBottom:"6px" }}>Campaign Complete — 3 minutes</div>
            <div style={{ fontSize:"48px", fontWeight:"bold", color:"#5c3a00", lineHeight:1 }}>{score}</div>
            <div style={{ fontSize:"13px", color:"#8b6914", margin:"10px 0" }}>
              {totalAdvanced} advances · {totalRetreated} retreats · {NUM_SEGMENTS - totalAdvanced - totalRetreated} held
            </div>
            <div style={{ fontSize:"12px", color:"#7d5a00", marginBottom:"16px", fontStyle:"italic" }}>
              {score > 100 ? "Decisive advance. The line has moved significantly." : score > 40 ? "Measured gains. The front pushes forward." : score > 0 ? "The line barely held. Reconsider your allocation." : "The front collapsed. Regroup."}
            </div>
            <button onClick={restart} style={S.btn("#5c3a00", "#f5e6c8", { padding:"10px 28px", fontSize:"14px", letterSpacing:"2px" })}>
              NEW CAMPAIGN
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
