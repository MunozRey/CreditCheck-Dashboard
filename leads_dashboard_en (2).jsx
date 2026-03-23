import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    // ── CreditChecker.io brand palette ─────────────────────────────────────
    bg:"#F5F6FA", surface:"#FFFFFF", surface2:"#F8F9FC", surface3:"#EEF1F8",
    border:"#E2E7F0", borderHi:"#C8D2E8",
    text:"#0A1628", textSub:"#3D4F6E", muted:"#7080A0",
    navy:"#0A1264",  // brand dark blue (was #0A1628)
    blue:"#005EFF",  // brand primary blue (was #2563EB)
    blue2:"#1A6FFF", // hover / lighter variant
    blue3:"#4D94FF", // subtle highlight / chart fill
    blue4:"#DCE8FF", // low-opacity background chips
    green:"#059669", greenBg:"#ECFDF5",
    amber:"#D97706", amberBg:"#FFFBEB",
    red:"#DC2626",   redBg:"#FEF2F2",
    accent:"#005EFF", accentGlow:"rgba(0,94,255,0.12)",
    rowHover:"#EFF4FF", scrollThumb:"#C8D2E8",
    navBg:"#0A1264", navBorder:"rgba(255,255,255,0.08)",
    isDark:false,
  },
  dark: {
    bg:"#0D0F14", surface:"#13161D", surface2:"#1A1E27", surface3:"#22273A",
    border:"#252A38", borderHi:"#313751",
    text:"#F0F2F8", textSub:"#8892AA", muted:"#525D78",
    navy:"#030924",  // darkened brand navy for dark mode
    blue:"#1A6FFF",  // brand blue — lightened for dark mode readability
    blue2:"#4D94FF", // lighter variant
    blue3:"#80B3FF", // subtle highlight
    blue4:"#0A1A40", // dark background chips
    green:"#10B981", greenBg:"#0D2D23",
    amber:"#F59E0B", amberBg:"#2D1F0A",
    red:"#EF4444",   redBg:"#2D1010",
    accent:"#1A6FFF", accentGlow:"rgba(26,111,255,0.15)",
    rowHover:"#1A1E27", scrollThumb:"#313751",
    navBg:"#030924", navBorder:"rgba(255,255,255,0.07)",
    isDark:true,
  },
};

// T is a mutable proxy — all components read T.* and get current theme values
let T = {...THEMES.light};

function applyTheme(themeName) {
  Object.assign(T, THEMES[themeName]);
  // Refresh mutable style objects in-place so all components stay in sync
  const cs = _buildCatStyle();
  Object.assign(CAT_STYLE, cs);
  if (typeof _buildGradeStyle === "function") {
    Object.assign(GRADE_STYLE, _buildGradeStyle());
  }
  if (typeof _buildModelColors === "function") {
    Object.assign(MODEL_COLORS, _buildModelColors());
  }
  // Inject CSS
  let el = document.getElementById("cc-global-styles");
  if (!el) { el = document.createElement("style"); el.id = "cc-global-styles"; document.head.appendChild(el); }
  const t = THEMES[themeName];
  // Encode muted color for SVG chevron (# → %23)
  const chevron = t.muted.replace("#", "%23");
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Geist:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body {
      background: ${t.bg} !important;
      font-family: 'IBM Plex Sans', 'Geist', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    /* ── Scrollbars ── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: ${t.borderHi}; }
    /* ── Date picker icon tint in dark mode ── */
    input[type=date]::-webkit-calendar-picker-indicator { filter: ${t.isDark ? "invert(0.6)" : "none"}; opacity: 0.7; cursor: pointer; }
    /* ── Select: remove native OS appearance, add custom chevron ── */
    select {
      -webkit-appearance: none;
      appearance: none;
      padding-right: 28px !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='${chevron}' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 8px center !important;
      background-size: 10px 6px !important;
    }
    select option { background: ${t.surface}; color: ${t.text}; }
    /* ── Input appearance resets (Safari/iOS) ── */
    input[type=date], input[type=time], input[type=month] {
      -webkit-appearance: none;
      appearance: none;
    }
    /* ── Remove iOS tap highlight flash on interactive elements ── */
    button, a, label, [role=button], [tabindex="0"] {
      -webkit-tap-highlight-color: transparent;
    }
    /* ── Animations ── */
    @keyframes cc-fade-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cc-spin { to { transform: rotate(360deg); } }
    .cc-tab-content { animation: cc-fade-in 0.18s ease; }
    /* ── Table row hover ── */
    .cc-row:hover td { background: ${t.rowHover} !important; }
    /* ── Button & card interactions ── */
    .cc-btn { transition: all 0.14s ease; cursor: pointer; }
    .cc-btn:focus-visible { outline: 2px solid ${t.blue}; outline-offset: 2px; }
    .cc-card { transition: border-color 0.14s ease; }
    .cc-card:hover { border-color: ${t.borderHi} !important; }
    /* ── Input base style ── */
    .cc-input {
      background: ${t.surface2}; color: ${t.text};
      border: 1px solid ${t.border}; border-radius: 7px;
      padding: 6px 10px; font-size: 11px; font-family: 'IBM Plex Sans', 'Geist', sans-serif;
      outline: none; transition: border-color .14s;
      -webkit-appearance: none; appearance: none;
    }
    .cc-input:focus { border-color: ${t.blue}; box-shadow: 0 0 0 3px ${t.accentGlow}; }
    .cc-input::placeholder { color: ${t.muted}; }
    /* ── Focus rings ── */
    button:focus-visible { outline: 2px solid ${t.blue}; outline-offset: 2px; }
    a:focus-visible { outline: 2px solid ${t.blue}; outline-offset: 2px; }
    /* ── Sticky header support (Safari requires -webkit-sticky) ── */
    .cc-sticky { position: -webkit-sticky; position: sticky; }
    /* ── Navigation — scrollable on narrow screens ── */
    .cc-nav { overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
    .cc-nav::-webkit-scrollbar { display: none; }
    /* ── Table wrappers ── */
    .cc-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    /* ── Responsive breakpoints ── */
    @media (max-width: 900px) {
      .cc-kpi-strip { grid-template-columns: repeat(2,1fr) !important; }
      .cc-leads-layout { grid-template-columns: 1fr !important; }
      .cc-tab-content { padding: 16px 14px !important; }
    }
    @media (max-width: 640px) {
      .cc-tab-content { padding: 12px 10px !important; }
      .cc-export-modal { width: 95vw !important; max-height: 95vh !important; border-radius: 12px !important; }
      .cc-export-body { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 480px) {
      .cc-kpi-strip { grid-template-columns: 1fr !important; }
      .cc-export-modal { width: 100vw !important; max-height: 100vh !important; border-radius: 0 !important; }
    }
  `;
  try { window.storage?.set("cc_theme", themeName).catch(() => {}); } catch(_){}
}

// CAT_STYLE declared first (empty) so applyTheme can mutate it safely
const CAT_STYLE = { "Bank Connected":{}, "Form Submitted":{}, "Incomplete":{} };

function _buildCatStyle() {
  return {
    "Bank Connected":{ color:T.green,  light:T.greenBg, border:T.green+"30",  short:"BC" },
    "Form Submitted":{ color:T.blue,   light:T.surface3, border:T.blue+"30",  short:"FS" },
    "Incomplete":    { color:T.amber,  light:T.amberBg, border:T.amber+"30",  short:"IC" },
  };
}

// GRADE_STYLE — mutable so applyTheme can refresh it on theme change (fixes dark-mode bug)
const GRADE_STYLE = { "A":{}, "B":{} };
function _buildGradeStyle() {
  return {
    "A": { label:"A — Premium",  color:T.navy, bg:T.surface3, desc:"Open Banking connected" },
    "B": { label:"B — Standard", color:T.blue, bg:T.blue4,    desc:"Form completed" },
  };
}

// MODEL_COLORS — mutable so applyTheme can refresh it on theme change (fixes dark-mode bug)
const MODEL_COLORS = { cpl:"", cpa:"", hybrid:"" };
function _buildModelColors() {
  return { cpl:T.blue2, cpa:T.navy, hybrid:T.blue3 };
}

// Initialise on load — now CAT_STYLE, GRADE_STYLE, MODEL_COLORS exist before this runs
applyTheme("light");

// ─── DEFAULT DATA (Pipedrive format) ─────────────────────────────────────────
const DEFAULT_DATA = {"Bank Connected":[{"name":"Ana García López","email":"ana.garcia.lopez@gmail.com","created":"2026-03-03","purpose":""},{"name":"Carlos Martínez Ruiz","email":"carlos.martinez.rz@gmail.com","created":"2026-03-03","purpose":""},{"name":"Elena Sánchez Vega","email":"elenasanchez84@gmail.com","created":"2026-03-03","purpose":""},{"name":"Roberto Fernández","email":"roberto.fndz@hotmail.com","created":"2026-03-01","purpose":""},{"name":"Laura Pérez Gil","email":"lauraperezgil@gmail.com","created":"2026-02-28","purpose":""},{"name":"Miguel Torres Castro","email":"migueltor22@gmail.com","created":"2026-02-28","purpose":""},{"name":"Isabel Romero Díaz","email":"isabelromero@gmail.com","created":"2026-02-27","purpose":""},{"name":"Pedro Navarro Molina","email":"pnavarro1985@gmail.com","created":"2026-02-26","purpose":""},{"name":"Carmen López Herrero","email":"carmen.lopez.h@gmail.com","created":"2026-02-26","purpose":""},{"name":"Javier Morales Ruiz","email":"javier.morales.rz@hotmail.es","created":"2026-02-25","purpose":""}],"Form Submitted":[{"name":"Antonio Gómez Blanco","email":"a.gomez.blanco@gmail.com","created":"2026-02-26","purpose":""},{"name":"María Jiménez Soler","email":"maria.jimenez.s@gmail.com","created":"2026-02-26","purpose":""},{"name":"Francisco Delgado","email":"fdelgado@hotmail.com","created":"2026-02-26","purpose":""},{"name":"Sara Muñoz Reyes","email":"sara.munoz.rz@gmail.com","created":"2026-02-26","purpose":""},{"name":"David Castillo","email":"d.castillo.f@gmail.com","created":"2026-02-26","purpose":""}],"Incomplete":[]};

// ─── SHARED TEST-EMAIL FILTER ─────────────────────────────────────────────────
function isTestEmail(email) {
  if (!email) return true;
  const e = email.toLowerCase();
  return (
    e.includes("@clovrlabs.") ||
    e.includes("@clorvrlabs.") ||
    e === "test@test.com" ||
    e === "asd@asda.com" ||
    e === "ferran@test.com" ||
    e === "f@test.com" ||
    e === "a@xn--6ca.com" ||
    /^(test|asd|a|f)@/.test(e)
  );
}

// ─── XLSX PARSER — supports BOTH Pipedrive AND CreditScore formats ─────────────
function processRows(rows, headers) {
  const hdr = headers.map(h => String(h||"").toLowerCase().trim());
  const col = kws => { for (const k of kws) { const i = hdr.findIndex(h => h.includes(k)); if (i !== -1) return i; } return -1; };

  // Detect format
  const hasStatus = col(["status"]) !== -1;
  const hasVerifJob = col(["verification job"]) !== -1;

  if (hasStatus && hasVerifJob) {
    // ── CreditScore format (Rasmus XLSX) ──────────────────────────────────
    const nameC   = col(["name"]);
    const emailC  = col(["email"]);
    const dateC   = col(["created"]);
    const statusC = col(["status"]);
    const verifC  = col(["verification job"]);
    const ageC    = col(["age"]);
    const incomeC = col(["monthly net income"]);
    const expC    = col(["monthly expenses"]);
    const loanAmtC= col(["desired loan amount"]);
    const loanMoC = col(["installment months"]);
    const purposeC= col(["loan purpose"]);
    const empC    = col(["employment status"]);
    const residC  = col(["residential status"]);
    const emergC  = col(["emergency fund"]);
    const emailVfC= col(["email verified at"]);
    const pdfC    = col(["pdf generated"]);
    const existC  = col(["existing loan"]);
    const accCostC= col(["accommodation cost"]);
    const langC   = col(["language","lang"]);
    // countryC removed — country derived from language field
    // Safe column accessor: returns null if column index is -1
    const safeCol = (idx, row) => idx !== -1 ? row[idx] : null;

    // Priority: lower = better status. Used for dedup across multiple rows per email.
    // completed(0) > verifying+matched(1) > verifying+mismatch(2) > verifying+consent(3)
    //   > pending(4) > cancelled(5)
    const statusPriority = (status, verif) => {
      const s = String(status||"").toLowerCase();
      const v = String(verif||"").toLowerCase();
      if (s === "completed")                        return 0;
      if (s === "verifying" && v === "matched")     return 1;
      if (s === "verifying" && v === "mismatch")    return 2;
      if (s === "verifying" && v === "consent")     return 3;
      if (s === "pending"   && v === "pending")     return 4;
      if (s === "cancelled")                        return 5;
      return 6;
    };

    const catFromPriority = p => {
      if (p <= 3) return "Bank Connected";
      if (p === 4) return "Form Submitted";
      return "Incomplete";
    };

    // Inline score for dedup tie-breaking — mirrors scoreLead() key factors
    const quickScore = row => {
      let s = 0;
      const inc  = parseFloat(row[incomeC])  || 0;
      const exp  = parseFloat(row[expC])     || 0;
      const loan = parseFloat(row[loanAmtC]) || 0;
      // Income (0-25)
      if      (inc>=3500) s+=25; else if (inc>=2500) s+=20;
      else if (inc>=2000) s+=15; else if (inc>=1500) s+=9; else if (inc>=1000) s+=4;
      // DTI (0-25)
      if (inc>0&&exp>0) {
        const dti=exp/inc;
        if      (dti<0.30) s+=25; else if (dti<0.35) s+=19;
        else if (dti<0.40) s+=12; else if (dti<0.50) s+=5;
      } else s+=10;
      // LTI (0-15)
      if (loan>0&&inc>0) {
        const lti=loan/(inc*12);
        if (lti<=0.5) s+=15; else if (lti<=1.0) s+=11;
        else if (lti<=2.0) s+=6; else if (lti<=3.0) s+=2;
      } else s+=8;
      // Employment (0-15)
      const emp=String(row[empC]||"").toLowerCase();
      if      (emp==="civil_servant") s+=15; else if (emp==="employed") s+=13;
      else if (emp==="self_employed") s+=10; else if (emp==="retired")  s+=9;
      else if (emp==="part_time")     s+=5;  else if (emp&&emp!=="unemployed") s+=4;
      const dateStr = row[dateC] ? String(row[dateC]).slice(0,10) : "0000-00-00";
      return { score: s, date: dateStr };
    };

    // Pass 1: collect best record per email
    // Rules:
    //   1. Better status priority always wins  (BC > FS > Incomplete)
    //   2. Tie on status → higher quickScore wins  (most complete/healthy financials)
    //   3. Tie on score  → more recent date wins
    const bestByEmail = {};
    for (const row of rows) {
      const email = String(row[emailC] || "").trim().toLowerCase();
      if (!email || isTestEmail(email)) continue;
      const pri = statusPriority(row[statusC], row[verifC]);
      const { score, date } = quickScore(row);
      const cur = bestByEmail[email];
      if (!cur) {
        bestByEmail[email] = { pri, score, date, row };
      } else if (pri < cur.pri) {
        // Better status → always replace
        bestByEmail[email] = { pri, score, date, row };
      } else if (pri === cur.pri) {
        // Same status → higher score wins; date breaks ties
        if (score > cur.score || (score === cur.score && date > cur.date)) {
          bestByEmail[email] = { pri, score, date, row };
        }
      }
    }

    // Pass 2: build lead objects from best records
    const res = {"Bank Connected":[], "Form Submitted":[], "Incomplete":[]};
    for (const { pri, row } of Object.values(bestByEmail)) {
      const email = String(row[emailC]||"").trim().toLowerCase();
      const lead = {
        name:    String(row[nameC]||"").trim(),
        email,
        created: row[dateC] ? String(row[dateC]).slice(0,10) : "",
        age:          safeCol(ageC, row),
        income:       safeCol(incomeC, row),
        expenses:     safeCol(expC, row),
        loanAmount:   safeCol(loanAmtC, row),
        loanMonths:   safeCol(loanMoC, row),
        purpose:      row[purposeC] || "",
        employment:   row[empC]     || "",
        residential:  row[residC]   || "",
        emergency:    row[emergC]   || "",
        emailVerified: !!row[emailVfC],
        pdfGenerated:  !!row[pdfC],
        existingLoans: safeCol(existC, row),
        accomCost:     safeCol(accCostC, row),
        status:  String(row[statusC]||"").toLowerCase(),
        verif:   String(row[verifC]||"").toLowerCase(),
        language: langC !== -1 && row[langC] ? String(row[langC]).toLowerCase().trim() : null,
        country: (()=>{
          // Country derived from Language field — permanent approach per product decision
          const lang = langC !== -1 && row[langC] ? String(row[langC]).toLowerCase().trim() : null;
          if (!lang) return null;
          const MAP = {spanish:"es",español:"es",castellano:"es",catalan:"es",català:"es",english:"en",portuguese:"pt",português:"pt",italian:"it",italiano:"it",french:"fr",français:"fr",german:"de",deutsch:"de",dutch:"nl",nederlands:"nl",polish:"pl",polski:"pl"};
          return MAP[lang] || lang;
        })(),
      };
      res[catFromPriority(pri)].push(lead);
    }
    return res;

  } else {
    // ── Pipedrive format (original) ───────────────────────────────────────
    const nameC  = col(["person - name","name"]);
    const emailC = col(["person - email","email"]);
    const titleC = col(["lead - title","lead title"]);
    const dateC  = col(["lead created","created"]);
    const PRI    = {"Bank Connected":0,"Form Submitted":1};
    const seen   = {}, res = {"Bank Connected":[], "Form Submitted":[], "Incomplete":[]};
    for (const row of rows) {
      const t = String(row[titleC]||"").toLowerCase();
      const cat = t.includes("bank connected") ? "Bank Connected"
                : t.includes("form submitted") ? "Form Submitted"
                : t.includes("cta")            ? "Form Submitted"
                : t.includes("account verification") ? "Form Submitted"
                : t.includes("iban check")     ? "Form Submitted"
                : null;
      if (!cat) continue;
      const email = String(row[emailC]||"").trim().toLowerCase();
      if (isTestEmail(email)) continue;
      const lead  = { name:String(row[nameC]||"").trim(), email, created:row[dateC]?String(row[dateC]).slice(0,10):"", purpose:"" };
      if (email) { if (seen[email]===undefined||PRI[cat]<seen[email].p) seen[email]={cat,lead,p:PRI[cat]}; }
      else res[cat].push(lead);
    }
    for (const {cat,lead} of Object.values(seen)) res[cat].push(lead);
    return res;
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtEur = n => {
  if (isNaN(n)||!isFinite(n)) return "€—";
  if (n<0) return `-${fmtEur(-n)}`;
  return n>=1_000_000?`€${(n/1_000_000).toFixed(2)}M`:n>=1_000?`€${(n/1_000).toFixed(1)}k`:`€${n.toFixed(2)}`;
};
const fmtNum = n => (!isFinite(n)||isNaN(n))?"—":n>=1_000?`${(n/1_000).toFixed(1)}k`:`${Math.round(n)}`;

const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e||"") && !["test","example","asda","boraitaformacion"].some(d=>(e||"").includes(d));
const qualityGrade = (cat) => cat==="Bank Connected"?"A":"B";

const calcRev = (model, count, s) => {
  if (!count||!s) return 0;
  const n = v => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
  const cpa = n(count)*(n(s.convRate)/100)*n(s.ticket)*(n(s.commission)/100);
  if (model==="cpl")    return n(count)*n(s.cplRate);
  if (model==="cpa")    return cpa;
  if (model==="hybrid") return n(count)*n(s.cplRate)+cpa;
  return 0;
};

const PRESETS = {
  cpl:[
    {label:"Conservative",bc:{cplRate:8},  fs:{cplRate:5}},
    {label:"Base",       bc:{cplRate:11}, fs:{cplRate:7}},
    {label:"Optimistic",  bc:{cplRate:14}, fs:{cplRate:9}},
  ],
  cpa:[
    {label:"Personal", bc:{convRate:20,ticket:8000,  commission:1.50},fs:{convRate:12,ticket:5000,  commission:1.00}},
    {label:"Base",     bc:{convRate:25,ticket:15000, commission:2.00},fs:{convRate:15,ticket:8000,  commission:1.50}},
    {label:"Mortgage", bc:{convRate:15,ticket:180000,commission:0.75},fs:{convRate:8, ticket:150000,commission:0.50}},
  ],
  hybrid:[
    {label:"Personal", bc:{cplRate:5, convRate:20,ticket:8000,  commission:1.00},fs:{cplRate:3,convRate:12,ticket:5000,  commission:0.75}},
    {label:"Base",     bc:{cplRate:7, convRate:25,ticket:15000, commission:1.50},fs:{cplRate:4,convRate:15,ticket:8000,  commission:1.00}},
    {label:"Mortgage", bc:{cplRate:10,convRate:15,ticket:180000,commission:0.50},fs:{cplRate:6,convRate:8, ticket:150000,commission:0.30}},
  ],
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Card({children,style={}}) {
  return (
    <div className="cc-card" style={{
      background:T.surface,
      borderRadius:12,
      border:`1px solid ${T.border}`,
      ...style
    }}>{children}</div>
  );
}

function KpiCard({label,value,sub,accent=T.blue,trend,trendLabel,icon}) {
  const isPos=trend>0,isNeg=trend<0;
  return (
    <Card style={{padding:"20px 22px",position:"relative",overflow:"hidden"}}>
      {/* Glow accent top-left */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg, ${accent}60, transparent)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:600,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontFamily:"'IBM Plex Mono',monospace"}}>{label}</div>
          <div style={{fontSize:30,fontWeight:800,color:T.text,lineHeight:1,letterSpacing:-1,fontVariantNumeric:"tabular-nums",fontFamily:"'Geist',sans-serif"}}>{value}</div>
          {sub&&<div style={{fontSize:11,color:T.muted,marginTop:6,lineHeight:1.4}}>{sub}</div>}
        </div>
        {icon&&<div style={{width:36,height:36,borderRadius:8,background:`${accent}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>{icon}</div>}
      </div>
      {trend!==undefined&&(
        <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
          <span style={{
            fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
            fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5,
            background:isPos?T.greenBg:isNeg?T.redBg:T.surface2,
            color:isPos?T.green:isNeg?T.red:T.muted,
            border:`1px solid ${isPos?T.green+"30":isNeg?T.red+"30":T.border}`,
          }}>
            {isPos?"↑":isNeg?"↓":"—"} {Math.abs(trend)}%
          </span>
          <span style={{fontSize:10,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}

function SectionTitle({children,action}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${T.border}`}}>
      {typeof children==="string"
        ?<span style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"}}>{children}</span>
        :children}
      {action&&<div>{action}</div>}
    </div>
  );
}

function TabBar({tabs,active,onChange}) {
  return (
    <div style={{display:"flex",gap:2,background:T.surface2,borderRadius:10,padding:3}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",background:active===t.id?T.navy:"transparent",color:active===t.id?"#fff":T.muted,fontWeight:700,fontSize:12,transition:"all .15s",whiteSpace:"nowrap"}}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Chip({children,color,bg}) {
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,background:bg||T.surface2,color:color||T.muted}}>{children}</span>;
}

function PreciseInput({value,onChange,prefix,suffix,color=T.blue,width=88}) {
  const [raw,setRaw] = useState(String(value));
  const focused = useRef(false);

  useEffect(()=>{
    if (!focused.current) setRaw(String(value));
  },[value]);

  const commit = str => {
    const v = parseFloat(String(str).replace(",","."));
    if (!isNaN(v)&&v>=0) { onChange(v); setRaw(String(v)); }
    else setRaw(String(value));
  };

  return (
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      {prefix&&<span style={{fontSize:12,color:T.muted,fontWeight:600}}>{prefix}</span>}
      <input
        type="text" inputMode="decimal" value={raw}
        onChange={e=>setRaw(e.target.value)}
        onFocus={e=>{
          focused.current=true;
          e.target.select();
          e.target.style.borderColor=color;
          e.target.style.boxShadow=`0 0 0 3px ${color}18`;
        }}
        onBlur={e=>{
          focused.current=false;
          commit(raw);
          e.target.style.borderColor=`${color}22`;
          e.target.style.boxShadow="none";
        }}
        onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}
        style={{width,padding:"6px 8px",border:`1.5px solid ${color}22`,borderRadius:8,fontSize:13,fontWeight:700,color,textAlign:"right",outline:"none",background:`${color}08`,fontFamily:"ui-monospace,'SF Mono',monospace",transition:"border-color .15s,box-shadow .15s"}}
      />
      {suffix&&<span style={{fontSize:12,color:T.muted,fontWeight:600}}>{suffix}</span>}
    </div>
  );
}

function FieldRow({label,sub,children}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.surface2}`}}>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:T.text}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:T.muted}}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function toTitleCase(str) {
  return (str||"").toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

function Avatar({name}) {
  const initials=(name||"").split(" ").slice(0,2).map(w=>(w[0]||"").toUpperCase()).join("");
  return <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.blue},${T.navy})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,letterSpacing:0.5}}>{initials||"?"}</div>;
}

function CustomTooltip({active,payload,label,formatter}) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{
      background:T.surface,
      borderRadius:10,
      padding:"12px 16px",
      border:`1px solid ${T.borderHi}`,
      boxShadow:"0 4px 24px rgba(0,0,0,0.15)",
      minWidth:180,
      fontFamily:"'Geist',sans-serif",
    }}>
      <div style={{
        fontSize:10,fontWeight:700,color:T.muted,
        letterSpacing:1,textTransform:"uppercase",
        fontFamily:"'IBM Plex Mono',monospace",
        marginBottom:10,paddingBottom:8,
        borderBottom:`1px solid ${T.border}`,
      }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:i<payload.length-1?6:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:8,height:8,borderRadius:2,background:p.color,flexShrink:0}}/>
            <span style={{fontSize:11,color:T.textSub}}>{p.name}</span>
          </div>
          <span style={{fontSize:12,fontWeight:700,color:T.text,fontVariantNumeric:"tabular-nums",fontFamily:"'IBM Plex Mono',monospace"}}>
            {formatter?formatter(p.value,p.name):p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── UPLOAD ZONE ──────────────────────────────────────────────────────────────
function UploadZone({onData}) {
  const [drag,setDrag]=useState(false);
  const [status,setStatus]=useState("idle");
  const [msg,setMsg]=useState("");
  const fileRef=useRef(null);

  const handle=useCallback(async file=>{
    if (!file) return;
    setStatus("loading"); setMsg("");
    try {
      const buf=await file.arrayBuffer();
      const XLSX=await new Promise((res,rej)=>{
        if (window.XLSX) return res(window.XLSX);
        const s=Object.assign(document.createElement("script"),{src:"https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",onload:()=>res(window.XLSX),onerror:rej});
        document.head.appendChild(s);
      });
      const wb=XLSX.read(buf,{type:"array"});
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""});
      if (rows.length<2) throw new Error("Empty file");
      const d=processRows(rows.slice(1),rows[0].map(h=>String(h||"")));
      const bc=d["Bank Connected"].length,fs=d["Form Submitted"].length,ic=(d["Incomplete"]||[]).length;
      if (bc+fs===0) throw new Error("No leads found. Check column headers match expected format.");
      setMsg(`${bc} Bank Connected · ${fs} Form Submitted · ${ic} Incomplete`);
      setStatus("ok"); onData(d);
    } catch(e) { setStatus("err"); setMsg(String(e.message||e)); }
  },[onData]);

  const borderColor={idle:T.border,ok:T.green,err:T.red,loading:T.blue}[status];
  return (
    <div role="button" tabIndex={0}
      onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}}
      onClick={()=>fileRef.current?.click()}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fileRef.current?.click();}}}
      style={{
        border:`1px dashed ${drag?T.blue:T.borderHi}`,
        borderRadius:12,padding:"28px 20px",textAlign:"center",
        background:drag?T.accentGlow:T.surface2,
        cursor:"pointer",transition:"all .2s",
        boxShadow:drag?`0 0 0 3px ${T.accentGlow}`:"none",
      }}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
      <div style={{fontSize:24,marginBottom:10,lineHeight:1}}>
        {status==="loading"
          ? <span style={{display:"inline-block",width:24,height:24,border:"2px solid "+T.borderHi,borderTopColor:T.blue,borderRadius:"50%",animation:"cc-spin 0.7s linear infinite"}}/>
          : status==="ok" ? "✓" : status==="err" ? "✗" : <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div style={{fontSize:12,fontWeight:600,color:status==="err"?T.red:status==="ok"?T.green:T.textSub,fontFamily:"'Geist',sans-serif"}}>
        {status==="idle"&&"Drop XLSX here or click to browse"}
        {status==="loading"&&"Processing…"}
        {(status==="ok"||status==="err")&&msg}
      </div>
      {status==="idle"&&<div style={{fontSize:10,color:T.muted,marginTop:6,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.3}}>CreditScore & Pipedrive formats · deduplicates by email</div>}
    </div>
  );
}

// ─── TAB: LEADS ───────────────────────────────────────────────────────────────
function LeadsTab({data}) {
  const [cat,setCat]=useState("Form Submitted");
  const [search,setSearch]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [showEmail,setShowEmail]=useState(true);
  const [tableOpen,setTableOpen]=useState(true);  // collapse/expand table
  const [sortBy,setSortBy]=useState("created");
  const [purposeFilter,setPurposeFilter]=useState("all");

  const allLeads=useMemo(()=>(data[cat]||[]).map(r=>({...r,cat})),[data,cat]);

  // All unique purposes in current category
  const allPurposes=useMemo(()=>{
    const ps=[...new Set(allLeads.map(r=>r.purpose).filter(Boolean))].sort();
    return ps;
  },[allLeads]);

  const filtered=useMemo(()=>{
    let rows=allLeads;
    if (search){const q=search.toLowerCase();rows=rows.filter(r=>(r.name||"").toLowerCase().includes(q)||(r.email||"").toLowerCase().includes(q));}
    if (dateFrom) rows=rows.filter(r=>r.created.slice(0,10)>=dateFrom);
    if (dateTo)   rows=rows.filter(r=>r.created.slice(0,10)<=dateTo);
    if (purposeFilter!=="all") rows=rows.filter(r=>r.purpose===purposeFilter);
    return [...rows].sort((a,b)=>{
      if (sortBy==="name")   return a.name.localeCompare(b.name);
      if (sortBy==="purpose") return (a.purpose||"").localeCompare(b.purpose||"");
      return (b.created||"").localeCompare(a.created||"");
    });
  },[allLeads,search,dateFrom,dateTo,sortBy,purposeFilter]);

  const colCount=showEmail?4:3;

  return (
    <div className="cc-leads-layout" style={{display:"grid",gridTemplateColumns:"188px 1fr",gap:16}}>
      <Card style={{padding:"12px 10px",height:"fit-content"}}>
        <div style={{fontSize:10,fontWeight:800,color:T.muted,marginBottom:10,letterSpacing:1.5,textTransform:"uppercase",padding:"0 6px"}}>Categories</div>
        {["Bank Connected","Form Submitted","Incomplete"].map(c=>{
          const count=(data[c]||[]).length,active=cat===c,s=CAT_STYLE[c];
          return (
            <button key={c} onClick={()=>{setCat(c);setSearch("");setPurposeFilter("all");}} style={{
              width:"100%",textAlign:"left",
              background:active?`${s.color}10`:"none",
              border:`1px solid ${active?`${s.color}30`:"transparent"}`,
              borderRadius:8,padding:"9px 10px",cursor:"pointer",marginBottom:3,
              display:"flex",justifyContent:"space-between",alignItems:"center",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:active?s.color:T.border,flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:active?700:500,color:active?s.color:T.textSub}}>{c}</span>
              </div>
              <span style={{background:active?s.color:T.border,color:active?"#fff":T.muted,borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>{count}</span>
            </button>
          );
        })}
      </Card>

      <Card>
        {/* ── Toolbar / header row ── */}
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:200}}>
            <span style={{fontWeight:800,fontSize:15,color:T.text}}>{cat}</span>
            <Chip color={CAT_STYLE[cat].color} bg={CAT_STYLE[cat].light}>{filtered.length}</Chip>
            {filtered.length!==allLeads.length&&<span style={{fontSize:11,color:T.muted}}>of {allLeads.length}</span>}
          </div>

          {/* Controls — only visible when table is open */}
          {tableOpen && (<>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",fontSize:11,color:T.text,outline:"none",background:T.surface2,fontFamily:"'Geist',sans-serif"}}/>
            <span style={{fontSize:11,color:T.muted}}>→</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",fontSize:11,color:T.text,outline:"none",background:T.surface2,fontFamily:"'Geist',sans-serif"}}/>
            {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{fontSize:12,color:T.red,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>✕</button>}
            <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:11,width:180,outline:"none",color:T.text,background:T.surface2,fontFamily:"'Geist',sans-serif"}}/>
            <select value={purposeFilter} onChange={e=>setPurposeFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",fontSize:11,color:T.text,outline:"none",background:T.surface2,maxWidth:150,fontFamily:"'Geist',sans-serif"}}>
              <option value="all">All purposes</option>
              {allPurposes.map(p=><option key={p} value={p}>{p.replace(/_/g," ")}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",fontSize:11,color:T.text,outline:"none",background:T.surface2,fontFamily:"'Geist',sans-serif"}}>
              <option value="created">↓ Date</option>
              <option value="name">↓ Name</option>
              <option value="purpose">↓ Purpose</option>
            </select>

            {/* Hide/Show emails — only visible when table is open */}
            <button onClick={()=>setShowEmail(v=>!v)} style={{
              padding:"6px 10px",borderRadius:7,
              border:`1px solid ${T.border}`,
              background:showEmail?T.navy:T.surface2,
              color:showEmail?"#fff":T.muted,
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif",
            }}>
              {showEmail?"Hide Emails":"Show Emails"}
            </button>
          </>)}

          {/* Collapse / expand toggle — always visible */}
          <button
            onClick={()=>setTableOpen(v=>!v)}
            aria-expanded={tableOpen}
            aria-controls="leads-table-section"
            title={tableOpen?"Collapse table":"Expand table"}
            style={{
              display:"flex",alignItems:"center",gap:5,
              padding:"6px 12px",borderRadius:7,
              border:`1px solid ${T.border}`,
              background:tableOpen?T.surface2:T.navy,
              color:tableOpen?T.muted:"#fff",
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif",
              transition:"all .15s",flexShrink:0,
            }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{transition:"transform .2s",transform:tableOpen?"rotate(0deg)":"rotate(180deg)"}}>
              <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {tableOpen?"Collapse":"Expand"}
          </button>
        </div>

        {/* ── Table — hidden when collapsed ── */}
        {tableOpen && (
          <div id="leads-table-section" className="cc-table-wrap" style={{overflowY:"auto",overflowX:"auto",maxHeight:520}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:T.surface2,position:"sticky",top:0,zIndex:1}}>
                  {[{k:"name",l:"Name"},showEmail&&{k:"email",l:"Email"},{k:"purpose",l:"Purpose"},{k:"created",l:"Date"}].filter(Boolean).map(col=>(
                    <th key={col.k} onClick={()=>setSortBy(col.k)} aria-sort={sortBy===col.k?"descending":"none"} style={{padding:"9px 14px",textAlign:"left",fontWeight:700,color:sortBy===col.k?T.navy:T.muted,fontSize:10,letterSpacing:0.8,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,cursor:"pointer",userSelect:"none"}}>
                      {col.l}{sortBy===col.k?" ↓":""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row,i)=>(
                  <tr key={row.email||`nomail-${i}-${row.name}`} style={{borderBottom:`1px solid ${T.surface2}`,transition:"background .1s",cursor:"default"}} onMouseEnter={e=>e.currentTarget.style.background=T.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Avatar name={toTitleCase(row.name)}/>
                        <span style={{fontWeight:600,color:T.text,fontSize:13}}>{row.name ? toTitleCase(row.name) : "—"}</span>
                      </div>
                    </td>
                    {showEmail&&<td style={{padding:"10px 16px",color:T.muted,fontFamily:"'IBM Plex Mono','SF Mono',ui-monospace,monospace",fontSize:11,letterSpacing:-0.2}}>{row.email||"—"}</td>}
                    <td style={{padding:"10px 16px"}}>
                      {row.purpose
                        ? <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,background:`${T.blue}0D`,border:`1px solid ${T.blue}25`,fontSize:11,fontWeight:600,color:T.blue,textTransform:"capitalize"}}>{row.purpose.replace(/_/g," ")}</span>
                        : <span style={{color:T.muted,fontSize:11}}>—</span>
                      }
                    </td>
                    <td style={{padding:"10px 16px",color:T.muted,fontSize:11,fontVariantNumeric:"tabular-nums"}}>{row.created||"—"}</td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={colCount} style={{textAlign:"center",padding:48,color:T.muted,fontSize:13}}>No results</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── TAB: ANALYTICS ───────────────────────────────────────────────────────────
function AnalyticsTab({data}) {
  const [bcOnlyMode,setBcOnlyMode]=useState(true);
  const bc=data["Bank Connected"]||[];
  const fs=data["Form Submitted"]||[];
  const all=useMemo(()=>[...bc.map(r=>({...r,cat:"Bank Connected"})),...fs.map(r=>({...r,cat:"Form Submitted"}))]
  ,[bc,fs]);

  const dailySeries=useMemo(()=>{
    const map={};
    all.forEach(r=>{
      if (!r.created) return;
      if (!map[r.created]) map[r.created]={date:r.created,label:r.created.slice(5),BC:0,FS:0};
      if (r.cat==="Bank Connected") map[r.created].BC++; else map[r.created].FS++;
    });
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({...d,total:d.BC+d.FS,bcRate:d.BC+d.FS>0?Math.round((d.BC/(d.BC+d.FS))*100):0}));
  },[all]);

  const bcDays=useMemo(()=>dailySeries.filter(d=>d.BC>0),[dailySeries]);
  const bcOnlySeries=bcDays;

  const gradeCount={"A":bc.length,"B":fs.length};
  const gradeDist=[
    {name:"A — Premium (Bank Connected)",value:gradeCount["A"],color:T.navy},
    {name:"B — Standard (Form Submitted)",value:gradeCount["B"],color:T.blue},
  ];
  const bcRatio=all.length>0?((bc.length/all.length)*100).toFixed(1):0;

  const peakBC=bcDays.length>0?Math.max(...bcDays.map(d=>d.BC)):0;
  const peakLabel=bcDays.find(d=>d.BC===peakBC)?.label||"—";

  const half=Math.ceil(bcDays.length/2);
  const recentBCTotal=bcDays.slice(half).reduce((s,d)=>s+d.BC,0);
  const prevBCTotal=bcDays.slice(0,half).reduce((s,d)=>s+d.BC,0);
  const bcTrend=prevBCTotal>0?Math.round(((recentBCTotal-prevBCTotal)/prevBCTotal)*100):0;

  const dataSpanDays=Math.max(new Set(bc.map(r=>r.created).filter(Boolean)).size,1);
  const dailyBCAvg=bc.length/dataSpanDays;
  // FS uses same span as BC — Pipedrive exports all FS on one date (artifact), not real daily rate
  const dailyFSEstimate=fs.length/dataSpanDays;

  const gradId=useId().replace(/:/g,"_");
  return (
    <div style={{display:"grid",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard label="BC Rate" value={`${bc.length+fs.length>0?Math.round(bc.length/(bc.length+fs.length)*100):0}%`} sub="of active leads (BC+FS)" accent={T.navy} trend={bcTrend} trendLabel="vs previous period"/>
        <KpiCard label="Funnel Conv." value={`${all.length>0?((bc.length/(bc.length+fs.length+(data["Incomplete"]||[]).length))*100).toFixed(1):0}%`} sub="of all entries incl. drop-offs" accent={T.blue}/>
        <KpiCard label="Daily Peak (BC)" value={peakBC} sub={peakLabel} accent={T.blue2}/>
        <KpiCard label="Avg BC/day"     value={dailyBCAvg.toFixed(1)} sub={`over ${dataSpanDays} days`} accent={T.blue3}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16}}>
        <Card style={{padding:"20px 20px 12px"}}>
          <SectionTitle>
            <h3 style={{margin:0,fontSize:13,fontWeight:700,color:T.text}}>Lead Volume per Day</h3>
            <span style={{fontSize:10,color:T.muted}}>* FS: Pipedrive export date, not acquisition date</span>
          </SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailySeries} margin={{top:4,right:4,left:-20,bottom:0}} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11,color:T.muted}}/>
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy} radius={[4,4,0,0]}/>
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{padding:"20px"}}>
          <SectionTitle>Quality Distribution</SectionTitle>
          <div style={{display:"grid",gap:14,marginTop:8}}>
            {gradeDist.map(g=>(
              <div key={g.name}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:2,background:g.color}}/>
                    <span style={{fontSize:11,color:T.textSub}}>{g.name}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:g.color}}>{g.value}</span>
                </div>
                <div style={{height:8,background:T.surface2,borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${all.length>0?(g.value/all.length)*100:0}%`,background:g.color,borderRadius:4,transition:"width .4s"}}/>
                </div>
                <div style={{fontSize:10,color:T.muted,marginTop:2}}>{all.length>0?((g.value/all.length)*100).toFixed(1):0}% of total</div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
              {Object.entries(GRADE_STYLE).map(([g,s])=>(
                <div key={g} style={{padding:"12px",background:s.bg,borderRadius:8,textAlign:"center",border:`1px solid ${s.color}22`}}>
                  <div style={{fontSize:28,fontWeight:900,color:s.color}}>{g}</div>
                  <div style={{fontSize:10,fontWeight:700,color:s.color,marginTop:2}}>{s.label}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card style={{padding:"20px 20px 12px"}}>
        <SectionTitle>BC Rate per Day (% premium leads)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={bcOnlySeries} margin={{top:4,right:4,left:-20,bottom:0}}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.navy} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={T.navy} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false}/>
            <XAxis dataKey="label" tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
            <Tooltip content={<CustomTooltip formatter={v=>`${v}%`}/>}/>
            <Area type="monotone" dataKey="bcRate" name="BC Rate" stroke={T.navy} strokeWidth={2.5} fill={`url(#${gradId})`} dot={{fill:T.navy,r:4,strokeWidth:0}}/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:12,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
          {[["< 20%","Low",T.red],["20–35%","Mid",T.amber],["> 35%","Optimal",T.green]].map(([r,l,c])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
              <span style={{fontSize:11,color:T.muted}}>{r} = {l}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{padding:"20px"}}>
        <SectionTitle>
          <h3 style={{margin:0,fontSize:13,fontWeight:700,color:T.text}}>Volume Projection</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:T.muted}}>{dailyBCAvg.toFixed(1)} BC/day{!bcOnlyMode&&` · ${dailyFSEstimate.toFixed(1)} FS/day`}</span>
            <div style={{display:"flex",background:T.surface2,borderRadius:8,padding:2,gap:2}}>
              <button onClick={()=>setBcOnlyMode(true)} style={{padding:"3px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:bcOnlyMode?T.navy:"transparent",color:bcOnlyMode?"#fff":T.muted,transition:"all .15s"}}>BC Only</button>
              <button onClick={()=>setBcOnlyMode(false)} style={{padding:"3px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:!bcOnlyMode?T.navy:"transparent",color:!bcOnlyMode?"#fff":T.muted,transition:"all .15s"}}>BC + FS</button>
            </div>
          </div>
        </SectionTitle>
        {bcOnlyMode&&<div style={{marginBottom:12,padding:"8px 12px",background:T.amberBg,borderRadius:8,fontSize:11,color:T.amber,border:`1px solid ${T.amber}40`,display:"flex",alignItems:"center",gap:6}}><svg width="13" height="12" viewBox="0 0 14 13" fill="none" style={{flexShrink:0}}><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill="currentColor"/></svg> Projection based on BC only — FS leads are currently not being added to the pipeline.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[["7 days",7],["30 days",30],["90 days",90],["12 months",365]].map(([label,days])=>{
            const projBC=Math.round(dailyBCAvg*days);
            const projFS=bcOnlyMode?0:Math.round(dailyFSEstimate*days);
            const projTotal=projBC+projFS;
            const projRate=projTotal>0?Math.round((projBC/projTotal)*100):0;
            return (
              <div key={label} style={{padding:"16px",background:T.surface2,borderRadius:10,borderTop:`3px solid ${T.navy}`}}>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>{label}</div>
                <div style={{fontSize:24,fontWeight:800,color:T.text}}>{fmtNum(projTotal)}</div>
                <div style={{fontSize:10,color:T.muted,marginBottom:10}}>estimated leads</div>
                <div style={{display:"grid",gridTemplateColumns:bcOnlyMode?"1fr":"1fr 1fr",gap:6}}>
                  <div style={{background:CAT_STYLE["Bank Connected"].light,borderRadius:6,padding:"6px 4px",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:800,color:T.navy}}>{fmtNum(projBC)}</div>
                    <div style={{fontSize:10,color:T.muted}}>BC</div>
                  </div>
                  {!bcOnlyMode&&<div style={{background:CAT_STYLE["Form Submitted"].light,borderRadius:6,padding:"6px 4px",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:800,color:T.blue}}>{fmtNum(projFS)}</div>
                    <div style={{fontSize:10,color:T.muted}}>FS</div>
                  </div>}
                </div>
                <div style={{marginTop:8,fontSize:10,color:T.muted,textAlign:"center"}}>{bcOnlyMode?"BC only":` BC Rate: ${projRate}%`}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: REVENUE + PARTNERS (monthly) ────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthKey(y, m) { return `${y}-${String(m+1).padStart(2,'0')}`; }

function todayYM() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() };
}

function newPartner(name) {
  return {
    id: typeof crypto!=="undefined"&&crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    name,
    color: T.navy,
    active: true,
    model: "cpl",
    bcS: { cplRate:11, convRate:25, ticket:15000, commission:2.0 },
    fsS: { cplRate:7,  convRate:15, ticket:8000,  commission:1.5 },
  };
}

function newMonthEntry(partnerId) {
  return { partnerId, bcCount:0, fsCount:0, note:"" };
}

// ── Shared month navigator ────────────────────────────────────────────────────
function MonthNav({ y, m, onChange }) {
  const prev = () => { if (m === 0) onChange(y-1, 11); else onChange(y, m-1); };
  const next = () => {
    const { y:ty, m:tm } = todayYM();
    if (y > ty || (y === ty && m >= tm)) return;
    if (m === 11) onChange(y+1, 0); else onChange(y, m+1);
  };
  const { y:ty, m:tm } = todayYM();
  const isToday = y === ty && m === tm;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <button onClick={prev} style={{width:36,height:36,borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,cursor:"pointer",fontSize:14,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
      <div style={{minWidth:110,textAlign:"center"}}>
        <span style={{fontSize:14,fontWeight:800,color:T.text}}>{MONTHS[m]} {y}</span>
      </div>
      <button onClick={next} disabled={isToday} style={{width:36,height:36,borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,cursor:isToday?"not-allowed":"pointer",fontSize:14,color:isToday?T.border:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
    </div>
  );
}

// ── Revenue Tab ───────────────────────────────────────────────────────────────
function RevenueTab({ partners, monthData }) {
  const { y:ty, m:tm } = todayYM();
  const [y, setY] = useState(ty);
  const [m, setM] = useState(tm);

  const key = monthKey(y, m);
  const active = partners.filter(p => p.active);

  // Aggregate from partners monthData for current month
  const getEntry = (pid) => (monthData[key]||{})[pid] || { bcCount:0, fsCount:0 };

  const totRev   = active.reduce((s,p) => { const e=getEntry(p.id); return s+calcRev(p.model,e.bcCount,p.bcS)+calcRev(p.model,e.fsCount,p.fsS); }, 0);
  const totBC    = active.reduce((s,p) => s+getEntry(p.id).bcCount, 0);
  const totFS    = active.reduce((s,p) => s+getEntry(p.id).fsCount, 0);
  const totLeads = totBC + totFS;
  const totBCRev = active.reduce((s,p) => s+calcRev(p.model,getEntry(p.id).bcCount,p.bcS), 0);
  const totFSRev = active.reduce((s,p) => s+calcRev(p.model,getEntry(p.id).fsCount,p.fsS), 0);

  // 6-month trend from partners data
  const trendData = Array.from({length:6},(_,i)=>{
    const mm=m-5+i, yy=y+Math.floor(mm/12), mm2=((mm%12)+12)%12;
    const k=monthKey(yy,mm2), md=monthData[k]||{};
    const rev=active.reduce((s,p)=>{const e=md[p.id]||{bcCount:0,fsCount:0};return s+calcRev(p.model,e.bcCount,p.bcS)+calcRev(p.model,e.fsCount,p.fsS);},0);
    const leads=active.reduce((s,p)=>{const e=md[p.id]||{bcCount:0,fsCount:0};return s+e.bcCount+e.fsCount;},0);
    return { label:MONTHS[mm2].slice(0,3), rev, leads, key:monthKey(yy,mm2) };
  });

  // Per-partner breakdown for this month
  const partnerRows = partners.map(p => {
    const e = getEntry(p.id);
    const bcRev = calcRev(p.model,e.bcCount,p.bcS);
    const fsRev = calcRev(p.model,e.fsCount,p.fsS);
    return { ...p, bcCount:e.bcCount, fsCount:e.fsCount, bcRev, fsRev, tot:bcRev+fsRev };
  }).filter(p => p.tot > 0 || p.bcCount > 0 || p.fsCount > 0);

  const noData = totLeads === 0;

  return (
    <div style={{display:"grid",gap:16}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <MonthNav y={y} m={m} onChange={(ny,nm)=>{setY(ny);setM(nm);}}/>
        <div style={{fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:T.blue,display:"inline-block"}}/>
          Revenue pulled from Partners tab — edit leads &amp; rates there
        </div>
      </div>

      {noData ? (
        <Card style={{padding:48,textAlign:"center"}}>
          <div style={{marginBottom:12,color:T.muted,lineHeight:0}}><svg width="32" height="28" viewBox="0 0 32 28" fill="none"><rect x="2" y="12" width="7" height="14" rx="1" fill="currentColor" fillOpacity="0.3"/><rect x="13" y="4" width="7" height="22" rx="1" fill="currentColor" fillOpacity="0.7"/><rect x="24" y="8" width="7" height="18" rx="1" fill="currentColor" fillOpacity="0.5"/></svg></div>
          <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:6}}>No data for {MONTHS[m]} {y}</div>
          <div style={{fontSize:12,color:T.muted}}>Go to the <strong>Partners</strong> tab and enter leads for this month.</div>
        </Card>
      ) : (<>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          <KpiCard label="Total Revenue"  value={fmtEur(totRev)}                          sub={`${MONTHS[m]} ${y} · ${active.length} partners`} accent={T.navy}/>
          <KpiCard label="Revenue / Lead" value={totLeads>0?fmtEur(totRev/totLeads):"€—"} sub="Weighted avg across partners"                    accent={T.blue}/>
          <KpiCard label="BC Revenue"     value={fmtEur(totBCRev)}                        sub={`${totBC} BC leads`}                             accent={T.blue2}/>
          <KpiCard label="FS Revenue"     value={fmtEur(totFSRev)}                        sub={`${totFS} FS leads`}                             accent={T.blue3}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16,alignItems:"start"}}>

          {/* Partner breakdown */}
          <Card style={{overflow:"hidden"}}>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:13,color:T.text}}>
              Partner Breakdown — {MONTHS[m]} {y}
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:T.surface2}}>
                  {["Partner","Model","BC Leads","BC Rev","FS Leads","FS Rev","Total"].map(h=>(
                    <th key={h} style={{padding:"8px 14px",textAlign:h==="Partner"?"left":"right",fontWeight:700,color:T.muted,fontSize:10,letterSpacing:0.8,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partnerRows.map(p=>(
                  <tr key={p.id} style={{borderBottom:`1px solid ${T.surface2}`,opacity:p.active?1:0.45}} onMouseEnter={e=>e.currentTarget.style.background=T.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 14px",fontWeight:600,color:T.text}}>
                      <span style={{color:p.active?T.green:T.muted,marginRight:6,fontSize:10}}>●</span>{p.name}
                    </td>
                    <td style={{padding:"10px 14px",textAlign:"right"}}>
                      <span style={{padding:"2px 8px",borderRadius:20,background:`${MODEL_COLORS[p.model]}18`,color:MODEL_COLORS[p.model],fontSize:10,fontWeight:700}}>{p.model.toUpperCase()}</span>
                    </td>
                    <td style={{padding:"10px 14px",textAlign:"right",color:T.muted}}>{p.bcCount||"—"}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:T.navy}}>{p.bcRev>0?fmtEur(p.bcRev):"—"}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",color:T.muted}}>{p.fsCount||"—"}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",fontWeight:600,color:T.blue}}>{p.fsRev>0?fmtEur(p.fsRev):"—"}</td>
                    <td style={{padding:"10px 14px",textAlign:"right",fontWeight:800,color:T.navy,fontSize:13}}>{fmtEur(p.tot)}</td>
                  </tr>
                ))}
                <tr style={{background:T.navy}}>
                  <td colSpan={2} style={{padding:"10px 14px",color:"#fff",fontWeight:800}}>TOTAL</td>
                  <td style={{padding:"10px 14px",textAlign:"right",color:"rgba(255,255,255,0.7)",fontWeight:700}}>{totBC||"—"}</td>
                  <td style={{padding:"10px 14px",textAlign:"right",color:"#fff",fontWeight:700}}>{fmtEur(totBCRev)}</td>
                  <td style={{padding:"10px 14px",textAlign:"right",color:"rgba(255,255,255,0.7)",fontWeight:700}}>{totFS||"—"}</td>
                  <td style={{padding:"10px 14px",textAlign:"right",color:"#fff",fontWeight:700}}>{fmtEur(totFSRev)}</td>
                  <td style={{padding:"10px 14px",textAlign:"right",color:"#fff",fontWeight:900,fontSize:15}}>{fmtEur(totRev)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Right: 6-month trend */}
          <Card style={{padding:"16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>6-Month Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trendData} margin={{top:4,right:4,left:-10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false}/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:T.muted,fontFamily:"'IBM Plex Mono',monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>fmtEur(v)} width={55}/>
                <Tooltip content={<CustomTooltip formatter={v=>fmtEur(v)}/>}/>
                <Bar dataKey="rev" name="Revenue" radius={[4,4,0,0]}>
                  {trendData.map((d,i)=><Cell key={i} fill={d.label===MONTHS[m].slice(0,3)?T.navy:T.blue3}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:12}}>
              {trendData.map((d,i)=>{
                const isActive = d.label===MONTHS[m].slice(0,3);
                return (
                  <div key={i} style={{textAlign:"center",padding:"8px 4px",background:isActive?T.navy:T.surface2,borderRadius:7}}>
                    <div style={{fontSize:10,fontWeight:700,color:isActive?"rgba(255,255,255,0.55)":T.muted,textTransform:"uppercase",letterSpacing:0.5}}>{d.label}</div>
                    <div style={{fontSize:11,fontWeight:800,color:isActive?"#fff":T.navy,marginTop:2}}>{d.rev>0?fmtEur(d.rev):"—"}</div>
                    <div style={{fontSize:10,color:isActive?T.muted:T.muted}}>{d.leads>0?`${d.leads}L`:"—"}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </>)}
    </div>
  );
}

// ─── TAB: MULTI-PARTNER (monthly) ────────────────────────────────────────────
function MultiPartnerTab({ partners, setPartners, monthData, setMonthData }) {
  const { y:ty, m:tm } = todayYM();
  const [y, setY]           = useState(ty);
  const [m, setM]           = useState(tm);
  const [search, setSearch] = useState("");

  const key = monthKey(y, m);
  const prevKey = m === 0 ? monthKey(y-1,11) : monthKey(y,m-1);

  // Get or init month entries for current month
  const curMonth = monthData[key] || {};
  const getEntry = (pid) => curMonth[pid] || { bcCount:0, fsCount:0, note:"" };

  const updEntry = (pid, patch) => setMonthData(prev => ({
    ...prev,
    [key]: { ...(prev[key]||{}), [pid]: { ...getEntry(pid), ...patch } }
  }));

  const copyPrev = () => {
    const prev = monthData[prevKey];
    if (!prev) return;
    setMonthData(md => ({
      ...md,
      [key]: Object.fromEntries(
        Object.entries(prev).map(([pid, e]) => [pid, {...e, bcCount:0, fsCount:0, note:""}])
      )
    }));
  };

  const addPartner = () => setPartners(ps => [...ps, newPartner(`Partner ${ps.length+1}`)]);
  const removePartner = (id) => setPartners(ps => ps.filter(p=>p.id!==id));
  const updPartner = (id, patch) => setPartners(ps => ps.map(p=>p.id===id?{...p,...patch}:p));

  const hasPrev = !!monthData[prevKey];
  const MODELS = [{id:"cpl",label:"CPL"},{id:"cpa",label:"CPA"},{id:"hybrid",label:"Hybrid"}];

  // Filtered & active partners
  const filtered = partners.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const active   = partners.filter(p => p.active);

  // Totals for current month
  const totRev   = active.reduce((s,p) => {
    const e = getEntry(p.id);
    return s + calcRev(p.model, e.bcCount, p.bcS) + calcRev(p.model, e.fsCount, p.fsS);
  }, 0);
  const totLeads = active.reduce((s,p) => { const e=getEntry(p.id); return s+e.bcCount+e.fsCount; }, 0);
  const totBC    = active.reduce((s,p) => s+getEntry(p.id).bcCount, 0);

  // 6-month revenue trend across all active partners
  const trendData = Array.from({length:6},(_,i)=>{
    const mm = m-5+i;
    const yy = y+Math.floor(mm/12);
    const mm2 = ((mm%12)+12)%12;
    const k = monthKey(yy,mm2);
    const md = monthData[k]||{};
    const rev = active.reduce((s,p)=>{
      const e = md[p.id]||{bcCount:0,fsCount:0};
      return s+calcRev(p.model,e.bcCount,p.bcS)+calcRev(p.model,e.fsCount,p.fsS);
    },0);
    const leads = active.reduce((s,p)=>{const e=md[p.id]||{bcCount:0,fsCount:0};return s+e.bcCount+e.fsCount;},0);
    return { label:MONTHS[mm2].slice(0,3), rev, leads };
  });

  return (
    <div style={{display:"grid",gap:16}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <MonthNav y={y} m={m} onChange={(ny,nm)=>{setY(ny);setM(nm);}}/>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input
            placeholder="Search partners…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:11,width:160,outline:"none",color:T.text,background:T.surface2,fontFamily:"'Geist',sans-serif"}}
          />
          {hasPrev&&(
            <button onClick={copyPrev} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,color:T.muted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif",display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:13}}>⎘</span> Copy from {MONTHS[m===0?11:m-1]}
            </button>
          )}
          <button onClick={addPartner} style={{padding:"6px 14px",borderRadius:7,border:"none",background:T.navy,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
            + Partner
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard label="Total Revenue"    value={totRev>0?fmtEur(totRev):"€—"}            sub={`${active.length} active · ${MONTHS[m]}`} accent={T.navy}/>
        <KpiCard label="Revenue / Lead"   value={totLeads>0?fmtEur(totRev/totLeads):"€—"} sub="Weighted avg"                             accent={T.blue}/>
        <KpiCard label="Leads this month" value={totLeads>0?fmtNum(totLeads):"—"}          sub={`${totBC} BC · ${totLeads-totBC} FS`}     accent={T.blue2}/>
        <KpiCard label="Partners"         value={partners.length}                           sub={`${active.length} active`}                accent={T.blue3}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,alignItems:"start"}}>

        {/* Partner rows */}
        <div style={{display:"grid",gap:8}}>
          {filtered.map(p => {
            const e = getEntry(p.id);
            const bcRev = calcRev(p.model, e.bcCount, p.bcS);
            const fsRev = calcRev(p.model, e.fsCount, p.fsS);
            const tot   = bcRev + fsRev;

            return (
              <Card key={p.id} style={{overflow:"hidden",opacity:p.active?1:0.5,transition:"opacity .2s"}}>
                {/* Partner header */}
                <div style={{padding:"10px 16px",background:p.active?T.navy:T.muted,display:"flex",alignItems:"center",gap:10}}>
                  <input
                    value={p.name}
                    onChange={e=>updPartner(p.id,{name:e.target.value})}
                    style={{background:"transparent",border:"none",color:"#fff",fontWeight:800,fontSize:13,outline:"none",flex:1,fontFamily:"'Geist',sans-serif"}}
                  />
                  <span style={{fontSize:14,fontWeight:800,color:"#fff",flexShrink:0}}>{tot>0?fmtEur(tot):"€—"}</span>
                  <select
                    value={p.model}
                    onChange={e=>updPartner(p.id,{model:e.target.value})}
                    style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,color:"#fff",fontSize:10,fontWeight:700,padding:"3px 6px",cursor:"pointer",fontFamily:"'Geist',sans-serif",outline:"none"}}
                  >
                    {MODELS.map(mo=><option key={mo.id} value={mo.id} style={{background:T.surface2}}>{mo.label}</option>)}
                  </select>
                  <button onClick={()=>updPartner(p.id,{active:!p.active})} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:6,padding:"3px 10px",color:"#fff",fontSize:10,cursor:"pointer",fontFamily:"'Geist',sans-serif",whiteSpace:"nowrap"}}>
                    {p.active?"● Active":"○ Paused"}
                  </button>
                  <button onClick={()=>removePartner(p.id)} style={{background:"rgba(220,38,38,0.4)",border:"none",borderRadius:6,padding:"3px 8px",color:"#fff",cursor:"pointer",fontSize:11}}>✕</button>
                </div>

                {/* Monthly entry — layout adapts to model */}
                <div style={{padding:"12px 16px",display:"grid",gap:12}}>

                  {/* Top row: leads + rates */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {/* BC */}
                    <div style={{padding:12,background:T.surface2,borderRadius:8,borderTop:`2px solid ${T.navy}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>BC Leads</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <PreciseInput value={e.bcCount} onChange={v=>updEntry(p.id,{bcCount:v})} color={T.navy} width={60}/>
                        <span style={{fontSize:11,color:T.muted}}>leads</span>
                      </div>
                      {(p.model==="cpl"||p.model==="hybrid")&&(
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>CPL/lead</span>
                          <PreciseInput value={p.bcS.cplRate} onChange={v=>updPartner(p.id,{bcS:{...p.bcS,cplRate:v}})} prefix="€" color={T.navy} width={65}/>
                        </div>
                      )}
                      {(p.model==="cpa"||p.model==="hybrid")&&(<>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>Conv. %</span>
                          <PreciseInput value={p.bcS.convRate} onChange={v=>updPartner(p.id,{bcS:{...p.bcS,convRate:v}})} suffix="%" color={T.navy} width={60}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>Ticket</span>
                          <PreciseInput value={p.bcS.ticket} onChange={v=>updPartner(p.id,{bcS:{...p.bcS,ticket:v}})} prefix="€" color={T.navy} width={80}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>Commission</span>
                          <PreciseInput value={p.bcS.commission} onChange={v=>updPartner(p.id,{bcS:{...p.bcS,commission:v}})} suffix="%" color={T.navy} width={60}/>
                        </div>
                      </>)}
                      <div style={{marginTop:6,fontWeight:800,color:T.navy,fontSize:14}}>{fmtEur(bcRev)}</div>
                    </div>

                    {/* FS */}
                    <div style={{padding:12,background:T.surface2,borderRadius:8,borderTop:`2px solid ${T.blue}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>FS Leads</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <PreciseInput value={e.fsCount} onChange={v=>updEntry(p.id,{fsCount:v})} color={T.blue} width={60}/>
                        <span style={{fontSize:11,color:T.muted}}>leads</span>
                      </div>
                      {(p.model==="cpl"||p.model==="hybrid")&&(
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>CPL/lead</span>
                          <PreciseInput value={p.fsS.cplRate} onChange={v=>updPartner(p.id,{fsS:{...p.fsS,cplRate:v}})} prefix="€" color={T.blue} width={65}/>
                        </div>
                      )}
                      {(p.model==="cpa"||p.model==="hybrid")&&(<>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>Conv. %</span>
                          <PreciseInput value={p.fsS.convRate} onChange={v=>updPartner(p.id,{fsS:{...p.fsS,convRate:v}})} suffix="%" color={T.blue} width={60}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>Ticket</span>
                          <PreciseInput value={p.fsS.ticket} onChange={v=>updPartner(p.id,{fsS:{...p.fsS,ticket:v}})} prefix="€" color={T.blue} width={80}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:10,color:T.muted,width:70}}>Commission</span>
                          <PreciseInput value={p.fsS.commission} onChange={v=>updPartner(p.id,{fsS:{...p.fsS,commission:v}})} suffix="%" color={T.blue} width={60}/>
                        </div>
                      </>)}
                      <div style={{marginTop:6,fontWeight:800,color:T.blue,fontSize:14}}>{fmtEur(fsRev)}</div>
                    </div>
                  </div>

                  {/* Bottom row: note + total */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Note</div>
                      <input
                        value={e.note}
                        onChange={ev=>updEntry(p.id,{note:ev.target.value})}
                        placeholder="Deal notes…"
                        style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",fontSize:11,color:T.text,outline:"none",background:T.surface2,fontFamily:"'Geist',sans-serif",boxSizing:"border-box"}}
                      />
                    </div>
                    <div style={{textAlign:"right",padding:"10px 16px",background:T.navy,borderRadius:8,minWidth:100}}>
                      <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:0.8}}>Total</div>
                      <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{fmtEur(tot)}</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length===0&&(
            <Card style={{padding:32,textAlign:"center"}}>
              <div style={{color:T.muted,fontSize:13}}>{search?"No partners match your search":"No partners yet — add one above"}</div>
            </Card>
          )}
        </div>

        {/* Right panel: summary + trend */}
        <div style={{display:"grid",gap:12}}>
          {/* Month summary table */}
          <Card style={{overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:12,color:T.text}}>
              {MONTHS[m]} {y} — Summary
            </div>
            <div style={{overflowY:"auto",maxHeight:320}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:T.surface2}}>
                    {["Partner","Leads","Revenue"].map(h=>(
                      <th key={h} style={{padding:"7px 12px",textAlign:h==="Partner"?"left":"right",fontWeight:700,color:T.muted,fontSize:10,letterSpacing:0.8,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p=>{
                    const e=getEntry(p.id);
                    const rev=calcRev(p.model,e.bcCount,p.bcS)+calcRev(p.model,e.fsCount,p.fsS);
                    const leads=e.bcCount+e.fsCount;
                    return (
                      <tr key={p.id} style={{borderBottom:`1px solid ${T.surface2}`,opacity:p.active?1:0.45}}>
                        <td style={{padding:"8px 12px",fontWeight:600,color:T.text,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          <span style={{color:p.active?T.green:T.muted,marginRight:5,fontSize:8}}>●</span>{p.name}
                        </td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:T.muted}}>{leads>0?leads:"—"}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:rev>0?T.navy:T.muted}}>{rev>0?fmtEur(rev):"—"}</td>
                      </tr>
                    );
                  })}
                  <tr style={{background:T.navy}}>
                    <td style={{padding:"8px 12px",color:"#fff",fontWeight:800,fontSize:11}}>TOTAL</td>
                    <td style={{padding:"8px 12px",textAlign:"right",color:"#fff",fontWeight:700}}>{totLeads>0?totLeads:"—"}</td>
                    <td style={{padding:"8px 12px",textAlign:"right",color:"#fff",fontWeight:800}}>{fmtEur(totRev)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* 6-month mini trend */}
          <Card style={{padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:0.8}}>6-Month Trend</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={trendData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="label" tick={{fontSize:9,fill:T.muted}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip formatter={v=>fmtEur(v)}/>}/>
                <Bar dataKey="rev" name="Revenue" radius={[3,3,0,0]}>
                  {trendData.map((d,i)=><Cell key={i} fill={d.label===MONTHS[m].slice(0,3)?T.navy:T.blue3}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}



// ─── TAB: INSIGHTS (CreditScore enriched data) ────────────────────────────────
function InsightsTab({data}) {
  const bc   = data["Bank Connected"]  || [];
  const fs   = data["Form Submitted"]  || [];
  const inc  = data["Incomplete"]      || [];
  const all  = [...bc, ...fs, ...inc];
  const enriched = all.filter(r => r.income != null);

  if (enriched.length === 0) {
    return (
      <div style={{padding:"60px 0",textAlign:"center",color:T.muted}}>
        <div style={{fontSize:40,marginBottom:12}}>🔍</div>
        <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>No enriched data available</div>
        <div style={{fontSize:13}}>Upload a CreditScore XLSX (Rasmus format) to unlock this tab.</div>
        <div style={{fontSize:12,marginTop:6}}>Required columns: Age, Monthly Net Income, Loan Purpose, Employment Status, etc.</div>
      </div>
    );
  }

  // ── helpers ────────────────────────────────────────────────────────────
  const avg = arr => arr.length ? Math.round(arr.reduce((s,v)=>s+v,0)/arr.length) : 0;
  const median = arr => { if (!arr.length) return 0; const s=[...arr].sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2); };
  const fmtK = n => n>=1000?`€${(n/1000).toFixed(0)}k`:`€${n}`;
  const clean = (arr, field) => arr.map(r=>r[field]).filter(v=>v!=null&&v>0);

  // ── income buckets ──────────────────────────────────────────────────────
  const incomeBuckets = [
    {label:"<€1k",   min:0,    max:999},
    {label:"€1-2k",  min:1000, max:1999},
    {label:"€2-3k",  min:2000, max:2999},
    {label:"€3-5k",  min:3000, max:4999},
    {label:">€5k",   min:5000, max:Infinity},
  ];
  const incomeChart = incomeBuckets.map(b => ({
    label: b.label,
    BC:  bc.filter(r=>r.income>=b.min&&r.income<=b.max).length,
    FS:  fs.filter(r=>r.income>=b.min&&r.income<=b.max).length,
    Inc: inc.filter(r=>r.income>=b.min&&r.income<=b.max).length,
  }));

  // ── loan purpose ─────────────────────────────────────────────────────────
  const purposeCount = {};
  [...bc,...fs].forEach(r => {
    if (!r.purpose) return;
    const p = r.purpose.replace(/_/g," ");
    purposeCount[p] = (purposeCount[p]||0)+1;
  });
  const purposeChart = Object.entries(purposeCount)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,7)
    .map(([label,value])=>({label,value}));

  // ── employment ───────────────────────────────────────────────────────────
  const empCount = {};
  [...bc,...fs].forEach(r => {
    if (!r.employment) return;
    const e = r.employment.replace(/_/g," ");
    empCount[e] = (empCount[e]||0)+1;
  });
  const empChart = Object.entries(empCount).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}));

  // ── age buckets ──────────────────────────────────────────────────────────
  const ageBuckets = [{label:"18-30",min:18,max:30},{label:"31-45",min:31,max:45},{label:"46-60",min:46,max:60},{label:"61+",min:61,max:120}];
  const ageChart = ageBuckets.map(b=>({
    label:b.label,
    BC: bc.filter(r=>r.age>=b.min&&r.age<=b.max).length,
    FS: fs.filter(r=>r.age>=b.min&&r.age<=b.max).length,
  }));

  // ── loan amount buckets ──────────────────────────────────────────────────
  const loanBuckets = [{label:"<€3k",min:0,max:2999},{label:"€3-8k",min:3000,max:7999},{label:"€8-15k",min:8000,max:14999},{label:"€15-30k",min:15000,max:29999},{label:">€30k",min:30000,max:Infinity}];
  const loanChart = loanBuckets.map(b=>({
    label:b.label,
    BC: bc.filter(r=>r.loanAmount>=b.min&&r.loanAmount<=b.max).length,
    FS: fs.filter(r=>r.loanAmount>=b.min&&r.loanAmount<=b.max).length,
  }));

  // ── key stats ────────────────────────────────────────────────────────────
  const allIncomes  = clean([...bc,...fs],"income");
  const allLoans    = clean([...bc,...fs],"loanAmount");
  const bcIncomes   = clean(bc,"income");
  const fsIncomes   = clean(fs,"income");
  const convRate    = (bc.length/(bc.length+fs.length+inc.length)*100).toFixed(1);
  const dropRate    = (inc.length/(bc.length+fs.length+inc.length)*100).toFixed(1);
  const dti = [...bc,...fs].filter(r=>r.income&&r.expenses).map(r=>Math.round((r.expenses/r.income)*100));

  const COLORS = [T.navy,T.blue,T.blue2,T.blue3,T.green,T.amber,T.red];

  return (
    <div style={{display:"grid",gap:20}}>

      {/* ── Top KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14}}>
        <KpiCard label="Avg Income"        value={fmtK(avg(allIncomes))}   sub={`Median ${fmtK(median(allIncomes))}`}  accent={T.navy}/>
        <KpiCard label="Avg Loan Request"  value={fmtK(avg(allLoans))}     sub={`Median ${fmtK(median(allLoans))}`}   accent={T.blue}/>
        <KpiCard label="BC Avg Income"     value={fmtK(avg(bcIncomes))}    sub={`vs FS ${fmtK(avg(fsIncomes))}`}      accent={T.blue2}/>
        <KpiCard label="Funnel Conv."       value={`${convRate}%`}          sub="of all entries incl. drop-offs"       accent={T.green}/>
        <KpiCard label="Drop-off Rate"     value={`${dropRate}%`}          sub="cancelled / incomplete"               accent={T.amber}/>
      </div>

      {/* ── Income distribution + Age ── */}
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16}}>
        <Card style={{padding:"20px 20px 12px"}}>
          <SectionTitle>Income Distribution by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeChart} margin={{top:4,right:4,left:-10,bottom:0}} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="BC"  name="Bank Connected" fill={T.navy}   radius={[4,4,0,0]}/>
              <Bar dataKey="FS"  name="Form Submitted" fill={T.blue3}  radius={[4,4,0,0]}/>
              <Bar dataKey="Inc" name="Incomplete"     fill={T.amber}  radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{padding:"20px 20px 12px"}}>
          <SectionTitle>Age Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageChart} margin={{top:4,right:4,left:-20,bottom:0}} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy}  radius={[4,4,0,0]}/>
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Loan Purpose + Employment ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card style={{padding:"20px"}}>
          <SectionTitle>Loan Purpose</SectionTitle>
          <div style={{display:"grid",gap:8}}>
            {purposeChart.map((p,i)=>{
              const pct = Math.round(p.value/(bc.length+fs.length)*100);
              return (
                <div key={p.label}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:T.text,textTransform:"capitalize"}}>{p.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:COLORS[i%COLORS.length]}}>{p.value} <span style={{fontWeight:400,color:T.muted}}>({pct}%)</span></span>
                  </div>
                  <div style={{height:7,background:T.surface2,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:COLORS[i%COLORS.length],borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{padding:"20px"}}>
          <SectionTitle>Employment Status</SectionTitle>
          <div style={{display:"grid",gap:8}}>
            {empChart.map((e,i)=>{
              const pct = Math.round(e.value/(bc.length+fs.length)*100);
              return (
                <div key={e.label}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:T.text,textTransform:"capitalize"}}>{e.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:COLORS[i%COLORS.length]}}>{e.value} <span style={{fontWeight:400,color:T.muted}}>({pct}%)</span></span>
                  </div>
                  <div style={{height:7,background:T.surface2,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:COLORS[i%COLORS.length],borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Loan amount + DTI ── */}
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16}}>
        <Card style={{padding:"20px 20px 12px"}}>
          <SectionTitle>Requested Loan Amount Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={loanChart} margin={{top:4,right:4,left:-20,bottom:0}} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.6} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="BC" name="Bank Connected" fill={T.navy}  radius={[4,4,0,0]}/>
              <Bar dataKey="FS" name="Form Submitted" fill={T.blue3} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{padding:"20px"}}>
          <SectionTitle>Debt-to-Income Ratio</SectionTitle>
          <div style={{display:"grid",gap:10}}>
            {[
              ["< 30%",  "Solvent",     0,  29,       T.green,  "#"],
              ["30–35%", "Acceptable",  30, 34,       "#65A30D", "~"],
              ["35–40%", "Tight",       35, 39,       T.amber,  "!"],
              ["40–50%", "High risk",   40, 49,       "#F97316", "!!"],
              ["> 50%",  "Exclusion",   50, Infinity, T.red,    "✕"],
            ].map(([range, label, min, max, color, icon])=>{
              const count = dti.filter(v=>v>=min&&v<=max).length;
              const pct = dti.length ? Math.round(count/dti.length*100) : 0;
              return (
                <div key={label}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:10,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",
                        background:`${color}20`,color,border:`1px solid ${color}40`,
                        borderRadius:4,padding:"1px 5px",letterSpacing:0.5}}>
                        {range}
                      </span>
                      <span style={{fontSize:11,color:T.text,fontWeight:500}}>{label}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color,fontVariantNumeric:"tabular-nums",
                      fontFamily:"'IBM Plex Mono',monospace"}}>
                      {count} <span style={{color:T.muted,fontWeight:400}}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{height:6,background:T.surface2,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:6,padding:"10px 12px",background:T.surface2,borderRadius:8,
              fontSize:10,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.6}}>
              Spain criterion · Banco de España / Ley 5/2019 LCCI<br/>
              {dti.length} leads with complete data · critical threshold 35–40%
            </div>
          </div>
        </Card>
      </div>

      {/* ── Funnel ── */}
      <Card style={{padding:"20px"}}>
        <SectionTitle>Conversion Funnel</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,position:"relative"}}>
          {[
            {label:"Total Entries",    value:all.length,       color:T.navy,  pct:100},
            {label:"Form Completed",   value:bc.length+fs.length, color:T.blue,  pct:Math.round((bc.length+fs.length)/all.length*100)},
            {label:"Bank Connected",   value:bc.length,        color:T.blue2, pct:Math.round(bc.length/all.length*100)},
            {label:"Email Verified",    value:all.filter(r=>r.emailVerified).length, color:T.green, pct:Math.round(all.filter(r=>r.emailVerified).length/Math.max(all.length,1)*100)},
          ].map((step,i,arr)=>(
            <div key={step.label} style={{textAlign:"center",padding:"20px 10px",position:"relative"}}>
              <div style={{height:6,background:step.color,borderRadius:i===0?"4px 0 0 4px":i===arr.length-1?"0 4px 4px 0":"0",marginBottom:16,opacity:0.85}}/>
              <div style={{fontSize:28,fontWeight:900,color:step.color}}>{step.value}</div>
              <div style={{fontSize:11,fontWeight:700,color:T.text,marginTop:4}}>{step.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:step.color,marginTop:4}}>{step.pct}%</div>
              {i<arr.length-1&&<div style={{position:"absolute",right:-8,top:"50%",transform:"translateY(-50%)",fontSize:20,color:T.muted,zIndex:1}}>›</div>}
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}


// ─── TAB: DATA QUALITY ────────────────────────────────────────────────────────
function DataQualityTab({data}) {
  const bc   = data["Bank Connected"]  || [];
  const fs   = data["Form Submitted"]  || [];
  const inc  = data["Incomplete"]      || [];
  const all  = [...bc, ...fs, ...inc];

  if (all.length === 0) {
    return (
      <div style={{padding:"60px 0",textAlign:"center",color:T.muted}}>
        <div style={{fontSize:40,marginBottom:12}}>🔬</div>
        <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>No data loaded</div>
        <div style={{fontSize:13}}>Upload an XLSX to run data quality analysis.</div>
      </div>
    );
  }

  // ── Email validation ────────────────────────────────────────────────────────
  const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const validEmails   = all.filter(r => r.email && emailRe.test(r.email));
  const invalidEmails = all.filter(r => !r.email || !emailRe.test(r.email));

  // ── Name completeness ───────────────────────────────────────────────────────
  const fullName    = all.filter(r => (r.name||"").trim().split(/\s+/).length >= 2);
  const singleName  = all.filter(r => (r.name||"").trim().split(/\s+/).length < 2);

  // ── Financial completeness (CreditScore format only) ───────────────────────
  const enriched    = all.filter(r => r.income != null);
  const isEnriched  = enriched.length > 0;
  const hasAllFin   = all.filter(r => r.income && r.expenses && r.loanAmount && r.employment);
  const emailVerif  = all.filter(r => r.emailVerified);

  // ── Email domains ───────────────────────────────────────────────────────────
  const domainCount = {};
  all.forEach(r => {
    if (!r.email) return;
    const d = r.email.split("@")[1]?.toLowerCase() || "unknown";
    domainCount[d] = (domainCount[d] || 0) + 1;
  });
  const topDomains = Object.entries(domainCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0,8)
    .map(([domain, count]) => ({ domain, count, pct: Math.round(count/all.length*100) }));

  // ── Deliverability score ────────────────────────────────────────────────────
  // Weighted: valid email (40%) + full name (20%) + email verified (25%) + financial complete (15%)
  const scoreEmail  = all.length ? (validEmails.length / all.length) * 40 : 0;
  const scoreName   = all.length ? (fullName.length / all.length) * 20 : 0;
  const scoreVerif  = all.length ? (emailVerif.length / all.length) * 25 : 0;
  const scoreFin    = isEnriched && all.length ? (hasAllFin.length / all.length) * 15 : 15; // full marks if no enrichment (Pipedrive)
  const delivScore  = Math.round(scoreEmail + scoreName + scoreVerif + scoreFin);
  const scoreColor  = delivScore >= 80 ? T.green : delivScore >= 60 ? T.amber : T.red;
  const scoreLabel  = delivScore >= 80 ? "High Quality" : delivScore >= 60 ? "Moderate" : "Needs Review";

  // ── Issues list ─────────────────────────────────────────────────────────────
  const issues = [];
  if (invalidEmails.length > 0)
    issues.push({ level:"error",   msg:`${invalidEmails.length} invalid email format${invalidEmails.length>1?"s":""}`, detail: invalidEmails.slice(0,3).map(r=>r.email).join(", ") });
  if (singleName.length > all.length * 0.2)
    issues.push({ level:"warning", msg:`${singleName.length} leads with only a first name (no surname)`, detail:`${Math.round(singleName.length/all.length*100)}% of total — may affect partner matching` });
  if (emailVerif.length < all.length * 0.8)
    issues.push({ level:"warning", msg:`Only ${emailVerif.length} email-verified leads (${Math.round(emailVerif.length/all.length*100)}%)`, detail:"Below 80% threshold — consider filtering unverified before delivery" });
  if (issues.length === 0)
    issues.push({ level:"ok", msg:"No critical issues detected", detail:"Dataset looks clean and ready for partner delivery" });

  const issueColor = { error: T.red, warning: T.amber, ok: T.green };
  const issueIcon  = { error: "🔴", warning: "🟡", ok: "✅" };
  const issueBg    = { error: T.redBg, warning: T.amberBg, ok: T.greenBg };
  const issueBorder= { error: "#FCA5A5", warning: "rgba(245,158,11,0.3)", ok: "rgba(16,185,129,0.3)" };

  // ── Duplicates stats (derived from what the parser removed) ────────────────
  // We can infer: parser stored best-per-email, so we track via a flag
  // Instead show: leads per category as share of total
  const catBreakdown = [
    { label:"Bank Connected", count:bc.length,  color:T.navy,  pct: Math.round(bc.length/all.length*100)  },
    { label:"Form Submitted", count:fs.length,  color:T.blue,  pct: Math.round(fs.length/all.length*100)  },
    { label:"Incomplete",     count:inc.length, color:T.amber, pct: Math.round(inc.length/all.length*100) },
  ];

  return (
    <div style={{display:"grid",gap:20}}>

      {/* ── Deliverability Score + Issues ── */}
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>

        {/* Score circle */}
        <Card style={{padding:"24px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{fontSize:11,fontWeight:800,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:4}}>Deliverability Score</div>
          <div style={{position:"relative",width:140,height:140}}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke={T.surface2} strokeWidth="12"/>
              <circle cx="70" cy="70" r="58" fill="none" stroke={scoreColor} strokeWidth="12"
                strokeDasharray={`${2*Math.PI*58*delivScore/100} ${2*Math.PI*58}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{transition:"stroke-dasharray 1s ease"}}
              />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:36,fontWeight:900,color:scoreColor,lineHeight:1}}>{delivScore}</div>
              <div style={{fontSize:10,color:T.muted,fontWeight:600}}>/100</div>
            </div>
          </div>
          <div style={{fontSize:14,fontWeight:800,color:scoreColor}}>{scoreLabel}</div>
          <div style={{width:"100%",marginTop:8,display:"grid",gap:6}}>
            {[
              ["Valid emails",       Math.round(validEmails.length/all.length*100), 40],
              ["Full names",         Math.round(fullName.length/all.length*100),    20],
              ["Email verified",     Math.round(emailVerif.length/all.length*100),  25],
              ["Financial data",     isEnriched ? Math.round(hasAllFin.length/all.length*100) : 100, 15],
            ].map(([label,pct,weight])=>(
              <div key={label}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:10,color:T.textSub}}>{label}</span>
                  <span style={{fontSize:10,fontWeight:700,color:pct>=80?T.green:pct>=60?T.amber:T.red}}>{pct}% <span style={{color:T.muted,fontWeight:400}}>·{weight}pts</span></span>
                </div>
                <div style={{height:4,background:T.surface2,borderRadius:4}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct>=80?T.green:pct>=60?T.amber:T.red,borderRadius:4,transition:"width .6s"}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Issues + KPIs */}
        <div style={{display:"grid",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <KpiCard label="Total Leads"      value={all.length}                sub="after dedup & filter"          accent={T.navy}/>
            <KpiCard label="Valid Emails"     value={`${Math.round(validEmails.length/all.length*100)}%`} sub={`${validEmails.length} of ${all.length}`} accent={T.green}/>
            <KpiCard label="Full Names"       value={`${Math.round(fullName.length/all.length*100)}%`}   sub={`${singleName.length} single-name`}        accent={T.blue2}/>
            <KpiCard label="Email Verified"   value={`${Math.round(emailVerif.length/all.length*100)}%`} sub={`${emailVerif.length} confirmed`}           accent={T.blue3}/>
          </div>

          <Card style={{padding:"16px 20px"}}>
            <div style={{fontSize:11,fontWeight:800,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Issues & Recommendations</div>
            <div style={{display:"grid",gap:8}}>
              {issues.map((issue,i)=>(
                <div key={i} style={{padding:"10px 14px",background:issueBg[issue.level],border:`1px solid ${issueBorder[issue.level]}`,borderRadius:8,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:14,flexShrink:0}}>{issueIcon[issue.level]}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:issueColor[issue.level]}}>{issue.msg}</div>
                    <div style={{fontSize:11,color:T.textSub,marginTop:2}}>{issue.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Category breakdown */}
          <Card style={{padding:"16px 20px"}}>
            <div style={{fontSize:11,fontWeight:800,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Category Breakdown</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {catBreakdown.map(cat=>(
                <div key={cat.label} style={{padding:"12px",background:T.surface2,borderRadius:8,borderLeft:`3px solid ${cat.color}`}}>
                  <div style={{fontSize:22,fontWeight:900,color:cat.color}}>{cat.count}</div>
                  <div style={{fontSize:11,fontWeight:700,color:T.text,marginTop:2}}>{cat.label}</div>
                  <div style={{fontSize:10,color:T.muted}}>{cat.pct}% of total</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Email domain breakdown + Invalid emails ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card style={{padding:"20px"}}>
          <SectionTitle>Email Domain Distribution</SectionTitle>
          <div style={{display:"grid",gap:8}}>
            {topDomains.map((d,i)=>{
              const colors=[T.navy,T.blue,T.blue2,T.blue3,"#6366F1","#8B5CF6",T.amber,T.muted];
              return (
                <div key={d.domain}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:T.text,fontFamily:"'IBM Plex Mono','SF Mono',ui-monospace,monospace"}}>@{d.domain}</span>
                    <span style={{fontSize:12,fontWeight:700,color:colors[i]}}>{d.count} <span style={{color:T.muted,fontWeight:400}}>({d.pct}%)</span></span>
                  </div>
                  <div style={{height:6,background:T.surface2,borderRadius:4}}>
                    <div style={{height:"100%",width:`${d.pct}%`,background:colors[i],borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:12,padding:"8px 12px",background:T.surface2,borderRadius:6,fontSize:10,color:T.muted}}>
            {Math.round((domainCount["gmail.com"]||0)/all.length*100)}% Gmail · {Math.round(((domainCount["hotmail.com"]||0)+(domainCount["hotmail.es"]||0))/all.length*100)}% Hotmail · {Math.round(((domainCount["yahoo.es"]||0)+(domainCount["yahoo.com"]||0))/all.length*100)}% Yahoo
          </div>
        </Card>

        <Card style={{padding:"20px"}}>
          <SectionTitle>Name Completeness</SectionTitle>
          {/* Visual donut-style split */}
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:20}}>
            <div style={{position:"relative",width:100,height:100,flexShrink:0}}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke={T.surface2} strokeWidth="16"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke={T.green} strokeWidth="16"
                  strokeDasharray={`${2*Math.PI*40*fullName.length/Math.max(all.length,1)} ${2*Math.PI*40}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:T.green}}>{Math.round(fullName.length/all.length*100)}%</div>
              </div>
            </div>
            <div style={{display:"grid",gap:8,flex:1}}>
              <div style={{padding:"10px 14px",background:T.greenBg,borderRadius:8,borderLeft:`3px solid ${T.green}`}}>
                <div style={{fontSize:18,fontWeight:900,color:T.green}}>{fullName.length}</div>
                <div style={{fontSize:11,color:T.textSub}}>Full name (first + surname)</div>
              </div>
              <div style={{padding:"10px 14px",background:T.amberBg,borderRadius:8,borderLeft:`3px solid ${T.amber}`}}>
                <div style={{fontSize:18,fontWeight:900,color:T.amber}}>{singleName.length}</div>
                <div style={{fontSize:11,color:T.textSub}}>First name only</div>
              </div>
            </div>
          </div>
          {singleName.length > 0 && (
            <div>
              <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Sample — single name leads</div>
              <div style={{display:"grid",gap:4,maxHeight:140,overflowY:"auto"}}>
                {singleName.slice(0,8).map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 10px",background:T.surface2,borderRadius:6,fontSize:11}}>
                    <span style={{fontWeight:600,color:T.text}}>{r.name||"—"}</span>
                    <span style={{color:T.muted,fontFamily:"'IBM Plex Mono','SF Mono',ui-monospace,monospace"}}>{r.email}</span>
                  </div>
                ))}
                {singleName.length > 8 && <div style={{fontSize:10,color:T.muted,textAlign:"center",padding:"4px"}}>+{singleName.length-8} more</div>}
              </div>
            </div>
          )}
        </Card>
      </div>



    </div>
  );
}


// ─── TAB: COUNTRIES ────────────────────────────────────────────────────────────
const COUNTRY_META = {
  es: { flag:"🇪🇸", label:"Spain",        lang:"spanish",    color:"#C60B1E", primary:true },
  en: { flag:"🌍", label:"English-speaking", lang:"english", color:"#4B5563", primary:false },
  pt: { flag:"🇵🇹", label:"Portugal",     lang:"portuguese", color:"#006600", primary:false },
  it: { flag:"🇮🇹", label:"Italy",        lang:"italian",    color:"#008C45", primary:false },
  fr: { flag:"🇫🇷", label:"France",       lang:"french",     color:"#0055A4", primary:false },
  de: { flag:"🇩🇪", label:"Germany",      lang:"german",     color:"#333333", primary:false },
  nl: { flag:"🇳🇱", label:"Netherlands",  lang:"dutch",      color:"#AE1C28", primary:false },
  pl: { flag:"🇵🇱", label:"Poland",       lang:"polish",     color:"#DC143C", primary:false },
};

function CountriesTab({ data }) {
  const bc  = data["Bank Connected"]  || [];
  const fs  = data["Form Submitted"]  || [];
  const all = [...bc, ...fs];

  const isEnriched = all.some(r => r.income != null);
  const fmtK = n => n >= 1000 ? `€${(n/1000).toFixed(0)}k` : `€${n}`;

  // Country is always derived from Language field (permanent approach)

  // Aggregate per country
  const countryStats = {};
  all.forEach(r => {
    const c = r.country || "unknown";
    if (!countryStats[c]) countryStats[c] = { total:0, bc:0, fs:0, incomes:[], loans:[] };
    countryStats[c].total++;
    if (bc.includes(r)) countryStats[c].bc++;
    if (fs.includes(r)) countryStats[c].fs++;
    if (r.income)     countryStats[c].incomes.push(r.income);
    if (r.loanAmount) countryStats[c].loans.push(r.loanAmount);
  });

  const sorted = Object.entries(countryStats)
    .sort((a,b) => b[1].total - a[1].total);

  const [active, setActive] = useState(sorted[0]?.[0] || "es");
  const activeStat = countryStats[active] || {};
  const activeMeta = COUNTRY_META[active] || { flag:"🌍", label: active, color: T.navy };
  const avgInc  = activeStat.incomes?.length ? Math.round(activeStat.incomes.reduce((s,v)=>s+v,0)/activeStat.incomes.length) : null;
  const avgLoan = activeStat.loans?.length   ? Math.round(activeStat.loans.reduce((s,v)=>s+v,0)/activeStat.loans.length)   : null;
  const bcRate  = activeStat.total > 0 ? Math.round(activeStat.bc / activeStat.total * 100) : 0;

  // Purpose breakdown for active country
  const activeLeads = all.filter(r => (r.country || "unknown") === active);
  const purposeCount = {};
  activeLeads.forEach(r => { if (r.purpose) purposeCount[r.purpose] = (purposeCount[r.purpose]||0)+1; });
  const topPurposes = Object.entries(purposeCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const hasData = all.some(r => r.country);

  return (
    <div style={{display:"grid",gap:16}}>





      {/* Country selector cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
        {sorted.map(([code, stat]) => {
          const meta = COUNTRY_META[code] || { flag:"🌍", label:code, color:T.navy };
          const isAct = active === code;
          const rate  = stat.total > 0 ? Math.round(stat.bc/stat.total*100) : 0;
          return (
            <button key={code} onClick={()=>setActive(code)} style={{
              textAlign:"left",padding:"14px 16px",borderRadius:10,cursor:"pointer",
              background:isAct?meta.color+"22":T.surface2,
              border:`1.5px solid ${isAct?meta.color:T.border}`,
              transition:"all .15s",
              boxShadow:isAct?"0 4px 16px rgba(0,0,0,0.15)":"none",
            }}>
              <div style={{fontSize:22,marginBottom:4}}>{meta.flag}</div>
              <div style={{fontSize:12,fontWeight:800,color:isAct?"#fff":T.text,marginBottom:1}}>{meta.label}</div>
              <div style={{fontSize:10,color:isAct?"rgba(255,255,255,0.85)":T.muted,fontStyle:"italic",marginBottom:4}}>{meta.lang}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:meta.color}}>{stat.total} leads</span>
                <span style={{width:1,height:10,background:isAct?"rgba(255,255,255,0.3)":T.border,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.muted}}>{rate}% BC</span>
              </div>
            </button>
          );
        })}

        {/* Placeholder cards for target expansion markets with no data yet */}
        {Object.entries(COUNTRY_META)
          .filter(([code]) => !countryStats[code])
          .map(([code, meta]) => (
            <div key={code} style={{
              padding:"14px 16px",borderRadius:10,
              background:T.surface,border:`2px dashed ${T.border}`,
              opacity:0.5,
            }}>
              <div style={{fontSize:22,marginBottom:6,filter:"grayscale(0.5)"}}>{meta.flag}</div>
              <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:2}}>{meta.label}</div>
              <div style={{fontSize:10,color:T.muted,fontStyle:"italic"}}>{meta.lang}</div>
              <div style={{fontSize:10,color:T.border,marginTop:6}}>No leads yet</div>
            </div>
          ))
        }
      </div>

      {/* Detail for active country */}
      {hasData && activeStat.total > 0 && (
        <>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            <KpiCard label="Total Leads"    value={activeStat.total}                           sub={`${activeMeta.flag} ${activeMeta.label}`}  accent={activeMeta.color}/>
            <KpiCard label="Bank Connected" value={activeStat.bc}                              sub={`${bcRate}% BC rate`}                       accent={T.blue}/>
            <KpiCard label="Form Submitted" value={activeStat.fs}                              sub="Pending OB connection"                      accent={T.blue2}/>
            <KpiCard label="Avg Loan"       value={isEnriched&&avgLoan ? fmtK(avgLoan) : "—"} sub={isEnriched&&avgInc?`Avg income ${fmtK(avgInc)}`:"Upload enriched data"} accent={T.blue3}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {/* Loan purpose breakdown */}
            <Card style={{padding:20}}>
              <SectionTitle>Loan Purpose — {activeMeta.label}</SectionTitle>
              {topPurposes.length > 0 ? topPurposes.map(([purpose, count]) => (
                <div key={purpose} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:T.textSub,textTransform:"capitalize"}}>{purpose.replace(/_/g," ")}</span>
                    <span style={{fontSize:12,fontWeight:700,color:activeMeta.color}}>{count} · {activeLeads.length>0?Math.round(count/activeLeads.length*100):0}%</span>
                  </div>
                  <div style={{height:5,background:T.surface2,borderRadius:3}}>
                    <div style={{height:"100%",width:`${activeLeads.length>0?Math.round(count/activeLeads.length*100):0}%`,background:activeMeta.color,borderRadius:3,transition:"width .4s"}}/>
                  </div>
                </div>
              )) : <div style={{color:T.muted,fontSize:12}}>No purpose data</div>}
            </Card>

            {/* Country comparison table */}
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:12,color:T.text}}>All Markets — Overview</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:T.surface2}}>
                    {["Country","Leads","BC","BC%","Avg Loan"].map(h=>(
                      <th key={h} style={{padding:"7px 12px",textAlign:h==="Country"?"left":"right",fontWeight:700,color:T.muted,fontSize:10,letterSpacing:0.8,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(([code, stat]) => {
                    const meta = COUNTRY_META[code] || { flag:"🌍", label:code, color:T.navy };
                    const rate = stat.total>0?Math.round(stat.bc/stat.total*100):0;
                    const avg  = stat.loans.length?Math.round(stat.loans.reduce((s,v)=>s+v,0)/stat.loans.length):null;
                    const isAct = active === code;
                    return (
                      <tr key={code} onClick={()=>setActive(code)} style={{borderBottom:`1px solid ${T.surface2}`,cursor:"pointer",background:isAct?`${meta.color}1A`:"transparent"}} onMouseEnter={e=>e.currentTarget.style.background=`${meta.color}1A`} onMouseLeave={e=>e.currentTarget.style.background=isAct?`${meta.color}1A`:"transparent"}>
                        <td style={{padding:"8px 12px",fontWeight:600,color:T.text}}>{meta.flag} {meta.label}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:T.muted}}>{stat.total}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:T.muted}}>{stat.bc}</td>
                        <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:rate>=30?T.green:T.amber}}>{rate}%</td>
                        <td style={{padding:"8px 12px",textAlign:"right",color:T.muted}}>{avg&&isEnriched?fmtK(avg):"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── VERTICAL DEFINITIONS ──────────────────────────────────────────────────────
// NOTE: refinance ≠ home_improvement — completely different products, partners & pricing
// refinance/mortgage: tied to property valuation, regulated, long-term, brokers & banks
// home_improvement: unsecured personal credit up to €50k, reform companies, faster closing
const VERTICALS_DEF = {
  personal_loans: {
    id:"personal_loans", label:"Personal Loans",
    color:"#005EFF", lightBg:T.surface3, border:"rgba(59,130,246,0.3)",
    purposes:["personal_expenses","other","holiday","education","it_equipment"],
    desc:"Unsecured consumer credit — expenses, lifestyle, education",
    partnerTypes:["Consumer finance","BNPL","Neobanks","Credit unions","Fintech lenders"],
    creditNote:"Unsecured · up to €50k · 6–84 months · no collateral",
    modelNote:"CPL €8–12 or CPA 1–1.5% for consumer credit partners",
    stats:{ avgIncome:2017, avgLoan:7511, avgAge:51, bcRate:39 },
  },
  reform: {
    id:"reform", label:"Home Reform",
    color:"#00A651", lightBg:"#EDFAF3", border:"rgba(16,185,129,0.3)",
    purposes:["home_improvement"],
    desc:"Home reform & improvement — unsecured credit, no property appraisal",
    partnerTypes:["Reform financing companies","Home improvement lenders","Consumer banks","BNPL for reform"],
    creditNote:"Unsecured personal credit · avg €7.9k · median €3k · 42% homeowners",
    modelNote:"CPL €10–18 or CPA 1–2% · faster closing than mortgage · no appraisal needed",
    stats:{ avgIncome:2124, avgLoan:7856, avgAge:51, bcRate:36, homeowners:42 },
    insightNote:"83% of reform leads request <€15k — typical unsecured personal credit range. Only 13 leads request >€15k where secured products might apply.",
  },
  mortgage: {
    id:"mortgage", label:"Mortgage / Refinance",
    color:"#6D28D9", lightBg:T.surface3, border:"rgba(139,92,246,0.3)",
    purposes:["refinance"],
    desc:"Mortgage refinancing — tied to property valuation, regulated product",
    partnerTypes:["Mortgage brokers","Banks","Savings banks (Cajas)","Intermediarios hipotecarios"],
    creditNote:"Secured by property · avg €14.9k requested · 39% homeowners · avg 67 months · 82% have existing loans",
    modelNote:"CPL €20–50 or fixed fee per qualified lead · regulated by LCCI · longer sales cycle",
    stats:{ avgIncome:2009, avgLoan:14893, avgAge:52, bcRate:25, homeowners:39 },
    insightNote:"25% BC rate is lower — expected for mortgage (higher intent bar). 82% have existing loans (refinance intent confirmed). Needs LCCI compliance from partner.",
    regulatory:"LCCI regulated (Ley 5/2019) · Intermediarios hipotecarios need BDER registration · Mandatory cooling-off period",
  },
  vehicle_unsecured: {
    id:"vehicle_unsecured", label:"Vehicle — Personal Credit",
    color:"#F59E0B", lightBg:T.amberBg, border:"rgba(245,158,11,0.4)",
    purposes:["vehicle"],
    // Filter applied in UI: loan ≤ €15k AND months ≤ 60
    vehicleFilter:"unsecured",
    desc:"Personal unsecured credit for vehicle purchase — vehicle is the destination, not the collateral",
    partnerTypes:["Consumer finance (Cetelem, Cofidis)","Car dealers with own financing","Banks (personal loan product)","Neobanks"],
    creditNote:"Unsecured personal credit · no vehicle guarantee · loan ≤€15k · term ≤60 months · ~14 leads in current batch",
    modelNote:"CPL €8–15 · same product as personal loan but vehicle-purpose declared · faster approval · no registration needed",
    insightNote:"70% of vehicle leads fall here. Standard personal credit product — partners underwrite on income/DTI, not vehicle value. No titulación or ITV required.",
    stats:{ avgIncome:1952, avgLoan:4500, avgAge:48, bcRate:30 },
  },
  vehicle_secured: {
    id:"vehicle_secured", label:"Vehicle — Secured Credit",
    color:"#DC2626", lightBg:T.redBg, border:"rgba(239,68,68,0.3)",
    purposes:["vehicle"],
    // Filter applied in UI: loan > €15k OR months > 60
    vehicleFilter:"secured",
    desc:"Credit with vehicle as collateral — the vehicle is the guarantee, not just the purchase destination",
    partnerTypes:["Auto financing entities (ALD, Arval)","Specialized vehicle lenders","Dealers with secured financing","Banks (auto loan product)"],
    creditNote:"Secured by vehicle · loan >€15k or term >60 months · vehicle valuation required · registration as collateral · ~6 leads in current batch",
    modelNote:"CPL €20–40 · higher ticket, longer cycle · partner needs vehicle valuation process (ITV, tasación) · different risk model than unsecured",
    insightNote:"30% of vehicle leads. Loans up to €45k at 120 months only make sense with vehicle as guarantee — income alone (€500–3,500/mo) wouldn't support that ticket unsecured.",
    regulatory:"Vehicle registration as collateral requires notarial process (reserva de dominio or prenda sin desplazamiento). Partner must have this capability.",
    stats:{ avgIncome:2200, avgLoan:22000, avgAge:47, bcRate:17 },
  },
};

// ─── VERTICAL SVG ICONS ────────────────────────────────────────────────────────
const VERTICAL_ICONS = {
  personal_loans: (sz=20) => (
    <svg width={sz} height={Math.round(sz*0.78)} viewBox="0 0 18 14" fill="none">
      <rect x="1" y="1" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  reform: (sz=20) => (
    <svg width={sz} height={sz} viewBox="0 0 18 18" fill="none">
      <path d="M2 8L9 2l7 6v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 17V9h6v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  mortgage: (sz=20) => (
    <svg width={Math.round(sz*0.89)} height={sz} viewBox="0 0 16 18" fill="none">
      <rect x="1" y="6" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M0.5 7L8 2l7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="5.5" y="11" width="5" height="6" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  vehicle_unsecured: (sz=20) => (
    <svg width={sz} height={Math.round(sz*0.7)} viewBox="0 0 20 14" fill="none">
      <path d="M4 7.5l2-5h8l2 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="1" y="7.5" width="18" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="15" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  vehicle_secured: (sz=20) => (
    <svg width={Math.round(sz*0.78)} height={sz} viewBox="0 0 14 18" fill="none">
      <rect x="2" y="8" width="10" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 8V5a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  ),
};

// ─── VERTICALS TAB ─────────────────────────────────────────────────────────────
// Vehicle heuristic: no explicit field in XLSX — inferred from loan size + term
// unsecured: loan ≤ €15k AND months ≤ 60 | secured: loan > €15k OR months > 60
function applyVehicleFilter(leads, vehFilter) {
  if (vehFilter === "unsecured") return leads.filter(r => (r.loanAmount||0) <= 15000 && (r.loanMonths||0) <= 60);
  if (vehFilter === "secured")   return leads.filter(r => (r.loanAmount||0) > 15000  || (r.loanMonths||0) > 60);
  return leads;
}

function VerticalsTab({data}) {
  const [activeV, setActiveV] = useState("personal_loans");
  const bc  = data["Bank Connected"]  || [];
  const fs  = data["Form Submitted"]  || [];
  const all = [...bc, ...fs];
  const isEnriched = all.some(r => r.income != null);

  const V        = VERTICALS_DEF[activeV];
  const baseLeads = all.filter(r => V.purposes.includes(r.purpose));
  const baseBC    = bc.filter(r  => V.purposes.includes(r.purpose));
  const baseFS    = fs.filter(r  => V.purposes.includes(r.purpose));
  const vLeads   = applyVehicleFilter(baseLeads, V.vehicleFilter);
  const vBC      = applyVehicleFilter(baseBC,    V.vehicleFilter);
  const vFS      = applyVehicleFilter(baseFS,    V.vehicleFilter);
  const vRate    = vLeads.length > 0 ? Math.round(vBC.length/vLeads.length*100) : 0;

  const incomes    = vLeads.map(r=>r.income).filter(Boolean);
  const loans      = vLeads.map(r=>r.loanAmount).filter(Boolean);
  const ages       = vLeads.map(r=>r.age).filter(Boolean);
  const avgInc     = incomes.length ? Math.round(incomes.reduce((s,v)=>s+v,0)/incomes.length) : null;
  const avgLoan    = loans.length   ? Math.round(loans.reduce((s,v)=>s+v,0)/loans.length) : null;
  const avgAge     = ages.length    ? Math.round(ages.reduce((s,v)=>s+v,0)/ages.length) : null;
  const highValue  = vBC.filter(r=>(r.income||0)>2000&&(r.loanAmount||0)>5000);

  const empCount = {}; vLeads.forEach(r=>{if(r.employment){const e=r.employment.replace(/_/g," ");empCount[e]=(empCount[e]||0)+1;}});
  const topEmp   = Object.entries(empCount).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const resCount = {}; vLeads.forEach(r=>{if(r.residential){const e=r.residential.replace(/_/g," ");resCount[e]=(resCount[e]||0)+1;}});
  const topRes   = Object.entries(resCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const dti = {h:0,m:0,hi:0};
  vLeads.forEach(r=>{
    if(r.income&&r.expenses&&r.income>0){
      const ratio=r.expenses/r.income;
      if(ratio<0.3)dti.h++; else if(ratio<0.5)dti.m++; else dti.hi++;
    }
  });

  const fmtK = n => n>=1000?`€${(n/1000).toFixed(0)}k`:`€${n}`;

  return (
    <div style={{display:"grid",gap:18}}>
      {/* Vertical Selector Cards — 5 verticals, each product correctly separated */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
        {Object.values(VERTICALS_DEF).map(v=>{
          const base = [...bc,...fs].filter(r=>v.purposes.includes(r.purpose));
          const bBC  = bc.filter(r=>v.purposes.includes(r.purpose));
          const vl   = applyVehicleFilter(base, v.vehicleFilter);
          const vb   = applyVehicleFilter(bBC,  v.vehicleFilter);
          const active = activeV===v.id;
          return (
            <button key={v.id} onClick={()=>setActiveV(v.id)} style={{
              textAlign:"left",padding:"16px 18px",borderRadius:12,cursor:"pointer",
              background:active?v.color:T.surface,
              border:`2px solid ${active?v.color:T.border}`,
              transition:"all .15s",boxShadow:active?"0 4px 16px rgba(0,0,0,0.15)":"none",
            }}>
              <div style={{marginBottom:7,color:active?"#fff":v.color,lineHeight:0}}>{VERTICAL_ICONS[v.id]?.(20)}</div>
              <div style={{fontSize:13,fontWeight:900,color:active?"#fff":T.text,letterSpacing:-0.2}}>{v.label}</div>
              <div style={{fontSize:10,color:active?"rgba(255,255,255,0.85)":T.muted,margin:"3px 0 10px",lineHeight:1.4}}>{v.desc}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:800,color:active?"#fff":v.color}}>{vl.length} leads</span>
                <span style={{width:1,height:10,background:active?"rgba(255,255,255,0.3)":T.border,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:active?"rgba(255,255,255,0.75)":T.muted}}>
                  {vl.length>0?Math.round(vb.length/vl.length*100):0}% BC
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Heuristic notice for vehicle sub-verticals */}
      {V.vehicleFilter && (
        <div style={{
          display:"flex",alignItems:"flex-start",gap:10,
          padding:"10px 16px",
          background: V.vehicleFilter==="secured" ? T.redBg : T.amberBg,
          border:`1px solid ${V.vehicleFilter==="secured" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.4)"}`,
          borderRadius:8, fontSize:11,
          color: V.vehicleFilter==="secured" ? "#9F1239" : "#78350F",
        }}>
          <svg width="16" height="14" viewBox="0 0 14 13" fill="none" style={{flexShrink:0}}><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill="currentColor"/></svg>
          <div style={{lineHeight:1.6}}>
            <strong>Heuristic segmentation — no explicit field in source data.</strong>{" "}
            {V.vehicleFilter==="unsecured"
              ? "Leads classified as unsecured personal credit based on loan ≤€15k AND term ≤60 months. The vehicle is the stated purchase destination, not the collateral. Underwriting is based on income and DTI."
              : "Leads classified as vehicle-secured based on loan >€15k OR term >60 months — amounts/terms that are not viable as unsecured personal credit at these income levels. Partner must have vehicle valuation and collateral registration capability (reserva de dominio / prenda sin desplazamiento)."}
          </div>
        </div>
      )}

      {vLeads.length===0 ? (
        <Card style={{padding:48,textAlign:"center"}}>
          <div style={{marginBottom:12,color:V.color,lineHeight:0,display:"inline-block"}}>{VERTICAL_ICONS[V.id]?.(36)}</div>
          <div style={{fontSize:15,fontWeight:700,color:T.text}}>No leads in this vertical</div>
          <div style={{fontSize:12,color:T.muted,marginTop:6}}>Upload a XLSX with loan purpose data</div>
        </Card>
      ) : (<>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          <KpiCard label="Total Leads"    value={vLeads.length}              sub={`${V.label} vertical`}       accent={V.color}/>
          <KpiCard label="Bank Connected" value={vBC.length}                 sub={`${vRate}% BC rate`}          accent={T.blue}/>
          <KpiCard label="Form Submitted" value={vFS.length}                 sub="Pending OB connection"        accent={T.blue2}/>
          <KpiCard label="High Value"     value={isEnriched?highValue.length:"—"} sub="BC · income>2k · loan>5k" accent={T.green}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Financial profile */}
          {isEnriched&&(
            <Card style={{padding:20}}>
              <SectionTitle>Financial Profile</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {label:"Avg Monthly Income", val:avgInc?fmtK(avgInc):"—", color:V.color},
                  {label:"Avg Loan Request",   val:avgLoan?fmtK(avgLoan):"—", color:T.blue2},
                  {label:"Avg Age",            val:avgAge?`${avgAge} yrs`:"—", color:T.navy},
                  {label:"High Value",         val:isEnriched?highValue.length:"—", color:T.green},
                ].map(({label,val,color})=>(
                  <div key={label} style={{padding:"12px 14px",background:T.surface2,borderRadius:8,borderTop:`2px solid ${color}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{label}</div>
                    <div style={{fontSize:20,fontWeight:900,color}}>{val}</div>
                  </div>
                ))}
              </div>
              {/* DTI */}
              <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Debt-to-Income Risk</div>
              {[["Solvent <30%",dti.h,T.green],["Acceptable 30–40%",dti.m,T.amber],["High/Excl. >40%",dti.hi,T.red]].map(([label,n,color])=>(
                <div key={label} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:T.textSub}}>{label}</span>
                    <span style={{fontSize:11,fontWeight:700,color}}>{n} · {vLeads.length>0?Math.round(n/vLeads.length*100):0}%</span>
                  </div>
                  <div style={{height:5,background:T.surface2,borderRadius:3}}>
                    <div style={{height:"100%",width:`${vLeads.length>0?Math.round(n/vLeads.length*100):0}%`,background:color,borderRadius:3,transition:"width .4s"}}/>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Vertical Insights */}
          {(()=>{
            const vertStats = Object.values(VERTICALS_DEF).map(v=>{
              const base = all.filter(r=>v.purposes.includes(r.purpose));
              const baseBC = bc.filter(r=>v.purposes.includes(r.purpose));
              const vl = applyVehicleFilter(base, v.vehicleFilter);
              const vb = applyVehicleFilter(baseBC, v.vehicleFilter);
              const rate = vl.length>0 ? Math.round(vb.length/vl.length*100) : 0;
              return {v, count:vl.length, bcCount:vb.length, rate};
            }).filter(s=>s.count>0);
            if (vertStats.length===0) return null;
            const maxCount = Math.max(...vertStats.map(s=>s.count));
            const bestBC  = [...vertStats].sort((a,b)=>b.rate-a.rate)[0];
            const bestVol = [...vertStats].sort((a,b)=>b.count-a.count)[0];
            return (
              <Card style={{padding:20}}>
                <SectionTitle>Vertical Insights</SectionTitle>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <div style={{padding:"10px 12px",background:T.surface2,borderRadius:8,borderTop:`2px solid ${T.green}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Best BC Rate</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.green}}>{bestBC.rate}%</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{bestBC.v.label}</div>
                  </div>
                  <div style={{padding:"10px 12px",background:T.surface2,borderRadius:8,borderTop:`2px solid ${T.blue}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Highest Volume</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.blue}}>{bestVol.count}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{bestVol.v.label}</div>
                  </div>
                </div>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Leads by Vertical</div>
                {vertStats.map(({v,count,bcCount,rate})=>(
                  <div key={v.id} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:T.text,fontWeight:600}}>{v.label}</span>
                      <span style={{fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>
                        <span style={{fontWeight:700,color:v.color}}>{count}</span>
                        <span style={{color:T.muted}}> · </span>
                        <span style={{fontWeight:700,color:T.green}}>{rate}% BC</span>
                      </span>
                    </div>
                    <div style={{height:5,background:T.surface2,borderRadius:3}}>
                      <div style={{height:"100%",width:`${maxCount>0?Math.round(count/maxCount*100):0}%`,background:v.color,borderRadius:3,transition:"width .4s"}}/>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })()}

        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {topEmp.length>0&&(
            <Card style={{padding:20}}>
              <SectionTitle>Employment Breakdown</SectionTitle>
              {topEmp.map(([label,count])=>(
                <div key={label} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:T.textSub,textTransform:"capitalize"}}>{label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:V.color}}>{count} · {vLeads.length>0?Math.round(count/vLeads.length*100):0}%</span>
                  </div>
                  <div style={{height:5,background:T.surface2,borderRadius:3}}>
                    <div style={{height:"100%",width:`${vLeads.length>0?Math.round(count/vLeads.length*100):0}%`,background:V.color,borderRadius:3}}/>
                  </div>
                </div>
              ))}
            </Card>
          )}
          {topRes.length>0&&(
            <Card style={{padding:20}}>
              <SectionTitle>Residential Status</SectionTitle>
              {topRes.map(([label,count])=>(
                <div key={label} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:T.textSub,textTransform:"capitalize"}}>{label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:T.blue2}}>{count} · {vLeads.length>0?Math.round(count/vLeads.length*100):0}%</span>
                  </div>
                  <div style={{height:5,background:T.surface2,borderRadius:3}}>
                    <div style={{height:"100%",width:`${vLeads.length>0?Math.round(count/vLeads.length*100):0}%`,background:T.blue2,borderRadius:3}}/>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </>)}
    </div>
  );
}


// ─── LEAD SCORING TAB ──────────────────────────────────────────────────────────
// Scores each BC lead 0-100 based on: income, DTI, loan size, email verified,
// full name, age, employment stability. Filterable by vertical.
// ── scoreLead — Spanish credit scoring model ────────────────────────────────
// Total: 100pts across 7 factors. Designed for differentiation:
// A(≥75) ~20% · B(50-74) ~58% · C(30-49) ~20% · D(<30) rare
//
// Factor breakdown:
//   Income adequacy   0-25pts  (ES median net ~1900€/mo)
//   DTI ES tranches   0-25pts  (Banco de España / LCCI Ley 5/2019)
//   Loan-to-Income    0-15pts  (NEW — loan size vs annual income)
//   Employment        0-15pts  (stability + contract type)
//   Email verified    0-10pts
//   Full name         0-5pts
//   Age fit           0-5pts   (peak creditworthiness 30-55)
function scoreLead(r) {
  let score = 0;

  const inc = parseFloat(r.income)  || 0;
  const exp = parseFloat(r.expenses)|| 0;
  const loan= parseFloat(r.loanAmount)||0;

  // 1. Income adequacy (0-25pts)
  if      (inc >= 3500) score += 25;
  else if (inc >= 2500) score += 20;
  else if (inc >= 2000) score += 15;
  else if (inc >= 1500) score += 9;
  else if (inc >= 1000) score += 4;

  // 2. DTI — Banco de España 5 tranches (0-25pts)
  if (inc > 0 && exp > 0) {
    const dti = exp / inc;
    if      (dti < 0.30) score += 25;  // Solvente
    else if (dti < 0.35) score += 19;  // Aceptable
    else if (dti < 0.40) score += 12;  // Ajustado
    else if (dti < 0.50) score += 5;   // Alto riesgo
    else                 score += 0;   // Exclusión
  } else score += 10; // no DTI data → slight penalty

  // 3. Loan-to-Income ratio (0-15pts) — loan vs annual income
  if (loan > 0 && inc > 0) {
    const lti = loan / (inc * 12);
    if      (lti <= 0.5) score += 15;  // ≤6 months income
    else if (lti <= 1.0) score += 11;  // ≤1 annual salary
    else if (lti <= 2.0) score += 6;   // ≤2 annual salaries
    else if (lti <= 3.0) score += 2;   // ≤3 annual salaries
    // >3x annual salary → 0
  } else score += 8; // no loan data → neutral

  // 4. Employment stability (0-15pts)
  const emp = (r.employment || "").toLowerCase();
  if      (emp === "civil_servant")  score += 15;
  else if (emp === "employed")       score += 13;
  else if (emp === "self_employed")  score += 10;
  else if (emp === "retired")        score += 9;
  else if (emp === "part_time")      score += 5;
  else if (emp && emp !== "unemployed") score += 4;
  // unemployed or empty → 0

  // 5. Email verified (0-10pts)
  if (r.emailVerified) score += 10;

  // 6. Full name (0-5pts)
  if ((r.name || "").trim().split(/\s+/).length >= 2) score += 5;

  // 7. Age fit (0-5pts)
  const age = parseFloat(r.age) || 0;
  if      (age >= 30 && age <= 55) score += 5;
  else if (age >= 25 && age <= 65) score += 3;
  else if (age > 0)                score += 1;

  return Math.min(Math.round(score), 100);
}

const GRADE_COLOR = s => s>=75?T.green : s>=50?T.blue : s>=30?T.amber : T.red;
const GRADE_LABEL = s => s>=75?"A" : s>=50?"B" : s>=30?"C" : "D";

function ScoreBar({score}) {
  const color = GRADE_COLOR(score);
  const label = GRADE_LABEL(score);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:24,height:24,borderRadius:6,background:color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:10,fontWeight:900,color:"#fff"}}>{label}</span>
      </div>
      <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${score}%`,height:"100%",background:color,borderRadius:3,transition:"width .4s ease"}}/>
      </div>
      <span style={{fontSize:11,fontWeight:700,color,width:26,textAlign:"right",fontVariantNumeric:"tabular-nums",fontFamily:"'IBM Plex Mono',monospace"}}>{score}</span>
    </div>
  );
}

// Employment options for filter
const EMP_OPTIONS = [
  {value:"all",           label:"All Employment"},
  {value:"civil_servant", label:"Civil Servant"},
  {value:"employed",      label:"Employed"},
  {value:"self_employed", label:"Self-Employed"},
  {value:"retired",       label:"Retired"},
  {value:"part_time",     label:"Part-Time"},
  {value:"unemployed",    label:"Unemployed"},
];

function LeadScoringTab({data}) {
  const [sortBy,     setSortBy]     = useState("score");
  const [vertical,   setVertical]   = useState("all");
  const [empFilter,  setEmpFilter]  = useState("all");
  const [minScore,   setMinScore]   = useState(0);
  const [showBC,     setShowBC]     = useState(true);
  const [showFS,     setShowFS]     = useState(false);
  const [page,       setPage]       = useState(0);
  const PAGE_SIZE = 50;

  const bcArr = data["Bank Connected"] || [];
  const fsArr = data["Form Submitted"] || [];
  const isEnriched = [...bcArr,...fsArr].some(r=>r.income!=null);

  // Memoised base — scored leads from selected categories
  const allLeads = useMemo(()=>[
    ...(showBC?bcArr:[]),
    ...(showFS?fsArr:[]),
  ].map(r=>({
    ...r,
    _cat: bcArr.includes(r)?"BC":"FS",
    _score: scoreLead(r),
  })),[showBC,showFS,bcArr,fsArr]);

  // Available employment values in data (for dynamic filter options)
  const empValues = useMemo(()=>{
    const vals = new Set(allLeads.map(r=>(r.employment||"").toLowerCase()).filter(Boolean));
    return EMP_OPTIONS.filter(o=>o.value==="all"||vals.has(o.value));
  },[allLeads]);

  const filtered = useMemo(()=>{
    let rows = allLeads.filter(r=>r._score>=minScore);
    if (vertical!=="all") {
      const purps = VERTICALS_DEF[vertical]?.purposes||[];
      const isVehicle = vertical==="vehicle_unsecured"||vertical==="vehicle_secured";
      rows = rows.filter(r=>{
        if (!isVehicle) return purps.includes(r.purpose);
        const inPurp = purps.includes(r.purpose);
        const lti = r.loanAmount&&r.income ? r.loanAmount/r.income : null;
        if (vertical==="vehicle_unsecured") return inPurp&&(lti===null||lti<=15);
        return inPurp&&lti!==null&&lti>15;
      });
    }
    if (empFilter!=="all") {
      rows = rows.filter(r=>(r.employment||"").toLowerCase()===empFilter);
    }
    if (sortBy==="score")  rows = [...rows].sort((a,b)=>b._score-a._score);
    else if (sortBy==="income") rows = [...rows].sort((a,b)=>(b.income||0)-(a.income||0));
    else if (sortBy==="loan")   rows = [...rows].sort((a,b)=>(b.loanAmount||0)-(a.loanAmount||0));
    else if (sortBy==="dti")    rows = [...rows].sort((a,b)=>{
      const da=a.income>0?a.expenses/a.income:99, db=b.income>0?b.expenses/b.income:99;
      return da-db;
    });
    else if (sortBy==="name")   rows = [...rows].sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    return rows;
  },[allLeads,vertical,empFilter,minScore,sortBy]);

  // Reset page when filters change
  const prevFilters = React.useRef({vertical,empFilter,minScore,showBC,showFS});
  useEffect(()=>{
    const pf = prevFilters.current;
    if(pf.vertical!==vertical||pf.empFilter!==empFilter||pf.minScore!==minScore||pf.showBC!==showBC||pf.showFS!==showFS){
      setPage(0);
      prevFilters.current = {vertical,empFilter,minScore,showBC,showFS};
    }
  },[vertical,empFilter,minScore,showBC,showFS]);

  const buckets = {A:0,B:0,C:0,D:0};
  filtered.forEach(r=>{ if(r._score>=75)buckets.A++; else if(r._score>=50)buckets.B++; else if(r._score>=30)buckets.C++; else buckets.D++; });
  const avgScore = filtered.length ? Math.round(filtered.reduce((s,r)=>s+r._score,0)/filtered.length) : 0;
  const totalPages = Math.ceil(filtered.length/PAGE_SIZE);
  const pageRows = filtered.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE);

  if (!isEnriched) return (
    <Card style={{padding:48,textAlign:"center"}}>
      <div style={{marginBottom:12,color:T.muted,lineHeight:0}}><svg width="36" height="32" viewBox="0 0 32 28" fill="none"><rect x="2" y="12" width="7" height="14" rx="1" fill="currentColor" fillOpacity="0.3"/><rect x="13" y="4" width="7" height="22" rx="1" fill="currentColor" fillOpacity="0.7"/><rect x="24" y="8" width="7" height="18" rx="1" fill="currentColor" fillOpacity="0.5"/></svg></div>
      <div style={{fontSize:15,fontWeight:700,color:T.text}}>Lead Scoring requires enriched data</div>
      <div style={{fontSize:12,color:T.muted,marginTop:6}}>Upload a CreditCheck XLSX (Rasmus format) with income, DTI and employment data</div>
    </Card>
  );

  return (
    <div style={{display:"grid",gap:16}}>
      {/* Header row — 6 KPIs including Grade D */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
        {[
          {label:"Scored Leads",   val:filtered.length,  sub:"after filters",    color:T.text},
          {label:"Grade A ≥75",    val:buckets.A,        sub:"Top tier",         color:T.green},
          {label:"Grade B 50–74",  val:buckets.B,        sub:"Standard",         color:T.blue},
          {label:"Grade C 30–49",  val:buckets.C,        sub:"Below avg",        color:T.amber},
          {label:"Grade D <30",    val:buckets.D,        sub:"Review required",  color:T.red},
          {label:"Avg Score",      val:avgScore,         sub:"out of 100",       color:GRADE_COLOR(avgScore)},
        ].map(k=>(
          <Card key={k.label} style={{padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${k.color}70,transparent)`}}/>
            <div style={{fontSize:10,fontWeight:600,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6,fontFamily:"'IBM Plex Mono',monospace"}}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:800,color:k.color,letterSpacing:-0.5,fontVariantNumeric:"tabular-nums",fontFamily:"'Geist',sans-serif"}}>{k.val}</div>
            <div style={{fontSize:10,color:T.muted,marginTop:3}}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card style={{padding:"12px 16px"}}>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"}}>Filters</span>

          <select value={vertical} onChange={e=>setVertical(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.text,background:T.surface2,fontFamily:"'Geist',sans-serif",outline:"none"}}>
            <option value="all">All Verticals</option>
            {Object.values(VERTICALS_DEF).map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
          </select>

          <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.text,background:T.surface2,fontFamily:"'Geist',sans-serif",outline:"none"}}>
            {empValues.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={minScore} onChange={e=>setMinScore(Number(e.target.value))} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.text,background:T.surface2,fontFamily:"'Geist',sans-serif",outline:"none"}}>
            <option value={0}>All grades</option>
            <option value={75}>A only (≥75)</option>
            <option value={50}>B+ (≥50)</option>
            <option value={30}>C+ (≥30)</option>
          </select>

          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.text,background:T.surface2,fontFamily:"'Geist',sans-serif",outline:"none"}}>
            <option value="score">Score ↓</option>
            <option value="income">Income ↓</option>
            <option value="loan">Loan ↓</option>
            <option value="dti">DTI ↑</option>
            <option value="name">Name A→Z</option>
          </select>

          <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
            <button onClick={()=>setShowBC(v=>!v)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${showBC?T.green:T.border}`,background:showBC?T.green:T.surface2,color:showBC?"#fff":T.muted,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
              ✓ BC {bcArr.length}
            </button>
            <button onClick={()=>setShowFS(v=>!v)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${showFS?T.blue:T.border}`,background:showFS?T.blue:T.surface2,color:showFS?"#fff":T.muted,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
              ◷ FS {fsArr.length}
            </button>
            {(empFilter!=="all"||vertical!=="all"||minScore>0)&&(
              <button onClick={()=>{setEmpFilter("all");setVertical("all");setMinScore(0);}} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,color:T.muted,fontSize:10,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Score table */}
      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:T.surface2}}>
                {["#","Name","Score","Cat","Income","Loan","DTI","Employment","Vertical","Email"].map(h=>(
                  <th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:800,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r,i)=>{
                const dtiVal=r.income&&r.expenses&&r.income>0?(r.expenses/r.income*100).toFixed(0):null;
                const dtiColor=dtiVal
                  ? dtiVal<30?T.green:dtiVal<35?"#65A30D":dtiVal<40?T.amber:dtiVal<50?"#F97316":T.red
                  : T.muted;
                const purp=Object.values(VERTICALS_DEF).find(v=>v.purposes.includes(r.purpose));
                return (
                  <tr key={r.email||i} style={{borderBottom:`1px solid ${T.surface2}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"9px 12px",color:T.muted,fontVariantNumeric:"tabular-nums",fontFamily:"'IBM Plex Mono',monospace"}}>{page*PAGE_SIZE+i+1}</td>
                    <td style={{padding:"9px 12px"}}>
                      <div style={{fontWeight:600,color:T.text}}>{r.name||"—"}</div>
                      <div style={{fontSize:10,color:T.muted}}>{r.email||""}</div>
                    </td>
                    <td style={{padding:"9px 12px",width:120}}>
                      <ScoreBar score={r._score}/>
                    </td>
                    <td style={{padding:"9px 12px"}}>
                      <span style={{
                        fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
                        fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5,
                        background:r._cat==="BC"?T.greenBg:`${T.blue}15`,
                        color:r._cat==="BC"?T.green:T.blue,
                        border:`1px solid ${r._cat==="BC"?T.green+"30":T.blue+"30"}`,
                      }}>{r._cat}</span>
                    </td>
                    <td style={{padding:"9px 12px",fontWeight:700,color:T.navy,fontVariantNumeric:"tabular-nums"}}>
                      {r.income?`€${r.income.toLocaleString()}`:"—"}
                    </td>
                    <td style={{padding:"9px 12px",fontVariantNumeric:"tabular-nums",color:T.textSub}}>
                      {r.loanAmount?`€${r.loanAmount.toLocaleString()}`:"—"}
                    </td>
                    <td style={{padding:"9px 12px",fontVariantNumeric:"tabular-nums"}}>
                      {dtiVal ? (
                        <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
                          <span style={{fontWeight:700,color:dtiColor}}>{dtiVal}%</span>
                          <span style={{fontSize:10,fontWeight:600,fontFamily:"'IBM Plex Mono',monospace",
                            color:dtiColor,background:`${dtiColor}18`,border:`1px solid ${dtiColor}35`,
                            borderRadius:3,padding:"1px 4px",letterSpacing:0.4}}>
                            {dtiVal<30?"SOL":dtiVal<35?"ACE":dtiVal<40?"AJU":dtiVal<50?"ALT":"EXC"}
                          </span>
                        </span>
                      ) : <span style={{color:T.muted}}>—</span>}
                    </td>
                    <td style={{padding:"9px 12px",color:T.textSub,textTransform:"capitalize",fontSize:11}}>
                      {(r.employment||"—").replace(/_/g," ")}
                    </td>
                    <td style={{padding:"9px 12px"}}>
                      {purp?<span style={{fontSize:10,fontWeight:600,color:purp.color,background:`${purp.color}10`,padding:"2px 8px",borderRadius:20,border:`1px solid ${purp.color}30`}}>{purp.label}</span>:<span style={{color:T.muted,fontSize:11}}>—</span>}
                    </td>
                    <td style={{padding:"9px 12px"}}>
                      {r.emailVerified
                        ? <span style={{color:T.green,fontSize:11,fontWeight:700}}>✓ Verified</span>
                        : <span style={{color:T.muted,fontSize:11}}>Pending</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages>1&&(
            <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`1px solid ${T.border}`}}>
              <span style={{fontSize:11,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>
                {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length} leads
              </span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                  style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface2,color:page===0?T.muted:T.text,fontSize:11,cursor:page===0?"default":"pointer",fontFamily:"'Geist',sans-serif"}}>
                  ← Prev
                </button>
                <span style={{padding:"8px 10px",fontSize:11,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",alignSelf:"center"}}>
                  {page+1} / {totalPages}
                </span>
                <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
                  style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surface2,color:page===totalPages-1?T.muted:T.text,fontSize:11,cursor:page===totalPages-1?"default":"pointer",fontFamily:"'Geist',sans-serif"}}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Scoring methodology */}
      <Card style={{padding:"16px 20px"}}>
        <SectionTitle>Scoring Methodology</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {factor:"Monthly Income",  max:25, desc:"≥€3.5k=25 · ≥€2.5k=20 · ≥€2k=15 · ≥€1.5k=9 · ≥€1k=4 · <€1k=0"},
            {factor:"DTI — ES",        max:25, desc:"<30% Solvent=25 · <35% Acceptable=19 · <40% Tight=12 · <50% High=5 · ≥50% Exclusion=0"},
            {factor:"Loan-to-Income",  max:15, desc:"≤0.5× annual=15 · ≤1×=11 · ≤2×=6 · ≤3×=2 · >3×=0"},
            {factor:"Employment",      max:15, desc:"Civil servant=15 · Employed=13 · Self-emp=10 · Retired=9 · Part-time=5 · Other=4 · Unemployed=0"},
            {factor:"Email Verified",  max:10, desc:"Verified=10 · Not verified=0"},
            {factor:"Full Name",       max:5,  desc:"≥2 words=5 · Single name=0"},
            {factor:"Age fit",         max:5,  desc:"30–55=5 · 25–65=3 · Other=1 · Unknown=0"},
          ].map(({factor,max,desc})=>(
            <div key={factor} style={{padding:"10px 12px",background:T.surface2,borderRadius:8,borderLeft:`3px solid ${T.blue}30`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600,color:T.text}}>{factor}</span>
                <span style={{fontSize:10,fontWeight:700,color:T.blue,fontFamily:"'IBM Plex Mono',monospace",background:`${T.blue}12`,padding:"1px 6px",borderRadius:4}}>{max}pts</span>
              </div>
              <div style={{fontSize:10,color:T.muted,lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:"10px 14px",background:`${T.blue}08`,borderRadius:8,borderLeft:`3px solid ${T.blue}`,fontSize:11,color:T.textSub,lineHeight:1.6}}>
          <strong style={{color:T.text}}>Grade scale:</strong> A (≥75) — Top tier, send to premium partners · B (50-74) — Standard, general distribution · C (30-49) — Below average, flag before sending · D (&lt;30) — Poor quality, review before distribution
        </div>
      </Card>
    </div>
  );
}

// ─── REPORT ENGINE ─────────────────────────────────────────────────────────────
const REPORT_DEFS = [
  // ── INTERNAL ────────────────────────────────────────────────────────────────
  {
    id:"ops_full",
    category:"internal",
    icon:"",
    label:"Operations Report",
    audience:"Management & Ops team",
    desc:"Full pipeline view: quality score, domain breakdown, DTI analysis, email health, funnel with drop-off, financial profile. Confidential.",
    tags:["Quality score","Full funnel","DTI","Domains","Financials","Drop-off"],
    accentColor:"#92400E", bgColor:T.amberBg, borderColor:"rgba(245,158,11,0.3)", tagBg:T.amberBg,
  },
  {
    id:"exec_summary",
    category:"internal",
    icon:"",
    label:"Executive Summary",
    audience:"C-Level · Board · Investors",
    desc:"High-level board-ready summary: batch performance vs. previous period, revenue model projection, top verticals, quality rating and strategic recommendations.",
    tags:["Board-ready","Revenue projection","KPI summary","Top verticals","Strategic"],
    accentColor:T.navy, bgColor:T.surface2, borderColor:"#C7D2FE", tagBg:"#E0E7FF",
  },
  {
    id:"risk_screening",
    category:"internal",
    icon:"",
    label:"Risk Screening Report",
    audience:"Risk & Compliance team",
    desc:"High-risk lead identification: DTI >50%, single-name leads, unverified emails, inconsistent financial data. Flag before sending to regulated partners.",
    tags:["DTI >50%","Unverified emails","Single-name","Risk flags","Compliance"],
    accentColor:"#7F1D1D", bgColor:T.redBg, borderColor:"rgba(239,68,68,0.3)", tagBg:T.redBg,
    riskMode:true,
  },
  // ── VERTICALS ────────────────────────────────────────────────────────────────
  {
    id:"vertical_personal",
    category:"vertical",
    icon:"",
    label:"Personal Loans Batch",
    audience:"Consumer finance · BNPL · Neobanks",
    desc:"Personal expenses, lifestyle, education and general consumer credit leads. Employment mix, income profile, DTI and top purposes filtered to this vertical.",
    tags:["Personal expenses","Education","Lifestyle","Consumer credit","Employment mix"],
    accentColor:"#1E40AF", bgColor:T.surface3, borderColor:"rgba(59,130,246,0.3)", tagBg:T.surface3,
    vertical:"personal_loans",
  },
  {
    id:"vertical_reform",
    category:"vertical",
    icon:"",
    label:"Home Reform Batch",
    audience:"Reform financing · Home improvement lenders · Consumer banks",
    desc:"Home improvement leads. Unsecured personal credit — no appraisal needed. 83% request <€15k. 42% homeowners. Faster closing than mortgage. Different product entirely.",
    tags:["Home improvement","Unsecured","Avg €7.9k","42% homeowners","No appraisal"],
    accentColor:"#065F46", bgColor:T.greenBg, borderColor:"rgba(16,185,129,0.3)", tagBg:T.greenBg,
    vertical:"reform",
  },
  {
    id:"vertical_mortgage",
    category:"vertical",
    icon:"",
    label:"Mortgage / Refinance Batch",
    audience:"Mortgage brokers · Banks · Intermediarios hipotecarios",
    desc:"Refinancing leads. Secured product tied to property valuation. 82% have existing loans — confirmed refinance intent. Avg term 67 months. LCCI regulated.",
    tags:["Refinance","Secured product","Avg €14.9k","82% existing loans","LCCI"],
    accentColor:"#6D28D9", bgColor:T.surface3, borderColor:"rgba(139,92,246,0.3)", tagBg:T.surface3,
    vertical:"mortgage",
  },
  {
    id:"vertical_vehicle_unsecured",
    category:"vertical",
    icon:"",
    label:"Vehicle — Personal Credit Batch",
    audience:"Consumer finance · Cetelem · Cofidis · Bank personal loan desks",
    desc:"Vehicle purchase leads financed via unsecured personal credit (loan ≤€15k, term ≤60 months). Vehicle is the destination — underwriting is on income/DTI, not vehicle value. ~14 leads.",
    tags:["Unsecured","Loan ≤€15k","Term ≤60m","Income-based","Consumer credit"],
    accentColor:"#B45309", bgColor:T.amberBg, borderColor:"rgba(245,158,11,0.4)", tagBg:T.amberBg,
    vertical:"vehicle_unsecured",
  },
  {
    id:"vertical_vehicle_secured",
    category:"vertical",
    icon:"",
    label:"Vehicle — Secured Credit Batch",
    audience:"ALD Automotive · Arval · Specialized auto lenders · Dealers with secured financing",
    desc:"Vehicle-secured credit leads (loan >€15k or term >60 months). Vehicle is the collateral — partner must handle valuation (ITV/tasación) and registration (reserva de dominio). ~6 leads.",
    tags:["Vehicle as collateral","Loan >€15k","Notarial process","Tasación required","Auto lenders"],
    accentColor:"#DC2626", bgColor:T.redBg, borderColor:"rgba(239,68,68,0.3)", tagBg:T.redBg,
    vertical:"vehicle_secured",
  },
  // ── PARTNER-SPECIFIC ─────────────────────────────────────────────────────────
  {
    id:"partner_mortgage",
    category:"partner",
    icon:"",
    label:"Mortgage Partner Pack",
    audience:"Banks · Mortgage brokers · Hipotecas.com · iAhorro",
    desc:"Curated for mortgage brokers and banks. Refinancing leads with confirmed intent (82% existing loans), homeowner profile, avg loan €14.9k, LCCI compliance context. No internal data.",
    tags:["Refinance intent","Homeowners","Avg €14.9k","82% existing loans","LCCI context"],
    accentColor:"#6D28D9", bgColor:T.surface3, borderColor:"rgba(139,92,246,0.3)", tagBg:T.surface3,
    vertical:"mortgage", partnerFocus:"mortgage",
  },
  {
    id:"partner_auto",
    category:"partner",
    icon:"",
    label:"Auto Secured Credit — Partner Pack",
    audience:"ALD · Arval · LeasePlan · Specialized auto lenders",
    desc:"Vehicle-secured credit leads only (loan >€15k or term >60 months). Includes income, employment and loan profile. Clean external format — no internal ops data.",
    tags:["Secured only","Loan >€15k","Vehicle collateral","Tasación fit","Auto lenders"],
    accentColor:"#DC2626", bgColor:T.redBg, borderColor:"rgba(239,68,68,0.3)", tagBg:T.redBg,
    vertical:"vehicle_secured", partnerFocus:"auto",
  },
  {
    id:"partner_neobank",
    category:"partner",
    icon:"",
    label:"Neobank / BNPL Pack",
    audience:"Revolut · Cofidis · Vivus · WiZink",
    desc:"Personal loans vertical optimized for neobank and BNPL partners. Focus on digital-first profile, younger segment, income <€2k — high-volume plays.",
    tags:["Personal vertical","BNPL fit","Digital profile","High volume","Neobank"],
    accentColor:"#1E40AF", bgColor:T.surface3, borderColor:"rgba(59,130,246,0.3)", tagBg:T.surface3,
    vertical:"personal_loans", partnerFocus:"neobank",
  },
  // ── PREMIUM SEGMENTS ─────────────────────────────────────────────────────────
  {
    id:"premium_bc",
    category:"premium",
    icon:"",
    label:"Premium BC Segment",
    audience:"Tier-1 partners · Fintonic · Banks · Comparators",
    desc:"Bank Connected only, income >€2,000 and loan >€5,000. Highest conversion potential in the batch. Avg income €2.7k · Avg loan €15k.",
    tags:["BC only","Income >€2k","Loan >€5k","Avg ticket €15k","Top tier"],
    accentColor:"#005EFF", bgColor:T.surface3, borderColor:"#93C5FD", tagBg:T.surface3,
    premium:true,
  },
  {
    id:"retired_segment",
    category:"premium",
    icon:"",
    label:"Retired Segment",
    audience:"Consumer finance · Pension credit specialists",
    desc:"Retired profile leads. Stable pension income, avg €2,051/mo. Low DTI risk. Specific partner type: personal credit with pension collateral.",
    tags:["Retired","Stable income","Avg €2k/mo","Low DTI","Pension collateral"],
    accentColor:"#6D28D9", bgColor:T.surface3, borderColor:"rgba(139,92,246,0.3)", tagBg:T.surface3,
    segment:"retired",
  },
  // ── EXTERNAL GENERIC ─────────────────────────────────────────────────────────
  {
    id:"generic_partner",
    category:"external",
    icon:"",
    label:"Generic Partner Overview",
    audience:"Any new or prospective partner",
    desc:"Clean external overview: volume, quality badge, loan purposes and financial profile. Zero internal ops data. Safe to share with any external party.",
    tags:["Lead volume","Quality badge","Loan purpose","Avg income","BC rate"],
    accentColor:"#1E40AF", bgColor:T.surface3, borderColor:"rgba(59,130,246,0.2)", tagBg:T.surface3,
  },
];

const CATEGORY_META = {
  internal: { label:"Internal",  color:"#92400E", bg:T.amberBg,  border:"rgba(245,158,11,0.3)" },
  vertical: { label:"Vertical",  color:"#1E40AF", bg:T.surface3,  border:"rgba(59,130,246,0.2)" },
  partner:  { label:"Partner",   color:"#065F46", bg:T.greenBg,  border:"rgba(16,185,129,0.3)" },
  premium:  { label:"Premium",   color:"#005EFF", bg:T.surface3,  border:"rgba(59,130,246,0.3)" },
  external: { label:"External",  color:"#0C4A6E", bg:"#E0F2FE",  border:"#BAE6FD" },
};

function buildReportData(data, opts={}) {
  const bcArr  = data["Bank Connected"]  || [];
  const fsArr  = data["Form Submitted"]  || [];
  const incArr = data["Incomplete"]      || [];

  // Filter by vertical if needed
  let all = [...bcArr, ...fsArr, ...incArr];
  let bc  = bcArr, fs = fsArr;
  if (opts.vertical) {
    const vDef = VERTICALS_DEF[opts.vertical];
    const purps = vDef.purposes;
    all = all.filter(r => purps.includes(r.purpose));
    bc  = bc.filter(r  => purps.includes(r.purpose));
    fs  = fs.filter(r  => purps.includes(r.purpose));
    // Vehicle sub-filter: heuristic split by loan size + term
    // unsecured: loan ≤ €15k AND months ≤ 60 (personal credit, vehicle is destination not collateral)
    // secured:   loan > €15k OR months > 60 (vehicle as guarantee, different product/partner/risk)
    if (vDef.vehicleFilter === "unsecured") {
      const f = r => (r.loanAmount||0) <= 15000 && (r.loanMonths||0) <= 60;
      all = all.filter(f); bc = bc.filter(f); fs = fs.filter(f);
    } else if (vDef.vehicleFilter === "secured") {
      const f = r => (r.loanAmount||0) > 15000 || (r.loanMonths||0) > 60;
      all = all.filter(f); bc = bc.filter(f); fs = fs.filter(f);
    }
  }
  if (opts.segment === "retired") {
    all = all.filter(r => r.employment === "retired");
    bc  = bc.filter(r  => r.employment === "retired");
    fs  = fs.filter(r  => r.employment === "retired");
  }
  if (opts.premium) {
    bc  = bc.filter(r => (r.income||0)>2000 && (r.loanAmount||0)>5000);
    fs  = [];
    all = bc;
  }
  if (opts.riskMode) {
    // Risk mode: leads with DTI>50%, unverified email, or single-name
    const emailRe2 = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    all = [...bc,...fs,...incArr].filter(r => {
      const highDTI = r.income&&r.expenses&&r.income>0 && (r.expenses/r.income)>0.5;
      const badEmail = !r.email || !emailRe2.test(r.email);
      const singleName = (r.name||"").trim().split(/\s+/).length<2;
      const unverified = !r.emailVerified;
      return highDTI || badEmail || singleName || unverified;
    });
    bc = all.filter(r => bcArr.includes(r));
    fs = all.filter(r => fsArr.includes(r));
  }

  const total = all.length;
  const incomes    = all.map(r=>r.income).filter(Boolean);
  const loans      = all.map(r=>r.loanAmount).filter(Boolean);
  const ages       = all.map(r=>r.age).filter(Boolean);
  const avgIncome  = incomes.length ? Math.round(incomes.reduce((s,v)=>s+v,0)/incomes.length) : null;
  const avgLoan    = loans.length   ? Math.round(loans.reduce((s,v)=>s+v,0)/loans.length) : null;
  const avgAge     = ages.length    ? Math.round(ages.reduce((s,v)=>s+v,0)/ages.length) : null;

  const purposeCount={};
  all.forEach(r=>{if(r.purpose){const p=r.purpose.replace(/_/g," ");purposeCount[p]=(purposeCount[p]||0)+1;}});
  const topPurposes = Object.entries(purposeCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const empCount={};
  all.forEach(r=>{if(r.employment){const e=r.employment.replace(/_/g," ");empCount[e]=(empCount[e]||0)+1;}});
  const topEmp = Object.entries(empCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const resCount={};
  all.forEach(r=>{if(r.residential){const e=r.residential.replace(/_/g," ");resCount[e]=(resCount[e]||0)+1;}});
  const topRes = Object.entries(resCount).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const domainCount={};
  all.forEach(r=>{if(r.email){const d=r.email.split("@")[1]?.toLowerCase()||"?";domainCount[d]=(domainCount[d]||0)+1;}});
  const topDomains = Object.entries(domainCount).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const emailRe    = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const validEmails= all.filter(r=>r.email&&emailRe.test(r.email)).length;
  const fullNames  = all.filter(r=>(r.name||"").trim().split(/\s+/).length>=2).length;
  const emailVerif = all.filter(r=>r.emailVerified).length;
  const isEnriched = all.some(r=>r.income!=null);
  const hasAllFin  = all.filter(r=>r.income&&r.expenses&&r.loanAmount&&r.employment).length;

  const dti={h:0,m:0,hi:0};
  all.forEach(r=>{
    if(r.income&&r.expenses&&r.income>0){
      const ratio=r.expenses/r.income;
      if(ratio<0.3)dti.h++; else if(ratio<0.5)dti.m++; else dti.hi++;
    }
  });

  const delivScore = Math.round(
    (validEmails/Math.max(total,1))*40 +
    (fullNames/Math.max(total,1))*20 +
    (emailVerif/Math.max(total,1))*25 +
    (isEnriched?(hasAllFin/Math.max(total,1))*15:15)
  );
  const scoreColor  = delivScore>=80?"#00A651":delivScore>=60?"#F59E0B":"#EF4444";
  const scoreLabel  = delivScore>=80?"High Quality":delivScore>=60?"Standard":"Below Average";
  const bcRate      = (bc.length+fs.length)>0 ? ((bc.length/(bc.length+fs.length))*100).toFixed(1) : 0;

  const dates   = all.map(r=>r.created).filter(Boolean).sort();
  const dateFrom= dates[0]||"—", dateTo=dates[dates.length-1]||"—";
  const today   = new Date().toISOString().slice(0,10);
  const fmtK    = n => n>=1000?`€${(n/1000).toFixed(0)}k`:`€${n}`;
  const pct     = (n,d) => d>0?`${Math.round(n/d*100)}%`:"—";

  return {
    bcArr:bc, fsArr:fs, incArr, all, total,
    avgIncome, avgLoan, avgAge,
    topPurposes, topEmp, topRes, topDomains,
    validEmails, fullNames, emailVerif, isEnriched, hasAllFin,
    delivScore, scoreColor, scoreLabel,
    dti, bcRate, dateFrom, dateTo, today, fmtK, pct,
  };
}

function downloadHTML(html, filename) {
  const a = Object.assign(document.createElement("a"),{
    href:"data:text/html;charset=utf-8,"+encodeURIComponent(html),
    download:filename
  });
  document.body.appendChild(a); a.click(); a.remove();
}

// ── Shared CSS for all reports ──────────────────────────────────────────────────
// Brand primary: #005eff (CreditChecker.io) · Navy: #0a1264
const REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'IBM Plex Sans',-apple-system,sans-serif;background:#F4F6FA;color:#0A1628;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.page{max-width:960px;margin:0 auto;padding:40px 48px;background:#fff;}
/* Header */
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #005EFF;margin-bottom:28px;}
.logo{display:flex;align-items:center;gap:12px;}
.logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#005EFF,#0A1264);border-radius:10px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-size:19px;font-weight:900;letter-spacing:-0.5px;line-height:1;}
.brand-cc{color:#4D94FF;}
.brand-sub{font-size:9px;color:#9CA8BE;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
.header-right{text-align:right;}
.report-type{font-size:10px;color:#6B7A99;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.report-period{font-size:13px;font-weight:800;color:#0A1628;margin-top:4px;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:800;letter-spacing:0.5px;margin-top:8px;text-transform:uppercase;}
.badge-int{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;}
.badge-ext{background:#D1FAE5;color:#065F46;border:1px solid #86EFAC;}
.badge-prem{background:#EEF4FF;color:#005EFF;border:1px solid #A8C8FF;}
/* Section */
.section{margin-bottom:24px;}
.section-title{font-size:10px;font-weight:800;color:#6B7A99;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #E2E7F0;margin-bottom:14px;}
/* KPI grid */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.kpi-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.kpi{background:#F8F9FC;border-radius:10px;padding:16px;border-top:3px solid #0A1264;}
.kpi-b{border-top-color:#005EFF;} .kpi-b2{border-top-color:#1A6FFF;} .kpi-g{border-top-color:#059669;} .kpi-a{border-top-color:#D97706;} .kpi-p{border-top-color:#6D28D9;}
.kv{font-size:26px;font-weight:900;line-height:1;letter-spacing:-0.8px;color:#0A1628;}
.kpi-b .kv{color:#005EFF;} .kpi-b2 .kv{color:#1A6FFF;} .kpi-g .kv{color:#059669;} .kpi-a .kv{color:#D97706;} .kpi-p .kv{color:#6D28D9;}
.kl{font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:0.8px;text-transform:uppercase;margin-top:5px;}
.ks{font-size:10px;color:#9CA8BE;margin-top:2px;}
/* Two col */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
/* Bars */
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.bar-label{font-size:11px;color:#3D4F6E;width:155px;flex-shrink:0;text-transform:capitalize;}
.bar-track{flex:1;height:7px;background:#E2E7F0;border-radius:4px;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;}
.bar-val{font-size:11px;font-weight:700;color:#0A1628;width:55px;text-align:right;flex-shrink:0;}
/* Funnel */
.funnel{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #E2E7F0;border-radius:10px;overflow:hidden;}
.funnel-step{padding:16px;text-align:center;border-right:1px solid #E2E7F0;}
.funnel-step:last-child{border-right:none;}
.funnel-n{font-size:24px;font-weight:900;line-height:1;}
.funnel-pct{font-size:13px;font-weight:800;margin-top:3px;opacity:0.75;}
.funnel-label{font-size:9px;font-weight:700;color:#6B7A99;margin-top:5px;text-transform:uppercase;letter-spacing:0.8px;}
/* Score */
.score-box{display:flex;align-items:center;gap:22px;background:#F8F9FC;border-radius:10px;padding:18px 22px;}
.score-circle{width:84px;height:84px;border-radius:50%;border:7px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
.score-n{font-size:24px;font-weight:900;line-height:1;}
.score-max{font-size:10px;color:#9CA8BE;}
.score-row{display:flex;justify-content:space-between;margin-bottom:5px;font-size:11px;}
.score-bar-bg{height:4px;background:#E2E7F0;border-radius:3px;margin-top:2px;margin-bottom:6px;}
.score-bar{height:4px;border-radius:3px;}
/* Table */
.data-table{width:100%;border-collapse:collapse;font-size:12px;}
.data-table th{padding:7px 12px;text-align:left;font-size:9px;font-weight:800;color:#6B7A99;letter-spacing:1.2px;text-transform:uppercase;background:#F8F9FC;border-bottom:2px solid #E2E7F0;}
.data-table td{padding:9px 12px;border-bottom:1px solid #F4F6FA;}
/* Highlight box */
.hi-box{background:#F0F7FF;border:1px solid #BAD4FF;border-radius:9px;padding:14px 18px;}
/* Internal banner */
.int-banner{background:#FEF9EC;border:1px solid #FDE68A;border-radius:8px;padding:10px 16px;margin-bottom:24px;font-size:12px;display:flex;align-items:center;gap:8px;color:#78350F;}
/* Footer */
.footer{margin-top:36px;padding-top:14px;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;font-size:10px;color:#9CA8BE;}
/* No print */
.no-print{margin-bottom:20px;}
.btn-print{padding:9px 20px;background:#005EFF;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;}
@media print{.no-print{display:none!important;} body{background:#fff;} .page{padding:24px 32px;}}
`;

function makeHeader(reportLabel, dateFrom, dateTo, today, badgeHTML="") {
  return `
  <div class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M6.5 9.5L8 11L11.5 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <div class="brand-name">CREDIT<span class="brand-cc">CHECK</span></div>
        <div class="brand-sub">Lead Intelligence</div>
      </div>
    </div>
    <div class="header-right">
      <div class="report-type">${reportLabel}</div>
      <div class="report-period">${dateFrom} → ${dateTo}</div>
      ${badgeHTML}
    </div>
  </div>`;
}

function makePrintBtn() {
  return `<div class="no-print"><button class="btn-print" onclick="window.print()">Print / Save as PDF</button></div>`;
}

function makeKPIGrid(items) {
  return `<div class="kpi-grid">${items.map(([cls,val,label,sub])=>`
    <div class="kpi ${cls}"><div class="kv">${val}</div><div class="kl">${label}</div><div class="ks">${sub}</div></div>`).join("")}
  </div>`;
}

function makeFunnel(steps, total) {
  const pct = (n,d) => d>0?`${Math.round(n/d*100)}%`:"—";
  return `<div class="funnel">${steps.map(([label,n,color])=>`
    <div class="funnel-step" style="background:${color}0D">
      <div class="funnel-n" style="color:${color}">${n}</div>
      <div class="funnel-pct" style="color:${color}">${pct(n,total)}</div>
      <div class="funnel-label">${label}</div>
    </div>`).join("")}</div>`;
}

function makeBars(items, total, color="#005EFF") {
  return items.map(([label,count])=>{
    const p = total>0?Math.round(count/total*100):0;
    return `<div class="bar-row">
      <div class="bar-label">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${color}"></div></div>
      <div class="bar-val">${count} (${p}%)</div>
    </div>`;
  }).join("");
}

function makeReport(reportDef, data) {
  const opts = {};
  if (reportDef.vertical) opts.vertical = reportDef.vertical;
  if (reportDef.segment)  opts.segment  = reportDef.segment;
  if (reportDef.premium)  opts.premium  = true;
  if (reportDef.riskMode) opts.riskMode = true;

  const d = buildReportData(data, opts);
  const { bcArr,fsArr,all,total,avgIncome,avgLoan,avgAge,topPurposes,topEmp,topRes,topDomains,
          validEmails,fullNames,emailVerif,isEnriched,delivScore,scoreColor,scoreLabel,
          dti,bcRate,dateFrom,dateTo,today,fmtK,pct } = d;

  const isInternal  = reportDef.category === "internal";
  const isPremium   = reportDef.category === "premium";
  const isExternal  = reportDef.category === "external";
  const isVertical  = reportDef.category === "vertical";
  const isSegment   = reportDef.category === "segment";
  const isPartner   = reportDef.category === "partner";
  const isRisk      = reportDef.id === "risk_screening";
  const isExec      = reportDef.id === "exec_summary";

  const badgeHTML = isInternal ? `<span class="badge badge-int">Internal</span>` :
                    isPremium  ? `<span class="badge badge-prem">Premium</span>` :
                    isRisk     ? `<span class="badge badge-int" style="background:#FEE2E2;color:#7F1D1D;border-color:#FECACA">Risk &amp; Compliance</span>` :
                                 `<span class="badge badge-ext">Partner Distribution</span>`;

  const intBanner = isRisk
    ? `<div class="int-banner" style="background:#FEF2F2;border-color:#FECACA;color:#7F1D1D;"><strong>Risk & Compliance — Internal only.</strong> Contains flagged leads with high-risk indicators. Do not share externally.</div>`
    : isInternal
    ? `<div class="int-banner"><strong>Internal use only — Ops & Management.</strong> Not for distribution to leads, partners or external stakeholders.</div>`
    : "";

  // KPI grid selection
  const kpiItems = isPremium && reportDef.id==="premium_bc"
    ? [["kpi-b",bcArr.length,"Bank Connected","Open Banking verified"],
       ["kpi-g",avgIncome?fmtK(avgIncome):"—","Avg Monthly Income","Filtered: >€2k"],
       ["kpi-a",avgLoan?fmtK(avgLoan):"—","Avg Loan Request","Filtered: >€5k"],
       ["",`${bcRate}%`,"BC Rate (of active)","BC / (BC+FS)"]]
    : isSegment || (isPremium && reportDef.id!=="premium_bc")
    ? [["",total,"Total Leads",`${reportDef.label}`],
       ["kpi-b",bcArr.length,"Bank Connected",`${bcRate}% BC rate`],
       ["kpi-b2",fsArr.length,"Form Submitted","Pending OB"],
       ["",avgIncome?fmtK(avgIncome):"—","Avg Income","Segment avg"]]
    : isRisk
    ? [["kpi-a",total,"Flagged Leads","Require review"],
       ["kpi-b",dti.hi,"High DTI >50%","Risk: overextended"],
       ["",all.filter(r=>!r.emailVerified).length,"Unverified Email","Deliverability risk"],
       ["",all.filter(r=>(r.name||"").trim().split(/\s+/).length<2).length,"Single Name","Data quality issue"]]
    : [["",total,"Total Leads","Unique · validated"],
       ["kpi-b",bcArr.length,"Bank Connected","Open Banking verified"],
       ["kpi-b2",fsArr.length,"Form Submitted","Pending bank connection"],
       ["kpi-g",`${bcRate}%`,"BC Rate","Verification rate"]];

  // Funnel steps
  const funnelSteps = isInternal
    ? [["Total Entries",total,T.navy],["Form Completed",bcArr.length+fsArr.length,"#005EFF"],["Bank Connected",bcArr.length,"#1A6FFF"],["Email Verified",emailVerif,"#00A651"]]
    : [["Total Leads",total,T.navy],["Form Completed",bcArr.length+fsArr.length,"#005EFF"],["Bank Connected",bcArr.length,"#1A6FFF"],["Email Verified",emailVerif,"#00A651"]];

  // Internal-only: DTI section
  const dtiSection = isInternal && (dti.h+dti.m+dti.hi)>0 ? `
  <div class="section">
    <div class="section-title">Debt-to-Income Analysis</div>
    <div class="two-col">
      <div>
        ${[["Healthy <30%",dti.h,"#00A651"],["Moderate 30–50%",dti.m,"#F59E0B"],["High >50%",dti.hi,"#EF4444"]].map(([label,n,color])=>`
        <div class="bar-row">
          <div class="bar-label">${label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${total>0?Math.round(n/total*100):0}%;background:${color}"></div></div>
          <div class="bar-val">${n} (${total>0?Math.round(n/total*100):0}%)</div>
        </div>`).join("")}
      </div>
      <div>
        <div style="font-size:11px;color:#3D4F6E;line-height:1.8;padding:12px 16px;background:#F8F9FC;border-radius:8px;">
          <strong>DTI Interpretation:</strong><br/>
          ${Math.round(dti.h/Math.max(total,1)*100)}% of leads have healthy DTI (<30%) — strong creditworthiness signal.<br/>
          ${Math.round(dti.hi/Math.max(total,1)*100)}% are high-risk (>50%) — flag for risk-adjusted pricing.
        </div>
      </div>
    </div>
  </div>` : "";

  // Quality score section (internal: full breakdown; external: badge only)
  const qualitySection = isInternal ? `
  <div class="section">
    <div class="section-title">Data Quality & Deliverability Score</div>
    <div class="score-box">
      <div class="score-circle" style="border-color:${scoreColor}">
        <div class="score-n" style="color:${scoreColor}">${delivScore}</div>
        <div class="score-max">/100</div>
      </div>
      <div style="flex:1">
        ${[["Valid email format",Math.round(validEmails/Math.max(total,1)*100)],
           ["Email verified",Math.round(emailVerif/Math.max(total,1)*100)],
           ["Full name provided",Math.round(fullNames/Math.max(total,1)*100)],
           ["Financial data complete",isEnriched?Math.round(d.hasAllFin/Math.max(total,1)*100):100]
          ].map(([label,p])=>`
          <div class="score-row"><span style="color:#3D4F6E">${label}</span><span style="font-weight:800;color:${p>=80?"#00A651":p>=60?"#F59E0B":"#EF4444"}">${p}%</span></div>
          <div class="score-bar-bg"><div class="score-bar" style="width:${p}%;background:${p>=80?"#00A651":p>=60?"#F59E0B":"#EF4444"}"></div></div>`
        ).join("")}
      </div>
    </div>
  </div>` : !isExternal ? `` : `
  <div class="section">
    <div class="section-title">Batch Quality</div>
    <div class="score-box">
      <div class="score-circle" style="border-color:${scoreColor}">
        <div class="score-n" style="color:${scoreColor}">${delivScore}</div><div class="score-max">/100</div>
      </div>
      <div style="flex:1;border-left:1px solid #E2E7F0;padding-left:22px;">
        <div style="font-size:14px;font-weight:900;color:${scoreColor};margin-bottom:4px;">${scoreLabel}</div>
        <div style="font-size:12px;color:#3D4F6E;line-height:1.9;">
          ✓ All leads email-validated<br/>
          ✓ Deduplicated — one record per person<br/>
          ✓ Test emails filtered<br/>
          ${emailVerif>0?`✓ ${pct(emailVerif,total)} email-verified`:``}
        </div>
      </div>
    </div>
  </div>`;

  // Domain breakdown (internal only)
  const domainSection = isInternal && topDomains.length>0 ? `
  <div>
    <div class="section-title">Email Domain Breakdown</div>
    ${makeBars(topDomains,total,"#005EFF")}
  </div>` : "";

  // Residential (vertical home + internal)
  const residSection = (isInternal||isVertical||isSegment) && topRes.length>0 ? `
  <div class="section">
    <div class="section-title">Residential Status</div>
    ${makeBars(topRes.map(([l,c])=>[l,c]),total,reportDef.vertical==="mortgage"?"#6D28D9":reportDef.vertical==="reform"?"#00A651":"#1A6FFF")}
  </div>` : "";

  // Financial profile section
  const finSection = (avgIncome||avgLoan||avgAge) ? `
  <div class="section">
    <div class="section-title">Lead Financial Profile</div>
    <div class="two-col">
      <div class="hi-box">
        ${avgIncome?`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase">Avg Monthly Net Income</div><div style="font-size:26px;font-weight:900;color:#005EFF;margin-top:3px">${fmtK(avgIncome)}</div></div>`:""}
        ${avgLoan?`<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase">Avg Loan Request</div><div style="font-size:26px;font-weight:900;color:#1A6FFF;margin-top:3px">${fmtK(avgLoan)}</div></div>`:""}
        ${avgAge?`<div><div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase">Average Age</div><div style="font-size:26px;font-weight:900;color:#0A1628;margin-top:3px">${avgAge} yrs</div></div>`:""}
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#6B7A99;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Employment</div>
        ${makeBars(topEmp.slice(0,3).map(([l,c])=>[l,c]),total,T.navy)}
      </div>
    </div>
  </div>` : "";

  // Purposes
  const purposeSection = topPurposes.length>0 ? `
  <div class="section">
    <div class="section-title">Loan Purpose Breakdown</div>
    ${makeBars(topPurposes.map(([l,c])=>[l,c]),Math.max(bcArr.length+fsArr.length,1),"#005EFF")}
  </div>` : "";

  // Exec summary special section
  const totalAll = (data["Bank Connected"]||[]).length + (data["Form Submitted"]||[]).length + (data["Incomplete"]||[]).length;
  const execSection = isExec ? `
  <div class="section">
    <div class="section-title">Strategic Overview</div>
    <div style="background:#F0F4FF;border-radius:10px;padding:18px 22px;border-left:4px solid #005EFF;font-size:12px;color:#1E3A5F;line-height:1.8;">
      <strong style="font-size:13px;color:#0A1628;display:block;margin-bottom:8px;">Batch Performance Summary</strong>
      Total pipeline: <strong>${totalAll} leads</strong> processed · ${bcArr.length} Bank Connected (${bcRate}% BC rate)<br/>
      Estimated revenue potential: CPL model → <strong>€${(bcArr.length*10+fsArr.length*5).toLocaleString()}</strong> · CPA model → <strong>€${Math.round(bcArr.length*0.35*avgLoan*0.01||0).toLocaleString()}</strong><br/>
      Data quality score: <strong>${delivScore}/100</strong> (${scoreLabel}) · ${Math.round(emailVerif/Math.max(total,1)*100)}% email verified<br/>
      Top vertical: Personal Loans · Second: Home & Reform · Third: Vehicle
    </div>
  </div>
  <div class="section">
    <div class="section-title">Revenue Model Projection</div>
    <table class="data-table">
      <tr><th>Model</th><th>Volume</th><th>Rate</th><th>Estimated Revenue</th></tr>
      <tr><td>CPL — BC leads</td><td>${bcArr.length} BC</td><td>€10/lead</td><td><strong>€${(bcArr.length*10).toLocaleString()}</strong></td></tr>
      <tr><td>CPL — FS leads</td><td>${fsArr.length} FS</td><td>€5/lead</td><td><strong>€${(fsArr.length*5).toLocaleString()}</strong></td></tr>
      <tr><td>CPA — BC × 35% conv × 1% ticket</td><td>${bcArr.length} BC</td><td>35% · €${avgLoan?fmtK(avgLoan):"—"}</td><td><strong>€${Math.round(bcArr.length*0.35*(avgLoan||0)*0.01).toLocaleString()}</strong></td></tr>
      <tr><td><strong>Hybrid (CPL + CPA)</strong></td><td>All BC+FS</td><td>Combined</td><td><strong>€${Math.round(bcArr.length*10+fsArr.length*5+bcArr.length*0.35*(avgLoan||0)*0.01).toLocaleString()}</strong></td></tr>
    </table>
  </div>` : "";

  // Risk report special section
  const riskSection = isRisk ? `
  <div class="section">
    <div class="section-title">Risk Flag Detail</div>
    <table class="data-table">
      <tr><th>Risk Type</th><th>Count</th><th>% of Batch</th><th>Action</th></tr>
      <tr><td>DTI Ratio >50%</td><td><strong>${dti.hi}</strong></td><td>${pct(dti.hi,total)}</td><td>Flag for risk-adjusted pricing or exclude</td></tr>
      <tr><td>Email Unverified</td><td><strong>${total-emailVerif}</strong></td><td>${pct(total-emailVerif,total)}</td><td>Run email verification before sending to partner</td></tr>
      <tr><td>Single Name Only</td><td><strong>${total-fullNames}</strong></td><td>${pct(total-fullNames,total)}</td><td>Request additional identity verification</td></tr>
      <tr><td>DTI Moderate 30–50%</td><td><strong>${dti.m}</strong></td><td>${pct(dti.m,total)}</td><td>Acceptable — flag for partner awareness</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Compliance Recommendations</div>
    <div style="background:#FEF2F2;border-radius:10px;padding:16px 20px;border-left:4px solid #EF4444;font-size:12px;color:#7F1D1D;line-height:1.8;">
      <strong>Before sharing this batch with regulated partners:</strong><br/>
      1. Exclude or flag leads with DTI >50% — ${dti.hi} leads (${pct(dti.hi,total)})<br/>
      2. Run email verification on unverified leads — ${total-emailVerif} pending<br/>
      3. Collect surname for single-name leads if sending to KYC-required partners<br/>
      4. Confirm GDPR consent status for all leads before transmission
    </div>
  </div>` : "";

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>CreditCheck — ${reportDef.label} — ${today}</title>
<style>${REPORT_CSS}</style>
</head><body><div class="page">
  ${intBanner}
  ${makeHeader(reportDef.label, dateFrom, dateTo, today, badgeHTML)}
  ${makePrintBtn()}
  ${execSection}
  <div class="section">
    <div class="section-title">${isRisk?"Flagged Leads Overview":"Summary"}</div>
    ${makeKPIGrid(kpiItems)}
  </div>
  ${riskSection}
  ${qualitySection}
  ${finSection}
  <div class="section">
    <div class="section-title">Verification Funnel</div>
    ${makeFunnel(funnelSteps, total)}
  </div>
  ${purposeSection}
  ${dtiSection}
  ${opts.vertical==="mortgage" ? `
  <div class="section">
    <div class="section-title">Regulatory Context</div>
    <div style="background:#FEF9EC;border:1px solid #FDE68A;border-radius:10px;padding:18px 22px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px;">
        <div><div style="font-size:9px;font-weight:800;color:#92400E;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Regulatory framework</div>
          <div style="color:#78350F;line-height:1.7;">LCCI — Ley 5/2019<br/>Mandatory compliance<br/>for all mortgage intermediaries</div></div>
        <div><div style="font-size:9px;font-weight:800;color:#92400E;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Partner requirements</div>
          <div style="color:#78350F;line-height:1.7;">BDER registration required<br/>for intermediarios hipotecarios<br/>Mandatory cooling-off (10 days)</div></div>
        <div><div style="font-size:9px;font-weight:800;color:#92400E;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Lead suitability note</div>
          <div style="color:#78350F;line-height:1.7;">These leads express refinance intent<br/>Product fit depends on property<br/>valuation and current LTV</div></div>
      </div>
    </div>
  </div>` : ""}
  ${opts.vertical==="vehicle_secured" ? `
  <div class="section">
    <div class="section-title">Product & Heuristic Note</div>
    <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:10px;padding:18px 22px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px;">
        <div><div style="font-size:9px;font-weight:800;color:#9F1239;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Segmentation method</div>
          <div style="color:#881337;line-height:1.7;">No explicit field in source data.<br/>Leads classified as vehicle-secured<br/>based on: loan &gt;€15k OR term &gt;60 months.<br/>These amounts are not viable as unsecured personal credit at these income levels.</div></div>
        <div><div style="font-size:9px;font-weight:800;color:#9F1239;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Partner capability required</div>
          <div style="color:#881337;line-height:1.7;">Vehicle valuation (ITV / tasación)<br/>Collateral registration capability<br/>Reserva de dominio or<br/>Prenda sin desplazamiento (notarial)</div></div>
      </div>
    </div>
  </div>` : ""}
  ${opts.vertical==="vehicle_unsecured" ? `
  <div class="section">
    <div class="section-title">Product Classification Note</div>
    <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:14px 20px;font-size:12px;color:#78350F;line-height:1.7;">
      <strong>Segmentation based on heuristic — no explicit field in source data.</strong>
      Leads classified as unsecured personal credit (loan ≤€15k AND term ≤60 months).
      The vehicle is the stated purchase destination, not the collateral.
      Underwriting should be based on income and DTI — no vehicle valuation required from the partner.
    </div>
  </div>` : ""}
  ${isInternal||isVertical||isSegment||isPartner||isPremium ? `<div class="section"><div class="two-col">${domainSection}${residSection}</div></div>` : ""}
  <div class="footer">
    <span>CreditCheck by Clovr Labs · ${today}</span>
    <span>${isInternal||isRisk?"Internal — Confidential":isPremium?"Premium Segment — Partner Distribution":"Lead Batch Report — Partner Distribution"}</span>
  </div>
</div></body></html>`;

  return html;
}

// ─── REPORT MODAL ──────────────────────────────────────────────────────────────
function ExportModal({onClose, data}) {
  const bc   = data["Bank Connected"]  || [];
  const fs   = data["Form Submitted"]  || [];
  const inc  = data["Incomplete"]      || [];
  const all  = [...bc, ...fs, ...inc];

  // ── Focus trap ────────────────────────────────────────────────────────────────
  const modalRef = useRef(null);
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll('button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
    const trap = e => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const f = Array.from(el.querySelectorAll('button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'));
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, [onClose]);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [cats,    setCats]    = useState({ bc:true, fs:true, inc:false });
  const [verticals, setVerts] = useState({ all:true, personal_loans:false, reform:false, mortgage:false, vehicle_unsecured:false, vehicle_secured:false });
  const [countries, setCountries] = useState({});  // {} = all selected
  const [fields,  setFields]  = useState({ name:true, email:true, country:true, language:false, loanAmount:true, loanMonths:false, purpose:true, income:true, expenses:false, employment:true, age:false, category:true });
  const [fmt, setFmt] = useState("csv"); // csv | xlsx_sim | json

  // Derived country list from data
  const allCountries = [...new Set(all.map(r=>r.country).filter(Boolean))].sort();

  // ── Filtering logic ──────────────────────────────────────────────────────────
  const VERT_PURPOSES = {
    personal_loans: ["personal_expenses","other","holiday","education","it_equipment"],
    reform:         ["home_improvement"],
    mortgage:       ["refinance"],
    vehicle_unsecured: ["vehicle"],
    vehicle_secured:   ["vehicle"],
  };
  const applyVehicleFilter = (r, vKey) => {
    if (vKey === "vehicle_unsecured") return (r.loanAmount||0) <= 15000 && (r.loanMonths||0) <= 60;
    if (vKey === "vehicle_secured")   return (r.loanAmount||0) > 15000 || (r.loanMonths||0) > 60;
    return true;
  };
  const matchesVertical = (r) => {
    if (verticals.all) return true;
    return Object.entries(verticals).some(([k,v]) => {
      if (!v || k==="all") return false;
      const purposes = VERT_PURPOSES[k] || [];
      return purposes.includes(r.purpose) && applyVehicleFilter(r, k);
    });
  };
  const matchesCat = (r) => {
    if (bc.includes(r)  && cats.bc)  return true;
    if (fs.includes(r)  && cats.fs)  return true;
    if (inc.includes(r) && cats.inc) return true;
    return false;
  };
  const matchesCountry = (r) => {
    const selKeys = Object.keys(countries).filter(k=>countries[k]);
    if (selKeys.length === 0) return true; // all
    return selKeys.includes(r.country || "unknown");
  };

  const filtered = useMemo(
    () => all.filter(r => matchesCat(r) && matchesVertical(r) && matchesCountry(r)),
    [cats, verticals, countries, data]
  );

  // ── Category of each lead (for export column) ───────────────────────────────
  const catLabel = (r) => bc.includes(r) ? "Bank Connected" : fs.includes(r) ? "Form Submitted" : "Incomplete";

  // ── Field definitions (ordered) ─────────────────────────────────────────────
  const FIELD_DEFS = [
    { key:"name",       label:"Name" },
    { key:"email",      label:"Email" },
    { key:"country",    label:"Country" },
    { key:"language",   label:"Language" },
    { key:"category",   label:"Category" },
    { key:"purpose",    label:"Loan Purpose" },
    { key:"loanAmount", label:"Loan Amount (€)" },
    { key:"loanMonths", label:"Term (months)" },
    { key:"income",     label:"Monthly Income (€)" },
    { key:"expenses",   label:"Monthly Expenses (€)" },
    { key:"employment", label:"Employment" },
    { key:"age",        label:"Age" },
  ];
  const activeFields = FIELD_DEFS.filter(f => fields[f.key]);

  // ── Export logic ─────────────────────────────────────────────────────────────
  const getVal = (r, key) => {
    if (key === "category")   return catLabel(r);
    if (key === "country")    return (r.country || "").toUpperCase();
    if (key === "language")   return r.language || "";
    if (key === "loanAmount") return r.loanAmount || "";
    if (key === "loanMonths") return r.loanMonths || "";
    if (key === "income")     return r.income || "";
    if (key === "expenses")   return r.expenses || "";
    if (key === "employment") return (r.employment||"").replace(/_/g," ");
    if (key === "purpose")    return (r.purpose||"").replace(/_/g," ");
    return r[key] || "";
  };

  // ── Generate exportable text content ────────────────────────────────────────
  const buildContent = () => {
    if (fmt === "json") {
      const json = filtered.map(r => Object.fromEntries(activeFields.map(f=>[f.label, getVal(r,f.key)])));
      return JSON.stringify(json, null, 2);
    } else {
      // CSV or TSV
      const sep = fmt === "tsv" ? "\t" : ",";
      const header = activeFields.map(f=>f.label).join(sep);
      const rows = filtered.map(r =>
        activeFields.map(f => {
          const v = String(getVal(r,f.key));
          return (fmt==="csv" && v.includes(",")) ? `"${v}"` : v;
        }).join(sep)
      );
      return [header, ...rows].join("\n");
    }
  };

  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [exportContent, setExportContent] = useState("");

  const handleExport = () => {
    const content = buildContent();
    setExportContent(content);
    setShowCopy(true);
    setCopied(false);
  };

  const handleCopy = () => {
    const content = exportContent;
    if (!content) return;

    // Strategy 1: native clipboard (works when iframe has focus)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
        .catch(() => downloadFallback(content));
      return;
    }
    downloadFallback(content);
  };

  const downloadFallback = (content) => {
    // Strategy 2: download as file — always works regardless of iframe focus
    try {
      const ext = fmt === "json" ? "json" : fmt === "tsv" ? "tsv" : "csv";
      const mime = fmt === "json" ? "application/json" : "text/plain";
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `creditcheck-leads.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch(e) {
      alert("Could not export: " + e.message);
    }
  };

  // ── UI helpers ───────────────────────────────────────────────────────────────
  const Toggle = ({checked, onChange, label, accent=T.blue}) => (
    <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",userSelect:"none"}}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{position:"absolute",opacity:0,width:0,height:0,margin:0}}/>
      <div style={{
        width:32,height:18,borderRadius:9,background:checked?accent:T.borderHi,
        position:"relative",transition:"background .15s",cursor:"pointer",flexShrink:0,
        pointerEvents:"none",
      }}>
        <div style={{
          width:14,height:14,borderRadius:"50%",background:"#fff",
          position:"absolute",top:2,left:checked?15:2,transition:"left .15s",
          boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
        }}/>
      </div>
      <span style={{fontSize:12,color:T.text,fontWeight:500}}>{label}</span>
    </label>
  );

  const Checkbox = ({checked, onChange, label, color=T.blue}) => (
    <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",userSelect:"none",padding:"5px 0"}}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{position:"absolute",opacity:0,width:0,height:0,margin:0}}/>
      <div style={{
        width:16,height:16,borderRadius:4,border:`2px solid ${checked?color:T.border}`,
        background:checked?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all .12s",flexShrink:0,pointerEvents:"none",
      }}>
        {checked&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{fontSize:12,color:T.textSub,fontWeight:500}}>{label}</span>
    </label>
  );

  const SectionHdr = ({children}) => (
    <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10,marginTop:18,paddingBottom:5,borderBottom:`1px solid ${T.border}`}}>{children}</div>
  );

  const VERT_LABELS = {
    personal_loans:"Personal Loans", reform:"Home Reform",
    mortgage:"Mortgage / Refinance", vehicle_unsecured:"Vehicle Personal Credit", vehicle_secured:"Vehicle Secured",
  };
  const COUNTRY_META_LOCAL = {
    es:"Spain", en:"English-speaking", pt:"Portugal",
    it:"Italy", fr:"France", de:"Germany", nl:"Netherlands", pl:"Poland",
  };

  return (
    <div style={{
      position:"fixed",inset:0,
      background:"rgba(0,0,0,0.85)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",
      backdropFilter:"blur(8px)",
    }} onClick={onClose}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Export Leads" className="cc-export-modal" style={{
        background:T.surface,
        width:780,maxWidth:"95vw",maxHeight:"90vh",
        borderRadius:16,
        boxShadow:"0 40px 100px rgba(10,22,40,0.4)",
        display:"flex",flexDirection:"column",
        overflow:"hidden",
        border:`1px solid ${T.border}`,
        position:"relative",
      }} onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{background:T.navy,padding:"0 20px",height:50,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          <div style={{width:28,height:28,background:`linear-gradient(135deg,${T.blue},${T.navy})`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6.5 9.5L8 11L11.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:"#fff",letterSpacing:-0.2}}>
              <span>CREDIT</span><span style={{color:T.blue3}}>CHECK</span>
              <span style={{color:T.muted,fontWeight:400,marginLeft:6,marginRight:6}}>·</span>
              <span style={{color:T.textSub,fontWeight:600,fontSize:12}}>Export Leads</span>
            </div>
            <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase"}}>
              filter · select fields · download
            </div>
          </div>
          <div style={{flex:1}}/>
          <button onClick={onClose} style={{width:28,height:28,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:T.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontFamily:"'Geist',sans-serif"}}>✕</button>
        </div>

        {/* ── Body: 2 columns ── */}
        <div className="cc-export-body" style={{display:"grid",gridTemplateColumns:"260px 1fr",flex:1,overflow:"hidden"}}>

          {/* LEFT — Filters */}
          <div style={{borderRight:`1px solid ${T.border}`,overflowY:"auto",padding:"16px 20px"}}>

            <SectionHdr>Category</SectionHdr>
            <Checkbox checked={cats.bc}  onChange={()=>setCats(p=>({...p,bc:!p.bc}))}   label="Bank Connected"  color={T.blue}/>
            <Checkbox checked={cats.fs}  onChange={()=>setCats(p=>({...p,fs:!p.fs}))}   label="Form Submitted"  color="#F59E0B"/>
            <Checkbox checked={cats.inc} onChange={()=>setCats(p=>({...p,inc:!p.inc}))} label="Incomplete"      color={T.muted}/>

            <SectionHdr>Vertical</SectionHdr>
            <Checkbox
              checked={verticals.all}
              onChange={()=>setVerts(p=>({...p,all:!p.all}))}
              label="All verticals"
              color={T.navy}
            />
            {Object.entries(VERT_LABELS).map(([k,label])=>(
              <Checkbox
                key={k}
                checked={!verticals.all && verticals[k]}
                onChange={()=>setVerts(p=>({...p, all:false, [k]:!p[k]}))}
                label={label}
                color={T.blue}
              />
            ))}

            {allCountries.length > 0 && <>
              <SectionHdr>Country</SectionHdr>
              <Checkbox
                checked={Object.keys(countries).filter(k=>countries[k]).length === 0}
                onChange={()=>setCountries({})}
                label="All countries"
                color={T.navy}
              />
              {allCountries.map(code=>(
                <Checkbox
                  key={code}
                  checked={!!countries[code]}
                  onChange={()=>setCountries(p=>({...p,[code]:!p[code]}))}
                  label={COUNTRY_META_LOCAL[code] || code.toUpperCase()}
                  color={T.blue}
                />
              ))}
            </>}

            <SectionHdr>Format</SectionHdr>
            {[["csv","CSV (.csv)"],["tsv","Excel-ready (.tsv)"],["json","JSON (.json)"]].map(([val,lbl])=>(
              <label key={val} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"5px 0"}}>
                <input type="radio" name="export-fmt" value={val} checked={fmt===val} onChange={()=>setFmt(val)} style={{position:"absolute",opacity:0,width:0,height:0,margin:0}}/>
                <div style={{
                  width:16,height:16,borderRadius:"50%",border:`2px solid ${fmt===val?T.blue:T.border}`,
                  background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,transition:"border-color .12s",pointerEvents:"none",
                }}>
                  {fmt===val && <div style={{width:7,height:7,borderRadius:"50%",background:T.blue}}/>}
                </div>
                <span style={{fontSize:12,color:T.textSub}}>{lbl}</span>
              </label>
            ))}
          </div>

          {/* RIGHT — Field selector + preview */}
          <div style={{overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:0}}>

            <SectionHdr>Fields to include</SectionHdr>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,marginBottom:18}}>
              {FIELD_DEFS.map(f=>(
                <Checkbox
                  key={f.key}
                  checked={!!fields[f.key]}
                  onChange={()=>setFields(p=>({...p,[f.key]:!p[f.key]}))}
                  label={f.label}
                  color={T.blue}
                />
              ))}
            </div>

            {/* Preview table */}
            <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${T.border}`}}>
              Preview — first 6 rows of {filtered.length} leads
            </div>
            <div style={{overflowX:"auto",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface2}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:10.5}}>
                <thead>
                  <tr style={{background:T.surface2}}>
                    {activeFields.map(f=>(
                      <th key={f.key} style={{padding:"7px 10px",textAlign:"left",color:T.muted,fontWeight:700,fontSize:10,letterSpacing:0.8,textTransform:"uppercase",whiteSpace:"nowrap"}}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0,6).map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:T.surface}}>
                      {activeFields.map(f=>(
                        <td key={f.key} style={{padding:"6px 10px",color:T.textSub,whiteSpace:"nowrap",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>
                          {String(getVal(r,f.key)).slice(0,30)||<span style={{color:T.border}}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={activeFields.length} style={{padding:20,textAlign:"center",color:T.muted,fontSize:11}}>No leads match current filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding:"12px 20px",
          borderTop:`1px solid ${T.border}`,
          background:T.surface2,
          display:"flex",justifyContent:"space-between",alignItems:"center",
          flexShrink:0,
        }}>
          <div style={{fontSize:11,color:T.muted}}>
            <span style={{fontWeight:700,color:T.text,fontSize:13}}>{filtered.length}</span>
            <span> leads · </span>
            <span style={{fontWeight:600,color:T.blue}}>{activeFields.length} fields</span>
            <span> · {fmt.toUpperCase()}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.muted,fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>Cancel</button>
            <button onClick={handleExport} disabled={filtered.length===0||activeFields.length===0} style={{
              padding:"8px 22px",borderRadius:8,border:"none",
              background:filtered.length>0&&activeFields.length>0?T.blue:T.border,
              color:filtered.length>0&&activeFields.length>0?"#fff":T.muted,
              fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Sans','Geist',sans-serif",
              display:"flex",alignItems:"center",gap:6,transition:"all .15s",
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 1v7M3 5.5l3 3 3-3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export {filtered.length} leads
            </button>
          </div>
        </div>

        {/* ── Copy overlay ── */}
        {showCopy && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.92)",borderRadius:16,zIndex:10,display:"flex",flexDirection:"column",padding:24,gap:16}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#fff",marginBottom:3}}>
                  {fmt.toUpperCase()} ready — {filtered.length} leads · {activeFields.length} fields
                </div>
                <div style={{fontSize:11,color:T.muted}}>
                  Copy the content and paste it in Excel, Google Sheets or your editor
                </div>
              </div>
              <button onClick={()=>setShowCopy(false)} style={{width:32,height:32,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer",fontFamily:"'Geist',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>

            {/* Textarea */}
            <textarea
              id="export-textarea"
              readOnly
              value={exportContent}
              style={{
                flex:1,minHeight:320,
                background:"rgba(5,7,12,0.97)",
                border:`1px solid ${T.borderHi}30`,
                borderRadius:10,
                color:"rgba(255,255,255,0.8)",
                fontFamily:"'SF Mono','Fira Code','Consolas',monospace",
                fontSize:11,
                lineHeight:1.6,
                padding:16,
                resize:"none",
                outline:"none",
              }}
              onClick={e=>e.target.select()}
            />

            {/* Actions */}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",alignSelf:"center",flex:1}}>
                Click the text to select all, then Ctrl+C / Cmd+C
              </div>
              <button onClick={()=>setShowCopy(false)} style={{padding:"9px 18px",borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.5)",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                Close
              </button>
              <button onClick={handleCopy} style={{
                padding:"9px 22px",borderRadius:8,border:"none",
                background:copied?T.green:T.blue,
                color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'IBM Plex Sans','Geist',sans-serif",
                display:"flex",alignItems:"center",gap:7,transition:"background .2s",
              }}>
                {copied
                  ? <><svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
                  : <><svg width="11" height="11" fill="none" viewBox="0 0 12 12"><rect x="1" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.3"/><path d="M3 3V2a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg> Copy / Download</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ERROR BOUNDARY ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Dashboard error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"'IBM Plex Sans','Geist',sans-serif"}}>
          <div style={{maxWidth:480,padding:40,background:T.surface,borderRadius:16,boxShadow:"0 4px 40px rgba(0,0,0,0.6)",border:`1px solid ${T.border}`,textAlign:"center"}}>
            <div style={{marginBottom:16,color:T.amber,lineHeight:0}}><svg width="40" height="36" viewBox="0 0 14 13" fill="none"><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill="currentColor"/></svg></div>
            <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:8}}>Unexpected Error</div>
            <div style={{fontSize:13,color:T.muted,marginBottom:24,lineHeight:1.6}}>{this.state.error.message || "An error occurred. Reload the page and try again."}</div>
            <button onClick={()=>this.setState({error:null})} style={{padding:"10px 24px",background:T.blue,color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'IBM Plex Sans','Geist',sans-serif"}}>
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── LIVE DATA FETCHER ────────────────────────────────────────────────────────
// Fetches the live XLSX export from ibancheck.io and parses it via processRows().
// Mirrors the CDN XLSX loading pattern used in UploadZone.
const LIVE_ENDPOINT = "https://ibancheck.io/api/credit-exports";

async function fetchLiveData() {
  let res;
  try {
    res = await fetch(LIVE_ENDPOINT, { method: "GET" });
  } catch (err) {
    const corsErr = new Error(`Network error — likely CORS: ${err.message}`);
    corsErr.isCors = true;
    throw corsErr;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = await res.arrayBuffer();
  const XLSX = window.XLSX || await new Promise((resolve, reject) => {
    const s = Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      onload: () => resolve(window.XLSX),
      onerror: () => reject(new Error("Failed to load XLSX library")),
    });
    document.head.appendChild(s);
  });
  const wb = XLSX.read(buf, { type: "array" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
  if (rows.length < 2) throw new Error("Empty file — no data rows");
  return processRows(rows.slice(1), rows[0].map(h => String(h || "")));
}

function fmtAgo(date) {
  if (!date) return "";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function AppInner() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState("light");

  // Restore theme from encrypted storage (async — window.storage returns a Promise).
  useEffect(() => {
    window.storage?.get("cc_theme").then(r => {
      const v = r?.value;
      if (v === "light" || v === "dark") setTheme(v);
    }).catch(() => {});
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  const [data,setData]=useState(DEFAULT_DATA);
  const [tab,setTab]=useState("leads");
  const [showUpload,setUpload]=useState(false);
  const [showReportModal,setShowReportModal]=useState(false);

  // ── Live data fetch state ─────────────────────────────────────────────────
  // liveStatus: null = not yet tried | {ok:true, at:Date} | {ok:false, err:string, isCors:bool}
  const [liveStatus,setLiveStatus]=useState(null);
  const [fetching,setFetching]=useState(false);
  const userUploadedRef=useRef(false); // true once user manually uploads XLSX
  // Lifted state shared between Partners + Revenue tabs — persisted via storage
  const [partners,setPartners]=useState([newPartner("Partner A")]);
  const [partnerMonthData,setPartnerMonthData]=useState({});
  const [storageReady,setStorageReady]=useState(false);

  // ── Live fetch callback ───────────────────────────────────────────────────
  const runFetch = useCallback(async () => {
    if (userUploadedRef.current) return; // manual upload takes priority
    setFetching(true);
    try {
      const d = await fetchLiveData();
      setData(d);
      setLiveStatus({ ok:true, at:new Date() });
    } catch(err) {
      setLiveStatus({ ok:false, err:err.message, isCors:!!err.isCors });
    } finally {
      setFetching(false);
    }
  }, []);

  // Fetch on mount + every 60 min — deferred until storageReady so that
  // a restored userUploadedRef flag can block the fetch before it fires.
  useEffect(() => {
    if (!storageReady) return;
    runFetch();
    const id = setInterval(runFetch, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [runFetch, storageReady]);

  // Load from storage on mount
  useEffect(()=>{
    (async()=>{
      try {
        const r1 = await window.storage.get("cc_partners");
        if (r1?.value) {
          const parsed = JSON.parse(r1.value);
          if (Array.isArray(parsed) && parsed.length > 0) setPartners(parsed);
        }
      } catch(_){}
      try {
        const r2 = await window.storage.get("cc_month_data");
        if (r2?.value) {
          const parsed = JSON.parse(r2.value);
          if (parsed && typeof parsed === "object") setPartnerMonthData(parsed);
        }
      } catch(_){}
      // Restore uploaded XLSX rows — must happen before storageReady triggers runFetch
      try {
        const rUploaded = await window.storage.get("cc_user_uploaded");
        if (rUploaded?.value === "true") {
          userUploadedRef.current = true;
          const rRows = await window.storage.get("cc_rows");
          if (rRows?.value) {
            const parsed = JSON.parse(rRows.value);
            if (parsed && typeof parsed === "object") setData(parsed);
          }
        }
      } catch(_){}
      setStorageReady(true);
    })();
  },[]);

  // Auto-save partners whenever they change (skip initial render before storage loaded)
  useEffect(()=>{
    if (!storageReady) return;
    window.storage.set("cc_partners", JSON.stringify(partners)).catch(()=>{});
  },[partners, storageReady]);

  // Auto-save monthData whenever it changes
  useEffect(()=>{
    if (!storageReady) return;
    window.storage.set("cc_month_data", JSON.stringify(partnerMonthData)).catch(()=>{});
  },[partnerMonthData, storageReady]);

  const bc=(data["Bank Connected"]||[]).length;
  const fs=(data["Form Submitted"]||[]).length;
  const incomplete=(data["Incomplete"]||[]).length;
  const total=bc+fs+incomplete;

  const allDates=[...(data["Bank Connected"]||[]),...(data["Form Submitted"]||[]),...(data["Incomplete"]||[])]
    .map(r=>r.created).filter(Boolean).sort();
  const snapshotDate=allDates.length?allDates[allDates.length-1]:null;

  const onData=useCallback(d=>{
    userUploadedRef.current=true; // pause auto-refresh until page reload
    setData(d);
    setUpload(false);
    // Persist uploaded rows so they survive page reloads
    window.storage.set("cc_user_uploaded", "true").catch(()=>{});
    window.storage.set("cc_rows", JSON.stringify(d)).catch(()=>{});
  },[]);

  const staleDays =snapshotDate?Math.floor((new Date()-new Date(snapshotDate))/86400000):null;
  const staleHours=snapshotDate?Math.floor((new Date()-new Date(snapshotDate))/3600000):null;

  const MAIN_TABS=[
    {id:"leads",     label:"Leads"},
    {id:"analytics", label:"Analytics"},
    {id:"verticals", label:"Verticals"},
    {id:"countries", label:"Countries"},
    {id:"scoring",   label:"Lead Scoring"},
    {id:"insights",  label:"Insights"},
    {id:"quality",   label:"Data Quality"},
    {id:"revenue",   label:"Revenue"},
    {id:"partners",  label:"Partners"},
  ];

  return (
    <div key={theme} style={{fontFamily:"'Geist',sans-serif",background:T.bg,minHeight:"100vh",color:T.text}}>

      {/* ── NAVBAR ── */}
      <div style={{background:T.bg,position:"sticky",top:0,zIndex:100,borderBottom:`1px solid ${T.border}`}}>
        <div style={{padding:"0 24px",height:54,display:"flex",alignItems:"center",gap:10,maxWidth:1600,margin:"0 auto",width:"100%"}}>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0,marginRight:12}}>
            <div style={{width:30,height:30,background:`linear-gradient(135deg,${T.blue},${T.navy})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 0 1px ${T.blue}30,0 4px 12px ${T.blue}20`}}>
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M6.5 9.5L8 11L11.5 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:800,letterSpacing:-0.4,lineHeight:1,fontFamily:"'Geist',sans-serif",color:T.text}}>
                Credit<span style={{color:T.blue}}>Check</span>
              </div>
              <div style={{fontSize:8,color:T.muted,fontWeight:500,letterSpacing:1.2,textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace",marginTop:1}}>Lead Intelligence</div>
            </div>
          </div>

          {/* Tab nav */}
          <nav className="cc-nav" style={{display:"flex",gap:0,flex:1,height:"100%",alignItems:"stretch"}}>
            {MAIN_TABS.map(t=>{
              const active=tab===t.id;
              return (
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding:"0 14px",border:"none",background:"none",cursor:"pointer",
                  fontSize:11,fontWeight:active?600:400,
                  letterSpacing:0.1,
                  color:active?T.text:T.muted,
                  borderBottom:`1.5px solid ${active?T.blue:"transparent"}`,
                  transition:"all .12s",fontFamily:"'Geist',sans-serif",
                  whiteSpace:"nowrap",
                }}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.color=T.textSub}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.color=T.muted}}>
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Right controls */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>

            {/* Live status indicator */}
            {(()=>{
              const dot=(color)=><div style={{width:6,height:6,borderRadius:"50%",background:color,boxShadow:`0 0 7px ${color}`,flexShrink:0}}/>;
              const wrap=(content)=>(
                <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:6}}>
                  {content}
                  <button className="cc-btn" onClick={runFetch} disabled={fetching} title="Refresh live data" style={{marginLeft:2,background:"none",border:"none",padding:"0 2px",cursor:fetching?"wait":"pointer",color:T.muted,fontSize:12,lineHeight:1,opacity:fetching?0.5:1}}>
                    ↻
                  </button>
                </div>
              );
              if (fetching && !liveStatus) return wrap(<><div style={{width:6,height:6,borderRadius:"50%",background:T.muted,animation:"cc-spin .8s linear infinite",flexShrink:0}}/><span style={{fontSize:10,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>Connecting…</span></>);
              if (liveStatus?.ok) {
                const mins=Math.floor((Date.now()-liveStatus.at.getTime())/60000);
                const fresh=mins<30;
                const color=fresh?T.green:T.amber;
                return wrap(<>{dot(color)}<span style={{fontSize:10,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.2}}>Live · <span style={{color}}>{fmtAgo(liveStatus.at)}</span></span></>);
              }
              if (liveStatus && !liveStatus.ok) {
                return wrap(<>{dot(T.red)}<span style={{fontSize:10,color:T.red,fontFamily:"'IBM Plex Mono',monospace"}}>Offline</span></>);
              }
              // Fallback: show snapshot date (pre-fetch)
              if (snapshotDate) return wrap(<>{dot(staleDays>=3?T.red:staleDays>=1?T.amber:T.green)}<span style={{fontSize:10,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.3}}>{snapshotDate}</span></>);
              return null;
            })()}

            {/* Theme toggle */}
            <button
              className="cc-btn"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              style={{
                width:32,height:32,borderRadius:7,border:`1px solid ${T.border}`,
                background:T.surface2,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:T.muted,flexShrink:0,
              }}>
              {theme === "light"
                ? <svg aria-hidden="true" width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg aria-hidden="true" width="13" height="13" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              }
            </button>

            {/* Save indicator */}
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:6,opacity:storageReady?1:0.4,transition:"opacity .3s"}} title="Auto-saved">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M8.5 6.5v1.5a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V6.5M5 1v5M3 4l2 2 2-2" stroke={storageReady?T.green:T.muted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{fontSize:9,color:storageReady?T.green:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5}}>{storageReady?"SAVED":"..."}</span>
            </div>

            {/* Export button */}
            <button className="cc-btn" onClick={()=>setShowReportModal(true)} style={{
              display:"flex",alignItems:"center",gap:5,padding:"6px 12px",
              background:T.surface2,border:`1px solid ${T.border}`,
              borderRadius:7,color:T.textSub,fontWeight:500,fontSize:11,
              cursor:"pointer",fontFamily:"'Geist',sans-serif",letterSpacing:0.1,
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 1v7M3 5.5l3 3 3-3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export
            </button>

            {/* Upload button */}
            <button className="cc-btn" onClick={()=>setUpload(v=>!v)} style={{
              display:"flex",alignItems:"center",gap:5,padding:"6px 12px",
              background:showUpload?T.blue:T.surface2,
              border:`1px solid ${showUpload?T.blue:T.border}`,
              borderRadius:7,color:showUpload?"#fff":T.textSub,fontWeight:600,fontSize:11,
              cursor:"pointer",fontFamily:"'Geist',sans-serif",letterSpacing:0.1,
              boxShadow:showUpload?"0 0 0 3px rgba(59,130,246,0.15)":"none",
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 9V2M3 4.5L6 1.5l3 3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Upload XLSX
            </button>
          </div>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload&&(
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"16px 24px"}}>
          <UploadZone onData={onData}/>
        </div>
      )}

      {/* ── KPI STRIP ── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`}}>
        <div className="cc-kpi-strip" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",maxWidth:1600,margin:"0 auto"}}>
          {[
            {label:"Total Leads",    value:total>0?total:"—",           sub:"unique · deduplicated",   color:T.text,  accent:T.blue,   icon:"◈"},
            {label:"Bank Connected", value:bc>0?bc:"—",                 sub:`${bc+fs>0?Math.round(bc/(bc+fs)*100):0}% of active leads`, color:T.green, accent:T.green, icon:"✓"},
            {label:"Form Submitted", value:fs>0?fs:"—",                 sub:"Pending bank connection", color:T.blue,  accent:T.blue,   icon:"◷"},
            {label:"Incomplete",     value:incomplete>0?incomplete:"—", sub:"Cancelled / dropped off", color:T.amber, accent:T.amber,  icon:"◌"},
          ].map((k,i)=>(
            <div key={k.label} style={{
              padding:"20px 28px 18px",
              borderRight:i<3?`1px solid ${T.border}`:"none",
              position:"relative",
              overflow:"hidden",
            }}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg,${k.accent}60,transparent)`}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,fontFamily:"'IBM Plex Mono',monospace"}}>{k.label}</div>
                  <div style={{fontSize:36,fontWeight:800,color:k.color,letterSpacing:-1.5,lineHeight:1,fontVariantNumeric:"tabular-nums",fontFamily:"'Geist',sans-serif"}}>{k.value}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:6,fontFamily:"'IBM Plex Mono',monospace"}}>{k.sub}</div>
                </div>
                <div style={{fontSize:22,color:`${k.accent}40`,fontWeight:300,marginTop:4,fontFamily:"'Geist',sans-serif"}}>{k.icon}</div>
              </div>
              {i===1&&bc>0&&fs>0&&(
                <div style={{
                  position:"absolute",bottom:16,right:16,
                  fontSize:10,fontWeight:700,
                  color:T.green,
                  background:T.greenBg,
                  padding:"2px 8px",borderRadius:4,
                  border:"1px solid #10B98130",
                  fontFamily:"'IBM Plex Mono',monospace",
                  letterSpacing:0.5,
                }}>
                  {Math.round(bc/(bc+fs)*100)}% BC
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live / offline / stale banner */}
      {(()=>{
        // 1. Live data is fresh — green confirmation strip
        if (liveStatus?.ok && !userUploadedRef.current) {
          const mins=Math.floor((Date.now()-liveStatus.at.getTime())/60000);
          if (mins<30) return (
            <div style={{padding:"6px 24px",fontSize:11,background:T.greenBg,borderBottom:`1px solid ${T.green}30`,display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace"}}>
              <span style={{fontSize:12}}>🟢</span>
              <strong style={{color:T.green}}>Live data</strong>
              <span style={{color:T.muted}}>— Auto-refreshes every 60 min · Updated {fmtAgo(liveStatus.at)}</span>
            </div>
          );
          // >30 min old but still ok
          return (
            <div style={{padding:"6px 24px",fontSize:11,background:T.amberBg,borderBottom:`1px solid ${T.amber}30`,display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace"}}>
              <span style={{fontSize:12}}>🟡</span>
              <strong style={{color:T.amber}}>Live · {fmtAgo(liveStatus.at)}</strong>
              <span style={{color:T.muted}}>— Data may be stale · <button className="cc-btn" onClick={runFetch} style={{background:"none",border:"none",padding:0,color:T.blue,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Refresh now</button></span>
            </div>
          );
        }
        // 2. CORS / network blocked — show actionable warning
        if (liveStatus && !liveStatus.ok && liveStatus.isCors) return (
          <div style={{padding:"6px 24px",fontSize:11,background:T.amberBg,borderBottom:`1px solid ${T.amber}30`,display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace"}}>
            <svg width="12" height="11" viewBox="0 0 14 13" fill="none" style={{flexShrink:0,color:T.amber}}><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill="currentColor"/></svg>
            <strong style={{color:T.amber}}>Auto-fetch unavailable</strong>
            <span style={{color:T.muted}}>— Upload XLSX manually or configure a CORS proxy. {!userUploadedRef.current&&snapshotDate&&<>Showing sample data.</>}</span>
          </div>
        );
        // 3. Other API error
        if (liveStatus && !liveStatus.ok) return (
          <div style={{padding:"6px 24px",fontSize:11,background:T.redBg,borderBottom:`1px solid ${T.red}30`,display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace"}}>
            <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.red,flexShrink:0}}/>
            <strong style={{color:T.red}}>Offline · Using cached data</strong>
            <span style={{color:T.muted}}>— {liveStatus.err} · <button className="cc-btn" onClick={runFetch} style={{background:"none",border:"none",padding:0,color:T.blue,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Retry</button></span>
          </div>
        );
        // 4. Manual upload — show stale banner if data is old (existing logic)
        if (userUploadedRef.current && staleHours>=2) return (
          <div style={{padding:"7px 24px",fontSize:11,background:staleDays>=3?T.redBg:staleDays>=1?T.amberBg:T.greenBg,borderBottom:`1px solid ${staleDays>=3?T.red+"30":staleDays>=1?T.amber+"30":T.green+"30"}`,display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace"}}>
            <span style={{fontSize:13}}>{staleDays>=3?"🔴":staleDays>=1?"🟡":"🟢"}</span>
            <strong style={{color:staleDays>=3?T.red:staleDays>=1?T.amber:T.green}}>
              Snapshot {staleDays>=1?`${staleDays} day${staleDays>1?"s":""}`:`${staleHours}h`} old
            </strong>
            <span style={{color:T.muted}}>— Last record: <strong>{snapshotDate}</strong> · Upload a newer XLSX to include recent leads.</span>
          </div>
        );
        return null;
      })()}

      {/* Report modal */}
      {showReportModal&&(
        <ExportModal data={data} onClose={()=>setShowReportModal(false)}/>
      )}

      {/* Content */}
      <div key={theme} className="cc-tab-content" style={{padding:"24px 28px",maxWidth:1600,margin:"0 auto"}}>
        {tab==="leads"     &&<LeadsTab data={data}/>}
        {tab==="analytics" &&<AnalyticsTab data={data}/>}
        {tab==="verticals" &&<VerticalsTab data={data}/>}
        {tab==="countries" &&<CountriesTab data={data}/>}
        {tab==="scoring"   &&<LeadScoringTab data={data}/>}
        {tab==="insights"  &&<InsightsTab data={data}/>}
        {tab==="quality"   &&<DataQualityTab data={data}/>}
        {tab==="revenue"   &&<RevenueTab partners={partners} monthData={partnerMonthData}/>}
        {tab==="partners"  &&<MultiPartnerTab partners={partners} setPartners={setPartners} monthData={partnerMonthData} setMonthData={setPartnerMonthData}/>}
      </div>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}
