/**
 * EMR Vitals Screen — Full parity with web VitalsRecorder
 * BP, Pulse, Temp (°F/°C), SpO2, RR, Blood Sugar, Weight, Height + BMI
 * Single-column full-width cards, memoized validation, larger tap targets
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { saveVitals } from '../../../services/api/emrApi';

const RANGES = {
  systolic:  { min: 60, max: 250, nMin: 90,   nMax: 140, cLow: 80,  cHigh: 180 },
  diastolic: { min: 40, max: 150, nMin: 60,   nMax: 90,  cLow: 50,  cHigh: 120 },
  pulse:     { min: 30, max: 220, nMin: 60,   nMax: 100, cLow: 40,  cHigh: 150 },
  tempF:     { min: 95, max: 108, nMin: 97,   nMax: 99.5,cLow: 95,  cHigh: 104 },
  tempC:     { min: 35, max: 42,  nMin: 36.1, nMax: 37.5,cLow: 35,  cHigh: 40  },
  spo2:      { min: 70, max: 100, nMin: 95,   nMax: 100, cLow: 90              },
  rr:        { min: 8,  max: 60,  nMin: 12,   nMax: 20,  cLow: 8,   cHigh: 30  },
  bsFasting: { min: 50, max: 500, nMin: 70,   nMax: 100, cLow: 50,  cHigh: 400 },
  bsRandom:  { min: 50, max: 500, nMin: 70,   nMax: 140, cLow: 50,  cHigh: 400 },
};

// Pure function — called once per key/val pair, result memoized by caller
const getStatus = (key, val) => {
  if (!val) return 'empty';
  const n = parseFloat(val);
  if (isNaN(n)) return 'error';
  const r = RANGES[key];
  if (!r) return 'normal';
  if (n < r.min || n > r.max) return 'error';
  if ((r.cLow && n <= r.cLow) || (r.cHigh && n >= r.cHigh)) return 'critical';
  if (n < r.nMin || n > r.nMax) return 'abnormal';
  return 'normal';
};

const STATUS_COLORS = {
  empty: null, normal: '#10B981', abnormal: '#F59E0B', critical: '#EF4444', error: '#EF4444',
};

const STATUS_BAR_COLORS = {
  empty: '#E5E7EB', normal: '#10B981', abnormal: '#F59E0B', critical: '#EF4444', error: '#EF4444',
};

const getBMICategory = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: '#F59E0B' };
  if (bmi < 25)   return { label: 'Normal',      color: '#10B981' };
  if (bmi < 30)   return { label: 'Overweight',  color: '#F97316' };
  return                  { label: 'Obese',       color: '#EF4444' };
};

// Full-width vital card with status bar
const VitalCard = ({ icon, label, status, rangeText, children, colors }) => {
  const barColor = STATUS_BAR_COLORS[status] || STATUS_BAR_COLORS.empty;
  return (
    <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statusBar, { backgroundColor: barColor }]} />
      <View style={styles.vitalCardInner}>
        <View style={styles.vitalHeader}>
          <Text style={styles.vitalIcon}>{icon}</Text>
          <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>{label}</Text>
          {status === 'critical' && <View style={styles.criticalPill}><Text style={styles.criticalPillText}>⚠️ CRITICAL</Text></View>}
          {status === 'abnormal' && <View style={styles.abnormalPill}><Text style={styles.abnormalPillText}>⚡ ABNORMAL</Text></View>}
        </View>
        {children}
        {rangeText && <Text style={[styles.rangeText, { color: colors.textMuted }]}>{rangeText}</Text>}
      </View>
    </View>
  );
};

const EMRVitalsScreen = ({ navigation, route }) => {
  const { visitId, patientName } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  const [bp, setBp] = useState({ sys: '', dia: '' });
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState({ val: '', unit: 'F' });
  const [spo2, setSpo2] = useState('');
  const [rr, setRr] = useState('');
  const [bs, setBs] = useState({ val: '', type: 'random' });
  const [weight, setWeight] = useState({ val: '', unit: 'kg' });
  const [height, setHeight] = useState({ val: '', unit: 'cm' });

  // Memoize all validation results — recomputed only when values change
  const validation = useMemo(() => ({
    systolic:  getStatus('systolic',  bp.sys),
    diastolic: getStatus('diastolic', bp.dia),
    pulse:     getStatus('pulse',     pulse),
    temp:      getStatus(temp.unit === 'F' ? 'tempF' : 'tempC', temp.val),
    spo2:      getStatus('spo2',      spo2),
    rr:        getStatus('rr',        rr),
    bs:        getStatus(bs.type === 'fasting' ? 'bsFasting' : 'bsRandom', bs.val),
  }), [bp.sys, bp.dia, pulse, temp.val, temp.unit, spo2, rr, bs.val, bs.type]);

  const bpStatus = useMemo(() =>
    validation.systolic === 'critical' || validation.diastolic === 'critical' ? 'critical'
    : validation.systolic === 'abnormal' || validation.diastolic === 'abnormal' ? 'abnormal'
    : validation.systolic === 'error' || validation.diastolic === 'error' ? 'error'
    : validation.systolic === 'normal' && validation.diastolic === 'normal' ? 'normal'
    : 'empty',
  [validation.systolic, validation.diastolic]);

  const criticalCount = useMemo(() =>
    Object.values(validation).filter(s => s === 'critical').length,
  [validation]);

  const hasErrors = useMemo(() =>
    Object.values(validation).some(s => s === 'error'),
  [validation]);

  const bmi = useMemo(() => {
    if (!weight.val || !height.val) return null;
    let wKg = parseFloat(weight.val);
    let hCm = parseFloat(height.val);
    if (isNaN(wKg) || isNaN(hCm) || hCm === 0) return null;
    if (weight.unit === 'lbs') wKg /= 2.20462;
    if (height.unit === 'ft') hCm *= 30.48;
    return Math.round((wKg / Math.pow(hCm / 100, 2)) * 10) / 10;
  }, [weight, height]);

  const toggleTempUnit = useCallback(() => {
    setTemp(prev => {
      const newUnit = prev.unit === 'F' ? 'C' : 'F';
      let newVal = prev.val;
      if (prev.val) {
        const n = parseFloat(prev.val);
        if (!isNaN(n)) {
          newVal = String(prev.unit === 'F'
            ? Math.round(((n - 32) * 5 / 9) * 10) / 10
            : Math.round((n * 9 / 5 + 32) * 10) / 10);
        }
      }
      return { val: newVal, unit: newUnit };
    });
  }, []);

  const toggleWeightUnit = useCallback(() => {
    setWeight(prev => {
      const newUnit = prev.unit === 'kg' ? 'lbs' : 'kg';
      let newVal = prev.val;
      if (prev.val) {
        const n = parseFloat(prev.val);
        if (!isNaN(n)) {
          newVal = String(newUnit === 'lbs'
            ? Math.round(n * 2.20462 * 10) / 10
            : Math.round(n / 2.20462 * 10) / 10);
        }
      }
      return { val: newVal, unit: newUnit };
    });
  }, []);

  const handleSave = async () => {
    if (hasErrors) {
      Alert.alert('Validation Error', 'Please fix invalid values before saving.');
      return;
    }
    if (!visitId) {
      Alert.alert('Error', 'No visit ID provided. Please start a visit first.');
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      if (bp.sys && bp.dia) payload.bloodPressure = { systolic: parseFloat(bp.sys), diastolic: parseFloat(bp.dia) };
      if (pulse) payload.pulse = { value: parseFloat(pulse) };
      if (temp.val) payload.temperature = { value: parseFloat(temp.val), unit: temp.unit === 'F' ? '°F' : '°C' };
      if (spo2) payload.spo2 = { value: parseFloat(spo2) };
      if (rr) payload.respiratoryRate = { value: parseFloat(rr) };
      if (bs.val) payload.bloodSugar = { value: parseFloat(bs.val), type: bs.type, unit: 'mg/dL' };
      if (weight.val) payload.weight = { value: parseFloat(weight.val), unit: weight.unit };
      if (height.val) payload.height = { value: parseFloat(height.val), unit: height.unit };

      await saveVitals(visitId, payload);
      Alert.alert('Saved', 'Vitals recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  };

  const bmiCat = getBMICategory(bmi);
  const inputStyle = (borderColor) => [styles.vitalInput, { color: colors.textPrimary, borderColor: borderColor || colors.surfaceBorder }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7C3AED', '#4F46E5']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Record Vitals</Text>
          {patientName && <Text style={styles.headerSub}>{patientName}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {criticalCount > 0 && (
        <View style={styles.criticalBanner}>
          <Text style={styles.criticalBannerText}>⚠️ {criticalCount} critical value{criticalCount > 1 ? 's' : ''} detected</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Blood Pressure — full width, side-by-side inputs */}
        <VitalCard icon="🩺" label="Blood Pressure" status={bpStatus} rangeText="Normal: 90–140 / 60–90 mmHg" colors={colors}>
          <View style={styles.bpRow}>
            <View style={styles.bpField}>
              <Text style={[styles.bpFieldLabel, { color: colors.textMuted }]}>Systolic</Text>
              <TextInput
                style={inputStyle(STATUS_COLORS[validation.systolic])}
                value={bp.sys} onChangeText={v => setBp(p => ({ ...p, sys: v }))}
                placeholder="e.g. 120" placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={[styles.bpSlash, { color: colors.textMuted }]}>/</Text>
            <View style={styles.bpField}>
              <Text style={[styles.bpFieldLabel, { color: colors.textMuted }]}>Diastolic</Text>
              <TextInput
                style={inputStyle(STATUS_COLORS[validation.diastolic])}
                value={bp.dia} onChangeText={v => setBp(p => ({ ...p, dia: v }))}
                placeholder="e.g. 80" placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>mmHg</Text>
          </View>
        </VitalCard>

        {/* Pulse */}
        <VitalCard icon="💓" label="Pulse Rate" status={validation.pulse} rangeText="Normal: 60–100 bpm" colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(STATUS_COLORS[validation.pulse]), styles.inputFlex]}
              value={pulse} onChangeText={setPulse}
              placeholder="e.g. 72" placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>bpm</Text>
          </View>
          {validation.pulse === 'error' && <Text style={styles.errorText}>Invalid value</Text>}
        </VitalCard>

        {/* Temperature with unit toggle */}
        <VitalCard icon="🌡️" label="Temperature" status={validation.temp}
          rangeText={`Normal: ${temp.unit === 'F' ? '97–99.5°F' : '36.1–37.5°C'}`} colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(STATUS_COLORS[validation.temp]), styles.inputFlex]}
              value={temp.val} onChangeText={v => setTemp(p => ({ ...p, val: v }))}
              placeholder={temp.unit === 'F' ? 'e.g. 98.6' : 'e.g. 37.0'}
              placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
            />
            <TouchableOpacity style={[styles.unitToggle, { backgroundColor: colors.primary }]} onPress={toggleTempUnit}>
              <Text style={styles.unitToggleText}>°{temp.unit}</Text>
            </TouchableOpacity>
          </View>
          {validation.temp === 'error' && <Text style={styles.errorText}>Invalid value</Text>}
        </VitalCard>

        {/* SpO2 */}
        <VitalCard icon="🫁" label="SpO2 (Oxygen Saturation)" status={validation.spo2} rangeText="Normal: 95–100%" colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(STATUS_COLORS[validation.spo2]), styles.inputFlex]}
              value={spo2} onChangeText={setSpo2}
              placeholder="e.g. 98" placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>%</Text>
          </View>
          {validation.spo2 === 'error' && <Text style={styles.errorText}>Invalid value</Text>}
        </VitalCard>

        {/* Respiratory Rate */}
        <VitalCard icon="🌬️" label="Respiratory Rate" status={validation.rr} rangeText="Normal: 12–20 /min" colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(STATUS_COLORS[validation.rr]), styles.inputFlex]}
              value={rr} onChangeText={setRr}
              placeholder="e.g. 16" placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>/min</Text>
          </View>
          {validation.rr === 'error' && <Text style={styles.errorText}>Invalid value</Text>}
        </VitalCard>

        {/* Blood Sugar with type selector */}
        <VitalCard icon="🩸" label="Blood Sugar" status={validation.bs}
          rangeText={bs.type === 'fasting' ? 'Normal fasting: 70–100 mg/dL' : 'Normal random: 70–140 mg/dL'}
          colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(STATUS_COLORS[validation.bs]), styles.inputFlex]}
              value={bs.val} onChangeText={v => setBs(p => ({ ...p, val: v }))}
              placeholder="e.g. 95" placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>mg/dL</Text>
          </View>
          <View style={styles.bsTypeRow}>
            {[
              { key: 'fasting',  label: 'Fasting' },
              { key: 'random',   label: 'Random' },
              { key: 'postMeal', label: 'Post Meal' },
            ].map(t => (
              <TouchableOpacity key={t.key} onPress={() => setBs(p => ({ ...p, type: t.key }))}
                style={[styles.bsTypeBtn, bs.type === t.key && { backgroundColor: colors.primary }]}>
                <Text style={[styles.bsTypeTxt, { color: bs.type === t.key ? '#fff' : colors.textSecondary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {validation.bs === 'error' && <Text style={styles.errorText}>Invalid value</Text>}
        </VitalCard>

        {/* Weight */}
        <VitalCard icon="⚖️" label="Weight" status="empty" colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(colors.surfaceBorder), styles.inputFlex]}
              value={weight.val} onChangeText={v => setWeight(p => ({ ...p, val: v }))}
              placeholder="Enter weight" placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={[styles.unitToggle, { backgroundColor: colors.primary }]} onPress={toggleWeightUnit}>
              <Text style={styles.unitToggleText}>{weight.unit}</Text>
            </TouchableOpacity>
          </View>
        </VitalCard>

        {/* Height */}
        <VitalCard icon="📏" label="Height" status="empty" colors={colors}>
          <View style={styles.inputRow}>
            <TextInput
              style={[inputStyle(colors.surfaceBorder), styles.inputFlex]}
              value={height.val} onChangeText={v => setHeight(p => ({ ...p, val: v }))}
              placeholder="Enter height" placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.unitLabel, { color: colors.textMuted }]}>{height.unit}</Text>
          </View>
        </VitalCard>

        {/* BMI */}
        {bmi && (
          <View style={[styles.bmiCard, { backgroundColor: bmiCat?.color + '20', borderColor: bmiCat?.color }]}>
            <Text style={[styles.bmiLabel, { color: colors.textSecondary }]}>Calculated BMI</Text>
            <Text style={[styles.bmiValue, { color: bmiCat?.color }]}>{bmi} — {bmiCat?.label}</Text>
          </View>
        )}

        <TouchableOpacity onPress={handleSave} disabled={saving || hasErrors} activeOpacity={0.8}>
          <LinearGradient
            colors={saving || hasErrors ? ['#9CA3AF', '#6B7280'] : ['#7C3AED', '#4F46E5']}
            style={styles.saveBtn}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Save Vitals</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall },
  criticalBanner: { backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FECACA', padding: spacing.md, alignItems: 'center' },
  criticalBannerText: { color: '#DC2626', ...typography.bodyMedium, fontWeight: '600' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },

  // Full-width vital card
  vitalCard: { borderRadius: borderRadius.xl, marginBottom: spacing.md, overflow: 'hidden', flexDirection: 'row' },
  statusBar: { width: 5 },
  vitalCardInner: { flex: 1, padding: spacing.lg },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.xs },
  vitalIcon: { fontSize: 20 },
  vitalLabel: { ...typography.bodyMedium, fontWeight: '600', flex: 1 },
  criticalPill: { backgroundColor: '#FEE2E2', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  criticalPillText: { color: '#DC2626', ...typography.labelSmall, fontWeight: '700' },
  abnormalPill: { backgroundColor: '#FEF3C7', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  abnormalPillText: { color: '#D97706', ...typography.labelSmall, fontWeight: '700' },
  rangeText: { ...typography.labelSmall, marginTop: spacing.sm },
  errorText: { color: '#EF4444', ...typography.labelSmall, marginTop: spacing.xs },

  // Input styles — larger tap targets
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputFlex: { flex: 1 },
  vitalInput: { borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 14, ...typography.bodyLarge, minHeight: 52 },
  unitLabel: { ...typography.bodyMedium, fontWeight: '600', minWidth: 40 },
  unitToggle: { paddingHorizontal: spacing.md, paddingVertical: 14, borderRadius: borderRadius.md, minWidth: 60, alignItems: 'center' },
  unitToggleText: { color: '#fff', ...typography.bodyMedium, fontWeight: '700' },

  // BP specific
  bpRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  bpField: { flex: 1 },
  bpFieldLabel: { ...typography.labelSmall, marginBottom: spacing.xs },
  bpSlash: { fontSize: 28, fontWeight: '700', paddingBottom: 10 },

  // Blood sugar type selector
  bsTypeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  bsTypeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  bsTypeTxt: { ...typography.labelMedium, fontWeight: '600' },

  // BMI
  bmiCard: { padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 2, alignItems: 'center', marginBottom: spacing.lg },
  bmiLabel: { ...typography.labelSmall },
  bmiValue: { ...typography.headlineSmall, fontWeight: '700' },

  saveBtn: { padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.xl },
  saveBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
});

export default EMRVitalsScreen;
