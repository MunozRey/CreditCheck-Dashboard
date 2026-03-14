# CreditChecker.io — Brand Tokens
> Extracted from https://www.creditchecker.io — March 2026
> Applied as CSS variables / T.* theme tokens in the dashboard.

---

## Colors

### Primary Palette
| Token                   | Hex         | Usage                                      |
|-------------------------|-------------|--------------------------------------------|
| `--cc-primary`          | `#005eff`   | Primary CTA, links, active borders         |
| `--cc-navy`             | `#0a1264`   | Dark headings, navbar BG, "premium" fills  |
| `--cc-primary-hover`    | `#1a6fff`   | Hover state on primary buttons             |
| `--cc-primary-light`    | `#4d94ff`   | Subtle highlights, chart fill              |
| `--cc-primary-bg`       | `#dce8ff`   | Low-opacity chip backgrounds               |

### Neutral / Surface
| Token                   | Hex         | Usage                                      |
|-------------------------|-------------|--------------------------------------------|
| `--cc-bg`               | `#f5f6fa`   | Page background                            |
| `--cc-surface`          | `#ffffff`   | Card / panel surface                       |
| `--cc-surface-2`        | `#f8f9fc`   | Input background, thead                   |
| `--cc-surface-3`        | `#eef1f8`   | Chip backgrounds, hover tray               |
| `--cc-border`           | `#e2e7f0`   | Default border                             |
| `--cc-border-hi`        | `#c8d2e8`   | Hover / focus border                       |

### Text
| Token                   | Hex         | Usage                                      |
|-------------------------|-------------|--------------------------------------------|
| `--cc-text`             | `#0a1628`   | Primary body text                          |
| `--cc-text-sub`         | `#3d4f6e`   | Secondary text                             |
| `--cc-muted`            | `#7080a0`   | Placeholder, captions                      |

### Semantic (Status) — Unchanged from product defaults
| Token                   | Hex         | Usage                                      |
|-------------------------|-------------|--------------------------------------------|
| `--cc-green`            | `#059669`   | Bank Connected / success                   |
| `--cc-green-bg`         | `#ecfdf5`   | Success chip background                    |
| `--cc-amber`            | `#d97706`   | Warning / Incomplete                       |
| `--cc-amber-bg`         | `#fffbeb`   | Warning chip background                    |
| `--cc-red`              | `#dc2626`   | Error / high-risk                          |
| `--cc-red-bg`           | `#fef2f2`   | Error chip background                      |

---

## Typography

### Font Families
| Role       | Family          | Import                                                                 |
|------------|-----------------|------------------------------------------------------------------------|
| Headings   | `Larken`        | (licensed/self-hosted — dashboard uses **Geist** as stand-in)         |
| Body       | `IBM Plex Sans` | `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700` |
| Data / Mono| `IBM Plex Mono` | `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600` |
| UI / Alt   | `Geist`         | `https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900` |

> **Dashboard font stack applied:**
> - Body: `'IBM Plex Sans', 'Geist', sans-serif`
> - Headings/Display: `'Geist', 'IBM Plex Sans', sans-serif`
> - Mono/Data: `'IBM Plex Mono', 'SF Mono', ui-monospace, monospace`

### Type Scale (extracted from site)
| Token              | Value   |
|--------------------|---------|
| `--fs-display`     | `72px`  |
| `--fs-heading-md`  | `48px`  |
| `--fs-heading-sm`  | `24px`  |
| `--fs-body-lg`     | `16px`  |
| `--fs-body`        | `14px`  |
| `--fs-small`       | `12px`  |
| `--lh-tight`       | `110%`  |
| `--lh-normal`      | `120%`  |
| `--lh-relaxed`     | `150%`  |

---

## Spacing Scale
| Token          | Value  |
|----------------|--------|
| `--space-xs`   | `8px`  |
| `--space-sm`   | `12px` |
| `--space-md`   | `16px` |
| `--space-lg`   | `24px` |
| `--space-xl`   | `32px` |

---

## Border Radius
| Token          | Value         | Usage                        |
|----------------|---------------|------------------------------|
| `--radius-sm`  | `4px`         | Chips, badges, tight elements|
| `--radius-md`  | `6px`         | Buttons, inputs              |
| `--radius-lg`  | `10px`        | Cards, modals                |
| `--radius-full`| `9999px`      | Pills, avatars               |

> Site uses minimal radii (4-6px) reflecting a clean fintech aesthetic.
> Dashboard cards use 10-12px radius for a softer, data-dense layout.

---

## Button Styles
```css
/* Primary CTA */
.btn-primary {
  background: #005eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;          /* sm */
  font-weight: 700;
  font-family: 'IBM Plex Sans', sans-serif;
  transition: opacity 0.3s ease;
}
.btn-primary:hover { opacity: 0.88; }

/* Secondary */
.btn-secondary {
  background: transparent;
  border: 1px solid #e2e7f0;
  border-radius: 6px;
  color: #3d4f6e;
  padding: 10px 20px;
}
```

---

## Visual Motifs & Patterns
- **Logo mark**: Hexagon/shield with inner checkmark — represents verification & security
- **Color gradient on logo**: `linear-gradient(135deg, #005eff, #003acc)`
- **Accent line on cards**: 1px top-border gradient `linear-gradient(90deg, #005eff60, transparent)`
- **Focus ring**: `0 0 0 3px rgba(0,94,255,0.15)` — brand blue tint
- **Charts primary**: Navy `#0a1264` for premium/BC, Blue `#005eff` for standard/FS

---

## Tone of Voice
- **Register**: Professional B2C fintech — clear, concise, trust-first
- **Positioning**: Privacy-forward — "Your data stays yours. Always"
- **Audience**: Individuals seeking credit assessment; also B2B lead buyers
- **Messaging themes**: Transparency, security, verification, control
- **Do**: Use plain language, action-oriented CTAs, reassuring copy
- **Don't**: Use jargon, passive voice, or vague promises

---

## Dark Mode Tokens (applied in dashboard)
| Token          | Dark Value  |
|----------------|-------------|
| `--cc-bg`      | `#0d0f14`   |
| `--cc-surface` | `#13161d`   |
| `--cc-navy`    | `#030924`   |
| `--cc-blue`    | `#1a6fff`   |
| `--cc-blue2`   | `#4d94ff`   |
| `--cc-text`    | `#f0f2f8`   |
