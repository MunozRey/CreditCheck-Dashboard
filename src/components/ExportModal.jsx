import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { VERTICALS_DEF, applyVehicleFilter as filterByVehicle, COUNTRY_META } from '../constants/verticals.js';
import { auditLog } from '../utils/auditLog.js'; // M-04: audit trail for exports
import { scoreLead } from '../utils/scoring.js';

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
  const [fields,    setFields]  = useState({ name:true, email:true, country:true, language:false, loanAmount:true, loanMonths:false, purpose:true, income:true, expenses:false, employment:true, age:false, category:true });
  const [fmt, setFmt]           = useState("csv"); // csv | tsv | json | pipedrive

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

  // ── Pipedrive CSV builder ─────────────────────────────────────────────────
  const buildPipedriveContent = () => {
    const gradeLabel = (r) => {
      const s = scoreLead(r);
      return s >= 75 ? "A" : s >= 50 ? "B" : s >= 30 ? "C" : "D";
    };
    const quoteCSV = (v) => {
      const s = String(v == null ? "" : v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = "Name,Email,Lead Title,Created";
    const rows = filtered.map(r => {
      const grade = gradeLabel(r);
      const title = `CreditCheck - Grade ${grade}`;
      const created = (r.created || "").slice(0, 10);
      return [quoteCSV(r.name || ""), quoteCSV(r.email || ""), quoteCSV(title), quoteCSV(created)].join(",");
    });
    return [header, ...rows].join("\n");
  };

  const buildContent = () => {
    if (fmt === "pipedrive") return buildPipedriveContent();
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

  const [showCopy, setShowCopy]       = useState(false);
  const [copied, setCopied]           = useState(false);
  const [exportContent, setExportContent] = useState("");

  const handleExport = () => {
    const content = buildContent();
    setExportContent(content);
    setShowCopy(true);
    setCopied(false);
    // M-04: Audit log — record what was exported (no PII in metadata)
    auditLog('lead_export', {
      format: fmt,
      rowCount: filtered.length,
      fields: activeFields.map(f => f.key), // field names only, not values
      hasBC:  cats.bc,
      hasFS:  cats.fs,
      hasInc: cats.inc,
    });
  };

  const downloadFile = (content, fmtOverride) => {
    try {
      const f    = fmtOverride || fmt;
      const ext  = f === "json" ? "json" : f === "tsv" ? "tsv" : "csv";
      const mime = f === "json" ? "application/json" : "text/plain";
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = f === "pipedrive" ? `pipedrive_import_${today}.csv` : `creditcheck-leads.${ext}`;
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
            {[["csv","CSV (.csv)"],["tsv","Excel-ready (.tsv)"],["json","JSON (.json)"],["pipedrive","Pipedrive CSV"]].map(([val,lbl])=>(
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

            {fmt === "pipedrive" ? (
              <>
                <SectionHdr>Pipedrive Format</SectionHdr>
                <div style={{ padding:"10px 14px", borderRadius:8, background:`${T.blue}08`, border:`1px solid ${T.blue}20`, marginBottom:18 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.blue, marginBottom:6 }}>Fixed columns — Pipedrive Lead Import</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                    {[["Name","Lead's full name"],["Email","Lead's email address"],["Lead Title","CreditCheck - Grade A/B/C/D"],["Created","Date in YYYY-MM-DD"]].map(([col,desc])=>(
                      <div key={col} style={{ fontSize:10, color:T.textSub }}>
                        <span style={{ fontWeight:700, color:T.text }}>{col}</span>
                        <span style={{ color:T.muted }}> — {desc}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:8, fontSize:10, color:T.muted }}>
                    File will be saved as <span style={{ fontFamily:"'IBM Plex Mono',monospace", color:T.text }}>pipedrive_import_{new Date().toISOString().slice(0,10)}.csv</span>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

            {/* Preview table */}
            <div style={{ fontSize:10, fontWeight:800, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:8, paddingBottom:5, borderBottom:`1px solid ${T.border}` }}>
              Preview — first 6 rows of {filtered.length} leads
            </div>
            <div style={{ overflowX:"auto", borderRadius:8, border:`1px solid ${T.border}`, background:T.surface2 }}>
              {fmt === "pipedrive" ? (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10.5 }}>
                  <thead>
                    <tr style={{ background:T.surface2 }}>
                      {["Name","Email","Lead Title","Created"].map(h=>(
                        <th key={h} style={{ padding:"7px 10px", textAlign:"left", color:T.muted, fontWeight:700, fontSize:9, letterSpacing:0.8, textTransform:"uppercase", whiteSpace:"nowrap", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0,6).map((r,i)=>{
                      const s = scoreLead(r);
                      const g = s>=75?"A":s>=50?"B":s>=30?"C":"D";
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:T.surface }}>
                          <td style={{ padding:"6px 10px", color:T.textSub, whiteSpace:"nowrap", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis" }}>{r.name||"—"}</td>
                          <td style={{ padding:"6px 10px", color:T.textSub, whiteSpace:"nowrap", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", fontFamily:"'IBM Plex Mono',monospace", fontSize:10 }}>{r.email||"—"}</td>
                          <td style={{ padding:"6px 10px", color:T.blue, whiteSpace:"nowrap", fontWeight:600 }}>CreditCheck - Grade {g}</td>
                          <td style={{ padding:"6px 10px", color:T.muted, whiteSpace:"nowrap", fontFamily:"'IBM Plex Mono',monospace", fontSize:10 }}>{(r.created||"").slice(0,10)||"—"}</td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} style={{ padding:20, textAlign:"center", color:T.muted, fontSize:11 }}>No leads match current filters</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
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
              )}
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
            {fmt === "pipedrive"
              ? <span style={{ fontWeight:600, color:T.blue }}>Name · Email · Lead Title · Created</span>
              : <span style={{ fontWeight:600, color:T.blue }}>{activeFields.length} fields</span>
            }
            <span> · {fmt === "pipedrive" ? "Pipedrive CSV" : fmt.toUpperCase()}</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.muted, fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"'Geist',sans-serif" }}>Cancel</button>
            <button onClick={handleDirectDownload} disabled={filtered.length===0||(fmt!=="pipedrive"&&activeFields.length===0)} title={`Download ${fmt === "pipedrive" ? "Pipedrive CSV" : fmt.toUpperCase()} file directly`} style={{
              padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.surface2,
              color:filtered.length>0&&(fmt==="pipedrive"||activeFields.length>0)?T.textSub:T.muted,
              fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"'IBM Plex Sans','Geist',sans-serif",
              display:"flex", alignItems:"center", gap:6,
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 1v7M3 5.5l3 3 3-3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {fmt === "pipedrive" ? "↓ pipedrive.csv" : `↓ .${fmt}`}
            </button>
            <button onClick={handleExport} disabled={filtered.length===0||(fmt!=="pipedrive"&&activeFields.length===0)} style={{
              padding:"8px 22px", borderRadius:8, border:"none",
              background:filtered.length>0&&(fmt==="pipedrive"||activeFields.length>0)?T.blue:T.border,
              color:filtered.length>0&&(fmt==="pipedrive"||activeFields.length>0)?"#fff":T.muted,
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
                  {fmt === "pipedrive" ? "Pipedrive CSV" : fmt.toUpperCase()} ready — {filtered.length} leads · {fmt === "pipedrive" ? "4 fields" : `${activeFields.length} fields`}
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
