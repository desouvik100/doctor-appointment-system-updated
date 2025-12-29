/**
 * Medicine Screen - Order Medicines
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';

const MedicineScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const categories = [
    { id: 'all', label: 'All', icon: '💊' },
    { id: 'prescription', label: 'Prescription', icon: '📋' },
    { id: 'otc', label: 'OTC', icon: '🏪' },
    { id: 'vitamins', label: 'Vitamins', icon: '💪' },
    { id: 'personal', label: 'Personal Care', icon: '🧴' },
    { id: 'devices', label: 'Devices', icon: '🩺' },
  ];

  const featuredMedicines = [
    { id: '1', name: 'Paracetamol 500mg', brand: 'Crocin', price: 25, originalPrice: 35, quantity: '15 tablets', icon: '💊' },
    { id: '2', name: 'Vitamin D3 60000IU', brand: 'Calcirol', price: 120, originalPrice: 150, quantity: '4 capsules', icon: '☀️' },
    { id: '3', name: 'Cetirizine 10mg', brand: 'Zyrtec', price: 45, originalPrice: 60, quantity: '10 tablets', icon: '🤧' },
    { id: '4', name: 'Omeprazole 20mg', brand: 'Omez', price: 85, originalPrice: 110, quantity: '15 capsules', icon: '💊' },
    { id: '5', name: 'Multivitamin', brand: 'Supradyn', price: 180, originalPrice: 220, quantity: '30 tablets', icon: '💪' },
    { id: '6', name: 'Azithromycin 500mg', brand: 'Azithral', price: 95, originalPrice: 120, quantity: '3 tablets', icon: '💊' },
  ];

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const getCartQty = (itemId) => {
    const item = cart.find(c => c.id === itemId);
    return item ? item.qty : 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicines</Text>
        <TouchableOpacity style={styles.cartBtn}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines, health products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Upload Prescription Banner */}
        <TouchableOpacity>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadBanner}
          >
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>Upload Prescription</Text>
              <Text style={styles.uploadSubtitle}>Get medicines delivered to your doorstep</Text>
              <View style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>📷 Upload Now</Text>
              </View>
            </View>
            <Text style={styles.uploadEmoji}>📋</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Reorder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Reorder</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View History</Text>
            </TouchableOpacity>
          </View>
          <Card variant="gradient" style={styles.reorderCard}>
            <View style={styles.reorderRow}>
              <View style={styles.reorderInfo}>
                <Text style={styles.reorderTitle}>Your Last Order</Text>
                <Text style={styles.reorderDate}>Dec 15, 2025 • 5 items</Text>
              </View>
              <TouchableOpacity style={styles.reorderBtn}>
                <Text style={styles.reorderBtnText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Featured Medicines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Medicines</Text>
          <View style={styles.medicinesGrid}>
            {featuredMedicines.map((med) => (
              <Card key={med.id} variant="default" style={styles.medicineCard}>
                <View style={styles.medicineIcon}>
                  <Text style={styles.medicineEmoji}>{med.icon}</Text>
                </View>
                <Text style={styles.medicineName} numberOfLines={2}>{med.name}</Text>
                <Text style={styles.medicineBrand}>{med.brand}</Text>
                <Text style={styles.medicineQty}>{med.quantity}</Text>
                <View style={styles.medicinePriceRow}>
                  <Text style={styles.medicinePrice}>₹{med.price}</Text>
                  <Text style={styles.medicineOriginal}>₹{med.originalPrice}</Text>
                </View>
                
                {getCartQty(med.id) > 0 ? (
                  <View style={styles.qtyControl}>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => {
                        const qty = getCartQty(med.id);
                        if (qty === 1) {
                          setCart(cart.filter(c => c.id !== med.id));
                        } else {
                          setCart(cart.map(c => c.id === med.id ? { ...c, qty: c.qty - 1 } : c));
                        }
                      }}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{getCartQty(med.id)}</Text>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => addToCart(med)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => addToCart(med)}
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))}
          </View>
        </View>

        {/* Health Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <Card variant="gradient" style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Medicine Storage</Text>
              <Text style={styles.tipText}>Store medicines in a cool, dry place away from direct sunlight.</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItems}>{cartCount} items</Text>
            <Text style={styles.cartTotal}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.checkoutBtnGradient}
            >
              <Text style={styles.checkoutBtnText}>Checkout</Text>
              <Text style={styles.checkoutArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    ...typography.labelSmall,
    color: colors.textInverse,
    fontSize: 10,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  uploadBanner: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  uploadContent: {
    flex: 1,
  },
  uploadTitle: {
    ...typography.headlineMedium,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  uploadSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: spacing.md,
  },
  uploadBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  uploadBtnText: {
    ...typography.labelMedium,
    color: colors.textInverse,
    fontWeight: '600',
  },
  uploadEmoji: {
    fontSize: 48,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  seeAll: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  categoryCard: {
    alignItems: 'center',
    marginLeft: spacing.xl,
    width: 72,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reorderCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reorderInfo: {},
  reorderTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  reorderDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  reorderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  reorderBtnText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  medicinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  medicineCard: {
    width: '47%',
    padding: spacing.md,
    alignItems: 'center',
  },
  medicineIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  medicineEmoji: {
    fontSize: 32,
  },
  medicineName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  medicineBrand: {
    ...typography.labelSmall,
    color: colors.primary,
    marginBottom: 2,
  },
  medicineQty: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  medicinePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medicinePrice: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  medicineOriginal: {
    ...typography.labelSmall,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  addBtnText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  qtyBtnText: {
    fontSize: 18,
    color: colors.textInverse,
    fontWeight: '600',
  },
  qtyText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
  },
  tipCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    ...shadows.large,
  },
  cartInfo: {},
  cartItems: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  cartTotal: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  checkoutBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  checkoutBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  checkoutBtnText: {
    ...typography.button,
    color: colors.textInverse,
    marginRight: spacing.sm,
  },
  checkoutArrow: {
    fontSize: 18,
    color: colors.textInverse,
  },
});

export default MedicineScreen;
