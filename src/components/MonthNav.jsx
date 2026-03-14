import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { MONTHS, todayYM } from '../utils/format.js';

export default function MonthNav({ y, m, onChange }) {
  const { T } = useTheme();
  const prev = () => { if (m === 0) onChange(y - 1, 11); else onChange(y, m - 1); };
  const next = () => {
    const { y: ty, m: tm } = todayYM();
    if (y > ty || (y === ty && m >= tm)) return;
    if (m === 11) onChange(y + 1, 0); else onChange(y, m + 1);
  };
  const { y: ty, m: tm } = todayYM();
  const isToday = y === ty && m === tm;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={prev} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface2, cursor: 'pointer', fontSize: 14, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
      <div style={{ minWidth: 110, textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{MONTHS[m]} {y}</span>
      </div>
      <button onClick={next} disabled={isToday} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface2, cursor: isToday ? 'not-allowed' : 'pointer', fontSize: 14, color: isToday ? T.border : T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
    </div>
  );
}
