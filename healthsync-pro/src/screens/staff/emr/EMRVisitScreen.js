/**
 * EMR Visit Screen — Start/manage a clinical visit
 * Chief complaint, diagnosis, doctor notes, links to vitals/prescription/lab order
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/UserContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { createVisit, getVisitById, updateVisit } from '../../../services/api/emrApi';
import { getClinicDoctors } from '../../../services/api/staffDashboardApi';

const VISIT_TYPES = ['walk_in', 'appointment', 'follow_up', 'emergency'];

const EMRVisitScreen = ({ navigation, route }) => {
  const { patientId: routePatientId, patientName, clinicId: routeClinicId, visitId: existingVisitId } = route.params || {};
  const { user } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!existingVisitId);
  const [doctors, setDoctors] = useState([]);
  const [visit, setVisit] = useState(null);

  // Resolve clinicId and patientId — prefer route params, fall back to user context
  const clinicId = routeClinicId || (typeof user?.clinicId === 'object' ? user.clinicId._id : user?.clinicId);
  const patientId = routePatientId;

  const [form, setForm] = useState({
    chiefComplaint: '',
    visitType: 'walk_in',
    doctorId: '',
    diagnosis: '',
    notes: '',
    followUpRequired: false,
    followUpDays: '7',
  });

  useEffect(() => {
    if (clinicId) {
      getClinicDoctors(clinicId)
        .then(data => setDoctors(data.doctors || data || []))
        .catch(() => {});
    }
    if (existingVisitId) {
      getVisitById(existingVisitId)
        .then(data => {
          const v = data.visit || data;
          setVisit(v);
          setForm({
            chiefComplaint: v.chiefComplaint || '',
            visitType: v.visitType || 'walk_in',
            doctorId: v.doctorId?._id || v.doctorId || '',
            diagnosis: v.diagnosis || '',
            notes: v.notes || '',
            followUpRequired: v.followUp?.required || false,
            followUpDays: String(v.followUp?.days || 7),
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [clinicId, existingVisitId]);

  const handleSave = async () => {
    if (!form.chiefComplaint.trim()) {
      Alert.alert('Required', 'Please enter the chief complaint.');
      return;
    }
    if (!clinicId) {
      Alert.alert('Error', 'Clinic not found. Please log out and log in again.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        clinicId,
        chiefComplaint: form.chiefComplaint,
        visitType: form.visitType,
        followUp: form.followUpRequired
          ? { required: true, days: parseInt(form.followUpDays) }
          : { required: false },
      };
      // Optional fields — only include if present
      if (patientId) payload.patientId = patientId;
      if (form.doctorId) payload.doctorId = form.doctorId;
      if (form.diagnosis) payload.diagnosis = form.diagnosis;
      if (form.notes) payload.notes = form.notes;

      let savedVisit;
      if (existingVisitId) {
        const data = await updateVisit(existingVisitId, payload);
        savedVisit = data.visit || data;
        Alert.alert('Updated', 'Visit updated successfully.');
      } else {
        const data = await createVisit(payload);
        savedVisit = data.visit || data;
        Alert.alert('Visit Started', 'Visit created. You can now record vitals, prescriptions, and lab orders.', [
          {
            text: 'Record Vitals', onPress: () => navigation.replace('EMRVitals', {
              visitId: savedVisit._id, patientId, patientName, clinicId,
            })
          },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save visit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const visitIdToUse = visit?._id || existingVisitId;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#0F766E', '#0D9488']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{existingVisitId ? 'Update Visit' : 'New Visit'}</Text>
          {patientName && <Text style={styles.headerSub}>{patientName}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!patientId && (
          <View style={styles.noPatientBanner}>
            <Text style={styles.noPatientText}>No patient linked — you can add one later from the EMR hub.</Text>
          </View>
        )}
        {/* Visit Type */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Visit Type</Text>
        <View style={styles.typeRow}>
          {VISIT_TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, visitType: t }))}
              style={[styles.typeBtn, form.visitType === t && { backgroundColor: colors.primary }]}>
              <Text style={[styles.typeText, { color: form.visitType === t ? '#fff' : colors.textSecondary }]}>
                {t === 'walk_in' ? 'Walk-in' : t === 'follow_up' ? 'Follow-up' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chief Complaint */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Chief Complaint *</Text>
        <TextInput
          style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
          value={form.chiefComplaint} onChangeText={v => setForm(p => ({ ...p, chiefComplaint: v }))}
          placeholder="Patient's main complaint..." placeholderTextColor={colors.textMuted}
          multiline numberOfLines={3}
        />

        {/* Doctor */}
        {doctors.length > 0 && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Assign Doctor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorScroll}>
              <TouchableOpacity onPress={() => setForm(p => ({ ...p, doctorId: '' }))}
                style={[styles.doctorBtn, !form.doctorId && { backgroundColor: colors.primary }]}>
                <Text style={[styles.doctorText, { color: !form.doctorId ? '#fff' : colors.textSecondary }]}>None</Text>
              </TouchableOpacity>
              {doctors.map(d => (
                <TouchableOpacity key={d._id} onPress={() => setForm(p => ({ ...p, doctorId: d._id }))}
                  style={[styles.doctorBtn, form.doctorId === d._id && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.doctorText, { color: form.doctorId === d._id ? '#fff' : colors.textSecondary }]}>
                    Dr. {d.name}
                  </Text>
                  {d.specialization && (
                    <Text style={[styles.doctorSpec, { color: form.doctorId === d._id ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                      {d.specialization}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Diagnosis */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Diagnosis (Optional)</Text>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
          value={form.diagnosis} onChangeText={v => setForm(p => ({ ...p, diagnosis: v }))}
          placeholder="e.g. Viral fever, Hypertension..." placeholderTextColor={colors.textMuted}
        />

        {/* Doctor Notes */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Clinical Notes</Text>
        <TextInput
          style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
          value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))}
          placeholder="Clinical observations, examination findings..." placeholderTextColor={colors.textMuted}
          multiline numberOfLines={4}
        />

        {/* Follow-up */}
        <TouchableOpacity onPress={() => setForm(p => ({ ...p, followUpRequired: !p.followUpRequired }))}
          style={[styles.followUpToggle, { backgroundColor: colors.surface }]}>
          <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: form.followUpRequired ? colors.primary : 'transparent' }]}>
            {form.followUpRequired && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.followUpLabel, { color: colors.textPrimary }]}>Schedule Follow-up</Text>
        </TouchableOpacity>

        {form.followUpRequired && (
          <View style={styles.followUpDaysRow}>
            {['3', '7', '14', '30'].map(d => (
              <TouchableOpacity key={d} onPress={() => setForm(p => ({ ...p, followUpDays: d }))}
                style={[styles.daysBtn, form.followUpDays === d && { backgroundColor: colors.primary }]}>
                <Text style={[styles.daysBtnText, { color: form.followUpDays === d ? '#fff' : colors.textSecondary }]}>
                  {d} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick actions for existing visit */}
        {visitIdToUse && (
          <View style={styles.quickActions}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {[
                { icon: '📊', label: 'Vitals', screen: 'EMRVitals' },
                { icon: '💊', label: 'Prescribe', screen: 'EMRPrescription' },
                { icon: '🧪', label: 'Lab Order', screen: 'EMRLabOrder' },
              ].map(a => (
                <TouchableOpacity key={a.screen}
                  onPress={() => navigation.navigate(a.screen, { visitId: visitIdToUse, patientId, patientName, clinicId })}
                  style={[styles.quickBtn, { backgroundColor: colors.surface }]}>
                  <Text style={styles.quickIcon}>{a.icon}</Text>
                  <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={saving ? ['#9CA3AF', '#6B7280'] : ['#0F766E', '#0D9488']} style={styles.saveBtn}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.saveBtnText}>{existingVisitId ? '✏️ Update Visit' : '🏥 Start Visit'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  label: { ...typography.labelSmall, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.md },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  typeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  typeText: { ...typography.labelSmall, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium },
  textArea: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium, minHeight: 80, textAlignVertical: 'top' },
  doctorScroll: { marginBottom: spacing.sm },
  doctorBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, marginRight: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', minWidth: 80 },
  doctorText: { ...typography.labelSmall, fontWeight: '600' },
  doctorSpec: { ...typography.labelSmall },
  followUpToggle: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followUpLabel: { ...typography.bodyMedium, fontWeight: '600' },
  followUpDaysRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  daysBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  daysBtnText: { ...typography.labelSmall, fontWeight: '600' },
  quickActions: { marginTop: spacing.lg },
  quickGrid: { flexDirection: 'row', gap: spacing.md },
  quickBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  quickIcon: { fontSize: 24, marginBottom: spacing.xs },
  quickLabel: { ...typography.labelSmall, fontWeight: '600' },
  noPatientBanner: { backgroundColor: '#FEF3C7', margin: spacing.xl, marginBottom: 0, padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  noPatientText: { color: '#92400E', ...typography.labelSmall },
  saveBtn: { padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  saveBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
});

export default EMRVisitScreen;
