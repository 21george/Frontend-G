# 360Fit Coach Dashboard — UI Design Agent Guide

This document is the single source of truth for the visual design system, component patterns, and UX conventions used across the 360Fit coach dashboard. Follow it precisely when building new UI or modifying existing screens.

---

## 1. Design Philosophy

- **Tool-like, not marketing-like**: This is a productivity dashboard coaches stare at for hours. Density, clarity, and speed matter more than whitespace. Think "server management panel" or "professional IDE" aesthetic.
- **Dark-first, light-compatible**: Every screen must look native in dark mode (`html.dark`). Light mode is secondary but fully supported. The login/auth screens are dark-only cinematic experiences.
- **No Bootstrap / Material defaults**: Every primitive is custom-built or heavily themed. Avoid generic-looking components. The app uses Radix UI headless primitives but wraps them completely in custom styling.
- **Motion is purposeful**: Animations guide attention, never decorate. Use Framer Motion for page transitions and micro-interactions. CSS keyframes for simple enter effects.
- **Sidebar is the anchor**: The teal sidebar (`#132E35`) is the primary navigation anchor; pages sit inside a spacious main area to its right.
- **Card-based density**: Information is organized in bordered cards with subtle shadows (light) or borders (dark), not massive whitespace.
- **Energy identity**: Lime green (`#a3e635`) is the 360Fit signature accent. Used sparingly for highlights, active indicators, and the brand glow.

---

## 2. Tokens & Colour System

Always use CSS custom properties or Tailwind theme keys. Never hardcode hex colours except for the token definitions themselves.

### Brand
| Token | Value | Tailwind |
|---|---|---|
| `--brand` / `brand.DEFAULT` | `#132E35` | `bg-brand`, `text-brand` |
| `--brand-dark` | `#192230` | `bg-brand-dark` |
| `--brand-light` | `#EAF4F1` | `bg-brand-50` |
| `brand-600` | `#132E35` | Sidebar bg, deep brand |
| `brand-700` | `#1C4A54` | Brand dark variant |
| `brand-800` | `#0F2027` | Darkest brand |
| `brand-950` | `#030608` | Deepest black-teal |

### Accent (Emerald/Success)
| Token | Value | Tailwind |
|---|---|---|
| `--accent` / `accent.DEFAULT` | `#10B981` | `bg-accent`, `text-accent` |
| `--accent-light` | `#ECFDF5` | `bg-accent-50` |

### Energy (Lime — 360Fit identity)
| Token | Value | Tailwind |
|---|---|---|
| `--energy` / `energy.DEFAULT` | `#a3e635` | `bg-energy`, `text-energy` |
| `--energy-dark` | `#84cc16` | `bg-energy-dark` |
| `--energy-light` | `#d9f99d` | `bg-energy-200` |
| `--energy-glow` | `rgba(163,230,53,0.35)` | `shadow-energy-glow` |

### Surfaces
| Token | Light | Dark |
|---|---|---|
| `--bg-page` | `#f0f3f5` | `#121212` |
| `--bg-card` | `#ffffff` | `#1a1a1a` |
| `--bg-subtle` | `#f1f5f9` | `#1e1e1e` |
| `--bg-hover` | `#eff2f5` | `#252525` |
| `--text-primary` | `#121212` | `#ffffff` |
| `--text-secondary` | `#64748b` | `#a1a1aa` |
| `--text-tertiary` | `#94a3b8` | `#71717a` |
| `--border` | `#cdcfd2` | `rgba(255,255,255,0.06)` |
| `--border-hover` | `#b5b8bc` | `rgba(255,255,255,0.12)` |
| `--ring` | `#4f46e5` | `#818cf8` |

### Sidebar Tokens
| Token | Value |
|---|---|
| `--sidebar-bg` | `#132e35` |
| `--sidebar-bdr` | `rgba(255,255,255,0.1)` |
| `--sidebar-text` | `#ffffff` |
| `--sidebar-text-secondary` | `rgba(255,255,255,0.55)` |

### Button Tokens
| Token | Value |
|---|---|
| `--btn-bg` | `#0f2027` |
| `--btn-text` | `#ffffff` |
| `--btn-hover` | `#16313b` |
| `--btn-active` | `#0b171c` |

### Semantic Colours
| Name | Light | Dark Override |
|---|---|---|
| `danger` | `#EF4444` | `#fca5a5` |
| `warn` / `amber` | `#F59E0B` | `#fcd34d` |
| `blue` (info) | `#3B82F6` | `#60a5fa` |
| `indigo` (group) | `#6366F1` | `#818cf8` |

---

## 3. Typography

- **Font stack**: `DBScreenSans, "Helvetica Neue", arial, sans-serif` (declared in `globals.css` and `tailwind.config.ts`)
- **Display font**: `Unbounded` (Google Font, variable `--font-display`) — used sparingly for marketing headings (login page title only).
- **Mono font**: `JetBrains Mono` (variable `--font-mono`) — code, timestamps, data tables, login codes.
- **Font weights used**: 400 (body), 500 (medium emphasis), 600 (headings, labels), 700 (bold numbers, display).

### Hierarchy
| Element | Size | Weight | Letter-Spacing | Line-Height |
|---|---|---|---|---|
| Page title (`h1`) | `1.875rem` (30px) | 600 | `-0.025em` | 1.25 |
| Section title (`h2`) | `1.5rem` (24px) | 600 | `-0.025em` | 1.25 |
| Card title (`h3`) | `1.25rem` (20px) | 600 | `-0.02em` | 1.3 |
| Subsection (`h4`) | `1.125rem` (18px) | 600 | `-0.01em` | 1.3 |
| Body | `1rem` (16px) | 400 | `-0.01em` | 1.6 |
| Small / caption | `0.875rem` (14px) | 500 | normal | 1.5 |
| XS / label | `0.75rem` (12px) | 500 | normal | 1.4 |
| **KPI labels** | `0.625rem` (10px) | 700 | `0.18em` uppercase | 1 |
| **Micro labels** | `0.6875rem` (11px) | 600 | `0.05em` uppercase | 1.2 |
| **Tabular data** | `0.8125rem` (13px) | 500 | normal | 1.4 |

---

## 4. Layout Architecture

```
RootLayout
├── <html class="dark | ">          (toggle via next-themes)
├── <body> — bg-page, text-primary
│   ├── Sidebar (fixed left, z-30)
│   │   ├── Brand header (logo + "360Fit")
│   │   ├── Nav links (icon + label)
│   │   ├── Plan badge (bottom, shows tier)
│   │   └── Coach profile (bottom, avatar + name + logout)
│   ├── <main> — ml-0 lg:ml-[sidebar-width]
│   │   └── DashboardLayout (Framer Motion wrapper)
│   │       └── Page content
│   └── Toaster / Modals (portals)
```

### Sidebar Specifications
- **Expanded width**: 256px (`w-64`)
- **Collapsed width**: 80px
- **Background**: `var(--sidebar-bg)` (`#132e35`)
- **Border**: `var(--sidebar-bdr)` (`rgba(255,255,255,0.1)`)
- **Active nav item**: `bg-white/[0.1] text-white`
- **Inactive nav item**: `text-white/[0.55] hover:bg-white/[0.05] hover:text-white`
- **Nav icon size**: `w-5 h-5`
- **Nav text**: `text-base font-medium`
- **Collapse toggle**: `-right-3 top-20`, `w-6 h-6`, white bg with border
- **Mobile**: Full overlay drawer with spring animation (`damping: 25, stiffness: 300`)

### Main Content Area
- **Padding**: `px-6 py-8` desktop, `px-4 py-6` tablet, `px-4 py-4` mobile
- **Max content width**: None by default; use natural flow. Auth pages use `max-w-[340px]`.
- **Background**: Always `bg-[var(--bg-page)]` on the outer wrapper.

### Page Header Pattern (DashboardHeader)
Every authenticated page uses `DashboardHeader` which provides:
- **Breadcrumb**: `Dashboard > CurrentPage` in `text-xs text-[var(--text-tertiary)]`
- **Greeting** (optional): `Good {morning|afternoon|evening}, {name}` in micro-label style
- **Date**: Full date below greeting
- **Page title**: `text-xl sm:text-2xl font-bold tracking-tight`
- **Subtitle**: `text-xs sm:text-sm text-slate-500 dark:text-neutral-200`
- **Right side actions**:
  - Weather badge
  - Notifications bell
  - Nearby gyms button
  - Contextual quick action buttons (page-dependent)
  - Theme toggle (w-14 h-7 rounded-xl switch)
  - Coach avatar + name (linked to `/settings/edit`)

### Grid Patterns
- **Dashboard**: `grid grid-cols-1 xl:grid-cols-5 gap-4` for mixed widgets
- **KPI row**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Settings**: `grid grid-cols-1 lg:grid-cols-3 gap-6` (2:1 ratio)
- **Client list**: Single column card rows
- **Detail pages**: Often use sidebar + main content split

---

## 5. Component Primitives (Exhaustive)

### 5.1 Button (`components/ui/button.tsx`)

**API:**
```tsx
<Button variant="primary | secondary | danger | ghost" size="sm | md | lg" loading={boolean} className="...">
```

| Variant | Background | Text | Border | Hover | Dark Mode |
|---|---|---|---|---|---|
| **primary** | `var(--btn-bg)` `#0f2027` | white | none | `#16313b` | Same |
| **secondary** | white | slate-700 | slate-200 | slate-50 | `bg-white/[0.06] text-slate-200 border-white/[0.08]` |
| **danger** | red-500 | white | none | red-600 | Same |
| **ghost** | transparent | slate-600 | none | slate-100 | `text-slate-300 hover:bg-white/[0.06]` |

**Sizes:**
- `sm`: `px-3 py-1.5 text-sm`
- `md`: `px-4 py-2.5 text-sm` (default)
- `lg`: `px-6 py-3 text-base`

**Loading state:**
- Shows `animate-spin` border-2 border-t-transparent spinner inside button
- `aria-busy="true"` set automatically
- Button stays same dimensions, text remains visible beside spinner

**Rules:**
- Always use `gap-2` for icon+text buttons
- Icon-only buttons: square `p-2` with `rounded-lg`
- Focus: `focus-visible:ring-2 focus-visible:ring-offset-2`
- Disabled: `opacity-40 cursor-not-allowed`

### 5.2 Cards

**Three card abstractions exist:**

1. **`.card` CSS class** (`globals.css`):
   ```tsx
   <div className="card rounded-2xl">...</div>
   ```
   - Border: `var(--border)`
   - Background: `var(--bg-card)`
   - Shadow: `var(--shadow-sm)` in light, none in dark
   - Radius: `rounded-2xl` (16px)

2. **`<Card>` component** (`components/ui/Card.tsx`):
   ```tsx
   <Card className="...">
     <CardHeader className="px-6 py-4">...</CardHeader>
     <CardBody className="px-6 py-5">...</CardBody>
   </Card>
   ```

3. **Inline card pattern** (Settings page etc.):
   ```tsx
   <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
   ```

**Card Header Pattern** (used in Settings):
```tsx
<div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-[var(--btn-bg)] flex items-center justify-center rounded-lg">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h2 className="text-base font-semibold text-[var(--text-primary)]">Title</h2>
  </div>
  {/* optional action */}
</div>
```

### 5.3 Modals / Dialogs

**`<Modal>` component** (`components/ui/Modal.tsx`):

**API:**
```tsx
<Modal open={boolean} onClose={() => {}} title="string" size="sm | md | lg | xl">
  {children}
</Modal>
```

**Features:**
- Focus trap (Tab cycles within modal)
- Escape key handling (only topmost modal closes)
- Body scroll lock (`overflow: hidden`)
- Focus restoration on close
- Stacked modal support via global stack

**Visual:**
- Backdrop: `bg-black/50 backdrop-blur-sm`
- Panel: `bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl`
- Top accent: `h-[3px] bg-gradient-to-r from-brand-600 via-energy-400 to-brand-600`
- Close button: absolute top-4 right-4, `aria-label="Close"`
- Sizes: `sm` (max-w-md), `md` (max-w-lg), `lg` (max-w-2xl), `xl` (max-w-4xl)
- Animation: `animate-scale-in` (150ms)

**`<ConfirmDialog>` component:**
- Centred layout with icon (AlertTriangle or info icon)
- Two buttons: Cancel (secondary) + Confirm (danger or primary)
- Loading state on confirm button

### 5.4 Forms

**`<Input>` component** (`components/ui/Input.tsx`):

**API:**
```tsx
<Input label="Email" error="Invalid email" hint="We'll never share your email" />
```

**Styles:**
- `block w-full px-3.5 py-2.5 text-sm`
- Border: `border-slate-300` light, `border-white/[0.08]` dark
- Background: white light, `var(--bg-subtle)` dark
- Focus: `focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700`
- Error: `border-red-300 bg-red-50 text-red-900`
- Label: `block text-sm font-medium text-slate-700 dark:text-slate-300`
- Error text: `text-xs text-red-500 font-medium`
- Hint text: `text-xs text-slate-500 dark:text-slate-400`

**`<FormField>` component** (`components/ui/FormField.tsx`):

Wraps any input with label, required asterisk, and error:
```tsx
<FormField label="Name" required error={errors.name}>
  <TextInput {...register('name')} />
</FormField>
```

**`<TextInput>` / `<TextArea>` / `<SelectInput>`:**
- Same border/focus/error patterns
- TextArea: `resize-none`
- Select: options array prop + placeholder

**Form validation:** React Hook Form + Zod. Error messages appear below inputs with Framer Motion `AnimatePresence` for smooth enter/exit.

### 5.5 Badges

**`<Badge>` component** (`components/ui/Badge.tsx`):

**API:**
```tsx
<Badge variant="green | blue | yellow | red | gray">Label</Badge>
```

| Variant | Light | Dark |
|---|---|---|
| `green` | `bg-emerald-50 text-emerald-700` | `dark:bg-emerald-900/20 dark:text-emerald-400` |
| `blue` | `bg-blue-50 text-blue-700` | `dark:bg-blue-900/20 dark:text-blue-400` |
| `red` | `bg-red-50 text-red-700` | `dark:bg-red-900/20 dark:text-red-400` |
| `yellow` | `bg-amber-50 text-amber-700` | `dark:bg-amber-900/20 dark:text-amber-400` |
| `gray` | `bg-[var(--bg-subtle)] text-[var(--text-secondary)]` | `dark:bg-white/[0.06]` |

**Custom status badges** (Client page example):
```tsx
<span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-2xl dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
  On Track
</span>
```

### 5.6 Avatar (`components/ui/Avatar.tsx`)

**API:**
```tsx
<Avatar name="John" surname="Doe" photo="url" size="h-11 w-11" variant="brand | colored" shape="circle | squircle" className="..." />
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `brand` (solid teal), `colored` (hashed per name) | `brand` |
| `shape` | `circle`, `squircle` | `circle` |
| `size` | Any Tailwind size classes | `h-11 w-11` |

**Behaviour:**
- Shows photo via Next.js `<Image>` with `unoptimized`
- Falls back to initials on error or when no photo
- `colored` variant uses deterministic hash from name against 8-colour palette
- `brand` variant: `bg-brand-600 text-white text-sm font-bold`
- `squircle` shape: `rounded-10` (10px radius)

### 5.7 Search (`components/ui/AnimatedSearch.tsx`)

**API:**
```tsx
<AnimatedSearch className="relative mb-4" iconClassName="left-4 w-4 h-4" active={search.length > 0}>
  <input ... />
</AnimatedSearch>
```

**Visual:**
- Search icon with animated energy rings on focus
- Inner ring: `bg-energy-400/20 h-6 w-6`
- Outer ring: `bg-energy-400/10 h-9 w-9`
- Icon transitions from `text-[var(--text-tertiary)]` to `text-energy-600 dark:text-energy-400` on focus
- Stroke width increases from 2 to 2.5 on focus

### 5.8 Progress (`components/ui/SegmentedProgressBar.tsx`)

**API:**
```tsx
<SegmentedProgressBar percentage={75} segments={10} activeColor="bg-emerald-500" inactiveColor="bg-[var(--bg-subtle)]" />
```

**Visual:**
- Segmented bar: 10 equal segments with `h-8` each
- Filled segments use `activeColor`, unfilled use `inactiveColor`
- Colour logic example (client progress):
  - `>= 80%`: `bg-emerald-500`
  - `>= 50%`: `bg-blue-500`
  - `>= 25%`: `bg-amber-500`
  - `< 25%`: `bg-slate-400`
- Percentage shown as `text-xs font-mono font-semibold` on right

### 5.9 DataTable (`components/ui/DataTable.tsx`)

**API:**
```tsx
<DataTable
  data={items}
  columns={[{ key: 'name', header: 'Name', render: (item) => ..., sortable: true, sortFn: (a,b) => ... }]}
  keyExtractor={(item) => item.id}
  searchable={true}
  searchFn={(item, query) => ...}
  onRowClick={(item) => ...}
  headerActions={<Button>Add</Button>}
/>
```

**Visual:**
- Toolbar: `flex items-center justify-between px-4 py-3 border-b border-[var(--border)]`
- Search input: `pl-9 pr-3 py-1.5 bg-[var(--bg-subtle)]`
- Header: `text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]`
- Rows: `border-b border-[var(--border)] hover:bg-[#13131314] dark:hover:bg-white/[0.03]`
- Sort icons: `ChevronsUpDown` inactive, `ChevronUp`/`ChevronDown` active in `brand-700`

### 5.10 QueryWrapper (`components/ui/QueryWrapper.tsx`)

**API:**
```tsx
<QueryWrapper
  query={useClients()}
  skeleton={<CustomSkeleton />}
  emptyIcon={Users}
  emptyTitle="No clients yet"
  emptyDescription="Add your first client"
  emptyAction={<Button>Add Client</Button>}
  isEmpty={(data) => data.length === 0}
>
  {(data) => <ClientList data={data} />}
</QueryWrapper>
```

**States:**
1. Loading → shows `skeleton` prop or `<LoadingSpinner />` centred
2. Error → red icon + "Something went wrong" + retry button
3. Empty → `<EmptyState>` with icon, title, description, action
4. Success → renders children with data

### 5.11 EmptyState (`components/ui/EmptyState.tsx`)

**Visual:**
- Centred flex column, `py-16 px-4`
- Icon container: `w-16 h-16 bg-[var(--bg-subtle)]`
- Icon: `w-8 h-8 text-[var(--text-tertiary)]`
- Title: `text-base font-semibold text-[var(--text-primary)]`
- Description: `text-sm text-[var(--text-secondary)] max-w-xs`
- Action: `mt-4`

### 5.12 Skeleton (`components/ui/Skeleton.tsx`)

**API:**
```tsx
<Skeleton className="h-4 w-40" />
```

- `animate-pulse`
- Background: `bg-[var(--bg-subtle)] dark:bg-white/[0.06]`
- Always use `rounded` (default) or `rounded-full` for circles
- Skeleton types available:
  - `PageSkeleton` — full page blocks
  - `TableSkeleton` — table rows
  - `CardGridSkeleton` — card grid layout
  - `CalendarSkeleton` — calendar blocks
  - `SettingsSkeleton` — settings page layout
  - `DashboardSkeleton` — dashboard widget layout

### 5.13 Toggle (Settings pattern)

**Inline toggle (not a reusable component, copy pattern):**
```tsx
<button
  type="button"
  role="switch"
  aria-checked={checked}
  onClick={() => onChange(!checked)}
  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
    checked ? "bg-[var(--accent)]" : "bg-slate-300 dark:bg-slate-600"
  }`}
>
  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition duration-200 ${
    checked ? "translate-x-5" : "translate-x-0"
  }`} />
</button>
```

---

## 6. Dark Mode Rules (Comprehensive)

1. **Always write both modes**. Every new component must define light and dark styles.
2. **Use `html.dark` selector** in CSS layers, or `dark:` prefix in Tailwind.
3. **Never use pure black** (`#000000`). Darkest surface is `#121212` (`var(--bg-page)`).
4. **Borders in dark mode**: Use `rgba(255,255,255,0.06)` for subtle separation, `0.12` for hover, `0.14` for focus/active.
5. **Text in dark mode**:
   - Primary: `#ffffff`
   - Secondary: `#a1a1aa`
   - Tertiary: `#71717a`
6. **Cards in dark mode**: No shadow; rely on `bg-[#1A1A1A]` + `border-white/[0.06]` or `border-white/[0.07]`.
7. **Energy glow**: Increase opacity in dark mode (`0.45` vs `0.35`).
8. **Hover states in dark mode**: Use `bg-white/[0.03]`, `bg-white/[0.06]`, `bg-white/[0.1]` for progressive emphasis.
9. **Inputs in dark mode**: `bg-white/[0.04]`, `border-white/[0.08]`, `text-slate-100`, `placeholder:text-slate-500`.
10. **Badges in dark mode**: Use `bg-{color}-900/20` + `text-{color}-400` + `border-{color}-500/20` or `border-{color}-800`.
11. **Buttons in dark mode**:
    - Primary: stays `var(--btn-bg)` (same as light)
    - Secondary: `bg-white/[0.06] border-white/[0.08] text-slate-200`
    - Ghost: `text-slate-300 hover:bg-white/[0.06]`

---

## 7. Animation & Motion (Complete Catalog)

| Effect | Implementation | Duration |
|---|---|---|
| Page enter | `DashboardLayout` — `opacity: 0→1, y: 10→0` | 150ms |
| Sidebar item hover | `framer-motion` `whileHover={{ x: 4 }}` | 150ms |
| Mobile drawer | `framer-motion` spring, `damping: 25, stiffness: 300` | physics |
| Modal enter | `animate-scale-in` (CSS keyframe) | 150ms |
| Modal backdrop | `animate-fade-in` | 200ms |
| KPI cards | `framer-motion` staggered `initial={{ opacity: 0, y: 16 }}` | 150ms + delay |
| Energy pulse | `animate-energy-pulse` | 3s infinite |
| Client list rows | `staggerChildren: 0.06`, `initial: {opacity: 0, x: -20, scale: 0.97}`, spring physics | 400ms stagger |
| Client row hover | `whileHover: {y: -1}` spring | physics |
| Login page card | `initial: {opacity: 0, y: 40, scale: 0.95}` to visible | 700ms ease `[0.22, 1, 0.36, 1]` |
| Login form items | `staggerChildren: 0.08, delayChildren: 0.2` | 500ms each |
| Login button shimmer | `bg-gradient-to-r` sliding `x: -100% → 200%` | 1.2s infinite |
| Login particles | Random floating dots with opacity/scale cycles | 12-20s infinite |
| Breathing glow | Radial gradient opacity `[0.1, 0.2, 0.1]` + scale `[1, 1.1, 1]` | 6s infinite |
| Status ring | `boxShadow` pulse `[0px, 3px, 0px]` | 2.5s infinite |
| Search rings | Scale + opacity on focus, 700ms ease-out | 700ms |
| Theme toggle | `translate-x` + opacity dual-icon switch | 300ms ease-in-out |
| Error banner | `AnimatePresence` height + opacity | 300ms |
| Eye icon toggle | `AnimatePresence mode="wait"` scale `[0.5→1→0.5]` | 150ms |

**Rules:**
- Prefer `transform` and `opacity` only (GPU-friendly).
- Spring physics: `stiffness: 400, damping: 28, mass: 0.6` for snappy interactions.
- Respect `prefers-reduced-motion` when practical.

---

## 8. Iconography

- **Library**: `lucide-react` exclusively.
- **Default size**: `w-5 h-5` (20px) in nav and buttons.
- **Small size**: `w-4 h-4` (16px) in badges, inline text, table actions.
- **Micro size**: `w-3.5 h-3.5` (14px) in compact UI, breadcrumbs.
- **Colour**: Inherit from parent text colour or use `text-[var(--text-secondary)]`.
- **No emojis** in UI. Ever.

---

## 9. Accessibility

- **Focus rings**: `focus-visible:ring-2 focus-visible:ring-brand-500` on all interactive elements.
- **Modals**: Focus trap, `aria-modal="true"`, restore focus on close, close on Escape.
- **Colours**: All text on coloured backgrounds must pass WCAG AA contrast.
- **Semantic HTML**: Use `<button>` for actions, `<a>` for navigation. No `div` click handlers.
- **Sidebar nav**: Active state is communicated visually (bg + text colour).
- **Toggle buttons**: `role="switch" aria-checked={checked}`.
- **Loading states**: `aria-busy="true"` on buttons, `sr-only` text for spinners.
- **Images**: Always provide `alt` text. Use `unoptimized` for external/presigned URLs.

---

## 10. Common Page Patterns

### 10.1 Page Header
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Page Title</h1>
    <p className="text-sm mt-0.5 text-[var(--text-secondary)]">Optional description</p>
  </div>
  <Button variant="primary">Primary Action</Button>
</div>
```

Or with `PageHeader` component:
```tsx
<PageHeader
  title="Clients"
  subtitle="Manage your client roster"
  icon={Users}
  actions={<Button>Add Client</Button>}
/>
```

### 10.2 Stat / KPI Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard
    label="Active Clients"
    value={42}
    icon={Users}
    trend={{ value: "12%", up: true }}
    delay={0}
  />
</div>
```

**KpiCard anatomy:**
- Label: `text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]`
- Icon container: `w-7 h-7 bg-[var(--bg-subtle)]`
- Value: `text-3xl font-bold tracking-tight`
- Trend badge: `text-[10px] font-bold px-1.5 py-0.5`
- Trend up: `bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400`
- Trend down: `bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400`

### 10.3 Filter Pills (Client page pattern)
```tsx
<div className="flex flex-wrap items-center gap-2 mb-6">
  <button
    onClick={() => setFilter('all')}
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
      filter === 'all'
        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
        : 'bg-white dark:bg-neutral-900 text-[var(--text-secondary)] border-[var(--border)] hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
    }`}
  >
    All
    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
      filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
    }`}>
      {count}
    </span>
  </button>
</div>
```

### 10.4 Card Row List (Client page pattern)
```tsx
<motion.div
  variants={{
    hidden: { opacity: 0, x: -20, scale: 0.97 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
  }}
  whileHover={{ y: -1, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
  className="relative cursor-pointer"
>
  <div className="relative bg-[var(--bg-card)] dark:bg-white/[0.03] p-4 overflow-hidden transition-colors hover:border-[var(--border-hover)]">
    {/* Status gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
    {/* Content grid: grid-cols-12 gap-4 items-center */}
  </div>
</motion.div>
```

### 10.5 Client Detail Sidebar Pattern
- Fixed mobile drawer (`w-[85vw] max-w-[320px]`), relative on desktop (`md:w-[300px]`)
- Dark bg: `dark:bg-[#0a1114]`
- Ambient glow behind profile: radial gradient `#a3e635` with `blur-[60px]` opacity 15%
- Status ring animation for active clients
- Section headers: `text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]`
- Info rows: label/value flex layout with `text-[11px]` labels
- Activity stat cards: 2-column grid with coloured left border accent (`w-[3px] h-5`)

### 10.6 Settings Page Architecture
- **Grid**: `grid-cols-1 lg:grid-cols-3 gap-6` (left 2 cols, right 1 col)
- **Card pattern**: Card → CardHeader → Content
- **ToggleRow**: Icon + label/description left, toggle right, `hover:bg-[var(--bg-subtle)]`
- **ActionRow**: Icon + label/description left, chevron + action text right
- **InfoRow**: Icon + label (uppercase micro) + value stacked
- **Danger Zone card**: `border-red-200 dark:border-red-900/30`

### 10.7 Auth / Login Page Pattern
- Background image with `bg-[#060d10]/85` overlay
- Grain texture overlay at 3% opacity (SVG noise filter)
- Floating energy particles (lime dots with random movement)
- Breathing radial glow: `#a3e635` radial gradient, 6s pulse
- Login card: `bg-[#0a1114]/80 backdrop-blur-xl border-white/[0.06] rounded-2xl`
- Top sheen: animated gradient line via `#a3e635`/30
- Inputs: `bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20`
- Focus: `focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40`
- Login button: `bg-[#a3e635] text-[#0a1114] font-bold` with shimmer effect
- Font: inputs use `var(--font-mono)`, title uses `var(--font-display)`

### 10.8 Empty State Pattern
```tsx
<QueryWrapper
  query={query}
  emptyIcon={Users}
  emptyTitle="Add your first client"
  emptyDescription="Create client profiles to manage workouts..."
  emptyAction={
    <div className="flex items-center gap-3">
      <Link href="/clients/new">
        <Button className="bg-brand-600 text-white hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </Link>
      <Link href="/import-excel">
        <Button variant="secondary">
          <Upload className="w-4 h-4" /> Import
        </Button>
      </Link>
    </div>
  }
  isEmpty={() => filteredClients.length === 0}
>
```

### 10.9 Loading Skeleton Pattern
```tsx
{isLoading ? (
  <DashboardLayout>
    <DashboardSkeleton />
  </DashboardLayout>
) : (
  <DashboardLayout>{/* content */}</DashboardLayout>
)}
```

Or inline:
```tsx
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="flex items-center gap-4 p-5 border border-[var(--border)] rounded-xl bg-white dark:bg-neutral-900">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  ))}
</div>
```

### 10.10 Dashboard Widget Patterns

**AI Suggestion Banner:**
- Contextual tip based on data (inactive clients, today's sessions)
- Full-width card with gradient or accent border

**Session Volume Heatmap:**
- Shows check-in density across days
- Uses colour intensity for volume

**Upcoming Sessions:**
- List of next appointments
- Client name, time, type

**Client Workload:**
- Breakdown of client activity levels
- Visual indicators for overloaded coaches

### 10.11 Pagination Pattern
```tsx
<div className="mt-4 px-4 py-3 flex items-center justify-between">
  <span className="text-xs text-[var(--text-secondary)]">
    Showing {start + 1}-{Math.min(start + PER_PAGE, total)} of {total} clients
  </span>
  <div className="flex items-center gap-2">
    <span className="text-xs text-[var(--text-secondary)] mr-2">Page {page} of {totalPages}</span>
    <button
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page <= 1}
      className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <button
      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
      disabled={page >= totalPages}
      className="p-1.5 border rounded-xl border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

---

## 11. File & Naming Conventions

- **Components**: PascalCase, one component per file. `MyComponent.tsx`.
- **Hooks**: camelCase, prefixed with `use`. `useMyDomain.ts`.
- **Page files**: `page.tsx` inside route folder.
- **Barrel exports**: `index.ts` in component folders for clean imports.
- **No default exports for reusable components** — always named exports.
- **Page components** can be default exports (Next.js convention).
- **Utility files**: camelCase. `formatDate.ts`, `safeHref.ts`.

---

## 12. What NOT to Do

- **Do not** introduce new colour palettes (no purple, orange, or pink accents without design approval).
- **Do not** use inline styles for colours — always use Tailwind classes or CSS variables.
- **Do not** create new modal primitives — extend the existing `<Modal>` component.
- **Do not** use `styled-components` or CSS-in-JS libraries — Tailwind + CSS layers only.
- **Do not** ignore dark mode when adding new screens.
- **Do not** use arbitrary values like `w-[123px]` unless the design genuinely requires a one-off.
- **Do not** add new font families — DBScreenSans + Unbounded + JetBrains Mono are the only approved fonts.
- **Do not** use `img` tags — use Next.js `<Image>` with `unoptimized` for external URLs.
- **Do not** forget error states for every data fetch.
- **Do not** use `setState` in render without memoization for derived data.
- **Do not** hardcode animation durations — use the tokens from tailwind config or Framer Motion constants.

---

## 13. Quick Reference — Tailwind Classes

| Purpose | Class(es) |
|---|---|
| Page background | `bg-[var(--bg-page)]` |
| Card background | `bg-[var(--bg-card)]` |
| Subtle background | `bg-[var(--bg-subtle)]` |
| Hover background | `hover:bg-[var(--bg-hover)]` |
| Primary text | `text-[var(--text-primary)]` |
| Secondary text | `text-[var(--text-secondary)]` |
| Tertiary text | `text-[var(--text-tertiary)]` |
| Border | `border-[var(--border)]` |
| Hover border | `hover:border-[var(--border-hover)]` |
| Focus ring | `focus:ring-2 focus:ring-[var(--ring)]` |
| Card shadow light | `shadow-card` |
| Card shadow dark | `dark:shadow-dark-card` |
| Energy accent | `text-energy bg-energy` |
| Brand accent | `text-brand bg-brand` |
| Sidebar bg | `bg-[var(--sidebar-bg)]` |
| Sidebar text | `text-[var(--sidebar-text)]` |
| Sidebar text muted | `text-[var(--sidebar-text-secondary)]` |
| Dark hover overlay | `hover:bg-white/[0.06]` |
| Dark active overlay | `active:bg-white/[0.1]` |

---

*Last updated: 2026-08-23*
