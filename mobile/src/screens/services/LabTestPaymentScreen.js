/**
 * Lab Test Payment Screen
 * Handles payment for home collection lab tests.
 * Uses the same Razorpay mobile-checkout flow as appointment payments.
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
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const LabTestPaymentScreen = ({ navigation, route }) => {
  const { cart = [], total = 0 } = route.params || {};
  const { colors } = useTheme();
  const { user } = useUser();
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'razorpay', label: 'Pay Online', sub: 'UPI, Cards, Net Banking', icon: '💳' },
    { id: 'wallet', label: 'HealthSync Wallet', sub: 'Instant payment', icon: '👛' },
    { id: 'cod', label: 'Pay at Collection', sub: 'Cash / UPI to technician', icon: '🏠' },
  ];

  const goToConfirmation = (paymentMethod, paymentId = null) => {
    navigation.replace('LabTestConfirmation', { cart, total, paymentMethod, paymentId });
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      // --- Cash on Delivery ---
      if (selectedMethod === 'cod') {
        goToConfirmation('cod');
        return;
      }

      // --- Wallet ---
      if (selectedMethod === 'wallet') {
        const res = await apiClient.post('/wallet/pay', {
          amount: total,
          description: `Lab Test Home Collection (${cart.length} tests)`,
        }).catch(e => ({ data: { success: false, message: e?.response?.data?.message || 'Wallet payment failed' } }));

        if (res.data?.success) {
          goToConfirmation('wallet', res.data?.transactionId);
        } else {
          Alert.alert('Wallet Error', res.data?.message || 'Insufficient wallet balance');
        }
        return;
      }

      // --- Razorpay ---
      const orderRes = await apiClient.post('/payments/create-lab-order', {
        amount: total,
        description: `Lab Test Home Collection (${cart.length} tests)`,
      }).catch(e => ({ data: { success: false, message: e?.response?.data?.message || 'Order creation failed' } }));

      const orderId = orderRes?.data?.orderId;

      if (!orderId) {
        Alert.alert(
          'Payment Unavailable',
          orderRes?.data?.message || 'Could not initiate online payment. Please try Pay at Collection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Pay at Collection', onPress: () => goToConfirmation('cod') },
          ]
        );
        return;
      }

      // Navigate to RazorpayPaymentScreen — on success it deep-links back
      // We intercept the deep link in LabTestPaymentScreen via navigation listener
      navigation.navigate('RazorpayPayment', {
        orderId,
        amount: total,
        appointmentId: `lab_${Date.now()}`, // placeholder — not used for lab tests
        user: { name: user?.name, email: user?.email, phone: user?.phone },
        doctor: { name: 'Lab Test Home Collection' },
        date: new Date().toISOString(),
        time: '',
        queueNumber: null,
        consultationType: 'lab',
        patient: { name: user?.name },
        // Override success handler — navigate to LabTestConfirmation instead
        onPaymentSuccess: (paymentId) => {
          goToConfirmation('razorpay', paymentId);
        },
      });
    } catch (err) {
      console.error('Lab payment error:', err);
      Alert.alert('Payment Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
          {cart.map((item, i) => (
            <View
              key={item._id}
              style={[styles.summaryRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}
            >
              <Text style={[styles.summaryItem, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.icon || '🧪'} {item.name}
              </Text>
              <Text style={[styles.summaryPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Home Collection</Text>
            <Text style={[styles.freeLabel, { color: colors.success }]}>FREE</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary, fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>₹{total}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedMethod === method.id ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedMethod(method.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
              <Text style={[styles.methodSub, { color: colors.textSecondary }]}>{method.sub}</Text>
            </View>
            <View style={[styles.radio, { borderColor: selectedMethod === method.id ? colors.primary : colors.textMuted }]}>
              {selectedMethod === method.id && (
                <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.footer, { backgroundColor: colors.backgroundCard, borderTopColor: colors.surfaceBorder }]}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.payBtnGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>
                {selectedMethod === 'cod' ? 'Confirm Booking' : `Pay ₹${total}`}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  content: { padding: spacing.xl, paddingBottom: 120 },
  summaryCard: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.xxl },
  summaryTitle: { ...typography.headlineSmall, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  summaryItem: { ...typography.bodyMedium, flex: 1, marginRight: spacing.md },
  summaryPrice: { ...typography.bodyMedium, fontWeight: '600' },
  totalLabel: { ...typography.bodyLarge, fontWeight: '600' },
  freeLabel: { ...typography.bodyLarge, fontWeight: '700' },
  totalAmount: { ...typography.headlineMedium, fontWeight: '700' },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  methodCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.xl, borderWidth: 2,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  methodIcon: { fontSize: 28, marginRight: spacing.md },
  methodInfo: { flex: 1 },
  methodLabel: { ...typography.bodyLarge, fontWeight: '600' },
  methodSub: { ...typography.bodySmall, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, borderTopWidth: 1 },
  payBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  payBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  payBtnText: { ...typography.button, color: '#fff', fontWeight: '700' },
});

export default LabTestPaymentScreen;
