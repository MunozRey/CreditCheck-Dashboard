import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { wrapWithEncryption } from "./utils/secureStorage.js";

// ── window.storage polyfill ──────────────────────────────────────────────────
// The dashboard uses window.storage.get/set (Bolt/StackBlitz API).
// Polyfill to localStorage for standard Vite/browser environments.
if (!window.storage) {
  window.storage = {
    get:  (key)        => Promise.resolve({ value: localStorage.getItem(key) }),
    set:  (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
  };
}

// C-02: Wrap storage with AES-GCM encryption so that partner revenue models,
// settings, and starred leads are not stored in plaintext on the device.
// See src/utils/secureStorage.js for implementation and security notes.
window.storage = wrapWithEncryption(window.storage);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
