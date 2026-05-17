/**
 * SkeletonLoader - Shimmer skeleton for inline loading
 * Medical-themed with subtle heartbeat pulse
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const SkeletonLoader = ({ 
  variant = 'card', // card, list, profile, text
  count = 1,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation (heartbeat-like)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const ShimmerOverlay = () => (
    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );

  const CardSkeleton = () => (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.cardRow}>
        <View style={styles.avatar} />
        <View style={styles.cardContent}>
          <View style={styles.titleLine} />
          <View style={styles.subtitleLine} />
          <View style={styles.metaLine} />
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.priceLine} />
        <View style={styles.buttonLine} />
      </View>
      <ShimmerOverlay />
    </Animated.View>
  );

  const ListSkeleton = () => (
    <Animated.View style={[styles.listItem, { opacity: pulseAnim }]}>
      <View style={styles.listAvatar} />
      <View style={styles.listContent}>
        <View style={styles.listTitle} />
        <View style={styles.listSubtitle} />
      </View>
      <ShimmerOverlay />
    </Animated.View>
  );

  const ProfileSkeleton = () => (
    <Animated.View style={[styles.profile, { opacity: pulseAnim }]}>
      <View style={styles.profileAvatar} />
      <View style={styles.profileName} />
      <View style={styles.profileBio} />
      <View style={styles.profileStats}>
        <View style={styles.statBox} />
        <View style={styles.statBox} />
        <View style={styles.statBox} />
      </View>
      <ShimmerOverlay />
    </Animated.View>
  );

  const TextSkeleton = () => (
    <Animated.View style={[styles.textBlock, { opacity: pulseAnim }]}>
      <View style={styles.textLine} />
      <View style={[styles.textLine, { width: '80%' }]} />
      <View style={[styles.textLine, { width: '60%' }]} />
      <ShimmerOverlay />
    </Animated.View>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'list': return <ListSkeleton />;
      case 'profile': return <ProfileSkeleton />;
      case 'text': return <TextSkeleton />;
      default: return <CardSkeleton />;
    }
  };

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>{renderSkeleton()}</View>
      ))}
    </View>
  );
};


const styles = StyleSheet.create({
  shimmerOverlay: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  shimmerGradient: { width: 100, height: '100%' },
  // Card skeleton
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, overflow: 'hidden' },
  cardRow: { flexDirection: 'row' },
  avatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#E2E8F0' },
  cardContent: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  titleLine: { height: 18, backgroundColor: '#E2E8F0', borderRadius: 9, width: '70%', marginBottom: 10 },
  subtitleLine: { height: 14, backgroundColor: '#E2E8F0', borderRadius: 7, width: '50%', marginBottom: 8 },
  metaLine: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, width: '80%' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  priceLine: { height: 24, backgroundColor: '#E2E8F0', borderRadius: 12, width: 80 },
  buttonLine: { height: 40, backgroundColor: '#E2E8F0', borderRadius: 14, width: 100 },
  // List skeleton
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 12, overflow: 'hidden' },
  listAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E2E8F0' },
  listContent: { flex: 1, marginLeft: 12 },
  listTitle: { height: 16, backgroundColor: '#E2E8F0', borderRadius: 8, width: '60%', marginBottom: 8 },
  listSubtitle: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, width: '40%' },
  // Profile skeleton
  profile: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 24, overflow: 'hidden' },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', marginBottom: 16 },
  profileName: { height: 24, backgroundColor: '#E2E8F0', borderRadius: 12, width: 150, marginBottom: 8 },
  profileBio: { height: 14, backgroundColor: '#E2E8F0', borderRadius: 7, width: 200, marginBottom: 20 },
  profileStats: { flexDirection: 'row', gap: 16 },
  statBox: { width: 80, height: 60, backgroundColor: '#E2E8F0', borderRadius: 12 },
  // Text skeleton
  textBlock: { backgroundColor: '#fff', borderRadius: 16, padding: 16, overflow: 'hidden' },
  textLine: { height: 14, backgroundColor: '#E2E8F0', borderRadius: 7, width: '100%', marginBottom: 10 },
});

export default SkeletonLoader;