/**
 * Toast Component - Modern toast notifications
 * Usage: Toast.show({ message: 'Success!', type: 'success' })
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const Toast = ({ visible, message, type = 'info', duration = 3000, onHide }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success,
          icon: '✓',
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          icon: '✕',
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          icon: '⚠',
        };
      default:
        return {
          backgroundColor: colors.primary,
          icon: 'ℹ',
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.md,
          transform: [{ translateY }],
          opacity,
          backgroundColor: toastStyle.backgroundColor,
        },
      ]}
    >
      <Text style={styles.icon}>{toastStyle.icon}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  message: {
    ...typography.bodyMedium,
    color: '#fff',
    flex: 1,
    fontWeight: '600',
  },
});

// Toast Manager (Singleton)
class ToastManager {
  static instance = null;

  static getInstance() {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  show({ message, type = 'info', duration = 3000 }) {
    if (this.showToast) {
      this.showToast({ message, type, duration });
    }
  }

  success(message, duration) {
    this.show({ message, type: 'success', duration });
  }

  error(message, duration) {
    this.show({ message, type: 'error', duration });
  }

  warning(message, duration) {
    this.show({ message, type: 'warning', duration });
  }

  info(message, duration) {
    this.show({ message, type: 'info', duration });
  }

  setShowToast(showToast) {
    this.showToast = showToast;
  }
}

export const ToastInstance = ToastManager.getInstance();
export default Toast;
