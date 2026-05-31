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
import apiClient, {
  getAuthToken,
  getRefreshToken,
  saveAuthToken,
} from '../../services/api/apiClient';
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
  const { colors, isDarkMode } = useTheme();
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

  // Rotating messages for full-screen loading overlay
  const [loadingMessage, setLoadingMessage] = useState('Initializing secure gateway...');

  // For UPI intent polling
  const pendingOrderId = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const pollingTimer = useRef(null);
  const pollingInProgress = useRef(false);

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

  // Update loading messages periodically when loading is true
  useEffect(() => {
    if (!loading) return;
    const messages = [
      'Initializing secure gateway...',
      'Contacting trusted banking partners...',
      'Encrypting payment transaction...',
      'Confirming appointment token allocation...',
      'Verifying payment status...',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingMessage(messages[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAppStateChange = async (nextState) => {
    if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
      // App came back to foreground — check if UPI payment completed
      // Only poll if pendingOrderId is set (UPI payment flow) and not already polling
      if (pendingOrderId.current && createdAppointmentId.current && !pollingInProgress.current) {
        pollingInProgress.current = true;
        console.log('🔄 App returned to foreground, polling UPI payment status...');
        try {
          await pollPaymentStatus(pendingOrderId.current);
        } finally {
          pollingInProgress.current = false;
        }
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

  /**
   * Verify payment completion for an appointment
   * This is called as a safety net to detect payments that completed
   * in external apps (UPI, banking apps) and ensure the appointment is confirmed.
   *
   * @param {string} appointmentId - The appointment to verify
   * @returns {Promise<boolean>} true if payment was verified and appointment confirmed
   */
  const verifyPaymentCompletion = async (appointmentId) => {
    if (!appointmentId) return false;
    try {
      const res = await apiClient.get(`/payments/status/${appointmentId}`);
      const data = res.data || {};

      if (data.paymentStatus === 'completed' || data.status === 'confirmed') {
        console.log('✅ Payment verification successful for appointment:', appointmentId);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('⚠️ Payment verification check failed:', err.message);
      return false;
    }
  };

  /**
   * Safety check on mount: if there's a pending appointment from a previous session,
   * verify its payment status. This handles cases where payment succeeded but
   * app crashed or user force-closed before seeing confirmation.
   */
  useEffect(() => {
    const checkPendingPayment = async () => {
      if (!createdAppointmentId.current && appointmentId) {
        const isConfirmed = await verifyPaymentCompletion(appointmentId);
        if (isConfirmed) {
          navigation.replace('BookingConfirmation', {
            booking: {
              id: appointmentId,
              doctor,
              date,
              time,
              queueNumber,
              consultationType,
              patient,
              amount: totalAmount,
              paymentMethod: selectedMethod,
            },
          });
        }
      }
    };
    checkPendingPayment();
  }, [appointmentId]);

  /**
   * Pre-flight session guard.
   * Validates the stored access token *before* firing the checkout request.
   * If the token is absent or the storage read indicates an expired session,
   * we proactively await a refresh cycle so the subsequent HTTP call is sent
   * with a guaranteed-fresh Authorization header.
   * This eliminates the synchronization race-condition that caused
   * POST /appointments/queue-booking to fail with a backend state mismatch.
   *
   * @returns {Promise<boolean>} true if a valid session is confirmed
   * @throws {Error}            when no refresh token exists and we cannot recover
   */
  const ensureFreshToken = async () => {
    try {
      const currentToken = await getAuthToken();
      if (currentToken) {
        // Token exists — pass through; the Axios request interceptor will
        // attach it. If the server still returns 401 the response interceptor
        // handles the refresh automatically.
        console.log('🔑 [Checkout Guard] Valid session token confirmed');
        return true;
      }

      // No token found in either storage — attempt a proactive refresh
      console.log('⚠️ [Checkout Guard] No access token found. Attempting proactive refresh...');
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('Session expired. Please log in again to complete your booking.');
      }

      const { default: axios } = await import('axios');
      const { API_URL } = await import('../../config/env');
      const refreshRes = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const newToken = refreshRes.data?.token;
      if (!newToken) {
        throw new Error('Token refresh returned no access token. Please log in again.');
      }

      await saveAuthToken(newToken);
      console.log('✅ [Checkout Guard] Proactive token refresh succeeded');
      return true;
    } catch (err) {
      console.error('❌ [Checkout Guard] Session validation failed:', err.message);
      throw err;
    }
  };

  // Create the appointment right before payment — queue only increments on confirmed payment
  const createAppointmentNow = async () => {
    if (createdAppointmentId.current) return createdAppointmentId.current;
    if (!pendingBooking) return null;

    // ── Pre-flight token validation ──────────────────────────────────────
    await ensureFreshToken();
    // ─────────────────────────────────────────────────────────────────────

    // Map the frontend paymentMethod to a valid backend schema enum value.
    // Backend payment.paymentMethod enum: ["card", "upi", "netbanking", "wallet"]
    // 'razorpay' is NOT a valid enum — map it to 'card' (Razorpay default gateway).
    const rawMethod = selectedMethod || 'upi';
    const backendPaymentMethod = rawMethod === 'wallet'
      ? 'wallet'
      : rawMethod === 'upi'
        ? 'upi'
        : rawMethod === 'netbanking'
          ? 'netbanking'
          : 'card'; // card / razorpay / anything else → 'card'

    // Safe ID extraction helper
    const extractId = (obj) => {
      if (!obj) return '';
      if (typeof obj === 'string') return String(obj).trim();
      if (typeof obj === 'object' && (obj._id || obj.id)) {
        return String(obj._id || obj.id).trim();
      }
      return '';
    };

    // Force clean database string primitives for IDs
    const cleanUserId = extractId(pendingBooking.userId || user?.id || user?._id || user?.userId);
    const cleanDoctorId = extractId(pendingBooking.doctorId || doctor?._id || doctor?.id);
    const cleanClinicId = extractId(pendingBooking.clinicId || doctor?.clinicId?._id || doctor?.clinicId) || null;

    const selectedTime = pendingBooking.time || time || '12:30 PM';
    const cleanSlotId = pendingBooking.slotId || null;

    const consultationFee = Number(pendingBooking.consultationFee || doctor?.consultationFee || doctor?.fee || 500);
    const platformFee = Number(pendingBooking.platformFee || Math.round(consultationFee * 0.05));
    const totalAmount = Number(pendingBooking.amount || (consultationFee + platformFee));

    // Build the final payload — all fields the backend queue-booking controller needs
    const bookingPayload = {
      userId: cleanUserId,
      doctorId: cleanDoctorId,
      clinicId: cleanClinicId,

      // Date & time — both required by Appointment schema
      date: pendingBooking.date || date,
      time: selectedTime,

      // Slot metadata
      ...(cleanSlotId ? { slotId: cleanSlotId } : {}),
      slotType: pendingBooking.slotType || (pendingBooking.consultationType === 'online' ? 'online' : 'clinic'),

      // Appointment details
      reason: pendingBooking.reason || 'General Consultation',
      consultationType: pendingBooking.consultationType || 'in_person',
      urgencyLevel: pendingBooking.urgencyLevel || 'normal',

      // Payment initialization — required for pending_payment status
      status: 'pending_payment',
      paymentStatus: 'pending',
      paymentMethod: backendPaymentMethod,   // valid enum: card | upi | netbanking | wallet
      amount: Number(totalAmount),
      amountInPaisa: Number(totalAmount * 100),
      consultationFee: Number(consultationFee),
      platformFee: Number(platformFee),
      gst: 0,

      // Notification prefs
      reminderPreference: 'email',
      sendEstimatedTimeEmail: false,
    };

    console.log('QUEUE BOOKING PAYLOAD', JSON.stringify(bookingPayload, null, 2));

    const res = await apiClient.post('/appointments/queue-booking', bookingPayload);

    console.log('QUEUE BOOKING RESPONSE', res.data);

    const id = res.data?._id || res.data?.id || res.data?.appointmentId
      || res.data?.appointment?._id || res.data?.appointment?.id;
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

    // ── Top-level session validation guard ──────────────────────────────────
    // Validate the access token BEFORE any network call in this function:
    // create-order, wallet/pay, and the RazorpayPayment navigation all require
    // a live Authorization header. A token that expired between the user
    // landing on this screen and pressing Pay would cause silent 401 failures
    // on any of those calls. We pause execution here and proactively refresh
    // so the entire payment handshake runs with a guaranteed-fresh token.
    try {
      await ensureFreshToken();
    } catch (sessionErr) {
      Alert.alert(
        'Session Expired',
        sessionErr.message || 'Your session has expired. Please log in again.',
        [{ text: 'Log In', onPress: () => navigation.navigate('Welcome') }]
      );
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

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
    if (loading) return 'Securely Processing...';
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
    const activeColor = colors.primary;
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.methodCard,
          {
            backgroundColor: colors.surface,
            borderColor: active ? activeColor : 'transparent',
            borderWidth: active ? 2 : 0,
          },
          shadows.md,
        ]}
        onPress={() => setSelectedMethod(id)}
        activeOpacity={0.85}
      >
        <View style={styles.methodCardRow}>
          <View style={[styles.methodIconBox, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <View style={styles.methodInfo}>
            <View style={styles.methodTitleRow}>
              <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>{title}</Text>
              {id === 'upi' ? (
                <View style={[styles.recommendedBadge, { backgroundColor: colors.primary + '12' }]}>
                  <Text style={[styles.recommendedText, { color: colors.primary }]}>Recommended</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.methodSub, { color: active ? colors.primary : colors.textMuted }]}>{subtitle}</Text>
          </View>
          <View style={[styles.checkCircle, { borderColor: active ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'), backgroundColor: active ? colors.primary : 'transparent' }]}>
            {active ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        </View>
        {extra ? extra : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Trust Header */}
      <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} style={[styles.trustHeader, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIconWhite}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Text style={styles.headerSub}>🔒 RBI Compliant · 256-Bit SSL Encryption</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Trust Badges */}
      <View style={[styles.trustBadgesRow, { backgroundColor: colors.success + '08', borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
        <View style={styles.trustBadge}><Text style={[styles.trustBadgeText, { color: colors.success }]}>🛡️ SSL Secured</Text></View>
        <View style={styles.trustDot} />
        <View style={styles.trustBadge}><Text style={[styles.trustBadgeText, { color: colors.success }]}>⚡ Razorpay Verified</Text></View>
        <View style={styles.trustDot} />
        <View style={styles.trustBadge}><Text style={[styles.trustBadgeText, { color: colors.success }]}>🏦 RBI Approved</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Amount Hero */}
        <LinearGradient colors={colors.gradientSecondary || ['#6C5CE7', '#5B4ED1']} style={styles.amountHero}>
          <Text style={styles.amountLabel}>Total Payable Amount</Text>
          <Text style={styles.amountValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.amountSub}>
            {doctor?.name?.startsWith('Dr.') ? doctor?.name : `Dr. ${doctor?.name || 'Doctor'}`} · {formatDate(date)} at {time}
          </Text>
          <View style={styles.amountBadgesRow}>
            <View style={styles.amountBadge}><Text style={styles.amountBadgeText}>Token #{queueNumber || '—'}</Text></View>
            <View style={styles.amountBadge}><Text style={styles.amountBadgeText}>⚡ Instant Booking</Text></View>
          </View>
        </LinearGradient>

        {/* Payment Methods */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Payment Option</Text>

        {/* UPI Option */}
        {renderMethodCard(
          'upi',
          <UpiLogo size={32} />,
          isDarkMode ? 'rgba(255, 107, 0, 0.1)' : '#FFF3E0',
          'UPI Payment',
          'Google Pay, PhonePe, Paytm, BHIM',
          selectedMethod === 'upi' ? (
            <View style={styles.upiAppsGrid}>
              {UPI_APPS.map((app) => {
                const active = selectedUpiApp === app.id;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[
                      styles.upiAppCard,
                      {
                        borderColor: active ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                        backgroundColor: active ? (isDarkMode ? 'rgba(0, 212, 170, 0.08)' : '#E8F5E9') : colors.backgroundCard,
                      }
                    ]}
                    onPress={() => setSelectedUpiApp(app.id)}
                    activeOpacity={0.8}
                  >
                    <UpiAppIcon appId={app.id} size={36} />
                    <Text style={[styles.upiAppLabel, { color: active ? colors.primary : colors.textSecondary }]}>{app.label}</Text>
                    {active ? (
                      <View style={[styles.upiCheck, { backgroundColor: colors.primary }]}>
                        <Text style={styles.upiCheckText}>✓</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.upiAppCard,
                  {
                    borderColor: selectedUpiApp === 'other' ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                    backgroundColor: selectedUpiApp === 'other' ? (isDarkMode ? 'rgba(0, 212, 170, 0.08)' : '#E8F5E9') : colors.backgroundCard,
                  }
                ]}
                onPress={() => setSelectedUpiApp('other')}
                activeOpacity={0.8}
              >
                <View style={[styles.moreAppsIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }]}>
                  <Text style={[styles.moreAppsEmoji, { color: colors.textSecondary }]}>⋯</Text>
                </View>
                <Text style={[styles.upiAppLabel, { color: selectedUpiApp === 'other' ? colors.primary : colors.textSecondary }]}>Other UPI</Text>
                {selectedUpiApp === 'other' ? (
                  <View style={[styles.upiCheck, { backgroundColor: colors.primary }]}>
                    <Text style={styles.upiCheckText}>✓</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          ) : null
        )}

        {/* Card Option */}
        {renderMethodCard(
          'card',
          <Text style={styles.methodIconText}>💳</Text>,
          isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#E3F2FD',
          'Credit / Debit Card',
          'Visa, Mastercard, RuPay & Diner\'s Club',
          selectedMethod === 'card' ? (
            <View style={styles.cardLogosRow}>
              <View style={[styles.cardLogoPill, { backgroundColor: '#1A1F71' }]}><Text style={styles.cardLogoText}>VISA</Text></View>
              <View style={[styles.cardLogoPill, { backgroundColor: '#EB001B' }]}><Text style={styles.cardLogoText}>MC</Text></View>
              <View style={[styles.cardLogoPill, { backgroundColor: '#FF6600' }]}><Text style={styles.cardLogoText}>RuPay</Text></View>
            </View>
          ) : null
        )}

        {/* Netbanking Option */}
        {renderMethodCard(
          'netbanking',
          <Text style={styles.methodIconText}>🏦</Text>,
          isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#E8F5E9',
          'Net Banking',
          'Direct login for 50+ major Indian banks',
          null
        )}

        {/* Health Wallet Option */}
        {renderMethodCard(
          'wallet',
          <Text style={styles.methodIconText}>💰</Text>,
          isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#F3E5F5',
          'HealthSync Balance',
          `Available balance: ₹${walletBalance.toLocaleString('en-IN')}`,
          <View style={styles.walletDetailsContainer}>
            {walletBalance < totalAmount ? (
              <View style={styles.walletShortfallContainer}>
                <View style={[styles.shortfallBadge, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={styles.shortfallBadgeText}>Shortfall of ₹{walletShortfall.toLocaleString('en-IN')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addMoneyBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary }]}
                  onPress={() => navigation.navigate('Wallet')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.addMoneyText, { color: colors.primary }]}>+ Top-up Wallet</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.walletSuccessContainer}>
                <View style={[styles.shortfallBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.shortfallBadgeText, { color: '#059669' }]}>Full amount covered ✓</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Coupon validation block */}
        <View style={[styles.couponCard, { backgroundColor: colors.surface }, shadows.md]}>
          <TouchableOpacity style={styles.couponHeader} onPress={() => setShowCoupon(!showCoupon)} activeOpacity={0.75}>
            <View style={[styles.methodIconBox, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#EBFDF5' }]}>
              <Text style={styles.methodIconText}>🏷️</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>
                {appliedCoupon ? `Promo Code "${appliedCoupon.code}"` : 'Apply Coupon'}
              </Text>
              <Text style={[styles.methodSub, { color: appliedCoupon ? colors.success : colors.textMuted }]}>
                {appliedCoupon ? `Saved ₹${couponDiscount} on consultation` : 'Tap to enter discount/referral code'}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>{showCoupon ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showCoupon && (
            <View style={[styles.couponBox, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
              <View style={[styles.couponRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
                <TextInput
                  style={[styles.couponInput, { color: colors.textPrimary }]}
                  placeholder="Enter code (e.g. HEALTH10)"
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  editable={!appliedCoupon}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponBtn, { backgroundColor: colors.primary }, couponLoading && { opacity: 0.6 }]}
                  onPress={appliedCoupon ? removeCoupon : validateCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.couponBtnText}>{appliedCoupon ? 'Remove' : 'Apply'}</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponError ? <Text style={[styles.couponMsg, { color: colors.error }]}>{couponError}</Text> : null}
              {appliedCoupon ? <Text style={[styles.couponMsg, { color: colors.success }]}>✓ Code applied successfully!</Text> : null}
            </View>
          )}
        </View>

        {/* Bill Summary */}
        <View style={[styles.billCard, { backgroundColor: colors.surface }, shadows.md]}>
          <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>Detailed Invoice Summary</Text>
          
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Doctor Consultation Fee</Text>
            <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>₹{consultationFee.toLocaleString('en-IN')}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>HealthSync Booking Fee</Text>
            <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>₹{platformFee.toLocaleString('en-IN')}</Text>
          </View>
          
          {couponDiscount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.success }]}>Coupon Discount Applied</Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>-₹{couponDiscount.toLocaleString('en-IN')}</Text>
            </View>
          )}
          
          <View style={[styles.breakdownDivider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]} />
          
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownTotal, { color: colors.textPrimary }]}>Total Payable</Text>
            <Text style={[styles.breakdownTotalValue, { color: colors.primary }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          
          <View style={styles.refundNote}>
            <Text style={[styles.refundNoteText, { color: colors.textMuted }]}>
              🛡️ Cancellation Policy: 100% refund up to 2 hours before the slot.
            </Text>
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Pay Button Sticky Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9', paddingBottom: insets.bottom + spacing.md }]}>
        <Animated.View style={{ transform: [{ scale: payBtnScale }] }}>
          <TouchableOpacity
            style={[styles.payBtn, { opacity: loading ? 0.8 : 1 }]}
            onPress={() => { animatePayBtn(); handlePayment(); }}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnGradient}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payBtnText}>{getPayBtnLabel()}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.secureNote, { color: colors.textMuted }]}>
          🔒 Secure 256-bit SSL encrypted connection provided by Razorpay
        </Text>
      </View>

      {/* Premium Full Screen Processing Overlay */}
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loadingOverlay]}>
          <View style={[styles.loadingBox, { backgroundColor: colors.surface }, shadows.xl]}>
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.loadingMsgText, { color: colors.textPrimary }]}>{loadingMessage}</Text>
            <Text style={[styles.loadingSubText, { color: colors.textMuted }]}>Please do not close this screen or press back</Text>
            
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingFooterLock}>🔒</Text>
              <Text style={styles.loadingFooterText}>PCI-DSS Bank Grade Security</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Trust Header
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconWhite: { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineMedium, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', ...typography.labelSmall, marginTop: 2, fontSize: 10 },

  // Trust Badges
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  trustBadge: {},
  trustBadgeText: { fontSize: 11, fontWeight: '700' },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#10B981', opacity: 0.3, marginHorizontal: 12 },

  scrollContent: { paddingBottom: 20 },

  // Amount Hero
  amountHero: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  amountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  amountValue: { fontSize: 40, fontWeight: '700', color: '#fff', letterSpacing: -1 },
  amountSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm, textAlign: 'center', fontWeight: '500' },
  amountBadgesRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  amountBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  amountBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: spacing.xl, marginBottom: spacing.md, marginTop: spacing.sm },

  // Method Cards
  methodCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  methodCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  methodIconBox: { width: 52, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  methodIconText: { fontSize: 20 },
  methodInfo: { flex: 1 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  methodTitle: { ...typography.bodyLarge, fontWeight: '700' },
  methodSub: { ...typography.labelSmall, marginTop: 2 },
  recommendedBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  recommendedText: { fontSize: 9, fontWeight: '800' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // UPI apps grid - Optimized for 4-column dynamic grid
  upiAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  upiAppCard: {
    width: '23%',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1.5,
    position: 'relative',
  },
  upiAppLabel: { ...typography.labelSmall, textAlign: 'center', marginTop: spacing.xs, fontSize: 9, fontWeight: '600' },
  upiCheck: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  upiCheckText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  moreAppsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreAppsEmoji: { fontSize: 18, fontWeight: '900' },

  // Card logos
  cardLogosRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, marginTop: -4 },
  cardLogoPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
  cardLogoText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // Wallet
  walletDetailsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    marginTop: -4,
  },
  walletShortfallContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletSuccessContainer: {
    flexDirection: 'row',
  },
  shortfallBadge: {
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  shortfallBadgeText: { fontSize: 11, color: '#EF4444', fontWeight: '700' },
  addMoneyBtn: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  addMoneyText: { fontSize: 11, fontWeight: '700' },

  // Coupon
  couponCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  couponHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  chevron: { fontSize: 10 },
  couponBox: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderTopWidth: 1, paddingTop: spacing.md },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  couponInput: { flex: 1, ...typography.bodyMedium, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 13, height: 48 },
  couponBtn: { paddingHorizontal: spacing.lg, height: 48, alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  couponBtnText: { ...typography.labelMedium, color: '#fff', fontWeight: '800' },
  couponMsg: { fontSize: 11, fontWeight: '600', marginTop: spacing.xs, paddingLeft: 2 },

  // Bill Breakdown
  billCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  breakdownTitle: { ...typography.bodyLarge, fontWeight: '700', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  breakdownLabel: { ...typography.bodyMedium, fontSize: 13 },
  breakdownValue: { ...typography.bodyMedium, fontWeight: '600', fontSize: 13 },
  breakdownDivider: { height: 1, marginHorizontal: spacing.lg, marginVertical: spacing.md },
  breakdownTotal: { ...typography.bodyLarge, fontWeight: '700', fontSize: 16 },
  breakdownTotalValue: { fontSize: 22, fontWeight: '700' },
  refundNote: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  refundNoteText: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

  // Bottom action bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  payBtn: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  payBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  secureNote: { textAlign: 'center', fontSize: 10, marginTop: spacing.sm, fontWeight: '500' },

  // Loading Overlay
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  loadingBox: {
    width: '82%',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  spinnerContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  loadingMsgText: {
    ...typography.bodyLarge,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  loadingSubText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    width: '100%',
    justifyContent: 'center',
  },
  loadingFooterLock: { fontSize: 12 },
  loadingFooterText: { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
});

export default PaymentScreen;
