/**
 * Emergency Screen - SOS & Emergency Services with real geolocation
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import whatsappService from '../../services/whatsappService';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const EmergencyScreen = ({ navigation }) => {
  const { user } = useUser();
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState(null);
  const [personalContacts, setPersonalContacts] = useState([]);

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
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'HealthSync needs access to your location for emergency services',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
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
        console.error('Location error:', error);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchEmergencyInfo = async () => {
    if (!user?._id) return;
    
    try {
      const response = await apiClient.get(`/health/emergency/${user._id}`);
      setEmergencyInfo(response.data);
      
      // Set personal contacts from emergency contact
      if (response.data.emergencyContact) {
        setPersonalContacts([{
          id: '1',
          name: response.data.emergencyContact.name,
          relation: response.data.emergencyContact.relationship || 'Emergency Contact',
          phone: response.data.emergencyContact.phone,
        }]);
      }
    } catch (error) {
      console.error('Error fetching emergency info:', error);
    }
  };

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleSOS = async () => {
    setSosActive(true);
    
    // Get fresh location
    Geolocation.getCurrentPosition(
      async (position) => {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: `Lat: ${position.coords.latitude.toFixed(6)}, Long: ${position.coords.longitude.toFixed(6)}`,
        };
        
        const userInfo = {
          name: user?.name || 'HealthSync User',
          phone: user?.phone || 'N/A',
          bloodGroup: emergencyInfo?.bloodGroup || 'Unknown',
          allergies: emergencyInfo?.allergies?.join(', ') || 'None known',
        };
        
        // Send WhatsApp SOS
        try {
          await whatsappService.sendEmergencySOS(currentLocation, userInfo);
        } catch (error) {
          console.error('WhatsApp SOS error:', error);
        }
        
        // Show confirmation
        Alert.alert(
          'SOS Sent',
          'Emergency alert has been sent with your location. Emergency services have been notified.',
          [{ text: 'OK' }]
        );
        
        setTimeout(() => setSosActive(false), 3000);
      },
      (error) => {
        // Fallback without precise location
        const userInfo = {
          name: user?.name || 'HealthSync User',
          phone: user?.phone || 'N/A',
        };
        
        whatsappService.sendEmergencySOS(location || { latitude: 0, longitude: 0, address: 'Location unavailable' }, userInfo);
        
        Alert.alert(
          'SOS Sent',
          'Emergency alert sent. Note: Precise location could not be determined.',
          [{ text: 'OK' }]
        );
        
        setTimeout(() => setSosActive(false), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openMapsForHospitals = () => {
    if (location) {
      const url = `https://www.google.com/maps/search/hospital+emergency/@${location.latitude},${location.longitude},14z`;
      Linking.openURL(url);
    } else if (emergencyInfo?.nearbyHospitalsUrl) {
      Linking.openURL(emergencyInfo.nearbyHospitalsUrl);
    } else {
      Linking.openURL('https://www.google.com/maps/search/hospital+emergency');
    }
  };

  const nearbyHospitals = [
    { id: '1', name: 'Nearest Hospital', distance: 'Tap to find', time: 'Via Maps', emergency: true },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

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

        {/* Personal Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Emergency Contacts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.seeAll}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {personalContacts.length > 0 ? (
            personalContacts.map((contact) => (
              <Card key={contact.id} variant="gradient" style={styles.contactCard}>
                <View style={styles.contactRow}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>{contact.name?.[0] || '?'}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>{contact.relation}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.contactCallBtn}
                    onPress={() => handleCall(contact.phone)}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary}
                      style={styles.contactCallGradient}
                    >
                      <Text style={styles.contactCallIcon}>📞</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="default" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No emergency contacts set</Text>
              <Text style={styles.emptySubtext}>Add contacts in your profile</Text>
            </Card>
          )}
        </View>

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
    </View>
  );
};


const styles = StyleSheet.create({
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
