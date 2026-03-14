import React from 'react';
import { THEMES } from '../constants/themes.js';

// Class component — cannot use hooks. Uses THEMES.light as safe fallback.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, _info) {
    // H-03: Log error ID + sanitised message only.
    // Never pass error objects or component info to console — they may
    // contain serialised lead PII, IBANs, income values, or email addresses.
    const errorId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    const safeMessage = (error?.message || 'unknown error')
      .replace(/[\w.+-]+@[\w.-]+\.\w+/g, '[email]')      // strip email addresses
      .replace(/[A-Z]{2}\d{2}[\w\s]{11,30}/g, '[iban]')  // strip IBAN-like strings
      .replace(/\b\d{4,}\b/g, '[num]');                   // strip long numbers
    console.error(`[ErrorBoundary] id=${errorId} ${safeMessage}`);
  }
  render() {
    if (this.state.error) {
      const T = THEMES.light;
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'IBM Plex Sans',sans-serif" }}>
          <div style={{ maxWidth: 480, padding: 40, background: T.surface, borderRadius: 16, boxShadow: '0 4px 40px rgba(0,0,0,0.12)', border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <div style={{ marginBottom: 16, color: '#D97706', lineHeight: 0 }}><svg width="40" height="36" viewBox="0 0 14 13" fill="none"><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.7" fill="currentColor"/></svg></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Unexpected Error</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>{this.state.error.message || 'An error occurred. Reload the page and try again.'}</div>
            <button onClick={() => this.setState({ error: null })} style={{ padding: '10px 24px', background: T.blue, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'IBM Plex Sans',sans-serif" }}>
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
