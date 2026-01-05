/**
 * Doctor Create Prescription Screen - Write New Prescription
 * 100% Parity with Web Doctor Dashboard
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import doctorApi from '../../services/api/doctorDashboardApi';

const DoctorCreatePrescriptionScreen = ({ navigation, route }) => {
  const { appointmentId, patientId, patient } = route.params || {};
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    diagnosis: '',
    notes: '',
    followUpDate: '',
  });
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!form.diagnosis) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return;
    }
    if (!medicines[0].name) {
      Alert.alert('Error', 'Please add at least one medicine');
      return;
    }

    setLoading(true);
    try {
      const prescriptionData = {
        doctorId: user?.id,
        patientId: patientId || patient?._id,
        appointmentId,
        diagnosis: form.diagnosis,
        notes: form.notes,
        followUpDate: form.followUpDate || null,
        medicines: medicines.filter(m => m.name),
      };

      await doctorApi.createPrescription(prescriptionData);
      Alert.alert('Success', 'Prescription created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Prescription</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Info */}
        {patient && (
          <View style={[styles.patientCard, { backgroundColor: colors.surface }]}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>{patient.name?.charAt(0) || 'P'}</Text>
            </View>
            <View>
              <Text style={[styles.patientName, { color: colors.textPrimary }]}>{patient.name}</Text>
              <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{patient.phone || patient.email}</Text>
            </View>
          </View>
        )}

        {/* Diagnosis */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Diagnosis *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Enter diagnosis"
            placeholderTextColor={colors.textMuted}
            value={form.diagnosis}
            onChangeText={(value) => handleChange('diagnosis', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Medicines */}
        <View style={styles.medicinesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Medicines</Text>
            <TouchableOpacity style={styles.addMedicineBtn} onPress={addMedicine}>
              <Text style={styles.addMedicineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {medicines.map((medicine, index) => (
            <View key={index} style={[styles.medicineCard, { backgroundColor: colors.surface }]}>
              <View style={styles.medicineHeader}>
                <Text style={[styles.medicineNumber, { color: colors.textMuted }]}>Medicine {index + 1}</Text>
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedicine(index)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                style={[styles.medicineInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder="Medicine name *"
                placeholderTextColor={colors.textMuted}
                value={medicine.name}
                onChangeText={(value) => handleMedicineChange(index, 'name', value)}
              />
              
              <View style={styles.medicineRow}>
                <TextInput
                  style={[styles.medicineInputHalf, { backgroundColor: colors.background, color: colors.textPrimary }]}
                  placeholder="Dosage (e.g., 500mg)"
                  placeholderTextColor={colors.textMuted}
                  value={medicine.dosage}
                  onChangeText={(value) => handleMedicineChange(index, 'dosage', value)}
                />
                <TextInput
                  style={[styles.medicineInputHalf, { backgroundColor: colors.background, color: colors.textPrimary }]}
                  placeholder="Frequency (e.g., 2x daily)"
                  placeholderTextColor={colors.textMuted}
                  value={medicine.frequency}
                  onChangeText={(value) => handleMedicineChange(index, 'frequency', value)}
                />
              </View>
              
              <View style={styles.medicineRow}>
                <TextInput
                  style={[styles.medicineInputHalf, { backgroundColor: colors.background, color: colors.textPrimary }]}
                  placeholder="Duration (e.g., 7 days)"
                  placeholderTextColor={colors.textMuted}
                  value={medicine.duration}
                  onChangeText={(value) => handleMedicineChange(index, 'duration', value)}
                />
                <TextInput
                  style={[styles.medicineInputHalf, { backgroundColor: colors.background, color: colors.textPrimary }]}
                  placeholder="Instructions"
                  placeholderTextColor={colors.textMuted}
                  value={medicine.instructions}
                  onChangeText={(value) => handleMedicineChange(index, 'instructions', value)}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Any additional instructions for the patient"
            placeholderTextColor={colors.textMuted}
            value={form.notes}
            onChangeText={(value) => handleChange('notes', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Follow-up */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Follow-up Date (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={form.followUpDate}
            onChangeText={(value) => handleChange('followUpDate', value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>💊 Create Prescription</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  patientCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientAvatarText: { fontSize: 18, fontWeight: '700', color: '#6C5CE7' },
  patientName: { ...typography.bodyLarge, fontWeight: '600' },
  patientPhone: { ...typography.bodySmall },
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { ...typography.labelMedium, marginBottom: spacing.xs },
  input: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  inputMultiline: { height: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  medicinesSection: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600' },
  addMedicineBtn: { backgroundColor: '#6C5CE720', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  addMedicineBtnText: { color: '#6C5CE7', fontWeight: '600', ...typography.labelMedium },
  medicineCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  medicineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  medicineNumber: { ...typography.labelMedium },
  removeBtn: { color: '#EF4444', fontSize: 18, fontWeight: '600' },
  medicineInput: { height: 44, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm, ...typography.bodyMedium },
  medicineRow: { flexDirection: 'row', gap: spacing.sm },
  medicineInputHalf: { flex: 1, height: 44, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm, ...typography.bodyMedium },
  submitBtn: { backgroundColor: '#6C5CE7', paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.lg },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
});

export default DoctorCreatePrescriptionScreen;
