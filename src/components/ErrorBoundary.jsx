import React from 'react';
import { THEMES } from '../constants/themes.js';

// Class component — cannot use hooks. Uses THEMES.light as safe fallback.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Dashboard error:', error, info); }
  render() {
    if (this.state.error) {
      const T = THEMES.light;
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'IBM Plex Sans',sans-serif" }}>
          <div style={{ maxWidth: 480, padding: 40, background: T.surface, borderRadius: 16, boxShadow: '0 4px 40px rgba(0,0,0,0.12)', border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
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
