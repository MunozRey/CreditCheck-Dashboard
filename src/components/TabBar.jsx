import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function TabBar({ tabs, active, onChange }) {
  const { T } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 2, background: T.surface2, borderRadius: 10, padding: 3 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: active === t.id ? T.navy : 'transparent',
          color: active === t.id ? '#fff' : T.muted,
          fontWeight: 700, fontSize: 12, transition: 'all .15s', whiteSpace: 'nowrap',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
