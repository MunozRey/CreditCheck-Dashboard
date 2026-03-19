// ─── fetchLiveData.test.js ────────────────────────────────────────────────────
// Tests for src/utils/fetchLiveData.js
//
// fetchLiveData(processRows) is an async function that:
//   1. Fetches the live endpoint via fetch()
//   2. Reads the response as ArrayBuffer
//   3. Parses XLSX using window.XLSX (or CDN script)
//   4. Calls processRows(rows, headers) and returns the result
//
// All tests mock global fetch and window.XLSX to avoid real network calls.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fetchLiveData from "../utils/fetchLiveData.js";

// ─── Minimal XLSX mock ────────────────────────────────────────────────────────
// We stub window.XLSX so that the CDN <script> loading path is never hit.
// The stub is designed to parse the fake ArrayBuffer we hand it.

function makeXLSXMock(rows) {
  // rows: array of arrays (first element = headers row, rest = data rows)
  return {
    read: vi.fn().mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    }),
    utils: {
      sheet_to_json: vi.fn().mockReturnValue(rows),
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetchOk(body = new ArrayBuffer(8)) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    arrayBuffer: () => Promise.resolve(body),
  });
}

function mockFetchStatus(status, statusText) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  });
}

function mockFetchNetworkError(message) {
  return vi.fn().mockRejectedValue(new Error(message));
}

// A minimal passthrough processRows stub
const fakeProcessRows = vi.fn().mockReturnValue({
  "Bank Connected": [{ name: "Test Lead", email: "lead@example.com" }],
  "Form Submitted": [],
  "Incomplete": [],
});

// Headers row + 1 data row
const TWO_ROW_SHEET = [
  ["name", "email", "lead - title", "lead created"],
  ["Test Lead", "lead@example.com", "Bank Connected", "2026-03-01"],
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("fetchLiveData", () => {
  beforeEach(() => {
    // Install a fresh XLSX mock on window before every test
    window.XLSX = makeXLSXMock(TWO_ROW_SHEET);
    fakeProcessRows.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.XLSX;
  });

  // ── Successful fetch ────────────────────────────────────────────────────────

  it("successful fetch returns parsed lead data", async () => {
    global.fetch = mockFetchOk();
    const result = await fetchLiveData(fakeProcessRows);
    expect(result).toHaveProperty("Bank Connected");
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("calls processRows with (dataRows, headerRow)", async () => {
    global.fetch = mockFetchOk();
    await fetchLiveData(fakeProcessRows);
    expect(fakeProcessRows).toHaveBeenCalledTimes(1);
    const [rows, headers] = fakeProcessRows.mock.calls[0];
    // rows = slice(1) — all rows after header
    // headers = rows[0] mapped to strings
    expect(Array.isArray(rows)).toBe(true);
    expect(Array.isArray(headers)).toBe(true);
  });

  it("headers are passed as strings (even if cell values are numbers)", async () => {
    // Simulate a sheet where the first row contains a numeric value
    window.XLSX = makeXLSXMock([
      [1, "email", "status", "verification job"],
      ["John", "j@example.com", "completed", "matched"],
    ]);
    global.fetch = mockFetchOk();
    await fetchLiveData(fakeProcessRows);
    const [, headers] = fakeProcessRows.mock.calls[0];
    expect(headers[0]).toBe("1"); // String(1)
  });

  // ── HTTP errors ─────────────────────────────────────────────────────────────

  it("HTTP 404 throws an error containing '404'", async () => {
    global.fetch = mockFetchStatus(404, "Not Found");
    await expect(fetchLiveData(fakeProcessRows)).rejects.toThrow("404");
  });

  it("HTTP 500 throws an error containing '500'", async () => {
    global.fetch = mockFetchStatus(500, "Internal Server Error");
    await expect(fetchLiveData(fakeProcessRows)).rejects.toThrow("500");
  });

  it("HTTP 401 throws an error", async () => {
    global.fetch = mockFetchStatus(401, "Unauthorized");
    await expect(fetchLiveData(fakeProcessRows)).rejects.toThrow();
  });

  it("non-ok response error message includes status code and text", async () => {
    global.fetch = mockFetchStatus(403, "Forbidden");
    let message = "";
    try {
      await fetchLiveData(fakeProcessRows);
    } catch (e) {
      message = e.message;
    }
    expect(message).toContain("403");
    expect(message).toContain("Forbidden");
  });

  // ── Network / CORS errors ───────────────────────────────────────────────────

  it("network error throws with 'CORS' in message", async () => {
    global.fetch = mockFetchNetworkError("Failed to fetch");
    let thrownError;
    try {
      await fetchLiveData(fakeProcessRows);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toBeDefined();
    expect(thrownError.message).toMatch(/CORS/i);
  });

  it("network error sets isCors=true on the thrown error", async () => {
    global.fetch = mockFetchNetworkError("Network request failed");
    let thrownError;
    try {
      await fetchLiveData(fakeProcessRows);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError.isCors).toBe(true);
  });

  it("network error wraps the original message", async () => {
    global.fetch = mockFetchNetworkError("ERR_NETWORK_CHANGED");
    let thrownError;
    try {
      await fetchLiveData(fakeProcessRows);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError.message).toContain("ERR_NETWORK_CHANGED");
  });

  // ── Empty file ──────────────────────────────────────────────────────────────

  it("empty XLSX (0 rows) throws 'Empty file' error", async () => {
    // sheet_to_json returns only 0 rows → rows.length < 2
    window.XLSX = makeXLSXMock([]);
    global.fetch = mockFetchOk();
    await expect(fetchLiveData(fakeProcessRows)).rejects.toThrow(/empty file/i);
  });

  it("XLSX with header row only (1 row, no data) throws 'Empty file'", async () => {
    window.XLSX = makeXLSXMock([
      ["name", "email", "lead - title", "lead created"],
    ]);
    global.fetch = mockFetchOk();
    await expect(fetchLiveData(fakeProcessRows)).rejects.toThrow(/empty file/i);
  });

  // ── Malformed XLSX ──────────────────────────────────────────────────────────

  it("malformed XLSX (XLSX.read throws) propagates the error", async () => {
    window.XLSX = {
      read: vi.fn().mockImplementation(() => {
        throw new Error("File is not a valid XLSX workbook");
      }),
      utils: { sheet_to_json: vi.fn() },
    };
    global.fetch = mockFetchOk();
    await expect(fetchLiveData(fakeProcessRows)).rejects.toThrow();
  });

  it("malformed XLSX error message is descriptive", async () => {
    window.XLSX = {
      read: vi.fn().mockImplementation(() => {
        throw new Error("Invalid XLSX format — could not parse workbook");
      }),
      utils: { sheet_to_json: vi.fn() },
    };
    global.fetch = mockFetchOk();
    let message = "";
    try {
      await fetchLiveData(fakeProcessRows);
    } catch (e) {
      message = e.message;
    }
    expect(message.length).toBeGreaterThan(0);
  });
});
