/**
 * Staff Register Patient Screen - Register new patients
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const StaffRegisterPatientScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: '',
    emergencyContact: '',
    allergies: '',
  });

  const genders = ['Male', 'Female', 'Other'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Patient name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    if (formData.phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const clinicId = typeof user?.clinicId === 'object' ? user.clinicId._id : user?.clinicId;
      
      const patientData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        bloodType: formData.bloodType || undefined,
        address: formData.address.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        clinicId: clinicId,
        registeredBy: user?.id || user?._id,
        role: 'patient',
      };

      // Try EMR patient registration first, fallback to user registration
      let response;
      try {
        response = await apiClient.post('/emr/patients/register', patientData);
      } catch (emrError) {
        // Fallback to regular user registration
        response = await apiClient.post('/users/register-patient', patientData);
      }

      if (response.data.success || response.data.patient || response.data.user) {
        Alert.alert(
          'Success',
          `Patient ${formData.name} registered successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Patient registration error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType, multiline }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder },
          multiline && styles.textArea
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const SelectField = ({ label, value, options, onSelect }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionChip,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              value === option && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.optionText,
              { color: colors.textSecondary },
              value === option && { color: '#fff' }
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Register Patient</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: colors.backgroundCard, borderColor: colors.surfaceBorder }]}>
          <View style={styles.formHeader}>
            <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.formIcon}>
              <Text style={styles.formEmoji}>👤</Text>
            </LinearGradient>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Patient Information</Text>
          </View>

          <InputField
            label="Full Name *"
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="Enter patient's full name"
          />

          <InputField
            label="Phone Number *"
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="Enter email address"
            keyboardType="email-address"
          />

          <InputField
            label="Date of Birth"
            value={formData.dateOfBirth}
            onChangeText={(v) => updateField('dateOfBirth', v)}
            placeholder="DD/MM/YYYY"
          />

          <SelectField
            label="Gender"
            value={formData.gender}
            options={genders}
            onSelect={(v) => updateField('gender', v)}
          />

          <SelectField
            label="Blood Type"
            value={formData.bloodType}
            options={bloodTypes}
            onSelect={(v) => updateField('bloodType', v)}
          />

          <InputField
            label="Address"
            value={formData.address}
            onChangeText={(v) => updateField('address', v)}
            placeholder="Enter address"
            multiline
          />

          <InputField
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChangeText={(v) => updateField('emergencyContact', v)}
            placeholder="Emergency contact number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Known Allergies"
            value={formData.allergies}
            onChangeText={(v) => updateField('allergies', v)}
            placeholder="List any known allergies"
            multiline
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.registerBtnGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>Register Patient</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },
  formCard: { borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1, marginBottom: spacing.xl },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  formIcon: { width: 50, height: 50, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  formEmoji: { fontSize: 24 },
  formTitle: { ...typography.headlineSmall, fontWeight: '600' },
  inputGroup: { marginBottom: spacing.lg },
  label: { ...typography.labelMedium, marginBottom: spacing.sm },
  input: { ...typography.bodyLarge, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  optionsScroll: { flexDirection: 'row' },
  optionChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm, borderWidth: 1 },
  optionText: { ...typography.labelMedium },
  registerBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  registerBtnText: { color: '#fff', ...typography.button, fontWeight: '700' },
});

export default StaffRegisterPatientScreen;
