// ─── LIVE DATA FETCHER ────────────────────────────────────────────────────────
// Fetches the live XLSX export from the configured API endpoint and parses it
// via the existing processRows() parser.
//
// Security hardening applied:
//   H-04: Endpoint URL and API token read from VITE_* env vars (not hardcoded)
//   H-05: X-Requested-With header included as a CSRF mitigation signal
//   M-01: Uses the locally-installed xlsx package instead of a CDN loader
//
// Usage:
//   import fetchLiveData from "./fetchLiveData.js";
//   const data = await fetchLiveData(processRows);

import * as XLSX from 'xlsx';

// Read from environment variables — never hardcode sensitive URLs in source.
// Set VITE_API_ENDPOINT and (optionally) VITE_API_TOKEN in your .env file.
const LIVE_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '';
const API_TOKEN     = import.meta.env.VITE_API_TOKEN     || '';

if (!LIVE_ENDPOINT && import.meta.env.PROD) {
  console.warn('[fetchLiveData] VITE_API_ENDPOINT is not set. Live fetch will be skipped.');
}

/**
 * Fetches the live XLSX export and returns parsed lead data.
 * @param {Function} processRows  - The processRows(rows, headers) parser function.
 * @param {string|null} [accessToken] - Optional Google OAuth 2.0 access token.
 *   When provided, takes precedence over the VITE_API_TOKEN env var.
 *   Pass null/undefined to fall back to the static env token.
 * @returns {Promise<Object>} Parsed data with Bank Connected / Form Submitted / Incomplete keys.
 * @throws {Error} If fetch fails (CORS, network, HTTP error, auth) or file is empty.
 *   401 errors additionally set err.isUnauthorized = true so callers can re-trigger OAuth.
 */
async function fetchLiveData(processRows, accessToken = null) {
  if (!LIVE_ENDPOINT) {
    throw new Error('Live endpoint not configured (VITE_API_ENDPOINT not set)');
  }

  // H-05: CSRF mitigation headers
  //   X-Requested-With: signals this is an XHR, not a cross-site form/img trigger
  //   X-CSRF-Token:     per-page random nonce set in index.html <meta name="csrf-token">
  const csrfToken = typeof document !== 'undefined'
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
    : '';

  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  };

  // Auth priority: runtime Google token > static env token
  const effectiveToken = accessToken || API_TOKEN;
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  let res;
  try {
    res = await fetch(LIVE_ENDPOINT, { method: 'GET', headers });
  } catch (err) {
    // Network or CORS error — throw a typed error so the caller can distinguish
    const corsError = new Error(`Network error — likely CORS: ${err.message}`);
    corsError.isCors = true;
    throw corsError;
  }

  if (res.status === 401) {
    const authErr = new Error('HTTP 401 Unauthorized — Google authentication required');
    authErr.isUnauthorized = true;
    throw authErr;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const buf = await res.arrayBuffer();

  // H-01: Validate magic bytes — XLSX/XLS files are ZIP archives (PK header)
  const magic = new Uint8Array(buf, 0, 4);
  const isZip = magic[0] === 0x50 && magic[1] === 0x4B && magic[2] === 0x03 && magic[3] === 0x04;
  if (!isZip) {
    throw new Error('Invalid file format — expected XLSX (ZIP) signature');
  }

  const wb = XLSX.read(buf, { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(
    wb.Sheets[wb.SheetNames[0]],
    { header: 1, defval: '' }
  );

  if (rows.length < 2) {
    throw new Error('Empty file — no data rows');
  }

  // H-01: Cap rows to prevent memory exhaustion from unexpectedly large files
  const MAX_ROWS = 10_000;
  const dataRows = rows.length > MAX_ROWS + 1 ? rows.slice(1, MAX_ROWS + 1) : rows.slice(1);

  return processRows(dataRows, rows[0].map(h => String(h || '')));
}

export default fetchLiveData;
