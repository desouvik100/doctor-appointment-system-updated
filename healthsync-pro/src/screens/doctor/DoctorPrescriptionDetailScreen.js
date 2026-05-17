/**
 * Doctor Prescription Detail Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { getPrescriptionDetails } from '../../services/api/doctorDashboardApi';

const DoctorPrescriptionDetailScreen = ({ navigation, route }) => {
  const { prescriptionId } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prescriptionId) { setLoading(false); return; }
    getPrescriptionDetails(prescriptionId)
      .then(data => setPrescription(data?.prescription || data))
      .catch(err => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Prescription</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : !prescription ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Prescription not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Patient Info */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Patient</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {prescription.patientId?.name || prescription.patientName || 'Unknown'}
            </Text>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 8 }]}>Date</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : '--'}
            </Text>
            {prescription.diagnosis && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: 8 }]}>Diagnosis</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{prescription.diagnosis}</Text>
              </>
            )}
          </View>

          {/* Medicines */}
          {prescription.medicines?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💊 Medicines</Text>
              {prescription.medicines.map((med, i) => (
                <View key={i} style={[styles.medRow, i > 0 && styles.medBorder]}>
                  <Text style={[styles.medName, { color: colors.textPrimary }]}>{med.name}</Text>
                  <Text style={[styles.medDetail, { color: colors.textSecondary }]}>
                    {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
                  </Text>
                  {med.instructions && (
                    <Text style={[styles.medInstructions, { color: colors.textMuted }]}>{med.instructions}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          {prescription.notes && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📝 Notes</Text>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{prescription.notes}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#fff' },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  medRow: { paddingVertical: 8 },
  medBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  medName: { fontSize: 14, fontWeight: '600' },
  medDetail: { fontSize: 13, marginTop: 2 },
  medInstructions: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16 },
});

export default DoctorPrescriptionDetailScreen;
