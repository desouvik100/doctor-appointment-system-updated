/**
 * PaymentScreen - Clean Swiggy/Zomato-style payment UI
 * UPI: native app intent (direct launch) | Card/NetBanking: Razorpay WebView
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, TextInput, Linking, AppState, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import shadows from '../../theme/shadows';
import apiClient from '../../services/api/apiClient';
import { useUser } from '../../context/UserContext';
import UpiAppIcon from '../../components/payment/UpiAppIcon';
import Svg, { Path, Rect, G, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';

// Official NPCI UPI logo
const UpiLogo = ({ size = 40 }) => (
  <Svg width={size} height={size * 0.5} viewBox="0 0 80 40">
    <Defs>
      <SvgGradient id="upiGrad" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#FF6B00" />
        <Stop offset="1" stopColor="#E8001B" />
      </SvgGradient>
    </Defs>
    <Rect width="80" height="40" rx="6" fill="url(#upiGrad)" />
    {/* UPI text */}
    <SvgText x="40" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" letterSpacing="2">UPI</SvgText>
    {/* Arrows */}
    <Path d="M8 20 L16 12 L16 17 L24 17 L24 23 L16 23 L16 28 Z" fill="white" opacity="0.9" />
    <Path d="M72 20 L64 12 L64 17 L56 17 L56 23 L64 23 L64 28 Z" fill="white" opacity="0.9" />
  </Svg>
);

const UPI_APPS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    pkg: 'com.google.android.apps.nbu.paisa.user',
    scheme: 'tez://upi/pay',
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    pkg: 'com.phonepe.app',
    scheme: 'phonepe://pay',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    pkg: 'net.one97.paytm',
    scheme: 'paytmmp://pay',
  },
  {
    id: 'bhim',
    label: 'BHIM',
    pkg: 'in.org.npci.upiapp',
    scheme: 'upi://pay',
  },
  {
    id: 'slice',
    label: 'Slice',
    pkg: 'com.slicepay.app',
    scheme: 'upi://pay',
  },
];

const PaymentScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const { doctor, date, time, queueNumber, consultationType, patient, appointmentId, reason, pendingBooking } = route.params || {};

  // appointmentId ref — set after we create the appointment just before payment
  const createdAppointmentId = useRef(appointmentId || null);

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);

  // For UPI intent polling
  const pendingOrderId = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const pollingTimer = useRef(null);

  const consultationFee = doctor?.fee || doctor?.consultationFee || 500;
  const platformFee = Math.round(consultationFee * 0.05);
  const subtotal = consultationFee + platformFee;
  const totalAmount = Math.max(0, subtotal - couponDiscount);

  useEffect(() => {
    fetchWalletBalance();
    // Listen for app coming back to foreground after UPI app
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
      if (pollingTimer.current) clearTimeout(pollingTimer.current);
    };
  }, []);

  const handleAppStateChange = async (nextState) => {
    if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
      // App came back to foreground — check if UPI payment completed
      // Only poll if pendingOrderId is set (UPI payment flow)
      if (pendingOrderId.current && createdAppointmentId.current) {
        console.log('🔄 App returned to foreground, polling UPI payment status...');
        await pollPaymentStatus(pendingOrderId.current);
      }
    }
    appStateRef.current = nextState;
  };

  const pollPaymentStatus = async (orderId, attempt = 1) => {
    const apptId = createdAppointmentId.current;
    if (!orderId || !apptId) return;
    try {
      const res = await apiClient.post('/payments/verify-by-order', { orderId, appointmentId: apptId });
      if (res.data.success) {
        pendingOrderId.current = null;
        setLoading(false);
        navigation.replace('BookingConfirmation', {
          booking: { id: apptId, doctor, date, time, queueNumber, consultationType, patient, amount: totalAmount, paymentMethod: 'upi' },
        });
      } else if (attempt < 5) {
        pollingTimer.current = setTimeout(() => pollPaymentStatus(orderId, attempt + 1), 2000);
      } else {
        setLoading(false);
        Alert.alert(
          'Payment Pending',
          'We could not confirm your payment yet. If money was deducted, it will be auto-confirmed within a few minutes.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch {
      if (attempt < 5) {
        pollingTimer.current = setTimeout(() => pollPaymentStatus(orderId, attempt + 1), 2000);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await apiClient.get('/wallet/balance');
      setWalletBalance(res.data?.balance || 0);
    } catch { /* silent */ }
  };

  // Create the appointment right before payment — queue only increments on confirmed payment
  const createAppointmentNow = async () => {
    if (createdAppointmentId.current) return createdAppointmentId.current;
    if (!pendingBooking) return null;
    const res = await apiClient.post('/appointments/queue-booking', {
      ...pendingBooking,
      status: 'pending_payment',
      paymentStatus: 'pending',
      reminderPreference: 'email',
      sendEstimatedTimeEmail: false,
    });
    const id = res.data?._id || res.data?.id || res.data?.appointmentId;
    createdAppointmentId.current = id;
    return id;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await apiClient.post('/coupons/validate', { code: couponCode.trim(), amount: subtotal });
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponDiscount(res.data.discount);
      }
    } catch (e) {
      setCouponError(e?.response?.data?.message || 'Invalid coupon code');
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

  const handlePayment = async () => {
    if (!pendingBooking && !createdAppointmentId.current) {
      Alert.alert('Error', 'Appointment info missing. Please try again.');
      return;
    }
    
    // Extract userId with multiple fallbacks
    const userId = user?.id || user?._id || user?.userId;
    
    if (!userId) { 
      console.error('❌ PaymentScreen - No userId found. User object:', user);
      Alert.alert(
        'Session Error', 
        'Unable to identify user. Please logout and login again.',
        [
          { text: 'OK', onPress: () => navigation.navigate('Profile') }
        ]
      ); 
      return; 
    }
    
    console.log('✅ PaymentScreen - Proceeding with userId:', userId);

    setLoading(true);
    let activeAppointmentId;
    try {
      activeAppointmentId = await createAppointmentNow();
      if (!activeAppointmentId) throw new Error('Failed to create appointment. Please try again.');
    } catch (e) {
      setLoading(false);
      Alert.alert('Booking Failed', e?.response?.data?.message || e?.message || 'Could not create appointment.');
      return;
    }

    if (selectedMethod === 'wallet') {
      if (walletBalance < totalAmount) {
        Alert.alert('Insufficient Balance', `Wallet balance ₹${walletBalance} is less than ₹${totalAmount}.`);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.post('/wallet/pay', { amount: totalAmount, appointmentId: activeAppointmentId });
        if (res.data.success) {
          navigation.replace('BookingConfirmation', {
            booking: { id: activeAppointmentId, doctor, date, time, queueNumber, consultationType, patient, amount: totalAmount, paymentMethod: 'wallet' },
          });
        }
      } catch (e) {
        Alert.alert('Payment Failed', e?.response?.data?.message || 'Wallet payment failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const orderRes = await apiClient.post('/payments/create-order', {
        amount: totalAmount, appointmentId: activeAppointmentId, userId, couponCode: appliedCoupon?.code,
      });

      if (!orderRes.data.success) throw new Error(orderRes.data.message || 'Order creation failed');

      if (orderRes.data.testMode) {
        navigation.replace('BookingConfirmation', {
          booking: { id: activeAppointmentId, doctor, date, time, queueNumber, consultationType, patient, amount: totalAmount, paymentMethod: selectedMethod },
        });
        setLoading(false);
        return;
      }

      const { orderId, keyId } = orderRes.data;
      
      if (!keyId) {
        throw new Error('Payment gateway configuration error. Please contact support.');
      }
      
      console.log('✅ Order created successfully:', { orderId, keyId: keyId?.substring(0, 15) + '...' });

      if (selectedMethod === 'upi') {
        // ⚠️ IMPORTANT: Direct UPI deep-links require a valid business UPI VPA
        // Since we're using Razorpay, route UPI payments through their WebView
        // which handles VPA routing internally
        
        console.log('🔍 UPI Payment - Routing through Razorpay WebView');
        console.log('   Selected UPI App:', selectedUpiApp);
        console.log('   Order ID:', orderId);
        console.log('   Amount:', totalAmount);
        
        // Clear pending order ID (WebView handles verification)
        pendingOrderId.current = null;
        createdAppointmentId.current = null;
        
        setLoading(false);
        navigation.navigate('RazorpayPayment', {
          orderId, keyId,
          amount: totalAmount, appointmentId: activeAppointmentId, doctor, date, time,
          queueNumber, consultationType, patient,
          user: { email: user?.email, phone: user?.phone, name: user?.name },
          method: 'upi',
          upiApp: selectedUpiApp !== 'other' ? selectedUpiApp : null,
        });

      } else {
        // Clear pending order ID for non-UPI payments (WebView handles verification)
        pendingOrderId.current = null;
        createdAppointmentId.current = null;
        
        setLoading(false);
        navigation.navigate('RazorpayPayment', {
          orderId, keyId,
          amount: totalAmount, appointmentId: activeAppointmentId, doctor, date, time,
          queueNumber, consultationType, patient,
          user: { email: user?.email, phone: user?.phone, name: user?.name },
          method: selectedMethod,
        });
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Payment Failed', error?.response?.data?.message || error?.message || 'Something went wrong.');
    }
  };

  // Build UPI intent URL using the app's own URI scheme to bypass the chooser
  const buildUpiUrl = ({ orderId, amount, merchantName, merchantVpa, note, app }) => {
    const params = [
      `pa=${encodeURIComponent(merchantVpa)}`,
      `pn=${encodeURIComponent(merchantName)}`,
      `tr=${encodeURIComponent(orderId)}`,
      `tn=${encodeURIComponent(note)}`,
      `am=${amount}`,
      `cu=INR`,
    ].join('&');
    const scheme = app?.scheme || 'upi://pay';
    return `${scheme}?${params}`;
  };

  const insets = useSafeAreaInsets();
  const payBtnScale = useRef(new Animated.Value(1)).current;
  const walletShortfall = Math.max(0, totalAmount - walletBalance);

  const animatePayBtn = () => {
    Animated.sequence([
      Animated.timing(payBtnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(payBtnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const getPayBtnLabel = () => {
    if (loading) return null;
    if (selectedMethod === 'wallet') return `🔒 Pay ₹${totalAmount} from Wallet`;
    if (selectedMethod === 'upi') {
      if (selectedUpiApp === 'other') return `🔒 Pay ₹${totalAmount} via UPI`;
      const appLabel = UPI_APPS.find(a => a.id === selectedUpiApp)?.label || 'UPI';
      return `🔒 Pay ₹${totalAmount} via ${appLabel}`;
    }
    if (selectedMethod === 'card') return `🔒 Pay ₹${totalAmount} via Card`;
    return `🔒 Pay ₹${totalAmount} securely`;
  };

  const renderMethodCard = (id, icon, iconBg, title, subtitle, extra) => {
    const active = selectedMethod === id;
    return (
      <TouchableOpacity
        key={id}
        style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: active ? '#2E7D32' : colors.divider, borderWidth: active ? 2 : 1 }]}
        onPress={() => setSelectedMethod(id)}
        activeOpacity={0.8}
      >
        <View style={styles.methodCardRow}>
          <View style={[styles.methodIconBox, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <View style={styles.methodInfo}>
            <View style={styles.methodTitleRow}>
              <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>{title}</Text>
              {id === 'upi' ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.methodSub, { color: active ? '#2E7D32' : colors.textMuted }]}>{subtitle}</Text>
          </View>
          <View style={[styles.checkCircle, { borderColor: active ? '#2E7D32' : colors.divider, backgroundColor: active ? '#2E7D32' : 'transparent' }]}>
            {active ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        </View>
        {extra ? extra : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F5F7FA' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Trust Header */}
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']} style={[styles.trustHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIconWhite}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLock}>🔒</Text>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <Text style={styles.headerSub}>100% encrypted & trusted</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Trust Badges */}
      <View style={styles.trustBadgesRow}>
        <View style={styles.trustBadge}><Text style={styles.trustBadgeText}>🔐 SSL Secured</Text></View>
        <View style={styles.trustDot} />
        <View style={styles.trustBadge}><Text style={styles.trustBadgeText}>✅ Razorpay</Text></View>
        <View style={styles.trustDot} />
        <View style={styles.trustBadge}><Text style={styles.trustBadgeText}>🏦 RBI Compliant</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Amount Hero */}
        <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.amountHero}>
          <Text style={styles.amountLabel}>Total Payable</Text>
          <Text style={styles.amountValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.amountSub}>
            {doctor?.name ? `Dr. ${doctor.name}` : 'Doctor'} · {formatDate(date)} · Token #{queueNumber || '—'}
          </Text>
          <View style={styles.amountBadgesRow}>
            <View style={styles.amountBadge}><Text style={styles.amountBadgeText}>🔒 Safe & Secure</Text></View>
            <View style={styles.amountBadge}><Text style={styles.amountBadgeText}>⚡ Instant Confirm</Text></View>
          </View>
        </LinearGradient>

        {/* Payment Methods */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Choose Payment Method</Text>

        {/* UPI */}
        {renderMethodCard(
          'upi',
          <UpiLogo size={36} />,
          '#FFF3E0',
          'UPI',
          'GPay, PhonePe, Paytm & more',
          selectedMethod === 'upi' ? (
            <View style={styles.upiAppsGrid}>
              {UPI_APPS.map((app) => {
                const active = selectedUpiApp === app.id;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.upiAppCard, { borderColor: active ? '#2E7D32' : colors.divider, backgroundColor: active ? '#E8F5E9' : colors.backgroundCard }]}
                    onPress={() => setSelectedUpiApp(app.id)}
                    activeOpacity={0.8}
                  >
                    <UpiAppIcon appId={app.id} size={40} />
                    <Text style={[styles.upiAppLabel, { color: active ? '#2E7D32' : colors.textSecondary }]}>{app.label}</Text>
                    {active ? (
                      <View style={[styles.upiCheck, { backgroundColor: '#2E7D32' }]}>
                        <Text style={styles.upiCheckText}>✓</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.upiAppCard, { borderColor: selectedUpiApp === 'other' ? '#2E7D32' : colors.divider, backgroundColor: selectedUpiApp === 'other' ? '#E8F5E9' : colors.backgroundCard }]}
                onPress={() => setSelectedUpiApp('other')}
                activeOpacity={0.8}
              >
                <View style={[styles.moreAppsIcon, { backgroundColor: colors.surface }]}>
                  <Text style={styles.moreAppsEmoji}>⋯</Text>
                </View>
                <Text style={[styles.upiAppLabel, { color: selectedUpiApp === 'other' ? '#2E7D32' : colors.textSecondary }]}>More</Text>
                {selectedUpiApp === 'other' ? (
                  <View style={[styles.upiCheck, { backgroundColor: '#2E7D32' }]}>
                    <Text style={styles.upiCheckText}>✓</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          ) : null
        )}

        {/* Card */}
        {renderMethodCard(
          'card',
          <Text style={styles.methodIconText}>💳</Text>,
          '#E3F2FD',
          'Credit / Debit Card',
          'Visa, Mastercard, RuPay',
          selectedMethod === 'card' ? (
            <View style={styles.cardLogosRow}>
              <View style={[styles.cardLogoPill, { backgroundColor: '#1A1F71' }]}><Text style={styles.cardLogoText}>VISA</Text></View>
              <View style={[styles.cardLogoPill, { backgroundColor: '#EB001B' }]}><Text style={styles.cardLogoText}>MC</Text></View>
              <View style={[styles.cardLogoPill, { backgroundColor: '#FF6600' }]}><Text style={styles.cardLogoText}>RuPay</Text></View>
            </View>
          ) : null
        )}

        {/* Net Banking */}
        {renderMethodCard(
          'netbanking',
          <Text style={styles.methodIconText}>🏦</Text>,
          '#FFF3E0',
          'Net Banking',
          'All major banks supported',
          null
        )}

        {/* Health Wallet */}
        {renderMethodCard(
          'wallet',
          <Text style={styles.methodIconText}>💰</Text>,
          '#F3E5F5',
          'Health Wallet',
          walletBalance >= totalAmount
            ? `Use ₹${walletBalance.toLocaleString('en-IN')} from wallet`
            : `Use ₹${walletBalance.toLocaleString('en-IN')} · Add ₹${walletShortfall.toLocaleString('en-IN')} more`,
          walletBalance < totalAmount ? (
            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() => navigation.navigate('Wallet')}
              activeOpacity={0.8}
            >
              <Text style={styles.addMoneyText}>+ Add Money</Text>
            </TouchableOpacity>
          ) : null
        )}

        {/* Coupon */}
        <View style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: appliedCoupon ? '#2E7D32' : colors.divider, borderWidth: appliedCoupon ? 2 : 1 }]}>
          <TouchableOpacity style={styles.couponHeader} onPress={() => setShowCoupon(!showCoupon)} activeOpacity={0.7}>
            <View style={[styles.methodIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.methodIconText}>🏷️</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>
                {appliedCoupon ? `"${appliedCoupon.code}" applied` : 'Apply Coupon'}
              </Text>
              <Text style={[styles.methodSub, { color: appliedCoupon ? '#2E7D32' : colors.textMuted }]}>
                {appliedCoupon ? `You save ₹${couponDiscount}` : 'Try HEALTH10 for ₹50 off'}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>{showCoupon ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCoupon ? (
            <View style={[styles.couponBox, { borderTopColor: colors.divider }]}>
              <View style={[styles.couponRow, { backgroundColor: colors.backgroundCard, borderColor: colors.divider }]}>
                <TextInput
                  style={[styles.couponInput, { color: colors.textPrimary }]}
                  placeholder="Enter coupon code"
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  editable={!appliedCoupon}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponBtn, { backgroundColor: '#2E7D32' }, couponLoading ? { opacity: 0.6 } : null]}
                  onPress={appliedCoupon ? removeCoupon : validateCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.couponBtnText}>{appliedCoupon ? 'Remove' : 'Apply'}</Text>
                  }
                </TouchableOpacity>
              </View>
              {couponError ? <Text style={[styles.couponMsg, { color: colors.error }]}>{couponError}</Text> : null}
            </View>
          ) : null}
        </View>

        {/* Bill Details */}
        <View style={[styles.billCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>Bill Details</Text>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Consultation Fee</Text>
            <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>₹{consultationFee.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Platform Fee</Text>
            <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>₹{platformFee.toLocaleString('en-IN')}</Text>
          </View>
          {couponDiscount > 0 ? (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#2E7D32' }]}>Coupon Discount</Text>
              <Text style={[styles.breakdownValue, { color: '#2E7D32' }]}>-₹{couponDiscount.toLocaleString('en-IN')}</Text>
            </View>
          ) : null}
          <View style={[styles.breakdownDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownTotal, { color: colors.textPrimary }]}>Total Payable</Text>
            <Text style={[styles.breakdownTotalValue, { color: '#1B5E20' }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.refundNote}>
            <Text style={[styles.refundNoteText, { color: colors.textMuted }]}>
              🔄 Full refund if cancelled 2+ hours before appointment
            </Text>
          </View>
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.divider, paddingBottom: insets.bottom + 12 }]}>
        {loading && selectedMethod === 'upi' ? (
          <View style={styles.upiWaiting}>
            <ActivityIndicator size="small" color="#2E7D32" />
            <Text style={[styles.upiWaitingText, { color: colors.textSecondary }]}>
              Waiting for payment confirmation...
            </Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: payBtnScale }] }}>
            <TouchableOpacity
              style={[styles.payBtn, { opacity: loading ? 0.75 : 1 }]}
              onPress={() => { animatePayBtn(); handlePayment(); }}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnGradient}>
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.payBtnText}>{getPayBtnLabel()}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
        <Text style={[styles.secureNote, { color: colors.textMuted }]}>
          🔐 Payments secured by Razorpay · PCI DSS compliant
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Trust Header
  trustHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.lg,
  },
  backBtn: { padding: spacing.sm, width: 40 },
  backIconWhite: { fontSize: 22, color: '#fff' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerLock: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Trust Badges
  trustBadgesRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: spacing.lg,
  },
  trustBadge: {},
  trustBadgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#A5D6A7', marginHorizontal: 8 },

  scrollContent: { paddingBottom: 20 },

  // Amount Hero
  amountHero: {
    marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.lg,
    borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center',
  },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 4 },
  amountValue: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  amountSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: spacing.sm, textAlign: 'center' },
  amountBadgesRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  amountBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  amountBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Section label
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginHorizontal: spacing.xl, marginBottom: spacing.sm, marginTop: spacing.xs },

  // Method Cards
  methodCard: {
    marginHorizontal: spacing.xl, marginBottom: spacing.sm,
    borderRadius: borderRadius.xl, overflow: 'hidden',
  },
  methodCardRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
  },
  methodIconBox: { width: 52, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  methodIconText: { fontSize: 22 },
  methodInfo: { flex: 1 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodTitle: { ...typography.bodyLarge, fontWeight: '600' },
  methodSub: { ...typography.labelSmall, marginTop: 2 },
  recommendedBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  recommendedText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '900' },

  // Method card inner row (used by renderMethodCard)
  couponHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },

  // Card logos
  cardLogosRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 4 },
  cardLogoPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  cardLogoText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Wallet add money
  addMoneyBtn: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: '#E8F5E9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#A5D6A7',
  },
  addMoneyText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // UPI apps grid
  upiAppsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg, gap: spacing.sm,
  },
  upiAppCard: {
    width: '18%', alignItems: 'center', borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    borderWidth: 1.5, position: 'relative',
  },
  upiAppLabel: { ...typography.labelSmall, textAlign: 'center', marginTop: spacing.xs, fontSize: 10 },
  upiCheck: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  upiCheckText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  moreAppsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  moreAppsEmoji: { fontSize: 20, fontWeight: 'bold', color: '#666' },

  // Coupon
  chevron: { fontSize: 12 },
  couponBox: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderTopWidth: 1 },
  couponRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg,
    borderWidth: 1, marginTop: spacing.md, overflow: 'hidden',
  },
  couponInput: { flex: 1, ...typography.bodyMedium, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  couponBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minWidth: 80, alignItems: 'center' },
  couponBtnText: { ...typography.labelMedium, color: '#fff', fontWeight: '700' },
  couponMsg: { ...typography.labelSmall, marginTop: spacing.sm },

  // Bill
  billCard: {
    marginHorizontal: spacing.xl, marginBottom: spacing.sm,
    borderRadius: borderRadius.xl, overflow: 'hidden',
  },
  breakdownTitle: { ...typography.bodyLarge, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  breakdownLabel: { ...typography.bodyMedium },
  breakdownValue: { ...typography.bodyMedium },
  breakdownDivider: { height: 1, marginHorizontal: spacing.lg, marginVertical: spacing.sm },
  breakdownTotal: { ...typography.bodyLarge, fontWeight: '800', fontSize: 17 },
  breakdownTotalValue: { fontSize: 22, fontWeight: '900' },
  refundNote: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: 4 },
  refundNoteText: { fontSize: 12 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    borderTopWidth: 1, ...shadows.large,
  },
  payBtn: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  payBtnGradient: { paddingVertical: spacing.lg + 4, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
  secureNote: { textAlign: 'center', fontSize: 11, marginTop: 8 },
  upiWaiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  upiWaitingText: { ...typography.bodyMedium, marginLeft: spacing.md },
});

export default PaymentScreen;
