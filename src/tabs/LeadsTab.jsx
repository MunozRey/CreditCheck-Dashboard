import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTheme, getCatStyle } from '../context/ThemeContext.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import { toTitleCase } from '../utils/format.js';
import { scoreLead } from '../utils/scoring.js';
import { useLeadFilters } from '../hooks/useLeadFilters.js';
import Card from '../components/Card.jsx';
import Avatar from '../components/Avatar.jsx';
import Chip from '../components/Chip.jsx';
import LeadDrawer from '../components/LeadDrawer.jsx';

// ── localStorage persistence ──────────────────────────────────────────────────
const PREFS_KEY = 'creditcheck_dashboard_prefs';
function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch(_) { return {}; }
}
function savePrefs(patch) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...patch })); } catch(_) {}
}

// Loan Purpose options — data-driven segmentation ordered by frequency
const LOAN_PURPOSE_OPTIONS = [
  { value: 'personal_expenses', label: 'Personal Expenses' },
  { value: 'other',             label: 'Other' },
  { value: 'home_improvement',  label: 'Home Improvement' },
  { value: 'refinance',         label: 'Refinance' },
  { value: 'vehicle',           label: 'Vehicle' },
  { value: 'holiday',           label: 'Holiday' },
  { value: 'education',         label: 'Education' },
  { value: 'it_equipment',      label: 'IT Equipment' },
];


// Default visible columns
const ALL_COLUMNS = [
  { key: "name",       label: "Name",       always: true  },
  { key: "email",      label: "Email",      always: false },
  { key: "score",      label: "Score",      always: false },
  { key: "purpose",    label: "Purpose",    always: false },
  { key: "created",    label: "Date",       always: false },
  { key: "country",    label: "Country",    always: false },
  { key: "employment", label: "Employment", always: false },
  { key: "income",     label: "Income",     always: false },
];
const DEFAULT_VISIBLE = new Set(["name", "email", "score", "created"]);

export default function LeadsTab({ data, starredEmails = new Set(), toggleStar = () => {}, defaultCat = "Form Submitted", defaultSort = "created" }) {
  const { T } = useTheme();
  const CAT_STYLE = getCatStyle(T);
  const { privacyMode, maskName, maskEmail } = usePrivacy();

  const [cat, setCat]                       = useState(() => readPrefs().tableCategory || "Bank Connected");
  const [tableOpen, setTableOpen]           = useState(true);
  const [visibleCols, setVisibleCols]       = useState(() => {
    const prefs = readPrefs();
    return Array.isArray(prefs.visibleColumns) ? new Set(prefs.visibleColumns) : DEFAULT_VISIBLE;
  });
  const [showColMenu,     setShowColMenu]     = useState(false);
  const [showPurposeMenu, setShowPurposeMenu] = useState(false);
  const [selectedLead,    setSelectedLead]    = useState(null);
  const [topN,            setTopN]            = useState(0);

  const colMenuRef     = useRef(null);
  const purposeMenuRef = useRef(null);

  // ── Persist category + columns ────────────────────────────────────────────
  useEffect(() => { savePrefs({ tableCategory: cat }); }, [cat]);
  useEffect(() => { savePrefs({ visibleColumns: [...visibleCols] }); }, [visibleCols]);

  // Close column menu on outside click
  useEffect(() => {
    if (!showColMenu) return;
    const handler = (e) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu]);

  // Close purpose menu on outside click
  useEffect(() => {
    if (!showPurposeMenu) return;
    const handler = (e) => { if (purposeMenuRef.current && !purposeMenuRef.current.contains(e.target)) setShowPurposeMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPurposeMenu]);

  // Summary stats derived from filtered leads (computed after filter memo below)

  const allPurposes  = useMemo(() => [...new Set(allLeads.map(r => r.purpose).filter(Boolean))].sort(), [allLeads]);
  const allCountries = useMemo(() => [...new Set(allLeads.map(r => r.country).filter(Boolean))].sort(), [allLeads]);
  const allEmp       = useMemo(() => [...new Set(allLeads.map(r => (r.employment || "")).filter(Boolean))].sort(), [allLeads]);

  // Per-purpose counts from full category (not filtered) for count badges
  const purposeCounts = useMemo(() => {
    const counts = {};
    for (const r of allLeads) {
      if (r.purpose) counts[r.purpose] = (counts[r.purpose] || 0) + 1;
    }
    return counts;
  }, [allLeads]);

  const {
    search,             setSearch,
    dateFrom,           setDateFrom,
    dateTo,             setDateTo,
    starOnly,           setStarOnly,
    loanPurposeFilters, setLoanPurposeFilters,
    empFilter,          setEmpFilter,
    countryFilter,      setCountryFilter,
    verifiedFilter,     setVerifiedFilter,
    sortBy,             toggleSort, sortIndicator,
    allCountries,       allEmp,
    filtered,           hasFilters, clearFilters,
  } = useLeadFilters({ allLeads, starredEmails, defaultSort: readPrefs().tableSort || defaultSort || "created" });

  const bcFiltered       = filtered.filter(r => r.cat === "Bank Connected");
  const emailVerifCount  = filtered.filter(r => r.emailVerified).length;
  const incomes          = filtered.map(r => r.income).filter(Boolean);
  const loans            = filtered.map(r => r.loanAmount).filter(Boolean);
  const summAvgIncome    = incomes.length ? Math.round(incomes.reduce((s, v) => s + v, 0) / incomes.length) : null;
  const summAvgLoan      = loans.length   ? Math.round(loans.reduce((s, v) => s + v, 0) / loans.length)   : null;
  const fmtK = n => n >= 1000 ? `€${(n / 1000).toFixed(0)}k` : `€${n}`;

  const visibleColList = ALL_COLUMNS.filter(c => c.always || visibleCols.has(c.key));

  const toggleCol = (key) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const togglePurpose = useCallback((value) => {
    setLoanPurposeFilters(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }, [setLoanPurposeFilters]);

  const visibleColList = ALL_COLUMNS.filter(c => c.always || visibleCols.has(c.key));

  const inputStyle = { border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 11, color: T.text, outline: "none", background: T.surface2, fontFamily: "'Geist',sans-serif" };

  const activePurposeCount = loanPurposeFilters.size;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "188px 1fr", gap: 16, alignItems: "start" }}>

      {/* Left column: categories + summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ padding: "12px 10px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 6px" }}>Categories</div>
        {["Bank Connected", "Form Submitted", "Incomplete"].map(c => {
          const count = (data[c] || []).length, active = cat === c, s = CAT_STYLE[c];
          return (
            <button key={c} onClick={() => { setCat(c); clearFilters(); setTopN(0); }} style={{
              width: "100%", textAlign: "left",
              background: active ? `${s.color}10` : "none",
              border: `1px solid ${active ? `${s.color}30` : "transparent"}`,
              borderRadius: 8, padding: "9px 10px", cursor: "pointer", marginBottom: 3,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? s.color : T.border, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? s.color : T.textSub }}>{c}</span>
              </div>
              <span style={{ background: active ? s.color : T.border, color: active ? "#fff" : T.muted, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </Card>

      {/* Summary stats */}
      <Card style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Showing</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 10 }}>{filtered.length} <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>leads</span></div>
        {[
          { label: "Bank Connected",  value: `${bcFiltered.length}`,              sub: filtered.length ? `${Math.round(bcFiltered.length / filtered.length * 100)}%` : null, color: T.green },
          { label: "Email Verified",  value: `${emailVerifCount}`,                sub: filtered.length ? `${Math.round(emailVerifCount / filtered.length * 100)}%` : null,  color: T.blue },
          { label: "Avg Income",      value: summAvgIncome ? fmtK(summAvgIncome) + "/mo" : "—", sub: null, color: T.navy },
          { label: "Avg Loan",        value: summAvgLoan   ? fmtK(summAvgLoan)            : "—", sub: null, color: T.navy },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color }}>
              {value}{sub && <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginLeft: 4 }}>({sub})</span>}
            </div>
          </div>
        ))}
      </Card>

      </div>{/* end left column */}

      <Card>
        {/* Toolbar row 1 */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 160 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{cat}</span>
            <Chip color={CAT_STYLE[cat].color} bg={CAT_STYLE[cat].light}>{visibleRows.length}</Chip>
            {visibleRows.length !== allLeads.length && <span style={{ fontSize: 11, color: T.muted }}>of {allLeads.length}</span>}
          </div>

          {tableOpen && (<>
            <input placeholder="Search name, email, purpose…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 200, padding: "5px 10px", borderRadius: 8 }} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 11, color: T.muted }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            {/* Top N */}
            <input
              type="number" min={1}
              value={topN || ''}
              onChange={e => setTopN(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Top N"
              title="Show top N leads (leave empty for all)"
              style={{ ...inputStyle, width: 72, textAlign: "center" }}
            />
            {(hasFilters || topN > 0) && (
              <button onClick={() => { clearFilters(); setTopN(0); }} style={{ fontSize: 11, color: T.red, background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "4px 6px" }}>✕ Clear</button>
            )}
          </>)}

          <button onClick={() => setTableOpen(v => !v)} title={tableOpen ? "Collapse table" : "Expand table"} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7,
            border: `1px solid ${T.border}`, background: tableOpen ? T.surface2 : T.navy,
            color: tableOpen ? T.muted : "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Geist',sans-serif", transition: "all .15s", flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform .2s", transform: tableOpen ? "rotate(0deg)" : "rotate(180deg)" }}>
              <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {tableOpen ? "Collapse" : "Expand"}
          </button>
        </div>

        {/* Toolbar row 2: secondary filters + column toggle */}
        {tableOpen && (
          <div style={{ padding: "8px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", background: T.surface2 }}>
            <button onClick={() => setStarOnly(v => !v)} title={starOnly ? "Showing starred only — click to clear" : "Show starred leads only"} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, cursor: "pointer",
              border: `1px solid ${starOnly ? T.amber + "60" : T.border}`,
              background: starOnly ? T.amberBg : T.surface2,
              color: starOnly ? T.amber : T.muted, fontSize: 11, fontWeight: starOnly ? 700 : 500,
              fontFamily: "'Geist',sans-serif", transition: "all .14s",
            }}>
              {starOnly ? "★" : "☆"} Starred{starOnly && starredEmails.size > 0 ? ` (${[...starredEmails].filter(e => allLeads.some(r => r.email === e)).length})` : ""}
            </button>

            {/* Loan Purpose multi-select dropdown */}
            <div style={{ position: "relative" }} ref={purposeMenuRef}>
              <button
                onClick={() => setShowPurposeMenu(v => !v)}
                style={{
                  ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                  border: `1px solid ${activePurposeCount > 0 ? T.blue : T.border}`,
                  background: activePurposeCount > 0 ? `${T.blue}10` : T.surface2,
                  color: activePurposeCount > 0 ? T.blue : T.muted,
                }}
              >
                Loan Purpose
                {activePurposeCount > 0 && (
                  <span style={{ background: T.blue, color: "#fff", borderRadius: 9999, fontSize: 9, padding: "1px 5px", fontWeight: 700, lineHeight: "14px" }}>{activePurposeCount}</span>
                )}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 2, flexShrink: 0 }}>
                  <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showPurposeMenu && (
                <div style={{
                  position: "absolute", left: 0, top: "calc(100% + 4px)",
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: "8px 0", zIndex: 60, minWidth: 230,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}>
                  {LOAN_PURPOSE_OPTIONS.map(opt => {
                    const count   = purposeCounts[opt.value] || 0;
                    const checked = loanPurposeFilters.has(opt.value);
                    return (
                      <label key={opt.value} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: T.text,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={checked} onChange={() => togglePurpose(opt.value)} style={{ accentColor: T.blue, flexShrink: 0 }} />
                          {opt.label}
                        </div>
                        <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", background: T.surface2, borderRadius: 4, padding: "1px 5px", minWidth: 24, textAlign: "center" }}>{count}</span>
                      </label>
                    );
                  })}
                  {activePurposeCount > 0 && (
                    <div style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0 0" }}>
                      <button
                        onClick={() => { setLoanPurposeFilters(new Set()); setShowPurposeMenu(false); }}
                        style={{ width: "100%", background: "none", border: "none", padding: "7px 14px", fontSize: 11, color: T.red, cursor: "pointer", textAlign: "left", fontFamily: "'Geist',sans-serif" }}
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {allEmp.length > 0 && (
              <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 140 }}>
                <option value="all">All employment</option>
                {allEmp.map(e => <option key={e} value={e}>{e.replace(/_/g, " ")}</option>)}
              </select>
            )}

            {allCountries.length > 1 && (
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 120 }}>
                <option value="all">All countries</option>
                {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)} style={inputStyle}>
              <option value="all">All leads</option>
              <option value="verified">✓ Verified only</option>
              <option value="unverified">✗ Unverified</option>
            </select>

            {/* Column visibility dropdown */}
            <div style={{ marginLeft: "auto", position: "relative" }} ref={colMenuRef}>
              <button onClick={() => setShowColMenu(v => !v)} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "5px 10px" }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="2" width="10" height="1.5" rx=".75" fill="currentColor"/>
                  <rect x="1" y="5.25" width="10" height="1.5" rx=".75" fill="currentColor"/>
                  <rect x="1" y="8.5" width="10" height="1.5" rx=".75" fill="currentColor"/>
                </svg>
                Columns
              </button>
              {showColMenu && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 0", zIndex: 50, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                  {ALL_COLUMNS.filter(c => !c.always).map(col => (
                    <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: T.text }}>
                      <input type="checkbox" checked={visibleCols.has(col.key)} onChange={() => toggleCol(col.key)} style={{ accentColor: T.blue }} />
                      {col.label}
                    </label>
                  ))}
                  <div style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0 0" }}>
                    <button onClick={() => {
                      setVisibleCols(DEFAULT_VISIBLE);
                      savePrefs({ visibleColumns: [...DEFAULT_VISIBLE] });
                      setShowColMenu(false);
                    }} style={{ width: "100%", background: "none", border: "none", padding: "7px 14px", fontSize: 11, color: T.muted, cursor: "pointer", textAlign: "left", fontFamily: "'Geist',sans-serif" }}>
                      Reset to defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {tableOpen && (
          <div style={{ overflowY: "auto", maxHeight: 520 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }} role="grid" aria-label={`Leads table — ${filtered.length} results`}>
              <thead>
                <tr style={{ background: T.surface2, position: "sticky", top: 0, zIndex: 1 }}>
                  <th scope="col" style={{ padding: "9px 8px", borderBottom: `1px solid ${T.border}`, width: 32, textAlign: "center" }} aria-label="Star" />
                  {visibleColList.map(col => (
                    <th key={col.key} scope="col" onClick={() => toggleSort(col.key)}
                      aria-sort={sortBy === col.key ? "descending" : "none"} tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && toggleSort(col.key)}
                      style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700,
                        color: sortBy === col.key ? T.navy : T.muted,
                        fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase",
                        borderBottom: `1px solid ${T.border}`, cursor: "pointer",
                        userSelect: "none", whiteSpace: "nowrap",
                      }}>
                      {col.label}{sortIndicator(col.key)}
                    </th>
                  ))}
                  <th scope="col" style={{ padding: "9px 8px", borderBottom: `1px solid ${T.border}`, width: 24 }} aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={row.email || `nomail-${i}-${row.name}`}
                    style={{ borderBottom: `1px solid ${T.surface2}`, transition: "background .1s", cursor: "pointer" }}
                    onClick={() => setSelectedLead(row)}
                    onKeyDown={e => e.key === "Enter" && setSelectedLead(row)}
                    onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    tabIndex={0} role="row" aria-label={`Lead: ${row.name || "Unknown"} — ${row.cat || ""}`}>

                    {/* Star toggle */}
                    <td style={{ padding: "10px 8px", textAlign: "center", width: 32 }} onClick={e => { e.stopPropagation(); toggleStar(row.email); }}>
                      <span title={starredEmails.has(row.email) ? "Unstar" : "Star this lead"} style={{ fontSize: 14, cursor: "pointer", color: starredEmails.has(row.email) ? T.amber : T.border, userSelect: "none", transition: "color .12s" }}>
                        {starredEmails.has(row.email) ? "★" : "☆"}
                      </span>
                    </td>

                    {visibleColList.map(col => {
                      if (col.key === "name") return (
                        <td key="name" style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={maskName(toTitleCase(row.name))} />
                            <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{row.name ? maskName(toTitleCase(row.name)) : "—"}</span>
                          </div>
                        </td>
                      );
                      if (col.key === "email") return (
                        <td key="email" style={{ padding: "10px 14px", color: T.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>{row.email ? maskEmail(row.email) : "—"}</td>
                      );
                      if (col.key === "score") {
                        const s     = scoreLead(row);
                        const grade = s >= 75 ? "A" : s >= 50 ? "B" : s >= 30 ? "C" : "D";
                        const color = s >= 75 ? T.green : s >= 50 ? T.blue : s >= 30 ? T.amber : T.red;
                        return (
                          <td key="score" style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Mono',monospace" }}>{s}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: `${color}15`, color, border: `1px solid ${color}30`, fontFamily: "'IBM Plex Mono',monospace" }}>{grade}</span>
                            </div>
                          </td>
                        );
                      }
                      if (col.key === "purpose") return (
                        <td key="purpose" style={{ padding: "10px 14px" }}>
                          {row.purpose
                            ? <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: `${T.blue}0D`, border: `1px solid ${T.blue}25`, fontSize: 11, fontWeight: 600, color: T.blue, textTransform: "capitalize" }}>{row.purpose.replace(/_/g, " ")}</span>
                            : <span style={{ color: T.muted, fontSize: 11 }}>—</span>}
                        </td>
                      );
                      if (col.key === "created") return (
                        <td key="created" style={{ padding: "10px 14px", color: T.muted, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{row.created || "—"}</td>
                      );
                      if (col.key === "country") return (
                        <td key="country" style={{ padding: "10px 14px", color: T.textSub, fontSize: 11 }}>{row.country || "—"}</td>
                      );
                      if (col.key === "employment") return (
                        <td key="employment" style={{ padding: "10px 14px", color: T.textSub, fontSize: 11, textTransform: "capitalize" }}>{row.employment ? row.employment.replace(/_/g, " ") : "—"}</td>
                      );
                      if (col.key === "income") return (
                        <td key="income" style={{ padding: "10px 14px", color: T.navy, fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.income ? `€${Number(row.income).toLocaleString()}` : "—"}</td>
                      );
                      return null;
                    })}
                    <td style={{ padding: "10px 8px", color: T.border, fontSize: 14, textAlign: "center" }}>›</td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr><td colSpan={visibleColList.length + 2} style={{ textAlign: "center", padding: 48, color: T.muted, fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>🔍</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{starOnly ? "No starred leads in this category" : hasFilters ? "No leads match the current filters" : `No leads in ${cat}`}</div>
                    {hasFilters && <button onClick={clearFilters} style={{ marginTop: 8, padding: "6px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface2, color: T.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Clear all filters</button>}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Summary stats footer ── */}
      {summaryStats && (
        <div style={{ marginTop:16, padding:"12px 20px", borderRadius:12, border:`1px solid ${T.border}`, background:T.surface2, display:"flex", gap:0, flexWrap:"wrap" }}>
          {[
            { label:"Showing",      value:summaryStats.total,                 fmt: n=>`${n} leads`,          color:T.text    },
            { label:"Bank Connected", value:summaryStats.bcCount,             fmt: n=>`${n} (${summaryStats.total>0?Math.round(n/summaryStats.total*100):0}%)`, color:T.green },
            { label:"Email Verified", value:summaryStats.verifiedCnt,         fmt: n=>`${n}`,               color:T.blue    },
            summaryStats.avgScore  != null && { label:"Avg Score",  value:summaryStats.avgScore,  fmt:n=>`${n} pts`,     color:n>=75?T.green:n>=50?T.blue:n>=30?T.amber:T.red },
            summaryStats.avgIncome != null && { label:"Avg Income", value:summaryStats.avgIncome, fmt:n=>`€${n.toLocaleString()}/mo`, color:T.navy },
            summaryStats.avgLoan   != null && { label:"Avg Loan",   value:summaryStats.avgLoan,   fmt:n=>`€${n.toLocaleString()}`,   color:T.navy },
          ].filter(Boolean).map((stat, i, arr) => (
            <div key={stat.label} style={{ flex:"1 1 120px", padding:"6px 16px", borderRight:i<arr.length-1?`1px solid ${T.border}`:"none", minWidth:100 }}>
              <div style={{ fontSize:9, fontWeight:800, color:T.muted, letterSpacing:1.2, textTransform:"uppercase", fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{stat.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:stat.color, fontVariantNumeric:"tabular-nums" }}>{stat.fmt(stat.value)}</div>
            </div>
          ))}
        </div>
      )}

      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
