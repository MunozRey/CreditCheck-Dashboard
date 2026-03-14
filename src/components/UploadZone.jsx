import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { processRows } from '../utils/xlsxParser.js';

export default function UploadZone({ onData }) {
  const { T } = useTheme();
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const handle = useCallback(async file => {
    if (!file) return;
    setStatus('loading'); setMsg('');
    try {
      const buf = await file.arrayBuffer();
      const XLSX = await new Promise((res, rej) => {
        if (window.XLSX) return res(window.XLSX);
        const s = Object.assign(document.createElement('script'), {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
          onload: () => res(window.XLSX), onerror: rej,
        });
        document.head.appendChild(s);
      });
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      if (rows.length < 2) throw new Error('Empty file');
      const d = processRows(rows.slice(1), rows[0].map(h => String(h || '')));
      const bc = d['Bank Connected'].length, fs = d['Form Submitted'].length, ic = (d['Incomplete'] || []).length;
      if (bc + fs === 0) throw new Error('No leads found. Check column headers match expected format.');
      setMsg(`${bc} Bank Connected · ${fs} Form Submitted · ${ic} Incomplete`);
      setStatus('ok'); onData(d);
    } catch (e) { setStatus('err'); setMsg(String(e.message || e)); }
  }, [onData]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => fileRef.current?.click()}
      style={{
        border: `1px dashed ${drag ? T.blue : T.borderHi}`,
        borderRadius: 12, padding: '28px 20px', textAlign: 'center',
        background: drag ? 'rgba(59,130,246,0.06)' : T.surface2,
        cursor: 'pointer', transition: 'all .2s',
        boxShadow: drag ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
      <div style={{ fontSize: 24, marginBottom: 10, lineHeight: 1 }}>
        {status === 'loading'
          ? <span style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid ' + T.borderHi, borderTopColor: T.blue, borderRadius: '50%', animation: 'cc-spin 0.7s linear infinite' }} />
          : status === 'ok' ? '✓' : status === 'err' ? '✗'
          : <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: status === 'err' ? T.red : status === 'ok' ? T.green : T.textSub, fontFamily: "'Geist',sans-serif" }}>
        {status === 'idle' && 'Drop XLSX here or click to browse'}
        {status === 'loading' && 'Processing…'}
        {(status === 'ok' || status === 'err') && msg}
      </div>
      {status === 'idle' && <div style={{ fontSize: 10, color: T.muted, marginTop: 6, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.3 }}>CreditScore & Pipedrive formats · deduplicates by email</div>}
    </div>
  );
}
