/**
 * HealthTips Component - Scrollable health tips cards
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

const DEFAULT_TIPS = [
  {
    id: '1',
    title: 'Stay Hydrated',
    description: 'Drink at least 8 glasses of water daily for optimal health.',
    icon: '💧',
    gradient: ['#00d4aa', '#00b894'],
    category: 'Wellness',
  },
  {
    id: '2',
    title: 'Regular Exercise',
    description: '30 minutes of moderate exercise can boost your mood and energy.',
    icon: '🏃',
    gradient: ['#6c5ce7', '#a29bfe'],
    category: 'Fitness',
  },
  {
    id: '3',
    title: 'Quality Sleep',
    description: 'Aim for 7-9 hours of sleep to support immune function.',
    icon: '😴',
    gradient: ['#0984e3', '#74b9ff'],
    category: 'Sleep',
  },
  {
    id: '4',
    title: 'Mindful Eating',
    description: 'Include colorful vegetables in every meal for essential nutrients.',
    icon: '🥗',
    gradient: ['#00b894', '#55efc4'],
    category: 'Nutrition',
  },
  {
    id: '5',
    title: 'Mental Wellness',
    description: 'Take 10 minutes daily for meditation or deep breathing.',
    icon: '🧘',
    gradient: ['#fd79a8', '#e84393'],
    category: 'Mental Health',
  },
];

const HealthTips = ({ tips = DEFAULT_TIPS, onTipPress }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Tips</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.md}
      >
        {tips.map((tip) => (
          <TouchableOpacity
            key={tip.id}
            activeOpacity={0.9}
            onPress={() => onTipPress?.(tip)}
          >
            <LinearGradient
              colors={tip.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{tip.icon}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, { color: colors.textInverse }]}>{tip.category}</Text>
                </View>
              </View>

              <Text style={[styles.title, { color: colors.textInverse }]}>{tip.title}</Text>
              <Text style={styles.description}>{tip.description}</Text>

              <View style={styles.readMore}>
                <Text style={[styles.readMoreText, { color: colors.textInverse }]}>Learn more →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    ...typography.headlineSmall,
  },
  seeAll: {
    ...typography.labelMedium,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
  title: {
    ...typography.headlineSmall,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  readMore: {
    marginTop: spacing.md,
  },
  readMoreText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
});

export default HealthTips;
