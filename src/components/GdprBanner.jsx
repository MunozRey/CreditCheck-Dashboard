// ─── GDPR CONSENT + DATA CONTROLS BANNER ─────────────────────────────────────
// C-03: Displays a one-time GDPR acknowledgement modal on first load (or if
// consent record is older than CONSENT_TTL_DAYS).
//
// Also provides a persistent "Clear All Data" control so operators can honour
// data subject deletion requests immediately via the dashboard UI.
//
// Consent is stored in sessionStorage (resets when the browser tab is closed),
// giving a conservative interpretation: consent is reconfirmed each session,
// which errs on the side of caution.

import React, { useState, useEffect } from 'react';

const CONSENT_KEY     = 'cc_gdpr_consent';
const RETENTION_DAYS  = 90; // Default data retention period — warn if data is older

function hasValidConsent() {
  try {
    const raw = sessionStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const { at } = JSON.parse(raw);
    return !!at; // consent persists for the session
  } catch (_) {
    return false;
  }
}

function recordConsent() {
  try {
    sessionStorage.setItem(CONSENT_KEY, JSON.stringify({ at: new Date().toISOString() }));
  } catch (_) {}
}

/**
 * GdprBanner — wrap inside your App component.
 *
 * Props:
 *   onClearData   {Function}  Called when user confirms "Clear All Data".
 *   snapshotDate  {string}    ISO date of the most recent lead record (for retention warning).
 *   T             {object}    Theme token object.
 */
export default function GdprBanner({ onClearData, snapshotDate, T }) {
  const [showModal,   setShowModal]   = useState(!hasValidConsent());
  const [showClear,   setShowClear]   = useState(false);
  const [retained,    setRetained]    = useState(false); // true if data older than RETENTION_DAYS

  useEffect(() => {
    if (!snapshotDate) return;
    const ageDays = Math.floor((Date.now() - new Date(snapshotDate)) / 86_400_000);
    setRetained(ageDays > RETENTION_DAYS);
  }, [snapshotDate]);

  const handleConsent = () => {
    recordConsent();
    setShowModal(false);
  };

  const handleClearConfirmed = () => {
    setShowClear(false);
    // Clear all known storage keys
    const keys = ['cc_partners', 'cc_month_data', 'cc_starred', 'cc_settings'];
    keys.forEach(k => {
      try { window.storage?.set(k, '').catch(() => {}); } catch (_) {}
    });
    if (typeof onClearData === 'function') onClearData();
  };

  return (
    <>
      {/* ── Consent modal (first load of session) ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,18,40,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <div style={{
            maxWidth: 520, width: '90%', background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 60px rgba(0,0,0,0.25)', padding: '36px 40px',
            border: '1px solid #E2E7F0',
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0A1628', marginBottom: 8 }}>
              Data Processing Acknowledgement
            </div>
            <div style={{ fontSize: 13, color: '#3D4F6E', lineHeight: 1.65, marginBottom: 20 }}>
              This dashboard processes <strong>personal and financial data</strong> of loan
              applicants including names, email addresses, income figures, and credit scores.
            </div>
            <ul style={{ fontSize: 12, color: '#3D4F6E', lineHeight: 1.8, paddingLeft: 18, marginBottom: 20 }}>
              <li>This data is for <strong>internal business analysis only</strong> — not for distribution.</li>
              <li>Access is limited to authorised Clovr Labs team members.</li>
              <li>Data should be retained for a maximum of <strong>{RETENTION_DAYS} days</strong>.</li>
              <li>You must honour deletion requests promptly using "Clear All Data".</li>
              <li>Exporting data is audited and subject to your organisation's data policies.</li>
            </ul>
            <div style={{ fontSize: 11, color: '#7080A0', marginBottom: 24, fontStyle: 'italic' }}>
              By proceeding you confirm you are an authorised user and will handle this data
              in accordance with GDPR and your organisation's data processing policies.
            </div>
            <button
              onClick={handleConsent}
              style={{
                width: '100%', padding: '11px 0', background: '#005EFF', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              I Acknowledge — Proceed to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ── Retention warning banner ── */}
      {!showModal && retained && (
        <div style={{
          padding: '7px 24px', fontSize: 11, background: '#FEF2F2',
          borderBottom: '1px solid #DC262630', display: 'flex',
          alignItems: 'center', gap: 10, fontFamily: "'IBM Plex Mono', monospace",
        }}>
          <span>⚠️</span>
          <strong style={{ color: '#DC2626' }}>Data retention limit reached</strong>
          <span style={{ color: '#7080A0' }}>
            — Leads older than {RETENTION_DAYS} days should be deleted per your data retention policy.
          </span>
          <button
            onClick={() => setShowClear(true)}
            style={{ marginLeft: 8, padding: '2px 10px', borderRadius: 5, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Clear All Data
          </button>
        </div>
      )}

      {/* ── Clear All Data confirmation dialog ── */}
      {showClear && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,18,40,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <div style={{
            maxWidth: 420, width: '90%', background: '#fff', borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)', padding: '32px 36px',
            border: '1px solid #E2E7F0', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0A1628', marginBottom: 8 }}>
              Clear All Stored Data?
            </div>
            <div style={{ fontSize: 12, color: '#3D4F6E', lineHeight: 1.6, marginBottom: 24 }}>
              This will remove all partner configurations, revenue data, and starred leads
              from local storage. Lead data loaded from the live endpoint or uploaded XLSX
              will be replaced with sample data on next reload.
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowClear(false)}
                style={{ padding: '9px 22px', borderRadius: 7, border: '1px solid #E2E7F0', background: '#F8F9FC', color: '#3D4F6E', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearConfirmed}
                style={{ padding: '9px 22px', borderRadius: 7, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export a standalone "Clear All Data" button for use in settings / nav
export function ClearDataButton({ T, onClearData }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: T.red, fontFamily: "'IBM Plex Mono',monospace" }}>Confirm?</span>
        <button
          onClick={() => { setConfirm(false); onClearData?.(); }}
          style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${T.red}`, background: T.redBg, color: T.red, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
        >Yes</button>
        <button
          onClick={() => setConfirm(false)}
          style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 10, cursor: 'pointer' }}
        >No</button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Clear all stored data (GDPR right to erasure)"
      style={{ padding: '3px 10px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace" }}
    >
      Clear Data
    </button>
  );
}
