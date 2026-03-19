// ─── GOOGLE IDENTITY SERVICES — OAuth 2.0 Token Client ───────────────────────
// Wraps the Google Identity Services (GIS) implicit-grant flow.
// The access token is NEVER persisted — it lives in React state/refs only.
//
// Approach: Token Client (implicit grant)
//   - Calls google.accounts.oauth2.initTokenClient
//   - Opens a popup / consent screen when requestToken() is called
//   - Returns a short-lived access_token (~1 h) for use in Authorization headers
//
// If ibancheck.io uses session-cookie SSO instead of Bearer tokens, you will
// need a server-side proxy. See CLEANUP_PLAN §Rule 5 notes for that path.

const GIS_SDK_URL = 'https://accounts.google.com/gsi/client';
const SCOPES      = 'openid email profile';

let _loadPromise = null;

/**
 * Loads the Google Identity Services script exactly once.
 * Safe to call multiple times — returns the same promise.
 * @returns {Promise<void>}
 */
export function loadGIS() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((resolve, reject) => {
    // Already loaded (e.g. hot reload)
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      return resolve();
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', () => reject(new Error('GIS script failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src   = GIS_SDK_URL;
    s.async = true;
    s.defer = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services — check network / CSP'));
    document.head.appendChild(s);
  });
  return _loadPromise;
}

/**
 * Creates a GIS token client.
 * Must be called AFTER loadGIS() resolves.
 *
 * @param {string}   clientId   - Google OAuth 2.0 Client ID (VITE_GOOGLE_CLIENT_ID)
 * @param {Function} onSuccess  - Called with the token response object { access_token, expires_in, … }
 * @param {Function} onError    - Called with the error response { error, error_description }
 * @returns {object} tokenClient — call tokenClient.requestAccessToken() to trigger the popup
 */
export function createTokenClient(clientId, onSuccess, onError) {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('GIS not loaded — call loadGIS() first');
  }
  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope:     SCOPES,
    callback:  (response) => {
      if (response.error) {
        onError(response);
      } else {
        onSuccess(response);
      }
    },
  });
}

/**
 * Requests a new access token — opens the Google consent/account chooser popup.
 * Pass `prompt: 'none'` for silent refresh if the user already consented.
 *
 * @param {object}  tokenClient - The token client returned by createTokenClient()
 * @param {boolean} silent      - If true, attempt silent refresh (no prompt)
 */
export function requestToken(tokenClient, silent = false) {
  tokenClient.requestAccessToken({ prompt: silent ? '' : undefined });
}

/**
 * Fetches the authenticated user's basic profile via the Google userinfo endpoint.
 * @param {string} accessToken
 * @returns {Promise<{email:string, name:string, picture:string}>}
 */
export async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo HTTP ${res.status}`);
  return res.json();
}
