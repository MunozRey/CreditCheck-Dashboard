// ─── SECURE STORAGE WRAPPER ──────────────────────────────────────────────────
// Wraps window.storage.get / .set with AES-GCM encryption so that partner
// revenue models and other sensitive data are not stored in plaintext.
//
// Key derivation: PBKDF2-SHA-256 from VITE_STORAGE_KEY (falls back to a
// hardcoded dev passphrase — always set a real value in production).
//
// Security note: because VITE_STORAGE_KEY is embedded in the client bundle,
// this does NOT protect against an attacker who can read the minified source.
// It DOES protect against casual inspection of localStorage on shared devices
// and against storage read without knowing the passphrase.
// For stronger security, derive the key from the authenticated user's session
// token after C-01 auth is implemented.
//
// Drop-in patch for window.storage — applied once in main.jsx.

const PASSPHRASE = import.meta.env.VITE_STORAGE_KEY || 'cc-dev-only-change-in-production';
const ENC_PREFIX = 'ccenc1:'; // version prefix — allows future migration
const PBKDF2_SALT = 'creditcheck-storage-salt-v1';
const PBKDF2_ITER = 100_000;

let _keyPromise = null;

function deriveKey() {
  if (_keyPromise) return _keyPromise;
  _keyPromise = (async () => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(PASSPHRASE),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(PBKDF2_SALT),
        iterations: PBKDF2_ITER,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  })();
  return _keyPromise;
}

async function encryptValue(plaintext) {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );
  const payload = JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
  });
  return ENC_PREFIX + btoa(payload);
}

async function decryptValue(stored) {
  if (!stored.startsWith(ENC_PREFIX)) {
    // Legacy plaintext value — return as-is (migration path)
    return stored;
  }
  const key = await deriveKey();
  const { iv, data } = JSON.parse(atob(stored.slice(ENC_PREFIX.length)));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Patches window.storage in-place to encrypt all writes and decrypt all reads.
 * Call once during app initialisation (main.jsx).
 * @param {object} rawStorage - The original window.storage object.
 * @returns {object} Encrypted storage with the same .get / .set API.
 */
export function wrapWithEncryption(rawStorage) {
  return {
    async get(key) {
      const result = await rawStorage.get(key);
      if (!result?.value) return result;
      try {
        const decrypted = await decryptValue(result.value);
        return { value: decrypted };
      } catch (_) {
        // Decryption failed (key rotated?) — return null so app re-initialises
        return { value: null };
      }
    },
    async set(key, value) {
      try {
        const encrypted = await encryptValue(String(value));
        return rawStorage.set(key, encrypted);
      } catch (_) {
        // Web Crypto unavailable (very old browser) — fall back to plaintext
        return rawStorage.set(key, value);
      }
    },
  };
}
