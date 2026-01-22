# WorkGraph OS Design System 2.0

> **Status:** Implemented  
> **Date:** January 2026  
> **Philosophy:** Google Material Design 3 (Material You)

---

## Overview

WorkGraph OS adopts a **Google-inspired design philosophy** based on Material Design 3. The interface moves away from traditional "admin panel" aesthetics toward an **organic, spatial, and semantic** experience.

**Core Principle:** *"An Infinite Map, not an Excel Table"* — The graph is a territory to explore, not a technical diagram.

---

## 🎨 Design Tokens

### Color System (`tailwind.config.ts`)

#### Surface Colors (Light Mode)
```typescript
surface: {
  DEFAULT: '#FFFFFF',
  dim: '#DED8E1',
  bright: '#FDF7FF',
  container: {
    lowest: '#FFFFFF',
    low: '#F7F2FA',
    DEFAULT: '#F3EDF7',
    high: '#ECE6F0',
    highest: '#E6E0E9',
  }
}
```

#### Surface Colors (Dark Mode)
```typescript
'surface-dark': {
  DEFAULT: '#141218',
  dim: '#141218',
  bright: '#3B383E',
  container: {
    lowest: '#0F0D13',
    low: '#1D1B20',
    DEFAULT: '#211F26',
    high: '#2B2930',
    highest: '#36343B',
  }
}
```

#### Primary Colors (Google Blue)
```typescript
primary: {
  DEFAULT: '#0B57D0',
  light: '#D3E3FD',
  dark: '#A8C7FA',
  container: '#D3E3FD',
  'on-container': '#041E49',
}
```

#### Semantic Node Colors (Pastel Palette)
| Type | Light Background | Light Text | Dark Background | Dark Text |
|------|------------------|------------|-----------------|-----------|
| Note | `#F3EDF7` | `#4A4458` | `#4A4458` | `#E8DEF8` |
| Claim | `#D3E3FD` | `#041E49` | `#004A77` | `#C2E7FF` |
| Evidence | `#C4EED0` | `#0D5D2C` | `#0D5D2C` | `#C4EED0` |
| Decision | `#FEF7C3` | `#594F05` | `#594F05` | `#FEF7C3` |
| Problem | `#F9DEDC` | `#8C1D18` | `#8C1D18` | `#F9DEDC` |
| Idea | `#E7F8ED` | `#0D5D2C` | `#0D5D2C` | `#E7F8ED` |
| Task | `#E8DEF8` | `#4A4458` | `#4A4458` | `#E8DEF8` |
| Source | `#E3F2FD` | `#0D47A1` | `#0D47A1` | `#E3F2FD` |

---

## 🌓 Theme System

### ThemeProvider (`src/components/providers/ThemeProvider.tsx`)

- **Dark Mode:** `darkMode: 'class'` in Tailwind config
- **Persistence:** `localStorage.getItem('workgraph-theme')`
- **System Detection:** `prefers-color-scheme: dark` fallback
- **Toggle:** Sun/Moon icon button in top-right corner

```tsx
const { theme, toggleTheme } = useTheme();
```

### CSS Variables (`globals.css`)
```css
:root {
  --surface: 255 255 255;
  --on-surface: 29 27 32;
  --primary: 11 87 208;
  /* ... */
}

.dark {
  --surface: 20 18 24;
  --on-surface: 230 224 233;
  --primary: 168 199 250;
  /* ... */
}
```

---

## 🪟 Glass Morphism Utilities

### `.glass-panel`
Semi-transparent panel with blur effect.
```css
@utility glass-panel {
  background-color: rgb(255 255 255 / 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgb(var(--outline-variant) / 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
}
```

### `.floating-island`
Pill-shaped floating UI element (Google Maps style).
```css
@utility floating-island {
  background-color: rgb(255 255 255 / 0.95);
  backdrop-filter: blur(20px);
  border-radius: 9999px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.1);
}
```

### `.dot-grid`
Subtle dot pattern background for canvas.
```css
.dot-grid {
  background-image: radial-gradient(circle, rgb(var(--outline-variant) / 0.4) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

---

## 📦 Core Components

### 1. WorkNode (`WorkNode.tsx`)
**Style:** Google Smart Chips (Doc mentions, Sheet pills)

- **Shape:** `rounded-3xl` (extreme rounding)
- **Colors:** Pastel backgrounds with darker text
- **Icon:** Rounded container with 15% opacity background
- **Elevation:** `shadow-elevation-3` → `shadow-elevation-5` on select
- **Hover:** `translateY(-2px) scale(1.02)`
- **Toolbar:** Glass panel with type mutation buttons

### 2. GraphCanvas (`GraphCanvas.tsx`)
**Style:** Google Maps infinite canvas

- **Background:** `.dot-grid` (subtle dots, not lines)
- **Controls:** Glass-styled with `rounded-2xl`
- **MiniMap:** Semi-transparent with blur
- **Toolbar:** Floating Island at `bottom-center`
  - New Node button (primary color, pill shape)
  - Search icon
  - Filter icon

### 3. FloatingPanel (`FloatingPanel.tsx`)
**Style:** macOS-inspired floating window

- **Container:** `glass-panel rounded-3xl`
- **Header:** Draggable, with grip icon
- **Controls:** Pop-out, Maximize, Close (rounded-xl buttons)
- **Animation:** `animate-scale-in` on mount
- **Size:** `480px × 520px` default

### 4. GlobalDropzone (`GlobalDropzone.tsx`)
**Style:** Full-screen overlay on drag

- **Overlay:** Primary color tint with dashed border
- **Icon:** Floating animation (`animate-float`)
- **Toast:** Glass panel with status icon

---

## ✨ Animations

### Keyframes (`tailwind.config.ts`)
```typescript
keyframes: {
  'scale-in': {
    '0%': { transform: 'scale(0.9)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  'slide-up': {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'float': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-5px)' },
  },
}
```

### Animation Classes
- `.animate-scale-in` — Panels, modals
- `.animate-slide-up` — Toasts, notifications
- `.animate-float` — Decorative icons

---

## 📐 Elevation System

Material Design 3 elevation levels:
```typescript
boxShadow: {
  'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'elevation-2': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'elevation-3': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'elevation-4': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'elevation-5': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}
```

**Usage:**
- Level 0: Canvas background
- Level 1-2: Cards, nodes at rest
- Level 3: Nodes on hover
- Level 4: Floating panels
- Level 5: Selected/dragging elements

---

## 🎯 UX Principles

1. **No Borders:** Use elevation (shadows) to separate layers, not borders
2. **Everything Floats:** UI elements are "islands" over the canvas
3. **Motion Has Origin:** Elements animate from their source (cursor, node)
4. **Drag = Lift:** Dragged elements increase shadow and scale
5. **Large Typography:** Titles bold, metadata readable (not light gray)
6. **Breathable Space:** Generous padding, content doesn't feel cramped

---

## 📁 File Structure

```
src/
├── app/
│   ├── globals.css          # CSS variables, utilities, animations
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main page with theme toggle
│   └── providers.tsx        # QueryClient + ThemeProvider
├── components/
│   ├── providers/
│   │   └── ThemeProvider.tsx  # Dark/light mode context
│   ├── graph/
│   │   ├── GraphCanvas.tsx    # ReactFlow canvas with island toolbar
│   │   ├── WorkNode.tsx       # Smart Chip styled nodes
│   │   └── GlobalDropzone.tsx # File drop overlay
│   └── ui/
│       └── FloatingPanel.tsx  # Draggable glass window
└── tailwind.config.ts         # Design tokens
```

---

## 🚀 Future Roadmap

- [ ] Multi-window support (z-index stacking)
- [ ] Window resizing (corner handles)
- [ ] Minimize to dock (taskbar)
- [ ] Shared Element Transitions (node → panel expansion)
- [ ] Search Omnibox in floating toolbar
- [ ] Keyboard shortcuts (⌘K for search)
