import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const SHORTCUTS = [
  { key: "1–9",   desc: "Switch to tab (1=Leads … 9=Partners)" },
  { key: "?",     desc: "Toggle this help overlay" },
  { key: "Esc",   desc: "Close modals / drawers / this overlay" },
  { key: "D",     desc: "Toggle dark / light mode" },
  { key: "U",     desc: "Toggle upload panel" },
  { key: "E",     desc: "Open export modal" },
];

export default function KeyboardHelp({ onClose }) {
  const { T } = useTheme();
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300, backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        zIndex: 301, width: 360, padding: "20px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Keyboard Shortcuts</div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SHORTCUTS.map(s => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <kbd style={{
                minWidth: 36, padding: "3px 8px", borderRadius: 5, background: T.surface2,
                border: `1px solid ${T.border}`, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
                fontWeight: 700, color: T.navy, textAlign: "center", letterSpacing: 0.3, flexShrink: 0,
              }}>{s.key}</kbd>
              <span style={{ fontSize: 12, color: T.textSub }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>Shortcuts only work when no input field is focused</div>
      </div>
    </>
  );
}
