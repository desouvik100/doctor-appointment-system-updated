/**
 * Home Screen - Modern Dashboard
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const upcomingAppointment = {
    doctor: 'Dr. Sarah Wilson',
    specialty: 'Cardiologist',
    date: 'Today',
    time: '2:30 PM',
    type: 'Video Consultation',
  };

  const quickActions = [
    { id: 'book', icon: '📅', label: 'Book\nAppointment', color: colors.primary, screen: 'Booking' },
    { id: 'video', icon: '📹', label: 'Video\nConsult', color: colors.secondary, screen: 'VideoConsult' },
    { id: 'lab', icon: '🧪', label: 'Lab Tests', color: colors.warning, screen: 'LabTests' },
  ];

  const moreServices = [
    { id: 'meds', icon: '💊', label: 'Medicine', color: colors.info, screen: 'Medicine' },
    { id: 'records', icon: '📋', label: 'Records', color: colors.accent, screen: 'Records' },
    { id: 'emergency', icon: '🚑', label: 'Emergency', color: colors.error, screen: 'Emergency' },
  ];

  const healthMetrics = [
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: '❤️', trend: 'stable' },
    { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: '🩺', trend: 'good' },
    { label: 'Sleep', value: '7.5', unit: 'hrs', icon: '😴', trend: 'up' },
    { label: 'Steps', value: '8,432', unit: 'steps', icon: '👟', trend: 'up' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.userName}>Alex Johnson</Text>
          </View>
          <TouchableOpacity>
            <Avatar name="Alex Johnson" size="large" showBorder />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search doctors, symptoms...</Text>
        </TouchableOpacity>

        {/* Upcoming Appointment Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.appointmentCard, shadows.glow]}
          >
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentInfo}>
                <Avatar name={upcomingAppointment.doctor} size="large" />
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{upcomingAppointment.doctor}</Text>
                  <Text style={styles.specialty}>{upcomingAppointment.specialty}</Text>
                </View>
              </View>
              <View style={styles.appointmentBadge}>
                <Text style={styles.badgeText}>📹 Video</Text>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>{upcomingAppointment.date}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>⏰</Text>
                <Text style={styles.detailText}>{upcomingAppointment.time}</Text>
              </View>
            </View>

            <View style={styles.appointmentActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                <Text style={styles.actionBtnTextPrimary}>Join Call</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.quickAction}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Text style={styles.quickActionEmoji}>{action.icon}</Text>
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.quickActions}>
            {moreServices.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.quickAction}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Text style={styles.quickActionEmoji}>{action.icon}</Text>
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Overview</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            {healthMetrics.map((metric, index) => (
              <Card key={index} variant="gradient" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <View style={[
                    styles.trendBadge,
                    metric.trend === 'up' && styles.trendUp,
                    metric.trend === 'down' && styles.trendDown,
                  ]}>
                    <Text style={styles.trendText}>
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricUnit}>{metric.unit}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <Card variant="default">
            {[
              { icon: '💊', title: 'Medication Reminder', desc: 'Metformin 500mg taken', time: '2h ago' },
              { icon: '📋', title: 'Lab Results Ready', desc: 'Blood work results available', time: '5h ago' },
              { icon: '✅', title: 'Appointment Completed', desc: 'Dr. Michael Chen - General', time: 'Yesterday' },
            ].map((item, index) => (
              <TouchableOpacity key={index} style={[
                styles.activityItem,
                index < 2 && styles.activityItemBorder,
              ]}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityDesc}>{item.desc}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerLeft: {},
  greeting: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchPlaceholder: {
    ...typography.bodyLarge,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  appointmentCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    marginLeft: spacing.md,
  },
  doctorName: {
    ...typography.headlineSmall,
    color: colors.textInverse,
  },
  specialty: {
    ...typography.bodyMedium,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2,
  },
  appointmentBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.textInverse,
  },
  appointmentDetails: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  detailText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnPrimary: {
    backgroundColor: colors.textInverse,
  },
  actionBtnText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  actionBtnTextPrimary: {
    ...typography.buttonSmall,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  quickAction: {
    alignItems: 'center',
    width: (width - spacing.xl * 2 - spacing.lg * 2) / 3,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    padding: spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricIcon: {
    fontSize: 20,
  },
  trendBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricValue: {
    ...typography.displaySmall,
    color: colors.textPrimary,
  },
  metricUnit: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginTop: -4,
  },
  metricLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  activityDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
});

export default HomeScreen;
