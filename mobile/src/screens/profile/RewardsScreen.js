/**
 * Rewards Screen - Loyalty Points & Offers with real API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const RewardsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [loyaltyData, setLoyaltyData] = useState({
    points: 0,
    pointsValue: 0,
    tier: 'Bronze',
    totalEarned: 0,
    totalRedeemed: 0,
    history: [],
  });
  const [availableRewards, setAvailableRewards] = useState([]);

  const fetchRewards = useCallback(async () => {
    try {
      // Fetch loyalty points
      const loyaltyResponse = await apiClient.get('/wallet/loyalty-points').catch(() => ({ data: {} }));
      
      // Fetch available rewards/coupons
      const rewardsResponse = await apiClient.get('/coupons/available').catch(() => ({ data: { coupons: [] } }));
      
      // Fetch points history
      const historyResponse = await apiClient.get('/loyalty/history').catch(() => ({ data: { history: [] } }));

      setLoyaltyData({
        points: loyaltyResponse.data?.points || 0,
        pointsValue: loyaltyResponse.data?.pointsValue || Math.floor((loyaltyResponse.data?.points || 0) / 10),
        tier: loyaltyResponse.data?.tier || 'Bronze',
        totalEarned: loyaltyResponse.data?.totalEarned || 0,
        totalRedeemed: loyaltyResponse.data?.totalRedeemed || 0,
        history: historyResponse.data?.history || [],
      });

      // Map coupons to rewards format or use defaults
      const rewards = rewardsResponse.data?.coupons?.length > 0 
        ? rewardsResponse.data.coupons.map(c => ({
            id: c._id,
            title: c.code,
            points: c.pointsRequired || 500,
            icon: '🎫',
            description: c.description || `${c.discountType === 'percentage' ? c.discountValue + '%' : '₹' + c.discountValue} off`,
            discountValue: c.discountValue,
            discountType: c.discountType,
          }))
        : getDefaultRewards();

      setAvailableRewards(rewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setAvailableRewards(getDefaultRewards());
    } finally {
      setLoading(false);
    }
  }, []);

  const getDefaultRewards = () => [
    { id: '1', title: '₹50 Off', points: 500, icon: '🎫', description: 'On your next consultation' },
    { id: '2', title: 'Free Lab Test', points: 1000, icon: '🧪', description: 'Basic health checkup' },
    { id: '3', title: '₹200 Off', points: 2000, icon: '💰', description: 'On any service' },
    { id: '4', title: 'Premium Checkup', points: 5000, icon: '⭐', description: 'Full body health package' },
  ];

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRewards();
    setRefreshing(false);
  };

  const handleRedeem = async (reward) => {
    if (loyaltyData.points < reward.points) {
      Alert.alert('Insufficient Points', `You need ${reward.points - loyaltyData.points} more points to redeem this reward.`);
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.title}" for ${reward.points} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeeming(reward.id);
            try {
              const response = await apiClient.post('/wallet/redeem-points', {
                points: reward.points,
                rewardId: reward.id,
                rewardTitle: reward.title,
              });

              if (response.data?.success) {
                Alert.alert('Success! 🎉', `You've redeemed "${reward.title}"! Check your wallet for the coupon.`);
                fetchRewards(); // Refresh data
              } else {
                Alert.alert('Error', response.data?.message || 'Failed to redeem reward');
              }
            } catch (error) {
              console.error('Redeem error:', error);
              Alert.alert('Error', 'Failed to redeem reward. Please try again.');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'platinum': return '#E5E4E2';
      default: return '#CD7F32';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'gold': return '👑';
      case 'silver': return '🥈';
      case 'platinum': return '💎';
      default: return '🥉';
    }
  };

  const getNextTier = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return { name: 'Silver', points: 1000 };
      case 'silver': return { name: 'Gold', points: 5000 };
      case 'gold': return { name: 'Platinum', points: 10000 };
      default: return null;
    }
  };

  const nextTier = getNextTier(loyaltyData.tier);
  const progressToNextTier = nextTier ? Math.min((loyaltyData.points / nextTier.points) * 100, 100) : 100;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Rewards</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Points Card */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pointsCard}
        >
          <View style={styles.tierBadge}>
            <Text style={styles.tierIcon}>{getTierIcon(loyaltyData.tier)}</Text>
            <Text style={[styles.tierText, { color: getTierColor(loyaltyData.tier) }]}>
              {loyaltyData.tier || 'Bronze'} Member
            </Text>
          </View>
          
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{loyaltyData.points?.toLocaleString() || 0}</Text>
          <Text style={styles.pointsWorth}>Worth ₹{loyaltyData.pointsValue || 0}</Text>

          {/* Progress to next tier */}
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressToNextTier}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {loyaltyData.points}/{nextTier.points} points to {nextTier.name}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{loyaltyData.totalEarned || loyaltyData.points}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Earned</Text>
          </Card>
          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>🎁</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{loyaltyData.totalRedeemed || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Redeemed</Text>
          </Card>
        </View>

        {/* How to Earn */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How to Earn Points</Text>
          <Card variant="default" style={{ backgroundColor: colors.surface }}>
            {[
              { icon: '📅', title: 'Book Appointment', desc: 'Earn 50 points per booking', points: '+50' },
              { icon: '⭐', title: 'Leave a Review', desc: 'Earn 30 points per review', points: '+30' },
              { icon: '👥', title: 'Refer a Friend', desc: 'Earn 200 points per referral', points: '+200' },
              { icon: '🎂', title: 'Birthday Bonus', desc: 'Get 500 bonus points on your birthday', points: '+500' },
            ].map((item, index) => (
              <View key={index} style={[styles.earnItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Text style={styles.earnIcon}>{item.icon}</Text>
                <View style={styles.earnInfo}>
                  <Text style={[styles.earnTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.earnDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
                <Text style={[styles.earnPoints, { color: colors.success }]}>{item.points}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Redeem Rewards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Redeem Rewards</Text>
          {availableRewards.map((reward) => {
            const canRedeem = loyaltyData.points >= reward.points;
            const isRedeeming = redeeming === reward.id;
            
            return (
              <Card key={reward.id} variant="default" style={[styles.rewardCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.rewardIcon}>{reward.icon}</Text>
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardTitle, { color: colors.textPrimary }]}>{reward.title}</Text>
                  <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>{reward.description}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.redeemBtn,
                    canRedeem
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surfaceLight }
                  ]}
                  onPress={() => handleRedeem(reward)}
                  disabled={!canRedeem || isRedeeming}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[
                      styles.redeemText,
                      { color: canRedeem ? '#fff' : colors.textMuted }
                    ]}>
                      {reward.points} pts
                    </Text>
                  )}
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>

        {/* Recent Activity */}
        {loyaltyData.history?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <Card variant="default" style={{ backgroundColor: colors.surface }}>
              {loyaltyData.history.slice(0, 5).map((item, index) => (
                <View key={index} style={[styles.historyItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{item.description || item.action}</Text>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                      {new Date(item.createdAt || item.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.historyPoints,
                    { color: item.points > 0 ? colors.success : colors.error }
                  ]}>
                    {item.points > 0 ? '+' : ''}{item.points}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.headlineMedium },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  pointsCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  tierIcon: { fontSize: 16 },
  tierText: { ...typography.labelMedium, fontWeight: '600' },
  pointsLabel: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  pointsValue: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginVertical: spacing.sm },
  pointsWorth: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  progressSection: { width: '100%', marginTop: spacing.lg },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  statCard: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.headlineSmall },
  statLabel: { ...typography.labelSmall },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  earnIcon: { fontSize: 24, marginRight: spacing.md },
  earnInfo: { flex: 1 },
  earnTitle: { ...typography.bodyLarge, fontWeight: '500' },
  earnDesc: { ...typography.bodySmall, marginTop: 2 },
  earnPoints: { ...typography.labelMedium, fontWeight: '600' },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rewardIcon: { fontSize: 32, marginRight: spacing.md },
  rewardInfo: { flex: 1 },
  rewardTitle: { ...typography.bodyLarge, fontWeight: '600' },
  rewardDesc: { ...typography.bodySmall, marginTop: 2 },
  redeemBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  redeemText: { ...typography.labelMedium, fontWeight: '600' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  historyInfo: { flex: 1 },
  historyTitle: { ...typography.bodyMedium },
  historyDate: { ...typography.labelSmall, marginTop: 2 },
  historyPoints: { ...typography.bodyLarge, fontWeight: '600' },
});

export default RewardsScreen;
