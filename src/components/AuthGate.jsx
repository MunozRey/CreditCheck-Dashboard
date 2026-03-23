// ─── AUTH GATE ────────────────────────────────────────────────────────────────
// C-01: Client-side authentication gate for the CreditCheck Dashboard.
//
// How it works:
//   1. On load, checks sessionStorage for a valid session token (8h TTL).
//   2. If no valid session, renders a password prompt.
//   3. On submit, SHA-256 hashes the input and compares to
//      import.meta.env.VITE_AUTH_PASSWORD_HASH (hex string).
//   4. On match, writes a session record to sessionStorage and renders children.
//
// Setup:
//   a. Choose a strong password.
//   b. Generate hash: node -e "console.log(require('crypto').createHash('sha256').update('yourpassword').digest('hex'))"
//      OR online: https://emn178.github.io/online-tools/sha256.html
//   c. Set VITE_AUTH_PASSWORD_HASH=<hex> in your .env file.
//
// Security note:
//   This is a client-side gate — it does not replace server-side authentication.
//   The hash is embedded in the client bundle, so a determined attacker who reads
//   the bundle can attempt an offline brute-force. Use a long, random passphrase.
//   For production, complement with server-side auth (OAuth2 / OIDC) and network-
//   level access controls (VPN, IP allowlist).
//
// If VITE_AUTH_PASSWORD_HASH is not set, the gate is disabled (dev convenience).

import React, { useState, useCallback, useEffect } from 'react';

const HASH_ENV    = import.meta.env.VITE_AUTH_PASSWORD_HASH || '';
const SESSION_KEY = 'cc_auth_session';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours in ms

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw);
    return Date.now() < expiresAt;
  } catch (_) {
    return false;
  }
}

function writeSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + SESSION_TTL }));
  } catch (_) {}
}

export default function AuthGate({ children }) {
  // If no password hash is configured, skip auth entirely (dev mode)
  if (!HASH_ENV) return children;

  return <AuthGateInner>{children}</AuthGateInner>;
}

function AuthGateInner({ children }) {
  const [authed, setAuthed]     = useState(() => readSession());
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Refresh session check on focus (handles parallel-tab logout)
  useEffect(() => {
    const onFocus = () => { if (!readSession()) setAuthed(false); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    // Basic brute-force throttle: lock for 5s after 5 failed attempts
    if (attempts >= 5) {
      setError('Too many failed attempts. Wait a few seconds and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const hash = await sha256Hex(password);
      if (hash === HASH_ENV.toLowerCase()) {
        writeSession();
        setAuthed(true);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(next >= 5
          ? 'Too many failed attempts. Please wait before trying again.'
          : 'Incorrect password. Please try again.');
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  }, [password, attempts]);

  // Reset attempt counter after 30 s
  useEffect(() => {
    if (attempts === 0) return;
    const id = setTimeout(() => setAttempts(0), 30_000);
    return () => clearTimeout(id);
  }, [attempts]);

  if (authed) return children;

  // ── Login screen ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F6FA', fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{
        width: 360, padding: 40, background: '#fff', borderRadius: 16,
        boxShadow: '0 4px 40px rgba(10,18,40,0.10)', border: '1px solid #E2E7F0',
        textAlign: 'center',
      }}>
        {/* Logo mark */}
        <div style={{
          width: 48, height: 48, background: 'linear-gradient(135deg,#005EFF,#0A1264)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(0,94,255,0.25)',
        }}>
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L14.5 5V13L9 16L3.5 13V5L9 2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M6.5 9.5L8 11L11.5 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#0A1628', marginBottom: 4, fontFamily: "'Geist',sans-serif" }}>
          CreditCheck
        </div>
        <div style={{ fontSize: 11, color: '#7080A0', marginBottom: 28, letterSpacing: 0.3, fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase' }}>
          Internal Dashboard
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Dashboard password"
            autoFocus
            disabled={loading}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 14px',
              border: `1px solid ${error ? '#DC2626' : '#E2E7F0'}`,
              borderRadius: 8, fontSize: 13, color: '#0A1628', outline: 'none',
              background: '#F8F9FC', marginBottom: 12,
              fontFamily: "'IBM Plex Mono',monospace",
            }}
          />

          {error && (
            <div style={{ fontSize: 11, color: '#DC2626', marginBottom: 10, lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', padding: '10px 0', background: loading ? '#7080A0' : '#005EFF',
              color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans',sans-serif", transition: 'background .15s',
            }}
          >
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
        </form>

        <div style={{ fontSize: 10, color: '#7080A0', marginTop: 20, lineHeight: 1.5 }}>
          For authorised Clovr Labs team members only.
          <br />Session expires after 8 hours.
        </div>
      </div>
    </div>
  );
}
