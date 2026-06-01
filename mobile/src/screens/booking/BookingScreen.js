/**
 * BookingScreen - Premium Doctor Selection
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, StatusBar, ActivityIndicator,
  RefreshControl, TextInput, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import apiClient from '../../services/api/apiClient';
import { useTheme } from '../../context/ThemeContext';

// ─── Department icons map ─────────────────────────────────────────────────────
const DEPT_ICONS = {
  'All': '🏥',
  'General Medicine': '🩺', 'General Physician': '🩺',
  'Cardiology': '❤️', 'Dermatology': '🧴', 'Orthopedics': '🦴',
  'Pediatrics': '👶', 'Neurology': '🧠', 'Gynecology': '🌸',
  'Ophthalmology': '👁️', 'ENT': '👂', 'Psychiatry': '🧘',
  'Oncology': '🎗️', 'Urology': '💧', 'Nephrology': '🫘',
  'Pulmonology': '🫁', 'Gastroenterology': '🫃', 'Endocrinology': '⚗️',
  'Rheumatology': '🦵', 'Dentistry': '🦷', 'Radiology': '🩻',
};
const getDeptIcon = (name) => DEPT_ICONS[name] || '🏥';

// ─── Quick Filters ────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { id: 'top_rated',  label: '⭐ Top Rated',     sort: 'rating' },
  { id: 'low_fee',    label: '💰 Low Fee',        sort: 'fee_asc' },
  { id: 'available',  label: '⚡ Available Now',  sort: 'available' },
  { id: 'nearby',     label: '📍 Nearby',         sort: 'nearby' },
];

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ colors }) => {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.card, { backgroundColor: colors.surface, opacity: anim }]}>
      <View style={[sk.avatar, { backgroundColor: colors.surfaceBorder }]} />
      <View style={sk.lines}>
        <View style={[sk.line, { width: '60%', backgroundColor: colors.surfaceBorder }]} />
        <View style={[sk.line, { width: '40%', backgroundColor: colors.surfaceBorder, marginTop: 8 }]} />
        <View style={[sk.line, { width: '30%', backgroundColor: colors.surfaceBorder, marginTop: 8 }]} />
      </View>
      <View style={[sk.btn, { backgroundColor: colors.surfaceBorder }]} />
    </Animated.View>
  );
};
const sk = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  lines: { flex: 1, marginLeft: 12 },
  line: { height: 12, borderRadius: 6 },
  btn: { width: 80, height: 36, borderRadius: 20 },
});

// ─── Doctor Card ──────────────────────────────────────────────────────────────
import DoctorCard from '../../components/cards/DoctorCard';

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BookingScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const preSelectedDoctor = route.params?.doctor;
  useEffect(() => {
    if (preSelectedDoctor) {
      navigation.replace('DoctorProfile', { 
        doctor: preSelectedDoctor, 
        doctorId: preSelectedDoctor._id || preSelectedDoctor.id 
      });
    }
  }, [preSelectedDoctor]);

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/doctors/specializations/list');
      const raw = Array.isArray(res.data) ? res.data : [];
      setDepartments([
        { id: 'all', name: 'All' },
        ...raw.map((s, i) => ({ id: `d${i}`, name: typeof s === 'string' ? s : s.name || s.specialization })),
      ]);
    } catch {
      setDepartments([
        { id: 'all', name: 'All' },
        { id: 'gm', name: 'General Medicine' },
        { id: 'card', name: 'Cardiology' },
        { id: 'derm', name: 'Dermatology' },
        { id: 'ortho', name: 'Orthopedics' },
        { id: 'peds', name: 'Pediatrics' },
        { id: 'neuro', name: 'Neurology' },
      ]);
    }
  };

  const fetchDoctors = useCallback(async (deptName = null, query = '') => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (deptName && deptName !== 'All') params.specialization = deptName;
      if (query.trim()) params.search = query.trim();
      const res = await apiClient.get('/doctors', { params });
      const list = Array.isArray(res.data) ? res.data : (res.data?.doctors || []);
      setDoctors(list);
    } catch {
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDepartments(); fetchDoctors(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const deptName = departments.find(d => d.id === selectedDept)?.name;
    Promise.all([fetchDepartments(), fetchDoctors(deptName, searchQuery)])
      .finally(() => setRefreshing(false));
  }, [selectedDept, searchQuery, departments]);

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept.id);
    fetchDoctors(dept.name === 'All' ? null : dept.name, searchQuery);
  };

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    const deptName = departments.find(d => d.id === selectedDept)?.name;
    fetchDoctors(deptName === 'All' ? null : deptName, q);
  }, [selectedDept, departments]);

  const displayDoctors = useMemo(() => {
    let list = [...doctors];
    if (activeFilter === 'top_rated') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (activeFilter === 'low_fee') list.sort((a, b) => (a.consultationFee || a.fee || 500) - (b.consultationFee || b.fee || 500));
    return list;
  }, [doctors, activeFilter]);

  if (preSelectedDoctor) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Hero Header ── */}
      <LinearGradient colors={['rgba(26, 31, 46, 0.55)', 'rgba(10, 14, 23, 0.15)']}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <Text style={styles.heroTitle}>Book Appointment</Text>
            <Text style={styles.heroSub}>Find the right doctor in seconds</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search Bar (Translucent glass style) */}
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1 }]}>
          <Text style={[styles.searchIcon, { color: 'rgba(255, 255, 255, 0.6)' }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: '#fff' }]}
            placeholder="Search by doctor, speciality, symptoms…"
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.filterIconBtn, { backgroundColor: 'rgba(0, 212, 170, 0.25)' }]}>
              <Text style={[styles.filterIconText, { color: '#00D4AA' }]}>⚙️</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Department Pill Tabs ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Department</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {departments.map(dept => {
              const active = selectedDept === dept.id;
              return (
                <TouchableOpacity key={dept.id} onPress={() => handleDeptSelect(dept)} activeOpacity={0.8}>
                  {active ? (
                    <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} style={styles.pillActive}>
                      <Text style={styles.pillIconActive}>{getDeptIcon(dept.name)}</Text>
                      <Text style={styles.pillTextActive}>{dept.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[
                      styles.pill, 
                      { 
                        backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : colors.surface, 
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder 
                      }
                    ]}>
                      <Text style={styles.pillIcon}>{getDeptIcon(dept.name)}</Text>
                      <Text style={[styles.pillText, { color: colors.textSecondary }]}>{dept.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Quick Filters ── */}
        <View style={styles.filterRow}>
          {QUICK_FILTERS.map(f => (
            <TouchableOpacity key={f.id} onPress={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
              style={[
                styles.filterChip,
                activeFilter === f.id
                  ? { backgroundColor: colors.primary }
                  : { 
                      backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : colors.surface, 
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder, 
                      borderWidth: 1 
                    }
              ]}
            >
              <Text style={[styles.filterChipText, { color: activeFilter === f.id ? (colors.textInverse || '#0A0E17') : colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Results ── */}
        {loading ? (
          <View style={styles.listPad}>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} colors={colors} />)}
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.stateIcon}>⚠️</Text>
            <Text style={[styles.stateTitle, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={() => fetchDoctors()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayDoctors.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateIcon}>👨‍⚕️</Text>
            <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>No Doctors Found</Text>
            <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try a different search term' : 'No doctors available in this department'}
            </Text>
          </View>
        ) : (
          <View style={styles.listPad}>
            <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
              {displayDoctors.length} doctor{displayDoctors.length !== 1 ? 's' : ''} available
            </Text>
            {displayDoctors.map(doc => (
              <DoctorCard key={doc._id || doc.id} doctor={doc}
                onPress={(d) => navigation.navigate('DoctorProfile', { doctor: d, doctorId: d._id || d.id })} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroCenter: { flex: 1, alignItems: 'center' },
  heroTitle: { color: '#fff', ...typography.headlineMedium, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.8)', ...typography.bodySmall, marginTop: 2 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.bodyMedium, paddingVertical: 4 },
  clearIcon: { fontSize: 14, color: '#9CA3AF', padding: spacing.xs },
  filterIconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  filterIconText: { fontSize: 14 },

  scroll: { paddingTop: spacing.lg },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionLabel: { ...typography.bodyLarge, fontWeight: '700', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  pillRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, flexDirection: 'row' },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, marginRight: spacing.xs },
  pillActive: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.xs },
  pillIcon: { fontSize: 14, marginRight: 5 },
  pillIconActive: { fontSize: 14, marginRight: 5 },
  pillText: { ...typography.labelSmall, fontWeight: '600' },
  pillTextActive: { ...typography.labelSmall, fontWeight: '700', color: '#0A0E17' },

  // Quick filters
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full },
  filterChipText: { ...typography.labelSmall, fontWeight: '600' },

  // List
  listPad: { paddingHorizontal: spacing.xl },
  resultsCount: { ...typography.bodySmall, marginBottom: spacing.md },

  // States
  centerState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: spacing.xl },
  stateIcon: { fontSize: 64, marginBottom: spacing.md },
  stateTitle: { ...typography.headlineSmall, fontWeight: '700', marginBottom: spacing.sm },
  stateDesc: { ...typography.bodyMedium, textAlign: 'center' },
  retryBtn: { marginTop: spacing.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  retryText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
});

export default BookingScreen;
