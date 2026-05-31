/**
 * RazorpayPaymentScreen
 * Opens the backend's /payments/mobile-checkout page in a WebView.
 * The backend page handles Razorpay checkout and redirects back via
 * healthsync:// deep link on success/failure.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  Alert, TouchableOpacity, Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import apiClient from '../../services/api/apiClient';
import { API_URL } from '../../config/env';

// Base URL without /api suffix
const BASE_URL = API_URL.replace('/api', '');

const RazorpayPaymentScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const {
    orderId, keyId, amount, appointmentId,
    doctor, date, time, queueNumber, consultationType, patient, user,
    method, upiApp,
  } = route.params || {};

  const [verifying, setVerifying] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const webViewRef = useRef(null);

  // Load auth token so the WebView can pass it to the ownership-validated checkout endpoint
  useEffect(() => {
    import('../../services/api/apiClient').then(({ getAuthToken }) => {
      getAuthToken().then(token => setAuthToken(token)).catch(() => {});
    }).catch(() => {});
  }, []);

  // Build the checkout URL served by the backend
  const checkoutUrl = `${BASE_URL}/api/payments/mobile-checkout/${orderId}?` +
    `appointmentId=${encodeURIComponent(appointmentId || '')}` +
    `&amount=${(amount || 0) * 100}` +
    `&name=${encodeURIComponent(user?.name || '')}` +
    `&email=${encodeURIComponent(user?.email || '')}` +
    `&contact=${encodeURIComponent(user?.phone || '')}` +
    `&doctorName=${encodeURIComponent(doctor?.name || 'Doctor')}` +
    (method ? `&method=${encodeURIComponent(method)}` : '') +
    (upiApp ? `&upiApp=${encodeURIComponent(upiApp)}` : '');

  // Headers for the WebView — passes JWT so the backend can validate ownership
  const webViewHeaders = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};

  // Handle deep link callbacks from the payment page
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (!url?.startsWith('healthsync://')) return;  // ignore healthsyncpro:// and others

      if (url.includes('payment-success')) {
        setVerifying(true);
        try {
          // Payment was already verified server-side by the mobile-checkout page
          if (appointmentId?.startsWith('lab_')) {
            // Lab test payment — go to lab confirmation
            navigation.replace('LabTestConfirmation', {
              cart: route.params?.cart || [],
              total: amount,
              paymentMethod: 'razorpay',
            });
          } else {
            navigation.replace('BookingConfirmation', {
              booking: {
                id: appointmentId,
                doctor, date, time, queueNumber, consultationType, patient,
                amount,
                paymentMethod: 'razorpay',
              },
            });
          }
        } catch (e) {
          console.error('❌ Payment success, but navigation failed:', e);
          Alert.alert(
            'Payment Confirmed',
            'Your payment was successful! Your appointment has been booked.\n\nAppointment ID: ' + appointmentId,
            [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
          );
        } finally {
          setVerifying(false);
        }
      } else if (url.includes('payment-failed')) {
        Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.');
        navigation.goBack();
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [appointmentId]);

  const handleNavigationChange = (navState) => {
    const { url } = navState;
    if (!url) return;

    // Intercept deep link inside WebView — only handle healthsync:// (user app scheme)
    if (url.startsWith('healthsync://')) {
      if (url.includes('payment-success')) {
        setVerifying(true);
        if (appointmentId?.startsWith('lab_')) {0
          navigation.replace('LabTestConfirmation', {
            cart: route.params?.cart || [],
            total: amount,
            paymentMethod: 'razorpay',
          });
        } else {
          navigation.replace('BookingConfirmation', {
            booking: {
              id: appointmentId,
              doctor, date, time, queueNumber, consultationType, patient,
              amount,
              paymentMethod: 'razorpay',
            },
          });
        }
      } else if (url.includes('payment-failed')) {
        Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.');
        navigation.goBack();
      }
      return false; // prevent WebView from navigating to deep link
    }
    return true;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => {
            Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
              { text: 'No', style: 'cancel' },
              { text: 'Yes, Cancel', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
          }}
        >
          <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Secure Payment</Text>
          <Text style={[styles.headerSub, { color: colors.success }]}>🔒 Powered by Razorpay</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {verifying ? (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.verifyingText, { color: colors.textPrimary }]}>Confirming your booking...</Text>
          <Text style={[styles.verifyingSubText, { color: colors.textSecondary }]}>Please wait, do not close the app</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl, headers: webViewHeaders }}
          onShouldStartLoadWithRequest={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading payment gateway...</Text>
            </View>
          )}
          onError={() => {
            Alert.alert('Connection Error', 'Could not load payment page. Please check your internet connection.');
            navigation.goBack();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  closeIcon: { fontSize: 14, fontWeight: 'bold' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { ...typography.labelSmall, marginTop: 2 },

  loadingContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },

  verifyingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  verifyingText: { ...typography.headlineSmall, marginTop: spacing.xl, textAlign: 'center' },
  verifyingSubText: { ...typography.bodyMedium, marginTop: spacing.sm, textAlign: 'center' },
});

export default RazorpayPaymentScreen;
