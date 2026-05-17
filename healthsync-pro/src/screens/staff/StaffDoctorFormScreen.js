/**
 * Staff Doctor Form Screen - Add/Edit Doctor
 * Allows staff to add new doctors or edit existing ones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const StaffDoctorFormScreen = ({ navigation, route }) => {
  const { doctor: editDoctor } = route.params || {};
  const { user } = useUser();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: editDoctor?.name || '',
    email: editDoctor?.email || '',
    phone: editDoctor?.phone || '',
    specialization: editDoctor?.specialization || '',
    consultationFee: editDoctor?.consultationFee?.toString() || '500',
    experience: editDoctor?.experience?.toString() || '0',
    qualification: editDoctor?.qualification || 'MBBS',
  });

  const specializations = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedic',
    'Pediatrician', 'Gynecologist', 'ENT Specialist', 'Neurologist',
    'Psychiatrist', 'Dentist', 'Ophthalmologist', 'Other'
  ];

  const qualifications = ['MBBS', 'MD', 'MS', 'BDS', 'MDS', 'BAMS', 'BHMS', 'Other'];

  const handleSubmit = async () => {
    // Validation
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter doctor name');
      return;
    }
    if (!form.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (!form.specialization) {
      Alert.alert('Error', 'Please select specialization');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        consultationFee: parseInt(form.consultationFee) || 500,
        experience: parseInt(form.experience) || 0,
        clinicId: user?.clinicId?._id || user?.clinicId,
        clinicName: user?.clinicId?.name || 'Clinic',
      };

      if (editDoctor) {
        await apiClient.put(`/doctors/${editDoctor._id}`, payload);
        Alert.alert('Success', 'Doctor updated successfully');
      } else {
        await apiClient.post('/doctors', payload);
        Alert.alert('Success', 'Doctor added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType, multiline }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          { backgroundColor: colors.background, color: colors.textPrimary },
          multiline && styles.textArea
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  const SelectField = ({ label, value, options, onSelect }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        <View style={styles.optionsRow}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionBtn,
                { backgroundColor: colors.background },
                value === option && styles.optionBtnActive,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text style={[
                styles.optionText,
                { color: value === option ? '#FF6B6B' : colors.textSecondary }
              ]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {editDoctor ? 'Edit Doctor' : 'Add Doctor'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <Card style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <InputField
            label="Full Name *"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder="Dr. John Doe"
          />

          <InputField
            label="Email *"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            placeholder="doctor@example.com"
            keyboardType="email-address"
          />

          <InputField
            label="Phone *"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
          />

          <SelectField
            label="Specialization *"
            value={form.specialization}
            options={specializations}
            onSelect={(val) => setForm({ ...form, specialization: val })}
          />

          <SelectField
            label="Qualification"
            value={form.qualification}
            options={qualifications}
            onSelect={(val) => setForm({ ...form, qualification: val })}
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Consultation Fee (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                value={form.consultationFee}
                onChangeText={(text) => setForm({ ...form, consultationFee: text })}
                placeholder="500"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Experience (years)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                value={form.experience}
                onChangeText={(text) => setForm({ ...form, experience: text })}
                placeholder="5"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.submitBtnGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {editDoctor ? 'Update Doctor' : 'Add Doctor'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },

  formCard: { margin: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.xl },
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { ...typography.labelMedium, marginBottom: spacing.xs },
  input: { padding: spacing.md, borderRadius: borderRadius.md, ...typography.bodyMedium },
  textArea: { minHeight: 100 },
  row: { flexDirection: 'row' },

  optionsScroll: { marginTop: spacing.xs },
  optionsRow: { flexDirection: 'row', gap: spacing.sm },
  optionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  optionBtnActive: { borderWidth: 2, borderColor: '#FF6B6B' },
  optionText: { ...typography.labelSmall },

  submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', ...typography.labelLarge, fontWeight: '700' },
});

export default StaffDoctorFormScreen;
