/**
 * Staff Book Appointment Screen - Book Appointment for Patient
 * 100% Parity with Web Staff Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import staffApi from '../../services/api/staffDashboardApi';

const StaffBookAppointmentScreen = ({ navigation, route }) => {
  const { patientId, patientName, doctorId, doctorName } = route.params || {};
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [form, setForm] = useState({
    patientId: patientId || '',
    patientName: patientName || '',
    doctorId: doctorId || '',
    doctorName: doctorName || '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'consultation',
    notes: '',
  });

  const fetchDoctors = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const data = await staffApi.getClinicDoctors(user.clinicId);
      const list = data?.doctors || data || [];
      setDoctors(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log('Error fetching doctors:', error.message);
    }
  }, [user?.clinicId]);

  const fetchSlots = useCallback(async () => {
    if (!form.doctorId || !form.date) return;
    setLoadingSlots(true);
    try {
      const data = await staffApi.getDoctorAvailableSlots(form.doctorId, form.date);
      const slotList = data?.slots || data || [];
      setSlots(Array.isArray(slotList) ? slotList : []);
    } catch (error) {
      console.log('Error fetching slots:', error.message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [form.doctorId, form.date]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleSubmit = async () => {
    if (!form.patientId || !form.doctorId || !form.date || !form.time) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await staffApi.bookAppointment({
        patientId: form.patientId,
        doctorId: form.doctorId,
        clinicId: user?.clinicId,
        date: form.date,
        time: form.time,
        type: form.type,
        notes: form.notes,
      });
      Alert.alert('Success', 'Appointment booked successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const appointmentTypes = [
    { key: 'consultation', label: 'Consultation' },
    { key: 'follow-up', label: 'Follow-up' },
    { key: 'emergency', label: 'Emergency' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Book Appointment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Patient</Text>
          {form.patientName ? (
            <View style={[styles.selectedCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.selectedName, { color: colors.textPrimary }]}>{form.patientName}</Text>
              <TouchableOpacity onPress={() => setForm({ ...form, patientId: '', patientName: '' })}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectBtn, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffPatients')}
            >
              <Text style={[styles.selectBtnText, { color: colors.textSecondary }]}>Select Patient</Text>
              <Text style={styles.selectIcon}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Doctor Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Doctor</Text>
          {form.doctorName ? (
            <View style={[styles.selectedCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.selectedName, { color: colors.textPrimary }]}>Dr. {form.doctorName}</Text>
              <TouchableOpacity onPress={() => setForm({ ...form, doctorId: '', doctorName: '', time: '' })}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.doctorList}>
              {doctors.map(doc => (
                <TouchableOpacity
                  key={doc._id}
                  style={[styles.doctorOption, { backgroundColor: colors.surface }]}
                  onPress={() => setForm({ ...form, doctorId: doc._id, doctorName: doc.name })}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorAvatarText}>{doc.name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, { color: colors.textPrimary }]}>Dr. {doc.name}</Text>
                    <Text style={[styles.doctorSpec, { color: colors.textMuted }]}>{doc.specialization}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            value={form.date}
            onChangeText={(text) => setForm({ ...form, date: text, time: '' })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Time Slots */}
        {form.doctorId && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Slots</Text>
            {loadingSlots ? (
              <ActivityIndicator color="#FF6B6B" />
            ) : slots.length === 0 ? (
              <Text style={[styles.noSlots, { color: colors.textMuted }]}>No slots available for this date</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotBtn,
                      { backgroundColor: colors.surface },
                      form.time === slot && styles.slotBtnActive
                    ]}
                    onPress={() => setForm({ ...form, time: slot })}
                  >
                    <Text style={[styles.slotText, { color: colors.textPrimary }, form.time === slot && styles.slotTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Type</Text>
          <View style={styles.typeRow}>
            {appointmentTypes.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeBtn,
                  { backgroundColor: colors.surface },
                  form.type === type.key && styles.typeBtnActive
                ]}
                onPress={() => setForm({ ...form, type: type.key })}
              >
                <Text style={[styles.typeText, { color: colors.textSecondary }, form.type === type.key && styles.typeTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
            placeholder="Add any notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Book Appointment</Text>
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
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  selectedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: borderRadius.lg },
  selectedName: { ...typography.bodyMedium, fontWeight: '600' },
  changeBtn: { color: '#FF6B6B', fontWeight: '600' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: borderRadius.lg },
  selectBtnText: { ...typography.bodyMedium },
  selectIcon: { fontSize: 24, color: '#ccc' },
  doctorList: { gap: spacing.sm },
  doctorOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg },
  doctorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  doctorAvatarText: { color: '#6C5CE7', fontWeight: '700' },
  doctorInfo: { flex: 1 },
  doctorName: { ...typography.bodyMedium, fontWeight: '600' },
  doctorSpec: { ...typography.labelSmall },
  input: { padding: spacing.lg, borderRadius: borderRadius.lg, ...typography.bodyMedium },
  noSlots: { ...typography.bodyMedium, textAlign: 'center', paddingVertical: spacing.lg },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'transparent' },
  slotBtnActive: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  slotText: { ...typography.bodySmall },
  slotTextActive: { color: '#fff', fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  typeBtnActive: { backgroundColor: '#FF6B6B20', borderColor: '#FF6B6B' },
  typeText: { ...typography.bodySmall },
  typeTextActive: { color: '#FF6B6B', fontWeight: '600' },
  textArea: { padding: spacing.lg, borderRadius: borderRadius.lg, ...typography.bodyMedium, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#FF6B6B', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '600' },
});

export default StaffBookAppointmentScreen;
