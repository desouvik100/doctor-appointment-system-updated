/**
 * Lab Tests Screen - With API integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import apiClient from '../../services/api/apiClient';
import { useUser } from '../../context/UserContext';

const LabTestsScreen = ({ navigation }) => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popularTests, setPopularTests] = useState([]);
  const [healthPackages, setHealthPackages] = useState([]);

  // Default data as fallback
  const defaultTests = [
    { _id: '1', name: 'Complete Blood Count (CBC)', price: 299, originalPrice: 450, discount: 33, icon: '🩸', category: 'blood' },
    { _id: '2', name: 'Thyroid Profile (T3, T4, TSH)', price: 499, originalPrice: 800, discount: 38, icon: '🦋', category: 'hormone' },
    { _id: '3', name: 'Lipid Profile', price: 399, originalPrice: 600, discount: 33, icon: '❤️', category: 'heart' },
    { _id: '4', name: 'Liver Function Test (LFT)', price: 449, originalPrice: 700, discount: 36, icon: '🫁', category: 'organ' },
    { _id: '5', name: 'Kidney Function Test (KFT)', price: 399, originalPrice: 650, discount: 39, icon: '🫘', category: 'organ' },
    { _id: '6', name: 'HbA1c (Diabetes)', price: 349, originalPrice: 500, discount: 30, icon: '🍬', category: 'diabetes' },
    { _id: '7', name: 'Vitamin D Test', price: 599, originalPrice: 900, discount: 33, icon: '☀️', category: 'vitamin' },
    { _id: '8', name: 'Vitamin B12 Test', price: 449, originalPrice: 700, discount: 36, icon: '💊', category: 'vitamin' },
  ];

  const defaultPackages = [
    {
      _id: 'basic',
      name: 'Basic Health Checkup',
      tests: 45,
      price: 999,
      originalPrice: 2500,
      discount: 60,
      includes: ['CBC', 'Lipid Profile', 'Liver Function', 'Kidney Function', 'Thyroid'],
      popular: true,
    },
    {
      _id: 'comprehensive',
      name: 'Comprehensive Health Package',
      tests: 78,
      price: 1999,
      originalPrice: 5000,
      discount: 60,
      includes: ['All Basic Tests', 'Vitamin Panel', 'Hormone Tests', 'Cancer Markers'],
      popular: false,
    },
    {
      _id: 'senior',
      name: 'Senior Citizen Package',
      tests: 92,
      price: 2499,
      originalPrice: 6500,
      discount: 62,
      includes: ['Full Body Checkup', 'Heart Health', 'Bone Health', 'Eye & Ear Tests'],
      popular: false,
    },
  ];

  const fetchLabTests = useCallback(async () => {
    try {
      const [testsRes, packagesRes] = await Promise.all([
        apiClient.get('/lab-tests/available').catch(() => ({ data: null })),
        apiClient.get('/lab-tests/packages').catch(() => ({ data: null })),
      ]);

      setPopularTests(testsRes.data?.tests || defaultTests);
      setHealthPackages(packagesRes.data?.packages || defaultPackages);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      setPopularTests(defaultTests);
      setHealthPackages(defaultPackages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLabTests();
  };

  const addToCart = (item) => {
    if (!cart.find(c => c._id === item._id)) {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c._id !== itemId));
  };

  const isInCart = (itemId) => cart.some(c => c._id === itemId);

  const getTestIcon = (test) => {
    if (test.icon) return test.icon;
    const icons = {
      blood: '🩸',
      hormone: '🦋',
      heart: '❤️',
      organ: '🫁',
      diabetes: '🍬',
      vitamin: '💊',
    };
    return icons[test.category] || '🧪';
  };

  const filteredTests = searchQuery
    ? popularTests.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : popularTests;

  const handleBookNow = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add tests to your cart first');
      return;
    }
    
    navigation.navigate('LabTestBooking', { 
      tests: cart,
      total: cart.reduce((sum, item) => sum + item.price, 0),
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Tests</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => cart.length > 0 && handleBookNow()}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tests, packages..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Banner */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Home Sample Collection</Text>
            <Text style={styles.bannerSubtitle}>Free pickup • Reports in 24hrs</Text>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>SAFE & HYGIENIC</Text>
            </View>
          </View>
          <Text style={styles.bannerEmoji}>🧪</Text>
        </LinearGradient>

        {/* Health Packages */}
        {!searchQuery && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Health Packages</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {healthPackages.map((pkg) => (
                <Card key={pkg._id} variant="gradient" style={styles.packageCard}>
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageTests}>{pkg.tests} Tests Included</Text>
                  
                  <View style={styles.packageIncludes}>
                    {pkg.includes.slice(0, 3).map((item, idx) => (
                      <Text key={idx} style={styles.includeItem}>✓ {item}</Text>
                    ))}
                    {pkg.includes.length > 3 && (
                      <Text style={styles.moreTests}>+{pkg.includes.length - 3} more</Text>
                    )}
                  </View>

                  <View style={styles.priceRow}>
                    <View>
                      <Text style={styles.originalPrice}>₹{pkg.originalPrice}</Text>
                      <Text style={styles.price}>₹{pkg.price}</Text>
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{pkg.discount}% OFF</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.addBtn, isInCart(pkg._id) && styles.addedBtn]}
                    onPress={() => isInCart(pkg._id) ? removeFromCart(pkg._id) : addToCart(pkg)}
                  >
                    <Text style={[styles.addBtnText, isInCart(pkg._id) && styles.addedBtnText]}>
                      {isInCart(pkg._id) ? '✓ Added' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : 'Popular Tests'}</Text>
          
          {filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <Card key={test._id} variant="default" style={styles.testCard}>
                <View style={styles.testRow}>
                  <View style={styles.testIcon}>
                    <Text style={styles.testEmoji}>{getTestIcon(test)}</Text>
                  </View>
                  <View style={styles.testInfo}>
                    <Text style={styles.testName}>{test.name}</Text>
                    <View style={styles.testPriceRow}>
                      <Text style={styles.testOriginalPrice}>₹{test.originalPrice}</Text>
                      <Text style={styles.testPrice}>₹{test.price}</Text>
                      <View style={styles.testDiscount}>
                        <Text style={styles.testDiscountText}>{test.discount}% OFF</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.testAddBtn, isInCart(test._id) && styles.testAddedBtn]}
                    onPress={() => isInCart(test._id) ? removeFromCart(test._id) : addToCart(test)}
                  >
                    <Text style={[styles.testAddBtnText, isInCart(test._id) && styles.testAddedBtnText]}>
                      {isInCart(test._id) ? '✓' : '+'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="default" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tests found for "{searchQuery}"</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItems}>{cart.length} items</Text>
            <Text style={styles.cartTotal}>
              ₹{cart.reduce((sum, item) => sum + item.price, 0)}
            </Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleBookNow}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.checkoutBtnGradient}
            >
              <Text style={styles.checkoutBtnText}>Book Now</Text>
              <Text style={styles.checkoutArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  cartBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  cartIcon: { fontSize: 20 },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { ...typography.labelSmall, color: colors.textInverse, fontSize: 10 },
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.surfaceBorder },
  searchIcon: { fontSize: 18, marginRight: spacing.md },
  searchInput: { flex: 1, ...typography.bodyLarge, color: colors.textPrimary, paddingVertical: spacing.md },
  clearIcon: { fontSize: 16, color: colors.textMuted, padding: spacing.sm },
  scrollContent: { paddingBottom: 100 },
  banner: { marginHorizontal: spacing.xl, borderRadius: borderRadius.xl, padding: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  bannerContent: { flex: 1 },
  bannerTitle: { ...typography.headlineMedium, color: colors.textInverse, marginBottom: spacing.xs },
  bannerSubtitle: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  bannerBadgeText: { ...typography.labelSmall, color: colors.textInverse, fontWeight: '600' },
  bannerEmoji: { fontSize: 48 },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  seeAll: { ...typography.labelMedium, color: colors.primary },
  packageCard: { width: 280, marginLeft: spacing.xl, padding: spacing.lg },
  popularBadge: { position: 'absolute', top: spacing.md, right: spacing.md, backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  popularText: { ...typography.labelSmall, color: colors.textInverse, fontSize: 10, fontWeight: '700' },
  packageName: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  packageTests: { ...typography.bodyMedium, color: colors.primary, marginBottom: spacing.md },
  packageIncludes: { marginBottom: spacing.md },
  includeItem: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 2 },
  moreTests: { ...typography.labelSmall, color: colors.primary, marginTop: spacing.xs },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  originalPrice: { ...typography.bodySmall, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { ...typography.headlineMedium, color: colors.textPrimary },
  discountBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  discountText: { ...typography.labelSmall, color: colors.success, fontWeight: '600' },
  addBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  addedBtn: { backgroundColor: colors.success },
  addBtnText: { ...typography.buttonSmall, color: colors.textInverse },
  addedBtnText: { color: colors.textInverse },
  testCard: { marginHorizontal: spacing.xl, marginBottom: spacing.md, padding: spacing.md },
  testRow: { flexDirection: 'row', alignItems: 'center' },
  testIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  testEmoji: { fontSize: 24 },
  testInfo: { flex: 1 },
  testName: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500', marginBottom: spacing.xs },
  testPriceRow: { flexDirection: 'row', alignItems: 'center' },
  testOriginalPrice: { ...typography.labelSmall, color: colors.textMuted, textDecorationLine: 'line-through', marginRight: spacing.sm },
  testPrice: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600', marginRight: spacing.sm },
  testDiscount: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: spacing.xs, paddingVertical: 1, borderRadius: borderRadius.sm },
  testDiscountText: { ...typography.labelSmall, color: colors.success, fontSize: 10 },
  testAddBtn: { width: 36, height: 36, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  testAddedBtn: { backgroundColor: colors.success },
  testAddBtnText: { fontSize: 20, color: colors.textInverse, fontWeight: '300' },
  testAddedBtnText: { fontSize: 16 },
  emptyCard: { marginHorizontal: spacing.xl, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.bodyMedium, color: colors.textMuted },
  cartFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundCard, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.surfaceBorder, ...shadows.large },
  cartInfo: {},
  cartItems: { ...typography.labelSmall, color: colors.textMuted },
  cartTotal: { ...typography.headlineMedium, color: colors.textPrimary },
  checkoutBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  checkoutBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  checkoutBtnText: { ...typography.button, color: colors.textInverse, marginRight: spacing.sm },
  checkoutArrow: { fontSize: 18, color: colors.textInverse },
});

export default LabTestsScreen;
