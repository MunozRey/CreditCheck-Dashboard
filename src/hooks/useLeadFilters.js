// ─── useLeadFilters ───────────────────────────────────────────────────────────
// Encapsulates all filter + sort state for the Leads table.
// Returns derived values (filtered rows, option lists, flags) alongside
// setters so the consuming component stays declarative.
//
// Sort direction is bidirectional — call toggleSort(key) to switch columns or
// reverse direction on the current column. The indicator (↑/↓) is derived from
// sortDir so the component doesn't need its own direction logic.

import { useState, useMemo } from 'react';
import { scoreLead } from '../utils/scoring.js';

/**
 * @param {object} params
 * @param {Array}  params.allLeads      - Pre-sliced array for the active category
 * @param {Set}    params.starredEmails - Set of starred email addresses
 * @param {string} params.defaultSort   - Initial sort key (default: "created")
 */
export function useLeadFilters({ allLeads, starredEmails = new Set(), defaultSort = "created" }) {
  const [search,         setSearch]         = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [sortBy,         setSortBy]         = useState(defaultSort);
  const [sortDir,        setSortDir]        = useState("desc");
  const [starOnly,       setStarOnly]       = useState(false);
  const [loanPurposeFilters, setLoanPurposeFilters] = useState(new Set());
  const [empFilter,      setEmpFilter]      = useState("all");
  const [countryFilter,  setCountryFilter]  = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  // Derived option lists for dropdowns
  const allPurposes  = useMemo(() => [...new Set(allLeads.map(r => r.purpose).filter(Boolean))].sort(),              [allLeads]);
  const allCountries = useMemo(() => [...new Set(allLeads.map(r => r.country).filter(Boolean))].sort(),              [allLeads]);
  const allEmp       = useMemo(() => [...new Set(allLeads.map(r => r.employment || "").filter(Boolean))].sort(),     [allLeads]);

  const filtered = useMemo(() => {
    let rows = allLeads;

    if (starOnly)                rows = rows.filter(r => starredEmails.has(r.email));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.name    || "").toLowerCase().includes(q) ||
        (r.email   || "").toLowerCase().includes(q) ||
        (r.purpose || "").toLowerCase().includes(q)
      );
    }
    if (dateFrom)                rows = rows.filter(r => r.created && r.created.slice(0, 10) >= dateFrom);
    if (dateTo)                  rows = rows.filter(r => r.created && r.created.slice(0, 10) <= dateTo);
    if (loanPurposeFilters.size > 0) rows = rows.filter(r => loanPurposeFilters.has(r.purpose));
    if (empFilter      !== "all") rows = rows.filter(r => (r.employment || "")     === empFilter);
    if (countryFilter  !== "all") rows = rows.filter(r => (r.country    || "")     === countryFilter);
    if (verifiedFilter === "verified")   rows = rows.filter(r =>  r.emailVerified);
    if (verifiedFilter === "unverified") rows = rows.filter(r => !r.emailVerified);

    return [...rows].sort((a, b) => {
      let cmp = 0;
      if      (sortBy === "name")    cmp = (a.name    || "").localeCompare(b.name    || "");
      else if (sortBy === "purpose") cmp = (a.purpose || "").localeCompare(b.purpose || "");
      else if (sortBy === "country") cmp = (a.country || "").localeCompare(b.country || "");
      else if (sortBy === "score")   cmp = scoreLead(a) - scoreLead(b);
      else /* created */             cmp = (a.created || "").localeCompare(b.created || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allLeads, search, dateFrom, dateTo, sortBy, sortDir, loanPurposeFilters, empFilter, countryFilter, verifiedFilter, starOnly, starredEmails]);

  const hasFilters = !!(
    search ||
    dateFrom ||
    dateTo ||
    loanPurposeFilters.size > 0 ||
    empFilter      !== "all" ||
    countryFilter  !== "all" ||
    verifiedFilter !== "all" ||
    starOnly
  );

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setLoanPurposeFilters(new Set());
    setEmpFilter("all");
    setCountryFilter("all");
    setVerifiedFilter("all");
    setStarOnly(false);
  };

  /** Click a column header: same column → flip direction; new column → sort desc by default */
  const toggleSort = (key) => {
    if (key === sortBy) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  /** Sort indicator string for column headers */
  const sortIndicator = (key) => (sortBy === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  return {
    // Filter state + setters
    search,         setSearch,
    dateFrom,       setDateFrom,
    dateTo,         setDateTo,
    starOnly,       setStarOnly,
    loanPurposeFilters, setLoanPurposeFilters,
    empFilter,      setEmpFilter,
    countryFilter,  setCountryFilter,
    verifiedFilter, setVerifiedFilter,
    // Sort state
    sortBy, sortDir, toggleSort, sortIndicator,
    // Derived option lists
    allPurposes, allCountries, allEmp,
    // Results
    filtered, hasFilters, clearFilters,
  };
}
