// ─── LIVE DATA FETCHER ────────────────────────────────────────────────────────
// Fetches the live XLSX export from the API endpoint and parses it via the
// existing processRows() parser. Reuses the same CDN XLSX loading pattern
// as UploadZone so no new npm dependency is needed.

const LIVE_ENDPOINT = "https://ibancheck.io/api/credit-exports";
const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 1;

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
 * Includes a 30s timeout and one automatic retry on network failure.
 * @param {Function} processRows - The processRows(rows, headers) parser function.
 * @returns {Promise<Object>} Parsed data object with Bank Connected / Form Submitted / Incomplete keys.
 */
async function fetchLiveData(processRows) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let res;
      try {
        res = await fetch(LIVE_ENDPOINT, { method: "GET", signal: controller.signal });
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          throw new Error("Request timed out after 30s");
        }
        const corsError = new Error(`Network error — likely CORS: ${err.message}`);
        corsError.isCors = true;
        throw corsError;
      }
      clearTimeout(timeoutId);

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
    } catch (err) {
      lastError = err;
      // Don't retry CORS errors (they'll fail again)
      if (err.isCors) throw err;
      // Retry on network/timeout errors
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw lastError;
}

export default fetchLiveData;
