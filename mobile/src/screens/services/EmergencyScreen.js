/**
 * Emergency Screen - SOS & Emergency Services
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import whatsappService from '../../services/whatsappService';

const EmergencyScreen = ({ navigation }) => {
  const [sosActive, setSosActive] = useState(false);

  const emergencyContacts = [
    { id: '1', name: 'Ambulance', number: '102', icon: '🚑', color: '#EF4444' },
    { id: '2', name: 'Police', number: '100', icon: '🚔', color: '#3B82F6' },
    { id: '3', name: 'Fire', number: '101', icon: '🚒', color: '#F59E0B' },
    { id: '4', name: 'Women Helpline', number: '1091', icon: '👩', color: '#EC4899' },
  ];

  const nearbyHospitals = [
    {
      id: '1',
      name: 'City General Hospital',
      distance: '1.2 km',
      time: '5 min',
      emergency: true,
      phone: '+91 9876543210',
    },
    {
      id: '2',
      name: 'Apollo Emergency',
      distance: '2.5 km',
      time: '10 min',
      emergency: true,
      phone: '+91 9876543211',
    },
    {
      id: '3',
      name: 'Max Healthcare',
      distance: '3.8 km',
      time: '15 min',
      emergency: true,
      phone: '+91 9876543212',
    },
  ];

  const personalContacts = [
    { id: '1', name: 'Mom', relation: 'Mother', phone: '+91 9876543213' },
    { id: '2', name: 'Dad', relation: 'Father', phone: '+91 9876543214' },
    { id: '3', name: 'Dr. Sarah', relation: 'Family Doctor', phone: '+91 9876543215' },
  ];

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleSOS = () => {
    setSosActive(true);
    // Send WhatsApp SOS with location
    const mockLocation = {
      latitude: 22.5726,
      longitude: 88.3639,
      address: 'Kolkata, West Bengal, India'
    };
    const userInfo = {
      name: 'HealthSync User',
      phone: '+91 9876543210'
    };
    whatsappService.sendEmergencySOS(mockLocation, userInfo);
    setTimeout(() => setSosActive(false), 3000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
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
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={sosActive ? ['#DC2626', '#B91C1C'] : ['#EF4444', '#DC2626']}
              style={styles.sosGradient}
            >
              <Text style={styles.sosIcon}>🆘</Text>
              <Text style={styles.sosText}>{sosActive ? 'SENDING...' : 'SOS'}</Text>
              <Text style={styles.sosSubtext}>Press & hold for emergency</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.sosNote}>
            This will alert your emergency contacts and nearby hospitals
          </Text>
        </View>

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
            <TouchableOpacity>
              <Text style={styles.seeAll}>View Map</Text>
            </TouchableOpacity>
          </View>

          {nearbyHospitals.map((hospital) => (
            <Card key={hospital.id} variant="default" style={styles.hospitalCard}>
              <View style={styles.hospitalRow}>
                <View style={styles.hospitalIcon}>
                  <Text style={styles.hospitalEmoji}>🏥</Text>
                </View>
                <View style={styles.hospitalInfo}>
                  <View style={styles.hospitalHeader}>
                    <Text style={styles.hospitalName}>{hospital.name}</Text>
                    {hospital.emergency && (
                      <View style={styles.emergencyBadge}>
                        <Text style={styles.emergencyBadgeText}>24/7</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.hospitalMeta}>
                    <Text style={styles.hospitalDistance}>📍 {hospital.distance}</Text>
                    <Text style={styles.hospitalTime}>🚗 {hospital.time}</Text>
                  </View>
                </View>
                <View style={styles.hospitalActions}>
                  <TouchableOpacity 
                    style={styles.callBtn}
                    onPress={() => handleCall(hospital.phone)}
                  >
                    <Text style={styles.callIcon}>📞</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.directionBtn}>
                    <Text style={styles.directionIcon}>🗺️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Personal Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Emergency Contacts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {personalContacts.map((contact) => (
            <Card key={contact.id} variant="gradient" style={styles.contactCard}>
              <View style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>{contact.name[0]}</Text>
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
          ))}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sosSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    ...shadows.glow,
    marginBottom: spacing.lg,
  },
  sosGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  sosText: {
    ...typography.displaySmall,
    color: colors.textInverse,
    fontWeight: '700',
  },
  sosSubtext: {
    ...typography.labelSmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  sosNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  seeAll: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emergencyCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emergencyIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emergencyEmoji: {
    fontSize: 28,
  },
  emergencyName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  emergencyNumber: {
    ...typography.headlineSmall,
    fontWeight: '700',
  },
  hospitalCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  hospitalEmoji: {
    fontSize: 24,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hospitalName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  emergencyBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  emergencyBadgeText: {
    ...typography.labelSmall,
    color: colors.error,
    fontWeight: '600',
    fontSize: 10,
  },
  hospitalMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  hospitalDistance: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  hospitalTime: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  hospitalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 18,
  },
  directionBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionIcon: {
    fontSize: 18,
  },
  contactCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contactInitial: {
    ...typography.headlineSmall,
    color: colors.textInverse,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  contactRelation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  contactCallBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  contactCallGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCallIcon: {
    fontSize: 20,
  },
  tipCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginLeft: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tipIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  tipTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  tipDesc: {
    ...typography.labelSmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default EmergencyScreen;
