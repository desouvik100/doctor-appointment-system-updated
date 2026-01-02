/**
 * CancelModal - Appointment cancellation with reason selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import Button from '../../../components/common/Button';

const CancelModal = ({ visible, onClose, onConfirm, refundAmount }) => {
  const [selectedReason, setSelectedReason] = useState(null);

  const reasons = [
    { id: 'schedule', label: 'Schedule conflict' },
    { id: 'feeling_better', label: 'Feeling better' },
    { id: 'found_another', label: 'Found another doctor' },
    { id: 'cost', label: 'Cost concerns' },
    { id: 'other', label: 'Other reason' },
  ];

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
      setSelectedReason(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <Text style={styles.title}>Cancel Appointment</Text>
              <Text style={styles.subtitle}>Please select a reason for cancellation</Text>

              <View style={styles.reasonsList}>
                {reasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[styles.reasonItem, selectedReason === reason.id && styles.reasonItemActive]}
                    onPress={() => setSelectedReason(reason.id)}
                  >
                    <View style={[styles.radio, selectedReason === reason.id && styles.radioActive]}>
                      {selectedReason === reason.id && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.reasonText}>{reason.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.refundInfo}>
                <Text style={styles.refundIcon}>💰</Text>
                <View>
                  <Text style={styles.refundLabel}>Refund Amount</Text>
                  <Text style={styles.refundValue}>₹{refundAmount}</Text>
                </View>
              </View>

              <Text style={styles.refundNote}>
                Refund will be processed within 3-5 business days
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Go Back</Text>
                </TouchableOpacity>
                <Button
                  title="Confirm Cancel"
                  onPress={handleConfirm}
                  disabled={!selectedReason}
                  style={styles.confirmBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xl, padding: spacing.xl,
    width: '100%', maxWidth: 400,
  },
  title: { ...typography.headlineMedium, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.xl },
  reasonsList: { marginBottom: spacing.xl },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md,
    marginBottom: spacing.sm, backgroundColor: colors.surface,
  },
  reasonItemActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textMuted,
    marginRight: spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  reasonText: { ...typography.bodyMedium, color: colors.textPrimary },
  refundInfo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  refundIcon: { fontSize: 24, marginRight: spacing.md },
  refundLabel: { ...typography.labelSmall, color: colors.textMuted },
  refundValue: { ...typography.headlineSmall, color: colors.success },
  refundNote: { ...typography.labelSmall, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  cancelBtnText: { ...typography.labelMedium, color: colors.textSecondary },
  confirmBtn: { flex: 1 },
});

export default CancelModal;
