/**
 * PrescriptionViewScreen - View prescription details with API integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const PrescriptionViewScreen = ({ navigation, route }) => {
  const { prescriptionId } = route.params || {};
  const { user } = useUser();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    if (!prescriptionId) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      Alert.alert('Error', 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!prescription) return;
    
    try {
      const medicines = prescription.medicines?.map(m => `• ${m.name} ${m.dosage || ''}`).join('\n') || '';
      await Share.share({
        message: `Prescription from Dr. ${prescription.doctorId?.name || 'Doctor'}\nDate: ${formatDate(prescription.createdAt)}\n\nMedicines:\n${medicines}\n\nDiagnosis: ${prescription.diagnosis || 'N/A'}`,
        title: `Prescription ${prescription.prescriptionNumber}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!prescription) return;
    
    setSendingEmail(true);
    try {
      await apiClient.post(`/prescriptions/${prescriptionId}/send-email`, {
        email: user?.email,
      });
      Alert.alert('Success', 'Prescription sent to your email');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!prescription) return;
    
    setSendingWhatsApp(true);
    try {
      const response = await apiClient.post(`/prescriptions/${prescriptionId}/send-whatsapp`, {
        phone: user?.phone,
      });
      
      if (response.data.whatsappUrl) {
        await Linking.openURL(response.data.whatsappUrl);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate WhatsApp message');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleOrderMedicines = () => {
    navigation.navigate('Medicine', { prescription });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTimingLabel = (timing) => {
    const timings = {
      before_food: 'Before meals',
      after_food: 'After meals',
      with_food: 'With meals',
      empty_stomach: 'Empty stomach',
      bedtime: 'At bedtime',
    };
    return timings[timing] || timing || '';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>Prescription not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        {/* Prescription Number */}
        <View style={styles.rxHeader}>
          <Text style={styles.rxNumber}>{prescription.prescriptionNumber}</Text>
          <Text style={styles.rxDate}>{formatDate(prescription.createdAt)}</Text>
        </View>

        {/* Doctor Info */}
        <Card variant="gradient" style={styles.doctorCard}>
          <View style={styles.doctorRow}>
            <Avatar name={prescription.doctorId?.name || 'Doctor'} size="large" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {prescription.doctorId?.name || 'Unknown'}</Text>
              <Text style={styles.specialty}>{prescription.doctorId?.specialization || 'Specialist'}</Text>
            </View>
          </View>
        </Card>

        {/* Patient & Diagnosis */}
        <Card variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient</Text>
            <Text style={styles.infoValue}>
              {prescription.patientId?.name || user?.name || 'Patient'}
              {prescription.patientId?.age ? `, ${prescription.patientId.age} yrs` : ''}
            </Text>
          </View>
          {prescription.diagnosis && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diagnosis</Text>
                <Text style={styles.infoValue}>{prescription.diagnosis}</Text>
              </View>
            </>
          )}
          {prescription.symptoms?.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Symptoms</Text>
                <Text style={styles.infoValue}>{prescription.symptoms.join(', ')}</Text>
              </View>
            </>
          )}
        </Card>

        {/* Medicines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Medicines</Text>
          {prescription.medicines?.length > 0 ? (
            prescription.medicines.map((med, index) => (
              <Card key={index} variant="default" style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <View style={styles.medicineNumber}>
                    <Text style={styles.medicineNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    <Text style={styles.medicineDosage}>
                      {med.dosage} • {med.frequency}
                    </Text>
                  </View>
                </View>
                <View style={styles.medicineDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{med.duration || 'As prescribed'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Timing</Text>
                    <Text style={styles.detailValue}>{getTimingLabel(med.timing)}</Text>
                  </View>
                </View>
                {med.instructions && (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsText}>📝 {med.instructions}</Text>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <Card variant="default" style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No medicines prescribed</Text>
            </Card>
          )}
        </View>

        {/* Advice */}
        {prescription.advice && (
          <Card variant="default" style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>Doctor's Advice</Text>
            <Text style={styles.adviceText}>{prescription.advice}</Text>
          </Card>
        )}

        {/* Notes */}
        {prescription.notes && (
          <Card variant="default" style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>Additional Notes</Text>
            <Text style={styles.adviceText}>{prescription.notes}</Text>
          </Card>
        )}

        {/* Follow Up */}
        {prescription.followUpDate && (
          <Card variant="default" style={styles.followUpCard}>
            <View style={styles.followUpRow}>
              <Text style={styles.followUpIcon}>📅</Text>
              <View>
                <Text style={styles.followUpLabel}>Follow-up Date</Text>
                <Text style={styles.followUpDate}>{formatDate(prescription.followUpDate)}</Text>
                {prescription.followUpInstructions && (
                  <Text style={styles.followUpInstructions}>{prescription.followUpInstructions}</Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={handleSendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <>
                <Text style={styles.actionIcon}>📧</Text>
                <Text style={styles.actionText}>Email</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={handleSendWhatsApp}
            disabled={sendingWhatsApp}
          >
            {sendingWhatsApp ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionText}>WhatsApp</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, styles.orderBtn]} onPress={handleOrderMedicines}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.orderText}>Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  shareIcon: { fontSize: 24 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  rxNumber: { ...typography.headlineSmall, color: colors.primary, fontWeight: '700' },
  rxDate: { ...typography.bodyMedium, color: colors.textSecondary },
  doctorCard: { padding: spacing.lg, marginBottom: spacing.lg },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.headlineSmall, color: colors.textPrimary, fontWeight: '600' },
  specialty: { ...typography.bodyMedium, color: colors.textSecondary },
  infoCard: { padding: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLabel: { ...typography.labelMedium, color: colors.primary, fontWeight: '600' },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: colors.surfaceBorder, marginVertical: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md, fontWeight: '700' },
  medicineCard: { padding: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary + '40', borderRadius: borderRadius.lg },
  medicineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  medicineNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  medicineNumberText: { ...typography.labelLarge, color: colors.textInverse, fontWeight: '700' },
  medicineInfo: { flex: 1 },
  medicineName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '700', fontSize: 17 },
  medicineDosage: { ...typography.bodyMedium, color: colors.primary, marginTop: 2 },
  medicineDetails: { flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.md, backgroundColor: colors.backgroundCard, padding: spacing.md, borderRadius: borderRadius.md },
  detailItem: { flex: 1 },
  detailLabel: { ...typography.labelSmall, color: colors.textMuted, marginBottom: 2 },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600' },
  instructionsBox: { backgroundColor: colors.primaryLight + '20', padding: spacing.md, borderRadius: borderRadius.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  instructionsText: { ...typography.bodyMedium, color: colors.textPrimary },
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyCardText: { ...typography.bodyMedium, color: colors.textMuted },
  adviceCard: { padding: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.secondary + '40' },
  adviceTitle: { ...typography.labelLarge, color: colors.secondary, marginBottom: spacing.sm, fontWeight: '600' },
  adviceText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 24 },
  followUpCard: { padding: spacing.lg, marginBottom: spacing.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.warning + '40' },
  followUpRow: { flexDirection: 'row', alignItems: 'center' },
  followUpIcon: { fontSize: 28, marginRight: spacing.md },
  followUpLabel: { ...typography.labelSmall, color: colors.textMuted },
  followUpDate: { ...typography.headlineSmall, color: colors.warning, fontWeight: '700' },
  followUpInstructions: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.surfaceBorder },
  actionIcon: { fontSize: 20, marginRight: spacing.sm },
  actionText: { ...typography.labelMedium, color: colors.textPrimary, fontWeight: '500' },
  orderBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  orderText: { ...typography.labelMedium, color: colors.textInverse, fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyLarge, color: colors.textMuted },
  backButton: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  backButtonText: { ...typography.button, color: colors.textInverse },
});

export default PrescriptionViewScreen;
