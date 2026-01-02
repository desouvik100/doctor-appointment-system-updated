/**
 * PaymentScreen - Payment integration with Razorpay
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const PaymentScreen = ({ navigation, route }) => {
  const { doctor, date, time, consultationType, patient } = route.params || {};
  const [selectedPayment, setSelectedPayment] = useState('wallet');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  const consultationFee = doctor?.fee || 500;
  const platformFee = 20;
  const discount = appliedCoupon ? Math.round(consultationFee * 0.1) : 0;
  const totalAmount = consultationFee + platformFee - discount;

  const paymentMethods = [
    { id: 'wallet', name: 'Health Wallet', icon: '💳', balance: 2500 },
    { id: 'upi', name: 'UPI', icon: '📱', subtitle: 'GPay, PhonePe, Paytm' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', subtitle: 'Visa, Mastercard' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', subtitle: 'All major banks' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'HEALTH10') {
      setAppliedCoupon({ code: 'HEALTH10', discount: 10 });
      Alert.alert('Success', '10% discount applied!');
    } else {
      Alert.alert('Invalid Coupon', 'Please enter a valid coupon code');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, integrate Razorpay here:
      // const options = {
      //   description: `Consultation with ${doctor.name}`,
      //   currency: 'INR',
      //   key: 'YOUR_RAZORPAY_KEY',
      //   amount: totalAmount * 100,
      //   name: 'HealthSync',
      //   prefill: { email: user.email, contact: user.phone, name: user.name },
      // };
      // const data = await RazorpayCheckout.open(options);
      
      // Navigate to confirmation on success
      navigation.replace('BookingConfirmation', {
        booking: {
          id: 'BK' + Date.now(),
          doctor,
          date,
          time,
          consultationType,
          patient,
          amount: totalAmount,
          paymentMethod: selectedPayment,
        },
      });
    } catch (error) {
      Alert.alert('Payment Failed', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Booking Summary */}
        <Card variant="gradient" style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doctor</Text>
            <Text style={styles.summaryValue}>{doctor?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>{formatDate(date)}, {time}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type</Text>
            <Text style={styles.summaryValue}>
              {consultationType === 'video' ? '📹 Video Call' : '🏥 Clinic Visit'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Patient</Text>
            <Text style={styles.summaryValue}>{patient?.name}</Text>
          </View>
        </Card>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentOption, selectedPayment === method.id && styles.paymentOptionActive]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <View>
                  <Text style={styles.paymentName}>{method.name}</Text>
                  {method.subtitle && <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>}
                  {method.balance && (
                    <Text style={styles.walletBalance}>Balance: ₹{method.balance}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.radioOuter, selectedPayment === method.id && styles.radioOuterActive]}>
                {selectedPayment === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          <View style={styles.couponRow}>
            <View style={styles.couponInput}>
              <Text style={styles.couponIcon}>🏷️</Text>
              <Text style={styles.couponPlaceholder}>
                {appliedCoupon ? appliedCoupon.code : 'Enter coupon code'}
              </Text>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
              <Text style={styles.applyBtnText}>{appliedCoupon ? 'Remove' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Breakdown */}
        <Card variant="default" style={styles.priceCard}>
          <Text style={styles.priceTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Consultation Fee</Text>
            <Text style={styles.priceValue}>₹{consultationFee}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Fee</Text>
            <Text style={styles.priceValue}>₹{platformFee}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.discountLabel}>Discount</Text>
              <Text style={styles.discountValue}>-₹{discount}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalAmount}>₹{totalAmount}</Text>
        </View>
        <Button
          title={loading ? 'Processing...' : `Pay ₹${totalAmount}`}
          onPress={handlePayment}
          fullWidth
          size="large"
          disabled={loading}
        />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 160 },
  summaryCard: { padding: spacing.lg, marginBottom: spacing.xl },
  summaryTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  summaryValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  paymentOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: { fontSize: 24, marginRight: spacing.md },
  paymentName: { ...typography.bodyLarge, color: colors.textPrimary },
  paymentSubtitle: { ...typography.labelSmall, color: colors.textMuted },
  walletBalance: { ...typography.labelSmall, color: colors.success },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  couponRow: { flexDirection: 'row', gap: spacing.md },
  couponInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  couponIcon: { fontSize: 18, marginRight: spacing.sm },
  couponPlaceholder: { ...typography.bodyMedium, color: colors.textMuted },
  applyBtn: {
    backgroundColor: colors.primaryLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, justifyContent: 'center',
  },
  applyBtnText: { ...typography.labelMedium, color: colors.primary },
  priceCard: { padding: spacing.lg },
  priceTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  priceLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  priceValue: { ...typography.bodyMedium, color: colors.textPrimary },
  discountLabel: { ...typography.bodyMedium, color: colors.success },
  discountValue: { ...typography.bodyMedium, color: colors.success },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  totalLabel: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  totalValue: { ...typography.headlineSmall, color: colors.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl,
    borderTopWidth: 1, borderTopColor: colors.surfaceBorder, ...shadows.large,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  totalText: { ...typography.bodyLarge, color: colors.textSecondary },
  totalAmount: { ...typography.headlineMedium, color: colors.textPrimary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.md },
});

export default PaymentScreen;
