/**
 * leadsApi.js — Clovr Labs CreditCheck Dashboard
 *
 * Thin API layer that converts between the frontend lead format
 * (keyed by category: "Bank Connected" / "Form Submitted" / "Incomplete")
 * and the backend REST format ({ companyName, contactName, ... stage, rawData }).
 */

import { apiFetch } from "./apiClient.js";

// Frontend category  ↔  backend stage value
const STAGE_MAP = {
  "Bank Connected": "bank_connected",
  "Form Submitted": "form_submitted",
  "Incomplete":     "incomplete",
};

const STAGE_REVERSE = {
  bank_connected: "Bank Connected",
  form_submitted: "Form Submitted",
  incomplete:     "Incomplete",
};

const EMPTY = { "Bank Connected": [], "Form Submitted": [], "Incomplete": [] };

/**
 * Fetch all leads from the backend and reshape them into the frontend data
 * structure expected by App.jsx.
 * Returns null if the backend is unavailable / not authenticated.
 */
export async function getLeadsFromBackend() {
  try {
    const result = await apiFetch("/leads");
    if (!result || !Array.isArray(result.data)) return null;

    const data = { ...EMPTY, "Bank Connected": [], "Form Submitted": [], "Incomplete": [] };

    for (const lead of result.data) {
      const category = STAGE_REVERSE[lead.stage] ?? "Incomplete";

      // Prefer the full raw frontend object stored at upload time
      let frontendLead = null;
      if (lead.rawData) {
        frontendLead =
          typeof lead.rawData === "string"
            ? JSON.parse(lead.rawData)
            : lead.rawData;
      }

      // Fallback: reconstruct a minimal lead from backend fields
      if (!frontendLead || typeof frontendLead !== "object") {
        frontendLead = {
          name:    lead.contactName,
          email:   lead.contactEmail,
          score:   lead.score ?? 0,
          created: lead.createdAt ? lead.createdAt.slice(0, 10) : null,
        };
      }

      // Always attach the backend UUID so updates can round-trip
      frontendLead._backendId = lead.id;

      data[category].push(frontendLead);
    }

    return data;
  } catch (_) {
    return null;
  }
}

/**
 * Sync a full XLSX upload to the backend.
 * Replaces ALL existing leads for product "creditcheck".
 * Fires-and-forgets on error so the UI is never blocked.
 */
export async function syncLeadsToBackend(creditData) {
  try {
    const leads = [];
    for (const [category, rows] of Object.entries(creditData)) {
      const stage = STAGE_MAP[category] ?? "incomplete";
      for (const row of rows) {
        leads.push({
          companyName:  row.name  || "Unknown",
          contactName:  row.name  || "Unknown",
          contactEmail: row.email || "",
          product:      "creditcheck",
          stage,
          source:       "xlsx_upload",
          score:        row.score ?? 0,
          rawData:      row,          // store the full frontend object for round-trip fidelity
        });
      }
    }

    if (leads.length === 0) return;

    await apiFetch("/leads/batch", {
      method: "POST",
      body: JSON.stringify({ leads }),
    });
  } catch (_) {
    // Sync errors are non-fatal — local state is already updated
  }
}
