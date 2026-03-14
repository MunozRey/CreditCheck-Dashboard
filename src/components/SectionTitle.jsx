import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function SectionTitle({ children, action }) {
  const { T } = useTheme();
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>
      {typeof children === 'string'
        ? <span style={{ fontSize:9, fontWeight:700, color:T.muted, letterSpacing:1.8, textTransform:'uppercase', fontFamily:"'IBM Plex Mono',monospace" }}>{children}</span>
        : children}
      {action && <div>{action}</div>}
    </div>
  );
}
