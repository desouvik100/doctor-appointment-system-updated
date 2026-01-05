/**
 * Staff Doctors Screen - Clinic Doctors List
 * 100% Parity with Web Staff Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import staffApi from '../../services/api/staffDashboardApi';
import apiClient from '../../services/api/apiClient';

const StaffDoctorsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const data = await staffApi.getClinicDoctors(user.clinicId);
      const list = data?.doctors || data || [];
      setDoctors(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log('Error fetching doctors:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  }, [fetchDoctors]);

  const updateAvailability = async (doctorId, availability) => {
    try {
      await staffApi.updateDoctorAvailability(doctorId, availability, user?.clinicId);
      Alert.alert('Success', `Doctor status updated to ${availability}`);
      fetchDoctors();
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleDeleteDoctor = (doctorId, doctorName) => {
    Alert.alert(
      'Remove Doctor',
      `Are you sure you want to remove Dr. ${doctorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/doctors/${doctorId}`);
              Alert.alert('Success', 'Doctor removed successfully');
              fetchDoctors();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove doctor');
            }
          }
        },
      ]
    );
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available': return '#10B981';
      case 'busy': return '#F59E0B';
      case 'offline': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderDoctor = ({ item }) => (
    <View style={[styles.doctorCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.doctorMain}
        onPress={() => navigation.navigate('StaffBookAppointment', { doctorId: item._id, doctorName: item.name })}
      >
        <View style={[styles.avatar, { borderColor: getAvailabilityColor(item.availability) }]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || 'D'}</Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={[styles.doctorName, { color: colors.textPrimary }]}>Dr. {item.name}</Text>
          <Text style={[styles.specialty, { color: colors.textSecondary }]}>{item.specialization || 'General'}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusDot, { backgroundColor: getAvailabilityColor(item.availability) }]} />
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              {item.availability || 'Unknown'}
            </Text>
            <Text style={[styles.feeText, { color: colors.textMuted }]}>
              • ₹{item.consultationFee || 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={[styles.queueCount, { color: '#FF6B6B' }]}>{item.queueCount || 0}</Text>
          <Text style={[styles.queueLabel, { color: colors.textMuted }]}>in queue</Text>
        </View>
      </TouchableOpacity>
      
      {/* Availability Buttons */}
      <View style={styles.availabilityRow}>
        {['Available', 'Busy', 'On Leave'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.availBtn,
              { backgroundColor: item.availability === status ? getAvailabilityColor(status.toLowerCase()) + '20' : colors.background },
              item.availability === status && { borderColor: getAvailabilityColor(status.toLowerCase()), borderWidth: 1 }
            ]}
            onPress={() => updateAvailability(item._id, status)}
            disabled={item.availability === status}
          >
            <Text style={[
              styles.availBtnText,
              { color: item.availability === status ? getAvailabilityColor(status.toLowerCase()) : colors.textSecondary }
            ]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#3B82F620' }]}
          onPress={() => navigation.navigate('StaffDoctorForm', { doctor: item })}
        >
          <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
          onPress={() => handleDeleteDoctor(item._id, item.name)}
        >
          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>🗑️ Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Clinic Doctors</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('StaffDoctorForm')}
        >
          <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.addBtnGradient}>
            <Text style={styles.addBtnText}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
      </Text>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderDoctor}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👨‍⚕️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No doctors found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  addBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  addBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg, ...typography.bodyMedium },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  doctorCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  doctorMain: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 3 },
  avatarText: { color: '#6C5CE7', fontSize: 22, fontWeight: '700' },
  doctorInfo: { flex: 1 },
  doctorName: { ...typography.bodyLarge, fontWeight: '600' },
  specialty: { ...typography.bodySmall, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  statusText: { ...typography.labelSmall, textTransform: 'capitalize' },
  feeText: { ...typography.labelSmall },
  rightSection: { alignItems: 'center' },
  queueCount: { ...typography.headlineSmall, fontWeight: '700' },
  queueLabel: { ...typography.labelSmall },
  availabilityRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  availBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  availBtnText: { ...typography.labelSmall, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { ...typography.labelSmall, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default StaffDoctorsScreen;
