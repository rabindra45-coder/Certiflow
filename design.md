# CertiFlow Design System & UI Specifications

## 1. Design Philosophy

CertiFlow follows a **Professional Institutional Studio** aesthetic. The interface balances high-density utility for power administrators with clean visual elegance for certificate recipients.

### Core Principles:
1. **Mathematical Spatial Rhythm**: Rigid adherence to 4px/8px grid system.
2. **Typography-First Hierarchy**: High-contrast pairing of classic display serif fonts (Cinzel, Playfair Display) with clean modern sans-serif body typefaces (Plus Jakarta Sans).
3. **Restrained Color Palette**: Deep Slate navy foundations with Indigo primary accents and warm Gold/Amber institutional highlights.
4. **Touch & Desktop Parity**: Full feature parity across ultra-wide desktop displays and touch-based mobile viewports.

---

## 2. Color System

### Primary & Dark Palette
- **Canvas Base (Dark)**: `#0f172a` (Slate 900)
- **Panel Surface (Dark)**: `#1e293b` (Slate 800)
- **Border & Dividers**: `#334155` (Slate 700)
- **Primary Brand Accent**: `#4f46e5` (Indigo 600)
- **Primary Hover Accent**: `#6366f1` (Indigo 500)

### Institutional Accents
- **Gold / Award**: `#b8860b` (Dark Goldenrod) / `#f59e0b` (Amber 500)
- **Success Status**: `#059669` (Emerald 600)
- **Warning / Offline**: `#d97706` (Amber 600)
- **Danger / Delete**: `#e11d48` (Rose 600)

### Light Theme Surfaces
- **App Background**: `#f8fafc` (Slate 50)
- **Card Surface**: `#ffffff` (White)
- **Primary Text**: `#0f172a` (Slate 900)
- **Secondary Text**: `#475569` (Slate 600)

---

## 3. Typography Scale & Font Pairing

```
+---------------------+-------------------------------+----------------------------------+
| Font Family         | Classification                | Usage                            |
+---------------------+-------------------------------+----------------------------------+
| Cinzel              | Classical Display Serif       | Certificate Titles, Main Headers |
| Playfair Display    | Editorial Serif               | Award Titles, Subheadings        |
| Cormorant Garamond  | Elegant Academic Serif        | Recipient Name, Body Descriptions|
| Alex Brush          | Formal Calligraphy Script     | Signatures, Formal Names         |
| Pinyon Script       | Classic Script                | Signature Overlay, Dates         |
| Great Vibes         | Fluid Cursive Script          | Decorative Accents               |
| Plus Jakarta Sans   | Modern Geometric Sans         | UI Labels, Buttons, Navigation   |
| JetBrains / Mono    | Monospace                     | Certificate UIDs, Merged Data    |
+---------------------+-------------------------------+----------------------------------+
```

---

## 4. UI Layout Specifications

### 4.1 Visual Canvas Viewport
- **AspectRatio Container**: Locks to standard certificate ratios ($1.414:1$ for A4, $1.294:1$ for Letter).
- **Auto-Scale Factor**: Dynamic recalculation based on container width:
  $$\text{Scale Factor} = \min\left(1, \frac{\text{Viewport Width} - \text{Padding}}{\text{Canvas Target Width}}\right)$$
- **Mobile Quick-Editor Drawer**: Fixed bottom-pinned glassmorphism container on viewports $< 1024\text{px}$.

### 4.2 Control Buttons & Touch Targets
- **Minimum Target Size**: $44\times 44\text{px}$ on touch devices.
- **Micro-Interactions**: Active scale press states ($95\%$), focus rings (`ring-2 ring-indigo-500`), and smooth transitions ($200\text{ms}$).
