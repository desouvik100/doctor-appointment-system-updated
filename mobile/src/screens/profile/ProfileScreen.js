/**
 * Profile Screen - User Settings & Info
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';

const ProfileScreen = ({ navigation }) => {
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    bloodType: 'O+',
    memberSince: 'Jan 2024',
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { id: 'personal', icon: '👤', label: 'Personal Information', arrow: true },
        { id: 'medical', icon: '📋', label: 'Medical History', arrow: true },
        { id: 'insurance', icon: '🛡️', label: 'Insurance Details', arrow: true },
        { id: 'family', icon: '👨‍👩‍👧', label: 'Family Members', arrow: true },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'notifications', icon: '🔔', label: 'Notifications', toggle: true, value: true },
        { id: 'darkMode', icon: '🌙', label: 'Dark Mode', toggle: true, value: true },
        { id: 'language', icon: '🌐', label: 'Language', value: 'English', arrow: true },
        { id: 'units', icon: '📏', label: 'Units', value: 'Metric', arrow: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: '❓', label: 'Help Center', arrow: true },
        { id: 'feedback', icon: '💬', label: 'Send Feedback', arrow: true },
        { id: 'privacy', icon: '🔒', label: 'Privacy Policy', arrow: true },
        { id: 'terms', icon: '📄', label: 'Terms of Service', arrow: true },
      ],
    },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>{item.icon}</Text>
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.value && !item.toggle && (
          <Text style={styles.menuValue}>{item.value}</Text>
        )}
        {item.toggle && (
          <Switch
            value={item.value}
            onValueChange={() => {}}
            trackColor={{ false: colors.surfaceLight, true: colors.primaryLight }}
            thumbColor={item.value ? colors.primary : colors.textMuted}
          />
        )}
        {item.arrow && (
          <Text style={styles.menuArrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={colors.gradientCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileTop}>
            <Avatar name={user.name} size="xlarge" showBorder />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Text style={styles.editAvatarIcon}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.profileStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user.bloodType}</Text>
              <Text style={styles.statLabel}>Blood Type</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user.memberSince}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.quickActionIcon}
            >
              <Text style={styles.quickActionEmoji}>📊</Text>
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Health{'\n'}Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <LinearGradient
              colors={colors.gradientSecondary}
              style={styles.quickActionIcon}
            >
              <Text style={styles.quickActionEmoji}>💳</Text>
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Payment{'\n'}Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <LinearGradient
              colors={colors.gradientAccent}
              style={styles.quickActionIcon}
            >
              <Text style={styles.quickActionEmoji}>🎁</Text>
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Rewards{'\n'}& Offers</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, index) => (
          <View key={index} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card variant="default" padding="none">
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>HealthSync v1.0.0</Text>
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
    paddingBottom: 100,
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
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  settingsIcon: {
    fontSize: 20,
  },
  profileCard: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xxl,
  },
  profileTop: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.backgroundCard,
  },
  editAvatarIcon: {
    fontSize: 14,
  },
  userName: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },
  editProfileBtn: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editProfileText: {
    ...typography.buttonSmall,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.labelMedium,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuLabel: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 60,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
  },
  version: {
    ...typography.labelSmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default ProfileScreen;
