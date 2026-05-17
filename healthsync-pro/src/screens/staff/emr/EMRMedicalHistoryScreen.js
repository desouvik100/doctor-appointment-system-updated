/**
 * EMR Medical History Screen — Redesigned for enterprise UX
 * 5 tabs: Allergies, Conditions, Family, Surgical, Medications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { getPatientHistory, savePatientHistory } from '../../../services/api/emrApi';

const TABS = [
  { key: 'allergies',   label: 'Allergies',   icon: '⚠️', color: '#EF4444' },
  { key: 'conditions',  label: 'Conditions',  icon: '🏥', color: '#3B82F6' },
  { key: 'family',      label: 'Family',      icon: '👨‍👩‍👧', color: '#8B5CF6' },
  { key: 'surgical',    label: 'Surgical',    icon: '🔪', color: '#F59E0B' },
  { key: 'medications', label: 'Meds',        icon: '💊', color: '#10B981' },
];

const SEVERITY = { mild: '#FBBF24', moderate: '#F97316', severe: '#EF4444' };
const COND_STATUS = { active: '#EF4444', controlled: '#F59E0B', resolved: '#10B981' };

// ─── Reusable item card ────────────────────────────────────────────────────
const ItemCard = ({ title, badge, badgeColor, lines = [], onRemove, colors }) => (
  <View style={[itemStyles.card, { backgroundColor: colors.surface }]}>
    <View style={itemStyles.cardTop}>
      <Text style={[itemStyles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
      {badge && (
        <View style={[itemStyles.badge, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}>
          <Text style={[itemStyles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      )}
    </View>
    {lines.map((line, i) => line ? (
      <Text key={i} style={[itemStyles.line, { color: colors.textSecondary }]}>{line}</Text>
    ) : null)}
    <TouchableOpacity onPress={onRemove} style={itemStyles.removeBtn}>
      <Text style={itemStyles.removeTxt}>✕ Remove</Text>
    </TouchableOpacity>
  </View>
);

const itemStyles = StyleSheet.create({
  card: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  title: { ...typography.bodyMedium, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, borderWidth: 1 },
  badgeText: { ...typography.labelSmall, fontWeight: '700' },
  line: { ...typography.labelSmall, marginBottom: 2 },
  removeBtn: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: '#FEE2E2' },
  removeTxt: { color: '#EF4444', ...typography.labelSmall, fontWeight: '600' },
});

// ─── Add form modal ────────────────────────────────────────────────────────
const AddModal = ({ visible, title, color, onClose, onAdd, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={modalStyles.overlay}>
      <View style={modalStyles.sheet}>
        <View style={[modalStyles.handle, { backgroundColor: color }]} />
        <Text style={modalStyles.title}>{title}</Text>
        {children}
        <View style={modalStyles.btnRow}>
          <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
            <Text style={modalStyles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} style={[modalStyles.addBtn, { backgroundColor: color }]}>
            <Text style={modalStyles.addTxt}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  title: { ...typography.headlineSmall, fontWeight: '700', color: '#111827', marginBottom: spacing.lg },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelTxt: { ...typography.bodyMedium, fontWeight: '600', color: '#6B7280' },
  addBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  addTxt: { ...typography.bodyMedium, fontWeight: '700', color: '#fff' },
});

const EMRMedicalHistoryScreen = ({ navigation, route }) => {
  const { patientId, patientName, clinicId } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('allergies');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [history, setHistory] = useState({
    allergies: [], chronicConditions: [], familyHistory: [],
    surgicalHistory: [], currentMedications: [],
  });

  // Form states
  const [newAllergy, setNewAllergy] = useState({ allergen: '', reaction: '', severity: 'moderate' });
  const [newCondition, setNewCondition] = useState({ condition: '', status: 'active', notes: '' });
  const [newFamily, setNewFamily] = useState({ relation: '', condition: '', ageAtOnset: '' });
  const [newSurgery, setNewSurgery] = useState({ procedure: '', hospital: '', notes: '' });
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', prescribedFor: '' });

  useEffect(() => {
    if (!patientId) { setLoading(false); return; }
    getPatientHistory(patientId, clinicId)
      .then(data => {
        if (data.history) setHistory({
          allergies: data.history.allergies || [],
          chronicConditions: data.history.chronicConditions || [],
          familyHistory: data.history.familyHistory || [],
          surgicalHistory: data.history.surgicalHistory || [],
          currentMedications: data.history.currentMedications || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleSave = async () => {
    if (!patientId) { Alert.alert('Error', 'No patient selected.'); return; }
    setSaving(true);
    try {
      await savePatientHistory(patientId, { clinicId, ...history });
      Alert.alert('Saved', 'Medical history updated successfully.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const addItem = useCallback((key, item, reset) => {
    setHistory(prev => ({ ...prev, [key]: [...prev[key], { ...item, id: Date.now() }] }));
    reset();
    setShowModal(false);
  }, []);

  const removeItem = useCallback((key, id) =>
    setHistory(prev => ({ ...prev, [key]: prev[key].filter(i => (i.id || i._id) !== id) })),
  []);

  const activeTabConfig = TABS.find(t => t.key === activeTab);
  const historyKey = { allergies: 'allergies', conditions: 'chronicConditions', family: 'familyHistory', surgical: 'surgicalHistory', medications: 'currentMedications' }[activeTab];
  const itemCount = (key) => ({ allergies: history.allergies, conditions: history.chronicConditions, family: history.familyHistory, surgical: history.surgicalHistory, medications: history.currentMedications }[key]?.length || 0);

  const inputStyle = [styles.modalInput, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.background }];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#DC2626', '#B91C1C']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Medical History</Text>
          {patientName && <Text style={styles.headerSub}>{patientName}</Text>}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveHeaderText}>Save</Text>}
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const count = itemCount(tab.key);
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, active && { borderBottomColor: tab.color, borderBottomWidth: 3 }]}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: active ? tab.color : colors.textSecondary }]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!patientId && (
        <View style={styles.noPatientBanner}>
          <Text style={styles.noPatientText}>⚠️ No patient selected — select a patient from EMR hub to load and save history.</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Empty state */}
        {history[historyKey]?.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{activeTabConfig?.icon}</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No {activeTabConfig?.label} recorded</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>Tap the button below to add</Text>
          </View>
        )}

        {/* Allergies */}
        {activeTab === 'allergies' && history.allergies.map((a, i) => (
          <ItemCard key={a.id || a._id || i} title={a.allergen}
            badge={a.severity} badgeColor={SEVERITY[a.severity] || '#F59E0B'}
            lines={[a.reaction ? `Reaction: ${a.reaction}` : null]}
            onRemove={() => removeItem('allergies', a.id || a._id)} colors={colors} />
        ))}

        {/* Conditions */}
        {activeTab === 'conditions' && history.chronicConditions.map((c, i) => (
          <ItemCard key={c.id || c._id || i} title={c.condition}
            badge={c.status} badgeColor={COND_STATUS[c.status] || '#6B7280'}
            lines={[c.notes]}
            onRemove={() => removeItem('chronicConditions', c.id || c._id)} colors={colors} />
        ))}

        {/* Family */}
        {activeTab === 'family' && history.familyHistory.map((f, i) => (
          <ItemCard key={f.id || f._id || i} title={f.condition}
            badge={f.relation} badgeColor="#8B5CF6"
            lines={[f.ageAtOnset ? `Age at onset: ${f.ageAtOnset}` : null]}
            onRemove={() => removeItem('familyHistory', f.id || f._id)} colors={colors} />
        ))}

        {/* Surgical */}
        {activeTab === 'surgical' && history.surgicalHistory.map((s, i) => (
          <ItemCard key={s.id || s._id || i} title={s.procedure}
            badge={null} badgeColor={null}
            lines={[s.hospital ? `Facility: ${s.hospital}` : null, s.notes]}
            onRemove={() => removeItem('surgicalHistory', s.id || s._id)} colors={colors} />
        ))}

        {/* Medications */}
        {activeTab === 'medications' && history.currentMedications.map((m, i) => (
          <ItemCard key={m.id || m._id || i} title={m.name}
            badge={m.dosage} badgeColor="#10B981"
            lines={[m.frequency ? `Frequency: ${m.frequency}` : null, m.prescribedFor ? `For: ${m.prescribedFor}` : null]}
            onRemove={() => removeItem('currentMedications', m.id || m._id)} colors={colors} />
        ))}

        {/* Add button */}
        <TouchableOpacity onPress={() => setShowModal(true)}
          style={[styles.addFab, { backgroundColor: activeTabConfig?.color }]}>
          <Text style={styles.addFabText}>+ Add {activeTabConfig?.label}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Add Allergy Modal ─── */}
      <AddModal visible={showModal && activeTab === 'allergies'} title="Add Allergy"
        color={TABS[0].color} onClose={() => setShowModal(false)}
        onAdd={() => {
          if (!newAllergy.allergen.trim()) return;
          addItem('allergies', newAllergy, () => setNewAllergy({ allergen: '', reaction: '', severity: 'moderate' }));
        }}>
        <TextInput style={inputStyle} value={newAllergy.allergen}
          onChangeText={v => setNewAllergy(p => ({ ...p, allergen: v }))}
          placeholder="Allergen (e.g. Penicillin, Peanuts)" placeholderTextColor="#9CA3AF" />
        <TextInput style={inputStyle} value={newAllergy.reaction}
          onChangeText={v => setNewAllergy(p => ({ ...p, reaction: v }))}
          placeholder="Reaction (e.g. Rash, Anaphylaxis)" placeholderTextColor="#9CA3AF" />
        <Text style={styles.modalLabel}>Severity</Text>
        <View style={styles.pillRow}>
          {['mild', 'moderate', 'severe'].map(s => (
            <TouchableOpacity key={s} onPress={() => setNewAllergy(p => ({ ...p, severity: s }))}
              style={[styles.pill, { borderColor: SEVERITY[s], backgroundColor: newAllergy.severity === s ? SEVERITY[s] : 'transparent' }]}>
              <Text style={[styles.pillText, { color: newAllergy.severity === s ? '#fff' : SEVERITY[s] }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AddModal>

      {/* ─── Add Condition Modal ─── */}
      <AddModal visible={showModal && activeTab === 'conditions'} title="Add Condition"
        color={TABS[1].color} onClose={() => setShowModal(false)}
        onAdd={() => {
          if (!newCondition.condition.trim()) return;
          addItem('chronicConditions', newCondition, () => setNewCondition({ condition: '', status: 'active', notes: '' }));
        }}>
        <TextInput style={inputStyle} value={newCondition.condition}
          onChangeText={v => setNewCondition(p => ({ ...p, condition: v }))}
          placeholder="Condition (e.g. Diabetes Type 2)" placeholderTextColor="#9CA3AF" />
        <Text style={styles.modalLabel}>Status</Text>
        <View style={styles.pillRow}>
          {['active', 'controlled', 'resolved'].map(s => (
            <TouchableOpacity key={s} onPress={() => setNewCondition(p => ({ ...p, status: s }))}
              style={[styles.pill, { borderColor: COND_STATUS[s], backgroundColor: newCondition.status === s ? COND_STATUS[s] : 'transparent' }]}>
              <Text style={[styles.pillText, { color: newCondition.status === s ? '#fff' : COND_STATUS[s] }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={inputStyle} value={newCondition.notes}
          onChangeText={v => setNewCondition(p => ({ ...p, notes: v }))}
          placeholder="Notes (optional)" placeholderTextColor="#9CA3AF" />
      </AddModal>

      {/* ─── Add Family History Modal ─── */}
      <AddModal visible={showModal && activeTab === 'family'} title="Add Family History"
        color={TABS[2].color} onClose={() => setShowModal(false)}
        onAdd={() => {
          if (!newFamily.condition.trim()) return;
          addItem('familyHistory', newFamily, () => setNewFamily({ relation: '', condition: '', ageAtOnset: '' }));
        }}>
        <TextInput style={inputStyle} value={newFamily.relation}
          onChangeText={v => setNewFamily(p => ({ ...p, relation: v }))}
          placeholder="Relation (e.g. Father, Mother, Sibling)" placeholderTextColor="#9CA3AF" />
        <TextInput style={inputStyle} value={newFamily.condition}
          onChangeText={v => setNewFamily(p => ({ ...p, condition: v }))}
          placeholder="Condition (e.g. Heart Disease)" placeholderTextColor="#9CA3AF" />
        <TextInput style={inputStyle} value={newFamily.ageAtOnset}
          onChangeText={v => setNewFamily(p => ({ ...p, ageAtOnset: v }))}
          placeholder="Age at onset (optional)" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
      </AddModal>

      {/* ─── Add Surgery Modal ─── */}
      <AddModal visible={showModal && activeTab === 'surgical'} title="Add Surgery"
        color={TABS[3].color} onClose={() => setShowModal(false)}
        onAdd={() => {
          if (!newSurgery.procedure.trim()) return;
          addItem('surgicalHistory', newSurgery, () => setNewSurgery({ procedure: '', hospital: '', notes: '' }));
        }}>
        <TextInput style={inputStyle} value={newSurgery.procedure}
          onChangeText={v => setNewSurgery(p => ({ ...p, procedure: v }))}
          placeholder="Procedure (e.g. Appendectomy)" placeholderTextColor="#9CA3AF" />
        <TextInput style={inputStyle} value={newSurgery.hospital}
          onChangeText={v => setNewSurgery(p => ({ ...p, hospital: v }))}
          placeholder="Hospital / Facility" placeholderTextColor="#9CA3AF" />
        <TextInput style={inputStyle} value={newSurgery.notes}
          onChangeText={v => setNewSurgery(p => ({ ...p, notes: v }))}
          placeholder="Notes (optional)" placeholderTextColor="#9CA3AF" />
      </AddModal>

      {/* ─── Add Medication Modal ─── */}
      <AddModal visible={showModal && activeTab === 'medications'} title="Add Medication"
        color={TABS[4].color} onClose={() => setShowModal(false)}
        onAdd={() => {
          if (!newMed.name.trim()) return;
          addItem('currentMedications', newMed, () => setNewMed({ name: '', dosage: '', frequency: '', prescribedFor: '' }));
        }}>
        <TextInput style={inputStyle} value={newMed.name}
          onChangeText={v => setNewMed(p => ({ ...p, name: v }))}
          placeholder="Medication name" placeholderTextColor="#9CA3AF" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput style={[inputStyle, { flex: 1 }]} value={newMed.dosage}
            onChangeText={v => setNewMed(p => ({ ...p, dosage: v }))}
            placeholder="Dosage (500mg)" placeholderTextColor="#9CA3AF" />
          <TextInput style={[inputStyle, { flex: 1 }]} value={newMed.frequency}
            onChangeText={v => setNewMed(p => ({ ...p, frequency: v }))}
            placeholder="Frequency (BD)" placeholderTextColor="#9CA3AF" />
        </View>
        <TextInput style={inputStyle} value={newMed.prescribedFor}
          onChangeText={v => setNewMed(p => ({ ...p, prescribedFor: v }))}
          placeholder="Prescribed for (condition)" placeholderTextColor="#9CA3AF" />
      </AddModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall },
  saveHeaderBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  saveHeaderText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
  tabBar: { borderBottomWidth: 1, maxHeight: 56 },
  tabBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minWidth: 80 },
  tabIcon: { fontSize: 14 },
  tabLabel: { ...typography.labelSmall, fontWeight: '600' },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  noPatientBanner: { backgroundColor: '#FEF3C7', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
  noPatientText: { color: '#92400E', ...typography.labelSmall },
  scroll: { padding: spacing.xl, paddingBottom: 120 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.xs },
  emptyDesc: { ...typography.bodySmall },
  addFab: { padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center', marginTop: spacing.md },
  addFabText: { color: '#fff', ...typography.bodyMedium, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.bodyMedium, marginBottom: spacing.sm },
  modalLabel: { ...typography.labelSmall, fontWeight: '600', color: '#374151', marginBottom: spacing.xs, marginTop: spacing.xs },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  pill: { flex: 1, borderWidth: 2, borderRadius: borderRadius.full, paddingVertical: spacing.sm, alignItems: 'center' },
  pillText: { ...typography.labelMedium, fontWeight: '700' },
});

export default EMRMedicalHistoryScreen;
