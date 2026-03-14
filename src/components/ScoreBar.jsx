import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const gradeColor = (T, s) => s >= 75 ? T.green : s >= 50 ? T.blue : s >= 30 ? T.amber : T.red;
const gradeLabel = s => s >= 75 ? 'A' : s >= 50 ? 'B' : s >= 30 ? 'C' : 'D';

export default function ScoreBar({ score }) {
  const { T } = useTheme();
  const color = gradeColor(T, score);
  const label = gradeLabel(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{label}</span>
      </div>
      <div style={{ flex: 1, height: 6, background: T.surface2, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, width: 26, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'IBM Plex Mono',monospace" }}>{score}</span>
    </div>
  );
}
