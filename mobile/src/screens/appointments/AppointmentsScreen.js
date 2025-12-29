/**
 * Appointments Screen - Book & Manage
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';

const AppointmentsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const appointments = [
    {
      id: '1',
      doctor: 'Dr. Sarah Wilson',
      specialty: 'Cardiologist',
      date: 'Dec 28, 2025',
      time: '2:30 PM',
      type: 'video',
      status: 'confirmed',
      avatar: null,
    },
    {
      id: '2',
      doctor: 'Dr. Michael Chen',
      specialty: 'General Physician',
      date: 'Dec 30, 2025',
      time: '10:00 AM',
      type: 'clinic',
      status: 'pending',
      avatar: null,
    },
    {
      id: '3',
      doctor: 'Dr. Emily Parker',
      specialty: 'Dermatologist',
      date: 'Jan 2, 2026',
      time: '4:00 PM',
      type: 'video',
      status: 'confirmed',
      avatar: null,
    },
  ];

  const renderAppointmentCard = ({ item }) => (
    <Card variant="gradient" style={styles.appointmentCard} onPress={() => {}}>
      <View style={styles.cardHeader}>
        <View style={styles.doctorRow}>
          <Avatar name={item.doctor} size="large" />
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{item.doctor}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'confirmed' && styles.statusConfirmed,
          item.status === 'pending' && styles.statusPending,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'confirmed' && styles.statusTextConfirmed,
            item.status === 'pending' && styles.statusTextPending,
          ]}>
            {item.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeIcon}>{item.type === 'video' ? '📹' : '🏥'}</Text>
          <Text style={styles.typeText}>
            {item.type === 'video' ? 'Video Call' : 'Clinic Visit'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Reschedule</Text>
        </TouchableOpacity>
        {item.type === 'video' && item.status === 'confirmed' && (
          <TouchableOpacity style={styles.primaryBtn}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Join Call</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {item.type === 'clinic' && (
          <TouchableOpacity style={styles.primaryBtn}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Get Directions</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Booking')}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.addBtnGradient}
          >
            <Text style={styles.addBtnIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && (
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabIndicator}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointments List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptyDesc}>
              You don't have any {activeTab} appointments
            </Text>
          </View>
        }
      />

      {/* Floating Book Button */}
      <TouchableOpacity 
        style={styles.floatingBtn}
        onPress={() => navigation.navigate('Booking')}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.floatingBtnGradient}
        >
          <Text style={styles.floatingBtnIcon}>📅</Text>
          <Text style={styles.floatingBtnText}>Book Appointment</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.displaySmall,
    color: colors.textPrimary,
  },
  addBtn: {
    ...shadows.small,
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    fontSize: 24,
    color: colors.textInverse,
    fontWeight: '300',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    marginRight: spacing.xxl,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    ...typography.bodyLarge,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  appointmentCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  doctorName: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  statusTextConfirmed: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.warning,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  detailText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  typeText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryBtnText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  floatingBtn: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    ...shadows.large,
  },
  floatingBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  floatingBtnIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  floatingBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});

export default AppointmentsScreen;
