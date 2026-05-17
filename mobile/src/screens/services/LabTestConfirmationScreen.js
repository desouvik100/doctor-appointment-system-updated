/**
 * Lab Test Booking Confirmation Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';

const LabTestConfirmationScreen = ({ navigation, route }) => {
  const { cart = [], total = 0, paymentMethod = 'razorpay' } = route.params || {};
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const bookingId = `LT-${Date.now().toString().slice(-8)}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <LinearGradient colors={['#10B981', '#059669']} style={styles.topBanner}>
        <Text style={styles.checkIcon}>✅</Text>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSub}>Your home collection has been scheduled</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Booking ID</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>{bookingId}</Text>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tests Booked</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>{cart.length}</Text>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount Paid</Text>
            <Text style={[styles.value, { color: colors.primary, fontWeight: '700' }]}>
              {paymentMethod === 'cod' ? 'Pay at collection' : `₹${total}`}
            </Text>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Collection</Text>
            <Text style={[styles.value, { color: colors.success }]}>Free Home Pickup</Text>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}30` }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            📞 Our team will call you within 2 hours to confirm the pickup time. Reports will be available within 24 hours.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={colors.gradientPrimary} style={styles.homeBtnGradient}>
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewBtn, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('Records')}
          activeOpacity={0.85}
        >
          <Text style={[styles.viewBtnText, { color: colors.primary }]}>View My Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBanner: { paddingTop: 80, paddingBottom: spacing.xxl, alignItems: 'center' },
  checkIcon: { fontSize: 64, marginBottom: spacing.md },
  successTitle: { ...typography.headlineLarge, color: '#fff', fontWeight: '700' },
  successSub: { ...typography.bodyLarge, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.xl },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  label: { ...typography.bodyMedium },
  value: { ...typography.bodyMedium, fontWeight: '600' },
  infoBox: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.xl },
  infoText: { ...typography.bodyMedium, lineHeight: 22 },
  homeBtn: { borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  homeBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  homeBtnText: { ...typography.button, color: '#fff', fontWeight: '700' },
  viewBtn: { borderRadius: borderRadius.lg, borderWidth: 2, paddingVertical: spacing.md, alignItems: 'center' },
  viewBtnText: { ...typography.button, fontWeight: '600' },
});

export default LabTestConfirmationScreen;
