# HealthSync Pro - Design System & Style Guide
## Premium SaaS Dashboard Design System v3.0

---

## 🎨 Color Palette

### Primary Colors (Deep Indigo/Blue)
```css
--hs-primary-600: #4f46e5  /* Main brand color */
--hs-primary-700: #4338ca  /* Hover states */
```
**Usage:** Primary CTAs, active states, brand elements
**Contrast Ratio:** 4.5:1 (WCAG AA compliant)

### Accent Colors (Vibrant Magenta)
```css
--hs-accent-600: #db2777   /* Accent highlights */
```
**Usage:** Gradients, special highlights, favorite icons
**Pairs with:** Primary blue for premium gradients

### Secondary Accent (Warm Orange)
```css
--hs-orange-500: #f97316   /* Energy & urgency */
```
**Usage:** Emergency buttons, important alerts

### Semantic Colors
```css
--hs-success-500: #10b981  /* Success states */
--hs-warning-500: #f59e0b  /* Warning states */
--hs-danger-500: #ef4444   /* Error/danger states */
```

### Neutral Grays
```css
--hs-gray-50: #f9fafb      /* Backgrounds */
--hs-gray-100: #f3f4f6     /* Subtle backgrounds */
--hs-gray-200: #e5e7eb     /* Borders */
--hs-gray-400: #9ca3af     /* Placeholder text */
--hs-gray-500: #6b7280     /* Secondary text */
--hs-gray-600: #4b5563     /* Body text */
--hs-gray-900: #111827     /* Headings */
--hs-gray-950: #030712     /* Dark backgrounds */
```

---

## 📝 Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Sizes
- **xs:** 0.75rem (12px) - Labels, badges
- **sm:** 0.875rem (14px) - Body text, buttons
- **base:** 1rem (16px) - Default body
- **lg:** 1.125rem (18px) - Section headers
- **xl:** 1.25rem (20px) - Page titles
- **2xl:** 1.5rem (24px) - Hero headings
- **3xl:** 1.875rem (30px) - Large headings
- **4xl:** 2.25rem (36px) - Display headings

### Font Weights
- **Normal:** 400 - Body text
- **Medium:** 500 - Navigation, labels
- **Semibold:** 600 - Subheadings, buttons
- **Bold:** 700 - Headings, emphasis
- **Extrabold:** 800 - Hero text

### Line Heights
- **Tight:** 1.25 - Headings
- **Normal:** 1.5 - Body text (optimal readability)
- **Relaxed:** 1.625 - Long-form content

---

## 📏 Spacing System

Based on 4px grid (0.25rem base unit):

```css
--hs-space-1: 0.25rem  /* 4px */
--hs-space-2: 0.5rem   /* 8px */
--hs-space-3: 0.75rem  /* 12px */
--hs-space-4: 1rem     /* 16px */
--hs-space-5: 1.25rem  /* 20px */
--hs-space-6: 1.5rem   /* 24px */
--hs-space-8: 2rem     /* 32px */
```

**Padding Standards:**
- Cards: 16-20px (space-4 to space-5)
- Buttons: 12px vertical, 16-20px horizontal
- Sections: 24px (space-6)

---

## 🔲 Border Radius

```css
--hs-radius-lg: 12px    /* Cards, buttons */
--hs-radius-xl: 16px    /* Large cards */
--hs-radius-2xl: 20px   /* Hero sections */
--hs-radius-full: 9999px /* Pills, badges */
```

**Usage:**
- Small elements (badges, pills): `radius-full`
- Buttons, inputs: `radius-lg` (12px)
- Cards: `radius-xl` (16px)
- Hero sections: `radius-2xl` (20px)

---

## 🌟 Shadows & Elevation

### Shadow Levels
```css
--hs-shadow-sm: 0 1px 3px rgba(0,0,0,0.08)
--hs-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.08)
--hs-shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08)
--hs-shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1)
--hs-shadow-glow: 0 0 24px rgba(99,102,241,0.2)
```

**Elevation System:**
1. **Base (sm):** Default cards, inputs
2. **Raised (md):** Hover states, dropdowns
3. **Floating (lg):** Modals, popovers
4. **Hero (xl):** Premium sections
5. **Glow:** Active/focus states with brand color

---

## ✨ Microinteractions

### Transition Timing
```css
--hs-transition-fast: 160ms cubic-bezier(0.4,0,0.2,1)
```

**160ms** is the sweet spot for perceived instant feedback while maintaining smooth animation.

### Hover Effects

**Cards:**
```css
transform: translateY(-4px);
box-shadow: var(--hs-shadow-lg);
```

**Buttons:**
```css
transform: translateY(-2px);
box-shadow: var(--hs-shadow-md);
```

**Icons:**
```css
transform: scale(1.05);
```

### Focus States
All interactive elements have visible focus indicators:
```css
outline: 2px solid var(--hs-primary-600);
outline-offset: 2px;
```

---

## 🎯 Component Patterns

### Glassy Cards
```css
background: rgba(255,255,255,0.85);
backdrop-filter: blur(16px);
border: 1px solid var(--hs-gray-200);
border-radius: var(--hs-radius-xl);
box-shadow: var(--hs-shadow-sm);
```

### Premium Gradient Hero
```css
background: linear-gradient(135deg, #4f46e5 0%, #4338ca 40%, #db2777 100%);
```

### Stat Cards
- Icon: 48x48px with colored background
- Value: 1.5rem, weight 700
- Label: 0.875rem, gray-500
- Hover lift: -4px translateY

### Action Cards
- Centered layout
- Gradient icon (48x48px)
- Hover: lift + glow effect
- Border color change on hover

---

## 📱 Responsive Breakpoints

```css
/* Desktop: Default */
/* Tablet: max-width: 1024px */
/* Mobile: max-width: 768px */
```

### Mobile Adaptations
- Sidebar becomes drawer (slide-in)
- Bottom navigation bar appears
- Grid columns: 4 → 2 → 1
- Reduced padding: 24px → 16px
- Hidden secondary info (email, location)

---

## ♿ Accessibility (WCAG 2.1 AA)

### Color Contrast
- **Text on white:** Minimum 4.5:1
- **Large text:** Minimum 3:1
- **Primary blue (#4f46e5):** 4.5:1 on white ✓
- **Gray-600 (#4b5563):** 7:1 on white ✓

### Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators (2px outline)
- Logical tab order
- Skip links for main content

### Screen Readers
- Semantic HTML structure
- ARIA labels where needed
- Alt text for images
- Status announcements for dynamic content

---

## 🎨 Usage Examples

### Primary CTA Button
```css
padding: 12px 20px;
background: linear-gradient(135deg, #4f46e5, #4338ca);
border-radius: 12px;
color: #fff;
font-weight: 600;
transition: all 160ms;
```

### Search Input
```css
padding: 12px 16px;
border: 1px solid #d1d5db;
border-radius: 12px;
transition: all 160ms;

/* Focus */
border-color: #4f46e5;
box-shadow: 0 0 0 3px #eef2ff;
```

### Status Badge
```css
padding: 4px 12px;
border-radius: 9999px;
font-size: 0.75rem;
font-weight: 500;

/* Success */
background: #ecfdf5;
color: #10b981;
```

---

## 🚀 Conversion-Focused Elements

### Trust Badges
- Placement: Header or hero section
- Style: Subtle, non-intrusive
- Content: "10,000+ patients", "500+ doctors"

### Primary CTAs
- High contrast (gradient backgrounds)
- Prominent placement
- Action-oriented copy ("Book Now", "Get Started")
- Hover animations for engagement

### Social Proof
- Patient testimonials
- Doctor ratings (star icons)
- Appointment counts
- Success metrics

---

## 📐 Layout Grid

### Sidebar
- Width: 260px (expanded)
- Width: 72px (collapsed)
- Dark gradient background
- Fixed position

### Header
- Height: 72px
- Sticky positioning
- Glass morphism effect
- Breadcrumb navigation

### Content Area
- Max-width: Fluid
- Padding: 24px
- Background: Gradient (gray-50 → gray-100 → primary-50)

---

## 🎭 Animation Library

### Pulse (Emergency)
```css
@keyframes sosPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
}
```

### BPM Line
```css
@keyframes bpmDraw {
  0% { stroke-dashoffset: 150; opacity: 0.4; }
  50% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: -150; opacity: 0.4; }
}
```

### Badge Pulse
```css
@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

---

## 📊 Performance Guidelines

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Implement `backdrop-filter` with fallbacks
- Lazy load images
- Optimize SVG icons
- Use CSS containment for large lists

---

## 🔧 Implementation Checklist

- [x] Premium color palette (indigo + magenta)
- [x] Strong typography (600-800 weights)
- [x] Glassy cards with inner glow
- [x] Consistent 12-16px padding
- [x] Uniform border-radius (12-16px)
- [x] Subtle elevation shadows
- [x] 160ms smooth transitions
- [x] Hover lift effects
- [x] Focus states (WCAG compliant)
- [x] Responsive breakpoints
- [x] Mobile navigation
- [x] Gradient hero banner
- [x] Trust badges ready
- [x] CTA optimization
- [x] Accessibility features

---

**Design System Version:** 3.0  
**Last Updated:** December 2024  
**Maintained by:** HealthSync Design Team
