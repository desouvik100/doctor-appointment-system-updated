# HealthSync Component Library - React Native Implementation

## 📦 Project Structure

```
mobile/src/
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   ├── Tabs.js
│   │   ├── Badge.js
│   │   ├── Chip.js
│   │   └── Skeleton.js
│   ├── layout/
│   │   ├── BottomNavigation.js
│   │   ├── Header.js
│   │   └── SafeArea.js
│   ├── doctor/
│   │   ├── DoctorCard.js
│   │   ├── DoctorListCard.js
│   │   └── DoctorProfile.js
│   ├── appointment/
│   │   ├── AppointmentCard.js
│   │   ├── BookingFlow.js
│   │   └── AppointmentsList.js
│   └── health/
│       ├── HealthOverview.js
│       └── HealthRecords.js
├── theme/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   ├── shadows.js
│   └── theme.js
├── screens/
│   ├── HomeScreen.js
│   ├── DoctorsScreen.js
│   ├── DoctorProfileScreen.js
│   ├── AppointmentsScreen.js
│   ├── HealthScreen.js
│   └── ProfileScreen.js
└── utils/
    ├── animations.js
    └── helpers.js
```

---

## 🎨 Theme Configuration

### colors.js
```javascript
export const colors = {
  // Primary
  primary: '#0066FF',
  primaryLight: '#F0F4FF',
  primaryDark: '#0052CC',
  
  // Secondary
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  // Gradients
  gradientPremium: ['#0066FF', '#8B5CF6'],
  gradientHealth: ['#10B981', '#06B6D4'],
};
```

### typography.js
```javascript
export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    fontFamily: 'Inter',
  },
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    fontFamily: 'Inter',
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    fontFamily: 'Inter',
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: 'Inter',
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  bodyRegular: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    fontFamily: 'Inter',
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
};
```

### spacing.js
```javascript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};
```

### shadows.js
```javascript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
};
```

---

## 🧩 Core Components

### Button.js
```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, ghost
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  icon = null,
  style,
}) => {
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      opacity: disabled ? 0.5 : 1,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    text: {
      ...typography.bodyLarge,
      fontWeight: '600',
    },
    primaryText: {
      color: colors.white,
    },
    secondaryText: {
      color: colors.textPrimary,
    },
    ghostText: {
      color: colors.primary,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      {icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>}
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.primaryText,
          variant === 'secondary' && styles.secondaryText,
          variant === 'ghost' && styles.ghostText,
        ]}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};
```

### Card.js
```javascript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, shadows } from '../theme';

export const Card = ({
  children,
  onPress,
  variant = 'default', // default, elevated, outlined
  style,
  pressable = false,
}) => {
  const styles = StyleSheet.create({
    container: {
      borderRadius: 12,
      padding: spacing.lg,
      backgroundColor: colors.white,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
    },
    default: {
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
    },
    elevated: {
      ...shadows.lg,
    },
    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  const Component = pressable ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        variant === 'default' && styles.default,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
    >
      {children}
    </Component>
  );
};
```

### Input.js
```javascript
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, shadows } from '../theme';

export const Input = ({
  placeholder,
  value,
  onChangeText,
  icon = null,
  clearable = false,
  onClear,
  error = false,
  disabled = false,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: 8,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: focused ? colors.primary : colors.border,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
    },
    input: {
      flex: 1,
      ...typography.bodyRegular,
      color: colors.textPrimary,
      paddingHorizontal: spacing.sm,
    },
    icon: {
      marginRight: spacing.sm,
    },
  });

  return (
    <View style={[styles.container, error && { borderColor: colors.error }, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        {...(disabled && { opacity: 0.5 })}
      />
      {clearable && value && (
        <TouchableOpacity onPress={onClear}>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### Tabs.js
```javascript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export const Tabs = ({ tabs, onTabChange, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.sm,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.white,
      ...shadows.sm,
    },
    text: {
      ...typography.label,
      color: colors.textSecondary,
    },
    activeText: {
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tab, activeTab === index && styles.activeTab]}
          onPress={() => {
            setActiveTab(index);
            onTabChange(index);
          }}
        >
          <Text style={[styles.text, activeTab === index && styles.activeText]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

### Badge.js
```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export const Badge = ({ label, variant = 'success' }) => {
  const variantColors = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      backgroundColor: variantColors[variant],
      alignSelf: 'flex-start',
    },
    text: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};
```

### Skeleton.js
```javascript
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../theme';

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4 }) => {
  const shimmerAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const styles = StyleSheet.create({
    container: {
      width,
      height,
      borderRadius,
      backgroundColor: colors.surface,
      marginVertical: spacing.sm,
    },
  });

  return <Animated.View style={[styles.container, { opacity }]} />;
};
```

---

## 📱 Screen Components

### HomeScreen.js (Redesigned)
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  Image,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { Button, Card, Input, Chip, Skeleton } from '../components/common';
import { DoctorCard } from '../components/doctor';

export const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    // Fetch data
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    greeting: {
      ...typography.heading2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    searchSection: {
      marginVertical: spacing.lg,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginVertical: spacing.xl,
    },
    quickActionCard: {
      width: '48%',
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.heading3,
      color: colors.textPrimary,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    horizontalScroll: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
  });

  const quickActions = [
    { icon: '📅', title: 'Book Appointment', action: () => navigation.navigate('Doctors') },
    { icon: '📹', title: 'Video Consultation', action: () => {} },
    { icon: '🚨', title: 'Emergency Help', action: () => {} },
    { icon: '🧪', title: 'Lab Tests', action: () => {} },
  ];

  const specialties = ['Cardiology', 'Dermatology', 'Dental', 'Orthopedic', 'Gynecology'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Evening, Souvik 👋</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search doctors, symptoms, clinics…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Text>🔍</Text>}
          clearable
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <Card
            key={index}
            pressable
            onPress={action.action}
            style={styles.quickActionCard}
          >
            <Text style={{ fontSize: 32, marginBottom: spacing.md }}>
              {action.icon}
            </Text>
            <Text style={typography.label}>{action.title}</Text>
          </Card>
        ))}
      </View>

      {/* Specialty Browse */}
      <Text style={styles.sectionTitle}>Browse by Specialty</Text>
      <View style={styles.horizontalScroll}>
        <FlatList
          horizontal
          data={specialties}
          renderItem={({ item }) => (
            <Chip label={item} onPress={() => {}} style={{ marginRight: spacing.md }} />
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Upcoming Appointment */}
      {appointment && (
        <Card style={{ marginHorizontal: spacing.lg, marginVertical: spacing.xl }}>
          <Text style={typography.heading3}>Upcoming Appointment</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>
            {appointment.doctorName} • {appointment.date}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md }}>
            <Button title="Join" variant="primary" style={{ flex: 1 }} />
            <Button title="Reschedule" variant="secondary" style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {/* Top Doctors */}
      <Text style={styles.sectionTitle}>Top Doctors Near You</Text>
      <View style={styles.horizontalScroll}>
        <FlatList
          horizontal
          data={doctors}
          renderItem={({ item }) => <DoctorCard doctor={item} />}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
};
```

---

## 🎯 Implementation Priority

### Phase 1: Foundation (Week 1)
- [ ] Create theme system (colors, typography, spacing)
- [ ] Build core components (Button, Card, Input, Tabs)
- [ ] Build layout components (Header, BottomNav)

### Phase 2: Screens (Week 2)
- [ ] Redesign HomeScreen
- [ ] Redesign DoctorsScreen
- [ ] Redesign AppointmentsScreen

### Phase 3: Features (Week 3)
- [ ] Implement booking flow
- [ ] Implement health profile
- [ ] Implement profile screen

### Phase 4: Polish (Week 4)
- [ ] Add micro interactions
- [ ] Optimize performance
- [ ] Test on multiple devices
- [ ] Get design review

---

## 📊 Component Usage Examples

### Using Button
```javascript
<Button
  title="Book Appointment"
  onPress={() => navigation.navigate('Booking')}
  variant="primary"
/>
```

### Using Card
```javascript
<Card pressable onPress={() => {}}>
  <Text>Card Content</Text>
</Card>
```

### Using Input
```javascript
<Input
  placeholder="Search…"
  value={search}
  onChangeText={setSearch}
  clearable
  onClear={() => setSearch('')}
/>
```

### Using Tabs
```javascript
<Tabs
  tabs={['Upcoming', 'Completed', 'Cancelled']}
  onTabChange={(index) => setActiveTab(index)}
/>
```

---

## ✅ Quality Checklist

- [ ] All components follow design system
- [ ] Consistent spacing and typography
- [ ] Smooth animations and transitions
- [ ] Accessible (proper contrast, tap targets)
- [ ] Responsive on all screen sizes
- [ ] Performance optimized
- [ ] No console warnings
- [ ] Tested on iOS and Android

---

**This component library creates a premium, reusable foundation for the HealthSync Patient App redesign.**
