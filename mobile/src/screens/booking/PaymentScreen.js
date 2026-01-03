/**
 * PaymentScreen - Payment integration with booking confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiClient from '../../services/api/apiClient';
import { useUser } from '../../context/UserContext';

const PaymentScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { 
    doctor, 
    date, 
    time, 
    queueNumber,
    consultationType, 
    patient,
    appointmentId,
    reason,
  } = route.params || {};
  
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  // Fee calculations
  const consultationFee = doctor?.fee || doctor?.consultationFee || 500;
  const platformFee = Math.round(consultationFee * 0.05); // 5% platform fee
  const subtotal = consultationFee + platformFee;
  const discount = couponDiscount;
  const totalAmount = Math.max(0, subtotal - couponDiscount);

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: '📱', subtitle: 'GPay, PhonePe, Paytm' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', subtitle: 'Visa, Mastercard' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', subtitle: 'All major banks' },
    { id: 'wallet', name: 'Health Wallet', icon: '💰', balance: 0 },
  ];

  useEffect(() => {
    // Fetch payment config
    const fetchPaymentConfig = async () => {
      try {
        const response = await apiClient.get('/payments/config');
        setPaymentConfig(response.data);
      } catch (error) {
        console.log('Payment config fetch error:', error.message);
      }
    };
    fetchPaymentConfig();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError('');
    
    try {
      const response = await apiClient.post('/coupons/validate', {
        code: couponCode.trim(),
        amount: subtotal
      });
      
      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        setCouponDiscount(response.data.discount);
        Alert.alert('Success', `Coupon applied! You save ₹${response.data.discount}`);
      }
    } catch (error) {
      setCouponError(error.message || 'Invalid coupon code');
      Alert.alert('Error', error.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handleApplyCoupon = () => {
    if (appliedCoupon) {
      removeCoupon();
    } else {
      validateCoupon();
    }
  };

  const handlePayment = async () => {
    // Validate required data
    if (!appointmentId) {
      Alert.alert('Error', 'Appointment information missing. Please try booking again.');
      return;
    }

    const userId = user?.id || user?._id || user?.userId;
    if (!userId) {
      Alert.alert('Error', 'User session invalid. Please login again.');
      return;
    }

    setLoading(true);
    
    try {
      // Create payment order
      const orderResponse = await apiClient.post('/payments/create-order', {
        amount: totalAmount,
        appointmentId,
        userId,
        paymentMethod: selectedPayment,
        couponCode: appliedCoupon?.code,
      });

      if (orderResponse.data.success) {
        // Check if test mode (Razorpay disabled)
        if (orderResponse.data.testMode) {
          Alert.alert('Success', 'Appointment confirmed!', [
            { text: 'OK', onPress: () => navigation.navigate('BookingConfirmation', {
              booking: {
                id: appointmentId,
                doctor,
                date,
                time,
                queueNumber,
                consultationType,
                patient,
                amount: totalAmount,
                paymentMethod: selectedPayment,
              }
            })}
          ]);
          return;
        }

        // For wallet payment, process directly
        if (selectedPayment === 'wallet') {
          const paymentResponse = await apiClient.post('/payments/process-wallet', {
            orderId: orderResponse.data.orderId,
            appointmentId,
            userId,
          });
          
          if (paymentResponse.data.success) {
            Alert.alert('Success', 'Payment successful!', [
              { text: 'OK', onPress: () => navigation.navigate('BookingConfirmation', {
                booking: {
                  id: appointmentId,
                  doctor,
                  date,
                  time,
                  queueNumber,
                  consultationType,
                  patient,
                  amount: totalAmount,
                  paymentMethod: selectedPayment,
                  paymentId: paymentResponse.data.paymentId,
                }
              })}
            ]);
          }
        } else {
          // For other payment methods, open payment gateway
          // This would integrate with Razorpay or similar
          Alert.alert('Info', 'Redirecting to payment gateway...', [
            { text: 'OK', onPress: () => {
              // Simulate successful payment for demo
              navigation.navigate('BookingConfirmation', {
                booking: {
                  id: appointmentId,
                  doctor,
                  date,
                  time,
                  queueNumber,
                  consultationType,
                  patient,
                  amount: totalAmount,
                  paymentMethod: selectedPayment,
                  paymentId: orderResponse.data.orderId,
                }
              });
            }}
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Payment Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
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
          {queueNumber && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Queue Number</Text>
              <Text style={styles.summaryValue}>#{queueNumber}</Text>
            </View>
          )}
          {reason && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reason</Text>
              <Text style={styles.summaryValue}>{reason}</Text>
            </View>
          )}
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
                  {method.balance !== undefined && (
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
            <View style={styles.couponInputContainer}>
              <Text style={styles.couponIcon}>🏷️</Text>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.textMuted}
                value={couponCode}
                onChangeText={setCouponCode}
                editable={!appliedCoupon}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity 
              style={[styles.applyBtn, couponLoading && styles.applyBtnDisabled]} 
              onPress={handleApplyCoupon}
              disabled={couponLoading}
            >
              {couponLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.applyBtnText}>{appliedCoupon ? 'Remove' : 'Apply'}</Text>
              )}
            </TouchableOpacity>
          </View>
          {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
          {appliedCoupon && (
            <Text style={styles.couponSuccessText}>
              ✓ Coupon "{appliedCoupon.code}" applied - You save ₹{couponDiscount}
            </Text>
          )}
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
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.xxl, 
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44, 
    height: 44, 
    borderRadius: borderRadius.lg, 
    backgroundColor: colors.surface,
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: colors.surfaceBorder,
  },
  backIcon: { 
    fontSize: 20, 
    color: colors.textPrimary 
  },
  headerTitle: { 
    ...typography.headlineMedium, 
    color: colors.textPrimary 
  },
  placeholder: { 
    width: 44 
  },
  scrollContent: { 
    paddingHorizontal: spacing.xl, 
    paddingBottom: 160 
  },
  summaryCard: { 
    padding: spacing.lg, 
    marginBottom: spacing.xl 
  },
  summaryTitle: { 
    ...typography.headlineSmall, 
    color: colors.textPrimary, 
    marginBottom: spacing.md 
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.sm 
  },
  summaryLabel: { 
    ...typography.bodyMedium, 
    color: colors.textSecondary 
  },
  summaryValue: { 
    ...typography.bodyMedium, 
    color: colors.textPrimary, 
    fontWeight: '500' 
  },
  section: { 
    marginBottom: spacing.xl 
  },
  sectionTitle: { 
    ...typography.headlineSmall, 
    color: colors.textPrimary, 
    marginBottom: spacing.md 
  },
  paymentOption: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg,
    marginBottom: spacing.md, 
    borderWidth: 1, 
    borderColor: colors.surfaceBorder,
  },
  paymentOptionActive: { 
    borderColor: colors.primary, 
    backgroundColor: colors.primaryLight 
  },
  paymentLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  paymentIcon: { 
    fontSize: 24, 
    marginRight: spacing.md 
  },
  paymentName: { 
    ...typography.bodyLarge, 
    color: colors.textPrimary 
  },
  paymentSubtitle: { 
    ...typography.labelSmall, 
    color: colors.textMuted 
  },
  walletBalance: { 
    ...typography.labelSmall, 
    color: colors.success 
  },
  radioOuter: {
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 2, 
    borderColor: colors.textMuted,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  radioOuterActive: { 
    borderColor: colors.primary 
  },
  radioInner: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: colors.primary 
  },
  couponRow: { 
    flexDirection: 'row', 
    gap: spacing.md 
  },
  couponInputContainer: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, 
    paddingHorizontal: spacing.md, 
    borderWidth: 1, 
    borderColor: colors.surfaceBorder,
  },
  couponIcon: { 
    fontSize: 18, 
    marginRight: spacing.sm 
  },
  couponInput: { 
    flex: 1,
    ...typography.bodyMedium, 
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  applyBtn: {
    backgroundColor: colors.primaryLight, 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, 
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.6,
  },
  applyBtnText: { 
    ...typography.labelMedium, 
    color: colors.primary 
  },
  couponErrorText: {
    ...typography.labelSmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
  couponSuccessText: {
    ...typography.labelSmall,
    color: colors.success,
    marginTop: spacing.sm,
  },
  priceCard: { 
    padding: spacing.lg 
  },
  priceTitle: { 
    ...typography.headlineSmall, 
    color: colors.textPrimary, 
    marginBottom: spacing.md 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.sm 
  },
  priceLabel: { 
    ...typography.bodyMedium, 
    color: colors.textSecondary 
  },
  priceValue: { 
    ...typography.bodyMedium, 
    color: colors.textPrimary 
  },
  discountLabel: { 
    ...typography.bodyMedium, 
    color: colors.success 
  },
  discountValue: { 
    ...typography.bodyMedium, 
    color: colors.success 
  },
  divider: { 
    height: 1, 
    backgroundColor: colors.divider, 
    marginVertical: spacing.md 
  },
  totalLabel: { 
    ...typography.bodyLarge, 
    color: colors.textPrimary, 
    fontWeight: '600' 
  },
  totalValue: { 
    ...typography.headlineSmall, 
    color: colors.primary 
  },
  bottomBar: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.lg, 
    paddingBottom: spacing.xxl,
    borderTopWidth: 1, 
    borderTopColor: colors.surfaceBorder, 
    ...shadows.large,
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  totalText: { 
    ...typography.bodyLarge, 
    color: colors.textSecondary 
  },
  totalAmount: { 
    ...typography.headlineMedium, 
    color: colors.textPrimary 
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  loadingText: { 
    ...typography.bodyMedium, 
    color: colors.textPrimary, 
    marginTop: spacing.md 
  },
});

export default PaymentScreen;
