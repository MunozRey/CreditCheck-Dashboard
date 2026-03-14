import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme, getCatStyle } from '../context/ThemeContext.jsx';
import { toTitleCase } from '../utils/format.js';
import Card from '../components/Card.jsx';
import Avatar from '../components/Avatar.jsx';
import Chip from '../components/Chip.jsx';
import LeadDrawer from '../components/LeadDrawer.jsx';

// Default visible columns
const ALL_COLUMNS = [
  { key: "name",       label: "Name",       always: true },
  { key: "email",      label: "Email",      always: false },
  { key: "purpose",    label: "Purpose",    always: false },
  { key: "created",    label: "Date",       always: false },
  { key: "country",    label: "Country",    always: false },
  { key: "employment", label: "Employment", always: false },
  { key: "income",     label: "Income",     always: false },
];
const DEFAULT_VISIBLE = new Set(["name", "email", "purpose", "created"]);

export default function LeadsTab({ data, starredEmails = new Set(), toggleStar = () => {}, defaultCat = "Form Submitted", defaultSort = "created" }) {
  const { T } = useTheme();
  const CAT_STYLE = getCatStyle(T);

  const [cat, setCat]               = useState(defaultCat);
  const [search, setSearch]         = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [tableOpen, setTableOpen]   = useState(true);
  const [sortBy, setSortBy]         = useState(defaultSort);
  const [starOnly, setStarOnly]     = useState(false);
  const [purposeFilter, setPurposeFilter]   = useState("all");
  const [empFilter, setEmpFilter]           = useState("all");
  const [countryFilter, setCountryFilter]   = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [visibleCols, setVisibleCols]       = useState(DEFAULT_VISIBLE);
  const [showColMenu, setShowColMenu]       = useState(false);
  const [selectedLead, setSelectedLead]     = useState(null);
  const colMenuRef = useRef(null);

  // Close column menu on outside click
  useEffect(() => {
    if (!showColMenu) return;
    const handler = (e) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu]);

  const allLeads = useMemo(() => (data[cat] || []).map(r => ({ ...r, cat })), [data, cat]);

  const allPurposes  = useMemo(() => [...new Set(allLeads.map(r => r.purpose).filter(Boolean))].sort(), [allLeads]);
  const allCountries = useMemo(() => [...new Set(allLeads.map(r => r.country).filter(Boolean))].sort(), [allLeads]);
  const allEmp       = useMemo(() => [...new Set(allLeads.map(r => (r.employment || "")).filter(Boolean))].sort(), [allLeads]);

  const filtered = useMemo(() => {
    let rows = allLeads;
    if (starOnly)               rows = rows.filter(r => starredEmails.has(r.email));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q) || (r.purpose || "").toLowerCase().includes(q));
    }
    if (dateFrom)               rows = rows.filter(r => r.created && r.created.slice(0, 10) >= dateFrom);
    if (dateTo)                 rows = rows.filter(r => r.created && r.created.slice(0, 10) <= dateTo);
    if (purposeFilter !== "all") rows = rows.filter(r => r.purpose === purposeFilter);
    if (empFilter !== "all")     rows = rows.filter(r => (r.employment || "") === empFilter);
    if (countryFilter !== "all") rows = rows.filter(r => (r.country || "") === countryFilter);
    if (verifiedFilter === "verified")   rows = rows.filter(r => r.emailVerified);
    if (verifiedFilter === "unverified") rows = rows.filter(r => !r.emailVerified);
    return [...rows].sort((a, b) => {
      if (sortBy === "name")    return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "purpose") return (a.purpose || "").localeCompare(b.purpose || "");
      if (sortBy === "country") return (a.country || "").localeCompare(b.country || "");
      return (b.created || "").localeCompare(a.created || "");
    });
  }, [allLeads, search, dateFrom, dateTo, sortBy, purposeFilter, empFilter, countryFilter, verifiedFilter, starOnly, starredEmails]);

  const hasFilters = !!(search || dateFrom || dateTo || purposeFilter !== "all" || empFilter !== "all" || countryFilter !== "all" || verifiedFilter !== "all" || starOnly);
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); setPurposeFilter("all"); setEmpFilter("all"); setCountryFilter("all"); setVerifiedFilter("all"); setStarOnly(false); };

  const visibleColList = ALL_COLUMNS.filter(c => c.always || visibleCols.has(c.key));

  const toggleCol = (key) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const inputStyle = { border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 11, color: T.text, outline: "none", background: T.surface2, fontFamily: "'Geist',sans-serif" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "188px 1fr", gap: 16 }}>

      {/* Category sidebar */}
      <Card style={{ padding: "12px 10px", height: "fit-content" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 6px" }}>Categories</div>
        {["Bank Connected", "Form Submitted", "Incomplete"].map(c => {
          const count = (data[c] || []).length, active = cat === c, s = CAT_STYLE[c];
          return (
            <button key={c} onClick={() => { setCat(c); clearFilters(); }} style={{
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

      <Card>
        {/* Toolbar row 1 */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 160 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{cat}</span>
            <Chip color={CAT_STYLE[cat].color} bg={CAT_STYLE[cat].light}>{filtered.length}</Chip>
            {filtered.length !== allLeads.length && <span style={{ fontSize: 11, color: T.muted }}>of {allLeads.length}</span>}
          </div>

          {tableOpen && (<>
            <input placeholder="Search name, email, purpose…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 200, padding: "5px 10px", borderRadius: 8 }} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 11, color: T.muted }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            {hasFilters && (
              <button onClick={clearFilters} style={{ fontSize: 11, color: T.red, background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "4px 6px" }}>✕ Clear</button>
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
              border: `1px solid ${starOnly ? "#F59E0B60" : T.border}`,
              background: starOnly ? "#FFF8E7" : T.surface2,
              color: starOnly ? "#B45309" : T.muted, fontSize: 11, fontWeight: starOnly ? 700 : 500,
              fontFamily: "'Geist',sans-serif", transition: "all .14s",
            }}>
              {starOnly ? "★" : "☆"} Starred{starOnly && starredEmails.size > 0 ? ` (${[...starredEmails].filter(e => allLeads.some(r => r.email === e)).length})` : ""}
            </button>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
              <option value="created">↓ Date</option>
              <option value="name">A→Z Name</option>
              <option value="purpose">↓ Purpose</option>
              <option value="country">↓ Country</option>
            </select>

            {allPurposes.length > 0 && (
              <select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 140 }}>
                <option value="all">All purposes</option>
                {allPurposes.map(p => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
              </select>
            )}

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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {tableOpen && (
          <div style={{ overflowY: "auto", maxHeight: 520 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface2, position: "sticky", top: 0, zIndex: 1 }}>
                  <th style={{ padding: "9px 8px", borderBottom: `1px solid ${T.border}`, width: 32, textAlign: "center" }} />
                  {visibleColList.map(col => (
                    <th key={col.key} onClick={() => setSortBy(col.key)} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700, color: sortBy === col.key ? T.navy : T.muted, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                      {col.label}{sortBy === col.key ? " ↓" : ""}
                    </th>
                  ))}
                  <th style={{ padding: "9px 8px", borderBottom: `1px solid ${T.border}`, width: 24 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.email || `nomail-${i}-${row.name}`}
                    style={{ borderBottom: `1px solid ${T.surface2}`, transition: "background .1s", cursor: "pointer" }}
                    onClick={() => setSelectedLead(row)}
                    onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                    {/* Star toggle — stop propagation so click doesn't open drawer */}
                    <td style={{ padding: "10px 8px", textAlign: "center", width: 32 }} onClick={e => { e.stopPropagation(); toggleStar(row.email); }}>
                      <span title={starredEmails.has(row.email) ? "Unstar" : "Star this lead"} style={{ fontSize: 14, cursor: "pointer", color: starredEmails.has(row.email) ? "#F59E0B" : T.border, userSelect: "none", transition: "color .12s" }}>
                        {starredEmails.has(row.email) ? "★" : "☆"}
                      </span>
                    </td>

                    {visibleColList.map(col => {
                      if (col.key === "name") return (
                        <td key="name" style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={toTitleCase(row.name)} />
                            <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{row.name ? toTitleCase(row.name) : "—"}</span>
                          </div>
                        </td>
                      );
                      if (col.key === "email") return (
                        <td key="email" style={{ padding: "10px 14px", color: T.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>{row.email || "—"}</td>
                      );
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
                {filtered.length === 0 && (
                  <tr><td colSpan={visibleColList.length + 2} style={{ textAlign: "center", padding: 48, color: T.muted, fontSize: 13 }}>
                    {starOnly ? "No starred leads in this category" : hasFilters ? "No leads match the current filters — try clearing some filters" : `No leads in ${cat}`}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
