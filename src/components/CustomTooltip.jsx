import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function CustomTooltip({ active, payload, label, formatter }) {
  const { T } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, borderRadius: 10, padding: '12px 16px', border: `1px solid ${T.borderHi}`, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', minWidth: 140, fontFamily: "'Geist',sans-serif" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.textSub }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', fontFamily: "'IBM Plex Mono',monospace" }}>
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
