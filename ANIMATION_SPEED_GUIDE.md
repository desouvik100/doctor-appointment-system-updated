# Animation Speed Guide 🎨

## Current Animation Speeds in HealthSync

### Text & Content Animations

| Animation | Duration | Easing | Purpose |
|-----------|----------|--------|---------|
| Fade In Up | 0.8s | ease-out | Content entrance |
| Gradient Shift | 8s | ease-in-out | Text gradient color |
| Float Icon | 6s | ease-in-out | Floating elements |
| Pulse Dot | 2s | ease-in-out | Status indicators |
| Count Up | 1s | ease-out | Number animations |

### Interactive Animations

| Element | Duration | Easing | Trigger |
|---------|----------|--------|---------|
| Button Hover | 0.3s | ease | Mouse hover |
| Card Hover | 0.4s | cubic-bezier | Mouse hover |
| Modal Open | 0.3s | ease | Click |
| Dropdown | 0.2s | ease | Click |
| Tooltip | 0.15s | ease | Hover |

### Background & Ambient Animations

| Animation | Duration | Purpose | Notes |
|-----------|----------|---------|-------|
| Gradient Shift | 8s | Subtle color change | Slow, professional |
| Float Icon | 6s | Floating medical icons | Gentle movement |
| Pulse | 2s | Attention indicators | Noticeable but not distracting |

---

## Animation Speed Guidelines

### Fast (0.1s - 0.3s)
**Use for**: Immediate feedback, micro-interactions
- Button clicks
- Hover states
- Tooltips
- Focus indicators

**Example**:
```css
.button {
  transition: all 0.3s ease;
}
```

### Medium (0.4s - 1s)
**Use for**: Content transitions, page elements
- Fade in/out
- Slide animations
- Card reveals
- Modal open/close

**Example**:
```css
.card {
  animation: fadeInUp 0.8s ease-out;
}
```

### Slow (2s - 8s)
**Use for**: Ambient effects, background animations
- Gradient shifts
- Floating elements
- Breathing effects
- Subtle movements

**Example**:
```css
.gradient {
  animation: gradient-shift 8s ease-in-out infinite;
}
```

### Very Slow (10s+)
**Use for**: Barely noticeable effects
- Background patterns
- Parallax effects
- Ambient lighting

---

## Easing Functions

### ease
**Use for**: General purpose animations
```css
transition: all 0.3s ease;
```

### ease-in-out
**Use for**: Smooth start and end
```css
animation: gradient-shift 8s ease-in-out infinite;
```

### ease-out
**Use for**: Content entrance (fast start, slow end)
```css
animation: fadeInUp 0.8s ease-out;
```

### ease-in
**Use for**: Content exit (slow start, fast end)
```css
animation: fadeOut 0.5s ease-in;
```

### cubic-bezier
**Use for**: Custom timing curves
```css
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Performance Tips

### GPU Acceleration
Use these properties for smooth 60fps:
- `transform` (instead of top/left)
- `opacity` (instead of visibility)
- `will-change` (sparingly)

**Good**:
```css
.element {
  transform: translateY(10px);
  opacity: 0.5;
}
```

**Bad**:
```css
.element {
  top: 10px; /* Causes reflow */
  visibility: hidden; /* Not animatable */
}
```

### Reduce Motion
Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Common Animation Durations

### UI Feedback
- **Instant**: 0.1s - 0.15s (tooltips, focus)
- **Quick**: 0.2s - 0.3s (buttons, hovers)
- **Standard**: 0.3s - 0.5s (modals, dropdowns)

### Content Transitions
- **Fast**: 0.5s - 0.8s (fade in/out)
- **Medium**: 0.8s - 1.2s (slide animations)
- **Slow**: 1.5s - 2s (page transitions)

### Ambient Effects
- **Subtle**: 3s - 5s (breathing effects)
- **Gentle**: 6s - 10s (floating elements)
- **Barely Noticeable**: 10s+ (background patterns)

---

## Animation Checklist

When adding animations, check:

- [ ] Duration is appropriate for the effect
- [ ] Easing function matches the purpose
- [ ] Animation doesn't distract from content
- [ ] Performance is smooth (60fps)
- [ ] Works on mobile devices
- [ ] Respects prefers-reduced-motion
- [ ] Doesn't cause layout reflow
- [ ] Uses GPU-accelerated properties

---

## Examples from HealthSync

### Hero Title Gradient (Fixed)
```css
.text-gradient {
  animation: gradient-shift 8s ease-in-out infinite;
}
```
**Why 8s?** Subtle, professional, not distracting

### Fade In Content
```css
.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}
```
**Why 0.8s?** Fast enough to feel responsive, slow enough to be smooth

### Button Hover
```css
.btn {
  transition: all 0.3s ease;
}
```
**Why 0.3s?** Immediate feedback without feeling instant

### Floating Icons
```css
.floating-icon {
  animation: float-icon 6s ease-in-out infinite;
}
```
**Why 6s?** Gentle movement that doesn't distract

---

## Troubleshooting

### Animation Too Fast
**Problem**: Animation feels jarring or distracting
**Solution**: Increase duration, use ease-in-out

### Animation Too Slow
**Problem**: UI feels sluggish or unresponsive
**Solution**: Decrease duration, use ease-out

### Animation Stutters
**Problem**: Animation is not smooth
**Solution**: Use transform/opacity, add will-change

### Animation Causes Lag
**Problem**: Page performance drops
**Solution**: Reduce number of animations, use GPU acceleration

---

## Best Practices

1. **Start Slow**: It's easier to speed up than slow down
2. **Test on Devices**: Animations may feel different on mobile
3. **Less is More**: Too many animations are distracting
4. **Match Purpose**: Fast for feedback, slow for ambiance
5. **Be Consistent**: Use similar durations for similar effects
6. **Respect Users**: Honor prefers-reduced-motion
7. **Optimize**: Use GPU-accelerated properties
8. **Test Performance**: Ensure 60fps on all devices

---

**Last Updated**: November 27, 2025
**Current Status**: All animations optimized for performance and UX
