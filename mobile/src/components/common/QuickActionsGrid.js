/**
 * QuickActionsGrid - Premium Reusable Service Grid Component
 * Inspired by Apple Health, Stripe, and Google Health designs.
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  InteractionManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from './Skeleton';

const { width } = Dimensions.get('window');
const RECENT_ACTION_KEY = 'healthsync_recent_quick_action';

// Helper to check if a string is a standard vector icon name
const isVectorIcon = (icon) => typeof icon === 'string' && /^[a-z0-9-]+$/i.test(icon);

// Helper to get soft background transparency for icons
const getSoftBgColor = (colorHex) => {
  if (colorHex && colorHex.startsWith('#')) {
    if (colorHex.length === 7) return `${colorHex}15`; // ~8% opacity
    return colorHex;
  }
  return 'rgba(0, 212, 170, 0.1)';
};

// Individual Action Card Component
const ActionCard = React.memo(({ action, variant, cols, isRecent, onPress }) => {
  const { colors, isDarkMode } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // 8pt Spacing / Gaps
  const GAP = spacing.md; // 12pt gap
  const horizontalPadding = spacing.xl * 2; // margins on left & right
  const cardWidth = (width - horizontalPadding - GAP * (cols - 1)) / cols;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 3 }),
      Animated.timing(opacity, { toValue: 0.9, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      onPress(action);
    });
  }, [action, onPress]);

  const softBg = getSoftBgColor(action.color || colors.primary);
  const iconColor = action.color || colors.primary;

  if (variant === 'hub') {
    // Premium 2-column rectangular design with subtitle description
    return (
      <Animated.View style={[
        styles.cardWrapper,
        { width: cardWidth, transform: [{ scale }], opacity }
      ]}>
        <Pressable
          style={[
            styles.cardHub,
            {
              backgroundColor: colors.surface,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1,
            }
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: colors.ripple }}
        >
          {/* Action Badge */}
          {action.badge && (
            <View style={[styles.badgeContainer, { backgroundColor: action.id === 'emergency' ? 'rgba(239, 68, 68, 0.15)' : `${colors.primary}18` }]}>
              <Text style={[styles.badgeText, { color: action.id === 'emergency' ? '#EF4444' : colors.primary }]}>
                {action.badge}
              </Text>
            </View>
          )}

          {/* Recently Used Indicator */}
          {isRecent && !action.badge && (
            <View style={styles.recentContainer}>
              <Icon name="time-outline" size={10} color={colors.textMuted} />
              <Text style={[styles.recentText, { color: colors.textMuted }]}>Recent</Text>
            </View>
          )}

          <View style={styles.hubContent}>
            <View style={[styles.iconContainer, { backgroundColor: softBg }]}>
              {isVectorIcon(action.icon) ? (
                <Icon name={action.icon} size={22} color={iconColor} />
              ) : (
                <Text style={styles.emojiIcon}>{action.icon}</Text>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[styles.hubTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {action.label}
              </Text>
              {action.description && (
                <Text style={[styles.hubDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                  {action.description}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Classic redesigned grid tile (square style, e.g. 3 or 4 columns)
  return (
    <Animated.View style={[
      styles.cardWrapper,
      { width: cardWidth, transform: [{ scale }], opacity }
    ]}>
      <Pressable
        style={[
          styles.cardGrid,
          {
            height: cardWidth,
            backgroundColor: colors.surface,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
            borderWidth: 1,
          }
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: colors.ripple }}
      >
        {/* Floating Badge on Grid Card */}
        {action.badge && (
          <View style={[styles.badgeContainer, { backgroundColor: action.id === 'emergency' ? 'rgba(239, 68, 68, 0.15)' : `${colors.primary}18` }]}>
            <Text style={[styles.badgeText, { color: action.id === 'emergency' ? '#EF4444' : colors.primary }]}>
              {action.badge}
            </Text>
          </View>
        )}

        {/* Recently Used Dot */}
        {isRecent && !action.badge && (
          <View style={[styles.recentDot, { backgroundColor: colors.primary }]} />
        )}

        <View style={[styles.iconContainerGrid, { backgroundColor: softBg }]}>
          {isVectorIcon(action.icon) ? (
            <Icon name={action.icon} size={24} color={iconColor} />
          ) : (
            <Text style={styles.emojiIcon}>{action.icon}</Text>
          )}
        </View>
        <Text
          style={[styles.gridTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const QuickActionsGrid = ({
  actions = [],
  cols = 2,
  variant = 'hub',
  loading = false,
  onActionPress,
  showTitle = true,
  titleText = 'Quick Actions',
  showBadge = true,
  badgeText,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [recentId, setRecentId] = useState(null);

  // Load recently used action ID from AsyncStorage
  useEffect(() => {
    const loadRecentAction = async () => {
      try {
        const storedId = await AsyncStorage.getItem(RECENT_ACTION_KEY);
        if (storedId) {
          setRecentId(storedId);
        }
      } catch (error) {
        console.warn('Failed to load recent quick action:', error);
      }
    };
    
    loadRecentAction();
  }, []);

  const handleActionPress = useCallback(async (action) => {
    try {
      // Save ID to state and AsyncStorage for persistent recently used UX
      setRecentId(action.id);
      await AsyncStorage.setItem(RECENT_ACTION_KEY, action.id);
    } catch (error) {
      console.warn('Failed to save recent quick action:', error);
    }

    if (onActionPress) {
      onActionPress(action);
    } else if (action.screen) {
      navigation.navigate(action.screen);
    }
  }, [onActionPress, navigation]);

  // Loading skeleton state
  if (loading) {
    const listCount = actions.length || (variant === 'hub' ? 8 : 6);
    const GAP = spacing.md;
    const horizontalPadding = spacing.xl * 2;
    const cardWidth = (width - horizontalPadding - GAP * (cols - 1)) / cols;

    return (
      <View style={styles.container}>
        {showTitle && (
          <View style={styles.headerRow}>
            <Skeleton width={120} height={20} />
            {showBadge && <Skeleton width={60} height={18} style={{ borderRadius: borderRadius.full }} />}
          </View>
        )}
        <View style={styles.grid}>
          {Array.from({ length: listCount }).map((_, index) => (
            <View
              key={index}
              style={[
                variant === 'hub' ? styles.cardHubSkeleton : styles.cardGridSkeleton,
                {
                  width: cardWidth,
                  height: variant === 'hub' ? 76 : cardWidth,
                  backgroundColor: colors.surface,
                }
              ]}
            >
              {variant === 'hub' ? (
                <View style={styles.hubContent}>
                  <Skeleton variant="circle" width={44} height={44} style={{ marginRight: spacing.md }} />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Skeleton width="70%" height={12} style={{ marginBottom: 6 }} />
                    <Skeleton width="45%" height={8} />
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Skeleton variant="circle" width={44} height={44} style={{ marginBottom: spacing.sm }} />
                  <Skeleton width="60%" height={10} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{titleText}</Text>
          {showBadge && (badgeText || actions.length > 0) && (
            <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[styles.badgeLabelText, { color: colors.primary }]}>
                {badgeText || `${actions.length} services`}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.grid}>
        {actions.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            variant={variant}
            cols={cols}
            isRecent={action.id === recentId}
            onPress={handleActionPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeLabelText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrapper: {
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    // Soft subtle shadow for modern depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHub: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    minHeight: 76,
    justifyContent: 'center',
  },
  cardGrid: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHubSkeleton: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardGridSkeleton: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  hubContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconContainerGrid: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emojiIcon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  hubTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    lineHeight: 18,
  },
  hubDesc: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    lineHeight: 14,
  },
  gridTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    zIndex: 2,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  recentContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 2,
  },
  recentText: {
    fontSize: 8,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  recentDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 2,
  },
});

export default QuickActionsGrid;
