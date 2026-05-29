/**
 * Pharmacy Inventory Screen — Enterprise Drug Stock Management
 * Summary stats, search, category/status filters, drug detail with transaction history
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import {
  getPharmacyInventory, getPharmacySummary, getLowStockItems,
  getPharmacyItem, searchMedicines,
} from '../../services/api/pharmacyApi';

const CATEGORIES = ['all', 'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'powder', 'other'];
const STOCK_FILTERS = [
  { key: 'all',        label: 'All',       color: '#6B7280' },
  { key: 'in_stock',   label: 'In Stock',  color: '#10B981' },
  { key: 'low_stock',  label: 'Low Stock', color: '#F59E0B' },
  { key: 'out_of_stock', label: 'Out',     color: '#EF4444' },
];

const stockColor = (status) => {
  if (status === 'in_stock')    return '#10B981';
  if (status === 'low_stock')   return '#F59E0B';
  if (status === 'reorder')     return '#F97316';
  if (status === 'out_of_stock') return '#EF4444';
  return '#6B7280';
};

const stockLabel = (status) => {
  if (status === 'in_stock')    return 'In Stock';
  if (status === 'low_stock')   return 'Low Stock';
  if (status === 'reorder')     return 'Reorder';
  if (status === 'out_of_stock') return 'Out of Stock';
  return status || '—';
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const soldCount = (transactions = []) =>
  transactions.filter(t => t.type === 'sale' || t.type === 'dispense').reduce((s, t) => s + (t.quantity || 0), 0);

// ─── Drug Detail Modal ────────────────────────────────────────────────────────
const DrugDetailModal = ({ item, visible, onClose, colors }) => {
  const [detail, setDetail] = useState(item);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && item?._id) {
      setLoading(true);
      getPharmacyItem(item._id)
        .then(d => setDetail(d.item || item))
        .catch(() => setDetail(item))
        .finally(() => setLoading(false));
    }
  }, [visible, item?._id]);

  if (!item) return null;

  const sold = soldCount(detail?.transactions);
  const txns = (detail?.transactions || []).slice(-10).reverse();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modalStyles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient colors={colors.primaryGradient || colors.gradientPrimary || ['#00D4AA', '#00B894']} style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Text style={modalStyles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <View style={modalStyles.headerCenter}>
            <Text style={modalStyles.headerTitle}>{detail?.medicineName}</Text>
            <Text style={modalStyles.headerSub}>{detail?.genericName || detail?.brandName || ''}</Text>
          </View>
          <View style={[modalStyles.statusBadge, { backgroundColor: stockColor(detail?.stockStatus) + '33' }]}>
            <Text style={[modalStyles.statusText, { color: stockColor(detail?.stockStatus) }]}>
              {stockLabel(detail?.stockStatus)}
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={modalStyles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={modalStyles.scroll} showsVerticalScrollIndicator={false}>
            {/* Key Stats */}
            <View style={modalStyles.statsRow}>
              {[
                { icon: '📦', val: detail?.currentStock ?? '—', label: 'In Stock', color: '#10B981' },
                { icon: '🛒', val: sold,                         label: 'Total Sold', color: '#3B82F6' },
                { icon: '⚠️', val: detail?.minStockLevel ?? '—', label: 'Min Level', color: '#F59E0B' },
                { icon: '🔄', val: detail?.reorderLevel ?? '—',  label: 'Reorder At', color: '#8B5CF6' },
              ].map((s, i) => (
                <View key={i} style={[modalStyles.statCard, { backgroundColor: colors.surface }]}>
                  <Text style={modalStyles.statIcon}>{s.icon}</Text>
                  <Text style={[modalStyles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[modalStyles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Details */}
            <View style={[modalStyles.detailCard, { backgroundColor: colors.surface }]}>
              {[
                ['Category',    detail?.category],
                ['Strength',    detail?.strength],
                ['Unit',        detail?.unit],
                ['Manufacturer',detail?.manufacturer],
                ['Supplier',    detail?.supplier],
                ['Schedule',    detail?.scheduleType],
                ['Expiry',      formatDate(detail?.expiryDate)],
                ['Cost Price',  detail?.costPrice ? `₹${detail.costPrice}` : '—'],
                ['Selling Price',detail?.sellingPrice ? `₹${detail.sellingPrice}` : '—'],
                ['MRP',         detail?.mrp ? `₹${detail.mrp}` : '—'],
                ['Rx Required', detail?.requiresPrescription ? 'Yes' : 'No'],
              ].map(([k, v]) => v && v !== '—' ? (
                <View key={k} style={modalStyles.detailRow}>
                  <Text style={[modalStyles.detailKey, { color: colors.textMuted }]}>{k}</Text>
                  <Text style={[modalStyles.detailVal, { color: colors.textPrimary }]}>{v}</Text>
                </View>
              ) : null)}
            </View>

            {/* Transaction History */}
            {txns.length > 0 && (
              <View style={modalStyles.section}>
                <Text style={[modalStyles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
                {txns.map((t, i) => (
                  <View key={i} style={[modalStyles.txnRow, { backgroundColor: colors.surface }]}>
                    <View style={[modalStyles.txnDot, {
                      backgroundColor: (t.type === 'sale' || t.type === 'dispense') ? '#EF444420' : '#10B98120'
                    }]}>
                      <Text style={modalStyles.txnDotIcon}>
                        {(t.type === 'sale' || t.type === 'dispense') ? '↓' : '↑'}
                      </Text>
                    </View>
                    <View style={modalStyles.txnInfo}>
                      <Text style={[modalStyles.txnType, { color: colors.textPrimary }]}>
                        {t.type === 'sale' ? 'Sale' : t.type === 'dispense' ? 'Dispensed' : t.type === 'purchase' ? 'Purchase' : t.type || 'Transaction'}
                      </Text>
                      <Text style={[modalStyles.txnDate, { color: colors.textMuted }]}>{formatDate(t.date || t.createdAt)}</Text>
                    </View>
                    <Text style={[modalStyles.txnQty, {
                      color: (t.type === 'sale' || t.type === 'dispense') ? '#EF4444' : '#10B981'
                    }]}>
                      {(t.type === 'sale' || t.type === 'dispense') ? '-' : '+'}{t.quantity}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

// ─── Drug Card ────────────────────────────────────────────────────────────────
const DrugCard = React.memo(({ item, onPress, colors }) => {
  const status = item.stockStatus;
  const color = stockColor(status);
  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.75}
      style={[cardStyles.card, { backgroundColor: colors.surface, borderLeftColor: color }]}>
      <View style={cardStyles.top}>
        <View style={cardStyles.nameBlock}>
          <Text style={[cardStyles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.medicineName}</Text>
          {item.genericName ? (
            <Text style={[cardStyles.generic, { color: colors.textMuted }]} numberOfLines={1}>{item.genericName}</Text>
          ) : null}
        </View>
        <View style={[cardStyles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[cardStyles.badgeText, { color }]}>{stockLabel(status)}</Text>
        </View>
      </View>
      <View style={cardStyles.bottom}>
        <Text style={[cardStyles.meta, { color: colors.textSecondary }]}>
          {item.strength || '—'} · {item.category}
        </Text>
        <View style={cardStyles.right}>
          <Text style={[cardStyles.stock, { color: colors.textPrimary }]}>
            <Text style={{ color }}>●</Text> {item.currentStock} {item.unit || 'units'}
          </Text>
          {item.sellingPrice ? (
            <Text style={[cardStyles.price, { color: colors.textMuted }]}>₹{item.sellingPrice}</Text>
          ) : null}
        </View>
      </View>
      {item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 86400000) && (
        <Text style={cardStyles.expiry}>⚠️ Expires {formatDate(item.expiryDate)}</Text>
      )}
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const PharmacyInventoryScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const clinicId = useMemo(() => {
    if (!user?.clinicId) return null;
    return typeof user.clinicId === 'object' ? user.clinicId._id : user.clinicId;
  }, [user?.clinicId]);

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary]       = useState(null);
  const [items, setItems]           = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching]   = useState(false);
  const [category, setCategory]     = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!clinicId) return;
    try {
      const d = await getPharmacySummary(clinicId);
      setSummary(d.summary || d);
    } catch {}
  }, [clinicId]);

  const fetchItems = useCallback(async (reset = false) => {
    if (!clinicId) { setLoading(false); return; }
    const currentPage = reset ? 1 : page;
    if (!reset) setLoadingMore(true);
    try {
      const params = { page: currentPage, limit: 30 };
      if (category !== 'all') params.category = category;
      if (stockFilter !== 'all') params.stockStatus = stockFilter;
      const d = await getPharmacyInventory(clinicId, params);
      const newItems = d.items || [];
      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      setHasMore(newItems.length === 30);
      if (reset) setPage(2); else setPage(p => p + 1);
    } catch {}
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [clinicId, category, stockFilter, page]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    Promise.all([fetchSummary(), fetchItems(true)]);
  }, [clinicId, category, stockFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    Promise.all([fetchSummary(), fetchItems(true)]);
  }, [fetchSummary, fetchItems]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const t = setTimeout(async () => {
      if (!clinicId) return;
      setSearching(true);
      try {
        const d = await searchMedicines(searchQuery.trim(), clinicId);
        setItems(d.items || []);
        setHasMore(false);
      } catch {}
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, clinicId]);

  const clearSearch = () => {
    setSearchQuery('');
    setPage(1);
    fetchItems(true);
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  const displayItems = useMemo(() => {
    if (searchQuery.trim()) return items;
    if (stockFilter !== 'all') return items.filter(i => i.stockStatus === stockFilter);
    return items;
  }, [items, searchQuery, stockFilter]);

  const renderItem = useCallback(({ item }) => (
    <DrugCard item={item} onPress={openDetail} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback((item) => item._id, []);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} />;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Pharmacy...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={colors.primaryGradient || colors.gradientPrimary || ['#00D4AA', '#00B894']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pharmacy Inventory</Text>
          <Text style={styles.headerSub}>{summary?.totalItems ?? '—'} medicines</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Summary Stats */}
      {summary && (
        <View style={[styles.summaryRow, { backgroundColor: colors.backgroundCard }]}>
          {[
            { icon: '📦', val: summary.totalItems,   label: 'Total',      color: '#3B82F6' },
            { icon: '⚠️', val: summary.lowStock,     label: 'Low Stock',  color: '#F59E0B' },
            { icon: '🚫', val: summary.outOfStock,   label: 'Out',        color: '#EF4444' },
            { icon: '⏰', val: summary.expiringSoon, label: 'Expiring',   color: '#F97316' },
          ].map((s, i) => (
            <View key={i} style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>{s.icon}</Text>
              <Text style={[styles.summaryVal, { color: s.color }]}>{s.val ?? '—'}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search medicine, generic name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      {!searchQuery && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={[styles.filterScroll, { backgroundColor: colors.backgroundCard }]}
          contentContainerStyle={styles.filterContent}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={[styles.filterChip, category === c && { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterChipText, category === c && { color: '#0A0E17', fontWeight: '700' }]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Stock Status Filter */}
      {!searchQuery && (
        <View style={[styles.stockFilterRow, { backgroundColor: colors.backgroundCard }]}>
          {STOCK_FILTERS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setStockFilter(f.key)}
              style={[styles.stockChip, stockFilter === f.key && { backgroundColor: f.color + '20', borderColor: f.color }]}>
              <Text style={[styles.stockChipText, { color: stockFilter === f.key ? f.color : colors.textMuted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Drug List */}
      <FlatList
        data={displayItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={() => { if (hasMore && !loadingMore && !searchQuery) fetchItems(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No medicines found</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {searchQuery ? 'Try a different search term' : 'Add medicines to your pharmacy inventory'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Drug Detail Modal */}
      <DrugDetailModal
        item={selectedItem}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall },
  summaryRow: { flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryIcon: { fontSize: 18, marginBottom: 2 },
  summaryVal: { ...typography.headlineSmall, fontWeight: '700' },
  summaryLabel: { ...typography.labelSmall },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.md, ...typography.bodyMedium },
  clearIcon: { fontSize: 16, padding: spacing.xs },
  filterScroll: { maxHeight: 48 },
  filterContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterChipActive: { backgroundColor: '#1D4ED8' },
  filterChipText: { ...typography.labelSmall, color: '#6B7280', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  stockFilterRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  stockChip: { flex: 1, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
  stockChipText: { ...typography.labelSmall, fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.xs },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4 },
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  nameBlock: { flex: 1, marginRight: spacing.sm },
  name: { ...typography.bodyMedium, fontWeight: '700' },
  generic: { ...typography.labelSmall, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { ...typography.labelSmall },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stock: { ...typography.labelSmall, fontWeight: '600' },
  price: { ...typography.labelSmall },
  expiry: { color: '#F59E0B', ...typography.labelSmall, marginTop: spacing.xs },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerTitle: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', ...typography.labelSmall },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '700' },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statVal: { ...typography.headlineSmall, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, textAlign: 'center' },
  detailCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  detailKey: { ...typography.labelSmall },
  detailVal: { ...typography.labelSmall, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyMedium, fontWeight: '700', marginBottom: spacing.sm },
  txnRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.xs },
  txnDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txnDotIcon: { fontSize: 16, fontWeight: '700' },
  txnInfo: { flex: 1 },
  txnType: { ...typography.labelSmall, fontWeight: '600' },
  txnDate: { ...typography.labelSmall },
  txnQty: { ...typography.bodyMedium, fontWeight: '700' },
});

export default PharmacyInventoryScreen;
