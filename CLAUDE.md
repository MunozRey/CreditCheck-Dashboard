# CLAUDE.md — CreditCheck Dashboard

> Guía de referencia para Claude Code. Lee este archivo antes de cualquier tarea.
> Actualizado: 2026-03-14

---

## Stack detectado (package.json)

| Capa | Tecnología | Versión |
|------|-----------|---------|
| UI Framework | React | ^18.3.1 |
| Bundler | Vite | ^5.4.8 |
| Vite plugin | @vitejs/plugin-react | ^4.3.1 |
| Charts | Recharts | ^2.12.7 |
| Spreadsheet | xlsx | ^0.18.5 |
| Runtime | ESM (`"type": "module"`) | — |
| Dev server | `vite` → `localhost:5173` | — |
| Build output | `dist/` | — |

**Scripts:**
```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## Mapa de archivos críticos

```
CreditCheck Dashboard/
├── leads_dashboard_en (2).jsx   ← MONOLITO principal (4245 líneas, 240KB)
│                                   NO modificar sin leer CLEANUP_PLAN primero
├── CLEANUP_PLAN.md              ← Hoja de ruta del refactor — LEER SIEMPRE
├── branding.md                  ← Brand tokens de creditchecker.io — fuente de verdad
├── CLAUDE.md                    ← Este archivo
│
├── src/
│   ├── constants/
│   │   ├── verticals.js         ← VERTICALS_DEF, COUNTRY_META, applyVehicleFilter()
│   │   └── themes.js            ← THEMES light/dark (referenciado pero no en disco aún)
│   ├── utils/
│   │   ├── scoring.js           ← scoreLead() — INTOCABLE. Modelo 100pts.
│   │   ├── fetchLiveData.js     ← Fetcher XLSX del endpoint live
│   │   ├── defaultData.js       ← Datos de demo (formato Pipedrive)
│   │   ├── revenue.js           ← Lógica de cálculo de revenue
│   │   └── xlsxParser.js        ← Parser XLSX (también inline en monolito)
│   ├── styles/
│   │   └── shared.js            ← FS, FW, R, LABEL_MONO, inputStyle, CHIP_STYLE
│   ├── context/
│   │   └── ThemeContext.jsx     ← ThemeProvider + useTheme() — módulo nuevo
│   └── components/
│       ├── Card.jsx             ← Extraído del monolito
│       ├── KpiCard.jsx          ← Extraído del monolito
│       ├── SectionTitle.jsx     ← Extraído del monolito
│       ├── TabBar.jsx           ← Extraído del monolito
│       ├── Chip.jsx             ← Extraído del monolito
│       ├── PreciseInput.jsx     ← Extraído del monolito
│       ├── FieldRow.jsx         ← Extraído del monolito
│       ├── Avatar.jsx           ← Extraído del monolito
│       ├── CustomTooltip.jsx    ← Extraído del monolito
│       └── ScoreBar.jsx         ← Extraído del monolito
│
├── package.json
├── vite.config.js               ← Sin aliases configurados aún
└── index.html                   ← Entry point
```

### Archivos que AÚN FALTAN para completar el split (ver CLEANUP_PLAN Rule 5):
- `src/constants/themes.js` — aún no existe en disco
- `src/tabs/` — todos los tabs (LeadsTab, AnalyticsTab, etc.)
- `src/components/ExportModal.jsx`, `ErrorBoundary.jsx`, `ProgressBar.jsx`
- `src/App.jsx` — entry point React
- `src/utils/reportEngine.js` — makeReport(), REPORT_CSS, etc.

---

## CLEANUP_PLAN — Resumen accionable

> Estado: **Phase 1 completa** (inventario). Phase 2 pendiente de aprobación.

### 🔴 Rule 1 — Bugs + Dead Code (PRIORIDAD MÁXIMA, riesgo cero)
- [ ] **BUG**: `exportFormat` → `fmt` en líneas 3516–3517 del monolito
- [ ] Eliminar campo `phone` de `ExportModal.FIELD_DEFS` (exporta siempre `""`)
- [ ] Eliminar prop `className=""` no usada de `Card`

### 🟡 Rule 2 — Deduplicación
- [ ] Crear `src/styles/shared.js` ← **YA EXISTE**, migrar callers en monolito
- [ ] Crear `src/components/ProgressBar.jsx` (patrón repetido 15+ veces)
- [ ] `ExportModal`: reemplazar inline `applyVehicleFilter` → import de `src/constants/verticals.js`
- [ ] Auditar callers de `<Chip>` vs CHIP_STYLE inline
- [ ] Tras split: eliminar `fetchLiveData` y `fmtAgo` inline del monolito

### 🟡 Rule 3 — Anti-patterns React
- [ ] Eliminar `useMemo` trivial en AnalyticsTab línea 742
- [ ] Eliminar `useMemo` trivial en LeadsTab línea 590
- [ ] Eliminar `eslint-disable` en ExportModal useMemo

### 🔴 Rule 4 — ThemeContext (APROBACIÓN SEPARADA requerida)
- [ ] Migrar `T` global mutable → `useTheme()` context en todos los componentes
- [ ] `src/context/ThemeContext.jsx` ya existe — falta integrarlo en el monolito

### 🟢 Rule 5 — Module Split (en progreso)
Componentes pendientes de extraer a `src/`:
- `ExportModal` (~441 líneas) → extraer `ExportFilters`, `ExportPreview`, `ExportActions`
- `AppInner` (~357 líneas) → extraer `NavBar`, `KpiStrip`, `LiveStatusBanner`
- `LeadScoringTab` (~272 líneas) → extraer `ScoreFilters`, `LeadScoreTable`, `ScoreMethodology`
- `MultiPartnerTab` (~280 líneas) → extraer `PartnerCard`
- `InsightsTab` (~260 líneas) → extraer `InsightBlock`
- `DataQualityTab` (~236 líneas) → extraer `QualityRow`
- `makeReport()` (~271 líneas) → mover a `src/utils/reportEngine.js`

---

## Sistema de Brand Tokens — Cómo usarlos

### Regla fundamental
```js
// ✅ CORRECTO — usa token
color: T.blue        // #005EFF en light, #1A6FFF en dark

// ❌ INCORRECTO — hardcoded
color: "#005EFF"
```

### Token object `T` (runtime)
El objeto `T` es un proxy mutable. En el monolito se lee directamente.
En componentes extraídos a `src/`, usar `const { T } = useTheme()` (ThemeContext).

### Tokens de color principales
| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `T.bg` | `#F5F6FA` | `#0D0F14` | Fondo de página |
| `T.surface` | `#FFFFFF` | `#13161D` | Cards, panels |
| `T.surface2` | `#F8F9FC` | `#1A1E27` | Inputs, thead |
| `T.surface3` | `#EEF1F8` | `#22273A` | Chips, hover |
| `T.border` | `#E2E7F0` | `#252A38` | Bordes default |
| `T.text` | `#0A1628` | `#F0F2F8` | Texto primario |
| `T.muted` | `#7080A0` | `#525D78` | Placeholder, captions |
| `T.blue` | `#005EFF` | `#1A6FFF` | CTA, links, activos |
| `T.navy` | `#0A1264` | `#030924` | NavBar, premium |
| `T.green` | `#059669` | `#10B981` | BC / success |
| `T.amber` | `#D97706` | `#F59E0B` | Warning |
| `T.red` | `#DC2626` | `#EF4444` | Error / riesgo |

### Constantes de estilo (`src/styles/shared.js`)
```js
import { FS, FW, R, LABEL_MONO, inputStyle } from '../styles/shared.js';

// Font sizes
FS.xs = 10   FS.sm = 11   FS.base = 12   FS.md = 13   FS.lg = 14

// Font weights
FW.normal = 400   FW.semibold = 600   FW.bold = 700

// Border radii
R.sm = 4   R.md = 8   R.lg = 12   R.pill = 9999

// Patrones
LABEL_MONO  // label monoespacio uppercase (20+ usos)
inputStyle(T)  // estilo input fecha/búsqueda (10+ usos)
```

### EXCEPCIÓN permitida
Los colores semánticos de verticales (`#005EFF`, `#00A651`, etc.) en `VERTICALS_DEF`
son colores de identidad del producto, **no** tokens de tema. No reemplazarlos.

---

## Mapa de agentes — Cuándo invocar cada uno

| Agente | Archivo | Cuándo usarlo |
|--------|---------|---------------|
| **analyst** | `.claude/agents/analyst.md` | Antes de cualquier cambio grande. Para auditar secciones del monolito. Para entender qué hace un componente. |
| **refactor-agent** | `.claude/agents/refactor-agent.md` | Para ejecutar items del CLEANUP_PLAN. Un item por sesión. |
| **implementer** | `.claude/agents/implementer.md` | Para añadir nuevas features o componentes. Lee CLEANUP_PLAN antes. |
| **branding-implementer** | `.claude/agents/branding-implementer.md` | Para corregir hardcoded colors/fonts. Para revisar consistencia visual. |
| **performance-optimizer** | `.claude/agents/performance-optimizer.md` | Cuando hay lentitud o bundle grande. Para auditar re-renders. |
| **state-auditor** | `.claude/agents/state-auditor.md` | Para decidir si introducir Zustand/Context. Para mapear prop drilling. |
| **data-agent** | `.claude/agents/data-agent.md` | Para importar nuevos CSVs/XLSXs. Para validar pipelines de datos. |
| **docs-agent** | `.claude/agents/docs-agent.md` | Tras cambios significativos. Para documentar componentes nuevos. |
| **reviewer** | `.claude/agents/reviewer.md` | **Gate obligatorio** antes de cerrar cualquier PR/sesión de cambios. |

---

## Reglas de routing — Cuándo ejecutar en paralelo vs secuencial

### ▶ PARALELO (lanzar simultáneamente)
```
analyst + state-auditor        → auditoría doble antes de refactor
analyst + performance-optimizer → diagnóstico completo del monolito
branding-implementer + docs-agent → branding + documentación de cambios
```

### ▶ SECUENCIAL (orden estricto)
```
1. analyst        → identifica problema
2. refactor-agent → ejecuta cambio
3. reviewer       → aprueba o bloquea
```
```
1. implementer    → crea feature
2. branding-implementer → verifica tokens
3. docs-agent     → documenta
4. reviewer       → gate final
```

### ▶ BACKGROUND (no bloquea trabajo principal)
```
docs-agent        → documentar mientras otro agente implementa
performance-optimizer → audit en paralelo al refactor
```

---

## Reglas críticas — NUNCA hacer esto

1. **NO modificar `scoreLead()` en `src/utils/scoring.js`** sin instrucción explícita del usuario
2. **NO hardcodear colores hex o rgb()** fuera de `src/styles/shared.js` o `VERTICALS_DEF`
3. **NO encadenar múltiples items del CLEANUP_PLAN** en una sola sesión de refactor-agent
4. **NO borrar código** del monolito sin confirmación explícita
5. **NO usar `window.localStorage` directamente** — la plataforma usa `window.storage.get/set`
6. **NO modificar `processRows()`** — lógica de parsing de XLSX, crítica para datos
7. **NO introducir nuevas dependencias npm** sin evaluar impacto en bundle (xlsx ya pesa ~1MB)

---

## Contexto de negocio

- **Producto**: CreditCheck — credit scoring Open Banking
- **Empresa**: Clovr Labs
- **Usuarios del dashboard**: Equipo de Business Development interno
- **Lead categories**: Bank Connected (BC) > Form Submitted (FS) > Incomplete
- **Scoring model**: 100 puntos — Income (25) + DTI (25) + LTI (15) + Employment (15) + Email (10) + Name (5) + Age (5)
- **Tiers**: A (≥75, ~20% BC) · B (50-74, ~58%) · C (30-49, ~20%) · D (<30, raro)
- **Endpoint live**: `https://ibancheck.io/api/credit-exports` (auto-fetch cada 60min)
- **Storage**: `window.storage.get/set` (API de plataforma, no localStorage)
