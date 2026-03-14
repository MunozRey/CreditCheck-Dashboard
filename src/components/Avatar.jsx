import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Avatar({ name }) {
  const { T } = useTheme();
  const initials = (name || '').split(' ').slice(0, 2).map(w => (w[0] || '').toUpperCase()).join('');
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${T.blue},${T.navy})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
      {initials || '?'}
    </div>
  );
}
