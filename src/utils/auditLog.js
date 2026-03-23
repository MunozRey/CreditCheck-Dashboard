// ─── AUDIT LOGGER ────────────────────────────────────────────────────────────
// Records sensitive actions with a PII-safe audit trail.
// In development, writes to console.info.
// In production, posts to VITE_AUDIT_ENDPOINT if configured;
// otherwise queues up to 100 events in sessionStorage for later retrieval.
//
// Usage:
//   auditLog("lead_export",  { rowCount: 42, format: "csv", fields: ["name","email"] });
//   auditLog("data_upload",  { fileName: "leads.xlsx", rowCount: 500 });
//   auditLog("partner_edit", { partnerId: "abc123", action: "update" });

const AUDIT_ENDPOINT = import.meta.env.VITE_AUDIT_ENDPOINT;
const IS_DEV = import.meta.env.DEV;

// Fields that may contain PII — values are redacted before logging
const PII_PATTERN = /name|email|iban|income|loan|score|address|phone|dob|birth/i;

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = PII_PATTERN.test(k) ? '[REDACTED]' : v;
  }
  return clean;
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem('cc_audit_session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('cc_audit_session', id);
    }
    return id;
  } catch (_) {
    return 'unknown';
  }
}

function queueEvent(event) {
  try {
    const raw = sessionStorage.getItem('cc_audit_queue') || '[]';
    const queue = JSON.parse(raw);
    queue.push(event);
    // Keep only the last 100 events to avoid storage bloat
    sessionStorage.setItem('cc_audit_queue', JSON.stringify(queue.slice(-100)));
  } catch (_) {}
}

/**
 * Log a sensitive action.
 * @param {string} action  - Machine-readable action name, e.g. "lead_export"
 * @param {object} metadata - Optional context. PII fields are automatically redacted.
 */
export function auditLog(action, metadata = {}) {
  const event = {
    action,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    ...sanitize(metadata),
  };

  if (IS_DEV) {
    console.info('[AUDIT]', event);
    return;
  }

  if (AUDIT_ENDPOINT) {
    fetch(AUDIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true, // survives page unload
    }).catch(() => queueEvent(event));
  } else {
    queueEvent(event);
  }
}
