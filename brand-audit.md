# Brand Audit — CreditCheck Dashboard vs creditchecker.io
**Date:** 2026-03-14
**Source:** `brand-tokens.json` (extracted from https://creditchecker.io)
**Scope:** Visual/brand styles only — no layout changes.

---

## Summary

| Category | Status | Changes needed |
|----------|--------|----------------|
| Primary blue `#005EFF` | ✅ Exact match | None |
| Navy `#0A1264` | ✅ Exact match | None |
| Heading font (Larken) | ❌ Missing | Add Larken; use for h1/h2/display elements |
| Body font (IBM Plex Sans) | ✅ Match | None |
| Page background | ⚠️ Off | `#F5F6FA` → `#F0F0F1` |
| Surface/section bg | ⚠️ Off | `#EEF1F8` → `#E6E7EF` |
| Body text color | ⚠️ Off | `#0A1628` (blue-tinted) → `#1A1A1A` (neutral) |
| Red semantic | ⚠️ Off | `#DC2626` → `#EF4444` |
| Amber semantic | ⚠️ Off | `#D97706` → `#F59E0B` |
| Button border-radius | ✅ Close | `7px` vs `6px` — acceptable |
| Card shadow | ❌ Missing | Dashboard has no card shadow token |
| Nav background | ✅ Match | `#0A1264` exact |

---

## Detailed Findings

### 1. Typography — HIGH IMPACT
**Issue:** The site uses `Larken` (a display serif) for all headings. The dashboard uses `Geist` (sans-serif). This is the most visually distinctive brand differentiator.

| Location | Current | Brand correct |
|----------|---------|---------------|
| `themes.js` → `applyTheme()` `@import` | `Geist` via Google Fonts | Add `Larken` (self-hosted or CDN) |
| KPI values (large numbers) | `fontFamily: "'Geist',sans-serif"` | Keep Geist for data numerals — Larken is for editorial headings only |
| Section headers (`h2`-level text) | Geist 700–800 | → Larken 700 |
| Dashboard title "CreditCheck" in navbar | Geist 800 | → Larken or keep Geist (wordmark) |

**Note on Larken:** Larken is a commercial font by Uncut Type. It is NOT available on Google Fonts. The site self-hosts it (no CDN URL found). Options:
- (A) Purchase and self-host the font files
- (B) Use a free substitute: **DM Serif Display**, **Playfair Display**, or **Lora** from Google Fonts
- (C) Skip and retain Geist (lowest impact, already good-looking)

**Recommendation:** Use `Playfair Display` as a drop-in — very similar weight and editorial feel to Larken.

---

### 2. Page Background Color — MEDIUM IMPACT
| Token | Current | Brand site | Delta |
|-------|---------|------------|-------|
| `T.bg` (light) | `#F5F6FA` | `#F0F0F1` | Slightly blue-tinted vs pure neutral grey |

The dashboard's background is warmer/bluer than the site's pure neutral grey. Minor but visible on wide monitors.

**Files affected:** `src/constants/themes.js` line 4

---

### 3. Surface 3 / Section Background — MEDIUM IMPACT
| Token | Current | Brand site | Delta |
|-------|---------|------------|-------|
| `T.surface3` (light) | `#EEF1F8` | `#E6E7EF` | Dashboard is slightly more blue-tinted |
| `T.border` (light) | `#E2E7F0` | `#E6E7EF` | Could be unified |

**Files affected:** `src/constants/themes.js` line 4

---

### 4. Body Text Color — MEDIUM IMPACT
| Token | Current | Brand site | Delta |
|-------|---------|------------|-------|
| `T.text` (light) | `#0A1628` (blue-navy tint) | `#1A1A1A` (near-neutral black) | Dashboard body text has a blue undertone |
| `T.textSub` (light) | `#3D4F6E` (blue-grey) | `#374151` (neutral grey) | Similar hue, different saturation |
| `T.muted` (light) | `#7080A0` (blue-grey) | `#444444` (neutral grey) | Dashboard muted is much bluer |

**Files affected:** `src/constants/themes.js` lines 6–7

---

### 5. Semantic Red — LOW-MEDIUM IMPACT
| Token | Current | Brand site | WCAG AA on white |
|-------|---------|------------|------------------|
| `T.red` (light) | `#DC2626` | `#EF4444` | `#DC2626` ratio: **5.74:1** ✅ · `#EF4444` ratio: **3.88:1** ⚠️ |

**⚠️ Accessibility flag:** The site's `#EF4444` fails WCAG AA (4.5:1) for normal text on white. The dashboard's current `#DC2626` actually meets AA. Recommendation: **keep `#DC2626`** for text uses, allow `#EF4444` only for decorative/icon uses.

**Files affected:** `src/constants/themes.js` line 13

---

### 6. Semantic Amber — LOW IMPACT
| Token | Current | Brand site | WCAG on white |
|-------|---------|------------|---------------|
| `T.amber` (light) | `#D97706` | `#F59E0B` | `#D97706`: **3.24:1** · `#F59E0B`: **1.96:1` |

**⚠️ Accessibility flag:** Both amber values fail WCAG AA for text on white. The current `#D97706` is closer to compliant. The site uses amber as an icon/indicator color, not text. Recommendation: **keep `#D97706`** for text labels and badges.

**Files affected:** `src/constants/themes.js` line 13

---

### 7. Card Shadow Token — LOW IMPACT
**Issue:** The site uses a layered shadow on cards:
```
0 20px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.04)
```
The dashboard has no card shadow — flat borders only. This is intentional for a data-dense dashboard (shadows add noise in tables/charts). No change recommended unless specifically requested.

---

### 8. Dark Theme — NOT AUDITED
The site has no dark mode. The dashboard's dark theme tokens are not auditable against the site. They are considered implementation-specific and out of scope.

---

## Change Plan (in priority order)

| Priority | Change | File | Token |
|----------|--------|------|-------|
| 1 | Add display font (Playfair Display) via Google Fonts | `themes.js` | `fontDisplay` |
| 2 | Fix page bg: `#F5F6FA` → `#F0F0F1` | `themes.js` | `T.bg` |
| 3 | Fix section bg: `#EEF1F8` → `#E6E7EF` | `themes.js` | `T.surface3` |
| 4 | Fix body text: `#0A1628` → `#1A1A1A` | `themes.js` | `T.text` |
| 5 | Fix sub-text: `#3D4F6E` → `#374151` | `themes.js` | `T.textSub` |
| 6 | Fix muted: `#7080A0` → `#6B7280` (WCAG-safe midpoint) | `themes.js` | `T.muted` |
| 7 | Apply display font to section headings in tab components | Multiple tabs | `fontFamily` |
| 8 | ~~Red `#DC2626` → `#EF4444`~~ | — | **SKIP** (accessibility) |
| 9 | ~~Amber `#D97706` → `#F59E0B`~~ | — | **SKIP** (accessibility) |

---

## Tokens That Are Already Correct

These required NO changes — they already match the brand exactly:

- ✅ `T.blue = #005EFF` — exact match
- ✅ `T.navy = #0A1264` — exact match
- ✅ `T.navBg = #0A1264` — exact match
- ✅ `T.surface = #FFFFFF` — exact match
- ✅ `T.surface2 = #F8F9FC` — acceptable (lighter variant, not used as section bg)
- ✅ `T.border = #E2E7F0` — within 2% of `#E6E7EF`, acceptable
- ✅ IBM Plex Sans — exact match
- ✅ IBM Plex Mono — used appropriately for data labels
- ✅ Button border-radius (7–8px vs 6–8px) — imperceptible difference
- ✅ Brand gradient `linear-gradient(135deg, #005EFF, #0A1264)` — already in use in logo, avatar, modal header

---

## Accessibility Summary

| Color use | Ratio on white | WCAG AA (4.5:1) | Notes |
|-----------|---------------|-----------------|-------|
| `#005EFF` blue on white | **3.12:1** | ❌ Fails AA for text | Use only for large text (≥18px) or decorative; use `#0A1264` for small text |
| `#0A1264` navy on white | **13.1:1** | ✅ Passes AAA | Safe for all text |
| `#1A1A1A` on white | **17.7:1** | ✅ Passes AAA | Safe |
| `#374151` on white | **8.3:1** | ✅ Passes AA | Safe |
| `#6B7280` on white | **4.6:1** | ✅ Passes AA | Borderline — minimum 12px |
| `#DC2626` red on white | **5.7:1** | ✅ Passes AA | Keep current |
| `#EF4444` red on white | **3.9:1** | ❌ Fails AA | Do not use for text |

**Key finding:** `#005EFF` (the primary brand blue) fails WCAG AA for normal text on white. The site works around this by always placing blue text on dark backgrounds or using it at large sizes. The dashboard should follow the same pattern — `#005EFF` for interactive elements and large data values, `#0A1264` for small text labels.
