/**
 * Admin Add Clinic Screen - Create New Clinic
 * 100% Parity with Web Admin
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
import adminApi from '../../services/api/adminApi';

const AdminAddClinicScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    timings: '',
    description: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city) {
      Alert.alert('Error', 'Please fill in required fields (Name, Address, City)');
      return;
    }
    setLoading(true);
    try {
      await adminApi.createClinic(form);
      Alert.alert('Success', 'Clinic created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create clinic');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, field, placeholder, multiline, required }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { backgroundColor: colors.surface, color: colors.textPrimary }
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={form[field]}
        onChangeText={(value) => handleChange(field, value)}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Clinic</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <InputField label="Clinic Name" field="name" placeholder="Enter clinic name" required />
        <InputField label="Address" field="address" placeholder="Enter full address" required multiline />
        <InputField label="City" field="city" placeholder="Enter city" required />
        <InputField label="Phone" field="phone" placeholder="Enter phone number" />
        <InputField label="Email" field="email" placeholder="Enter email address" />
        <InputField label="Timings" field="timings" placeholder="e.g., Mon-Sat 9AM-6PM" />
        <InputField label="Description" field="description" placeholder="Brief description" multiline />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Clinic</Text>
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
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { ...typography.labelMedium, marginBottom: spacing.xs },
  required: { color: '#EF4444' },
  input: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  inputMultiline: { height: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#F39C12', paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.lg },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
});

export default AdminAddClinicScreen;
