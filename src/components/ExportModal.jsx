import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { VERTICALS_DEF, applyVehicleFilter as filterByVehicle, COUNTRY_META } from '../constants/verticals.js';

export default function ExportModal({ onClose, data }) {
  const { T } = useTheme();

  const bc   = data["Bank Connected"]  || [];
  const fs   = data["Form Submitted"]  || [];
  const inc  = data["Incomplete"]      || [];
  const all  = [...bc, ...fs, ...inc];

  // ── Filter state ──────────────────────────────────────────────────────────
  const [cats,      setCats]    = useState({ bc:true, fs:true, inc:false });
  const [verticals, setVerts]   = useState({ all:true, personal_loans:false, reform:false, mortgage:false, vehicle_unsecured:false, vehicle_secured:false });
  const [countries, setCountries] = useState({});  // {} = all selected
  const [fields,    setFields]  = useState({ name:true, email:true, country:false, language:false, loanAmount:true, loanMonths:true, purpose:true, income:true, expenses:true, employment:true, age:true, category:true });
  const [fmt, setFmt]           = useState("csv"); // csv | tsv | json

  const allCountries = [...new Set(all.map(r=>r.country).filter(Boolean))].sort();

  // ── Filtering logic ───────────────────────────────────────────────────────
  const matchesVertical = (r) => {
    if (verticals.all) return true;
    return Object.entries(verticals).some(([k, v]) => {
      if (!v || k === "all") return false;
      const vDef = VERTICALS_DEF[k];
      if (!vDef) return false;
      if (!vDef.purposes.includes(r.purpose)) return false;
      if (vDef.vehicleFilter) return filterByVehicle([r], vDef.vehicleFilter).length > 0;
      return true;
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
    if (selKeys.length === 0) return true;
    return selKeys.includes(r.country || "unknown");
  };

  const filtered = useMemo(
    () => all.filter(r => matchesCat(r) && matchesVertical(r) && matchesCountry(r)),
    [cats, verticals, countries, data]
  );

  // ── Category label helper ─────────────────────────────────────────────────
  const catLabel = (r) => bc.includes(r) ? "Bank Connected" : fs.includes(r) ? "Form Submitted" : "Incomplete";

  // ── Field definitions (ordered) ──────────────────────────────────────────
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

  // ── Export logic ──────────────────────────────────────────────────────────
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

  const buildContent = () => {
    if (fmt === "html") return buildHtmlExport();
    if (fmt === "json") {
      const json = filtered.map(r => Object.fromEntries(activeFields.map(f=>[f.label, getVal(r,f.key)])));
      return JSON.stringify(json, null, 2);
    } else {
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

  // ── HTML export builder ───────────────────────────────────────────────────
  const buildHtmlExport = () => {
    const esc = (s) => String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const dateStr = new Date().toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric"});
    const timeStr = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    const catLabels = [cats.bc&&"Bank Connected",cats.fs&&"Form Submitted",cats.inc&&"Incomplete"].filter(Boolean).join(", ");

    // Official CreditChecker logo (extracted from CreditCheckerLogo.jsx SVG paths, white fill for dark header)
    const logoSvg = `<svg width="154" height="38" viewBox="0 0 193 48.3344" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#ccl)"><path d="M140.071 17.9883V20.1167H137.573V17.8523C137.573 15.7239 136.729 14.4441 134.807 14.4441C132.884 14.4441 132.041 15.7286 132.041 17.8523V30.3414C132.041 32.4698 132.917 33.7497 134.807 33.7497C136.696 33.7497 137.573 32.4651 137.573 30.3414V27.2707H140.071V30.2055C140.071 33.7825 138.384 36.1453 134.736 36.1453C131.089 36.1453 129.434 33.7825 129.434 30.2055V17.9836C129.434 14.4066 131.122 12.0437 134.736 12.0437C138.351 12.0437 140.071 14.4066 140.071 17.9836V17.9883Z" fill="white"/><path d="M145.102 25.283V35.9156H142.467V12.2828H145.102V22.9155H150.91V12.2828H153.545V35.9109H150.91V25.2783H145.102V25.283Z" fill="white"/><path d="M164.646 22.7514V25.1142H158.875V33.52H165.964V35.9156H156.241V12.2828H165.964V14.6785H158.875V22.7467H164.646V22.7514Z" fill="white"/><path d="M178.823 17.9883V20.1167H176.324V17.8523C176.324 15.7239 175.481 14.4441 173.558 14.4441C171.636 14.4441 170.792 15.7286 170.792 17.8523V30.3414C170.792 32.4698 171.669 33.7497 173.558 33.7497C175.448 33.7497 176.324 32.4651 176.324 30.3414V27.2707H178.823V30.2055C178.823 33.7825 177.135 36.1453 173.488 36.1453C169.841 36.1453 168.186 33.7825 168.186 30.2055V17.9836C168.186 14.4066 169.874 12.0438 173.488 12.0438C177.103 12.0438 178.823 14.4066 178.823 17.9836V17.9883Z" fill="white"/><path d="M185.236 25.6533L183.854 27.9833V35.9156H181.219V12.2828H183.854V23.6937L190.131 12.2828H192.798L186.821 23.0514L193 35.9109H190.3L185.236 25.6486V25.6533Z" fill="white"/><path d="M66.9884 27.0691V30.2102C66.9884 33.9888 65.0991 36.15 61.4517 36.15C57.8044 36.15 55.9151 33.9888 55.9151 30.2102V17.9226C55.9151 14.1393 57.8044 11.9828 61.4517 11.9828C65.0991 11.9828 66.9884 14.144 66.9884 17.9226V20.2198H63.477V17.6882C63.477 16.0005 62.7363 15.3582 61.5549 15.3582C60.3734 15.3582 59.6327 16.0005 59.6327 17.6882V30.4493C59.6327 32.137 60.3734 32.7464 61.5549 32.7464C62.7363 32.7464 63.477 32.137 63.477 30.4493V27.0738H66.9884V27.0691Z" fill="white"/><path d="M77.0162 35.8828C76.8146 35.2733 76.6787 34.903 76.6787 32.9808V29.2679C76.6787 27.0738 75.938 26.2628 74.2502 26.2628H72.9657V35.8828H69.2527V12.25H74.855C78.7039 12.25 80.3589 14.0409 80.3589 17.6835V19.54C80.3589 21.9685 79.5806 23.5577 77.9304 24.3313C79.7869 25.1095 80.3964 26.8957 80.3964 29.3616V33.009C80.3964 34.1575 80.4292 35.0014 80.7995 35.8781H77.0209L77.0162 35.8828ZM72.961 15.6255V22.8826H74.4143C75.7973 22.8826 76.6412 22.2732 76.6412 20.3839V18.0539C76.6412 16.3662 76.0692 15.6255 74.7519 15.6255H72.961Z" fill="white"/><path d="M86.5331 22.2076H91.6291V25.583H86.5331V32.5026H92.9464V35.8781H82.8201V12.25H92.9464V15.6255H86.5331V22.2076Z" fill="white"/><path d="M95.2389 12.25H101.113C104.826 12.25 106.65 14.3081 106.65 18.0914V30.0414C106.65 33.82 104.826 35.8828 101.113 35.8828H95.2389V12.25ZM98.9519 15.6255V32.5026H101.043C102.224 32.5026 102.932 31.8932 102.932 30.2055V17.9179C102.932 16.2302 102.224 15.6208 101.043 15.6208H98.9519V15.6255Z" fill="white"/><path d="M109.013 12.25H112.726V35.8781H109.013V12.25Z" fill="white"/><path d="M114.348 12.25H125.824V15.6255H121.942V35.8781H118.229V15.6255H114.348V12.25Z" fill="white"/><path d="M43.8338 24.4204V14.6363L21.9028 27.0223L10.6139 20.5058V30.3789L21.9028 36.8954L43.8338 24.4204Z" fill="white"/><path d="M8.26045 31.7994V16.535L20.7402 9.48873V0L0 11.7109V36.6235L20.7402 48.3344V38.8457L8.26045 31.7994Z" fill="white"/><path d="M35.5734 16.535L43.8338 11.7109L23.0936 0V9.48873L35.5734 16.535Z" fill="white"/><path d="M35.5734 31.7994L23.0936 38.8457V48.3344L43.8338 36.6235L35.5734 31.7994Z" fill="white"/></g><defs><clipPath id="ccl"><rect width="193" height="48.3344" fill="white"/></clipPath></defs></svg>`;

    const headers = activeFields.map(f=>`<th>${esc(f.label)}</th>`).join("");
    const rows = filtered.map((r,i)=>
      `<tr class="${i%2===0?"r-even":"r-odd"}">${activeFields.map(f=>`<td>${esc(String(getVal(r,f.key)||""))}</td>`).join("")}</tr>`
    ).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CreditCheck — Lead Export ${esc(dateStr)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','IBM Plex Sans',sans-serif;background:#F5F6FA;color:#0A1628;font-size:13px;line-height:1.5}
.container{max-width:1200px;margin:0 auto;padding:32px 24px}
header{background:linear-gradient(135deg,#005EFF 0%,#0A1264 100%);border-radius:12px;padding:22px 32px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.hdr-right{text-align:right}
.hdr-label{font-size:9px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:4px}
.hdr-date{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px}
.hdr-sub{font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px;font-family:'IBM Plex Mono',monospace}
.chips{display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap}
.chip{background:#fff;border:1px solid #E2E7F0;border-radius:10px;padding:12px 18px;flex:1;min-width:150px;box-shadow:0 1px 3px rgba(10,22,40,0.05)}
.chip-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.1px;color:#7080A0;margin-bottom:5px}
.chip-val{font-size:22px;font-weight:800;color:#0A1628;letter-spacing:-0.5px;font-variant-numeric:tabular-nums}
.chip-sub{font-size:10px;color:#7080A0;margin-top:2px;font-family:'IBM Plex Mono',monospace}
.chip-val.sm{font-size:13px;font-weight:600;padding-top:4px;letter-spacing:0}
.tbl-wrap{background:#fff;border-radius:12px;border:1px solid #E2E7F0;overflow:hidden;box-shadow:0 2px 8px rgba(10,22,40,0.07)}
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{background:linear-gradient(90deg,#005EFF,#0A1264)}
th{padding:11px 14px;text-align:left;color:#fff;font-weight:600;font-size:9.5px;letter-spacing:0.9px;text-transform:uppercase;white-space:nowrap}
td{padding:9px 14px;border-bottom:1px solid #EEF1F8;font-size:12px;color:#0A1628}
.r-even td{background:#ffffff}
.r-odd td{background:#F8F9FC}
tr:last-child td{border-bottom:none}
.footer{margin-top:20px;padding:14px 0;border-top:1px solid #E2E7F0;display:flex;justify-content:space-between;align-items:center;color:#7080A0;font-size:10px;font-family:'IBM Plex Mono',monospace;flex-wrap:wrap;gap:8px}
.footer-brand{color:#005EFF;font-weight:600}
@media print{
  body{background:#fff}
  .container{padding:12px}
  header{border-radius:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:linear-gradient(135deg,#005EFF,#0A1264)!important}
  thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:linear-gradient(90deg,#005EFF,#0A1264)!important}
  .r-odd td{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#F8F9FC!important}
  .tbl-wrap{box-shadow:none;border-radius:4px}
  .chip{break-inside:avoid}
  thead{display:table-header-group}
}
@media(max-width:600px){
  header{flex-direction:column;gap:14px}
  .hdr-right{text-align:left}
  th,td{padding:7px 10px;font-size:11px}
}
</style></head>
<body><div class="container">
  <header>
    <div>${logoSvg}</div>
    <div class="hdr-right">
      <div class="hdr-label">Lead Export</div>
      <div class="hdr-date">${esc(dateStr)}</div>
      <div class="hdr-sub">${esc(timeStr)} · creditchecker.io</div>
    </div>
  </header>
  <div class="chips">
    <div class="chip"><div class="chip-label">Total Leads</div><div class="chip-val">${filtered.length}</div><div class="chip-sub">exported rows</div></div>
    <div class="chip"><div class="chip-label">Fields</div><div class="chip-val">${activeFields.length}</div><div class="chip-sub">columns included</div></div>
    <div class="chip"><div class="chip-label">Categories</div><div class="chip-val sm">${esc(catLabels||"All categories")}</div><div class="chip-sub">filter applied</div></div>
    <div class="chip"><div class="chip-label">Generated</div><div class="chip-val sm">${esc(dateStr)}</div><div class="chip-sub">${esc(timeStr)}</div></div>
  </div>
  <div class="tbl-wrap"><table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows||`<tr><td colspan="${activeFields.length}" style="text-align:center;padding:32px;color:#7080A0">No leads match current filters</td></tr>`}</tbody>
  </table></div>
  <div class="footer">
    <span><span class="footer-brand">CreditCheck</span> by Clovr Labs — creditchecker.io</span>
    <span>Confidential · Internal use only · ${esc(dateStr)}</span>
  </div>
</div></body></html>`;
  };

  const [showCopy, setShowCopy]       = useState(false);
  const [copied, setCopied]           = useState(false);
  const [exportContent, setExportContent] = useState("");

  const handleExport = () => {
    const content = buildContent();
    setExportContent(content);
    setShowCopy(true);
    setCopied(false);
  };

  const downloadFile = (content, fmtOverride) => {
    try {
      const f    = fmtOverride || fmt;
      const ext  = f === "json" ? "json" : f === "tsv" ? "tsv" : f === "html" ? "html" : "csv";
      const mime = f === "json" ? "application/json" : f === "html" ? "text/html;charset=utf-8" : "text/plain";
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const date = new Date().toISOString().slice(0,10);
      a.download = `creditcheck-leads-${date}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert("Could not download: " + e.message);
    }
  };

  const downloadFallback = (content) => {
    downloadFile(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectDownload = () => {
    downloadFile(buildContent());
  };

  const handleCopy = () => {
    const content = exportContent;
    if (!content) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
        .catch(() => downloadFallback(content));
      return;
    }
    downloadFallback(content);
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const Toggle = ({ checked, onChange, label, accent=T.blue }) => (
    <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", userSelect:"none" }}>
      <div onClick={onChange} style={{
        width:32, height:18, borderRadius:9, background:checked?accent:T.borderHi,
        position:"relative", transition:"background .15s", cursor:"pointer", flexShrink:0,
      }}>
        <div style={{
          width:14, height:14, borderRadius:"50%", background:"#fff",
          position:"absolute", top:2, left:checked?15:2, transition:"left .15s",
          boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
        }}/>
      </div>
      <span style={{ fontSize:12, color:T.text, fontWeight:500 }}>{label}</span>
    </label>
  );

  const Checkbox = ({ checked, onChange, label, color=T.blue }) => (
    <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", userSelect:"none", padding:"5px 0" }}>
      <div onClick={onChange} style={{
        width:16, height:16, borderRadius:4, border:`2px solid ${checked?color:T.border}`,
        background:checked?color:"transparent", display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .12s", cursor:"pointer", flexShrink:0,
      }}>
        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize:12, color:T.textSub, fontWeight:500 }}>{label}</span>
    </label>
  );

  const SectionHdr = ({ children }) => (
    <div style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:10, marginTop:18, paddingBottom:5, borderBottom:`1px solid ${T.border}` }}>{children}</div>
  );


  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,0.85)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(8px)",
    }} onClick={onClose}>
      <div style={{
        background:T.surface,
        width:780, maxHeight:"90vh",
        borderRadius:16,
        boxShadow:"0 40px 100px rgba(10,22,40,0.4)",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        border:`1px solid ${T.border}`,
        position:"relative",
      }} onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ background:T.navy, padding:"0 20px", height:50, display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          <div style={{ width:28, height:28, background:`linear-gradient(135deg,${T.blue},${T.navy})`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6.5 9.5L8 11L11.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:900, color:"#fff", letterSpacing:-0.2 }}>
              <span>CREDIT</span><span style={{ color:T.blue3 }}>CHECK</span>
              <span style={{ color:T.muted, fontWeight:400, marginLeft:6, marginRight:6 }}>·</span>
              <span style={{ color:T.textSub, fontWeight:600, fontSize:12 }}>Export Leads</span>
            </div>
            <div style={{ fontSize:9, color:T.muted, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase" }}>
              filter · select fields · download
            </div>
          </div>
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ width:28, height:28, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:T.muted, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontFamily:"'Geist',sans-serif" }}>✕</button>
        </div>

        {/* ── Body: 2 columns ── */}
        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", flex:1, overflow:"hidden" }}>

          {/* LEFT — Filters */}
          <div style={{ borderRight:`1px solid ${T.border}`, overflowY:"auto", padding:"16px 20px" }}>

            <SectionHdr>Category</SectionHdr>
            <Checkbox checked={cats.bc}  onChange={()=>setCats(p=>({...p,bc:!p.bc}))}   label="🟦 Bank Connected"  color={T.blue}/>
            <Checkbox checked={cats.fs}  onChange={()=>setCats(p=>({...p,fs:!p.fs}))}   label="🟨 Form Submitted"  color="#F59E0B"/>
            <Checkbox checked={cats.inc} onChange={()=>setCats(p=>({...p,inc:!p.inc}))} label="⬜ Incomplete"       color={T.muted}/>

            <SectionHdr>Vertical</SectionHdr>
            <Checkbox
              checked={verticals.all}
              onChange={()=>setVerts(p=>({...p,all:!p.all}))}
              label="All verticals"
              color={T.navy}
            />
            {Object.entries(VERTICALS_DEF).map(([k, vDef])=>(
              <Checkbox
                key={k}
                checked={!verticals.all && verticals[k]}
                onChange={()=>setVerts(p=>({...p, all:false, [k]:!p[k]}))}
                label={`${vDef.icon} ${vDef.label}`}
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
                  label={COUNTRY_META[code] ? `${COUNTRY_META[code].flag} ${COUNTRY_META[code].label}` : code.toUpperCase()}
                  color={T.blue}
                />
              ))}
            </>}

            <SectionHdr>Format</SectionHdr>
            {[["csv","CSV (.csv)"],["tsv","Excel-ready (.tsv)"],["json","JSON (.json)"],["html","HTML Report (.html)"]].map(([val,lbl])=>(
              <label key={val} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", padding:"5px 0" }}>
                <div onClick={()=>setFmt(val)} style={{
                  width:16, height:16, borderRadius:"50%", border:`2px solid ${fmt===val?T.blue:T.border}`,
                  background:"transparent", display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", flexShrink:0, transition:"border-color .12s",
                }}>
                  {fmt===val && <div style={{ width:7, height:7, borderRadius:"50%", background:T.blue }}/>}
                </div>
                <span style={{ fontSize:12, color:T.textSub }}>{lbl}</span>
              </label>
            ))}
          </div>

          {/* RIGHT — Field selector + preview */}
          <div style={{ overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:0 }}>

            <SectionHdr>Fields to include</SectionHdr>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, marginBottom:18 }}>
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
            <div style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:8, paddingBottom:5, borderBottom:`1px solid ${T.border}` }}>
              Preview — first 6 rows of {filtered.length} leads
            </div>
            <div style={{ overflowX:"auto", borderRadius:8, border:`1px solid ${T.border}`, background:T.surface2 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10.5 }}>
                <thead>
                  <tr style={{ background:T.surface2 }}>
                    {activeFields.map(f=>(
                      <th key={f.key} style={{ padding:"7px 10px", textAlign:"left", color:"rgba(255,255,255,0.7)", fontWeight:700, fontSize:9, letterSpacing:0.8, textTransform:"uppercase", whiteSpace:"nowrap" }}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0,6).map((r,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:T.surface }}>
                      {activeFields.map(f=>(
                        <td key={f.key} style={{ padding:"6px 10px", color:T.textSub, whiteSpace:"nowrap", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>
                          {String(getVal(r,f.key)).slice(0,30)||<span style={{ color:T.border }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={activeFields.length} style={{ padding:20, textAlign:"center", color:T.muted, fontSize:11 }}>No leads match current filters</td></tr>
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
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexShrink:0,
        }}>
          <div style={{ fontSize:11, color:T.muted }}>
            <span style={{ fontWeight:700, color:T.text, fontSize:13 }}>{filtered.length}</span>
            <span> leads · </span>
            <span style={{ fontWeight:600, color:T.blue }}>{activeFields.length} fields</span>
            <span> · {fmt === "html" ? "HTML" : fmt.toUpperCase()}</span>
            {fmt === "html" && <span style={{ marginLeft:6, fontSize:10, color:T.green, fontWeight:600 }}>print-ready</span>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.muted, fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"'Geist',sans-serif" }}>Cancel</button>
            <button onClick={handleDirectDownload} disabled={filtered.length===0||activeFields.length===0} title={`Download ${fmt.toUpperCase()} file directly`} style={{
              padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.surface2,
              color:filtered.length>0&&activeFields.length>0?T.textSub:T.muted,
              fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"'IBM Plex Sans','Geist',sans-serif",
              display:"flex", alignItems:"center", gap:6,
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 1v7M3 5.5l3 3 3-3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ↓ .{fmt}
            </button>
            <button onClick={handleExport} disabled={filtered.length===0||activeFields.length===0} style={{
              padding:"8px 22px", borderRadius:8, border:"none",
              background:filtered.length>0&&activeFields.length>0?T.blue:T.border,
              color:filtered.length>0&&activeFields.length>0?"#fff":T.muted,
              fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"'IBM Plex Sans','Geist',sans-serif",
              display:"flex", alignItems:"center", gap:6, transition:"all .15s",
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><rect x="1" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3V2a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Copy &amp; Preview
            </button>
          </div>
        </div>

        {/* ── Copy overlay ── */}
        {showCopy && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.92)", borderRadius:16, zIndex:10, display:"flex", flexDirection:"column", padding:24, gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#fff", marginBottom:3 }}>
                  {fmt.toUpperCase()} ready — {filtered.length} leads · {activeFields.length} fields
                </div>
                <div style={{ fontSize:11, color:T.muted }}>
                  Copy the content and paste it in Excel, Google Sheets or your editor
                </div>
              </div>
              <button onClick={()=>setShowCopy(false)} style={{ width:32, height:32, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"rgba(255,255,255,0.5)", fontSize:16, cursor:"pointer", fontFamily:"'Geist',sans-serif", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            <textarea
              id="export-textarea"
              readOnly
              value={exportContent}
              style={{
                flex:1, minHeight:320,
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

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", alignSelf:"center", flex:1 }}>
                💡 Click the text to select all, then Ctrl+C / Cmd+C
              </div>
              <button onClick={()=>setShowCopy(false)} style={{ padding:"9px 18px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", color:"rgba(255,255,255,0.5)", fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"'Geist',sans-serif" }}>
                Close
              </button>
              <button onClick={handleCopy} style={{
                padding:"9px 22px", borderRadius:8, border:"none",
                background:copied?T.green:T.blue,
                color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"'IBM Plex Sans','Geist',sans-serif",
                display:"flex", alignItems:"center", gap:7, transition:"background .2s",
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
