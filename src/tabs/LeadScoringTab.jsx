import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { scoreLead, EMP_OPTIONS } from '../utils/scoring.js';
import { VERTICALS_DEF } from '../constants/verticals.js';
import Card from '../components/Card.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import CustomTooltip from '../components/CustomTooltip.jsx';

const PAGE_SIZE = 50;

export default function LeadScoringTab({ data }) {
  const { T } = useTheme();

  // Local grade color helper using context T (avoids global T dependency)
  const gradeColor = (s) => s >= 75 ? T.green : s >= 50 ? T.blue : s >= 30 ? T.amber : T.red;

  const [sortBy,    setSortBy]    = useState("score");
  const [vertical,  setVertical]  = useState("all");
  const [empFilter, setEmpFilter] = useState("all");
  const [minScore,  setMinScore]  = useState(0);
  const [showBC,    setShowBC]    = useState(true);
  const [showFS,    setShowFS]    = useState(false);
  const [page,      setPage]      = useState(0);

  const bcArr      = data["Bank Connected"] || [];
  const fsArr      = data["Form Submitted"] || [];
  const isEnriched = [...bcArr, ...fsArr].some(r => r.income != null);

  const allLeads = useMemo(() => [
    ...(showBC ? bcArr : []),
    ...(showFS ? fsArr : []),
  ].map(r => ({
    ...r,
    _cat:   bcArr.includes(r) ? "BC" : "FS",
    _score: scoreLead(r),
  })), [showBC, showFS, bcArr, fsArr]);

  const empValues = useMemo(() => {
    const vals = new Set(allLeads.map(r => (r.employment || "").toLowerCase()).filter(Boolean));
    return EMP_OPTIONS.filter(o => o.value === "all" || vals.has(o.value));
  }, [allLeads]);

  const filtered = useMemo(() => {
    let rows = allLeads.filter(r => r._score >= minScore);
    if (vertical !== "all") {
      const purps = VERTICALS_DEF[vertical]?.purposes || [];
      const isVehicle = vertical === "vehicle_unsecured" || vertical === "vehicle_secured";
      rows = rows.filter(r => {
        if (!isVehicle) return purps.includes(r.purpose);
        const inPurp = purps.includes(r.purpose);
        const lti = r.loanAmount && r.income ? r.loanAmount / r.income : null;
        if (vertical === "vehicle_unsecured") return inPurp && (lti === null || lti <= 15);
        return inPurp && lti !== null && lti > 15;
      });
    }
    if (empFilter !== "all") {
      rows = rows.filter(r => (r.employment || "").toLowerCase() === empFilter);
    }
    if (sortBy === "score")  rows = [...rows].sort((a, b) => b._score - a._score);
    else if (sortBy === "income") rows = [...rows].sort((a, b) => (b.income || 0) - (a.income || 0));
    else if (sortBy === "loan")   rows = [...rows].sort((a, b) => (b.loanAmount || 0) - (a.loanAmount || 0));
    else if (sortBy === "dti")    rows = [...rows].sort((a, b) => {
      const da = (a.income != null && parseFloat(a.income) > 0) ? parseFloat(a.expenses) / parseFloat(a.income) : 99;
      const db = (b.income != null && parseFloat(b.income) > 0) ? parseFloat(b.expenses) / parseFloat(b.income) : 99;
      return da - db;
    });
    else if (sortBy === "name") rows = [...rows].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return rows;
  }, [allLeads, vertical, empFilter, minScore, sortBy]);

  const prevFilters = React.useRef({ vertical, empFilter, minScore, showBC, showFS });
  useEffect(() => {
    const pf = prevFilters.current;
    if (pf.vertical !== vertical || pf.empFilter !== empFilter || pf.minScore !== minScore || pf.showBC !== showBC || pf.showFS !== showFS) {
      setPage(0);
      prevFilters.current = { vertical, empFilter, minScore, showBC, showFS };
    }
  }, [vertical, empFilter, minScore, showBC, showFS]);

  const buckets   = { A: 0, B: 0, C: 0, D: 0 };
  filtered.forEach(r => { if (r._score >= 75) buckets.A++; else if (r._score >= 50) buckets.B++; else if (r._score >= 30) buckets.C++; else buckets.D++; });
  const avgScore  = filtered.length ? Math.round(filtered.reduce((s, r) => s + r._score, 0) / filtered.length) : 0;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!isEnriched) return (
    <Card style={{ padding: 48, textAlign: "center" }}>
      <div style={{ marginBottom: 12, color: T.muted, lineHeight: 0 }}><svg width="36" height="32" viewBox="0 0 32 28" fill="none"><rect x="2" y="12" width="7" height="14" rx="1" fill="currentColor" fillOpacity="0.3"/><rect x="13" y="4" width="7" height="22" rx="1" fill="currentColor" fillOpacity="0.7"/><rect x="24" y="8" width="7" height="18" rx="1" fill="currentColor" fillOpacity="0.5"/></svg></div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>Lead Scoring requires enriched data</div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Upload a CreditCheck XLSX (Rasmus format) with income, DTI and employment data</div>
    </Card>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPI header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
        {[
          { label: "Scored Leads",  val: filtered.length, sub: "after filters",   color: T.text },
          { label: "Grade A ≥75",   val: buckets.A,       sub: "Top tier",        color: T.green },
          { label: "Grade B 50–74", val: buckets.B,       sub: "Standard",        color: T.blue },
          { label: "Grade C 30–49", val: buckets.C,       sub: "Below avg",       color: T.amber },
          { label: "Grade D <30",   val: buckets.D,       sub: "Review required", color: T.red },
          { label: "Avg Score",     val: avgScore,        sub: "out of 100",      color: gradeColor(avgScore) },
        ].map(k => (
          <Card key={k.label} style={{ padding: "14px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,${k.color}70,transparent)` }} />
            <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6, fontFamily: "'IBM Plex Mono',monospace" }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", fontFamily: "'Geist',sans-serif" }}>{k.val}</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'IBM Plex Mono',monospace" }}>Filters</span>

          <select value={vertical} onChange={e => setVertical(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 11, color: T.text, background: T.surface2, fontFamily: "'Geist',sans-serif", outline: "none" }}>
            <option value="all">All Verticals</option>
            {Object.values(VERTICALS_DEF).map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>

          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 11, color: T.text, background: T.surface2, fontFamily: "'Geist',sans-serif", outline: "none" }}>
            {empValues.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 11, color: T.text, background: T.surface2, fontFamily: "'Geist',sans-serif", outline: "none" }}>
            <option value={0}>All grades</option>
            <option value={75}>A only (≥75)</option>
            <option value={50}>B+ (≥50)</option>
            <option value={30}>C+ (≥30)</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 11, color: T.text, background: T.surface2, fontFamily: "'Geist',sans-serif", outline: "none" }}>
            <option value="score">Score ↓</option>
            <option value="income">Income ↓</option>
            <option value="loan">Loan ↓</option>
            <option value="dti">DTI ↑</option>
            <option value="name">Name A→Z</option>
          </select>

          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button onClick={() => setShowBC(v => !v)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${showBC ? T.green : T.border}`, background: showBC ? T.green : T.surface2, color: showBC ? "#fff" : T.muted, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Geist',sans-serif" }}>
              ✓ BC {bcArr.length}
            </button>
            <button onClick={() => setShowFS(v => !v)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${showFS ? T.blue : T.border}`, background: showFS ? T.blue : T.surface2, color: showFS ? "#fff" : T.muted, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Geist',sans-serif" }}>
              ◷ FS {fsArr.length}
            </button>
            {(empFilter !== "all" || vertical !== "all" || minScore > 0) && (
              <button onClick={() => { setEmpFilter("all"); setVertical("all"); setMinScore(0); }} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 10, cursor: "pointer", fontFamily: "'Geist',sans-serif" }}>
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Score distribution histogram */}
      {filtered.length > 0 && (() => {
        const gradeColor = s => s >= 75 ? T.green : s >= 50 ? T.blue : s >= 30 ? T.amber : T.red;
        const bucketData = Array.from({ length: 10 }, (_, i) => {
          const lo = i * 10, hi = lo + 9;
          const count = filtered.filter(r => r._score >= lo && r._score <= (i === 9 ? 100 : hi)).length;
          const midScore = lo + 5;
          return { label: `${lo}–${i===9?100:hi}`, count, color: gradeColor(midScore) };
        });
        return (
          <Card style={{ padding: "16px 20px" }}>
            <SectionTitle>Score Distribution</SectionTitle>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={bucketData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.muted, fontFamily: "'IBM Plex Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: T.muted }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip content={<CustomTooltip formatter={v => `${v} leads`} />} />
                <Bar dataKey="count" name="Leads" radius={[3, 3, 0, 0]}>
                  {bucketData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
              {[{ label: "Grade A ≥75", color: T.green }, { label: "Grade B 50–74", color: T.blue }, { label: "Grade C 30–49", color: T.amber }, { label: "Grade D <30", color: T.red }].map(g => (
                <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
                  <span style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{g.label}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Score table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surface2 }}>
                {["#", "Name", "Score", "Cat", "Income", "Loan", "DTI", "Employment", "Vertical", "Email"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", borderBottom: `2px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => {
                const dtiVal = r.income && r.expenses && r.income > 0 ? (r.expenses / r.income * 100).toFixed(0) : null;
                const dtiColor = dtiVal
                  ? dtiVal < 30 ? T.green : dtiVal < 35 ? "#65A30D" : dtiVal < 40 ? T.amber : dtiVal < 50 ? "#F97316" : T.red
                  : T.muted;
                const purp = Object.values(VERTICALS_DEF).find(v => v.purposes.includes(r.purpose));
                return (
                  <tr key={r.email || i} style={{ borderBottom: `1px solid ${T.surface2}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "9px 12px", color: T.muted, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Mono',monospace" }}>{page * PAGE_SIZE + i + 1}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ fontWeight: 600, color: T.text }}>{r.name || "—"}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>{r.email || ""}</div>
                    </td>
                    <td style={{ padding: "9px 12px", width: 120 }}>
                      <ScoreBar score={r._score} />
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.5,
                        background: r._cat === "BC" ? T.greenBg : `${T.blue}15`,
                        color: r._cat === "BC" ? T.green : T.blue,
                        border: `1px solid ${r._cat === "BC" ? T.green + "30" : T.blue + "30"}`,
                      }}>{r._cat}</span>
                    </td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: T.navy, fontVariantNumeric: "tabular-nums" }}>
                      {r.income ? `€${r.income.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "9px 12px", fontVariantNumeric: "tabular-nums", color: T.textSub }}>
                      {r.loanAmount ? `€${r.loanAmount.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "9px 12px", fontVariantNumeric: "tabular-nums" }}>
                      {dtiVal ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontWeight: 700, color: dtiColor }}>{dtiVal}%</span>
                          <span style={{
                            fontSize: 9, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace",
                            color: dtiColor, background: `${dtiColor}18`, border: `1px solid ${dtiColor}35`,
                            borderRadius: 3, padding: "1px 4px", letterSpacing: 0.4,
                          }}>
                            {dtiVal < 30 ? "SOL" : dtiVal < 35 ? "ACE" : dtiVal < 40 ? "AJU" : dtiVal < 50 ? "ALT" : "EXC"}
                          </span>
                        </span>
                      ) : <span style={{ color: T.muted }}>—</span>}
                    </td>
                    <td style={{ padding: "9px 12px", color: T.textSub, textTransform: "capitalize", fontSize: 11 }}>
                      {(r.employment || "—").replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      {purp ? <span style={{ fontSize: 10, fontWeight: 600, color: purp.color, background: `${purp.color}10`, padding: "2px 8px", borderRadius: 20, border: `1px solid ${purp.color}30` }}>{purp.label}</span> : <span style={{ color: T.muted, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      {r.emailVerified
                        ? <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>✓ Verified</span>
                        : <span style={{ color: T.muted, fontSize: 11 }}>Pending</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} leads
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface2, color: page === 0 ? T.muted : T.text, fontSize: 11, cursor: page === 0 ? "default" : "pointer", fontFamily: "'Geist',sans-serif" }}>
                  ← Prev
                </button>
                <span style={{ padding: "4px 10px", fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", alignSelf: "center" }}>
                  {page + 1} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface2, color: page === totalPages - 1 ? T.muted : T.text, fontSize: 11, cursor: page === totalPages - 1 ? "default" : "pointer", fontFamily: "'Geist',sans-serif" }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Scoring methodology */}
      <Card style={{ padding: "16px 20px" }}>
        <SectionTitle>Scoring Methodology</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { factor: "Monthly Income", max: 25, desc: "≥€3.5k=25 · ≥€2.5k=20 · ≥€2k=15 · ≥€1.5k=9 · ≥€1k=4 · <€1k=0" },
            { factor: "DTI — ES",       max: 25, desc: "<30% Solvent=25 · <35% Acceptable=19 · <40% Tight=12 · <50% High=5 · ≥50% Exclusion=0" },
            { factor: "Loan-to-Income", max: 15, desc: "≤0.5× annual=15 · ≤1×=11 · ≤2×=6 · ≤3×=2 · >3×=0" },
            { factor: "Employment",     max: 15, desc: "Civil servant=15 · Employed=13 · Self-emp=10 · Retired=9 · Part-time=5 · Other=4 · Unemployed=0" },
            { factor: "Email Verified", max: 10, desc: "Verified=10 · Not verified=0" },
            { factor: "Full Name",      max: 5,  desc: "≥2 words=5 · Single name=0" },
            { factor: "Age fit",        max: 5,  desc: "30–55=5 · 25–65=3 · Other=1 · Unknown=0" },
          ].map(({ factor, max, desc }) => (
            <div key={factor} style={{ padding: "10px 12px", background: T.surface2, borderRadius: 8, borderLeft: `3px solid ${T.blue}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{factor}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.blue, fontFamily: "'IBM Plex Mono',monospace", background: `${T.blue}12`, padding: "1px 6px", borderRadius: 4 }}>{max}pts</span>
              </div>
              <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", background: `${T.blue}08`, borderRadius: 8, borderLeft: `3px solid ${T.blue}`, fontSize: 11, color: T.textSub, lineHeight: 1.6 }}>
          <strong style={{ color: T.text }}>Grade scale:</strong> A (≥75) — Top tier, send to premium partners · B (50-74) — Standard, general distribution · C (30-49) — Below average, flag before sending · D (&lt;30) — Poor quality, review before distribution
        </div>
      </Card>
    </div>
  );
}
