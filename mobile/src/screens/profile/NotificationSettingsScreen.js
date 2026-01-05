/**
 * NotificationSettingsScreen - Manage notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import NotificationService from '../../services/notifications/NotificationService';

const NotificationSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    appointments: true,
    reminders: true,
    promotions: false,
    healthTips: true,
    labResults: true,
    prescriptions: true,
    sound: true,
    vibration: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await NotificationService.getNotificationSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await NotificationService.updateNotificationSettings(newSettings);
  };

  const notificationTypes = [
    { key: 'appointments', label: 'Appointment Updates', desc: 'Booking confirmations, reminders, and changes', icon: '📅' },
    { key: 'reminders', label: 'Medicine Reminders', desc: 'Daily medication reminders', icon: '💊' },
    { key: 'labResults', label: 'Lab Results', desc: 'When your test results are ready', icon: '🔬' },
    { key: 'prescriptions', label: 'Prescriptions', desc: 'New prescriptions and refill reminders', icon: '📋' },
    { key: 'healthTips', label: 'Health Tips', desc: 'Personalized health recommendations', icon: '💡' },
    { key: 'promotions', label: 'Offers & Promotions', desc: 'Discounts and special offers', icon: '🎁' },
  ];

  const soundSettings = [
    { key: 'sound', label: 'Notification Sound', desc: 'Play sound for notifications', icon: '🔔' },
    { key: 'vibration', label: 'Vibration', desc: 'Vibrate for notifications', icon: '📳' },
  ];

  const renderSettingItem = (item) => (
    <View key={item.key} style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Text style={styles.settingDesc}>{item.desc}</Text>
        </View>
      </View>
      <Switch
        value={settings[item.key]}
        onValueChange={() => handleToggle(item.key)}
        trackColor={{ false: colors.surfaceLight, true: colors.primaryLight }}
        thumbColor={settings[item.key] ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Card variant="default" style={styles.settingsCard}>
            {notificationTypes.map((item, index) => (
              <View key={item.key}>
                {renderSettingItem(item)}
                {index < notificationTypes.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          <Card variant="default" style={styles.settingsCard}>
            {soundSettings.map((item, index) => (
              <View key={item.key}>
                {renderSettingItem(item)}
                {index < soundSettings.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Test Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => {
              NotificationService.showLocalNotification(
                '🔔 Test Notification',
                'This is a test push notification from HealthSync!',
                { type: 'test' }
              );
            }}
          >
            <Text style={styles.testButtonIcon}>🧪</Text>
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            You can also manage notifications in your device settings. Some critical notifications like appointment reminders cannot be disabled.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  placeholder: { width: 44 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  settingsCard: { padding: 0 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: { fontSize: 24, marginRight: spacing.md },
  settingInfo: { flex: 1 },
  settingLabel: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500' },
  settingDesc: { ...typography.labelSmall, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.lg },
  testButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
  },
  testButtonIcon: { fontSize: 20, marginRight: spacing.sm },
  testButtonText: { ...typography.bodyMedium, color: '#fff', fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.lg,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  infoIcon: { fontSize: 18, marginRight: spacing.md },
  infoText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});

export default NotificationSettingsScreen;
