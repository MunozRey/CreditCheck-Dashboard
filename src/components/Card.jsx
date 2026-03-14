import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Card({ children, style = {} }) {
  const { T } = useTheme();
  return (
    <div className="cc-card" style={{
      background: T.surface,
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      ...style,
    }}>{children}</div>
  );
}
