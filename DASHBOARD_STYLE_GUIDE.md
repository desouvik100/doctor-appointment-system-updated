# HealthSync Pro - Dashboard Style Guide

## Design Principles

### 1. Clean & Modern
- Minimal visual clutter
- Generous whitespace
- Clear visual hierarchy
- Professional healthcare aesthetic

### 2. Responsive & Adaptive
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly buttons (min 44px)
- Readable text at all sizes

### 3. Accessible & Inclusive
- High contrast ratios
- Clear focus states
- Semantic HTML
- Icon + text combinations

### 4. Performant & Smooth
- CSS-only animations
- Hardware-accelerated transforms
- Optimized shadows
- No layout thrashing

## Color System

### Primary Colors
```css
Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Background: linear-gradient(135deg, #6a85ff 0%, #9354ff 100%)
```

### Semantic Colors
```css
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Error: #ef4444 (Red)
Info: #3b82f6 (Blue)
```

### Neutral Colors
```css
Text Primary: #1a202c (Dark Gray)
Text Secondary: #718096 (Medium Gray)
Border: #e2e8f0 (Light Gray)
Background: #f8fafc (Very Light Gray)
```

## Typography Scale

### Headings
- **H1**: 1.75rem, 800 weight (Welcome title)
- **H2**: 1.5rem, 800 weight (Section titles)
- **H3**: 1.25rem, 700 weight (Card titles)
- **H4**: 1rem, 700 weight (Subsections)

### Body Text
- **Large**: 1rem, 400-600 weight
- **Regular**: 0.95rem, 400-600 weight
- **Small**: 0.9rem, 400-600 weight
- **Tiny**: 0.85rem, 500-600 weight

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

## Spacing System

### Padding
- **xs**: 8px
- **sm**: 12px
- **md**: 16px
- **lg**: 20px
- **xl**: 24px
- **2xl**: 28px
- **3xl**: 32px
- **4xl**: 40px

### Gaps
- **sm**: 12px (between elements)
- **md**: 16px (between sections)
- **lg**: 20px (between cards)
- **xl**: 24px (between major sections)
- **2xl**: 40px (between page sections)

### Margins
- **Section**: 40px bottom
- **Card**: 24px bottom
- **Element**: 12px-16px bottom

## Border Radius

### Sizes
- **sm**: 8px (small buttons, badges)
- **md**: 10px (inputs, small cards)
- **lg**: 12px (medium buttons)
- **xl**: 16px (cards, tabs)
- **2xl**: 20px (large cards)
- **3xl**: 24px (header card)
- **full**: 50% (circles, pills)

## Shadow System

### Elevation Levels
```css
/* Subtle - Cards, inputs */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

/* Medium - Hover states, modals */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);

/* Strong - Floating elements */
box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);

/* Gradient accent */
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
```

## Component Styles

### Buttons

#### Primary Button
```css
Background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Color: white
Padding: 12px 24px
Border Radius: 12px
Font Weight: 600
Box Shadow: 0 4px 12px rgba(102, 126, 234, 0.3)
Hover: translateY(-2px), shadow increase
```

#### Secondary Button
```css
Background: #f0f4f8
Color: #667eea
Border: 2px solid #e2e8f0
Padding: 12px 24px
Border Radius: 12px
Font Weight: 600
Hover: background darken, border color change
```

#### Tertiary Button
```css
Background: transparent
Color: #667eea
Border: none
Padding: 8px 16px
Font Weight: 600
Hover: background light, color darker
```

### Input Fields

#### Text Input / Select
```css
Background: #f8fafc
Border: 2px solid #e2e8f0
Padding: 12px 16px (with icon: 12px 16px 12px 48px)
Border Radius: 12px
Font Size: 0.95rem
Transition: all 0.3s ease

Focus State:
  Border Color: #667eea
  Background: white
  Box Shadow: 0 0 0 3px rgba(102, 126, 234, 0.1)
```

### Cards

#### Standard Card
```css
Background: white
Border Radius: 20px
Padding: 24px
Box Shadow: 0 4px 16px rgba(0, 0, 0, 0.06)
Border: 2px solid transparent
Transition: all 0.3s ease

Hover:
  Transform: translateY(-8px)
  Box Shadow: 0 16px 40px rgba(0, 0, 0, 0.12)
  Border Color: #667eea
```

#### Appointment Card
```css
Background: white
Border Radius: 20px
Padding: 24px
Border Left: 4px solid #667eea
Box Shadow: 0 4px 16px rgba(0, 0, 0, 0.06)

Hover:
  Box Shadow: 0 12px 32px rgba(0, 0, 0, 0.1)
  Transform: translateX(4px)
```

### Badges

#### Status Badge
```css
Padding: 6px 12px
Border Radius: 20px
Font Size: 0.85rem
Font Weight: 600
Text Transform: capitalize

Pending: Background #fef3c7, Color #92400e
Confirmed: Background #d1fae5, Color #065f46
Completed: Background #dbeafe, Color #0c4a6e
Cancelled: Background #fee2e2, Color #7f1d1d
```

### Tabs

#### Navigation Tab
```css
Background: white
Border: 2px solid #e2e8f0
Border Radius: 16px
Padding: 28px 20px
Font Weight: 600
Color: #4a5568
Transition: all 0.3s ease

Hover:
  Border Color: #667eea
  Box Shadow: 0 12px 32px rgba(102, 126, 234, 0.15)
  Transform: translateY(-4px)
  Color: #667eea

Active:
  Background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  Border Color: transparent
  Color: white
  Box Shadow: 0 12px 32px rgba(102, 126, 234, 0.3)
```

## Animations

### Transitions
```css
Default: transition: all 0.3s ease;
Fast: transition: all 0.2s ease;
Slow: transition: all 0.5s ease;
```

### Transforms
```css
Lift: transform: translateY(-2px) to translateY(-8px)
Scale: transform: scale(1) to scale(1.1)
Slide: transform: translateX(4px)
```

### Keyframe Animations
```css
/* Pulse animation for status dots */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Spin animation for loader */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Layout Patterns

### Container
```css
Max Width: 1400px
Margin: 0 auto
Padding: 40px (desktop), 20px (tablet), 16px (mobile)
```

### Grid Layouts
```css
/* Doctors Grid */
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))
gap: 24px

/* Filters Grid */
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
gap: 20px

/* Tabs Grid */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
gap: 16px
```

### Flex Layouts
```css
/* Header */
display: flex
justify-content: space-between
align-items: center
gap: 40px

/* Vertical Stack */
display: flex
flex-direction: column
gap: 16px
```

## Responsive Behavior

### Desktop (> 1024px)
- Full layout with all elements visible
- 4-column grids
- Horizontal layouts
- Full padding (40px)

### Tablet (768px - 1024px)
- 2-column grids
- Adjusted padding (30px)
- Stacked sections
- Flexible layouts

### Mobile (480px - 768px)
- Single column layouts
- Reduced padding (20px)
- Stacked navigation
- Full-width cards

### Small Mobile (< 480px)
- Minimal padding (16px)
- Icon-only buttons
- Compact spacing
- Optimized for touch

## Accessibility

### Color Contrast
- Text on background: 4.5:1 minimum
- UI components: 3:1 minimum
- Large text: 3:1 minimum

### Focus States
```css
All interactive elements have visible focus states
Outline: 2px solid #667eea
Outline Offset: 2px
```

### Touch Targets
- Minimum size: 44px × 44px
- Spacing: 8px minimum between targets

### Semantic HTML
- Use proper heading hierarchy (h1, h2, h3)
- Use semantic elements (button, input, nav)
- Include alt text for icons
- Use ARIA labels where needed

## Performance Tips

### CSS Optimization
- Use CSS Grid for complex layouts
- Use Flexbox for alignment
- Minimize box-shadow usage
- Use transform for animations (GPU accelerated)
- Avoid layout thrashing

### Best Practices
- Combine related styles
- Use shorthand properties
- Minimize specificity
- Avoid !important (except for overrides)
- Use CSS variables for theming

## Browser Support

### Required Features
- CSS Grid
- Flexbox
- CSS Gradients
- CSS Transforms
- CSS Animations
- Box Shadow

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Customization Guide

### Changing Primary Color
Replace all instances of `#667eea` and `#764ba2` with your brand colors.

### Changing Spacing
Update the padding/gap values in the CSS (search for `px` values).

### Changing Border Radius
Update border-radius values (search for `px` values).

### Changing Shadows
Update box-shadow values in the shadow system section.

### Adding Dark Mode
Create a `[data-theme="dark"]` selector and override colors.
