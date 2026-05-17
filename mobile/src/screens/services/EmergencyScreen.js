/**
 * Emergency Screen - SOS & Emergency Services with real geolocation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  TextInput,
  Modal,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/colors';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const SOS_CONTACTS_KEY = '@sos_favorite_contacts';

const EmergencyScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState(null);
  const [personalContacts, setPersonalContacts] = useState([]);
  // SOS contacts management
  const [sosContacts, setSosContacts] = useState([]); // [{name, phone}]
  const [addContactModal, setAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const emergencyContacts = [
    { id: '1', name: 'Ambulance', number: '102', icon: '🚑', color: '#EF4444' },
    { id: '2', name: 'Police', number: '100', icon: '🚔', color: '#3B82F6' },
    { id: '3', name: 'Fire', number: '101', icon: '🚒', color: '#F59E0B' },
    { id: '4', name: 'Women Helpline', number: '1091', icon: '👩', color: '#EC4899' },
    { id: '5', name: 'National Emergency', number: '112', icon: '🆘', color: '#8B5CF6' },
    { id: '6', name: 'Child Helpline', number: '1098', icon: '👶', color: '#10B981' },
  ];

  useEffect(() => {
    requestLocationPermission();
    fetchEmergencyInfo();
    loadSosContacts();
  }, []);

  const loadSosContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(SOS_CONTACTS_KEY);
      if (stored) setSosContacts(JSON.parse(stored));
    } catch {}
  };

  const saveSosContacts = async (contacts) => {
    try {
      await AsyncStorage.setItem(SOS_CONTACTS_KEY, JSON.stringify(contacts));
    } catch {}
  };

  const addSosContact = () => {
    const name = newContactName.trim();
    const phone = newContactPhone.trim().replace(/\s/g, '');
    if (!name || !phone) {
      Alert.alert('Required', 'Please enter both name and phone number');
      return;
    }
    const updated = [...sosContacts, { name, phone }];
    setSosContacts(updated);
    saveSosContacts(updated);
    setNewContactName('');
    setNewContactPhone('');
    setAddContactModal(false);
  };

  const removeSosContact = (index) => {
    Alert.alert('Remove Contact', 'Remove this SOS contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = sosContacts.filter((_, i) => i !== index);
          setSosContacts(updated);
          saveSosContacts(updated);
        },
      },
    ]);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const fineGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'HealthSync needs access to your location for emergency services',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (fineGranted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          const coarseGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
          );
          if (coarseGranted === PermissionsAndroid.RESULTS.GRANTED) {
            getCurrentLocation();
          } else {
            Alert.alert(
              'Location Required',
              'Location permission is needed for emergency services. Please enable it in Settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ]
            );
          }
        }
      } catch (err) {
        console.warn('Permission error:', err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        if (error.code === 3) {
          Geolocation.getCurrentPosition(
            (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => {},
            { enableHighAccuracy: false, timeout: 60000, maximumAge: 300000 }
          );
        }
      },
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 300000 }
    );
  };

  const fetchEmergencyInfo = async () => {
    if (!user?._id) return;
    try {
      const response = await apiClient.get(`/health/emergency/${user._id}`);
      setEmergencyInfo(response.data);
      if (response.data.emergencyContact) {
        setPersonalContacts([{
          id: '1',
          name: response.data.emergencyContact.name,
          relation: response.data.emergencyContact.relationship || 'Emergency Contact',
          phone: response.data.emergencyContact.phone,
        }]);
      }
    } catch {}
  };

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  // Build Google Maps live location link
  const buildLocationLink = (loc) => {
    if (!loc) return 'Location unavailable';
    return `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
  };

  // Send SOS WhatsApp message to a specific phone number
  const sendSOSToContact = async (phone, loc) => {
    const locationLink = buildLocationLink(loc);
    const message =
      `🚨 *EMERGENCY SOS*\n\n` +
      `${user?.name || 'Someone'} needs immediate help!\n\n` +
      `📍 Live Location:\n${locationLink}\n\n` +
      `Please respond immediately or call them at ${user?.phone || 'their number'}.`;

    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // Try https fallback
      try {
        await Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleSOS = async () => {
    setSosActive(true);

    const getLocAndSend = async (loc) => {
      const locationLink = buildLocationLink(loc);
      const message =
        `🚨 *EMERGENCY SOS*\n\n` +
        `${user?.name || 'Someone'} needs immediate help!\n\n` +
        `📍 Live Location:\n${locationLink}\n\n` +
        `Please respond immediately!`;

      if (sosContacts.length === 0) {
        // No saved contacts — open WhatsApp without a number so user picks contact
        // Use https://wa.me as fallback if whatsapp:// scheme fails
        try {
          await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
        } catch {
          try {
            await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
          } catch {
            Alert.alert(
              'WhatsApp Required',
              'Could not open WhatsApp. Please make sure WhatsApp is installed and try again.',
              [{ text: 'OK' }]
            );
            setSosActive(false);
            return;
          }
        }
        Alert.alert(
          'Add SOS Contacts',
          'Select your contact in WhatsApp. To send SOS automatically next time, add favorite contacts below.',
          [{ text: 'OK' }]
        );
        setSosActive(false);
        return;
      }

      // Send to all saved SOS contacts sequentially
      let sent = 0;
      for (const contact of sosContacts) {
        const ok = await sendSOSToContact(contact.phone, loc);
        if (ok) sent++;
        await new Promise(r => setTimeout(r, 1000));
      }

      Alert.alert(
        '🚨 SOS Sent',
        `Emergency alert with your live location sent to ${sent} contact(s).`,
        [{ text: 'OK' }]
      );
      setSosActive(false);
    };

    Geolocation.getCurrentPosition(
      (position) => {
        const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(loc);
        getLocAndSend(loc);
      },
      () => {
        getLocAndSend(location);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const openMapsForHospitals = () => {
    if (location) {
      const url = `https://www.google.com/maps/search/hospital+emergency/@${location.latitude},${location.longitude},14z`;
      Linking.openURL(url);
    } else {
      Linking.openURL('https://www.google.com/maps/search/hospital+emergency');
    }
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* SOS Button */}
        <View style={styles.sosSection}>
          <TouchableOpacity 
            style={styles.sosButton}
            onPress={handleSOS}
            onLongPress={handleSOS}
            activeOpacity={0.8}
            disabled={sosActive}
          >
            <LinearGradient
              colors={sosActive ? ['#DC2626', '#B91C1C'] : ['#EF4444', '#DC2626']}
              style={styles.sosGradient}
            >
              {sosActive ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Text style={styles.sosIcon}>🆘</Text>
              )}
              <Text style={styles.sosText}>{sosActive ? 'SENDING...' : 'SOS'}</Text>
              <Text style={styles.sosSubtext}>Press for emergency</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Location Status */}
          <View style={styles.locationStatus}>
            {loadingLocation ? (
              <Text style={styles.locationText}>📍 Getting location...</Text>
            ) : location ? (
              <Text style={styles.locationText}>📍 Location ready</Text>
            ) : (
              <TouchableOpacity onPress={requestLocationPermission}>
                <Text style={[styles.locationText, { color: colors.warning }]}>📍 Tap to enable location</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.sosNote}>
            This will alert emergency contacts and share your location
          </Text>
        </View>

        {/* Medical Info Card */}
        {emergencyInfo && (
          <Card variant="gradient" style={styles.medicalCard}>
            <Text style={styles.medicalTitle}>Your Medical Info</Text>
            <View style={styles.medicalRow}>
              <View style={styles.medicalItem}>
                <Text style={styles.medicalLabel}>Blood Group</Text>
                <Text style={styles.medicalValue}>{emergencyInfo.bloodGroup || 'Not set'}</Text>
              </View>
              <View style={styles.medicalItem}>
                <Text style={styles.medicalLabel}>Allergies</Text>
                <Text style={styles.medicalValue}>{emergencyInfo.allergies?.length > 0 ? emergencyInfo.allergies.join(', ') : 'None'}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Numbers</Text>
          <View style={styles.emergencyGrid}>
            {emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.emergencyCard}
                onPress={() => handleCall(contact.number)}
              >
                <View style={[styles.emergencyIcon, { backgroundColor: `${contact.color}20` }]}>
                  <Text style={styles.emergencyEmoji}>{contact.icon}</Text>
                </View>
                <Text style={styles.emergencyName}>{contact.name}</Text>
                <Text style={[styles.emergencyNumber, { color: contact.color }]}>{contact.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Hospitals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
            <TouchableOpacity onPress={openMapsForHospitals}>
              <Text style={styles.seeAll}>View Map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={openMapsForHospitals}>
            <Card variant="default" style={styles.hospitalCard}>
              <View style={styles.hospitalRow}>
                <View style={styles.hospitalIcon}>
                  <Text style={styles.hospitalEmoji}>🏥</Text>
                </View>
                <View style={styles.hospitalInfo}>
                  <View style={styles.hospitalHeader}>
                    <Text style={styles.hospitalName}>Find Nearest Hospital</Text>
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyBadgeText}>24/7</Text>
                    </View>
                  </View>
                  <Text style={styles.hospitalMeta}>📍 Tap to open Google Maps</Text>
                </View>
                <Text style={styles.mapArrow}>→</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* SOS Favorite Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SOS Contacts</Text>
            <TouchableOpacity onPress={() => setAddContactModal(true)}>
              <Text style={styles.seeAll}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sosContactsNote, { color: colors.textMuted }]}>
            SOS sends your live Google Maps location to these contacts via WhatsApp.
          </Text>

          {sosContacts.length > 0 ? (
            sosContacts.map((contact, index) => (
              <Card key={index} variant="default" style={styles.contactCard}>
                <View style={styles.contactRow}>
                  <View style={[styles.contactAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.contactInitial}>{contact.name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.textPrimary }]}>{contact.name}</Text>
                    <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>{contact.phone}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactCallBtn} onPress={() => handleCall(contact.phone)}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.contactCallGradient}>
                      <Text style={styles.contactCallIcon}>📞</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: `${colors.error}15`, marginLeft: spacing.sm }]}
                    onPress={() => removeSosContact(index)}
                  >
                    <Text style={[styles.removeBtnText, { color: colors.error }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="default" style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No SOS contacts added</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                First SOS press opens WhatsApp so you can pick a contact manually
              </Text>
              <TouchableOpacity
                style={[styles.addContactBtn, { backgroundColor: colors.primary }]}
                onPress={() => setAddContactModal(true)}
              >
                <Text style={[styles.addContactBtnText, { color: colors.textInverse }]}>+ Add SOS Contact</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* Profile Emergency Contact */}
        {personalContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Emergency Contact</Text>
            {personalContacts.map((contact) => (
              <Card key={contact.id} variant="gradient" style={styles.contactCard}>
                <View style={styles.contactRow}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>{contact.name?.[0] || '?'}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.textPrimary }]}>{contact.name}</Text>
                    <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>{contact.relation}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactCallBtn} onPress={() => handleCall(contact.phone)}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.contactCallGradient}>
                      <Text style={styles.contactCallIcon}>📞</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* First Aid Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick First Aid</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: '1', title: 'CPR', icon: '❤️', desc: 'Cardiopulmonary Resuscitation' },
              { id: '2', title: 'Choking', icon: '🫁', desc: 'Heimlich Maneuver' },
              { id: '3', title: 'Burns', icon: '🔥', desc: 'Burn Treatment' },
              { id: '4', title: 'Bleeding', icon: '🩸', desc: 'Stop Bleeding' },
              { id: '5', title: 'Fracture', icon: '🦴', desc: 'Bone Injury' },
            ].map((tip) => (
              <TouchableOpacity key={tip.id} style={styles.tipCard}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Add SOS Contact Modal */}
      <Modal visible={addContactModal} transparent animationType="slide" onRequestClose={() => setAddContactModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add SOS Contact</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              This person will receive your live location via WhatsApp when you press SOS.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              placeholder="Contact Name"
              placeholderTextColor={colors.textMuted}
              value={newContactName}
              onChangeText={setNewContactName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              placeholder="Phone Number (with country code, e.g. +91...)"
              placeholderTextColor={colors.textMuted}
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.surfaceBorder }]}
                onPress={() => { setAddContactModal(false); setNewContactName(''); setNewContactPhone(''); }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]} onPress={addSosContact}>
                <Text style={[styles.modalSaveText, { color: colors.textInverse }]}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  placeholder: { width: 44 },
  scrollContent: { paddingBottom: 100 },
  sosSection: { alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
  sosButton: { width: 180, height: 180, borderRadius: 90, ...shadows.glow, marginBottom: spacing.md },
  sosGradient: { width: '100%', height: '100%', borderRadius: 90, alignItems: 'center', justifyContent: 'center' },
  sosIcon: { fontSize: 48, marginBottom: spacing.sm },
  sosText: { ...typography.displaySmall, color: colors.textInverse, fontWeight: '700' },
  sosSubtext: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  locationStatus: { marginBottom: spacing.sm },
  locationText: { ...typography.labelSmall, color: colors.success },
  sosNote: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
  medicalCard: { marginHorizontal: spacing.xl, padding: spacing.lg, marginBottom: spacing.xl },
  medicalTitle: { ...typography.labelMedium, color: colors.textMuted, marginBottom: spacing.md },
  medicalRow: { flexDirection: 'row', gap: spacing.xl },
  medicalItem: { flex: 1 },
  sosContactsNote: { ...typography.bodySmall, paddingHorizontal: spacing.xl, marginBottom: spacing.md, marginTop: -spacing.sm },
  removeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 14, fontWeight: '700' },
  addContactBtn: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  addContactBtnText: { ...typography.buttonSmall, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xxl, paddingBottom: 40 },
  modalTitle: { ...typography.headlineMedium, marginBottom: spacing.sm },
  modalSub: { ...typography.bodyMedium, marginBottom: spacing.xl },
  input: { borderRadius: borderRadius.lg, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...typography.bodyLarge, marginBottom: spacing.md },
  modalBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  modalCancelText: { ...typography.button },
  modalSaveBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  modalSaveText: { ...typography.button, fontWeight: '700' },
  medicalLabel: { ...typography.labelSmall, color: colors.textMuted },
  medicalValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600' },
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  seeAll: { ...typography.labelMedium, color: colors.primary },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
  emergencyCard: { width: '30%', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  emergencyIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emergencyEmoji: { fontSize: 24 },
  emergencyName: { ...typography.labelSmall, color: colors.textPrimary, fontWeight: '500', marginBottom: spacing.xs, textAlign: 'center' },
  emergencyNumber: { ...typography.bodyLarge, fontWeight: '700' },
  hospitalCard: { marginHorizontal: spacing.xl, marginBottom: spacing.md, padding: spacing.lg },
  hospitalRow: { flexDirection: 'row', alignItems: 'center' },
  hospitalIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  hospitalEmoji: { fontSize: 24 },
  hospitalInfo: { flex: 1 },
  hospitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  hospitalName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '500', marginRight: spacing.sm },
  emergencyBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  emergencyBadgeText: { ...typography.labelSmall, color: colors.error, fontWeight: '600', fontSize: 10 },
  hospitalMeta: { ...typography.labelSmall, color: colors.textSecondary },
  mapArrow: { fontSize: 20, color: colors.primary },
  contactCard: { marginHorizontal: spacing.xl, marginBottom: spacing.md, padding: spacing.lg },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  contactInitial: { ...typography.headlineSmall, color: colors.textInverse },
  contactInfo: { flex: 1 },
  contactName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '500' },
  contactRelation: { ...typography.bodySmall, color: colors.textSecondary },
  contactCallBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  contactCallGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  contactCallIcon: { fontSize: 20 },
  emptyCard: { marginHorizontal: spacing.xl, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.bodyMedium, color: colors.textMuted },
  emptySubtext: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.xs },
  tipCard: { width: 120, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', marginLeft: spacing.xl, borderWidth: 1, borderColor: colors.surfaceBorder },
  tipIcon: { fontSize: 32, marginBottom: spacing.sm },
  tipTitle: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500', marginBottom: spacing.xs },
  tipDesc: { ...typography.labelSmall, color: colors.textMuted, textAlign: 'center' },
});

export default EmergencyScreen;
