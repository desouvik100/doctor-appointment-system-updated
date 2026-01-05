/**
 * Admin Edit Doctor Screen - Update Doctor Details
 * 100% Parity with Web Admin
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import adminApi from '../../services/api/adminApi';

const AdminEditDoctorScreen = ({ navigation, route }) => {
  const { doctorId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [showClinicPicker, setShowClinicPicker] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    consultationFee: '',
    clinicId: '',
    clinicName: '',
    availability: 'Available',
  });

  const fetchDoctor = useCallback(async () => {
    try {
      const data = await adminApi.getDoctorById(doctorId);
      const doctor = data.doctor || data;
      setForm({
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        qualification: doctor.qualification || '',
        experience: String(doctor.experience || ''),
        consultationFee: String(doctor.consultationFee || ''),
        clinicId: doctor.clinicId?._id || doctor.clinicId || '',
        clinicName: doctor.clinicId?.name || '',
        availability: doctor.availability || 'Available',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load doctor');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctor();
    fetchClinics();
  }, [fetchDoctor]);

  const fetchClinics = async () => {
    try {
      const data = await adminApi.getClinics();
      setClinics(Array.isArray(data) ? data : data.clinics || []);
    } catch (error) {
      console.log('Error fetching clinics:', error.message);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateDoctor(doctorId, {
        ...form,
        experience: parseInt(form.experience) || 0,
        consultationFee: parseInt(form.consultationFee) || 500,
      });
      Alert.alert('Success', 'Doctor updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update doctor');
    } finally {
      setSaving(false);
    }
  };


  const InputField = ({ label, value, onChangeText, placeholder, keyboardType, multiline }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Doctor</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <InputField label="Full Name *" value={form.name} onChangeText={(v) => setForm({...form, name: v})} placeholder="Dr. John Doe" />
        <InputField label="Email *" value={form.email} onChangeText={(v) => setForm({...form, email: v})} placeholder="doctor@email.com" keyboardType="email-address" />
        <InputField label="Phone" value={form.phone} onChangeText={(v) => setForm({...form, phone: v})} placeholder="+91 9876543210" keyboardType="phone-pad" />
        <InputField label="Specialization" value={form.specialization} onChangeText={(v) => setForm({...form, specialization: v})} placeholder="Cardiologist" />
        <InputField label="Qualification" value={form.qualification} onChangeText={(v) => setForm({...form, qualification: v})} placeholder="MBBS, MD" />
        <InputField label="Experience (years)" value={form.experience} onChangeText={(v) => setForm({...form, experience: v})} placeholder="10" keyboardType="numeric" />
        <InputField label="Consultation Fee (₹)" value={form.consultationFee} onChangeText={(v) => setForm({...form, consultationFee: v})} placeholder="500" keyboardType="numeric" />

        {/* Clinic Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Clinic</Text>
          <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surface }]} onPress={() => setShowClinicPicker(!showClinicPicker)}>
            <Text style={[styles.pickerText, { color: form.clinicName ? colors.textPrimary : colors.textMuted }]}>
              {form.clinicName || 'Select Clinic'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {showClinicPicker && (
            <View style={[styles.pickerList, { backgroundColor: colors.surface }]}>
              {clinics.map((clinic) => (
                <TouchableOpacity key={clinic._id} style={styles.pickerItem} onPress={() => {
                  setForm({...form, clinicId: clinic._id, clinicName: clinic.name});
                  setShowClinicPicker(false);
                }}>
                  <Text style={[styles.pickerItemText, { color: colors.textPrimary }]}>{clinic.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Availability</Text>
          <View style={styles.availabilityRow}>
            {['Available', 'Busy', 'On Leave'].map((status) => (
              <TouchableOpacity key={status} style={[styles.availabilityBtn, form.availability === status && styles.availabilityBtnActive]} onPress={() => setForm({...form, availability: status})}>
                <Text style={[styles.availabilityText, form.availability === status && styles.availabilityTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={[styles.submitBtn, saving && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={saving}>
          <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Update Doctor'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  inputContainer: { marginBottom: spacing.lg },
  inputLabel: { ...typography.labelMedium, marginBottom: spacing.sm },
  input: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  pickerBtn: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { ...typography.bodyMedium },
  pickerArrow: { fontSize: 12 },
  pickerList: { borderRadius: borderRadius.lg, marginTop: spacing.sm, maxHeight: 200 },
  pickerItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  pickerItemText: { ...typography.bodyMedium },
  availabilityRow: { flexDirection: 'row', gap: spacing.sm },
  availabilityBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  availabilityBtnActive: { backgroundColor: '#F39C12' },
  availabilityText: { ...typography.labelMedium, color: '#666' },
  availabilityTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#F39C12', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '600' },
});

export default AdminEditDoctorScreen;
