import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function FieldRow({ label, sub, children }) {
  const { T } = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.surface2}` }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.muted }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
