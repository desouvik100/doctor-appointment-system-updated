/**
 * Role Selection Screen - Futuristic Multi-Role Login Portal
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

const roles = [
  {
    id: 'patient',
    title: 'Patient',
    subtitle: 'Book appointments & manage health',
    icon: '👤',
    gradient: ['#00D4AA', '#00B894'],
    screen: 'Login',
  },
  {
    id: 'doctor',
    title: 'Doctor',
    subtitle: 'Manage patients & consultations',
    icon: '👨‍⚕️',
    gradient: ['#6C5CE7', '#A29BFE'],
    screen: 'DoctorLogin',
  },
  {
    id: 'staff',
    title: 'Staff',
    subtitle: 'Hospital operations & support',
    icon: '👩‍💼',
    gradient: ['#FF6B6B', '#FF8E8E'],
    screen: 'StaffLogin',
  },
  {
    id: 'admin',
    title: 'Admin',
    subtitle: 'System management & analytics',
    icon: '🛡️',
    gradient: ['#F39C12', '#F1C40F'],
    screen: 'AdminLogin',
  },
];

const RoleSelectionScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef(roles.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    const staggerAnimations = scaleAnims.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, staggerAnimations).start();

    // Pulse animation for selected card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setTimeout(() => {
      navigation.navigate(role.screen);
    }, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0A0A0F', '#1A1A2E', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Floating Orbs */}
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(0, 212, 170, 0.4)', 'transparent']}
            style={styles.orbGradient}
          />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(108, 92, 231, 0.3)', 'transparent']}
            style={styles.orbGradient}
          />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orb3, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(255, 107, 107, 0.2)', 'transparent']}
            style={styles.orbGradient}
          />
        </Animated.View>

        {/* Grid Lines */}
        <View style={styles.gridContainer}>
          {[...Array(10)].map((_, i) => (
            <View key={i} style={[styles.gridLine, { top: `${i * 10}%` }]} />
          ))}
        </View>
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#00D4AA', '#00B894']}
              style={styles.logoGradient}
            >
              <Text style={styles.logoIcon}>+</Text>
            </LinearGradient>
            <View style={styles.logoRing} />
          </View>
          <Text style={styles.title}>HealthSync</Text>
          <Text style={styles.subtitle}>Select your portal to continue</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {roles.map((role, index) => (
            <Animated.View
              key={role.id}
              style={[
                styles.cardWrapper,
                {
                  transform: [
                    { scale: scaleAnims[index] },
                    { scale: selectedRole === role.id ? pulseAnim : 1 },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleRoleSelect(role)}
                style={[
                  styles.card,
                  selectedRole === role.id && styles.cardSelected,
                ]}
              >
                <LinearGradient
                  colors={selectedRole === role.id ? role.gradient : ['#1E1E2E', '#252535']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {/* Glow Effect */}
                  {selectedRole === role.id && (
                    <View style={[styles.glowEffect, { backgroundColor: role.gradient[0] }]} />
                  )}
                  
                  <View style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${role.gradient[0]}20` }]}>
                      <Text style={styles.roleIcon}>{role.icon}</Text>
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[
                        styles.roleTitle,
                        selectedRole === role.id && styles.roleTitleSelected
                      ]}>
                        {role.title}
                      </Text>
                      <Text style={[
                        styles.roleSubtitle,
                        selectedRole === role.id && styles.roleSubtitleSelected
                      ]}>
                        {role.subtitle}
                      </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <Text style={[
                        styles.arrow,
                        selectedRole === role.id && styles.arrowSelected
                      ]}>
                        →
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by AI Healthcare</Text>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -50,
    right: -100,
  },
  orb2: {
    width: 250,
    height: 250,
    bottom: 150,
    left: -80,
  },
  orb3: {
    width: 200,
    height: 200,
    bottom: -50,
    right: 50,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge + spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    top: -8,
    left: -8,
  },
  logoIcon: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  cardsContainer: {
    flex: 1,
    gap: spacing.md,
  },
  cardWrapper: {
    borderRadius: borderRadius.xl,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardSelected: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardGradient: {
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  roleIcon: {
    fontSize: 28,
  },
  cardText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: '#fff',
  },
  roleSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  roleSubtitleSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
  },
  arrowSelected: {
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#00D4AA',
    width: 24,
  },
});

export default RoleSelectionScreen;
