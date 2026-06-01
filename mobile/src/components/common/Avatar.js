/**
 * Avatar Component with status indicator
 */

import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, borderRadius } from '../../theme/typography';

const Avatar = ({
  source,
  imageUrl, // Support both source and imageUrl props
  name,
  size = 'medium', // small, medium, large, xlarge
  showStatus = false,
  status = 'online', // online, offline, busy, away
  showBorder = false,
  customBorderRadius,
}) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Convert imageUrl to source format if provided
  const imageSource = imageUrl ? { uri: imageUrl } : source;

  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 56;
      case 'xlarge': return 80;
      default: return 44;
    }
  };

  const getStatusSize = () => {
    switch (size) {
      case 'small': return 8;
      case 'large': return 14;
      case 'xlarge': return 18;
      default: return 12;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return colors.success?.[500] || colors.success || '#10B981';
      case 'busy': return colors.error?.[500] || colors.error || '#EF4444';
      case 'away': return colors.warning?.[500] || colors.warning || '#F59E0B';
      default: return colors.text?.tertiary || '#6B7280';
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarSize = getSize();
  const statusSize = getStatusSize();
  const fontSize = avatarSize * 0.35;

  // Check if imageSource is valid (has uri property with a truthy value)
  const hasValidSource = imageSource && imageSource.uri && !imageError;

  const styles = makeStyles(colors);

  const renderAvatarContent = (borderRadiusValue) => {
    const finalRadius = customBorderRadius !== undefined ? customBorderRadius : borderRadiusValue;
    if (hasValidSource) {
      return (
        <View style={{ width: '100%', height: '100%', borderRadius: finalRadius, overflow: 'hidden' }}>
          <Image
            source={imageSource}
            style={styles.image}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        </View>
      );
    }
    // Premium Healthcare Illustration fallback instead of initials
    const isDoctor = name && name.toLowerCase().includes('dr.');
    const isFemale = name && (
      name.toLowerCase().includes('ananya') || 
      name.toLowerCase().includes('sarah') || 
      name.toLowerCase().includes('priya') || 
      name.toLowerCase().includes('emily')
    );
    
    let illustration = '👤';
    let gradientColors = ['#E0F7F4', '#00D4AA'];
    
    if (isDoctor) {
      illustration = isFemale ? '👩‍⚕️' : '👨‍⚕️';
      gradientColors = isFemale ? ['#FFD1E6', '#EC4899'] : ['#E0F2FE', '#0984E3'];
    }

    return (
      <LinearGradient 
        colors={gradientColors} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.placeholder, { borderRadius: finalRadius }]}
      >
        <Text style={{ fontSize: avatarSize * 0.45, textAlign: 'center' }}>
          {illustration}
        </Text>
      </LinearGradient>
    );
  };

  const outerRadius = customBorderRadius !== undefined ? customBorderRadius : avatarSize / 2;
  const innerRadius = customBorderRadius !== undefined ? Math.max(0, customBorderRadius - 2) : (avatarSize - 4) / 2;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {showBorder ? (
        <LinearGradient
          colors={colors.gradients?.primary || ['#0066FF', '#1976D2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.border, { borderRadius: outerRadius, padding: 2 }]}
        >
          <View style={[styles.avatarWrapper, { borderRadius: innerRadius }]}>
            {renderAvatarContent(innerRadius)}
          </View>
        </LinearGradient>
      ) : (
        renderAvatarContent(avatarSize / 2)
      )}

      {showStatus && (
        <View style={[
          styles.status,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: getStatusColor(),
            right: showBorder ? 0 : -1,
            bottom: showBorder ? 0 : -1,
          }
        ]} />
      )}
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  border: {
    width: '100%',
    height: '100%',
  },
  avatarWrapper: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: typography.labelLarge?.fontFamily,
    color: colors.primary?.[500] || colors.primary || '#00D4AA',
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  status: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.background,
  },
});

export default Avatar;
