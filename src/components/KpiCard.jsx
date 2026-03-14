import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import Card from './Card.jsx';

export default function KpiCard({ label, value, sub, accent, trend, trendLabel, icon }) {
  const { T } = useTheme();
  const a = accent || T.blue;
  const isPos = trend > 0, isNeg = trend < 0;
  return (
    <Card style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, ${a}60, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontFamily: "'IBM Plex Mono',monospace" }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: T.text, lineHeight: 1, letterSpacing: -1, fontVariantNumeric: 'tabular-nums', fontFamily: "'Geist',sans-serif" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
        </div>
        {icon && <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>{icon}</div>}
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.5,
            background: isPos ? T.greenBg : isNeg ? T.redBg : T.surface2,
            color: isPos ? T.green : isNeg ? T.red : T.muted,
            border: `1px solid ${isPos ? T.green + '30' : isNeg ? T.red + '30' : T.border}`,
          }}>
            {isPos ? '↑' : isNeg ? '↓' : '—'} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}
