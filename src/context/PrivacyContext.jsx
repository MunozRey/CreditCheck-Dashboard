import React, { createContext, useContext, useState, useEffect } from 'react';
import { maskName as _maskName, maskEmail as _maskEmail } from '../utils/privacy.js';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [privacyMode, setPrivacyMode] = useState(false);

  // Load persisted value on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("cc_privacy");
        if (r?.value === "true") setPrivacyMode(true);
      } catch (_) {}
    })();
  }, []);

  const togglePrivacy = () => {
    setPrivacyMode(prev => {
      const next = !prev;
      try { window.storage.set("cc_privacy", String(next)).catch(() => {}); } catch (_) {}
      return next;
    });
  };

  // These helpers are context-aware: no-op when privacyMode is off
  const maskName  = (name)  => privacyMode ? _maskName(name)  : (name  ?? "");
  const maskEmail = (email) => privacyMode ? _maskEmail(email) : (email ?? "");

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, maskName, maskEmail }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used inside <PrivacyProvider>");
  return ctx;
}
