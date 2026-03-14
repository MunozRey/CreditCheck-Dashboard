import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Chip({ children, color, bg }) {
  const { T } = useTheme();
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background:bg||T.surface2, color:color||T.muted }}>
      {children}
    </span>
  );
}
