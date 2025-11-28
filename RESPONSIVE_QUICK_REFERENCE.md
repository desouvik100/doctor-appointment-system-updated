# Responsive Design - Quick Reference

## Screen Sizes

| Device | Width | Breakpoint |
|--------|-------|-----------|
| Small Mobile | ≤576px | `@media (max-width: 576px)` |
| Mobile | ≤768px | `@media (max-width: 768px)` |
| Tablet | 769-1024px | `@media (min-width: 769px) and (max-width: 1024px)` |
| Desktop | ≥1025px | `@media (min-width: 1025px)` |

## Common Responsive Patterns

### Full-Width Button on Mobile
```css
@media (max-width: 768px) {
  .btn { width: 100%; }
}
```

### Stack Grid on Mobile
```css
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

@media (max-width: 768px) {
  .grid-3 { grid-template-columns: 1fr; }
}
```

### Responsive Typography
```css
h1 {
  font-size: 3rem;  /* Desktop */
}

@media (max-width: 1024px) {
  h1 { font-size: 2.25rem; }  /* Tablet */
}

@media (max-width: 768px) {
  h1 { font-size: 1.75rem; }  /* Mobile */
}
```

### Hide/Show Elements
```css
/* Hide on mobile */
@media (max-width: 768px) {
  .desktop-only { display: none; }
}

/* Hide on desktop */
@media (min-width: 769px) {
  .mobile-only { display: none; }
}
```

### Responsive Padding
```css
.container {
  padding: 2rem;  /* Desktop */
}

@media (max-width: 1024px) {
  .container { padding: 1.5rem; }  /* Tablet */
}

@media (max-width: 768px) {
  .container { padding: 1rem; }  /* Mobile */
}
```

## Touch-Friendly Design

### Minimum Tap Target Size
```css
@media (hover: none) and (pointer: coarse) {
  button, a, input {
    min-height: 48px;
    min-width: 48px;
  }
}
```

### Prevent iOS Zoom on Input
```css
@media (max-width: 768px) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

## Responsive Images

### Responsive Image
```html
<img src="image.jpg" alt="Description" style="max-width: 100%; height: auto;">
```

### Picture Element
```html
<picture>
  <source media="(max-width: 768px)" srcset="image-mobile.jpg">
  <source media="(min-width: 769px)" srcset="image-desktop.jpg">
  <img src="image-desktop.jpg" alt="Description">
</picture>
```

## Responsive Forms

### Full-Width Form on Mobile
```css
.form-control {
  width: 100%;
}

@media (max-width: 768px) {
  .form-control { margin-bottom: 1rem; }
}
```

### Responsive Form Layout
```css
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
}
```

## Responsive Navigation

### Mobile Menu Toggle
```css
.navbar-toggler {
  display: none;
}

@media (max-width: 768px) {
  .navbar-toggler { display: block; }
  .navbar-nav { flex-direction: column; }
}
```

## Responsive Tables

### Scrollable Table on Mobile
```css
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

## Responsive Modals

### Full-Width Modal on Mobile
```css
@media (max-width: 768px) {
  .modal-dialog {
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
  }
}
```

## Flexbox Responsive

### Flex Direction Change
```css
.flex-container {
  display: flex;
  flex-direction: row;
  gap: 2rem;
}

@media (max-width: 768px) {
  .flex-container { flex-direction: column; }
}
```

## CSS Grid Responsive

### Auto-Fit Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}
```

### Auto-Fill Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
```

## Responsive Spacing

### Responsive Margin
```css
.section {
  margin: 3rem 0;  /* Desktop */
}

@media (max-width: 768px) {
  .section { margin: 1.5rem 0; }  /* Mobile */
}
```

### Responsive Padding
```css
.card {
  padding: 2rem;  /* Desktop */
}

@media (max-width: 768px) {
  .card { padding: 1rem; }  /* Mobile */
}
```

## Responsive Text

### Responsive Font Size
```css
h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
}
```

### Responsive Line Height
```css
p {
  font-size: 1rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  p { line-height: 1.8; }
}
```

## Testing Checklist

- [ ] Test on mobile (375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1440px, 1920px)
- [ ] Test landscape orientation
- [ ] Test touch interactions
- [ ] Test form inputs
- [ ] Test navigation
- [ ] Test images scaling
- [ ] Test modals
- [ ] Test tables
- [ ] Test buttons
- [ ] Test accessibility

## Debugging Tips

### Check Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Check for Overflow
```css
body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

### Check Media Queries
Use Chrome DevTools → Responsive Design Mode to test breakpoints

### Check Touch Events
Use Chrome DevTools → Emulate CSS media feature prefers-reduced-motion

## Performance Tips

1. Use `max-width` instead of `width` for flexibility
2. Use `clamp()` for responsive sizing
3. Use CSS Grid for complex layouts
4. Use Flexbox for simple layouts
5. Minimize media queries
6. Use mobile-first approach
7. Optimize images for mobile
8. Lazy load images

## Browser Support

- Chrome: Full support
- Firefox: Full support
- Safari: Full support (iOS 12+)
- Edge: Full support
- IE 11: Limited support (use fallbacks)

## Resources

- MDN: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design
- CSS Tricks: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
- Can I Use: https://caniuse.com/
