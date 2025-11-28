# HealthSync Pro - Visual Reference Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HealthSync Pro                                    [Logout]  │  ← Navbar (Sticky)
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Avatar]  Welcome back, Souvik De!    [Logout]     │   │  ← Welcome Card
│  │            desouvik2018@gmail.com                    │   │
│  │            🟢 Online                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 👨‍⚕️ Find  │  │ 📅 My    │  │ 🤖 AI    │  │ 💳 Pay  │   │  ← Navigation Tabs
│  │ Doctors  │  │ Appts    │  │ Assistant│  │ ments   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔍 Search...  | 🩺 Specialization | 🏥 Clinic      │   │  ← Filters
│  │                                                      │   │
│  │ [Clear Filters]                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Available Doctors (12)                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ⭐ Most Exp. │  │              │  │              │     │
│  │              │  │              │  │              │     │
│  │ Dr. John Doe │  │ Dr. Jane Doe │  │ Dr. Bob Smith│     │  ← Doctor Cards
│  │ Cardiologist │  │ Neurologist  │  │ Pediatrician│     │
│  │              │  │              │  │              │     │
│  │ 🏥 City Hosp │  │ 🏥 City Hosp │  │ 🏥 City Hosp │     │
│  │ ₹500/consult │  │ ₹600/consult │  │ ₹400/consult │     │
│  │ 🟢 Available │  │ 🟢 Available │  │ 🟢 Available │     │
│  │ [Book Now]   │  │ [Book Now]   │  │ [Book Now]   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Navbar
```
┌─────────────────────────────────────────────────────────────┐
│ [❤️] HealthSync Pro                          [↪️ Logout]    │
└─────────────────────────────────────────────────────────────┘
```
- **Height**: Auto (16px padding)
- **Background**: Gradient purple
- **Sticky**: Yes (z-index: 100)
- **Responsive**: Logo text hidden on mobile

### 2. Welcome Card
```
┌─────────────────────────────────────────────────────────────┐
│  [SD]  Welcome back, Souvik De!              [Logout]       │
│        desouvik2018@gmail.com                               │
│        🟢 Online                                            │
└─────────────────────────────────────────────────────────────┘
```
- **Background**: White
- **Padding**: 40px
- **Border Radius**: 24px
- **Shadow**: Subtle (0 8px 32px)
- **Layout**: Flex row (desktop) / Column (mobile)

### 3. Navigation Tabs
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 👨‍⚕️ Find     │  │ 📅 My        │  │ 🤖 AI        │  │ 💳 Payments  │
│ Doctors      │  │ Appointments │  │ Assistant    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```
- **Layout**: CSS Grid (4 columns auto-fit)
- **Card Style**: White with border
- **Padding**: 28px 20px
- **Border Radius**: 16px
- **Active**: Gradient background + white text
- **Hover**: Lift effect + color change

### 4. Filters Section
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search...        | 🩺 Specialization | 🏥 Clinic        │
│                                                              │
│ [Clear Filters]                                             │
└─────────────────────────────────────────────────────────────┘
```
- **Background**: White
- **Padding**: 28px
- **Border Radius**: 20px
- **Grid**: 3 columns (responsive)
- **Input Style**: Icon-prefixed with focus state

### 5. Doctor Card
```
┌──────────────────────────────────┐
│ ⭐ Most Experienced              │
│                                  │
│ Dr. John Doe                     │
│ Cardiologist                     │
│                                  │
│ 🏥 City Hospital                 │
│ ✉️ john@hospital.com             │
│ 📞 +91-9876543210                │
│ 🏆 15 years experience           │
│                                  │
│ ₹500 / consultation              │
│ 🟢 Available                      │
│                                  │
│ [Book Appointment]               │
└──────────────────────────────────┘
```
- **Background**: White
- **Padding**: 24px
- **Border Radius**: 20px
- **Border**: 2px transparent (changes on hover)
- **Shadow**: Subtle (0 4px 16px)
- **Hover**: Lift + shadow increase + border color

### 6. Appointment Card
```
┌─────────────────────────────────────────────────────────────┐
│ 🎥 Online Consultation              [Confirmed]             │
├─────────────────────────────────────────────────────────────┤
│ [👨‍⚕️] Dr. John Doe                                           │
│      Cardiologist                                           │
│                                                              │
│ 📅 Mon, Dec 18  |  🕐 2:30 PM  |  🏥 City Hospital         │
│                                                              │
│ 📝 Reason: Regular checkup                                  │
│                                                              │
│ 🎥 Video Consultation                                       │
│    meet.google.com/abc-defg-hij [Copy]                     │
│    [Join Meeting Now]                                       │
├─────────────────────────────────────────────────────────────┤
│ ⏱️ In 2h 15m                        ₹500                    │
└─────────────────────────────────────────────────────────────┘
```
- **Background**: White
- **Padding**: 24px
- **Border Radius**: 20px
- **Border Left**: 4px solid #667eea
- **Shadow**: Subtle (0 4px 16px)
- **Hover**: Lift + shadow increase

## Color Reference

### Primary Gradient
```
Start: #667eea (Purple)
End: #764ba2 (Dark Purple)
Direction: 135deg
```

### Background Gradient
```
Start: #6a85ff (Bright Purple)
End: #9354ff (Vibrant Purple)
Direction: 135deg
```

### Status Colors
```
Success (Online): #10b981 (Green)
Warning (Pending): #f59e0b (Amber)
Error (Cancelled): #ef4444 (Red)
Info (Confirmed): #3b82f6 (Blue)
```

### Neutral Colors
```
Text Primary: #1a202c (Dark Gray)
Text Secondary: #718096 (Medium Gray)
Border: #e2e8f0 (Light Gray)
Background: #f8fafc (Very Light Gray)
White: #ffffff
```

## Typography Reference

### Headings
```
Welcome Title: 1.75rem, 800 weight
Section Title: 1.5rem, 800 weight
Card Title: 1.25rem, 700 weight
Subsection: 1rem, 700 weight
```

### Body Text
```
Large: 1rem, 400-600 weight
Regular: 0.95rem, 400-600 weight
Small: 0.9rem, 400-600 weight
Tiny: 0.85rem, 500-600 weight
```

## Spacing Reference

### Padding
```
xs: 8px
sm: 12px
md: 16px
lg: 20px
xl: 24px
2xl: 28px
3xl: 32px
4xl: 40px
```

### Gaps
```
sm: 12px (between elements)
md: 16px (between sections)
lg: 20px (between cards)
xl: 24px (between major sections)
2xl: 40px (between page sections)
```

## Border Radius Reference

```
sm: 8px (small buttons, badges)
md: 10px (inputs, small cards)
lg: 12px (medium buttons)
xl: 16px (cards, tabs)
2xl: 20px (large cards)
3xl: 24px (header card)
full: 50% (circles, pills)
```

## Shadow Reference

### Subtle Shadow
```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
```
Used for: Cards, inputs, normal state

### Medium Shadow
```css
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
```
Used for: Hover states, modals

### Strong Shadow
```css
box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
```
Used for: Floating elements, elevated states

### Gradient Accent Shadow
```css
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
```
Used for: Gradient buttons, primary elements

## Responsive Breakpoints

### Desktop (> 1024px)
```
Doctor Grid: 4 columns
Filter Grid: 3 columns
Tab Grid: 4 columns
Padding: 40px
Header: Horizontal layout
```

### Tablet (768px - 1024px)
```
Doctor Grid: 2 columns
Filter Grid: 2 columns
Tab Grid: 2 columns
Padding: 30px
Header: Stacked sections
```

### Mobile (480px - 768px)
```
Doctor Grid: 1 column
Filter Grid: 1 column
Tab Grid: 1 column
Padding: 20px
Header: Vertical stack
```

### Small Mobile (< 480px)
```
Doctor Grid: 1 column
Filter Grid: 1 column
Tab Grid: 1 column
Padding: 16px
Navbar: Icon-only logout
```

## Animation Reference

### Transitions
```css
Default: transition: all 0.3s ease;
Fast: transition: all 0.2s ease;
Slow: transition: all 0.5s ease;
```

### Transforms
```css
Lift: translateY(-2px) to translateY(-8px)
Scale: scale(1) to scale(1.1)
Slide: translateX(4px)
```

### Keyframe Animations
```css
Pulse: opacity 1 → 0.6 → 1 (2s infinite)
Spin: rotate(0deg) → rotate(360deg) (1s infinite)
```

## Interactive States

### Button States
```
Default: Gradient background, shadow
Hover: Lift effect, shadow increase
Active: Darker shade, no lift
Disabled: Opacity 0.5, cursor not-allowed
```

### Input States
```
Default: Light gray background, gray border
Focus: White background, blue border, blue shadow
Error: Red border, red shadow
Disabled: Gray background, gray border, opacity 0.5
```

### Card States
```
Default: White background, subtle shadow
Hover: Lift effect, shadow increase, border color change
Active: Gradient background (for tabs)
Disabled: Opacity 0.5, cursor not-allowed
```

## Accessibility Features

### Color Contrast
```
Text on background: 4.5:1 minimum
UI components: 3:1 minimum
Large text: 3:1 minimum
```

### Focus States
```
Outline: 2px solid #667eea
Outline Offset: 2px
Visible on all interactive elements
```

### Touch Targets
```
Minimum size: 44px × 44px
Spacing: 8px minimum between targets
```

## Performance Metrics

### CSS File Size
- Uncompressed: ~15KB
- Gzipped: ~4KB

### Rendering Performance
- No layout thrashing
- GPU-accelerated animations
- Smooth 60fps transitions
- Minimal repaints

## Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required CSS Features
- CSS Grid
- Flexbox
- CSS Gradients
- CSS Transforms
- CSS Animations
- Box Shadow

---

**Visual Reference Guide v1.0**
**Last Updated**: November 28, 2025
