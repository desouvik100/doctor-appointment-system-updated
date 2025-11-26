# Accessibility Testing Guide 🦾

## Quick Test Checklist

### 1. Keyboard Navigation Test (5 minutes)
```
✓ Unplug your mouse
✓ Press Tab to navigate through the page
✓ Check: Can you see where focus is? (Gold outline)
✓ Check: Can you reach all interactive elements?
✓ Check: Press Enter/Space to activate buttons
✓ Check: Press Escape to close modals
✓ Check: Skip link appears when you press Tab
```

**Expected:** All elements accessible, focus always visible.

### 2. Screen Reader Test (10 minutes)

**Windows (NVDA - Free):**
```bash
1. Download NVDA: https://www.nvaccess.org/download/
2. Install and start NVDA
3. Navigate with:
   - Tab: Next element
   - Shift+Tab: Previous element
   - H: Next heading
   - B: Next button
   - L: Next link
```

**Mac (VoiceOver - Built-in):**
```bash
1. Press Cmd+F5 to start VoiceOver
2. Navigate with:
   - VO+Right Arrow: Next element
   - VO+Left Arrow: Previous element
   - VO+H: Next heading
   - VO+Space: Activate element
```

**Expected:** All content announced clearly, buttons have descriptive labels.

### 3. Color Contrast Test (2 minutes)

**Using Browser DevTools:**
```bash
1. Right-click any text → Inspect
2. In Styles panel, click color swatch
3. Check "Contrast ratio" section
4. Should show: ✓ AA ✓ AAA
```

**Online Tool:**
```
Visit: https://webaim.org/resources/contrastchecker/
Test: #ffffff on #667eea (should pass AA)
```

**Expected:** All text passes WCAG AA (4.5:1 minimum).

### 4. Zoom Test (2 minutes)
```
✓ Press Ctrl/Cmd + Plus (+) to zoom to 200%
✓ Check: Is all text still readable?
✓ Check: Do buttons still work?
✓ Check: Is layout still usable?
✓ Check: No horizontal scrolling?
```

**Expected:** Page usable at 200% zoom.

### 5. Focus Indicator Test (1 minute)
```
✓ Tab through the page
✓ Check: Every interactive element shows gold outline
✓ Check: Outline is 3px thick
✓ Check: Outline has 2px offset
✓ Check: Outline visible on all backgrounds
```

**Expected:** Clear, consistent focus indicators.

## Automated Testing

### Using Lighthouse (Built into Chrome)
```bash
1. Open Chrome DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Accessibility" only
4. Click "Generate report"
5. Target: Score ≥90
```

### Using axe DevTools (Free Extension)
```bash
1. Install: https://www.deque.com/axe/devtools/
2. Open DevTools → axe DevTools tab
3. Click "Scan ALL of my page"
4. Review issues
5. Target: 0 critical issues
```

### Using WAVE (Online Tool)
```bash
Visit: https://wave.webaim.org/
Enter: http://localhost:3000
Review: Errors, Alerts, Features
Target: 0 errors
```

## Manual Testing Scenarios

### Scenario 1: Sign Up Flow
```
1. Tab to "Get Started" button
2. Press Enter
3. Tab through form fields
4. Check: Labels announced by screen reader
5. Submit form with errors
6. Check: Error messages clear and announced
```

### Scenario 2: Navigation
```
1. Press Tab once (skip link appears)
2. Press Enter (jumps to main content)
3. Tab through navigation links
4. Check: Current page indicated
5. Press Enter on a link
6. Check: Page changes announced
```

### Scenario 3: Theme Toggle
```
1. Tab to theme toggle button
2. Check: Button label announced ("Switch to Dark Mode")
3. Press Enter
4. Check: Theme changes
5. Check: Button label updates ("Switch to Light Mode")
6. Check: State announced (aria-pressed)
```

## Common Issues to Check

### ❌ Bad Examples:
```html
<!-- No label -->
<button><i class="fas fa-times"></i></button>

<!-- Color only -->
<span style="color: red">Error</span>

<!-- No focus indicator -->
button:focus { outline: none; }

<!-- Too small -->
<button style="width: 20px; height: 20px">X</button>
```

### ✅ Good Examples:
```html
<!-- With label -->
<button aria-label="Close">
  <i class="fas fa-times" aria-hidden="true"></i>
</button>

<!-- Icon + text -->
<span class="error-icon">⚠️</span>
<span class="error-text">Error: Invalid email</span>

<!-- Clear focus -->
button:focus {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
}

<!-- Proper size -->
<button style="min-width: 44px; min-height: 44px">X</button>
```

## Testing Matrix

| Test | Tool | Time | Frequency |
|------|------|------|-----------|
| Keyboard | Manual | 5 min | Every PR |
| Screen Reader | NVDA/VO | 10 min | Weekly |
| Contrast | DevTools | 2 min | Every PR |
| Zoom | Browser | 2 min | Every PR |
| Lighthouse | Chrome | 3 min | Every PR |
| axe | Extension | 2 min | Every PR |

## Quick Fixes

### Issue: Button has no label
```javascript
// Before
<button onClick={handleClick}>
  <i className="fas fa-times"></i>
</button>

// After
<button 
  onClick={handleClick}
  aria-label="Close dialog"
>
  <i className="fas fa-times" aria-hidden="true"></i>
</button>
```

### Issue: No focus indicator
```css
/* Before */
button:focus {
  outline: none;
}

/* After */
button:focus {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.3);
}
```

### Issue: Low contrast
```css
/* Before */
.text-muted {
  color: #999; /* 2.8:1 - FAIL */
}

/* After */
.text-muted {
  color: #64748b; /* 4.6:1 - PASS */
}
```

### Issue: Touch target too small
```css
/* Before */
button {
  width: 30px;
  height: 30px;
}

/* After */
button {
  min-width: 44px;
  min-height: 44px;
}
```

## Accessibility Score Goals

### Lighthouse Scores:
- **Target:** ≥90
- **Good:** ≥95
- **Excellent:** 100

### axe DevTools:
- **Critical:** 0
- **Serious:** 0
- **Moderate:** <5
- **Minor:** <10

### Manual Testing:
- **Keyboard:** 100% navigable
- **Screen Reader:** 100% understandable
- **Contrast:** 100% WCAG AA
- **Zoom:** 100% usable at 200%

## Resources

### Tools:
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Tool](https://wave.webaim.org/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Guides:
- [WebAIM Keyboard Testing](https://webaim.org/articles/keyboard/)
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Remember:** Test with real users with disabilities when possible!
