import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';                          // M-01: local package, no CDN loader
import { useTheme } from '../context/ThemeContext.jsx';
import { parseWorkbook } from '../utils/xlsxParser.js';

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
      // H-01: File size guard — prevents zip-bomb memory exhaustion
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`);
      }

      const buf = await file.arrayBuffer();

      // H-01: Magic-byte validation — reject non-XLSX/XLS disguised files
      if (!hasValidMagicBytes(buf)) {
        throw new Error('Invalid file format. Only .xlsx and .xls files are accepted.');
      }

      const wb   = XLSX.read(buf, { type: 'array' });
      const rawRows = XLSX.utils.sheet_to_json(
        wb.Sheets[wb.SheetNames[0]],
        { header: 1, defval: '' }
      );

      if (rawRows.length < 2) throw new Error('Empty file — no data rows found.');

      // H-01: Row cap — prevents browser memory exhaustion on huge files
      const headers  = rawRows[0].map(h => String(h || ''));
      const dataRows = rawRows.slice(1, MAX_ROWS + 1);
      const truncated = rawRows.length - 1 > MAX_ROWS;

      const d  = processRows(dataRows, headers);
      const bc = d['Bank Connected'].length;
      const fs = d['Form Submitted'].length;
      const ic = (d['Incomplete'] || []).length;

      if (bc + fs === 0) throw new Error('No leads found. Check column headers match the expected format.');

      const suffix = truncated ? ` (capped at ${MAX_ROWS} rows)` : '';
      setMsg(`${bc} Bank Connected · ${fs} Form Submitted · ${ic} Incomplete${suffix}`);
      setStatus('ok');

      // M-04: Audit trail for data uploads (no PII in metadata)
      auditLog('data_upload', {
        fileName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), // sanitise filename
        fileSizeKB: Math.round(file.size / 1024),
        rowCount: bc + fs + ic,
        truncated,
      });
      const wb = XLSX.read(buf, { type: 'array' });
      const { creditData, mortgageData } = parseWorkbook(wb, XLSX);

      const bc  = creditData['Bank Connected'].length;
      const fs  = creditData['Form Submitted'].length;
      const ic  = (creditData['Incomplete'] || []).length;
      const mAll = [
        ...(mortgageData['Bank Connected'] || []),
        ...(mortgageData['Form Submitted'] || []),
        ...(mortgageData['Incomplete']     || []),
      ].length;

      if (bc + fs === 0 && mAll === 0) {
        throw new Error('No leads found. Check column headers match expected format.');
      }

      const creditLabel   = `${(bc + fs + ic).toLocaleString()} credit lead${(bc + fs + ic) !== 1 ? 's' : ''}`;
      const mortgageLabel = `${mAll.toLocaleString()} mortgage lead${mAll !== 1 ? 's' : ''}`;
      setMsg(`${creditLabel} · ${mortgageLabel}`);
      setStatus('ok');
      onData({ creditData, mortgageData });
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
        {status === 'idle'    && 'Drop XLSX here or click to browse'}
        {status === 'loading' && 'Processing…'}
        {(status === 'ok' || status === 'err') && msg}
      </div>
      {status === 'idle' && <div style={{ fontSize: 10, color: T.muted, marginTop: 6, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 0.3 }}>CreditScore · Mortgage · Pipedrive formats · deduplicates by email</div>}
    </div>
  );
}
