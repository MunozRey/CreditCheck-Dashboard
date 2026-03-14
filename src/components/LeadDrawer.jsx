import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { scoreLead } from '../utils/scoring.js';
import Avatar from './Avatar.jsx';
import { toTitleCase } from '../utils/format.js';

// ── Score factor breakdown (mirrors scoreLead logic) ─────────────────────────
function computeFactors(r) {
  const inc  = parseFloat(r.income)    || 0;
  const exp  = parseFloat(r.expenses)  || 0;
  const loan = parseFloat(r.loanAmount)|| 0;
  const emp  = (r.employment || "").toLowerCase();
  const age  = parseFloat(r.age) || 0;

  let incPts = 0;
  if      (inc >= 3500) incPts = 25;
  else if (inc >= 2500) incPts = 20;
  else if (inc >= 2000) incPts = 15;
  else if (inc >= 1500) incPts = 9;
  else if (inc >= 1000) incPts = 4;

  let dtiPts = 10; // default when no data
  if (inc > 0 && exp > 0) {
    const dti = exp / inc;
    if      (dti < 0.30) dtiPts = 25;
    else if (dti < 0.35) dtiPts = 19;
    else if (dti < 0.40) dtiPts = 12;
    else if (dti < 0.50) dtiPts = 5;
    else                 dtiPts = 0;
  }

  let ltiPts = 8; // default when no data
  if (loan > 0 && inc > 0) {
    const lti = loan / (inc * 12);
    if      (lti <= 0.5) ltiPts = 15;
    else if (lti <= 1.0) ltiPts = 11;
    else if (lti <= 2.0) ltiPts = 6;
    else if (lti <= 3.0) ltiPts = 2;
    else                 ltiPts = 0;
  }

  let empPts = 0;
  if      (emp === "civil_servant")             empPts = 15;
  else if (emp === "employed")                  empPts = 13;
  else if (emp === "self_employed")             empPts = 10;
  else if (emp === "retired")                   empPts = 9;
  else if (emp === "part_time")                 empPts = 5;
  else if (emp && emp !== "unemployed")         empPts = 4;

  const emailPts = r.emailVerified ? 10 : 0;
  const namePts  = (r.name || "").trim().split(/\s+/).length >= 2 ? 5 : 0;

  let agePts = 0;
  if      (age >= 30 && age <= 55) agePts = 5;
  else if (age >= 25 && age <= 65) agePts = 3;
  else if (age > 0)                agePts = 1;

  return [
    { label: "Monthly Income",  earned: incPts,   max: 25, detail: inc ? `€${inc.toLocaleString()}/mo` : "—" },
    { label: "DTI Ratio",       earned: dtiPts,   max: 25, detail: inc > 0 && exp > 0 ? `${(exp/inc*100).toFixed(0)}%` : "—" },
    { label: "Loan-to-Income",  earned: ltiPts,   max: 15, detail: loan > 0 && inc > 0 ? `${(loan/(inc*12)).toFixed(2)}×` : "—" },
    { label: "Employment",      earned: empPts,   max: 15, detail: emp ? emp.replace(/_/g, " ") : "—" },
    { label: "Email Verified",  earned: emailPts, max: 10, detail: r.emailVerified ? "Verified" : "Not verified" },
    { label: "Full Name",       earned: namePts,  max: 5,  detail: r.name ? `${(r.name||"").trim().split(/\s+/).length} word(s)` : "—" },
    { label: "Age Fit",         earned: agePts,   max: 5,  detail: age ? `${age} yrs` : "—" },
  ];
}

function MiniBar({ pct, color, bg }) {
  return (
    <div style={{ flex: 1, height: 5, background: bg, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s ease" }} />
    </div>
  );
}

function FieldRow({ label, value, mono, T }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 0.3, flexShrink: 0, width: 120, paddingRight: 8 }}>{label}</span>
      <span style={{
        fontSize: 11, fontWeight: 500, color: T.text, textAlign: "right",
        fontFamily: mono ? "'IBM Plex Mono',monospace" : "inherit",
        wordBreak: "break-all",
      }}>{value || "—"}</span>
    </div>
  );
}

export default function LeadDrawer({ lead, onClose }) {
  const { T } = useTheme();
  const [copied, setCopied]           = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Close on ESC key
  React.useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!lead) return null;

  const score   = scoreLead(lead);
  const grade   = score >= 75 ? "A" : score >= 50 ? "B" : score >= 30 ? "C" : "D";
  const gColor  = score >= 75 ? T.green : score >= 50 ? T.blue : score >= 30 ? T.amber : T.red;
  const factors = computeFactors(lead);

  const catColor = lead.cat === "Bank Connected" ? T.green
                 : lead.cat === "Incomplete" ? T.amber
                 : T.blue;

  const handleCopy = () => {
    try {
      const { cat: _c, ...rest } = lead;
      navigator.clipboard.writeText(JSON.stringify(rest, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch(_) {}
  };

  const handleCopyEmail = () => {
    if (!lead.email) return;
    try {
      navigator.clipboard.writeText(lead.email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 1800);
    } catch(_) {}
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, backdropFilter: "blur(2px)" }} />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 400,
        background: T.surface, borderLeft: `1px solid ${T.border}`,
        zIndex: 201, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        animation: "cc-drawer-in .18s ease",
      }}>
        <style>{`@keyframes cc-drawer-in { from { transform: translateX(32px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, background: T.surface2, flexShrink: 0 }}>
          <Avatar name={toTitleCase(lead.name)} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {lead.name ? toTitleCase(lead.name) : "Unknown"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`,
                fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.4, textTransform: "uppercase" }}>
                {lead.cat}
              </span>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: gColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{grade}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: gColor }}>{score}/100</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {lead.email && (
              <button onClick={handleCopyEmail} title="Copy email address" style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${emailCopied ? T.green : T.border}`, background: emailCopied ? T.green : T.surface, color: emailCopied ? "#fff" : T.muted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", transition: "all .15s" }}>
                {emailCopied ? "✓ Email copied" : "@ Copy email"}
              </button>
            )}
            <button onClick={handleCopy} title="Copy as JSON" style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: copied ? T.green : T.surface, color: copied ? "#fff" : T.muted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", transition: "all .15s" }}>
              {copied ? "✓ Copied" : "</> JSON"}
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* Score breakdown */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, fontFamily: "'IBM Plex Mono',monospace" }}>Score Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {factors.map(f => (
                <div key={f.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: T.textSub, fontWeight: 500 }}>{f.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{f.detail}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: f.earned === f.max ? T.green : f.earned === 0 ? T.red : T.amber, fontFamily: "'IBM Plex Mono',monospace", width: 36, textAlign: "right" }}>
                        {f.earned}/{f.max}
                      </span>
                    </div>
                  </div>
                  <MiniBar pct={f.earned / f.max * 100} color={f.earned === f.max ? T.green : f.earned === 0 ? `${T.red}60` : T.blue} bg={T.surface2} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, height: 1, background: T.border }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 0.3 }}>Total Score</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: gColor, fontFamily: "'IBM Plex Mono',monospace" }}>{score}<span style={{ fontSize: 11, color: T.muted }}>/100</span></span>
            </div>
          </div>

          {/* Contact & Identity */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>Contact & Identity</div>
            <FieldRow label="Email"       value={lead.email}                              mono T={T} />
            <FieldRow label="Age"         value={lead.age ? `${lead.age} years` : null}  T={T} />
            <FieldRow label="Language"    value={lead.language}                           T={T} />
            <FieldRow label="Country"     value={lead.country}                            T={T} />
            <FieldRow label="Created"     value={lead.created}                            mono T={T} />
          </div>

          {/* Financial Profile */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>Financial Profile</div>
            <FieldRow label="Monthly Income"    value={lead.income    ? `€${Number(lead.income).toLocaleString()}` : null}    mono T={T} />
            <FieldRow label="Monthly Expenses"  value={lead.expenses  ? `€${Number(lead.expenses).toLocaleString()}` : null}  mono T={T} />
            <FieldRow label="Loan Amount"       value={lead.loanAmount ? `€${Number(lead.loanAmount).toLocaleString()}` : null} mono T={T} />
            <FieldRow label="Loan Term"         value={lead.loanMonths ? `${lead.loanMonths} months` : null}                   T={T} />
            <FieldRow label="Existing Loans"    value={lead.existingLoans}                                                     T={T} />
            <FieldRow label="Accommodation"     value={lead.accomCost ? `€${Number(lead.accomCost).toLocaleString()}/mo` : null} mono T={T} />
          </div>

          {/* Loan Purpose & Work */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>Loan & Work</div>
            <FieldRow label="Purpose"           value={lead.purpose    ? lead.purpose.replace(/_/g, " ") : null}            T={T} />
            <FieldRow label="Employment"        value={lead.employment ? lead.employment.replace(/_/g, " ") : null}         T={T} />
            <FieldRow label="Residential"       value={lead.residential}                                                    T={T} />
          </div>

          {/* Verification */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>Verification</div>
            <FieldRow label="Email Verified"    value={lead.emailVerified ? "✓ Verified" : "✗ Pending"}    T={T} />
            <FieldRow label="PDF Generated"     value={lead.pdfGenerated  ? "Yes" : "No"}                  T={T} />
            <FieldRow label="Verification"      value={lead.verif}                                          T={T} />
            <FieldRow label="Emergency"         value={lead.emergency ? "Yes" : "No"}                      T={T} />
          </div>

        </div>
      </div>
    </>
  );
}
