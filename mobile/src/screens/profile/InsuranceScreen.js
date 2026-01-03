/**
 * Insurance Screen - Manage insurance policies
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const InsuranceScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [policies, setPolicies] = useState([]);

  const fetchPolicies = useCallback(async () => {
    try {
      // Note: Backend doesn't have patient insurance endpoint yet
      // This will gracefully fail and show empty state
      const response = await apiClient.get(`/insurance/patient/${user?.id || user?._id}`).catch(() => null);
      if (response?.data?.policies) {
        setPolicies(response.data.policies);
      } else {
        // No policies endpoint - show empty state
        setPolicies([]);
      }
    } catch (error) {
      // Expected to fail - endpoint doesn't exist yet
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPolicies();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Insurance</Text>
        <TouchableOpacity onPress={() => Alert.alert('Add Insurance', 'Feature coming soon')}>
          <Icon name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        
        {policies.length > 0 ? (
          policies.map((policy, index) => {
            const expired = isExpired(policy.expiryDate);
            const expiringSoon = isExpiringSoon(policy.expiryDate);
            
            return (
              <Card key={policy._id || index} variant="default" style={[styles.policyCard, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={expired ? ['#ef4444', '#dc2626'] : expiringSoon ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
                  style={styles.policyHeader}>
                  <Text style={styles.policyProvider}>{policy.provider || 'Insurance Provider'}</Text>
                  <Text style={styles.policyType}>{policy.type || 'Health Insurance'}</Text>
                </LinearGradient>
                
                <View style={styles.policyBody}>
                  <View style={styles.policyRow}>
                    <Text style={[styles.policyLabel, { color: colors.textSecondary }]}>Policy Number</Text>
                    <Text style={[styles.policyValue, { color: colors.textPrimary }]}>{policy.policyNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.policyRow}>
                    <Text style={[styles.policyLabel, { color: colors.textSecondary }]}>Coverage</Text>
                    <Text style={[styles.policyValue, { color: colors.textPrimary }]}>₹{(policy.coverageAmount || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.policyRow}>
                    <Text style={[styles.policyLabel, { color: colors.textSecondary }]}>Valid Until</Text>
                    <Text style={[styles.policyValue, { color: expired ? colors.error : expiringSoon ? colors.warning : colors.textPrimary }]}>
                      {formatDate(policy.expiryDate)}
                      {expired && ' (Expired)'}
                      {expiringSoon && ' (Expiring Soon)'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.policyActions}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]}>
                    <Text style={[styles.actionText, { color: colors.primary }]}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.actionText, { color: '#fff' }]}>File Claim</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Insurance Added</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Add your insurance details for cashless claims and easy reimbursements
            </Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => Alert.alert('Add Insurance', 'Feature coming soon')}>
              <Text style={styles.addBtnText}>Add Insurance</Text>
            </TouchableOpacity>
          </View>
        )}

        <Card variant="default" style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Why add insurance?</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Cashless treatment at network hospitals{'\n'}
            • Quick claim processing{'\n'}
            • Track all your policies in one place
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineMedium },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  policyCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  policyHeader: { padding: spacing.lg },
  policyProvider: { ...typography.headlineSmall, color: '#fff' },
  policyType: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  policyBody: { padding: spacing.lg },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  policyLabel: { ...typography.bodySmall },
  policyValue: { ...typography.bodyMedium, fontWeight: '500' },
  policyActions: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingTop: 0 },
  actionBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  actionText: { ...typography.labelMedium, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineSmall, marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.lg },
  addBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  addBtnText: { ...typography.button, color: '#fff' },
  infoCard: { padding: spacing.lg, marginTop: spacing.lg },
  infoIcon: { fontSize: 24, marginBottom: spacing.sm },
  infoTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.sm },
  infoText: { ...typography.bodySmall, lineHeight: 22 },
});

export default InsuranceScreen;
