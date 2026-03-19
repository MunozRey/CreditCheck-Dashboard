import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthGate from './components/AuthGate.jsx';             // C-01
import GdprBanner, { ClearDataButton } from './components/GdprBanner.jsx'; // C-03
import UploadZone from './components/UploadZone.jsx';
import ReportModal from './components/ReportModal.jsx';
import KeyboardHelp from './components/KeyboardHelp.jsx';
import CreditCheckerLogo from './components/CreditCheckerLogo.jsx';
import SettingsPanel, { DEFAULT_SETTINGS } from './components/SettingsPanel.jsx';
import MortgageDashboard from './components/MortgageDashboard.jsx';

import LeadsTab        from './tabs/LeadsTab.jsx';
import AnalyticsTab    from './tabs/AnalyticsTab.jsx';
import VerticalsTab    from './tabs/VerticalsTab.jsx';
import CountriesTab    from './tabs/CountriesTab.jsx';
import LeadScoringTab  from './tabs/LeadScoringTab.jsx';
import InsightsTab     from './tabs/InsightsTab.jsx';
import DataQualityTab  from './tabs/DataQualityTab.jsx';
import RevenueTab      from './tabs/RevenueTab.jsx';
import MultiPartnerTab from './tabs/MultiPartnerTab.jsx';

import { processRows }  from './utils/xlsxParser.js';
import DEFAULT_DATA      from './utils/defaultData.js';
import fetchLiveData     from './utils/fetchLiveData.js';
import { loadGIS, createTokenClient, requestToken, fetchGoogleUserInfo } from './utils/googleAuth.js';
import { newPartner }    from './utils/revenue.js';
import { fmtAgo }        from './utils/format.js';
import { T as THEME_T } from './constants/themes.js';

// Applies settings accent-color overrides onto the mutable T proxy.
// Must be called AFTER applyThemeBase so it overwrites the theme defaults.
function patchAccentColors(next) {
  if (THEME_T.isDark) return; // only override light theme
  THEME_T.blue      = next.accentBlue  || DEFAULT_SETTINGS.accentBlue;
  THEME_T.accent    = THEME_T.blue;
  THEME_T.accentGlow = THEME_T.blue + "1F";
  THEME_T.navy      = next.accentNavy  || DEFAULT_SETTINGS.accentNavy;
  THEME_T.green     = next.accentGreen || DEFAULT_SETTINGS.accentGreen;
  THEME_T.amber     = next.accentAmber || DEFAULT_SETTINGS.accentAmber;
  THEME_T.red       = next.accentRed   || DEFAULT_SETTINGS.accentRed;
}

const MAIN_TABS = [
  { id:"leads",     label:"Leads" },
  { id:"analytics", label:"Analytics" },
  { id:"verticals", label:"Verticals" },
  { id:"countries", label:"Countries" },
  { id:"scoring",   label:"Lead Scoring" },
  { id:"insights",  label:"Insights" },
  { id:"quality",   label:"Data Quality" },
  { id:"revenue",   label:"Revenue" },
  { id:"partners",  label:"Partners" },
];

const EMPTY_MORTGAGE = { "Bank Connected": [], "Form Submitted": [], "Incomplete": [] };

function AppInner() {
  const { T, theme, toggleTheme } = useTheme();

  const [data, setData]                       = useState(DEFAULT_DATA);
  const [mortgageData, setMortgageData]       = useState(EMPTY_MORTGAGE);
  const [dashboard, setDashboard]             = useState("credit");
  const [tab, setTab]                         = useState("leads");
  const [showUpload, setUpload]               = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showKeyHelp,     setShowKeyHelp]     = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);

  // ── Dashboard settings — persisted ────────────────────────────────────────
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const saveSettings = useCallback((next) => {
    patchAccentColors(next);
    setSettings(next);
    try { window.storage.set("cc_settings", JSON.stringify(next)).catch(()=>{}); } catch(_){}
  }, []);

  // Re-apply overrides whenever the theme toggles
  useEffect(() => { patchAccentColors(settings); }, [theme]); // eslint-disable-line

  // ── Starred leads ─────────────────────────────────────────────────────────
  const [starredEmails, setStarredEmails] = useState(new Set());

  const toggleStar = useCallback((email) => {
    if (!email) return;
    setStarredEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      try { window.storage.set("cc_starred", JSON.stringify([...next])).catch(()=>{}); } catch(_){}
      return next;
    });
  }, []);

  // ── Global date range filter ──────────────────────────────────────────────
  const [drFrom, setDrFrom] = useState("");
  const [drTo,   setDrTo]   = useState("");

  const filteredData = useMemo(() => {
    if (!drFrom && !drTo) return data;
    const filter = (arr) => (arr || []).filter(r => {
      const d = (r.created || "").slice(0, 10);
      if (drFrom && d < drFrom) return false;
      if (drTo   && d > drTo)   return false;
      return true;
    });
    return {
      "Bank Connected":  filter(data["Bank Connected"]),
      "Form Submitted":  filter(data["Form Submitted"]),
      "Incomplete":      filter(data["Incomplete"]),
    };
  }, [data, drFrom, drTo]);

  // ── Countdown to next auto-refresh ────────────────────────────────────────
  const [nextRefreshMins, setNextRefreshMins] = useState(60);
  useEffect(() => {
    const id = setInterval(() => setNextRefreshMins(m => Math.max(0, m - 1)), 60000);
    return () => clearInterval(id);
  }, []);
  const resetCountdown = useCallback(() => setNextRefreshMins(60), []);

  // ── Google OAuth 2.0 state (token in memory only — never persisted) ──────
  const GOOGLE_CLIENT_ID           = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [googleToken, setGoogleToken]   = useState(null);
  const [googleUser,  setGoogleUser]    = useState(null); // { email, name, picture }
  const googleTokenRef             = useRef(null);
  const tokenClientRef             = useRef(null);
  const tokenRefreshTimerRef       = useRef(null);

  const handleTokenSuccess = useCallback((response) => {
    const token     = response.access_token;
    const expiresIn = Number(response.expires_in) || 3600;
    googleTokenRef.current = token;
    setGoogleToken(token);
    clearTimeout(tokenRefreshTimerRef.current);
    tokenRefreshTimerRef.current = setTimeout(() => {
      if (tokenClientRef.current) requestToken(tokenClientRef.current, true);
    }, Math.max(0, (expiresIn - 300) * 1000));
    fetchGoogleUserInfo(token)
      .then(info => setGoogleUser({ email: info.email, name: info.name, picture: info.picture }))
      .catch(() => {});
    lastFetchRef.current = 0;
    runFetchCore(true, token);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    loadGIS()
      .then(() => {
        tokenClientRef.current = createTokenClient(
          GOOGLE_CLIENT_ID,
          handleTokenSuccess,
          (err) => console.warn('[GoogleAuth] Token error:', err),
        );
      })
      .catch(err => console.warn('[GoogleAuth] GIS load failed:', err));
    return () => clearTimeout(tokenRefreshTimerRef.current);
  }, [GOOGLE_CLIENT_ID, handleTokenSuccess]);

  // ── Live data fetch state ─────────────────────────────────────────────────
  const [liveStatus, setLiveStatus] = useState(null);
  const [fetching, setFetching]     = useState(false);
  const userUploadedRef             = useRef(false);
  // H-02: Rate limiting — track last fetch timestamp to enforce min interval
  const lastFetchRef                = useRef(0);
  const MIN_FETCH_INTERVAL_MS       = 5 * 60 * 1000; // 5 minutes minimum between manual fetches

  // Core fetch logic — accepts an explicit token so handleTokenSuccess can call it
  // with the freshly-minted token before React state has re-rendered.
  const runFetchCore = useCallback(async (force, token) => {
    if (userUploadedRef.current) return;
    if (!force && Date.now() - lastFetchRef.current < MIN_FETCH_INTERVAL_MS) return;
    lastFetchRef.current = Date.now();
    setFetching(true);
    try {
      const d = await fetchLiveData(processRows, token);
      setData(d);
      setLiveStatus({ ok:true, at:new Date() });
      resetCountdown();
    } catch(err) {
      if (err.isUnauthorized && tokenClientRef.current) {
        // 401 → re-trigger OAuth consent
        requestToken(tokenClientRef.current);
      }
      setLiveStatus({
        ok:false,
        err:err.message,
        isCors:!!err.isCors,
        isUnauthorized:!!err.isUnauthorized,
      });
    } finally {
      setFetching(false);
    }
  }, [resetCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const runFetch = useCallback((force = false) => {
    return runFetchCore(force, googleTokenRef.current);
  }, [runFetchCore]);

  // ── Partner / revenue state — persisted via window.storage ───────────────
  const [partners, setPartners]             = useState([newPartner("Partner A")]);
  const [partnerMonthData, setPartnerMonthData] = useState({});
  const [storageReady, setStorageReady]     = useState(false);

  // Fetch on mount + every 60 min — deferred until storageReady so that
  // a restored userUploadedRef flag can block the live fetch before it fires.
  useEffect(() => {
    if (!storageReady) return;
    runFetch();
    const id = setInterval(runFetch, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [runFetch, storageReady]);

  useEffect(() => {
    const fallback = setTimeout(() => setStorageReady(true), 3000);
    (async () => {
      try {
        const r1 = await window.storage.get("cc_partners");
        if (r1?.value) {
          const parsed = JSON.parse(r1.value);
          if (Array.isArray(parsed) && parsed.length > 0) setPartners(parsed);
        }
      } catch(_) {}
      try {
        const r2 = await window.storage.get("cc_month_data");
        if (r2?.value) {
          const parsed = JSON.parse(r2.value);
          if (parsed && typeof parsed === "object") setPartnerMonthData(parsed);
        }
      } catch(_) {}
      try {
        const r3 = await window.storage.get("cc_starred");
        if (r3?.value) {
          const parsed = JSON.parse(r3.value);
          if (Array.isArray(parsed)) setStarredEmails(new Set(parsed));
        }
      } catch(_) {}
      try {
        const r4 = await window.storage.get("cc_settings");
        if (r4?.value) {
          const parsed = JSON.parse(r4.value);
          if (parsed && typeof parsed === "object") setSettings(s => ({ ...s, ...parsed }));
        }
      } catch(_) {}
      try {
        const r5 = await window.storage.get("cc_mortgage_data");
        if (r5?.value) {
          const parsed = JSON.parse(r5.value);
          if (parsed && typeof parsed === "object") setMortgageData(parsed);
        }
      } catch(_) {}
      // Restore uploaded XLSX rows — must happen before storageReady triggers runFetch
      try {
        const rUploaded = await window.storage.get("cc_user_uploaded");
        if (rUploaded?.value === "true") {
          userUploadedRef.current = true;
          const rRows = await window.storage.get("cc_rows");
          if (rRows?.value) {
            const parsed = JSON.parse(rRows.value);
            if (parsed && typeof parsed === "object") setData(parsed);
          }
        }
      } catch(_) {}
      clearTimeout(fallback);
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.storage.set("cc_partners", JSON.stringify(partners)).catch(() => {});
  }, [partners, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.storage.set("cc_month_data", JSON.stringify(partnerMonthData)).catch(() => {});
  }, [partnerMonthData, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.storage.set("cc_mortgage_data", JSON.stringify(mortgageData)).catch(() => {});
  }, [mortgageData, storageReady]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const bc         = (filteredData["Bank Connected"] || []).length;
  const fs         = (filteredData["Form Submitted"] || []).length;
  const incomplete = (filteredData["Incomplete"]     || []).length;
  const total      = bc + fs; // active leads only — Incomplete/cancelled excluded

  const allDates = [...(data["Bank Connected"]||[]),...(data["Form Submitted"]||[]),...(data["Incomplete"]||[])]
    .map(r=>r.created).filter(Boolean).sort();
  const snapshotDate = allDates.length ? allDates[allDates.length-1] : null;

  const staleDays  = snapshotDate ? Math.floor((new Date()-new Date(snapshotDate))/86400000) : null;
  const staleHours = snapshotDate ? Math.floor((new Date()-new Date(snapshotDate))/3600000)  : null;

  // Mortgage lead count for badge
  const mortgageCount = useMemo(() => [
    ...(mortgageData["Bank Connected"]  || []),
    ...(mortgageData["Form Submitted"]  || []),
    ...(mortgageData["Incomplete"]      || []),
  ].length, [mortgageData]);

  const onData = useCallback(({ creditData, mortgageData: md }) => {
    userUploadedRef.current = true;
    setData(creditData);
    setMortgageData(md);
    setUpload(false);
    // Persist uploaded rows so they survive page reloads
    window.storage.set("cc_user_uploaded", "true").catch(() => {});
    window.storage.set("cc_rows", JSON.stringify(creditData)).catch(() => {});
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) { setShowKeyHelp(v => !v); return; }
      if (e.key === "Escape") { setShowKeyHelp(false); setShowReportModal(false); setUpload(false); return; }
      if (e.key === "d" || e.key === "D") { toggleTheme(); return; }
      if (e.key === "u" || e.key === "U") { setUpload(v => !v); return; }
      if (e.key === "e" || e.key === "E") { setShowReportModal(true); return; }
      const tabKeys = ["1","2","3","4","5","6","7","8","9"];
      const idx = tabKeys.indexOf(e.key);
      if (idx !== -1 && idx < MAIN_TABS.length) setTab(MAIN_TABS[idx].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTheme]);

  const isMortgage = dashboard === "mortgages";

  return (
    <div key={theme} style={{ fontFamily:"'Geist',sans-serif", background:T.bg, minHeight:"100vh", color:T.text }}>

      {/* ── NAVBAR ── */}
      <div data-cc="navbar" style={{ background:T.bg, position:"sticky", top:0, zIndex:100, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ padding:"0 24px", height:54, display:"flex", alignItems:"center", gap:10, maxWidth:1600, margin:"0 auto", width:"100%" }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, marginRight:8 }}>
            {settings.showOfficialLogo ? (
              <CreditCheckerLogo height={26} color={T.isDark ? "#fff" : T.navy} />
            ) : (
              <>
                <div style={{ width:30, height:30, background:`linear-gradient(135deg,${T.blue},${T.navy})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 0 1px ${T.blue}30,0 4px 12px ${T.blue}20`, flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M6.5 9.5L8 11L11.5 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, letterSpacing:-0.2, lineHeight:1, fontFamily:"'Playfair Display', serif", color:T.text }}>{settings.title || "CreditCheck"}</div>
                  <div style={{ fontSize:8, color:T.muted, fontWeight:500, letterSpacing:1.2, textTransform:"uppercase", fontFamily:"'IBM Plex Mono',monospace", marginTop:1 }}>{settings.subtitle || "Lead Intelligence"}</div>
                </div>
              </>
            )}
          </div>

          {/* Dashboard switcher pills */}
          <div style={{ display:"flex", gap:3, marginRight:8, background:T.surface2, borderRadius:8, padding:3, border:`1px solid ${T.border}`, flexShrink:0 }}>
            {[
              { id:"credit",    label:"CreditCheck" },
              { id:"mortgages", label:"Hipotecas"   },
            ].map(d => {
              const active = dashboard === d.id;
              return (
                <button key={d.id} onClick={() => setDashboard(d.id)} style={{
                  padding:"3px 12px", borderRadius:6, border:"none", cursor:"pointer",
                  background: active ? T.surface : "transparent",
                  color: active ? T.text : T.muted,
                  fontWeight: active ? 600 : 400, fontSize:11,
                  boxShadow: active ? `0 1px 4px ${T.border}` : "none",
                  fontFamily:"'Geist',sans-serif", position:"relative",
                  transition:"all .15s", display:"flex", alignItems:"center", gap:5,
                }}>
                  {d.label}
                  {d.id === "mortgages" && mortgageCount > 0 && (
                    <span style={{ background:T.blue, color:"#fff", borderRadius:9999, fontSize:9, padding:"0px 5px", fontWeight:700, lineHeight:"16px" }}>
                      {mortgageCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab nav — only shown in credit mode */}
          {!isMortgage && (
            <nav data-cc="tabbar" style={{ display:"flex", gap:0, flex:1, height:"100%", alignItems:"stretch" }}>
              {MAIN_TABS.filter(t => settings[`tab${t.id.charAt(0).toUpperCase() + t.id.slice(1)}`] !== false).map(t => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    padding:"0 14px", border:"none", background:"none", cursor:"pointer",
                    fontSize:11, fontWeight:active?600:400, letterSpacing:0.1,
                    color:active?T.text:T.muted,
                    borderBottom:`1.5px solid ${active?T.blue:"transparent"}`,
                    transition:"all .12s", fontFamily:"'Geist',sans-serif", whiteSpace:"nowrap",
                  }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.color=T.textSub; }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.color=T.muted; }}>
                    {t.label}
                  </button>
                );
              })}
            </nav>
          )}
          {isMortgage && <div style={{ flex:1 }} />}

          {/* Right controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>

            {/* Live status indicator — only in credit mode */}
            {!isMortgage && (() => {
              const dot = (color) => <div style={{ width:6, height:6, borderRadius:"50%", background:color, boxShadow:`0 0 7px ${color}`, flexShrink:0 }}/>;
              const wrap = (content) => (
                <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:6 }}>
                  {content}
                  <button className="cc-btn" onClick={() => runFetch(true)} disabled={fetching} title="Refresh live data" style={{ marginLeft:2, background:"none", border:"none", padding:"0 2px", cursor:fetching?"wait":"pointer", color:T.muted, fontSize:12, lineHeight:1, opacity:fetching?0.5:1 }}>
                    ↻
                  </button>
                </div>
              );
              // Show Google user avatar + email when authenticated
              const userBadge = googleUser && (
                <div title={googleUser.email} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 8px", background:T.surface3, border:`1px solid ${T.border}`, borderRadius:6 }}>
                  {googleUser.picture
                    ? <img src={googleUser.picture} alt="" width={16} height={16} style={{ borderRadius:"50%" }}/>
                    : <div style={{ width:16, height:16, borderRadius:"50%", background:T.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#fff", fontWeight:700 }}>{(googleUser.email||"?")[0].toUpperCase()}</div>
                  }
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{googleUser.email}</span>
                </div>
              );
              // "Connect with Google" button — shown when GIS is configured but no token yet
              const connectBtn = GOOGLE_CLIENT_ID && !googleToken && !fetching && (
                <button
                  className="cc-btn"
                  onClick={() => tokenClientRef.current && requestToken(tokenClientRef.current)}
                  title="Sign in with Google to load live data"
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"#fff", border:`1px solid ${T.border}`, borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:600, color:"#444", fontFamily:"'Geist',sans-serif", boxShadow:"0 1px 3px rgba(0,0,0,.1)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Connect with Google
                </button>
              );
              if (fetching && !liveStatus) return <>{connectBtn || wrap(<><div style={{ width:6, height:6, borderRadius:"50%", background:T.muted, animation:"cc-spin .8s linear infinite", flexShrink:0 }}/><span style={{ fontSize:10, color:T.muted, fontFamily:"'IBM Plex Mono',monospace" }}>Connecting…</span></>)}{userBadge}</>;
              if (liveStatus?.ok) {
                const mins  = Math.floor((Date.now()-liveStatus.at.getTime())/60000);
                const fresh = mins < 30;
                const color = fresh ? T.green : T.amber;
                const countdownLabel = nextRefreshMins > 0 ? `${nextRefreshMins}m` : "now";
                return <>{wrap(<>
                  {dot(color)}
                  <span style={{ fontSize:10, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:0.2 }}>Live · <span style={{ color }}>{fmtAgo(liveStatus.at)}</span></span>
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:0.1, borderLeft:`1px solid ${T.border}`, paddingLeft:5 }} title="Next auto-refresh">↺ {countdownLabel}</span>
                </>)}{userBadge}</>;
              }
              if (liveStatus && !liveStatus.ok) {
                return <>{connectBtn || wrap(<>{dot(liveStatus.isUnauthorized ? T.amber : T.red)}<span style={{ fontSize:10, color:liveStatus.isUnauthorized ? T.amber : T.red, fontFamily:"'IBM Plex Mono',monospace" }}>{liveStatus.isUnauthorized ? "Auth required" : "Offline"}</span></>)}{userBadge}</>;
              }
              if (connectBtn) return <>{connectBtn}{userBadge}</>;
              if (snapshotDate) return <>{wrap(<>{dot(staleDays>=3?T.red:staleDays>=1?T.amber:T.green)}<span style={{ fontSize:10, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:0.3 }}>{snapshotDate}</span></>)}{userBadge}</>;
              return null;
            })()}

            {/* Keyboard help */}
            <button className="cc-btn" onClick={() => setShowKeyHelp(v => !v)} title="Keyboard shortcuts (?)" style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`, background:showKeyHelp?T.navy:T.surface2, color:showKeyHelp?"#fff":T.muted, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'IBM Plex Mono',monospace", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>?</button>

            {/* Theme toggle */}
            <button
              className="cc-btn"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              style={{ width:32, height:32, borderRadius:7, border:`1px solid ${T.border}`, background:T.surface2, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, flexShrink:0, cursor:"pointer" }}>
              {theme === "light"
                ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              }
            </button>

            {/* Save indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6, opacity:storageReady?1:0.4, transition:"opacity .3s" }} title="Auto-saved">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M8.5 6.5v1.5a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V6.5M5 1v5M3 4l2 2 2-2" stroke={storageReady?T.green:T.muted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize:9, color:storageReady?T.green:T.muted, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:0.5 }}>{storageReady?"SAVED":"..."}</span>
            </div>

            {/* Settings button */}
            <button className="cc-btn" onClick={() => setShowSettings(v => !v)} title="Dashboard settings" style={{ width:28, height:28, borderRadius:6, border:`1px solid ${showSettings?T.blue:T.border}`, background:showSettings?`${T.blue}15`:T.surface2, color:showSettings?T.blue:T.muted, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M8.325 2.317a1.75 1.75 0 013.35 0 1.75 1.75 0 002.393.98 1.75 1.75 0 012.369 2.369 1.75 1.75 0 00.98 2.393 1.75 1.75 0 010 3.35 1.75 1.75 0 00-.98 2.393 1.75 1.75 0 01-2.369 2.369 1.75 1.75 0 00-2.393.98 1.75 1.75 0 01-3.35 0 1.75 1.75 0 00-2.393-.98 1.75 1.75 0 01-2.369-2.369 1.75 1.75 0 00-.98-2.393 1.75 1.75 0 010-3.35 1.75 1.75 0 00.98-2.393 1.75 1.75 0 012.369-2.369 1.75 1.75 0 002.393-.98z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </button>

            {/* C-03: GDPR — Clear Data button */}
            <ClearDataButton T={T} onClearData={() => {
              const keys = ['cc_partners','cc_month_data','cc_starred','cc_settings'];
              keys.forEach(k => { try { window.storage?.set(k,'').catch(()=>{}); } catch(_){} });
              window.location.reload();
            }} />

            {/* Export button */}
            <button className="cc-btn" onClick={() => setShowReportModal(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSub, fontWeight:500, fontSize:11, cursor:"pointer", fontFamily:"'Geist',sans-serif", letterSpacing:0.1 }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 1v7M3 5.5l3 3 3-3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export
            </button>

            {/* Upload button */}
            <button className="cc-btn" onClick={() => setUpload(v => !v)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:showUpload?T.blue:T.surface2, border:`1px solid ${showUpload?T.blue:T.border}`, borderRadius:7, color:showUpload?"#fff":T.textSub, fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"'Geist',sans-serif", letterSpacing:0.1, boxShadow:showUpload?"0 0 0 3px rgba(59,130,246,0.15)":"none" }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 12 12"><path d="M6 9V2M3 4.5L6 1.5l3 3M1 9.5v1a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Upload XLSX
            </button>
          </div>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"16px 24px" }}>
          <UploadZone onData={onData}/>
        </div>
      )}

      {/* ── MORTGAGE DASHBOARD ── */}
      {isMortgage && <MortgageDashboard data={mortgageData} />}

      {/* ── CREDIT DASHBOARD ── */}
      {!isMortgage && <>

        {/* Global date filter bar */}
        {settings.showDateRangeBar !== false && <div data-cc="date-range-bar" style={{ background:T.surface2, borderBottom:`1px solid ${T.border}`, padding:"7px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, maxWidth:1600, margin:"0 auto" }}>
            <span style={{ fontSize:9, fontWeight:700, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"'IBM Plex Mono',monospace", flexShrink:0 }}>Date Range</span>
            <input type="date" value={drFrom} onChange={e => setDrFrom(e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:T.text, outline:"none", background:T.surface, fontFamily:"'IBM Plex Mono',monospace" }} />
            <span style={{ fontSize:11, color:T.muted }}>→</span>
            <input type="date" value={drTo} onChange={e => setDrTo(e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:T.text, outline:"none", background:T.surface, fontFamily:"'IBM Plex Mono',monospace" }} />
            {(drFrom || drTo) && (
              <>
                <button onClick={() => { setDrFrom(""); setDrTo(""); }} style={{ padding:"3px 10px", borderRadius:5, border:`1px solid ${T.border}`, background:T.surface, color:T.red, fontSize:10, fontWeight:700, cursor:"pointer" }}>✕ Clear</button>
                <span style={{ fontSize:10, color:T.amber, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>
                  {(drFrom || drTo) && `${total} leads in range`}
                </span>
              </>
            )}
            {!drFrom && !drTo && (
              <span style={{ fontSize:10, color:T.muted, fontFamily:"'IBM Plex Mono',monospace" }}>Showing all dates — select range to filter all tabs</span>
            )}
          </div>
        </div>}

        {/* KPI strip */}
        <div data-cc="kpi-strip" style={{ background:T.surface, borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${[settings.kpiTotal,settings.kpiBC,settings.kpiFS,settings.kpiIncomplete].filter(v=>v!==false).length},1fr)`, maxWidth:1600, margin:"0 auto" }}>
            {[
              { key:"kpiTotal",      label:"Total Leads",     value:total>0?total:"—",           sub:"unique · deduplicated",                                     color:T.text,  accent:T.blue,  icon:"◈" },
              { key:"kpiBC",         label:"Bank Connected",  value:bc>0?bc:"—",                 sub:`${bc+fs>0?Math.round(bc/(bc+fs)*100):0}% of active leads`,  color:T.green, accent:T.green, icon:"✓" },
              { key:"kpiFS",         label:"Form Submitted",  value:fs>0?fs:"—",                 sub:"Pending bank connection",                                   color:T.blue,  accent:T.blue,  icon:"◷" },
              { key:"kpiIncomplete", label:"Incomplete",      value:incomplete>0?incomplete:"—", sub:"Cancelled / dropped off",                                   color:T.amber, accent:T.amber, icon:"◌" },
            ].filter(k => settings[k.key] !== false).map((k, i, arr) => (
              <div data-cc="kpi-card" key={k.key} style={{ padding:"20px 24px 18px", borderRight:i<arr.length-1?`1px solid ${T.border}`:"none", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:`linear-gradient(90deg,${k.accent}60,transparent)` }}/>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:9, fontWeight:600, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10, fontFamily:"'IBM Plex Mono',monospace" }}>{k.label}</div>
                    <div style={{ fontSize:34, fontWeight:800, color:k.color, letterSpacing:-1.5, lineHeight:1, fontVariantNumeric:"tabular-nums", fontFamily:"'Geist',sans-serif" }}>{k.value}</div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:6, fontFamily:"'IBM Plex Mono',monospace" }}>{k.sub}</div>
                  </div>
                  <div style={{ fontSize:22, color:`${k.accent}40`, fontWeight:300, marginTop:4, fontFamily:"'Geist',sans-serif" }}>{k.icon}</div>
                </div>
                {k.key==="kpiBC" && bc>0 && fs>0 && (
                  <div style={{ position:"absolute", bottom:16, right:16, fontSize:10, fontWeight:700, color:T.green, background:T.greenBg, padding:"2px 8px", borderRadius:4, border:`1px solid ${T.green}30`, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:0.5 }}>
                    {Math.round(bc/(bc+fs)*100)}% BC
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live / offline / stale banner */}
        {(() => {
          if (liveStatus?.ok && !userUploadedRef.current) {
            const mins  = Math.floor((Date.now()-liveStatus.at.getTime())/60000);
            if (mins < 30) return (
              <div style={{ padding:"6px 24px", fontSize:11, background:T.greenBg, borderBottom:`1px solid ${T.green}30`, display:"flex", alignItems:"center", gap:8, fontFamily:"'IBM Plex Mono',monospace" }}>
                <span style={{ fontSize:12 }}>🟢</span>
                <strong style={{ color:T.green }}>Live data</strong>
                <span style={{ color:T.muted }}>— Auto-refreshes every 60 min · Updated {fmtAgo(liveStatus.at)}</span>
              </div>
            );
            return (
              <div style={{ padding:"6px 24px", fontSize:11, background:T.amberBg, borderBottom:`1px solid ${T.amber}30`, display:"flex", alignItems:"center", gap:8, fontFamily:"'IBM Plex Mono',monospace" }}>
                <span style={{ fontSize:12 }}>🟡</span>
                <strong style={{ color:T.amber }}>Live · {fmtAgo(liveStatus.at)}</strong>
                <span style={{ color:T.muted }}>— Data may be stale · <button className="cc-btn" onClick={runFetch} style={{ background:"none", border:"none", padding:0, color:T.blue, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>Refresh now</button></span>
              </div>
            );
          }
          if (liveStatus && !liveStatus.ok && liveStatus.isCors) return (
            <div style={{ padding:"6px 24px", fontSize:11, background:T.amberBg, borderBottom:`1px solid ${T.amber}30`, display:"flex", alignItems:"center", gap:8, fontFamily:"'IBM Plex Mono',monospace" }}>
              <span style={{ fontSize:12 }}>⚠️</span>
              <strong style={{ color:T.amber }}>Auto-fetch unavailable</strong>
              <span style={{ color:T.muted }}>— Upload XLSX manually or configure a CORS proxy. {!userUploadedRef.current && snapshotDate && <>Showing sample data.</>}</span>
            </div>
          );
          if (liveStatus && !liveStatus.ok) return (
            <div style={{ padding:"6px 24px", fontSize:11, background:T.redBg, borderBottom:`1px solid ${T.red}30`, display:"flex", alignItems:"center", gap:8, fontFamily:"'IBM Plex Mono',monospace" }}>
              <span style={{ fontSize:12 }}>🔴</span>
              <strong style={{ color:T.red }}>Offline · Using cached data</strong>
              <span style={{ color:T.muted }}>— {liveStatus.err} · <button className="cc-btn" onClick={runFetch} style={{ background:"none", border:"none", padding:0, color:T.blue, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>Retry</button></span>
            </div>
          );
          if (userUploadedRef.current && staleHours >= 2) return (
            <div style={{ padding:"7px 24px", fontSize:11, background:staleDays>=3?T.redBg:staleDays>=1?T.amberBg:T.greenBg, borderBottom:`1px solid ${staleDays>=3?T.red+"30":staleDays>=1?T.amber+"30":T.green+"30"}`, display:"flex", alignItems:"center", gap:8, fontFamily:"'IBM Plex Mono',monospace" }}>
              <span style={{ fontSize:13 }}>{staleDays>=3?"🔴":staleDays>=1?"🟡":"🟢"}</span>
              <strong style={{ color:staleDays>=3?T.red:staleDays>=1?T.amber:T.green }}>
                Snapshot {staleDays>=1?`${staleDays} day${staleDays>1?"s":""}`:`${staleHours}h`} old
              </strong>
              <span style={{ color:T.muted }}>— Last record: <strong>{snapshotDate}</strong> · Upload a newer XLSX to include recent leads.</span>
            </div>
          );
          return null;
        })()}

        {/* Tab content */}
        <div key={`tab-${theme}`} data-cc="tab-content" className="cc-tab-content" style={{ padding:"24px 28px", maxWidth:1600, margin:"0 auto" }}>
          {tab==="leads"     && <LeadsTab        data={filteredData} starredEmails={starredEmails} toggleStar={toggleStar} defaultCat={settings.defaultCat} defaultSort={settings.defaultSort}/>}
          {tab==="analytics" && <AnalyticsTab    data={filteredData}/>}
          {tab==="verticals" && <VerticalsTab    data={filteredData}/>}
          {tab==="countries" && <CountriesTab    data={filteredData}/>}
          {tab==="scoring"   && <LeadScoringTab  data={filteredData}/>}
          {tab==="insights"  && <InsightsTab     data={filteredData}/>}
          {tab==="quality"   && <DataQualityTab  data={filteredData}/>}
          {tab==="revenue"   && <RevenueTab      partners={partners} monthData={partnerMonthData}/>}
          {tab==="partners"  && <MultiPartnerTab partners={partners} setPartners={setPartners} monthData={partnerMonthData} setMonthData={setPartnerMonthData}/>}
        </div>
      </>}

      {/* C-03: GDPR consent modal + retention warning */}
      <GdprBanner
        T={T}
        snapshotDate={snapshotDate}
        onClearData={() => {
          const keys = ['cc_partners','cc_month_data','cc_starred','cc_settings'];
          keys.forEach(k => { try { window.storage?.set(k,'').catch(()=>{}); } catch(_){} });
          window.location.reload();
        }}
      />

      {/* Report / Export modal */}
      {showReportModal && (
        <ReportModal data={filteredData} onClose={() => setShowReportModal(false)}/>
      )}

      {/* Keyboard help overlay */}
      {showKeyHelp && <KeyboardHelp onClose={() => setShowKeyHelp(false)} />}

      {/* Settings panel */}
      {showSettings && <SettingsPanel settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      {/* C-01: AuthGate — password prompt if VITE_AUTH_PASSWORD_HASH is set */}
      <AuthGate>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </AuthGate>
    </ThemeProvider>
  );
}
