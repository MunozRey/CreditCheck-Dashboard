// ─── LIVE DATA FETCHER ────────────────────────────────────────────────────────
// Fetches the live XLSX export from the API endpoint and parses it via the
// existing processRows() parser. Reuses the same CDN XLSX loading pattern
// as UploadZone so no new npm dependency is needed.
//
// Usage:
//   import fetchLiveData from "./fetchLiveData.js";
//   const data = await fetchLiveData(processRows);

const LIVE_ENDPOINT = "https://ibancheck.io/api/credit-exports";

function loadXLSXScript() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const s = Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      onload: () => resolve(window.XLSX),
      onerror: () => reject(new Error("Failed to load XLSX library")),
    });
    document.head.appendChild(s);
  });
}

/**
 * Fetches the live XLSX export and returns parsed lead data.
 * @param {Function} processRows - The processRows(rows, headers) parser function.
 * @returns {Promise<Object>} Parsed data object with Bank Connected / Form Submitted / Incomplete keys.
 * @throws {Error} If fetch fails (CORS, network, HTTP error) or file is empty.
 */
async function fetchLiveData(processRows) {
  let res;
  try {
    res = await fetch(LIVE_ENDPOINT, { method: "GET" });
  } catch (err) {
    // Network or CORS error — throw a typed error so the caller can distinguish
    const corsError = new Error(`Network error — likely CORS: ${err.message}`);
    corsError.isCors = true;
    throw corsError;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const buf = await res.arrayBuffer();
  const XLSX = window.XLSX || await loadXLSXScript();
  const wb = XLSX.read(buf, { type: "array" });
  const rows = XLSX.utils.sheet_to_json(
    wb.Sheets[wb.SheetNames[0]],
    { header: 1, defval: "" }
  );

  if (rows.length < 2) {
    throw new Error("Empty file — no data rows");
  }

  return processRows(rows.slice(1), rows[0].map(h => String(h || "")));
}

export default fetchLiveData;
