# 🚀 Quick Reference - Mobile UI Components

## 📦 Import Components

```javascript
// All at once
import { 
  Button, Card, Input, Badge, Avatar,
  Toast, ToastInstance, EmptyState, FilterChip,
  ProgressStepper, Rating, BottomSheet, Skeleton
} from '../components/common';

// Animations
import { fadeIn, slideUp, bounce, shake } from '../utils/animations';
```

---

## 🎨 Component Cheat Sheet

### **Toast Notifications**
```javascript
ToastInstance.success('Success message');
ToastInstance.error('Error message');
ToastInstance.warning('Warning message');
ToastInstance.info('Info message');
```

### **Button**
```javascript
<Button 
  variant="primary"  // primary, secondary, outline, ghost, danger
  size="md"          // sm, md, lg
  onPress={handlePress}
  loading={isLoading}
>
  Click Me
</Button>
```

### **EmptyState**
```javascript
<EmptyState
  icon="📭"
  title="No Data"
  message="Nothing to show here"
  actionLabel="Add New"
  onAction={handleAdd}
  colors={colors}
/>
```

### **FilterChip**
```javascript
<FilterChip
  label="Cardiology"
  icon="❤️"
  selected={isSelected}
  onPress={handlePress}
  colors={colors}
/>
```

### **ProgressStepper**
```javascript
<ProgressStepper
  steps={['Select', 'Book', 'Pay', 'Confirm']}
  currentStep={2}
  colors={colors}
/>
```

### **Rating**
```javascript
// Read-only
<Rating rating={4.5} size={20} />

// Editable
<Rating
  rating={rating}
  editable
  onRatingChange={setRating}
  size={32}
/>
```

### **BottomSheet**
```javascript
<BottomSheet
  visible={show}
  onClose={() => setShow(false)}
  title="Options"
  height={400}
  colors={colors}
>
  {/* Content */}
</BottomSheet>
```

### **Skeleton**
```javascript
<Skeleton width={200} height={20} />
<Skeleton variant="circle" size={50} />
<Skeleton variant="rect" width="100%" height={100} />
```

---

## 🎬 Animation Cheat Sheet

### **Basic Animations**
```javascript
const opacity = useRef(new Animated.Value(0)).current;

// Fade in
fadeIn(opacity, 300).start();

// Fade out
fadeOut(opacity, 300).start();

// Slide up
slideUp(translateY, 50, 0).start();

// Scale in
scaleIn(scale, 300).start();
```

### **Interactive Animations**
```javascript
// Button press
pressAnimation(scale).start();

// Bounce
bounce(scale).start();

// Shake (error)
shake(translateX).start();

// Pulse (loading)
pulse(scale, 0.95, 1.05).start();
```

### **Advanced Animations**
```javascript
// Stagger (list items)
stagger(animatedValues, fadeIn, 100).start();

// Parallel (multiple at once)
parallel(
  fadeIn(opacity),
  slideUp(translateY)
).start();

// Sequence (one after another)
sequence(
  fadeIn(opacity),
  slideUp(translateY)
).start();

// Success animation
successAnimation(scale, opacity).start();
```

---

## 🎨 Theme Colors

```javascript
const { colors } = useTheme();

// Primary colors
colors.primary        // Main brand color
colors.secondary      // Secondary brand color
colors.success        // Green
colors.error          // Red
colors.warning        // Yellow
colors.info           // Blue

// Text colors
colors.textPrimary    // Main text
colors.textSecondary  // Secondary text
colors.textMuted      // Muted text
colors.textInverse    // White text

// Background colors
colors.background     // Main background
colors.surface        // Card background
colors.surfaceBorder  // Card border

// Gradients
colors.gradientPrimary   // ['#color1', '#color2']
colors.gradients.primary // Same as above
```

---

## 📏 Spacing & Typography

```javascript
import { spacing, typography, borderRadius } from '../../theme/typography';

// Spacing
spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 12
spacing.lg    // 16
spacing.xl    // 20
spacing.xxl   // 24
spacing.xxxl  // 32
spacing.huge  // 48

// Typography
typography.displayLarge
typography.displayMedium
typography.displaySmall
typography.headlineLarge
typography.headlineMedium
typography.headlineSmall
typography.bodyLarge
typography.bodyMedium
typography.bodySmall
typography.labelLarge
typography.labelMedium
typography.labelSmall
typography.button

// Border Radius
borderRadius.xs    // 4
borderRadius.sm    // 6
borderRadius.md    // 8
borderRadius.lg    // 12
borderRadius.xl    // 16
borderRadius.xxl   // 20
borderRadius.full  // 9999
```

---

## 🎭 Shadows

```javascript
import shadows from '../../theme/shadows';

// Apply shadows
style={[styles.card, shadows.sm]}
style={[styles.card, shadows.md]}
style={[styles.card, shadows.lg]}

// Available shadows
shadows.xs
shadows.sm
shadows.md
shadows.lg
shadows.xl
shadows.xxl
```

---

## 🔥 Common Patterns

### **Animated Screen Entrance**
```javascript
const opacity = useRef(new Animated.Value(0)).current;
const translateY = useRef(new Animated.Value(50)).current;

useEffect(() => {
  parallel(
    fadeIn(opacity, 300),
    slideUp(translateY, 50, 0)
  ).start();
}, []);

<Animated.View style={{ opacity, transform: [{ translateY }] }}>
  {/* Screen content */}
</Animated.View>
```

### **Staggered List**
```javascript
const items = [1, 2, 3, 4, 5];
const animations = items.map(() => useRef(new Animated.Value(0)).current);

useEffect(() => {
  stagger(animations, fadeIn, 100).start();
}, []);

{items.map((item, i) => (
  <Animated.View key={i} style={{ opacity: animations[i] }}>
    <Text>{item}</Text>
  </Animated.View>
))}
```

### **Button with Press Animation**
```javascript
const scale = useRef(new Animated.Value(1)).current;

<Animated.View style={{ transform: [{ scale }] }}>
  <TouchableOpacity
    onPress={() => {
      pressAnimation(scale).start(() => {
        // Your action
      });
    }}
  >
    <Text>Press Me</Text>
  </TouchableOpacity>
</Animated.View>
```

### **Loading State**
```javascript
const scale = useRef(new Animated.Value(1)).current;

useEffect(() => {
  if (loading) {
    pulse(scale, 0.95, 1.05).start();
  }
}, [loading]);

<Animated.View style={{ transform: [{ scale }] }}>
  <ActivityIndicator />
</Animated.View>
```

### **Success Feedback**
```javascript
const scale = useRef(new Animated.Value(0)).current;
const opacity = useRef(new Animated.Value(0)).current;

const showSuccess = () => {
  successAnimation(scale, opacity).start();
  ToastInstance.success('Success!');
};

<Animated.View style={{ transform: [{ scale }], opacity }}>
  <Text>✓</Text>
</Animated.View>
```

---

## 📱 Screen Template

```javascript
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme/typography';
import { fadeIn, slideUp } from '../../utils/animations';
import { Button, EmptyState } from '../../components/common';

const MyScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    parallel(
      fadeIn(opacity, 300),
      slideUp(translateY, 50, 0)
    ).start();
  }, []);

  return (
    <Animated.View 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        opacity,
        transform: [{ translateY }]
      }}
    >
      {/* Your content */}
    </Animated.View>
  );
};

export default MyScreen;
```

---

## 🎯 Best Practices

### **DO**
- ✅ Use theme colors
- ✅ Use spacing tokens
- ✅ Add animations for interactions
- ✅ Show loading states
- ✅ Handle empty states
- ✅ Use `useNativeDriver: true`
- ✅ Import from central file

### **DON'T**
- ❌ Hardcode colors
- ❌ Hardcode spacing
- ❌ Skip loading states
- ❌ Ignore empty states
- ❌ Forget error handling
- ❌ Use inline styles for colors
- ❌ Duplicate component code

---

## 🔍 Debugging

### **Animation Not Working?**
```javascript
// Check if useNativeDriver is true
// Check if animated value is used in style
// Check if animation is started with .start()
```

### **Component Not Showing?**
```javascript
// Check if colors prop is passed
// Check if component is imported correctly
// Check console for errors
```

### **Theme Not Applied?**
```javascript
// Check if useTheme() is called
// Check if colors are used in styles
// Check if ThemeProvider wraps app
```

---

**Quick Tip**: Keep this file open while coding for instant reference! 🚀
