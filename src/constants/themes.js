// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const THEMES = {
  light: {
    bg:"#F0F0F1", surface:"#FFFFFF", surface2:"#F8F9FC", surface3:"#E6E7EF",
    border:"#E2E7F0", borderHi:"#C8D2E8",
    text:"#1A1A1A", textSub:"#374151", muted:"#6B7280",
    navy:"#0A1264",
    blue:"#005EFF",
    blue2:"#1A6FFF",
    blue3:"#4D94FF",
    blue4:"#DCE8FF",
    green:"#059669", greenBg:"#ECFDF5",
    amber:"#D97706", amberBg:"#FFFBEB",
    red:"#DC2626",   redBg:"#FEF2F2",
    accent:"#005EFF", accentGlow:"rgba(0,94,255,0.12)",
    rowHover:"#EFF4FF", scrollThumb:"#C8D2E8",
    navBg:"#0A1264", navBorder:"rgba(255,255,255,0.08)",
    fontDisplay:"'Playfair Display', serif",
    isDark:false,
  },
  dark: {
    bg:"#0D0F14", surface:"#13161D", surface2:"#1A1E27", surface3:"#22273A",
    border:"#252A38", borderHi:"#313751",
    text:"#F0F2F8", textSub:"#8892AA", muted:"#525D78",
    navy:"#030924",
    blue:"#1A6FFF",
    blue2:"#4D94FF",
    blue3:"#80B3FF",
    blue4:"#0A1A40",
    green:"#10B981", greenBg:"#0D2D23",
    amber:"#F59E0B", amberBg:"#2D1F0A",
    red:"#EF4444",   redBg:"#2D1010",
    accent:"#1A6FFF", accentGlow:"rgba(26,111,255,0.15)",
    rowHover:"#1A1E27", scrollThumb:"#313751",
    navBg:"#030924", navBorder:"rgba(255,255,255,0.07)",
    fontDisplay:"'Playfair Display', serif",
    isDark:true,
  },
};

// T is a mutable proxy — all components read T.* and get current theme values
export let T = { ...THEMES.light };

// CAT_STYLE — mutable so applyTheme can refresh it on theme change
export const CAT_STYLE = { "Bank Connected":{}, "Form Submitted":{}, "Incomplete":{} };

export function _buildCatStyle() {
  return {
    "Bank Connected":{ color:T.green,  light:T.greenBg,  border:T.green+"30",  short:"BC" },
    "Form Submitted":{ color:T.blue,   light:T.surface3,  border:T.blue+"30",   short:"FS" },
    "Incomplete":    { color:T.amber,  light:T.amberBg,   border:T.amber+"30",  short:"IC" },
  };
}

// GRADE_STYLE — mutable so applyTheme can refresh it on theme change
export const GRADE_STYLE = { "A":{}, "B":{} };

export function _buildGradeStyle() {
  return {
    "A": { label:"A — Premium",  color:T.navy, bg:T.surface3, desc:"Open Banking connected" },
    "B": { label:"B — Standard", color:T.blue, bg:T.blue4,    desc:"Form completed" },
  };
}

// MODEL_COLORS — mutable so applyTheme can refresh it on theme change
export const MODEL_COLORS = { cpl:"", cpa:"", hybrid:"" };

export function _buildModelColors() {
  return { cpl:T.blue2, cpa:T.navy, hybrid:T.blue3 };
}

export function applyTheme(themeName) {
  Object.assign(T, THEMES[themeName]);
  Object.assign(CAT_STYLE, _buildCatStyle());
  Object.assign(GRADE_STYLE, _buildGradeStyle());
  Object.assign(MODEL_COLORS, _buildModelColors());

  let el = document.getElementById("cc-global-styles");
  if (!el) { el = document.createElement("style"); el.id = "cc-global-styles"; document.head.appendChild(el); }
  const t = THEMES[themeName];
  // Note: Google Fonts @import is in index.html — do NOT re-import here (prevents re-fetch on theme toggle)
  el.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    body { background: ${t.bg} !important; font-family: 'IBM Plex Sans', 'Geist', sans-serif; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: ${t.borderHi}; }
    input[type=date]::-webkit-calendar-picker-indicator { filter: ${t.isDark ? "invert(0.6)" : "none"}; }
    select option { background: ${t.surface}; color: ${t.text}; }
    @keyframes cc-fade-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cc-spin { to { transform: rotate(360deg); } }
    .cc-tab-content { animation: cc-fade-in 0.18s ease; }
    .cc-row:hover td { background: ${t.rowHover} !important; }
    .cc-btn { transition: all 0.14s ease; cursor: pointer; }
    .cc-btn:focus-visible { outline: 2px solid ${t.blue}; outline-offset: 2px; }
    .cc-card { transition: border-color 0.14s ease; }
    .cc-card:hover { border-color: ${t.borderHi} !important; }
    .cc-input {
      background: ${t.surface2}; color: ${t.text};
      border: 1px solid ${t.border}; border-radius: 7px;
      padding: 6px 10px; font-size: 11px; font-family: 'IBM Plex Sans', 'Geist', sans-serif;
      outline: none; transition: border-color .14s;
    }
    .cc-input:focus { border-color: ${t.blue}; box-shadow: 0 0 0 3px ${t.accentGlow}; }
    .cc-input::placeholder { color: ${t.muted}; }
    button:focus-visible { outline: 2px solid ${t.blue}; outline-offset: 2px; }
    a:focus-visible { outline: 2px solid ${t.blue}; outline-offset: 2px; }
    .cc-display { font-family: 'Playfair Display', serif; }
    .cc-display-heading { font-family: 'Playfair Display', serif; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; }
    @media (max-width: 768px) {
      [data-cc="navbar"] > div { padding: 0 12px !important; height: auto !important; flex-wrap: wrap !important; padding-top: 8px !important; padding-bottom: 8px !important; }
      [data-cc="tabbar"] { overflow-x: auto !important; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; }
      [data-cc="tabbar"] button { padding: 0 10px !important; font-size: 10px !important; }
      [data-cc="kpi-strip"] > div { grid-template-columns: repeat(2, 1fr) !important; }
      [data-cc="kpi-card"] { padding: 14px 16px 12px !important; }
      [data-cc="tab-content"] { padding: 12px 12px !important; }
      [data-cc="date-range-bar"] { padding: 6px 12px !important; }
      [data-cc="date-range-bar"] > div { gap: 6px !important; }
    }
    @media (max-width: 480px) {
      [data-cc="kpi-strip"] > div { grid-template-columns: 1fr !important; }
      [data-cc="kpi-card"] { padding: 12px !important; }
    }
    @media print {
      /* Hide chrome: navbar, tab bar, toolbar, sidebar, modals, overlays */
      [data-cc="navbar"], [data-cc="tabbar"], [data-cc="date-range-bar"],
      [data-cc="upload-zone"], [data-cc="export-modal"], [data-cc="keyboard-help"],
      [data-cc="lead-drawer"], [data-cc="col-menu"],
      button.cc-btn[data-cc="refresh"], button.cc-btn[data-cc="theme-toggle"],
      button.cc-btn[data-cc="upload-btn"], button.cc-btn[data-cc="export-btn"],
      button.cc-btn[data-cc="key-help-btn"] { display: none !important; }
      /* Force white background, black text */
      body { background: #fff !important; color: #000 !important; }
      [data-cc="tab-content"] { padding: 16px 0 !important; }
      /* Avoid page breaks inside cards and table rows */
      .cc-card { page-break-inside: avoid; break-inside: avoid; border: 1px solid #ddd !important; box-shadow: none !important; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      /* KPI strip: lay out horizontally, full width */
      [data-cc="kpi-strip"] { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; }
      [data-cc="kpi-card"] { flex: 1 1 160px !important; }
      /* Charts: ensure they render (Recharts uses SVG — prints fine) */
      .recharts-wrapper { max-width: 100% !important; }
      /* Remove sticky header background */
      thead tr { background: #f5f5f5 !important; }
    }
  `;
  try { window.storage?.set("cc_theme", themeName).catch(() => {}); } catch(_){}
}

// Initialise on load
applyTheme("light");
