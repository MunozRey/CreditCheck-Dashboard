import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// ── window.storage polyfill ──────────────────────────────────────────────────
// The dashboard uses window.storage.get/set (Bolt/StackBlitz API).
// Polyfill to localStorage for standard Vite/browser environments.
if (!window.storage) {
  window.storage = {
    get: (key) => Promise.resolve({ value: localStorage.getItem(key) }),
    set: (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
