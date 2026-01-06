/**
 * Avatar Component with status indicator
 */

import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { typography, borderRadius } from '../../theme/typography';

const Avatar = ({
  source,
  name,
  size = 'medium', // small, medium, large, xlarge
  showStatus = false,
  status = 'online', // online, offline, busy, away
  showBorder = false,
}) => {
  const [imageError, setImageError] = useState(false);

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
      case 'online': return colors.success;
      case 'busy': return colors.error;
      case 'away': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarSize = getSize();
  const statusSize = getStatusSize();
  const fontSize = avatarSize * 0.4;

  // Check if source is valid (has uri property with a truthy value)
  const hasValidSource = source && source.uri && !imageError;

  const renderAvatarContent = (borderRadiusValue) => {
    if (hasValidSource) {
      return (
        <Image 
          source={source} 
          style={[styles.image, { borderRadius: borderRadiusValue }]} 
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[styles.placeholder, { borderRadius: borderRadiusValue }]}>
        <Text style={[styles.initials, { fontSize }]}>{getInitials()}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {showBorder ? (
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.border, { borderRadius: avatarSize / 2, padding: 2 }]}
        >
          <View style={[styles.avatarWrapper, { borderRadius: (avatarSize - 4) / 2 }]}>
            {renderAvatarContent((avatarSize - 4) / 2)}
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

const styles = StyleSheet.create({
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
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '600',
  },
  status: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.background,
  },
});

export default Avatar;
