import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import Card from './Card.jsx';
import { mortgageAggregates, calcMonthlyPaymentAt, ASSUMED_RATE } from '../utils/mortgageParser.js';
import { fmtEur } from '../utils/format.js';
import { FS, FW, R, LABEL_MONO } from '../styles/shared.js';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const TIER_LABEL = { A: "PRIME", B: "STANDARD", C: "WATCH", D: "HIGH RISK" };

function tierColor(tier, T) {
  return tier === "A" ? T.green : tier === "B" ? T.blue : tier === "C" ? T.amber : T.red;
}
function tierBg(tier, T) {
  return tier === "A" ? T.greenBg : tier === "B" ? T.blue4 : tier === "C" ? T.amberBg : T.redBg;
}
function ltvColor(ltv, T) {
  if (ltv === null) return T.muted;
  if (ltv <= 75) return T.green;
  if (ltv <= 85) return T.amber;
  return T.red;
}
function effortColor(effort, T) {
  if (effort === null) return T.muted;
  if (effort < 30) return T.green;
  if (effort < 35) return T.amber;
  return T.red;
}
function ageMatColor(age, T) {
  if (age === null) return T.muted;
  if (age > 80) return T.red;
  if (age > 75) return T.amber;
  return T.text;
}
function flagColor(level, T) {
  return level === "red" ? T.red : level === "amber" ? T.amber : T.green;
}

// ─── CSS BAR ──────────────────────────────────────────────────────────────────
function CssBar({ value, max, color, height = 8 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height, background: "rgba(128,128,128,0.12)", borderRadius: R.sm }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: R.sm, transition: "width .25s" }} />
    </div>
  );
}

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
function TierBadge({ tier, T }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: R.pill,
      background: tierBg(tier, T), color: tierColor(tier, T),
      fontSize: FS.xs, fontWeight: FW.bold, fontFamily: "'IBM Plex Mono',monospace",
      border: `1px solid ${tierColor(tier, T)}30`, letterSpacing: 0.5,
    }}>
      {tier} · {TIER_LABEL[tier]}
    </span>
  );
}

// ─── FLAG CHIPS ───────────────────────────────────────────────────────────────
function FlagChips({ flags, T }) {
  if (!flags || flags.length === 0) return <span style={{ color: T.muted, fontSize: FS.xs }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {flags.map((f, i) => (
        <span key={i} style={{
          padding: "1px 6px", borderRadius: R.pill,
          background: `${flagColor(f.level, T)}18`,
          color: flagColor(f.level, T),
          fontSize: 9, fontWeight: FW.semibold,
          border: `1px solid ${flagColor(f.level, T)}30`,
          whiteSpace: "nowrap",
        }}>{f.label}</span>
      ))}
    </div>
  );
}

// ─── KPI STRIP ────────────────────────────────────────────────────────────────
function KpiStrip({ agg, T }) {
  const ltvColor_  = agg.avgLTV === null ? T.muted : agg.avgLTV < 75 ? T.green : agg.avgLTV < 85 ? T.amber : T.red;
  const effColor_  = agg.avgEffortRatio === null ? T.muted : agg.avgEffortRatio < 30 ? T.green : agg.avgEffortRatio < 35 ? T.amber : T.red;

  const kpis = [
    { label: "Total Applications",  value: agg.total > 0 ? agg.total : "—",    sub: "unique · deduplicated",          color: T.text,     accent: T.blue   },
    { label: "Bank Connected",       value: agg.bc > 0 ? agg.bc : "—",          sub: `${agg.total > 0 ? Math.round(agg.bc / agg.total * 100) : 0}% of total`, color: T.green, accent: T.green },
    { label: "Form Submitted",       value: agg.fs > 0 ? agg.fs : "—",          sub: "form completed",                 color: T.blue,     accent: T.blue   },
    { label: "Avg Loan Amount",      value: agg.avgLoanAmount !== null ? fmtEur(Math.round(agg.avgLoanAmount)) : "—", sub: "average mortgage loan", color: T.text, accent: T.blue },
    { label: "Avg LTV",              value: agg.avgLTV !== null ? `${agg.avgLTV.toFixed(1)}%` : "—",                  sub: "loan-to-value ratio",    color: ltvColor_,  accent: ltvColor_  },
    { label: "Avg Effort Ratio",     value: agg.avgEffortRatio !== null ? `${agg.avgEffortRatio.toFixed(1)}%` : "—",  sub: "payment / monthly income", color: effColor_, accent: effColor_ },
  ];

  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, maxWidth: 1600, margin: "0 auto" }}>
        {kpis.map((k, i) => (
          <div key={k.label} style={{ padding: "18px 22px 16px", borderRight: i < kpis.length - 1 ? `1px solid ${T.border}` : "none", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,${k.accent}60,transparent)` }} />
            <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: FW.extrabold, color: k.color, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFamily: "'Geist',sans-serif" }}>{k.value}</div>
            <div style={{ fontSize: FS.xs, color: T.muted, marginTop: 5, fontFamily: "'IBM Plex Mono',monospace" }}>{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HOT LEADS BANNER ─────────────────────────────────────────────────────────
function HotLeadsBanner({ count, onClick, T }) {
  return (
    <div onClick={onClick} style={{
      padding: "8px 24px", background: T.amberBg, borderBottom: `1px solid ${T.amber}30`,
      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      fontFamily: "'IBM Plex Mono',monospace",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.amber, flexShrink: 0 }} />
      <strong style={{ color: T.amber, fontSize: FS.sm }}>
        {count} {count === 1 ? "application" : "applications"} with active reservation and immediate timeline
      </strong>
      <span style={{ color: T.muted, fontSize: FS.xs }}>— Click to filter</span>
    </div>
  );
}

// ─── TAB BAR ──────────────────────────────────────────────────────────────────
const MTABS = [
  { id: "leads",       label: "Applications" },
  { id: "riesgo",      label: "Risk" },
  { id: "pipeline",    label: "Pipeline" },
  { id: "calculadora", label: "Calculator" },
];

function MortgageTabBar({ tab, setTab, T }) {
  return (
    <div style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "0 24px" }}>
      <div style={{ display: "flex", gap: 0, maxWidth: 1600, margin: "0 auto" }}>
        {MTABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "12px 28px", border: "none", background: "none", cursor: "pointer",
              fontSize: FS.sm, fontWeight: active ? FW.semibold : FW.normal,
              color: active ? T.text : T.muted,
              borderBottom: `2px solid ${active ? T.blue : "transparent"}`,
              fontFamily: "'Geist',sans-serif", transition: "all .12s",
            }}>{t.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SORTABLE TH ──────────────────────────────────────────────────────────────
function Th({ children, sortKey, sortBy, sortDir, onSort, T, style = {} }) {
  const active = sortBy === sortKey;
  return (
    <th onClick={() => onSort && onSort(sortKey)} style={{
      padding: "9px 12px", textAlign: "left", cursor: sortKey ? "pointer" : "default",
      background: T.surface2, ...LABEL_MONO, color: active ? T.blue : T.muted,
      borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
      userSelect: "none", ...style,
    }}>
      {children}{active ? (sortDir === "asc" ? " \u2191" : " \u2193") : ""}
    </th>
  );
}

// Mortgage Purpose options
const MORTGAGE_PURPOSE_OPTIONS = [
  { value: "home_purchase",       label: "Home Purchase" },
  { value: "secondary_residence", label: "Secondary Residence" },
];

// Mortgage Property Type options
const MORTGAGE_PROP_TYPE_OPTIONS = [
  { value: "second_hand", label: "Second Hand" },
  { value: "new_build",   label: "New Build" },
  { value: "undecided",   label: "Undecided" },
];

// ─── MORTGAGE CSV EXPORT ───────────────────────────────────────────────────────
function exportMortgagesCSV(rows, privacyMode) {
  const cols = [
    'lead_id', 'application_date', 'purpose', 'property_type', 'property_location',
    'property_price_eur', 'down_payment_eur', 'loan_term_years', 'number_of_buyers',
    'employment_status', 'monthly_income_eur', 'existing_loans_eur', 'search_status', 'status',
  ];
  const comment = privacyMode
    ? '# Export generated with privacy mode ON — personal data anonymized per GDPR/PSD2 guidelines'
    : '# Export generated — contains personal data, handle per your data protection policy';
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvRows = rows.map((r, i) => {
    const leadId = privacyMode
      ? `LEAD-${String(i + 1).padStart(3, '0')}`
      : (r.id || r.email || `lead-${i + 1}`);
    return [
      leadId,
      r.created        || '',
      r.purpose        || '',
      r.propertyType   || '',
      r.location       || '',
      r.propertyPrice  ?? '',
      r.downPayment    ?? '',
      r.loanTermYears  ?? '',
      r.numBuyers      ?? '',
      r.employment     || '',
      r.monthlyIncome  ?? '',
      r.existingLoans  ?? '',
      r.searchStatus   || '',
      r.status         || '',
    ].map(esc).join(',');
  });
  const csv = [comment, cols.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mortgages_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── TAB 1: APPLICATIONS ──────────────────────────────────────────────────────
function SolicitudesTab({ allLeads, hotLeadsFilter, setHotLeadsFilter, showPersonalData, setShowPersonalData, T }) {
  const { privacyMode } = usePrivacy();
  const [search,        setSearch]        = useState("");
  const [sortBy,        setSortBy]        = useState("created");
  const [sortDir,       setSortDir]       = useState("desc");
  const [page,          setPage]          = useState(0);
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [propTypeFilter, setPropTypeFilter] = useState("all");
  const [topN,          setTopN]          = useState(0);
  const PAGE_SIZE = 25;

  const onSort = useCallback(key => {
    if (!key) return;
    setSortBy(prev => {
      if (prev === key) setSortDir(d => d === "asc" ? "desc" : "asc");
      else setSortDir("desc");
      return key;
    });
    setPage(0);
  }, []);

  const filtered = useMemo(() => {
    let leads = hotLeadsFilter
      ? allLeads.filter(l => l.searchStatus === "reserved" && l.timeline === "immediate")
      : allLeads;
    if (search.trim()) {
      const q = search.toLowerCase();
      leads = leads.filter(l =>
        (l.name     || "").toLowerCase().includes(q) ||
        (l.email    || "").toLowerCase().includes(q) ||
        (l.location || "").toLowerCase().includes(q)
      );
    }
    if (purposeFilter !== "all")  leads = leads.filter(l => (l.purpose      || "").toLowerCase() === purposeFilter);
    if (propTypeFilter !== "all") leads = leads.filter(l => (l.propertyType || "").toLowerCase() === propTypeFilter);
    return [...leads].sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (va === null || va === undefined) va = sortDir === "asc" ? Infinity : -Infinity;
      if (vb === null || vb === undefined) vb = sortDir === "asc" ? Infinity : -Infinity;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [allLeads, hotLeadsFilter, search, sortBy, sortDir, purposeFilter, propTypeFilter]);

  // Apply topN as the final slice after all filters + sort
  const topNLeads  = topN > 0 ? filtered.slice(0, topN) : filtered;
  const totalPages = Math.ceil(topNLeads.length / PAGE_SIZE);
  const pageLeads  = topNLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const fmtPct = v => v !== null ? `${v.toFixed(1)}%` : "0.0%";

  const handleExport = useCallback(() => {
    exportMortgagesCSV(topNLeads, privacyMode);
  }, [topNLeads, privacyMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Eye icon SVG
  const EyeIcon = ({ open }) => open
    ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
    : <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;

  const selStyle = { padding: "7px 10px", borderRadius: R.md, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: FS.sm, outline: "none", fontFamily: "'Geist',sans-serif", cursor: "pointer" };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search name, location..."
          style={{ padding: "7px 12px", borderRadius: R.md, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: FS.sm, outline: "none", minWidth: 220, fontFamily: "'Geist',sans-serif" }}
        />
        {/* Purpose filter */}
        <select value={purposeFilter} onChange={e => { setPurposeFilter(e.target.value); setPage(0); }} style={selStyle}>
          <option value="all">All purposes</option>
          {MORTGAGE_PURPOSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Property Type filter */}
        <select value={propTypeFilter} onChange={e => { setPropTypeFilter(e.target.value); setPage(0); }} style={selStyle}>
          <option value="all">All property types</option>
          {MORTGAGE_PROP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Top N input */}
        <input
          type="number" min={1}
          value={topN || ''}
          onChange={e => { setTopN(Math.max(0, parseInt(e.target.value) || 0)); setPage(0); }}
          placeholder="Top N"
          title="Show top N applications (leave empty for all)"
          style={{ ...selStyle, width: 72, textAlign: "center" }}
        />
        {hotLeadsFilter && (
          <button onClick={() => setHotLeadsFilter(false)} style={{ padding: "5px 12px", borderRadius: R.md, border: `1px solid ${T.amber}`, background: T.amberBg, color: T.amber, fontSize: FS.xs, fontWeight: FW.bold, cursor: "pointer" }}>
            Active reservation filter — Clear
          </button>
        )}
        <button
          onClick={() => setShowPersonalData(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: R.md, border: `1px solid ${T.border}`, background: showPersonalData ? `${T.blue}12` : T.surface2, color: showPersonalData ? T.blue : T.muted, fontSize: FS.xs, fontWeight: FW.semibold, cursor: "pointer" }}
        >
          <EyeIcon open={showPersonalData} />
          {showPersonalData ? "Hide personal data" : "Show personal data"}
        </button>
        {/* Export button */}
        <button
          onClick={handleExport}
          title={privacyMode ? "Export CSV with privacy mode ON" : "Export CSV"}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
            borderRadius: R.md, cursor: "pointer", fontSize: FS.xs, fontWeight: FW.semibold,
            border: `1px solid ${privacyMode ? T.amber : T.border}`,
            background: privacyMode ? `${T.amber}15` : T.surface2,
            color: privacyMode ? T.amber : T.muted,
            fontFamily: "'Geist',sans-serif",
          }}
        >
          {privacyMode ? "🔒 Export (Private)" : "📤 Export"}
        </button>
        <span style={{ marginLeft: "auto", ...LABEL_MONO, color: T.muted }}>{topNLeads.length} applications</span>
      </div>

      {/* Table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: showPersonalData ? 1500 : 1300, fontSize: FS.sm }}>
            <thead>
              <tr>
                {showPersonalData && (
                  <Th sortKey="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Name / Email</Th>
                )}
                <Th sortKey="created"          sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Date</Th>
                <Th sortKey="location"         sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Location</Th>
                <Th sortKey="propertyType"     sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Type</Th>
                <Th sortKey="propertyPrice"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Price</Th>
                <Th sortKey="downPayment"      sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Down Pmt</Th>
                <Th sortKey="loanAmount"       sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Loan</Th>
                <Th sortKey="ltv"              sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>LTV%</Th>
                <Th sortKey="effortRatio"      sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Effort%</Th>
                <Th sortKey="estimatedPayment" sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Pmt/mo</Th>
                <Th sortKey="loanTermYears"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Term</Th>
                <Th sortKey="ageAtMaturity"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Age@Mat.</Th>
                <Th sortKey="numBuyers"        sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Buyers</Th>
                <Th sortKey="employment"       sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Employment</Th>
                <Th sortKey="monthlyIncome"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Income</Th>
                <Th sortKey="purpose"          sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Purpose</Th>
                <Th sortKey="searchStatus"     sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Search</Th>
                <Th sortKey="timeline"         sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Timeline</Th>
                <Th sortKey="riskScore"        sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Score</Th>
                <Th sortKey="riskTier"         sortBy={sortBy} sortDir={sortDir} onSort={onSort} T={T}>Tier</Th>
                <Th sortKey={null}             sortBy={sortBy} sortDir={sortDir} onSort={null}   T={T}>Flags</Th>
              </tr>
            </thead>
            <tbody>
              {pageLeads.length === 0 ? (
                <tr><td colSpan={showPersonalData ? 21 : 20} style={{ padding: 32, textAlign: "center", color: T.muted, fontSize: FS.sm }}>No results</td></tr>
              ) : pageLeads.map((l, i) => (
                <tr key={l.email + i} style={{ background: i % 2 === 0 ? T.surface : T.surface2, borderBottom: `1px solid ${T.border}` }}>
                  {showPersonalData && (
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: FW.semibold, color: T.text, fontSize: FS.sm }}>{l.name || "N/A"}</div>
                      <div style={{ fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{l.email}</div>
                    </td>
                  )}
                  <td style={{ padding: "8px 12px", color: T.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: FS.xs }}>{l.created || "—"}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub }}>{l.location || "N/A"}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub }}>{l.propertyType || "N/A"}</td>
                  <td style={{ padding: "8px 12px", color: T.text, fontVariantNumeric: "tabular-nums" }}>{l.propertyPrice !== null ? fmtEur(l.propertyPrice) : fmtEur(0)}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, fontVariantNumeric: "tabular-nums" }}>{l.downPayment !== null ? fmtEur(l.downPayment) : fmtEur(0)}</td>
                  <td style={{ padding: "8px 12px", color: T.text, fontVariantNumeric: "tabular-nums" }}>{l.loanAmount !== null ? fmtEur(l.loanAmount) : fmtEur(0)}</td>
                  <td style={{ padding: "8px 12px", fontWeight: FW.semibold, color: ltvColor(l.ltv, T), fontVariantNumeric: "tabular-nums" }}>{fmtPct(l.ltv)}</td>
                  <td style={{ padding: "8px 12px", fontWeight: FW.semibold, color: effortColor(l.effortRatio, T), fontVariantNumeric: "tabular-nums" }}>{fmtPct(l.effortRatio)}</td>
                  <td style={{ padding: "8px 12px", color: T.text, fontVariantNumeric: "tabular-nums" }}>{l.estimatedPayment !== null ? fmtEur(l.estimatedPayment) : fmtEur(0)}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, textAlign: "center" }}>{l.loanTermYears !== null ? `${l.loanTermYears}y` : "0y"}</td>
                  <td style={{ padding: "8px 12px", fontWeight: FW.semibold, color: ageMatColor(l.ageAtMaturity, T), textAlign: "center" }}>{l.ageAtMaturity !== null ? l.ageAtMaturity : 0}</td>
                  <td style={{ padding: "8px 12px", textAlign: "center", color: l.hasCobuyer ? T.green : T.muted }}>{l.numBuyers !== null ? l.numBuyers : 0}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, fontSize: FS.xs }}>{l.employment || "N/A"}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, fontVariantNumeric: "tabular-nums" }}>{l.monthlyIncome !== null ? fmtEur(l.monthlyIncome) : fmtEur(0)}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, fontSize: FS.xs }}>{l.purpose || "N/A"}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, fontSize: FS.xs }}>{l.searchStatus || "N/A"}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub, fontSize: FS.xs }}>{l.timeline || "N/A"}</td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <span style={{ fontWeight: FW.bold, fontSize: FS.sm, color: tierColor(l.riskTier, T) }}>{l.riskScore}</span>
                  </td>
                  <td style={{ padding: "8px 12px" }}><TierBadge tier={l.riskTier} T={T} /></td>
                  <td style={{ padding: "8px 12px", minWidth: 180 }}><FlagChips flags={l.riskFlags} T={T} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "4px 12px", borderRadius: R.md, border: `1px solid ${T.border}`, background: T.surface2, color: page === 0 ? T.muted : T.text, cursor: page === 0 ? "default" : "pointer", fontSize: FS.xs }}>
              Previous
            </button>
            <span style={{ ...LABEL_MONO, color: T.muted }}>Page {page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: "4px 12px", borderRadius: R.md, border: `1px solid ${T.border}`, background: T.surface2, color: page >= totalPages - 1 ? T.muted : T.text, cursor: page >= totalPages - 1 ? "default" : "pointer", fontSize: FS.xs }}>
              Next
            </button>
          </div>
        )}
      </Card>
      <div style={{ marginTop: 8, fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
        * Fields with no data are displayed as 0
      </div>
    </div>
  );
}

// ─── SCORING METHODOLOGY PANEL ────────────────────────────────────────────────
function ScoringMethodologyPanel({ T }) {
  const [open, setOpen] = useState(false);

  const LTV_ROWS = [
    { range: "≤ 60%",  pts: 30 },
    { range: "61–70%", pts: 25 },
    { range: "71–75%", pts: 20 },
    { range: "76–80%", pts: 14 },
    { range: "81–85%", pts: 8  },
    { range: "86–90%", pts: 4  },
    { range: "> 90%",  pts: 0  },
  ];
  const EFFORT_ROWS = [
    { range: "< 20%",  pts: 25 },
    { range: "20–24%", pts: 20 },
    { range: "25–29%", pts: 15 },
    { range: "30–34%", pts: 9  },
    { range: "35–39%", pts: 4  },
    { range: "≥ 40%",  pts: 0  },
  ];
  const DTI_ROWS = [
    { range: "< 20%",  pts: 5 },
    { range: "20–29%", pts: 3 },
    { range: "30–39%", pts: 1 },
    { range: "≥ 40%",  pts: 0 },
  ];
  const TIER_ROWS = [
    { tier: "A", label: "PRIME",     min: 75, max: 100, color: T.green, bg: T.greenBg, desc: "Excellent risk profile — well within lending thresholds" },
    { tier: "B", label: "STANDARD",  min: 55, max: 74,  color: T.blue,  bg: T.blue4,   desc: "Acceptable risk profile — meets standard bank criteria" },
    { tier: "C", label: "WATCH",     min: 35, max: 54,  color: T.amber, bg: T.amberBg, desc: "Elevated risk — requires additional review" },
    { tier: "D", label: "HIGH RISK", min: 0,  max: 34,  color: T.red,   bg: T.redBg,   desc: "High risk — likely outside standard lending parameters" },
  ];

  const rowPtsColor = pts => pts >= 20 ? T.green : pts >= 8 ? T.blue : pts >= 4 ? T.amber : T.red;

  const CriteriaTable = ({ title, weight, rows }) => (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: FS.sm, fontWeight: FW.semibold, color: T.text }}>{title}</span>
        <span style={{ ...LABEL_MONO, color: T.muted }}>max {weight} pts</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FS.xs }}>
        <thead>
          <tr>
            <th style={{ padding: "5px 10px", textAlign: "left",  ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>Range</th>
            <th style={{ padding: "5px 10px", textAlign: "right", ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: "5px 10px", color: T.textSub }}>{r.range}</td>
              <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: FW.bold, color: rowPtsColor(r.pts), fontVariantNumeric: "tabular-nums" }}>{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: "none", border: "none", cursor: "pointer",
          borderBottom: open ? `1px solid ${T.border}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ ...LABEL_MONO, color: T.muted }}>G — Scoring Methodology</span>
          <span style={{ fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
            LTV (30) · Effort Ratio (25) · Employment (20) · Age at Maturity (15) · Co-buyer &amp; DTI (10) · 100 pts total
          </span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: 20 }}>
          {/* Criteria breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
            <CriteriaTable title="LTV (Loan-to-Value)" weight={30} rows={LTV_ROWS} />
            <CriteriaTable title="Effort Ratio (payment / income)" weight={25} rows={EFFORT_ROWS} />
            <CriteriaTable title="DTI (Debt-to-Income)" weight={5} rows={DTI_ROWS} />
          </div>

          {/* Final tier classification */}
          <div>
            <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 10 }}>Final Tier Classification</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FS.xs }}>
              <thead>
                <tr>
                  {["Tier", "Label", "Score Range", "Description"].map(h => (
                    <th key={h} style={{ padding: "6px 12px", textAlign: "left", ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIER_ROWS.map(r => (
                  <tr key={r.tier} style={{ borderBottom: `1px solid ${T.border}`, background: r.bg }}>
                    <td style={{ padding: "7px 12px" }}>
                      <span style={{ fontWeight: FW.bold, color: r.color, fontFamily: "'IBM Plex Mono',monospace" }}>{r.tier}</span>
                    </td>
                    <td style={{ padding: "7px 12px", fontWeight: FW.bold, color: r.color }}>{r.label}</td>
                    <td style={{ padding: "7px 12px", fontVariantNumeric: "tabular-nums", color: T.textSub }}>{r.min}–{r.max} pts</td>
                    <td style={{ padding: "7px 12px", color: T.textSub }}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
              Employment stability (20 pts) and Age at maturity (15 pts) are also factored in · Co-buyer adds +5 pts to the DTI component
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── TAB 2: RISK ──────────────────────────────────────────────────────────────
function RiesgoTab({ agg, T }) {
  const maxBucket = v => Math.max(...Object.values(v).filter(n => n > 0), 1);
  const ltvMax    = maxBucket(agg.ltvBuckets);
  const effortMax = maxBucket(agg.effortBuckets);
  const ageMax    = maxBucket(agg.ageBuckets);
  const flagMax   = Math.max(...Object.values(agg.flagFreq).map(f => f.count), 1);

  const ltvBucketColor = key => {
    if (key === "≤70%")  return T.green;
    if (key === "71–80%") return T.blue;
    if (key === "81–90%") return T.amber;
    if (key === ">90%")  return T.red;
    return T.muted;
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* A — Portfolio Risk Summary */}
      <div>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 12 }}>A — Portfolio Risk Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {["A", "B", "C", "D"].map(tier => {
            const s = agg.tierStats[tier];
            return (
              <Card key={tier} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <TierBadge tier={tier} T={T} />
                  <span style={{ fontSize: 26, fontWeight: FW.extrabold, color: tierColor(tier, T), fontVariantNumeric: "tabular-nums" }}>{s.count}</span>
                </div>
                <div style={{ fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 8 }}>
                  {agg.total > 0 ? `${s.pct}% of portfolio` : "0%"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: FS.xs }}>
                  <div>
                    <div style={{ color: T.muted, marginBottom: 2 }}>Avg LTV</div>
                    <div style={{ fontWeight: FW.bold, color: s.avgLTV !== null ? ltvColor(s.avgLTV, T) : T.muted }}>
                      {s.avgLTV !== null ? `${s.avgLTV.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: T.muted, marginBottom: 2 }}>Avg Effort</div>
                    <div style={{ fontWeight: FW.bold, color: s.avgEffort !== null ? effortColor(s.avgEffort, T) : T.muted }}>
                      {s.avgEffort !== null ? `${s.avgEffort.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* B — LTV Distribution */}
        <Card style={{ padding: 20 }}>
          <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 4 }}>B — LTV Distribution</div>
          <div style={{ fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 16 }}>Standard bank threshold: 80%</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(agg.ltvBuckets).filter(([k]) => k !== "N/A" || agg.ltvBuckets[k] > 0).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...LABEL_MONO, color: ltvBucketColor(k), minWidth: 56 }}>{k}</span>
                <CssBar value={v} max={ltvMax} color={ltvBucketColor(k)} height={10} />
                <span style={{ fontSize: FS.xs, color: T.muted, minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* C — Effort Ratio Distribution */}
        <Card style={{ padding: 20 }}>
          <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 4 }}>C — Effort Ratio Distribution</div>
          <div style={{ fontSize: FS.xs, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 16 }}>Bank of Spain recommended max: 35%</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { k: "<25%",   color: T.green },
              { k: "25–35%", color: T.blue  },
              { k: "35–40%", color: T.amber },
              { k: ">40%",   color: T.red   },
              { k: "N/A",    color: T.muted },
            ].filter(({ k }) => (agg.effortBuckets[k] || 0) > 0 || k !== "N/A").map(({ k, color }) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...LABEL_MONO, color, minWidth: 56 }}>{k}</span>
                <CssBar value={agg.effortBuckets[k] || 0} max={effortMax} color={color} height={10} />
                <span style={{ fontSize: FS.xs, color: T.muted, minWidth: 28, textAlign: "right" }}>{agg.effortBuckets[k] || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* D — Risk Flag Frequency */}
        <Card style={{ padding: 20 }}>
          <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 16 }}>D — Risk Flag Frequency</div>
          {Object.keys(agg.flagFreq).length === 0 ? (
            <div style={{ color: T.muted, fontSize: FS.sm, textAlign: "center", padding: 20 }}>No flags detected</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {Object.entries(agg.flagFreq).sort((a, b) => b[1].count - a[1].count).map(([label, { count, level }]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: FS.xs, color: flagColor(level, T), minWidth: 180 }}>{label}</span>
                  <CssBar value={count} max={flagMax} color={flagColor(level, T)} height={8} />
                  <span style={{ fontSize: FS.xs, color: T.muted, minWidth: 24, textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* E — Age at Maturity Distribution */}
        <Card style={{ padding: 20 }}>
          <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 16 }}>E — Age at Maturity Distribution</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              { k: "≤65",  color: T.green },
              { k: "66–70", color: T.blue  },
              { k: "71–75", color: T.blue3 },
              { k: "76–80", color: T.amber },
              { k: ">80",  color: T.red   },
              { k: "N/A",  color: T.muted },
            ].filter(({ k }) => (agg.ageBuckets[k] || 0) > 0 || k !== "N/A").map(({ k, color }) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...LABEL_MONO, color, minWidth: 56 }}>{k}</span>
                <CssBar value={agg.ageBuckets[k] || 0} max={ageMax} color={color} height={8} />
                <span style={{ fontSize: FS.xs, color: T.muted, minWidth: 24, textAlign: "right" }}>{agg.ageBuckets[k] || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* F — LTV vs Effort by Tier */}
      <Card style={{ padding: 20 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 16 }}>F — LTV vs Effort by Tier (portfolio average)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FS.sm }}>
          <thead>
            <tr>
              {["Tier", "Label", "N", "% Portfolio", "Avg LTV%", "Avg Effort%"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["A", "B", "C", "D"].map(tier => {
              const s = agg.tierStats[tier];
              return (
                <tr key={tier} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "8px 12px" }}><TierBadge tier={tier} T={T} /></td>
                  <td style={{ padding: "8px 12px", color: T.textSub }}>{TIER_LABEL[tier]}</td>
                  <td style={{ padding: "8px 12px", fontWeight: FW.bold, color: tierColor(tier, T) }}>{s.count}</td>
                  <td style={{ padding: "8px 12px", color: T.textSub }}>{s.pct}%</td>
                  <td style={{ padding: "8px 12px", fontWeight: FW.semibold, color: s.avgLTV !== null ? ltvColor(s.avgLTV, T) : T.muted }}>
                    {s.avgLTV !== null ? `${s.avgLTV.toFixed(1)}%` : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", fontWeight: FW.semibold, color: s.avgEffort !== null ? effortColor(s.avgEffort, T) : T.muted }}>
                    {s.avgEffort !== null ? `${s.avgEffort.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* G — Scoring Methodology (collapsible) */}
      <ScoringMethodologyPanel T={T} />
    </div>
  );
}

// ─── TAB 3: PIPELINE ──────────────────────────────────────────────────────────
function PipelineTab({ agg, allLeads, T }) {
  const allStatuses  = [...new Set(allLeads.map(l => l.searchStatus || ""))].filter(Boolean).sort();
  const allTimelines = [...new Set(allLeads.map(l => l.timeline     || ""))].filter(Boolean).sort();
  const matrixCell   = (s, t) => allLeads.filter(l => l.searchStatus === s && l.timeline === t).length;

  const BreakdownChart = ({ title, counts }) => {
    const max = Math.max(...Object.values(counts).filter(Boolean), 1);
    return (
      <Card style={{ padding: 18 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 14 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: FS.xs, color: T.textSub, minWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k || "—"}</span>
              <CssBar value={v} max={max} color={T.blue} height={8} />
              <span style={{ fontSize: FS.xs, color: T.muted, minWidth: 24, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* A — Search Status × Timeline matrix */}
      <Card style={{ padding: 20 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 16 }}>A — Search Status × Timeline</div>
        {allStatuses.length === 0 ? (
          <div style={{ color: T.muted, fontSize: FS.sm }}>No data available</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: FS.sm }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 14px", background: T.surface2, ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}` }}>Status \ Timeline</th>
                  {allTimelines.map(t => (
                    <th key={t} style={{ padding: "8px 14px", background: T.surface2, ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>{t || "—"}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allStatuses.map(s => (
                  <tr key={s} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 14px", fontWeight: FW.semibold, color: T.text }}>{s}</td>
                    {allTimelines.map(t => {
                      const isHot = s === "reserved" && t === "immediate";
                      const count = matrixCell(s, t);
                      return (
                        <td key={t} style={{ padding: "8px 14px", textAlign: "center", background: isHot && count > 0 ? T.amberBg : "transparent", color: isHot && count > 0 ? T.amber : count > 0 ? T.text : T.muted, fontWeight: isHot && count > 0 ? FW.bold : FW.normal }}>
                          {count > 0 ? count : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {agg.hotLeads.length > 0 && (
              <div style={{ marginTop: 10, fontSize: FS.xs, color: T.amber, fontFamily: "'IBM Plex Mono',monospace" }}>
                Highlighted cell = highest urgency combination (reserved + immediate)
              </div>
            )}
          </div>
        )}
      </Card>

      {/* B — Pipeline Status */}
      <div>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 12 }}>B — Pipeline Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { cat: "Bank Connected", color: T.green, icon: "BC" },
            { cat: "Form Submitted", color: T.blue,  icon: "FS" },
            { cat: "Incomplete",     color: T.amber, icon: "IC" },
          ].map(({ cat, color, icon }) => {
            const s = agg.pipelineStats[cat];
            return (
              <Card key={cat} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: FS.sm, fontWeight: FW.semibold, color: T.text }}>{cat}</div>
                  <span style={{ fontSize: FS.xs, fontFamily: "'IBM Plex Mono',monospace", color, fontWeight: FW.bold, letterSpacing: 0.5 }}>{icon}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: FW.extrabold, color, marginBottom: 12, fontVariantNumeric: "tabular-nums" }}>{s.count}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: FS.xs }}>
                  {[
                    ["Avg Score",  s.avgScore  !== null ? s.avgScore.toFixed(0)    : "—"],
                    ["Avg LTV",    s.avgLTV    !== null ? `${s.avgLTV.toFixed(1)}%`  : "—"],
                    ["Avg Effort", s.avgEffort !== null ? `${s.avgEffort.toFixed(1)}%` : "—"],
                    ["Avg Price",  s.avgPrice  !== null ? fmtEur(Math.round(s.avgPrice)) : "—"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ color: T.muted }}>{label}</div>
                      <div style={{ fontWeight: FW.semibold, color: T.text, marginTop: 2 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* C — Breakdowns */}
      <div>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 12 }}>C — Breakdowns</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <BreakdownChart title="Property Type"    counts={agg.propTypeCounts}   />
          <BreakdownChart title="Purpose"          counts={agg.purposeCounts}    />
          <BreakdownChart title="Employment"       counts={agg.employmentCounts} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 14 }}>
          <BreakdownChart title="Location"         counts={agg.locationCounts}   />
          <BreakdownChart title="Timeline"         counts={agg.timelineCounts}   />
          <Card style={{ padding: 18 }}>
            <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 14 }}>Buyers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(agg.buyerDist).map(([k, v]) => {
                const max = Math.max(...Object.values(agg.buyerDist), 1);
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: FS.xs, color: k.includes("2+") ? T.green : T.textSub, minWidth: 70 }}>{k}</span>
                    <CssBar value={v} max={max} color={k.includes("2+") ? T.green : T.blue} height={10} />
                    <span style={{ fontSize: FS.xs, color: T.muted, minWidth: 24, textAlign: "right" }}>{v}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 4: CALCULATOR ────────────────────────────────────────────────────────
function CalculadoraTab({ T }) {
  const [price, setPrice] = useState(300000);
  const [down,  setDown]  = useState(60000);
  const [term,  setTerm]  = useState(30);
  const [rate,  setRate]  = useState(3.5);

  const loanAmount = price - down;
  const ltv        = price > 0 ? (loanAmount / price) * 100 : 0;
  const monthlyAt  = r => calcMonthlyPaymentAt(loanAmount, term, r / 100);
  const monthly    = monthlyAt(rate);
  const incomeFor  = pct => monthly !== null && monthly > 0 ? (monthly / pct) * 100 : null;
  const RATES      = [3.0, 3.5, 4.0, 4.5];

  const NumInput = ({ label, value, setValue, min, max, step, suffix }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ ...LABEL_MONO, color: T.muted }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => setValue(Number(e.target.value))}
          style={{ padding: "8px 12px", borderRadius: R.md, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: FS.md, outline: "none", fontFamily: "'IBM Plex Mono',monospace", width: 150 }}
        />
        {suffix && <span style={{ fontSize: FS.sm, color: T.muted }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 900 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 20 }}>Mortgage Parameters</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 20, justifyContent: "start" }}>
          <NumInput label="Property Price" value={price} setValue={setPrice} min={0}   max={10000000} step={5000} suffix="€" />
          <NumInput label="Down Payment"   value={down}  setValue={setDown}  min={0}   max={price}    step={5000} suffix="€" />
          <NumInput label="Term"           value={term}  setValue={setTerm}  min={5}   max={40}       step={1}    suffix="yrs" />
          <NumInput label="Annual Rate"    value={rate}  setValue={setRate}  min={0.1} max={15}       step={0.1}  suffix="%" />
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 20 }}>Results</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div>
            <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 6 }}>Loan Amount</div>
            <div style={{ fontSize: 28, fontWeight: FW.extrabold, color: T.text }}>{fmtEur(loanAmount)}</div>
          </div>
          <div>
            <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 6 }}>LTV</div>
            <div style={{ fontSize: 28, fontWeight: FW.extrabold, color: ltvColor(ltv, T) }}>{ltv.toFixed(1)}%</div>
          </div>
          <div>
            <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 6 }}>Est. Monthly Payment</div>
            <div style={{ fontSize: 28, fontWeight: FW.extrabold, color: T.blue }}>
              {monthly !== null ? fmtEur(Math.round(monthly)) : "—"}
            </div>
            <div style={{ fontSize: FS.xs, color: T.muted, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
              at {rate}% p.a. · fixed rate assumed
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 16 }}>Monthly payment comparison by interest rate</div>
        <table style={{ borderCollapse: "collapse", fontSize: FS.sm, width: "100%" }}>
          <thead>
            <tr>
              {["Annual rate", "Monthly payment", "Total paid", "Total interest"].map(h => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATES.map(r => {
              const m     = monthlyAt(r);
              const total = m !== null ? m * term * 12 : null;
              const intrs = total !== null ? total - loanAmount : null;
              const isAct = Math.abs(r - rate) < 0.001;
              return (
                <tr key={r} style={{ borderBottom: `1px solid ${T.border}`, background: isAct ? `${T.blue}08` : "transparent" }}>
                  <td style={{ padding: "8px 14px", fontWeight: isAct ? FW.bold : FW.normal, color: isAct ? T.blue : T.text }}>{r.toFixed(1)}%{isAct ? " (current)" : ""}</td>
                  <td style={{ padding: "8px 14px", fontVariantNumeric: "tabular-nums", color: T.text }}>{m !== null ? fmtEur(Math.round(m)) : "—"}</td>
                  <td style={{ padding: "8px 14px", fontVariantNumeric: "tabular-nums", color: T.textSub }}>{total !== null ? fmtEur(Math.round(total)) : "—"}</td>
                  <td style={{ padding: "8px 14px", fontVariantNumeric: "tabular-nums", color: T.amber }}>{intrs !== null ? fmtEur(Math.round(intrs)) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ ...LABEL_MONO, color: T.muted, marginBottom: 16 }}>Minimum net income required (at {rate.toFixed(1)}%)</div>
        {monthly === null ? (
          <div style={{ color: T.muted, fontSize: FS.sm }}>Enter valid values to calculate.</div>
        ) : (
          <table style={{ borderCollapse: "collapse", fontSize: FS.sm }}>
            <thead>
              <tr>
                {["Target effort ratio", "Min. monthly net income"].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", ...LABEL_MONO, color: T.muted, borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[30, 33, 35, 40].map(pct => (
                <tr key={pct} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "8px 14px", color: pct <= 35 ? T.green : T.amber, fontWeight: FW.semibold }}>{pct}%</td>
                  <td style={{ padding: "8px 14px", color: T.text, fontVariantNumeric: "tabular-nums", fontWeight: FW.bold }}>
                    {incomeFor(pct) !== null ? fmtEur(Math.round(incomeFor(pct))) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 12, color: T.muted }}>
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ fontSize: FS.md, fontWeight: FW.semibold, color: T.textSub }}>No mortgage applications</div>
      <div style={{ fontSize: FS.sm, color: T.muted }}>Upload the Excel file to get started</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MortgageDashboard({ data }) {
  const { T } = useTheme();
  const [tab,             setTab]             = useState("leads");
  const [hotLeadsFilter,  setHotLeadsFilter]  = useState(false);
  const [showPersonalData, setShowPersonalData] = useState(true);

  const agg = useMemo(() => mortgageAggregates(data), [data]);

  const allLeads = useMemo(() => [
    ...(data["Bank Connected"] || []),
    ...(data["Form Submitted"] || []),
    ...(data["Incomplete"]     || []),
  ], [data]);

  const handleHotBanner = useCallback(() => {
    setTab("leads");
    setHotLeadsFilter(true);
  }, []);

  const switchTab = useCallback(t => {
    setTab(t);
    if (t !== "leads") setHotLeadsFilter(false);
  }, []);

  if (allLeads.length === 0) return <EmptyState T={T} />;

  return (
    <div style={{ fontFamily: "'Geist',sans-serif", color: T.text }}>
      <KpiStrip agg={agg} T={T} />

      {agg.hotLeads.length > 0 && (
        <HotLeadsBanner count={agg.hotLeads.length} onClick={handleHotBanner} T={T} />
      )}

      <MortgageTabBar tab={tab} setTab={switchTab} T={T} />

      <div style={{ padding: "24px 28px", maxWidth: 1600, margin: "0 auto" }}>
        {/* All tabs kept mounted for state caching — hidden via CSS */}
        <div style={{ display: tab === "leads" ? "block" : "none" }}>
          <SolicitudesTab
            allLeads={allLeads}
            hotLeadsFilter={hotLeadsFilter}
            setHotLeadsFilter={setHotLeadsFilter}
            showPersonalData={showPersonalData}
            setShowPersonalData={setShowPersonalData}
            T={T}
          />
        </div>
        <div style={{ display: tab === "riesgo" ? "block" : "none" }}>
          <RiesgoTab agg={agg} T={T} />
        </div>
        <div style={{ display: tab === "pipeline" ? "block" : "none" }}>
          <PipelineTab agg={agg} allLeads={allLeads} T={T} />
        </div>
        <div style={{ display: tab === "calculadora" ? "block" : "none" }}>
          <CalculadoraTab T={T} />
        </div>
      </div>
    </div>
  );
}
