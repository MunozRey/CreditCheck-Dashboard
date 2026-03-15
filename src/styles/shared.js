// ─── SHARED STYLE CONSTANTS ───────────────────────────────────────────────────
// Named constants for magic numbers that appear 20-150+ times in the codebase.
// Import selectively: import { FS, FW, R, LABEL_MONO } from '../styles/shared.js';

// Font sizes (fontSize:10 = 62 occurrences, fontSize:11 = 86+, fontSize:12 = 60+, fontSize:13 = 40+)
export const FS = {
  xs:      10,  // monospace labels, footnotes, timestamps
  sm:      11,  // secondary text, table cells
  base:    12,  // body default
  md:      13,  // slightly emphasized body
  lg:      14,  // card headers, tab labels
  xl:      16,  // section headings
  h2:      18,
  h1:      22,
  display: 30,  // KpiCard numbers
  hero:    36,  // KPI strip numbers
};

// Font weights (fontWeight:700 = 70+ occurrences, fontWeight:600 = 50+)
export const FW = {
  normal:    400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
  black:     900,
};

// Border radii (borderRadius:8 = 60+, borderRadius:4 = 25+, borderRadius:12 = 30+, borderRadius:20 = 15+)
export const R = {
  sm:   4,    // inner elements, checkboxes, progress bars
  md:   8,    // cards, inputs, chips
  lg:   12,   // modals, dropdowns, larger cards
  xl:   16,
  pill: 9999, // badge/chip full-round
};

// ─── REPEATED STYLE PATTERNS ──────────────────────────────────────────────────

// Monospace uppercase label — appears 20+ times
// Usage: <span style={{...LABEL_MONO, color:T.muted}}>LABEL</span>
export const LABEL_MONO = {
  fontSize:      FS.xs,
  fontWeight:    FW.bold,
  letterSpacing: 1,
  textTransform: 'uppercase',
  fontFamily:    "'IBM Plex Mono', monospace",
};

// Date / search input style — appears 10+ times
// Usage: <input style={inputStyle(T)} .../>
export const inputStyle = T => ({
  padding:      '6px 10px',
  borderRadius: R.md,
  border:       `1px solid ${T.border}`,
  background:   T.surface2,
  color:        T.text,
  fontSize:     FS.sm,
  outline:      'none',
});

// Chip inline style — used when <Chip> component is unavailable
// Prefer the <Chip> component; use this only in contexts that cannot render components
export const CHIP_STYLE = T => ({
  display:        'inline-flex',
  alignItems:     'center',
  padding:        '2px 8px',
  borderRadius:   R.pill,
  fontSize:       FS.xs,
  fontWeight:     FW.semibold,
  background:     T.surface3,
  color:          T.text,
});

// Flex row with gap — the most common layout pattern
export const ROW = (gap = 8) => ({ display: 'flex', alignItems: 'center', gap });

// Card padding shorthand
export const CARD_PAD = { padding: 20 };

// Shadow scale — consistent elevation tokens
export const SHADOW = {
  sm:  '0 1px 4px rgba(0,0,0,0.08)',
  md:  '0 4px 16px rgba(0,0,0,0.12)',
  lg:  '0 8px 32px rgba(0,0,0,0.16)',
  xl:  '0 24px 64px rgba(10,18,32,0.28)',
  modal: '0 40px 100px rgba(10,22,40,0.4)',
};

// Transition constants — use these instead of ad-hoc strings
export const TRANSITION_FAST = 'all 0.14s ease';
export const TRANSITION_SLOW = 'all 0.3s ease';
