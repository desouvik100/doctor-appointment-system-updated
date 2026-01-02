/**
 * PrescriptionViewScreen - View prescription details with download/share
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';

const PrescriptionViewScreen = ({ navigation, route }) => {
  const { prescriptionId } = route.params || {};

  // Mock prescription data
  const prescription = {
    id: prescriptionId || 'RX123456',
    date: '2026-01-02',
    doctor: { name: 'Dr. Sarah Wilson', specialty: 'Cardiologist' },
    patient: { name: 'John Doe', age: 35 },
    diagnosis: 'Hypertension, Type 2 Diabetes',
    medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days', instructions: 'After meals' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Morning' },
      { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days', instructions: 'After breakfast' },
    ],
    advice: 'Reduce salt intake. Exercise 30 mins daily. Follow up after 1 month.',
    followUp: '2026-02-02',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Prescription from ${prescription.doctor.name}\nDate: ${prescription.date}\nMedicines: ${prescription.medicines.map(m => m.name).join(', ')}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Prescription PDF will be downloaded');
  };

  const handleOrderMedicines = () => {
    navigation.navigate('Medicine', { prescription });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Info */}
        <Card variant="gradient" style={styles.doctorCard}>
          <View style={styles.doctorRow}>
            <Avatar name={prescription.doctor.name} size="large" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{prescription.doctor.name}</Text>
              <Text style={styles.specialty}>{prescription.doctor.specialty}</Text>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Date</Text>
              <Text style={styles.dateValue}>{prescription.date}</Text>
            </View>
          </View>
        </Card>

        {/* Patient & Diagnosis */}
        <Card variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient</Text>
            <Text style={styles.infoValue}>{prescription.patient.name}, {prescription.patient.age} yrs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Diagnosis</Text>
            <Text style={styles.infoValue}>{prescription.diagnosis}</Text>
          </View>
        </Card>

        {/* Medicines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicines</Text>
          {prescription.medicines.map((med, index) => (
            <Card key={index} variant="default" style={styles.medicineCard}>
              <View style={styles.medicineHeader}>
                <Text style={styles.medicineIcon}>💊</Text>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{med.name}</Text>
                  <Text style={styles.medicineDosage}>{med.dosage} • {med.frequency}</Text>
                </View>
              </View>
              <View style={styles.medicineDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{med.duration}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Instructions</Text>
                  <Text style={styles.detailValue}>{med.instructions}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Advice */}
        <Card variant="default" style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>Doctor's Advice</Text>
          <Text style={styles.adviceText}>{prescription.advice}</Text>
        </Card>

        {/* Follow Up */}
        <Card variant="default" style={styles.followUpCard}>
          <View style={styles.followUpRow}>
            <Text style={styles.followUpIcon}>📅</Text>
            <View>
              <Text style={styles.followUpLabel}>Follow-up Date</Text>
              <Text style={styles.followUpDate}>{prescription.followUp}</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
            <Text style={styles.actionIcon}>⬇️</Text>
            <Text style={styles.actionText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.orderBtn]} onPress={handleOrderMedicines}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.orderText}>Order Medicines</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  shareIcon: { fontSize: 24 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  doctorCard: { padding: spacing.lg, marginBottom: spacing.lg },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.headlineSmall, color: colors.textPrimary },
  specialty: { ...typography.bodyMedium, color: colors.textSecondary },
  dateBox: { alignItems: 'flex-end' },
  dateLabel: { ...typography.labelSmall, color: colors.textMuted },
  dateValue: { ...typography.bodyMedium, color: colors.textPrimary },
  infoCard: { padding: spacing.lg, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { ...typography.labelMedium, color: colors.textMuted },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  medicineCard: { padding: spacing.lg, marginBottom: spacing.md },
  medicineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  medicineIcon: { fontSize: 24, marginRight: spacing.md },
  medicineInfo: { flex: 1 },
  medicineName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  medicineDosage: { ...typography.bodySmall, color: colors.textSecondary },
  medicineDetails: { flexDirection: 'row', gap: spacing.xl },
  detailItem: {},
  detailLabel: { ...typography.labelSmall, color: colors.textMuted },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary },
  adviceCard: { padding: spacing.lg, marginBottom: spacing.lg },
  adviceTitle: { ...typography.labelMedium, color: colors.textMuted, marginBottom: spacing.sm },
  adviceText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 22 },
  followUpCard: { padding: spacing.lg, marginBottom: spacing.xl },
  followUpRow: { flexDirection: 'row', alignItems: 'center' },
  followUpIcon: { fontSize: 24, marginRight: spacing.md },
  followUpLabel: { ...typography.labelSmall, color: colors.textMuted },
  followUpDate: { ...typography.bodyLarge, color: colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.surfaceBorder },
  actionIcon: { fontSize: 18, marginRight: spacing.sm },
  actionText: { ...typography.labelMedium, color: colors.textSecondary },
  orderBtn: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  orderText: { ...typography.labelMedium, color: colors.primary },
});

export default PrescriptionViewScreen;
