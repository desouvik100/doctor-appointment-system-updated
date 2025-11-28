# Mobile Responsive - Quick Reference Card 📱

## Most Used Utility Classes

### Display
```css
.hide-mobile              /* Hide on mobile */
.show-mobile              /* Show only on mobile */
.w-100-mobile             /* Full width on mobile */
```

### Layout
```css
.flex-column-mobile       /* Stack vertically */
.text-center-mobile       /* Center text */
.stack-mobile             /* Vertical stack with gap */
.scroll-x-mobile          /* Horizontal scroll */
```

### Spacing
```css
.p-3-mobile               /* Padding 1rem */
.m-0-mobile               /* No margin */
.mb-3-mobile              /* Margin bottom 1rem */
```

## Common Patterns

### Full-Width Button
```jsx
<button className="btn btn-primary w-100-mobile">
  Click Me
</button>
```

### Horizontal Scroll Cards
```jsx
<div className="scroll-x-mobile">
  <div className="card">Card 1</div>
  <div className="card">Card 2</div>
  <div className="card">Card 3</div>
</div>
```

### Stack on Mobile, Row on Desktop
```jsx
<div className="d-flex flex-column-mobile">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Hide on Mobile
```jsx
<div className="hide-mobile">
  Desktop only content
</div>
```

### Center on Mobile
```jsx
<h1 className="text-center-mobile">
  Centered Title
</h1>
```

## Breakpoints

```css
Mobile:        max-width: 768px
Small Mobile:  max-width: 576px
Tablet:        769px - 1024px
Desktop:       min-width: 1025px
```

## Touch Targets

✅ Minimum: 44px × 44px
✅ Recommended: 48px × 48px
✅ Comfortable: 56px × 56px

## Typography Scale (Mobile)

```css
h1: 1.75rem (28px)
h2: 1.5rem  (24px)
h3: 1.25rem (20px)
h4: 1.125rem (18px)
p:  0.95rem (15px)
```

## Spacing Scale

```css
0: 0
1: 0.25rem (4px)
2: 0.5rem  (8px)
3: 1rem    (16px)
4: 1.5rem  (24px)
5: 2rem    (32px)
```

## Quick Fixes

### Fix Horizontal Scroll
```css
body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

### Fix iOS Input Zoom
```css
input {
  font-size: 16px !important;
}
```

### Fix Modal Height
```css
.modal-content {
  max-height: 90vh;
  overflow-y: auto;
}
```

### Fix Sticky Header
```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
```

## Testing Devices

- iPhone SE: 375px
- iPhone 12: 390px
- iPhone 14 Pro Max: 430px
- Samsung Galaxy: 360px
- iPad: 768px

## Performance Tips

1. Use `transform` instead of `top/left`
2. Keep animations under 300ms
3. Use `will-change` sparingly
4. Lazy load images
5. Minimize repaints

## Accessibility

- Focus indicators: 3px solid
- Touch targets: 44px minimum
- Color contrast: 4.5:1 minimum
- Font size: 16px minimum

## Common CSS

### Card
```css
.card {
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
```

### Button
```css
.btn {
  min-height: 48px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
}
```

### Input
```css
.form-control {
  min-height: 48px;
  padding: 1rem;
  font-size: 16px;
  border-radius: 12px;
}
```

## Browser DevTools

### Chrome
1. F12 → Toggle device toolbar
2. Select device or custom size
3. Test touch events

### Safari
1. Develop → Enter Responsive Design Mode
2. Choose device
3. Test on real device via USB

## Quick Test Checklist

- [ ] No horizontal scroll
- [ ] All buttons tappable (44px+)
- [ ] Text readable (16px+)
- [ ] Forms don't zoom on focus
- [ ] Navigation accessible
- [ ] Modals fit screen
- [ ] Images scale properly
- [ ] Tables scroll horizontally

## Resources

- DevTools: F12 → Device Toolbar
- Test URL: chrome://inspect
- iOS Simulator: Xcode
- Android Emulator: Android Studio

---

**Print this page for quick reference!**
