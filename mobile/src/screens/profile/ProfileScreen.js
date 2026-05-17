/**
 * ProfileScreen — Personal Health Dashboard
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Switch, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/colors';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import whatsappService from '../../services/whatsappService';
import { getAppointmentStats } from '../../services/api/profileService';
import apiClient from '../../services/api/apiClient';

const MENU_ICONS = {
  personal:      { emoji: '👤', bg: '#E8F5E9' },
  medical:       { emoji: '📋', bg: '#E3F2FD' },
  insurance:     { emoji: '🛡️', bg: '#F3E5F5' },
  family:        { emoji: '👨‍👩‍👧', bg: '#FFF3E0' },
  prescriptions: { emoji: '💊', bg: '#FCE4EC' },
  reports:       { emoji: '🧪', bg: '#E0F7FA' },
  wallet:        { emoji: '💰', bg: '#EDE7F6' },
  transactions:  { emoji: '🧾', bg: '#FFF8E1' },
  notifications: { emoji: '🔔', bg: '#FFF3E0' },
  darkMode:      { emoji: '🌙', bg: '#EDE7F6' },
  whatsapp:      { emoji: '💬', bg: '#E8F5E9' },
  feedback:      { emoji: '📝', bg: '#E3F2FD' },
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout, loading } = useUser();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [appointmentCount, setAppointmentCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    getAppointmentStats(user.id).then(s => setAppointmentCount(s.total || 0)).catch(() => {});
    apiClient.get('/wallet/balance').then(r => setWalletBalance(r.data?.balance || 0)).catch(() => {});
    apiClient.get('/appointments/my', { params: { status: 'upcoming', limit: 1 } }).then(r => {
      const list = r.data?.data || r.data?.appointments || r.data || [];
      if (list.length > 0) setNextAppointment(list[0]);
    }).catch(() => {});
  }, [user]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }); },
      },
    ]);
  }, [logout, navigation]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const memberYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : (user?.memberSince || '2025');

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.noUserText, { color: colors.textPrimary }]}>Please login to view profile</Text>
        <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleItemPress = (item) => {
    if (item.isWhatsApp) { whatsappService.contactSupport('Hi! I need help with HealthSync app.'); }
    else if (item.isFeedback) { whatsappService.sendFeedback(5, 'Great app!'); }
    else if (item.route) { navigation.navigate(item.route); }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { id: 'personal',  label: 'Personal Information', desc: 'Update your details',          arrow: true, route: 'EditProfile' },
        { id: 'medical',   label: 'Medical History',      desc: 'Past conditions & reports',    arrow: true, route: 'MedicalTimeline' },
        { id: 'insurance', label: 'Insurance Details',    desc: 'Manage your coverage',         arrow: true, route: 'Insurance' },
        { id: 'family',    label: 'Family Members',       desc: 'Book for loved ones',          arrow: true, route: 'FamilyMembers' },
      ],
    },
    {
      title: 'Health Records',
      items: [
        { id: 'prescriptions', label: 'Prescriptions',       desc: 'View all prescriptions',                                   arrow: true, route: 'Prescriptions' },
        { id: 'reports',       label: 'Lab Reports',         desc: 'Test results & uploads',                                   arrow: true, route: 'HealthReports' },
        { id: 'wallet',        label: 'Health Wallet',       desc: `Balance \u20B9${walletBalance.toLocaleString('en-IN')}`,   arrow: true, route: 'Wallet' },
        { id: 'transactions',  label: 'Transaction History', desc: 'Past payments & receipts',                                 arrow: true, route: 'TransactionHistory' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'notifications', label: 'Notification Settings', desc: 'Reminders & alerts',    arrow: true, route: 'NotificationSettings' },
        { id: 'darkMode',      label: 'Dark Mode',             desc: 'Switch to dark theme',  toggle: true, value: isDarkMode, onToggle: toggleTheme },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'whatsapp', label: 'Chat with Us',   desc: 'Reply within 5 mins \u00B7 24/7', arrow: true, isWhatsApp: true },
        { id: 'feedback', label: 'Send Feedback',  desc: 'Help us improve',                 arrow: true, isFeedback: true },
      ],
    },
  ];

  const renderMenuItem = (item) => {
    const ic = MENU_ICONS[item.id] || { emoji: '•', bg: '#F0F4F8' };
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => handleItemPress(item)}
        disabled={item.toggle}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconBox, { backgroundColor: ic.bg }]}>
          <Text style={styles.menuIconText}>{ic.emoji}</Text>
        </View>
        <View style={styles.menuItemCenter}>
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
          {item.desc ? <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{item.desc}</Text> : null}
        </View>
        <View style={styles.menuItemRight}>
          {item.toggle ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle || (() => {})}
              trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
              thumbColor={item.value ? '#2E7D32' : '#9CA3AF'}
            />
          ) : (
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>{'›'}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F0F4F8' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>

        {/* ── Hero Gradient Header ── */}
        <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.heroGradient}>
          <View style={styles.heroTopBar}>
            <Text style={styles.heroScreenTitle}>My Health Space</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Notifications')}>
                <Text style={styles.heroIconEmoji}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('NotificationSettings')}>
                <Text style={styles.heroIconEmoji}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile row */}
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Avatar
                name={user.name}
                size="xlarge"
                showBorder
                source={user.profilePhoto ? { uri: user.profilePhoto } : null}
              />
              <TouchableOpacity style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.editAvatarEmoji}>✏️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.heroName}>{user.name}</Text>
              <Text style={styles.heroEmail}>{user.email}</Text>
              <Text style={styles.verifiedBadge}>✔ Verified Account</Text>
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
              <Text style={styles.statIcon}>🩸</Text>
              <Text style={styles.statValue}>{user.bloodType || 'Add'}</Text>
              <Text style={styles.statLabel}>Blood Type</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Appointments')} activeOpacity={0.8}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>{appointmentCount}</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🗓</Text>
              <Text style={styles.statValue}>{memberYear}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Upcoming Appointment Banner ── */}
        {nextAppointment ? (
          <TouchableOpacity style={styles.nextApptCard} onPress={() => navigation.navigate('Appointments')} activeOpacity={0.85}>
            <LinearGradient colors={['#E8F5E9', '#F1F8E9']} style={styles.nextApptInner}>
              <View style={styles.nextApptLeft}>
                <Text style={styles.nextApptIcon}>📆</Text>
                <View>
                  <Text style={styles.nextApptTitle}>Upcoming Appointment</Text>
                  <Text style={styles.nextApptSub}>
                    {nextAppointment.doctor?.name ? `Dr. ${nextAppointment.doctor.name}` : 'Doctor'}
                    {' \u00B7 '}
                    {formatDate(nextAppointment.date || nextAppointment.appointmentDate)}
                  </Text>
                </View>
              </View>
              <Text style={styles.nextApptArrow}>{'›'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* ── Quick Actions ── */}
        <View style={styles.quickActionsRow}>
          {[
            { emoji: '📊', label: 'Health\nReports',   colors: ['#1B5E20', '#2E7D32'], route: 'HealthReports' },
            { emoji: '💊', label: 'Prescrip-\ntions',  colors: ['#1565C0', '#1976D2'], route: 'Prescriptions' },
            { emoji: '💰', label: 'Wallet',             colors: ['#6A1B9A', '#8E24AA'], route: 'Wallet' },
            { emoji: '🎁', label: 'Offers',             colors: ['#E65100', '#F57C00'], route: 'Rewards' },
          ].map((qa) => (
            <TouchableOpacity key={qa.route} style={styles.quickAction} onPress={() => navigation.navigate(qa.route)} activeOpacity={0.8}>
              <LinearGradient colors={qa.colors} style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{qa.emoji}</Text>
              </LinearGradient>
              <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Emergency Info Card ── */}
        <TouchableOpacity style={styles.emergencyCard} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
          <View style={styles.emergencyLeft}>
            <Text style={styles.emergencyEmoji}>🚨</Text>
            <View>
              <Text style={[styles.emergencyTitle, { color: colors.textPrimary }]}>Emergency Info</Text>
              <Text style={[styles.emergencySub, { color: colors.textMuted }]}>
                {user.bloodType ? `Blood: ${user.bloodType} \u00B7 Tap to add emergency contact` : 'Add blood group & emergency contact'}
              </Text>
            </View>
          </View>
          <Text style={[styles.emergencyArrow, { color: colors.textMuted }]}>{'›'}</Text>
        </TouchableOpacity>

        {/* ── Menu Sections ── */}
        {menuSections.map((section, idx) => (
          <View key={idx} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface || '#fff' }]}>
              {section.items.map((item, i) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {i < section.items.length - 1 ? (
                    <View style={[styles.menuDivider, { backgroundColor: colors.divider || '#F0F0F0' }]} />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>HealthSync v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noUserText: { ...typography.bodyLarge, marginBottom: spacing.lg },
  loginBtn: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  loginBtnText: { color: '#fff', fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },

  // Hero
  heroGradient: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  heroTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.xl },
  heroScreenTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  heroActions: { flexDirection: 'row', gap: spacing.sm },
  heroIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroIconEmoji: { fontSize: 18 },

  profileRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl, gap: spacing.lg },
  avatarWrapper: { position: 'relative' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: -4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...shadows.small,
  },
  editAvatarEmoji: { fontSize: 12 },
  profileMeta: { flex: 1, paddingTop: 4 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  verifiedBadge: { fontSize: 11, color: '#A5D6A7', fontWeight: '600', marginBottom: 10 },
  editProfileBtn: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  editProfileText: { fontSize: 13, color: '#fff', fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.xl, padding: spacing.md,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Next appointment
  nextApptCard: { marginHorizontal: spacing.xl, marginTop: spacing.lg, borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.small },
  nextApptInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  nextApptLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nextApptIcon: { fontSize: 24 },
  nextApptTitle: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
  nextApptSub: { fontSize: 12, color: '#388E3C', marginTop: 2 },
  nextApptArrow: { fontSize: 22, color: '#2E7D32', fontWeight: '300' },

  // Quick actions
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.lg },
  quickAction: { alignItems: 'center' },
  quickActionIcon: { width: 58, height: 58, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, ...shadows.small },
  quickActionEmoji: { fontSize: 26 },
  quickActionLabel: { fontSize: 11, textAlign: 'center', lineHeight: 15 },

  // Emergency
  emergencyCard: {
    marginHorizontal: spacing.xl, marginBottom: spacing.lg,
    backgroundColor: '#FFF8E1', borderRadius: borderRadius.xl,
    padding: spacing.lg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: '#FFE082', ...shadows.small,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  emergencyEmoji: { fontSize: 24 },
  emergencyTitle: { fontSize: 14, fontWeight: '700' },
  emergencySub: { fontSize: 12, marginTop: 2 },
  emergencyArrow: { fontSize: 22, fontWeight: '300' },

  // Menu
  menuSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm, marginLeft: 4 },
  menuCard: { borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.small },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.lg },
  menuIconBox: { width: 38, height: 38, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  menuIconText: { fontSize: 18 },
  menuItemCenter: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDesc: { fontSize: 12, marginTop: 1 },
  menuItemRight: { marginLeft: spacing.sm },
  menuArrow: { fontSize: 22, fontWeight: '300' },
  menuDivider: { height: 1, marginLeft: 64 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.xxl, marginTop: spacing.sm,
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutIcon: { fontSize: 16, marginRight: spacing.sm },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { fontSize: 12, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
});

export default ProfileScreen;
