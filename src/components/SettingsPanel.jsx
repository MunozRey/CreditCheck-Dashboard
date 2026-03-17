import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

// ── Colour-picker swatch ──────────────────────────────────────────────────────
function ColorSwatch({ value, onChange, label }) {
  const { T } = useTheme();
  return (
    <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
      <div style={{ position:"relative", width:28, height:28 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:value, border:`1px solid ${T.border}`, cursor:"pointer" }} />
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }} />
      </div>
      <span style={{ fontSize:12, color:T.textSub }}>{label}</span>
      <span style={{ fontSize:10, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", marginLeft:"auto" }}>{value}</span>
    </label>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, checked, onChange, T }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", padding:"8px 0", borderBottom:`1px solid ${T.surface3}` }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!checked)} style={{
        width:36, height:20, borderRadius:10, background:checked ? T.blue : T.surface3,
        position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s",
        border:`1px solid ${checked ? T.blue : T.border}`,
      }}>
        <div style={{
          position:"absolute", top:2, left: checked ? 17 : 2,
          width:14, height:14, borderRadius:"50%", background:"#fff",
          boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left .2s",
        }} />
      </div>
    </label>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ children, T }) {
  return (
    <div style={{ fontSize:9, fontWeight:800, color:T.muted, letterSpacing:1.4, textTransform:"uppercase", margin:"20px 0 8px", paddingBottom:4, borderBottom:`1px solid ${T.border}` }}>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SettingsPanel({ settings, onSave, onClose }) {
  const { T } = useTheme();
  const [local, setLocal] = useState(settings);

  // Sync if parent settings change while panel is open
  useEffect(() => setLocal(settings), [settings]);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const handleSave = () => { onSave(local); onClose(); };
  const handleReset = () => setLocal(DEFAULT_SETTINGS);

  const inputStyle = {
    border:`1px solid ${T.border}`, borderRadius:7, padding:"6px 10px",
    fontSize:12, color:T.text, background:T.surface2,
    fontFamily:"'Geist',sans-serif", outline:"none", width:"100%",
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:200, backdropFilter:"blur(2px)" }} />

      {/* Panel */}
      <div data-cc="settings-panel" style={{
        position:"fixed", top:0, right:0, bottom:0, width:400, zIndex:201,
        background:T.surface, borderLeft:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column",
        boxShadow:"-8px 0 40px rgba(0,0,0,0.18)",
        animation:"cc-drawer-in .22s ease",
      }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12, background:T.surface2, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'Playfair Display',serif" }}>Dashboard Settings</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>Customize appearance &amp; layout</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:T.muted, lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px 24px" }}>

          {/* ── Branding ── */}
          <SectionHead T={T}>Branding</SectionHead>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.muted, display:"block", marginBottom:4 }}>Dashboard Title</label>
              <input value={local.title} onChange={e => set("title", e.target.value)} placeholder="CreditCheck" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.muted, display:"block", marginBottom:4 }}>Subtitle / Organisation</label>
              <input value={local.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Lead Intelligence Platform" style={inputStyle} />
            </div>
            <ToggleRow T={T} label="Show official CreditChecker logo" desc="Uses the SVG wordmark from creditchecker.io" checked={local.showOfficialLogo} onChange={v => set("showOfficialLogo", v)} />
          </div>

          {/* ── Accent Colors ── */}
          <SectionHead T={T}>Accent Colors (light theme)</SectionHead>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <ColorSwatch value={local.accentBlue}  onChange={v => set("accentBlue",  v)} label="Primary blue"  />
            <ColorSwatch value={local.accentNavy}  onChange={v => set("accentNavy",  v)} label="Navy / dark"   />
            <ColorSwatch value={local.accentGreen} onChange={v => set("accentGreen", v)} label="Success green" />
            <ColorSwatch value={local.accentAmber} onChange={v => set("accentAmber", v)} label="Warning amber" />
            <ColorSwatch value={local.accentRed}   onChange={v => set("accentRed",   v)} label="Error red"     />
          </div>

          {/* ── KPI Cards ── */}
          <SectionHead T={T}>KPI Strip — visible cards</SectionHead>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[
              { key:"kpiTotal",     label:"Total Leads",      desc:"Sum of all categories" },
              { key:"kpiBC",        label:"Bank Connected",   desc:"Open Banking verified leads" },
              { key:"kpiFS",        label:"Form Submitted",   desc:"Self-reported form leads" },
              { key:"kpiIncomplete",label:"Incomplete",       desc:"Leads with missing info" },
              { key:"kpiAvgScore",  label:"Avg. Lead Score",  desc:"Mean scoring across BC + FS" },
            ].map(({ key, label, desc }) => (
              <ToggleRow key={key} T={T} label={label} desc={desc} checked={local[key] !== false} onChange={v => set(key, v)} />
            ))}
          </div>

          {/* ── Visible Tabs ── */}
          <SectionHead T={T}>Visible Tabs</SectionHead>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {[
              { key:"tabLeads",     label:"Leads" },
              { key:"tabAnalytics", label:"Analytics" },
              { key:"tabVerticals", label:"Verticals" },
              { key:"tabCountries", label:"Countries" },
              { key:"tabScoring",   label:"Lead Scoring" },
              { key:"tabInsights",  label:"Insights" },
              { key:"tabQuality",   label:"Data Quality" },
              { key:"tabRevenue",   label:"Revenue" },
              { key:"tabPartners",  label:"Partners" },
            ].map(({ key, label }) => (
              <ToggleRow key={key} T={T} label={label} checked={local[key] !== false} onChange={v => set(key, v)} />
            ))}
          </div>

          {/* ── Table defaults ── */}
          <SectionHead T={T}>Table Defaults</SectionHead>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.muted, display:"block", marginBottom:4 }}>Default Lead Category</label>
              <select value={local.defaultCat} onChange={e => set("defaultCat", e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                <option value="Form Submitted">Form Submitted</option>
                <option value="Bank Connected">Bank Connected</option>
                <option value="Incomplete">Incomplete</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.muted, display:"block", marginBottom:4 }}>Default Sort</label>
              <select value={local.defaultSort} onChange={e => set("defaultSort", e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                <option value="created">Newest first</option>
                <option value="name">Name A→Z</option>
                <option value="purpose">Purpose</option>
                <option value="country">Country</option>
              </select>
            </div>
            <ToggleRow T={T} label="Show date range bar" desc="Global date filter below navbar" checked={local.showDateRangeBar !== false} onChange={v => set("showDateRangeBar", v)} />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding:"14px 20px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexShrink:0, background:T.surface2 }}>
          <button onClick={handleReset} style={{
            flex:0, padding:"8px 14px", borderRadius:7, border:`1px solid ${T.border}`,
            background:"none", color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"'Geist',sans-serif",
          }}>Reset</button>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{
            padding:"8px 14px", borderRadius:7, border:`1px solid ${T.border}`,
            background:"none", color:T.text, fontSize:12, cursor:"pointer", fontFamily:"'Geist',sans-serif",
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            padding:"8px 18px", borderRadius:7, border:"none",
            background:T.blue, color:"#fff", fontSize:12, fontWeight:700,
            cursor:"pointer", fontFamily:"'Geist',sans-serif",
          }}>Save changes</button>
        </div>
      </div>
    </>
  );
}

// ── Default settings exported for App.jsx to use ─────────────────────────────
export const DEFAULT_SETTINGS = {
  // Branding
  title:           "CreditCheck",
  subtitle:        "Lead Intelligence",
  showOfficialLogo: true,
  // Accent colors (light theme only — dark theme uses its own tokens)
  accentBlue:  "#005EFF",
  accentNavy:  "#0A1264",
  accentGreen: "#059669",
  accentAmber: "#D97706",
  accentRed:   "#DC2626",
  // KPI cards
  kpiTotal:      true,
  kpiBC:         true,
  kpiFS:         true,
  kpiIncomplete: true,
  kpiAvgScore:   true,
  // Tab visibility
  tabLeads:     true,
  tabAnalytics: true,
  tabVerticals: true,
  tabCountries: true,
  tabScoring:   true,
  tabInsights:  true,
  tabQuality:   true,
  tabRevenue:   true,
  tabPartners:  true,
  // Table defaults
  defaultCat:        "Form Submitted",
  defaultSort:       "created",
  showDateRangeBar:  true,
};
