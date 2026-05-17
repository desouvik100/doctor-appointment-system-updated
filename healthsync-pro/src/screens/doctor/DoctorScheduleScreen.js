/**
 * Doctor Schedule Screen - Full Availability Management
 * Features: Weekly schedule, time slots, block dates, vacation mode, online settings
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import Card from '../../components/common/Card';
import apiClient from '../../services/api/apiClient';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const DAY_FULL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

const DoctorScheduleScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedule, setSchedule] = useState({});
  const [availability, setAvailability] = useState('Available');
  const [activeTab, setActiveTab] = useState('weekly'); // weekly, blocked, settings
  
  // Vacation mode
  const [vacationMode, setVacationMode] = useState({ isActive: false, startDate: '', endDate: '', message: '' });
  
  // Online consultation
  const [onlineSettings, setOnlineSettings] = useState({ enabled: true, separateSlots: false });
  
  // Settings
  const [bufferTime, setBufferTime] = useState(5);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  
  // Blocked dates
  const [blockedDates, setBlockedDates] = useState([]);
  
  // Modals
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [slotForm, setSlotForm] = useState({ startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatients: 20 });
  const [blockForm, setBlockForm] = useState({ date: '', reason: '', isFullDay: true });

  const doctorId = user?.id || user?._id;

  const fetchSchedule = useCallback(async () => {
    if (!doctorId) return;
    try {
      const response = await apiClient.get(`/schedule/doctor/${doctorId}`);
      const data = response.data;
      setSchedule(data.weeklySchedule || {});
      setVacationMode(data.vacationMode || { isActive: false });
      setOnlineSettings(data.onlineConsultation || { enabled: true, separateSlots: false });
      setBufferTime(data.bufferTime || 5);
      setAdvanceBookingDays(data.advanceBookingDays || 30);
      setBlockedDates(data.blockedDates || []);
    } catch (error) {
      console.log('Error fetching schedule:', error.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  }, [fetchSchedule]);

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], isWorking: !prev[day]?.isWorking }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/schedule/doctor/${doctorId}`, {
        weeklySchedule: schedule,
        vacationMode,
        onlineConsultation: onlineSettings,
        bufferTime,
        advanceBookingDays,
      });
      Alert.alert('Success', 'Schedule updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityChange = async (newAvailability) => {
    try {
      await apiClient.put(`/receptionists/doctors/${doctorId}/availability`, { availability: newAvailability });
      setAvailability(newAvailability);
      Alert.alert('Success', `Status changed to ${newAvailability}`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update');
    }
  };

  const openSlotModal = (day) => {
    setSelectedDay(day);
    const existingSlot = schedule[day]?.slots?.[0];
    if (existingSlot) {
      setSlotForm(existingSlot);
    } else {
      setSlotForm({ startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatients: 20 });
    }
    setShowSlotModal(true);
  };

  const saveSlot = () => {
    if (!selectedDay) return;
    setSchedule(prev => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], isWorking: true, slots: [slotForm] }
    }));
    setShowSlotModal(false);
    setSelectedDay(null);
  };

  const blockDate = async () => {
    if (!blockForm.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    try {
      await apiClient.post(`/schedule/doctor/${doctorId}/block`, blockForm);
      Alert.alert('Success', 'Date blocked successfully');
      setShowBlockModal(false);
      setBlockForm({ date: '', reason: '', isFullDay: true });
      fetchSchedule();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to block date');
    }
  };

  const unblockDate = async (dateId) => {
    Alert.alert('Confirm', 'Remove this blocked date?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete(`/schedule/doctor/${doctorId}/block/${dateId}`);
            fetchSchedule();
          } catch (error) {
            Alert.alert('Error', 'Failed to unblock date');
          }
        }
      }
    ]);
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'Available': return '#10B981';
      case 'Busy': return '#F59E0B';
      case 'On Leave': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Schedule</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: '#6C5CE7' }]}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: 'weekly', label: '📅 Weekly', icon: '📅' },
          { id: 'blocked', label: '🚫 Blocked', icon: '🚫' },
          { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.id ? '#6C5CE7' : colors.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {/* Current Status - Always visible */}
        <Card style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🟢 Current Status</Text>
          <View style={styles.statusButtons}>
            {['Available', 'Busy', 'On Leave'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusBtn, { backgroundColor: availability === status ? getAvailabilityColor(status) + '20' : colors.background, borderColor: availability === status ? getAvailabilityColor(status) : 'transparent' }]}
                onPress={() => handleAvailabilityChange(status)}
              >
                <View style={[styles.statusDot, { backgroundColor: getAvailabilityColor(status) }]} />
                <Text style={[styles.statusBtnText, { color: availability === status ? getAvailabilityColor(status) : colors.textSecondary }]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* WEEKLY TAB */}
        {activeTab === 'weekly' && (
          <>
            {/* Vacation Mode */}
            <Card style={[styles.vacationCard, { backgroundColor: vacationMode.isActive ? '#EF444420' : colors.surface }]}>
              <View style={styles.vacationHeader}>
                <View style={styles.vacationInfo}>
                  <Text style={styles.vacationIcon}>🏖️</Text>
                  <View>
                    <Text style={[styles.vacationTitle, { color: colors.textPrimary }]}>Vacation Mode</Text>
                    <Text style={[styles.vacationSubtitle, { color: colors.textSecondary }]}>
                      {vacationMode.isActive ? 'Active - No bookings allowed' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={vacationMode.isActive}
                  onValueChange={(val) => setVacationMode({ ...vacationMode, isActive: val })}
                  trackColor={{ false: colors.background, true: '#EF444440' }}
                  thumbColor={vacationMode.isActive ? '#EF4444' : '#ccc'}
                />
              </View>
              {vacationMode.isActive && (
                <View style={styles.vacationDates}>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    placeholder="Start Date (YYYY-MM-DD)"
                    placeholderTextColor={colors.textMuted}
                    value={vacationMode.startDate}
                    onChangeText={(text) => setVacationMode({ ...vacationMode, startDate: text })}
                  />
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    placeholder="End Date (YYYY-MM-DD)"
                    placeholderTextColor={colors.textMuted}
                    value={vacationMode.endDate}
                    onChangeText={(text) => setVacationMode({ ...vacationMode, endDate: text })}
                  />
                </View>
              )}
            </Card>

            {/* Weekly Schedule */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📆 Weekly Schedule</Text>
              
              {DAYS.map((day) => {
                const dayData = schedule[day] || {};
                const isWorking = dayData.isWorking || dayData.isAvailable;
                const slots = dayData.slots || [];
                
                return (
                  <Card key={day} style={[styles.dayCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayInfo}>
                        <Text style={[styles.dayName, { color: colors.textPrimary }]}>{DAY_FULL[day]}</Text>
                        {isWorking && slots.length > 0 && (
                          <Text style={[styles.daySlotSummary, { color: colors.textSecondary }]}>
                            {slots[0].startTime} - {slots[0].endTime}
                          </Text>
                        )}
                      </View>
                      <View style={styles.dayActions}>
                        <TouchableOpacity 
                          style={[styles.editSlotBtn, { backgroundColor: '#6C5CE720' }]}
                          onPress={() => openSlotModal(day)}
                        >
                          <Text style={styles.editSlotIcon}>✏️</Text>
                        </TouchableOpacity>
                        <Switch
                          value={isWorking}
                          onValueChange={() => toggleDay(day)}
                          trackColor={{ false: colors.background, true: '#10B98140' }}
                          thumbColor={isWorking ? '#10B981' : '#ccc'}
                        />
                      </View>
                    </View>
                    
                    {isWorking && slots.length > 0 && (
                      <View style={styles.slotDetails}>
                        <View style={[styles.slotPill, { backgroundColor: colors.background }]}>
                          <Text style={styles.slotPillIcon}>⏱️</Text>
                          <Text style={[styles.slotPillText, { color: colors.textPrimary }]}>{slots[0].slotDuration} min slots</Text>
                        </View>
                        <View style={[styles.slotPill, { backgroundColor: colors.background }]}>
                          <Text style={styles.slotPillIcon}>👥</Text>
                          <Text style={[styles.slotPillText, { color: colors.textPrimary }]}>Max {slots[0].maxPatients} patients</Text>
                        </View>
                      </View>
                    )}
                    
                    {!isWorking && (
                      <Text style={[styles.dayOffText, { color: colors.textMuted }]}>Day Off</Text>
                    )}
                  </Card>
                );
              })}
            </View>
          </>
        )}

        {/* BLOCKED TAB */}
        {activeTab === 'blocked' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🚫 Blocked Dates</Text>
              <TouchableOpacity style={[styles.addBlockBtn, { backgroundColor: '#EF4444' }]} onPress={() => setShowBlockModal(true)}>
                <Text style={styles.addBlockBtnText}>+ Block Date</Text>
              </TouchableOpacity>
            </View>
            
            {blockedDates.length === 0 ? (
              <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Blocked Dates</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Block specific dates when you're unavailable</Text>
              </Card>
            ) : (
              blockedDates.map((blocked, index) => (
                <Card key={blocked._id || index} style={[styles.blockedCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.blockedInfo}>
                    <Text style={styles.blockedIcon}>🚫</Text>
                    <View>
                      <Text style={[styles.blockedDate, { color: colors.textPrimary }]}>{formatDate(blocked.date)}</Text>
                      <Text style={[styles.blockedReason, { color: colors.textSecondary }]}>{blocked.reason || 'No reason specified'}</Text>
                      <Text style={[styles.blockedType, { color: colors.textMuted }]}>{blocked.isFullDay ? 'Full Day' : 'Partial'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.unblockBtn} onPress={() => unblockDate(blocked._id)}>
                    <Text style={styles.unblockBtnText}>✕</Text>
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⚙️ Booking Settings</Text>
            
            {/* Online Consultation */}
            <Card style={[styles.settingCard, { backgroundColor: colors.surface }]}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>📹</Text>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Online Consultation</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Allow video consultations</Text>
                </View>
                <Switch
                  value={onlineSettings.enabled}
                  onValueChange={(val) => setOnlineSettings({ ...onlineSettings, enabled: val })}
                  trackColor={{ false: colors.background, true: '#3B82F640' }}
                  thumbColor={onlineSettings.enabled ? '#3B82F6' : '#ccc'}
                />
              </View>
            </Card>

            {/* Buffer Time */}
            <Card style={[styles.settingCard, { backgroundColor: colors.surface }]}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>⏳</Text>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Buffer Time</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Gap between appointments</Text>
                </View>
              </View>
              <View style={styles.bufferOptions}>
                {[0, 5, 10, 15, 20].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.bufferBtn, { backgroundColor: bufferTime === mins ? '#6C5CE720' : colors.background, borderColor: bufferTime === mins ? '#6C5CE7' : colors.surfaceBorder }]}
                    onPress={() => setBufferTime(mins)}
                  >
                    <Text style={[styles.bufferBtnText, { color: bufferTime === mins ? '#6C5CE7' : colors.textSecondary }]}>{mins}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Advance Booking */}
            <Card style={[styles.settingCard, { backgroundColor: colors.surface }]}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>📆</Text>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Advance Booking</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>How far ahead patients can book</Text>
                </View>
              </View>
              <View style={styles.advanceOptions}>
                {[7, 14, 30, 60, 90].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.advanceBtn, { backgroundColor: advanceBookingDays === days ? '#10B98120' : colors.background, borderColor: advanceBookingDays === days ? '#10B981' : colors.surfaceBorder }]}
                    onPress={() => setAdvanceBookingDays(days)}
                  >
                    <Text style={[styles.advanceBtnText, { color: advanceBookingDays === days ? '#10B981' : colors.textSecondary }]}>{days}d</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Consultation Duration Info */}
            <Card style={[styles.infoCard, { backgroundColor: '#6C5CE710' }]}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Slot duration and max patients can be configured per day in the Weekly tab
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Slot Edit Modal */}
      <Modal visible={showSlotModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>⏰ Edit Time Slot</Text>
              <TouchableOpacity onPress={() => setShowSlotModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalDayLabel, { color: colors.textSecondary }]}>{selectedDay ? DAY_FULL[selectedDay] : ''}</Text>
            
            <View style={styles.modalBody}>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start Time</Text>
                  <TextInput
                    style={[styles.timeInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    value={slotForm.startTime}
                    onChangeText={(text) => setSlotForm({ ...slotForm, startTime: text })}
                    placeholder="09:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <Text style={[styles.timeSeparator, { color: colors.textMuted }]}>to</Text>
                <View style={styles.timeField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>End Time</Text>
                  <TextInput
                    style={[styles.timeInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    value={slotForm.endTime}
                    onChangeText={(text) => setSlotForm({ ...slotForm, endTime: text })}
                    placeholder="17:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Slot Duration (minutes)</Text>
                <View style={styles.durationOptions}>
                  {[10, 15, 20, 30, 45, 60].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.durationBtn, { backgroundColor: slotForm.slotDuration === mins ? '#6C5CE720' : colors.background, borderColor: slotForm.slotDuration === mins ? '#6C5CE7' : colors.surfaceBorder }]}
                      onPress={() => setSlotForm({ ...slotForm, slotDuration: mins })}
                    >
                      <Text style={[styles.durationBtnText, { color: slotForm.slotDuration === mins ? '#6C5CE7' : colors.textSecondary }]}>{mins}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Max Patients</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                  value={String(slotForm.maxPatients)}
                  onChangeText={(text) => setSlotForm({ ...slotForm, maxPatients: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]} onPress={() => setShowSlotModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#6C5CE7' }]} onPress={saveSlot}>
                <Text style={styles.submitBtnText}>Save Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Block Date Modal */}
      <Modal visible={showBlockModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🚫 Block Date</Text>
              <TouchableOpacity onPress={() => setShowBlockModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                  value={blockForm.date}
                  onChangeText={(text) => setBlockForm({ ...blockForm, date: text })}
                  placeholder="2026-01-15"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Reason</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                  value={blockForm.reason}
                  onChangeText={(text) => setBlockForm({ ...blockForm, reason: text })}
                  placeholder="Personal leave, conference, etc."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Block Full Day</Text>
                <Switch
                  value={blockForm.isFullDay}
                  onValueChange={(val) => setBlockForm({ ...blockForm, isFullDay: val })}
                  trackColor={{ false: colors.background, true: '#EF444440' }}
                  thumbColor={blockForm.isFullDay ? '#EF4444' : '#ccc'}
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]} onPress={() => setShowBlockModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#EF4444' }]} onPress={blockDate}>
                <Text style={styles.submitBtnText}>Block Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  saveBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  saveBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#6C5CE7' },
  tabText: { ...typography.labelMedium, fontWeight: '600' },
  
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.md },
  
  statusCard: { padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
  statusButtons: { flexDirection: 'row', gap: spacing.sm },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  statusBtnText: { ...typography.labelMedium, fontWeight: '600' },
  
  vacationCard: { padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
  vacationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vacationInfo: { flexDirection: 'row', alignItems: 'center' },
  vacationIcon: { fontSize: 28, marginRight: spacing.md },
  vacationTitle: { ...typography.bodyMedium, fontWeight: '700' },
  vacationSubtitle: { ...typography.labelSmall },
  vacationDates: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  dateInput: { flex: 1, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodySmall },
  
  dayCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayInfo: { flex: 1 },
  dayName: { ...typography.bodyLarge, fontWeight: '700' },
  daySlotSummary: { ...typography.labelSmall, marginTop: 2 },
  dayActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editSlotBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  editSlotIcon: { fontSize: 16 },
  slotDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  slotPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  slotPillIcon: { fontSize: 12, marginRight: spacing.xs },
  slotPillText: { ...typography.labelSmall },
  dayOffText: { ...typography.labelSmall, fontStyle: 'italic', marginTop: spacing.sm },
  
  addBlockBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  addBlockBtnText: { color: '#fff', ...typography.labelSmall, fontWeight: '700' },
  
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyLarge, fontWeight: '600' },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center' },
  
  blockedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  blockedInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  blockedIcon: { fontSize: 24, marginRight: spacing.md },
  blockedDate: { ...typography.bodyMedium, fontWeight: '700' },
  blockedReason: { ...typography.labelSmall },
  blockedType: { ...typography.labelSmall, fontStyle: 'italic' },
  unblockBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EF444420', alignItems: 'center', justifyContent: 'center' },
  unblockBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  
  settingCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  settingHeader: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { fontSize: 24, marginRight: spacing.md },
  settingInfo: { flex: 1 },
  settingTitle: { ...typography.bodyMedium, fontWeight: '700' },
  settingSubtitle: { ...typography.labelSmall },
  
  bufferOptions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  bufferBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2 },
  bufferBtnText: { ...typography.labelMedium, fontWeight: '600' },
  
  advanceOptions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  advanceBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2 },
  advanceBtnText: { ...typography.labelMedium, fontWeight: '600' },
  
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg },
  infoIcon: { fontSize: 20, marginRight: spacing.md },
  infoText: { flex: 1, ...typography.bodySmall },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { ...typography.headlineSmall, fontWeight: '700' },
  modalDayLabel: { ...typography.bodyMedium, textAlign: 'center', marginTop: spacing.sm },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 18 },
  modalBody: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  modalFooter: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.lg },
  timeField: { flex: 1 },
  timeSeparator: { ...typography.bodyMedium, marginHorizontal: spacing.md, marginBottom: spacing.md },
  timeInput: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium, textAlign: 'center' },
  
  formField: { marginBottom: spacing.lg },
  fieldLabel: { ...typography.labelSmall, fontWeight: '600', marginBottom: spacing.xs },
  formInput: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  
  durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  durationBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2, minWidth: 50, alignItems: 'center' },
  durationBtnText: { ...typography.labelMedium, fontWeight: '600' },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  switchLabel: { ...typography.bodyMedium, fontWeight: '600' },
  
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { ...typography.labelMedium, fontWeight: '600' },
  submitBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
});

export default DoctorScheduleScreen;
