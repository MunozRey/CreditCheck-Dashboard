import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function PreciseInput({ value, onChange, prefix, suffix, color, width = 88 }) {
  const { T } = useTheme();
  const c = color || T.blue;
  const [raw, setRaw] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(String(value));
  }, [value]);

  const commit = str => {
    const v = parseFloat(String(str).replace(',', '.'));
    if (!isNaN(v) && v >= 0) { onChange(v); setRaw(String(v)); }
    else setRaw(String(value));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {prefix && <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{prefix}</span>}
      <input
        type="text" inputMode="decimal" value={raw}
        onChange={e => setRaw(e.target.value)}
        onFocus={e => {
          focused.current = true;
          e.target.select();
          e.target.style.borderColor = c;
          e.target.style.boxShadow = `0 0 0 3px ${c}18`;
        }}
        onBlur={e => {
          focused.current = false;
          commit(raw);
          e.target.style.borderColor = `${c}22`;
          e.target.style.boxShadow = 'none';
        }}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        style={{ width, padding: '6px 8px', border: `1.5px solid ${c}22`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: c, textAlign: 'right', outline: 'none', background: `${c}08`, fontFamily: "ui-monospace,'SF Mono',monospace", transition: 'border-color .15s,box-shadow .15s' }}
      />
      {suffix && <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{suffix}</span>}
    </div>
  );
}
