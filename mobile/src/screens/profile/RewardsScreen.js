/**
 * Rewards Screen - Loyalty Points & Offers with points animation, timeline transaction history and card carousel
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';
import { pulse } from '../../utils/animations';
import { shadows } from '../../theme/shadows';

const { width } = Dimensions.get('window');

const RewardsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const styles = makeStyles(colors, isDarkMode);

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

  // Animated points state (for count-up)
  const [displayedPoints, setDisplayedPoints] = useState(0);

  // Pulse animation for the main points card
  const pointsPulseScale = useRef(new Animated.Value(1)).current;

  const fetchRewards = useCallback(async () => {
    try {
      // Fetch loyalty points
      const loyaltyResponse = await apiClient.get('/wallet/loyalty-points').catch(() => ({ data: {} }));
      
      // Fetch available rewards/coupons
      const rewardsResponse = await apiClient.get('/coupons/available').catch(() => ({ data: { coupons: [] } }));
      
      // Fetch points history via the correct endpoint (userId-based)
      const userId = user?._id || user?.id;
      const historyResponse = userId
        ? await apiClient.get(`/loyalty/${userId}`).catch(() => ({ data: {} }))
        : { data: {} };

      const transactions = historyResponse.data?.transactions || [];
      const pts = loyaltyResponse.data?.points || historyResponse.data?.totalPoints || 0;

      setLoyaltyData({
        points: pts,
        pointsValue: loyaltyResponse.data?.pointsValue || Math.floor(pts / 10),
        tier: loyaltyResponse.data?.tier || historyResponse.data?.tier || 'Bronze',
        totalEarned: loyaltyResponse.data?.totalEarned || historyResponse.data?.lifetimePoints || 0,
        totalRedeemed: loyaltyResponse.data?.totalRedeemed || 0,
        history: transactions,
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
  }, [user]);

  const getDefaultRewards = () => [
    { id: '1', title: '₹50 Off', points: 500, icon: '🎫', description: 'On your next consultation' },
    { id: '2', title: 'Free Lab Test', points: 1000, icon: '🧪', description: 'Basic health checkup' },
    { id: '3', title: '₹200 Off', points: 2000, icon: '💰', description: 'On any service' },
    { id: '4', title: 'Premium Checkup', points: 5000, icon: '⭐', description: 'Full body health package' },
  ];

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Points count-up loop
  useEffect(() => {
    if (!loading) {
      let start = 0;
      const end = loyaltyData.points;
      if (start === end) {
        setDisplayedPoints(end);
        return;
      }
      
      const totalMiliseconds = 1000;
      const incrementTime = 25;
      const steps = totalMiliseconds / incrementTime;
      const stepAmount = Math.ceil((end - start) / steps);
      
      let timer = setInterval(() => {
        start += stepAmount;
        if (start >= end) {
          clearInterval(timer);
          setDisplayedPoints(end);
        } else {
          setDisplayedPoints(start);
        }
      }, incrementTime);
      
      return () => clearInterval(timer);
    }
  }, [loading, loyaltyData.points]);

  // Start pulse animation on load
  useEffect(() => {
    if (!loading) {
      pulse(pointsPulseScale, 0.98, 1.02).start();
    }
  }, [loading]);

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Rewards & Benefits</Text>
        <TouchableOpacity onPress={onRefresh} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="refresh" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Pulsing points balance card */}
        <Animated.View style={{ transform: [{ scale: pointsPulseScale }] }}>
          <LinearGradient
            colors={isDarkMode ? ['#4F46E5', '#6366F1'] : ['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsCard}
          >
            <View style={styles.tierBadge}>
              <Text style={styles.tierIcon}>{getTierIcon(loyaltyData.tier)}</Text>
              <Text style={[styles.tierText, { color: getTierColor(loyaltyData.tier) }]}>
                {loyaltyData.tier || 'Bronze'} Tier
              </Text>
            </View>
            
            <Text style={styles.pointsLabel}>Available Balance</Text>
            <Text style={styles.pointsValue}>{displayedPoints.toLocaleString()}</Text>
            <Text style={styles.pointsWorth}>Cash Equivalent: ₹{loyaltyData.pointsValue}</Text>

            {/* Progress to next tier */}
            {nextTier && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressToNextTier}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {loyaltyData.points} / {nextTier.points} pts for {nextTier.name} Status
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats Summary Cards */}
        <View style={styles.statsRow}>
          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{loyaltyData.totalEarned || loyaltyData.points}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lifetime Earned</Text>
          </Card>
          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>🎁</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{loyaltyData.totalRedeemed || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Redeemed</Text>
          </Card>
        </View>

        {/* Horizontal Swipeable Redeem Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Redeem Coupons</Text>
            <Text style={[styles.carouselHint, { color: colors.textMuted }]}>Swipe ← →</Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={width * 0.72 + spacing.md}
            decelerationRate="fast"
          >
            {availableRewards.map((reward) => {
              const canRedeem = loyaltyData.points >= reward.points;
              const isRedeeming = redeeming === reward.id;
              
              return (
                <View 
                  key={reward.id} 
                  style={[
                    styles.rewardCarouselCard,
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: canRedeem ? colors.primary + '30' : colors.surfaceBorder,
                      borderWidth: canRedeem ? 1.5 : 1,
                    }
                  ]}
                >
                  <View style={styles.couponLeft}>
                    <Text style={styles.couponEmoji}>{reward.icon}</Text>
                    <Text style={[styles.couponTitle, { color: colors.textPrimary }]}>{reward.title}</Text>
                    <Text style={[styles.couponDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {reward.description}
                    </Text>
                  </View>

                  {/* Dotted separator block */}
                  <View style={styles.couponDivider}>
                    <View style={[styles.stubNotchTop, { backgroundColor: colors.background }]} />
                    <View style={[styles.stubDottedLine, { borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                    <View style={[styles.stubNotchBottom, { backgroundColor: colors.background }]} />
                  </View>

                  <View style={styles.couponRight}>
                    <Text style={[styles.pointsCostLabel, { color: colors.textMuted }]}>COST</Text>
                    <Text style={[styles.pointsCostValue, { color: colors.primary }]}>{reward.points}</Text>
                    <Text style={[styles.pointsCostUnit, { color: colors.textMuted }]}>Pts</Text>

                    <TouchableOpacity
                      style={[
                        styles.redeemBtn,
                        { 
                          backgroundColor: canRedeem ? colors.primary : (isDarkMode ? '#282F3D' : '#E2E8F0')
                        }
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
                          Redeem
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* How to Earn list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How to Earn Points</Text>
          <Card variant="default" style={[styles.earnListCard, { backgroundColor: colors.surface }]}>
            {[
              { icon: '📅', title: 'Consultations', desc: 'Earn points per online/clinic booking', points: '+50' },
              { icon: '⭐', title: 'Feedback', desc: 'Earn points per verification review', points: '+30' },
              { icon: '👥', title: 'Refer Family', desc: 'Invite family members to join HealthSync', points: '+200' },
              { icon: '🎂', title: 'Birthday', desc: 'Bonus points on your birthday checkup', points: '+500' },
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

        {/* Points Transaction Timeline */}
        {loyaltyData.history?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Points History</Text>
            <View style={styles.timelineContainer}>
              {loyaltyData.history.slice(0, 8).map((item, index) => {
                const isPositive = (item.points || 0) >= 0;
                return (
                  <View key={index} style={styles.timelineItem}>
                    
                    {/* Left node circles */}
                    <View style={styles.timelineLeftNode}>
                      <View style={[
                        styles.timelineCircle,
                        { 
                          backgroundColor: isPositive ? `${colors.success}12` : `${colors.error}12`,
                          borderColor: isPositive ? colors.success : colors.error,
                        }
                      ]}>
                        <Icon 
                          name={isPositive ? 'arrow-up-outline' : 'gift-outline'} 
                          size={14} 
                          color={isPositive ? colors.success : colors.error} 
                        />
                      </View>
                      {index < loyaltyData.history.slice(0, 8).length - 1 && (
                        <View style={[styles.timelineVerticalLine, { backgroundColor: colors.divider }]} />
                      )}
                    </View>

                    {/* Right transaction block */}
                    <View style={styles.timelineContentRight}>
                      <Card variant="default" style={[styles.historyCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.historyHeader}>
                          <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                            {item.description || item.action || item.type}
                          </Text>
                          <Text style={[
                            styles.historyPoints,
                            { color: isPositive ? colors.success : colors.error }
                          ]}>
                            {isPositive ? '+' : ''}{item.points || 0}
                          </Text>
                        </View>
                        <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                          {new Date(item.createdAt || item.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </Card>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 10,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: { ...typography.headlineMedium, fontWeight: '800' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  pointsCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  tierIcon: { fontSize: 15 },
  tierText: { ...typography.labelMedium, fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  pointsLabel: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  pointsValue: { fontSize: 50, fontWeight: '900', color: '#fff', marginVertical: spacing.xs, letterSpacing: -1 },
  pointsWorth: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  progressSection: { width: '100%', marginTop: spacing.xl },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: spacing.sm, fontWeight: '600' },
  
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, padding: spacing.lg, alignItems: 'center', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', ...shadows.sm },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.headlineSmall, fontWeight: '800' },
  statLabel: { ...typography.labelSmall, fontSize: 11, marginTop: 2 },
  
  section: { marginBottom: spacing.xxl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '850' },
  carouselHint: { ...typography.labelSmall, fontWeight: '700' },

  // Rewards Horizontal Carousel
  carouselContainer: { paddingLeft: 2, paddingRight: spacing.xl, paddingVertical: 4 },
  rewardCarouselCard: {
    width: width * 0.72,
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    marginRight: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  couponLeft: {
    flex: 1.5,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  couponEmoji: { fontSize: 26, marginBottom: spacing.xs },
  couponTitle: { ...typography.bodyLarge, fontWeight: '800' },
  couponDesc: { ...typography.bodySmall, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  
  couponDivider: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stubNotchTop: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -8,
  },
  stubDottedLine: {
    flex: 1,
    width: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  stubNotchBottom: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: -8,
  },

  couponRight: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsCostLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  pointsCostValue: { fontSize: 22, fontWeight: '900', marginVertical: 2 },
  pointsCostUnit: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: spacing.md },
  redeemBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
    ...shadows.sm,
  },
  redeemText: { fontSize: 11, fontWeight: '800' },

  // How to earn card
  earnListCard: { borderRadius: borderRadius.xl, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', ...shadows.sm },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  earnIcon: { fontSize: 24, marginRight: spacing.md },
  earnInfo: { flex: 1 },
  earnTitle: { ...typography.bodyLarge, fontWeight: '750' },
  earnDesc: { ...typography.bodySmall, fontSize: 12, marginTop: 2 },
  earnPoints: { ...typography.labelMedium, fontWeight: '800' },

  // Timeline points history
  timelineContainer: { marginTop: spacing.sm, paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', minHeight: 75 },
  timelineLeftNode: { width: 40, alignItems: 'center' },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  timelineVerticalLine: { width: 1.5, flex: 1, marginVertical: 4 },
  timelineContentRight: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.md },
  historyCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', ...shadows.sm },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { ...typography.bodyMedium, fontWeight: '700' },
  historyPoints: { fontSize: 15, fontWeight: '800' },
  historyDate: { ...typography.labelSmall, fontSize: 10.5, marginTop: 4 },
});

export default RewardsScreen;
