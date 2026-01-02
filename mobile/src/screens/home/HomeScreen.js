/**
 * Home Screen - Modern Dashboard with Pull-to-Refresh
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  QuickActions, 
  UpcomingAppointments, 
  WalletSummary, 
  HealthTips 
} from './components';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    appointments: [
      {
        id: '1',
        doctorName: 'Dr. Sarah Wilson',
        specialty: 'Cardiologist',
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        type: 'video',
      },
      {
        id: '2',
        doctorName: 'Dr. Michael Chen',
        specialty: 'General Physician',
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: 'in-person',
      },
    ],
    walletBalance: 2500.00,
    loyaltyPoints: 1250,
    healthMetrics: [
      { label: 'Heart Rate', value: '72', unit: 'bpm', icon: '❤️', trend: 'stable' },
      { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: '🩺', trend: 'good' },
      { label: 'Sleep', value: '7.5', unit: 'hrs', icon: '😴', trend: 'up' },
      { label: 'Steps', value: '8,432', unit: 'steps', icon: '👟', trend: 'up' },
    ],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJoinCall = (appointment) => {
    navigation.navigate('VideoConsult', { appointmentId: appointment.id });
  };

  const handleReschedule = (appointment) => {
    navigation.navigate('Reschedule', { appointment });
  };

  const handleAddMoney = () => {
    navigation.navigate('Wallet', { action: 'addMoney' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👋</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'User'} size="large" showBorder />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => navigation.navigate('DoctorSearch')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search doctors, symptoms...</Text>
        </TouchableOpacity>

        {/* Upcoming Appointments */}
        <UpcomingAppointments
          appointments={dashboardData.appointments}
          navigation={navigation}
          onJoinCall={handleJoinCall}
          onReschedule={handleReschedule}
        />

        {/* Quick Actions */}
        <QuickActions navigation={navigation} />

        {/* Wallet Summary */}
        <WalletSummary
          balance={dashboardData.walletBalance}
          loyaltyPoints={dashboardData.loyaltyPoints}
          navigation={navigation}
          onAddMoney={handleAddMoney}
        />

        {/* Health Tips - Full width, no padding */}
        <View style={styles.healthTipsWrapper}>
          <HealthTips />
        </View>

        {/* Health Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Records')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            {dashboardData.healthMetrics.map((metric, index) => (
              <Card key={index} variant="gradient" style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <View style={[
                    styles.trendBadge,
                    { backgroundColor: colors.surfaceLight },
                    metric.trend === 'up' && styles.trendUp,
                    metric.trend === 'down' && styles.trendDown,
                  ]}>
                    <Text style={[styles.trendText, { color: colors.textSecondary }]}>
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{metric.value}</Text>
                <Text style={[styles.metricUnit, { color: colors.textMuted }]}>{metric.unit}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>

          <Card variant="default" style={{ backgroundColor: colors.surface }}>
            {[
              { icon: '💊', title: 'Medication Reminder', desc: 'Metformin 500mg taken', time: '2h ago' },
              { icon: '📋', title: 'Lab Results Ready', desc: 'Blood work results available', time: '5h ago' },
              { icon: '✅', title: 'Appointment Completed', desc: 'Dr. Michael Chen - General', time: 'Yesterday' },
            ].map((item, index) => (
              <TouchableOpacity key={index} style={[
                styles.activityItem,
                index < 2 && [styles.activityItemBorder, { borderBottomColor: colors.divider }],
              ]}>
                <View style={[styles.activityIcon, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={styles.activityEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
                <Text style={[styles.activityTime, { color: colors.textMuted }]}>{item.time}</Text>
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
  },
  userName: {
    ...typography.headlineLarge,
    marginTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.xxl,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchPlaceholder: {
    ...typography.bodyLarge,
  },
  healthTipsWrapper: {
    marginHorizontal: -spacing.xl,
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
  },
  seeAll: {
    ...typography.labelMedium,
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
  },
  metricValue: {
    ...typography.displaySmall,
  },
  metricUnit: {
    ...typography.labelSmall,
    marginTop: -4,
  },
  metricLabel: {
    ...typography.labelMedium,
    marginTop: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
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
    fontWeight: '500',
  },
  activityDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  activityTime: {
    ...typography.labelSmall,
  },
});

export default HomeScreen;
