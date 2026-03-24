import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * CustomTooltip — themed Recharts tooltip.
 * Props:
 *   formatter(value, name) → string  — custom value formatter
 *   hint                   → string  — optional metric explanation shown below values
 *   total                  → number  — if provided, shows % of total for each payload entry
 */
export default function CustomTooltip({ active, payload, label, formatter, hint, total }) {
  const { T } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, borderRadius: 10, padding: '12px 16px', border: `1px solid ${T.borderHi}`, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 150, maxWidth: 240, fontFamily: "'Geist',sans-serif" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.textSub }}>{p.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', fontFamily: "'IBM Plex Mono',monospace" }}>
              {formatter ? formatter(p.value, p.name) : p.value}
            </span>
            {total > 0 && (
              <span style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
                {Math.round(p.value / total * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
      {hint && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.muted, lineHeight: 1.5, fontStyle: 'italic' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
