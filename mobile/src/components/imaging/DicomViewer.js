/**
 * DICOM Viewer Component for React Native
 * Displays medical images with zoom, pan, and basic diagnostic tools
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  PanResponder,
  Linking,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Window/Level presets for different tissue types
const WINDOW_PRESETS = {
  default: { label: 'Default', icon: 'D' },
  bone: { label: 'Bone', icon: 'B' },
  lung: { label: 'Lung', icon: 'L' },
  brain: { label: 'Brain', icon: 'Br' },
  abdomen: { label: 'Abdomen', icon: 'Ab' },
};

const DicomViewer = ({
  imageUrl,
  metadata = {},
  onClose,
  showToolbar = true,
  showMetadata = true,
}) => {
  // Check if the file is a raw DICOM file (not the render endpoint)
  const isDicomFile = imageUrl && (
    (imageUrl.toLowerCase().endsWith('.dcm') || imageUrl.toLowerCase().endsWith('.dicom')) &&
    !imageUrl.includes('/render/')
  );
  
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [activePreset, setActivePreset] = useState('default');
  const [imageLoadSuccess, setImageLoadSuccess] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  
  const lastPan = useRef({ x: 0, y: 0 });

  // Debug: log the image URL
  React.useEffect(() => {
    console.log('DicomViewer imageUrl:', imageUrl);
    console.log('isDicomFile:', isDicomFile);
    // Reset states when URL changes
    if (imageUrl) {
      setIsLoading(true);
      setImageLoadSuccess(false);
      setImageLoadFailed(false);
    }
  }, [imageUrl, isDicomFile]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPan.current = { ...pan };
      },
      onPanResponderMove: (_, gestureState) => {
        setPan({
          x: lastPan.current.x + gestureState.dx,
          y: lastPan.current.y + gestureState.dy,
        });
      },
    })
  ).current;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => { setZoom(1.0); setPan({ x: 0, y: 0 }); setRotation(0); };
  const handleFitToScreen = () => { setZoom(1.0); setPan({ x: 0, y: 0 }); };

  const handleOpenInBrowser = async () => {
    // Open the web app's imaging dashboard
    const webAppUrl = 'https://doctor-appointment-system-updated.onrender.com';
    
    try {
      console.log('Opening web app:', webAppUrl);
      const opened = await Linking.openURL(webAppUrl);
      console.log('Linking.openURL result:', opened);
    } catch (e) {
      console.log('Failed to open web app:', e);
      Alert.alert(
        'Open Web App',
        'Please open this URL in your browser to view DICOM images:\n\n' + webAppUrl,
        [{ text: 'OK' }]
      );
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageLoadSuccess(true);
  };

  const handleImageError = () => {
    console.log('Image failed to load:', imageUrl);
    setIsLoading(false);
    setImageLoadSuccess(false);
    setImageLoadFailed(true);
  };

  // Always try to show image if URL exists, show fallback only after it fails
  const showImage = !!imageUrl;
  const showNoImageOverlay = !imageUrl || imageLoadFailed;

  return (
    <View style={styles.container}>
      {showToolbar && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={onClose}>
              <Text style={styles.toolbarIcon}>{'<'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.toolbarCenter}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handleZoomOut}>
              <Text style={styles.toolbarIcon}>-</Text>
            </TouchableOpacity>
            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handleZoomIn}>
              <Text style={styles.toolbarIcon}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handleRotate}>
              <Text style={styles.toolbarIcon}>R</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handleFitToScreen}>
              <Text style={styles.toolbarIcon}>F</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handleReset}>
              <Text style={styles.toolbarIcon}>X</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.toolbarRight}>
            <Text style={styles.modalityText}>{metadata.modality || 'IMG'}</Text>
          </View>
        </View>
      )}

      <View style={styles.viewerContainer}>
        {/* Pan area for image only */}
        <View style={styles.panArea} {...panResponder.panHandlers}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}

          {showImage && !showNoImageOverlay && (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: zoom },
                    { rotate: `${rotation}deg` },
                  ],
                },
              ]}
              resizeMode="contain"
              onLoadStart={() => setIsLoading(true)}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </View>

        {/* Info overlay - outside pan area so buttons work */}
        {showNoImageOverlay && !isLoading && (
          <View style={styles.noImageOverlay}>
            <Text style={styles.noImageIcon}>Medical Image</Text>
            <Text style={styles.noImageText}>
              {isDicomFile ? 'DICOM File Format' : 'Image Not Available'}
            </Text>
            <Text style={styles.noImageSubtext}>
              {isDicomFile 
                ? 'DICOM (.dcm) files require the web application to view. Tap "View in Web App" to open the imaging viewer.'
                : 'The image could not be loaded.'}
            </Text>
            
            <View style={styles.fileInfoBox}>
              {metadata.bodyPart && (
                <Text style={styles.fileInfoText}>Body Part: {metadata.bodyPart}</Text>
              )}
              {metadata.modality && (
                <Text style={styles.fileInfoText}>Type: {metadata.modality}</Text>
              )}
              {metadata.studyDate && (
                <Text style={styles.fileInfoText}>
                  Date: {new Date(metadata.studyDate).toLocaleDateString()}
                </Text>
              )}
            </View>

            {imageUrl && (
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.openBrowserBtn} 
                  onPress={() => {
                    console.log('View in Web App button pressed');
                    handleOpenInBrowser();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.openBrowserText}>View in Web App</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {showMetadata && metadata && imageLoadSuccess && (
        <>
          <View style={styles.metadataTopLeft}>
            {metadata.patientName && <Text style={styles.metadataText}>{metadata.patientName}</Text>}
            {metadata.patientId && <Text style={styles.metadataText}>ID: {metadata.patientId}</Text>}
          </View>
          <View style={styles.metadataTopRight}>
            {metadata.studyDate && <Text style={styles.metadataText}>{new Date(metadata.studyDate).toLocaleDateString()}</Text>}
            {metadata.bodyPart && <Text style={styles.metadataText}>{metadata.bodyPart}</Text>}
          </View>
          <View style={styles.metadataBottomLeft}>
            {metadata.institutionName && <Text style={styles.metadataText}>{metadata.institutionName}</Text>}
          </View>
          <View style={styles.metadataBottomRight}>
            <Text style={styles.metadataText}>Zoom: {Math.round(zoom * 100)}%</Text>
          </View>
        </>
      )}

      {imageLoadSuccess && (
        <View style={styles.presetsContainer}>
          {Object.entries(WINDOW_PRESETS).map(([key, preset]) => (
            <TouchableOpacity
              key={key}
              style={[styles.presetBtn, activePreset === key && styles.presetBtnActive]}
              onPress={() => setActivePreset(key)}
            >
              <Text style={[styles.presetLabel, activePreset === key && styles.presetLabelActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center' },
  toolbarCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toolbarRight: { flexDirection: 'row', alignItems: 'center' },
  toolbarBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIcon: { fontSize: 16, color: '#fff', fontWeight: '600' },
  zoomText: { color: '#fff', fontSize: 12, minWidth: 45, textAlign: 'center' },
  modalityText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  viewerContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  panArea: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 200 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#fff', marginTop: spacing.md, fontSize: 14 },
  noImageOverlay: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  noImageIcon: { fontSize: 24, color: '#fff', marginBottom: spacing.lg, fontWeight: '600' },
  noImageText: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: spacing.sm, textAlign: 'center' },
  noImageSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  fileInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minWidth: 200,
  },
  fileInfoText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: spacing.xs },
  openBrowserBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  openBrowserText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  metadataTopLeft: { position: 'absolute', top: 80, left: spacing.md },
  metadataTopRight: { position: 'absolute', top: 80, right: spacing.md, alignItems: 'flex-end' },
  metadataBottomLeft: { position: 'absolute', bottom: 80, left: spacing.md },
  metadataBottomRight: { position: 'absolute', bottom: 80, right: spacing.md, alignItems: 'flex-end' },
  metadataText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: spacing.xs,
  },
  presetBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  presetBtnActive: { backgroundColor: colors.primary },
  presetLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  presetLabelActive: { color: '#fff' },
});

export default DicomViewer;
