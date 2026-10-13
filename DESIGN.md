---
name: Observatorio Estadístico Departamental Hotelero
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#584141'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#8b7171'
  outline-variant: '#dfbfbf'
  surface-tint: '#ab323e'
  primary: '#6e0018'
  on-primary: '#ffffff'
  primary-container: '#8f1d2c'
  on-primary-container: '#ffa0a3'
  inverse-primary: '#ffb3b4'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#453000'
  on-tertiary: '#ffffff'
  tertiary-container: '#624500'
  on-tertiary-container: '#deb465'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b4'
  on-primary-fixed: '#40000a'
  on-primary-fixed-variant: '#8a1929'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#ebc070'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  kpi-metric:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

The design system projects civic gravitas, analytical rigor, and institutional authority for the statistical and hospitality registry of the Department of Oruro, Bolivia. 

The aesthetic is **Corporate / Modern** anchored in high-precision data presentation:
- **Atmosphere:** Sober, trustworthy, precise, and distinctly department-oriented without bureaucratic clutter.
- **Visual Identity:** Traditional deep crimson hues reminiscent of regional civic emblems, counterbalanced by slate architecture, gold filigree accents for official certifications, and crisp tabular data containers.
- **Target Audience:** Public officials, hotel administrators, economic researchers, and regional planning authorities requiring immediate compliance monitoring and statistical reporting.
- **Emotional Response:** Confidence in data fidelity, administrative clarity, and operational discipline.

## Colors

The palette establishes an institutional hierarchy rooted in Bolivian civic sobriety and statistical clarity.

### Functional Roles:
- **Primary Institutional Crimson (`#8F1D2C` / Dark `#7A1521`):** Applied to primary actions, official headers, active structural tabs, and prominent brand anchors.
- **Secondary Slate (`#1E293B` / Dark Neutral `#0F172A`):** Used for analytical navigation rails, primary headers, data filter shells, and dense typography.
- **Tertiary Ochre / Institutional Bronze (`#B48E43` / Metallic `#D4AF37`):** Reserved for official seals, verification badges, certified metrics, and formal highlights.
- **Emerald Verification (`#0F766E`):** Represents submitted affidavits, ratified declarations, and valid monthly registries.

### Neutrals & Surfaces:
- **Canvas Base:** `#F8FAFC` (Slate 50) and subtle grouping layers at `#F1F5F9` (Slate 100).
- **Structural Dividers:** `#E2E8F0` (Slate 200) for high-precision table rows and card borders.
- **Typography:** `#0F172A` for primary metrics, `#334155` for table content, and `#64748B` for secondary meta-labels.

### Compliance & Status Signals:
- **Compliant / On-Time (`#16A34A`):** Complete declarations and optimal hotel occupancy.
- **Pending / In-Review (`#D97706`):** Approaching expiration dates, draft returns.
- **Non-Compliant / Overdue (`#DC2626`):** Late filings, penalty notices, critical occupancy alerts.

## Typography

The type system balances administrative dignity with analytical efficiency.

- **Headlines:** Set in `Plus Jakarta Sans` for clean, contemporary geometric authority in sectional headers, page titles, and institutional credentials.
- **Body & Tabular Data:** Set in `Inter`. All numerical data across grids, KPI cards, and financial indicators must activate OpenType tabular lining figures (`font-feature-settings: "tnum" 1, "cv05" 1`) to guarantee vertical decimal alignment across comparative tables.
- **Data Labels & Microcopy:** Crisp uppercase weights with widened tracking are used for status definitions, regulatory codes, and departmental categories to prevent ambiguity in dense views.

## Layout & Spacing

The layout is built around a **12-column fluid data grid** with strict compact constraints suited for high-density administrative work.

- **Desktop (>= 1280px):** 12 columns, 240px fixed institutional sidebar navigation, 32px canvas margins, and 20px gutters. Workspaces optimize horizontal real estate for multi-column occupancy tables and analytical graphs.
- **Tablet (768px - 1279px):** 8 columns, collapsed collapsible icon rail, 24px canvas margins, and 16px gutters. Analytical charts wrap below primary KPI indicators.
- **Mobile (< 768px):** 4 columns, persistent top government banner with sliding drawer, 16px margins, and 12px gutters. High-density data tables become horizontally scrollable cards or stacked metadata rows.
- **Internal Density:** Spacing within operational cards and data grids adheres to a tight 4px baseline, keeping row height disciplined at 40px for compact tables and 48px for standard views.

## Elevation & Depth

Visual hierarchy is maintained through **low-contrast outlines and structural tonal tiers** rather than heavy drop shadows, reinforcing a flat, official look.

- **Layer 0 (Canvas):** `#F8FAFC` base application background.
- **Layer 1 (Card & Module Surfaces):** Pure `#FFFFFF` enclosed by a crisp, continuous `1px solid #E2E8F0` border. Shadows are minimal (`box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05)`).
- **Layer 2 (Dropdowns, Popovers, Date Pickers):** Elevated surface with `#FFFFFF`, bordered by `#CBD5E1`, with a restrained directional shadow (`0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`).
- **Layer 3 (Modal Dialogs & Compliance Overlays):** `#FFFFFF` surrounded by a darkened scrim (`rgba(15, 23, 42, 0.60)` backdrop blur at 2px) and focused shadow (`0 10px 15px -3px rgba(15, 23, 42, 0.12)`).
- **State Embellishment:** Selected items or focused rows avoid heavy shadows; they use a left accent border (`3px solid #8F1D2C`) combined with a soft tint (`rgba(143, 29, 44, 0.04)`).

## Shapes

The design system adopts **Soft (`1`)** geometry to convey institutional permanence and technical precision.

- **Standard Elements:** Input fields, filter selects, buttons, and system cards utilize a subtle `0.25rem` (4px) corner radius.
- **Containers & Flyouts:** Dialogs and master statistical containers use `rounded-lg` (`0.5rem` / 8px).
- **Pill Exception:** Rounded-full styling is reserved strictly for count indicators, compliance status pills, and categorical tag badges to maximize contrast against angular data tables.

## Components

### Buttons
- **Primary Institutional:** Solid `#8F1D2C` background, white label, 0.25rem radius, height 38px. Hover state shifts to `#7A1521`. Focus state reveals a 2px offset ring in `#B48E43`.
- **Secondary Corporate:** Slate `#1E293B` background, white text, for secondary export actions and analytical query triggers.
- **Tertiary / Outline:** White background with `1px solid #CBD5E1`, `#334155` text. Hover transitions to `#F1F5F9`.

### Statistical Cards & KPI Modules
- Surfaces feature pure white backgrounds with `#E2E8F0` borders. Top edge includes an optional 2px accent line indicating metric category (Crimson for general occupancy, Slate for room capacity, Ochre for revenue/rates).
- Metric numerals use `kpi-metric` with tabular figures, paired with percentage delta pills (`+4.2%`) in emerald or red.

### High-Density Data Tables
- **Header:** Sticky header with `#F1F5F9` background, `#475569` uppercase bold labels (`label-sm`), bottom border `2px solid #CBD5E1`.
- **Rows:** Minimum height 40px, alternating zebra stripes (`#FFFFFF` and `#F8FAFC`). Hover state highlights rows in `#F1F5F9` with a cursor pointer.
- **Cell Alignment:** Text fields left-aligned; all numeric rates, dates, and currency right-aligned using tabular figures.

### Status Badges & Compliance Chips
- Compact dimensions (height 22px), pill-shaped with `0.75rem` radius, light background tint with high-contrast text:
  - *Presentado / Válido:* `#DCFCE7` background, `#15803D` border/text with a 6px solid emerald dot.
  - *Pendiente:* `#FEF3C7` background, `#B45309` border/text.
  - *Fuera de Plazo:* `#FEE2E2` background, `#B91C1C` border/text.
  - *Certificado Oficial:* `#FEF9C3` background, `#A16207` text with a `#B48E43` bronze border.

### Input Fields & Filter Toolbars
- Height 36px, `1px solid #CBD5E1` border, `#FFFFFF` background, inset text in `#0F172A`. Active focus invokes a border tint of `#8F1D2C` and a box shadow of `0 0 0 1px #8F1D2C`.
- Multi-select and date ranges feature compact preset pills for rapid reporting periods (e.g., "Mes Vigente", "Trimestre I", "Carnaval de Oruro").

### Checkboxes & Radio Controls
- Square checkbox (4px radius) and circular radio. Inchecked state features `1.5px solid #94A3B8`. Checked state fills with `#8F1D2C` displaying a sharp white verification checkmark.