/**
 * EMR Lab Order Screen — Full parity with web LabOrderForm
 * Searchable catalog (API + local fallback), panels, urgency, fasting alerts
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { getLabCatalog, createLabOrder } from '../../../services/api/emrApi';

// ─── Fallback catalog (shown when API returns empty) ──────────────────────
const FALLBACK_TESTS = [
  { code: 'CBC',    name: 'Complete Blood Count',       category: 'hematology',  sampleType: 'Blood', turnaroundTime: 4,  turnaroundUnit: 'hrs', fasting: false, description: 'RBC, WBC, platelets, hemoglobin' },
  { code: 'BMP',    name: 'Basic Metabolic Panel',      category: 'chemistry',   sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: true,  description: 'Glucose, electrolytes, kidney function' },
  { code: 'CMP',    name: 'Comprehensive Metabolic Panel',category:'chemistry',  sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: true,  description: 'BMP + liver function tests' },
  { code: 'LFT',    name: 'Liver Function Test',        category: 'chemistry',   sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: false, description: 'ALT, AST, bilirubin, albumin' },
  { code: 'KFT',    name: 'Kidney Function Test',       category: 'chemistry',   sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: false, description: 'Creatinine, urea, uric acid' },
  { code: 'FBS',    name: 'Fasting Blood Sugar',        category: 'endocrine',   sampleType: 'Blood', turnaroundTime: 2,  turnaroundUnit: 'hrs', fasting: true,  description: 'Glucose after 8-hour fast' },
  { code: 'PPBS',   name: 'Post Prandial Blood Sugar',  category: 'endocrine',   sampleType: 'Blood', turnaroundTime: 2,  turnaroundUnit: 'hrs', fasting: false, description: '2-hour post meal glucose' },
  { code: 'HBA1C',  name: 'HbA1c (Glycated Hemoglobin)',category: 'endocrine',   sampleType: 'Blood', turnaroundTime: 24, turnaroundUnit: 'hrs', fasting: false, description: '3-month average blood sugar' },
  { code: 'TSH',    name: 'Thyroid Stimulating Hormone',category: 'endocrine',   sampleType: 'Blood', turnaroundTime: 24, turnaroundUnit: 'hrs', fasting: false, description: 'Thyroid function screening' },
  { code: 'T3T4',   name: 'T3 & T4 (Free)',            category: 'endocrine',   sampleType: 'Blood', turnaroundTime: 24, turnaroundUnit: 'hrs', fasting: false, description: 'Free thyroid hormones' },
  { code: 'LIPID',  name: 'Lipid Profile',              category: 'chemistry',   sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: true,  description: 'Total cholesterol, LDL, HDL, triglycerides' },
  { code: 'UA',     name: 'Urine Analysis',             category: 'urine',       sampleType: 'Urine', turnaroundTime: 2,  turnaroundUnit: 'hrs', fasting: false, description: 'Physical, chemical, microscopic exam' },
  { code: 'UCR',    name: 'Urine Culture & Sensitivity',category: 'microbiology',sampleType: 'Urine', turnaroundTime: 48, turnaroundUnit: 'hrs', fasting: false, description: 'Bacterial culture and antibiotic sensitivity' },
  { code: 'VITD',   name: 'Vitamin D (25-OH)',          category: 'vitamins',    sampleType: 'Blood', turnaroundTime: 24, turnaroundUnit: 'hrs', fasting: false, description: 'Vitamin D3 level' },
  { code: 'B12',    name: 'Vitamin B12',                category: 'vitamins',    sampleType: 'Blood', turnaroundTime: 24, turnaroundUnit: 'hrs', fasting: false, description: 'Cobalamin level' },
  { code: 'IRON',   name: 'Iron Studies',               category: 'hematology',  sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: false, description: 'Serum iron, TIBC, ferritin' },
  { code: 'CRP',    name: 'C-Reactive Protein',         category: 'immunology',  sampleType: 'Blood', turnaroundTime: 6,  turnaroundUnit: 'hrs', fasting: false, description: 'Inflammation marker' },
  { code: 'ESR',    name: 'Erythrocyte Sedimentation Rate',category:'hematology', sampleType: 'Blood', turnaroundTime: 2,  turnaroundUnit: 'hrs', fasting: false, description: 'Non-specific inflammation marker' },
  { code: 'ECG',    name: 'Electrocardiogram',          category: 'cardiology',  sampleType: 'N/A',   turnaroundTime: 1,  turnaroundUnit: 'hrs', fasting: false, description: '12-lead ECG' },
  { code: 'ECHO',   name: 'Echocardiogram',             category: 'cardiology',  sampleType: 'N/A',   turnaroundTime: 24, turnaroundUnit: 'hrs', fasting: false, description: 'Cardiac ultrasound' },
];

const FALLBACK_PANELS = [
  { id: 'panel_diabetes', name: 'Diabetes Panel',    tests: ['FBS', 'PPBS', 'HBA1C'],          fasting: true,  description: 'Complete diabetes assessment', indication: 'Diabetes screening/monitoring' },
  { id: 'panel_thyroid',  name: 'Thyroid Panel',     tests: ['TSH', 'T3T4'],                   fasting: false, description: 'Complete thyroid function',    indication: 'Thyroid disorder evaluation' },
  { id: 'panel_liver',    name: 'Liver Panel',       tests: ['LFT', 'CBC'],                    fasting: false, description: 'Liver health assessment',      indication: 'Liver disease evaluation' },
  { id: 'panel_cardiac',  name: 'Cardiac Panel',     tests: ['ECG', 'LIPID', 'CRP'],           fasting: true,  description: 'Cardiovascular risk assessment',indication: 'Cardiac risk evaluation' },
  { id: 'panel_annual',   name: 'Annual Health Check',tests: ['CBC', 'CMP', 'LIPID', 'TSH', 'VITD', 'B12'], fasting: true, description: 'Comprehensive annual checkup', indication: 'Preventive health screening' },
];

const FALLBACK_CATEGORIES = [
  { id: 'hematology',   name: 'Hematology' },
  { id: 'chemistry',    name: 'Chemistry' },
  { id: 'endocrine',    name: 'Endocrine' },
  { id: 'urine',        name: 'Urine' },
  { id: 'microbiology', name: 'Microbiology' },
  { id: 'vitamins',     name: 'Vitamins' },
  { id: 'immunology',   name: 'Immunology' },
  { id: 'cardiology',   name: 'Cardiology' },
];

const URGENCY = [
  { value: 'routine', label: 'Routine', color: '#10B981', desc: 'Standard TAT' },
  { value: 'urgent',  label: 'Urgent',  color: '#F59E0B', desc: 'Priority' },
  { value: 'stat',    label: 'STAT',    color: '#EF4444', desc: 'Immediate' },
];

const mergeCatalog = (apiCatalog) => ({
  tests:      apiCatalog?.tests?.length      ? apiCatalog.tests      : FALLBACK_TESTS,
  panels:     apiCatalog?.panels?.length     ? apiCatalog.panels     : FALLBACK_PANELS,
  categories: apiCatalog?.categories?.length ? apiCatalog.categories : FALLBACK_CATEGORIES,
});

const EMRLabOrderScreen = ({ navigation, route }) => {
  const { visitId, patientId, patientName, clinicId } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [catalog, setCatalog] = useState(mergeCatalog(null)); // start with fallback
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedPanels, setSelectedPanels] = useState([]);
  const [urgency, setUrgency] = useState('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLabCatalog()
      .then(data => setCatalog(mergeCatalog(data.catalog || data)))
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoading(false));
  }, []);

  const filteredTests = useMemo(() => {
    let tests = catalog.tests || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      return tests.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.code?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') return tests.filter(t => t.category === activeCategory);
    return tests;
  }, [catalog.tests, search, activeCategory]);

  const filteredPanels = useMemo(() => {
    if (!search.trim()) return catalog.panels || [];
    const q = search.toLowerCase();
    return (catalog.panels || []).filter(p =>
      p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }, [catalog.panels, search]);

  const isTestSelected = useCallback((code) =>
    selectedTests.some(t => t.code === code) ||
    selectedPanels.some(p => p.tests?.includes(code)),
  [selectedTests, selectedPanels]);

  const toggleTest = useCallback((test) => {
    setSelectedTests(prev =>
      prev.some(t => t.code === test.code)
        ? prev.filter(t => t.code !== test.code)
        : [...prev, test]
    );
  }, []);

  const togglePanel = useCallback((panel) => {
    setSelectedPanels(prev =>
      prev.some(p => p.id === panel.id)
        ? prev.filter(p => p.id !== panel.id)
        : [...prev, panel]
    );
  }, []);

  const allSelectedCodes = useMemo(() => {
    const codes = new Set(selectedTests.map(t => t.code));
    selectedPanels.forEach(p => p.tests?.forEach(c => codes.add(c)));
    return Array.from(codes);
  }, [selectedTests, selectedPanels]);

  const fastingRequired = useMemo(() =>
    allSelectedCodes.some(code => {
      const t = catalog.tests.find(t => t.code === code);
      return t?.fasting;
    }),
  [allSelectedCodes, catalog.tests]);

  const handleSubmit = async () => {
    if (allSelectedCodes.length === 0) {
      Alert.alert('Error', 'Select at least one test.');
      return;
    }
    if (!patientId) {
      Alert.alert('Patient Required', 'Please select a patient before creating a lab order. Go back to EMR and select a patient first.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patientId,
        clinicId,
        tests: selectedTests.map(t => t.code),
        panels: selectedPanels.map(p => p.id),
        urgency,
        clinicalNotes,
      };
      // visitId is optional — allow orders without an active visit
      if (visitId) payload.visitId = visitId;

      await createLabOrder(payload);
      Alert.alert('Order Created', `Lab order for ${allSelectedCodes.length} test(s) submitted.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to create lab order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading catalog...</Text>
      </View>
    );
  }

  const total = allSelectedCodes.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7C3AED', '#6D28D9']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lab Orders</Text>
          {patientName
            ? <Text style={styles.headerSub}>{patientName}</Text>
            : <Text style={styles.headerSubWarn}>⚠️ No patient selected</Text>
          }
        </View>
        {total > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{total}</Text>
          </View>
        )}
      </LinearGradient>

      {!patientId && (
        <View style={styles.noPatientBanner}>
          <Text style={styles.noPatientText}>Select a patient from EMR hub before creating an order</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={search} onChangeText={setSearch}
            placeholder="Search tests by name or code..." placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['tests', 'panels'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}>
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.textSecondary }]}>
                {tab === 'tests' ? '🧪 Individual Tests' : '📋 Test Panels'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category filter */}
        {activeTab === 'tests' && !search && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <TouchableOpacity onPress={() => setActiveCategory('all')}
              style={[styles.catBtn, activeCategory === 'all' && { backgroundColor: colors.primary }]}>
              <Text style={[styles.catText, { color: activeCategory === 'all' ? '#fff' : colors.textSecondary }]}>All</Text>
            </TouchableOpacity>
            {catalog.categories.map(cat => (
              <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.id)}
                style={[styles.catBtn, activeCategory === cat.id && { backgroundColor: colors.primary }]}>
                <Text style={[styles.catText, { color: activeCategory === cat.id ? '#fff' : colors.textSecondary }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Tests list */}
        {activeTab === 'tests' && filteredTests.map(test => {
          const selected = isTestSelected(test.code);
          return (
            <TouchableOpacity key={test.code} onPress={() => toggleTest(test)}
              style={[styles.testItem, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.surfaceBorder, borderWidth: selected ? 2 : 1 }]}>
              <View style={[styles.checkbox, { borderColor: selected ? colors.primary : colors.surfaceBorder, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.testInfo}>
                <View style={styles.testNameRow}>
                  <Text style={[styles.testCode, { color: colors.primary }]}>{test.code}</Text>
                  <Text style={[styles.testName, { color: colors.textPrimary }]}>{test.name}</Text>
                </View>
                {test.description && <Text style={[styles.testDesc, { color: colors.textSecondary }]}>{test.description}</Text>}
                <View style={styles.testMeta}>
                  {test.turnaroundTime && <Text style={[styles.metaTag, { color: colors.textMuted }]}>⏱ {test.turnaroundTime} {test.turnaroundUnit}</Text>}
                  {test.sampleType && <Text style={[styles.metaTag, { color: colors.textMuted }]}>🩸 {test.sampleType}</Text>}
                  {test.fasting && <Text style={[styles.metaTag, { color: '#F59E0B' }]}>🍽 Fasting</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Panels list */}
        {activeTab === 'panels' && filteredPanels.map(panel => {
          const selected = selectedPanels.some(p => p.id === panel.id);
          return (
            <TouchableOpacity key={panel.id} onPress={() => togglePanel(panel)}
              style={[styles.testItem, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.surfaceBorder, borderWidth: selected ? 2 : 1 }]}>
              <View style={[styles.checkbox, { borderColor: selected ? colors.primary : colors.surfaceBorder, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.testInfo}>
                <View style={styles.testNameRow}>
                  <Text style={[styles.testName, { color: colors.textPrimary }]}>{panel.name}</Text>
                  <Text style={[styles.testCode, { color: colors.primary }]}>{panel.tests?.length} tests</Text>
                </View>
                {panel.description && <Text style={[styles.testDesc, { color: colors.textSecondary }]}>{panel.description}</Text>}
                {panel.indication && <Text style={[styles.testDesc, { color: colors.textMuted }]}>Indication: {panel.indication}</Text>}
                {panel.fasting && <Text style={[styles.metaTag, { color: '#F59E0B' }]}>🍽 Fasting required</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        {fastingRequired && (
          <View style={styles.fastingAlert}>
            <Text style={styles.fastingText}>⚠️ Fasting required for selected tests. Inform the patient.</Text>
          </View>
        )}

        {total > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Urgency Level</Text>
            <View style={styles.urgencyRow}>
              {URGENCY.map(u => (
                <TouchableOpacity key={u.value} onPress={() => setUrgency(u.value)}
                  style={[styles.urgencyBtn, { borderColor: u.color, backgroundColor: urgency === u.value ? u.color : 'transparent' }]}>
                  <Text style={[styles.urgencyLabel, { color: urgency === u.value ? '#fff' : u.color }]}>{u.label}</Text>
                  <Text style={[styles.urgencyDesc, { color: urgency === u.value ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>{u.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Clinical Notes</Text>
            <TextInput
              style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
              value={clinicalNotes} onChangeText={setClinicalNotes}
              placeholder="Add clinical notes for the lab..." placeholderTextColor={colors.textMuted}
              multiline numberOfLines={3}
            />

            <TouchableOpacity onPress={handleSubmit} disabled={saving} activeOpacity={0.8}>
              <LinearGradient colors={saving ? ['#9CA3AF', '#6B7280'] : ['#7C3AED', '#6D28D9']} style={styles.saveBtn}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.saveBtnText}>📋 Create Order ({total} tests)</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  headerSubWarn: { color: '#FDE68A', ...typography.labelSmall },
  countBadge: { backgroundColor: '#fff', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },
  noPatientBanner: { backgroundColor: '#FEF3C7', padding: spacing.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
  noPatientText: { color: '#92400E', ...typography.labelSmall, fontWeight: '600' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.md, ...typography.bodyMedium },
  clearBtn: { fontSize: 16, padding: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  tabText: { ...typography.labelMedium, fontWeight: '600' },
  catScroll: { marginBottom: spacing.md },
  catBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginRight: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)' },
  catText: { ...typography.labelSmall },
  testItem: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, marginTop: 2 },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  testInfo: { flex: 1 },
  testNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  testCode: { ...typography.labelSmall, fontWeight: '700' },
  testName: { ...typography.bodyMedium, fontWeight: '600', flex: 1 },
  testDesc: { ...typography.labelSmall, marginTop: spacing.xs },
  testMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  metaTag: { ...typography.labelSmall },
  fastingAlert: { backgroundColor: '#FEF3C7', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  fastingText: { color: '#92400E', ...typography.bodySmall, fontWeight: '600' },
  sectionTitle: { ...typography.bodyMedium, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.md },
  urgencyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  urgencyBtn: { flex: 1, borderWidth: 2, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center' },
  urgencyLabel: { ...typography.labelMedium, fontWeight: '700' },
  urgencyDesc: { ...typography.labelSmall },
  textArea: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, ...typography.bodyMedium, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.lg },
  saveBtn: { padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.xl },
  saveBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
});

export default EMRLabOrderScreen;
