/**
 * apiClient.js — Clovr Labs CreditCheck Dashboard
 *
 * Manages JWT auth with the shared backend API.
 * JWT is stored in sessionStorage so it survives page reloads within the same
 * browser session but is cleared when the tab is closed.
 */

const BACKEND_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SESSION_KEY = "_cc_backend_jwt";

let _jwt = null;

/** Return true if a BACKEND_URL is configured. */
export function hasBackend() {
  return Boolean(BACKEND_URL);
}

/**
 * Attempt to log in to the backend with a whitelisted email.
 * On success the JWT is cached in memory + sessionStorage.
 * Returns true on success, false on failure (email not whitelisted / network error).
 */
export async function loginToBackend(email) {
  if (!BACKEND_URL || !email) return false;
  try {
    // Try to reuse a cached token first
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      _jwt = cached;
      return true;
    }

    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return false;
    const { token } = await res.json();
    if (!token) return false;
    _jwt = token;
    try { sessionStorage.setItem(SESSION_KEY, token); } catch (_) {}
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Try to restore a cached JWT from sessionStorage without making a network call.
 * Returns true if a cached token was found.
 */
export function restoreCachedAuth() {
  if (_jwt) return true;
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) { _jwt = cached; return true; }
  } catch (_) {}
  return false;
}

/** Clear cached JWT (e.g. on logout). */
export function clearAuth() {
  _jwt = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
}

/**
 * Authenticated fetch wrapper.
 * Returns null (silently) if no backend is configured or no JWT is available.
 * Throws on HTTP errors so callers can catch and handle.
 */
export async function apiFetch(path, options = {}) {
  if (!BACKEND_URL || !_jwt) return null;
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${_jwt}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuth(); // token expired — force re-login on next action
    return null;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}
