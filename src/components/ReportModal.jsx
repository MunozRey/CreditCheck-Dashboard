import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { getReportDefs, getCategoryMeta, makeReport, downloadHTML } from '../utils/reportEngine.js';
import { VERTICALS_DEF } from '../constants/verticals.js';

const CATEGORIES = [
  { id: "partner",  label: "Partner Reports",  sub: "Send to external partners" },
  { id: "external", label: "Generic Overview", sub: "Safe for any new partner" },
  { id: "vertical", label: "Vertical Batches", sub: "Segmented by loan type" },
  { id: "premium",  label: "Premium Segments", sub: "High-value lead packs" },
  { id: "internal", label: "Internal Reports", sub: "Ops, risk & board only" },
];

export default function ReportModal({ data, onClose }) {
  const { T } = useTheme();
  const [cat, setCat]         = useState("partner");
  const [generating, setGen]  = useState(null);

  const reports = useMemo(() => getReportDefs(T), [T]);
  const catMeta = useMemo(() => getCategoryMeta(T), [T]);
  const filtered = reports.filter(r => r.category === cat);

  const total = (data["Bank Connected"]  || []).length
              + (data["Form Submitted"]  || []).length
              + (data["Incomplete"]      || []).length;

  const generate = (report, preview = false) => {
    setGen(report.id + (preview ? "_prev" : ""));
    setTimeout(() => {
      const html = makeReport(report, data);
      if (preview) {
        const win = window.open("", "_blank");
        if (win) { win.document.write(html); win.document.close(); }
      } else {
        downloadHTML(html, `creditcheck-${report.id}-${new Date().toISOString().slice(0,10)}.html`);
      }
      setGen(null);
    }, 30);
  };

  const noData = total === 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: T.surface, borderRadius: 16, width: "100%", maxWidth: 900,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)", border: `1px solid ${T.border}`,
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: T.surface, flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "'Geist',sans-serif", letterSpacing: -0.3 }}>
              Generate Partner Report
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {noData
                ? "Upload an XLSX file to generate reports"
                : `${total.toLocaleString()} leads loaded · official HTML document · print-to-PDF ready`}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
            background: T.surface2, color: T.muted, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* Sidebar */}
          <div style={{
            width: 180, borderRight: `1px solid ${T.border}`, padding: "12px 8px",
            background: T.surface2, flexShrink: 0, overflowY: "auto",
          }}>
            {CATEGORIES.map(c => {
              const active = cat === c.id;
              const count  = reports.filter(r => r.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  width: "100%", textAlign: "left", padding: "9px 12px",
                  borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2,
                  background: active ? T.surface : "transparent",
                  boxShadow: active ? `0 1px 4px ${T.border}` : "none",
                  transition: "all .15s",
                }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? T.text : T.textSub, fontFamily: "'Geist',sans-serif" }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {count} report{count !== 1 ? "s" : ""} · {c.sub}
                  </div>
                </button>
              );
            })}

          </div>

          {/* Report cards */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {noData && (
              <div style={{
                background: T.surface2, border: `1px dashed ${T.border}`, borderRadius: 12,
                padding: "40px 24px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, color: T.muted }}>
                  Upload an XLSX file first to generate reports with real lead data.
                </div>
              </div>
            )}

            {!noData && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {filtered.map(report => {
                  const meta      = catMeta[report.category] || {};
                  const isGen     = generating === report.id;
                  const isPrev    = generating === report.id + "_prev";
                  const reportBC  = report.vertical
                    ? (data["Bank Connected"] || []).filter(r => isInVertical(r, report)).length
                    : (data["Bank Connected"] || []).length;
                  const reportAll = report.vertical
                    ? [...(data["Bank Connected"]||[]),...(data["Form Submitted"]||[]),...(data["Incomplete"]||[])].filter(r => isInVertical(r, report)).length
                    : total;

                  return (
                    <div key={report.id} style={{
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 12, padding: "16px 18px",
                      borderLeft: `3px solid ${report.accentColor}`,
                      display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'Geist',sans-serif", lineHeight: 1.3 }}>
                            {report.label}
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                            flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.5,
                          }}>
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
                          {report.audience}
                        </div>
                        <div style={{ fontSize: 11, color: T.textSub, marginTop: 6, lineHeight: 1.6 }}>
                          {report.desc}
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(report.tags || []).map(tag => (
                          <span key={tag} style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            background: T.surface3, color: T.textSub, border: `1px solid ${T.border}`,
                            fontFamily: "'IBM Plex Mono',monospace",
                          }}>{tag}</span>
                        ))}
                      </div>

                      {/* Lead count for this report */}
                      <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
                        {reportAll} leads · {reportBC} BC
                        {reportAll === 0 && <span style={{ color: T.amber }}> · no matching leads</span>}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                        <button
                          disabled={isGen || reportAll === 0}
                          onClick={() => generate(report, false)}
                          style={{
                            flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                            background: reportAll === 0 ? T.surface3 : report.accentColor,
                            color: reportAll === 0 ? T.muted : "#fff",
                            fontWeight: 700, fontSize: 11, cursor: reportAll === 0 ? "default" : "pointer",
                            fontFamily: "'Geist',sans-serif", opacity: isGen ? 0.7 : 1,
                          }}
                        >
                          {isGen ? "Generating…" : "Download HTML"}
                        </button>
                        <button
                          disabled={isPrev || reportAll === 0}
                          onClick={() => generate(report, true)}
                          style={{
                            padding: "8px 12px", borderRadius: 7,
                            border: `1px solid ${T.border}`,
                            background: T.surface2, color: T.textSub,
                            fontWeight: 600, fontSize: 11, cursor: reportAll === 0 ? "default" : "pointer",
                            fontFamily: "'Geist',sans-serif", opacity: isPrev ? 0.7 : 1,
                          }}
                        >
                          {isPrev ? "…" : "Preview"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: check if a lead belongs to a report's vertical filter
function isInVertical(lead, report) {
  if (!report.vertical) return true;
  const vDef = VERTICALS_DEF[report.vertical];
  if (!vDef) return true;
  if (!vDef.purposes.includes(lead.purpose)) return false;
  if (vDef.vehicleFilter === "unsecured") return (lead.loanAmount||0) <= 15000 && (lead.loanMonths||0) <= 60;
  if (vDef.vehicleFilter === "secured")   return (lead.loanAmount||0) > 15000  || (lead.loanMonths||0) > 60;
  return true;
}

