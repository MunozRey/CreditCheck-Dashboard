import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, applyTheme } from '../constants/themes.js';

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────
// Replaces the global mutable T proxy with a proper React context.
// Each component calls: const { T, theme, toggleTheme } = useTheme();
//
// Pure style getters (no side-effects, safe to call anywhere):
//   getCatStyle(T)    — category badge styles
//   getGradeStyle(T)  — grade A/B display styles
//   getModelColors(T) — revenue model palette
//
// Usage:
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('cc_theme') || 'light'; } catch (_) { return 'light'; }
  });

  // Sync global CSS + mutable T proxy whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const T = THEMES[theme];

  return (
    <ThemeContext.Provider value={{ T, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

// ─── PURE STYLE GETTERS ───────────────────────────────────────────────────────
// These replace the mutable CAT_STYLE / GRADE_STYLE / MODEL_COLORS objects.
// Pass the current T from useTheme() to keep them pure and testable.

export const getCatStyle = T => ({
  'Bank Connected': { color: T.green,  light: T.greenBg,  border: T.green  + '30', short: 'BC' },
  'Form Submitted': { color: T.blue,   light: T.surface3, border: T.blue   + '30', short: 'FS' },
  'Incomplete':     { color: T.amber,  light: T.amberBg,  border: T.amber  + '30', short: 'IC' },
});

export const getGradeStyle = T => ({
  A: { label: 'A — Premium',  color: T.navy, bg: T.surface3, desc: 'Open Banking connected' },
  B: { label: 'B — Standard', color: T.blue, bg: T.blue4,    desc: 'Form completed' },
});

export const getModelColors = T => ({
  cpl:    T.blue2,
  cpa:    T.navy,
  hybrid: T.blue3,
});
