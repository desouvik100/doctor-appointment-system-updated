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
  ScrollView,
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
  const [invert, setInvert] = useState(false);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  const lastPan = useRef({ x: 0, y: 0 });
  const currentPan = useRef({ x: 0, y: 0 });

  // Update ref when pan changes
  React.useEffect(() => {
    currentPan.current = pan;
  }, [pan]);

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
        lastPan.current = { ...currentPan.current };
      },
      onPanResponderMove: (_, gestureState) => {
        setPan({
          x: lastPan.current.x + gestureState.dx,
          y: lastPan.current.y + gestureState.dy,
        });
      },
    })
  ).current;

  const handleZoomIn = () => {
    console.log('Zoom In pressed, current:', zoom);
    setZoom(prev => Math.min(prev + 0.25, 4.0));
  };
  const handleZoomOut = () => {
    console.log('Zoom Out pressed, current:', zoom);
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };
  const handleRotate = () => {
    console.log('Rotate pressed, current:', rotation);
    setRotation(prev => (prev + 90) % 360);
  };
  const handleReset = () => { 
    console.log('Reset pressed');
    setZoom(1.0); 
    setPan({ x: 0, y: 0 }); 
    setRotation(0); 
    setInvert(false);
    setFlipH(false);
    setFlipV(false);
    setActivePreset('default');
  };
  const handleFitToScreen = () => { 
    console.log('Fit to Screen pressed');
    setZoom(1.0); 
    setPan({ x: 0, y: 0 }); 
  };
  const handleInvert = () => setInvert(prev => !prev);
  const handleFlipH = () => setFlipH(prev => !prev);
  const handleFlipV = () => setFlipV(prev => !prev);

  // Handle preset selection - in a real DICOM viewer this would adjust window/level
  const handlePresetSelect = (preset) => {
    setActivePreset(preset);
    // For now, just toggle invert for bone preset to simulate different window
    if (preset === 'bone') {
      setInvert(true);
    } else {
      setInvert(false);
    }
  };

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
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.6} onPress={onClose}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarScroll}
          >
            <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.6} onPress={() => handleZoomOut()}>
              <Text style={styles.toolbarIcon}>−</Text>
            </TouchableOpacity>
            <View style={styles.zoomDisplay}>
              <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            </View>
            <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.6} onPress={() => handleZoomIn()}>
              <Text style={styles.toolbarIcon}>+</Text>
            </TouchableOpacity>
            
            <View style={styles.toolbarDivider} />
            
            <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.6} onPress={() => handleRotate()}>
              <Text style={styles.toolbarIcon}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolbarBtn, flipH && styles.toolbarBtnActive]} activeOpacity={0.6} onPress={() => handleFlipH()}>
              <Text style={styles.toolbarIcon}>⇆</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolbarBtn, flipV && styles.toolbarBtnActive]} activeOpacity={0.6} onPress={() => handleFlipV()}>
              <Text style={styles.toolbarIcon}>⇅</Text>
            </TouchableOpacity>
            
            <View style={styles.toolbarDivider} />
            
            <TouchableOpacity style={[styles.toolbarBtn, invert && styles.toolbarBtnActive]} activeOpacity={0.6} onPress={() => handleInvert()}>
              <Text style={styles.toolbarIcon}>◑</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.6} onPress={() => handleFitToScreen()}>
              <Text style={styles.toolbarIcon}>⊡</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.6} onPress={() => handleReset()}>
              <Text style={styles.toolbarIcon}>↺</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <Text style={styles.modalityText}>{metadata.modality || 'IMG'}</Text>
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
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: invert ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}invert=1&t=${Date.now()}` : imageUrl }}
                style={[
                  styles.image,
                  {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { scale: zoom },
                      { rotate: `${rotation}deg` },
                      { scaleX: flipH ? -1 : 1 },
                      { scaleY: flipV ? -1 : 1 },
                    ],
                  },
                ]}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </View>
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
              onPress={() => handlePresetSelect(key)}
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingTop: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '600' },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  toolbarBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  toolbarBtnActive: {
    backgroundColor: colors.primary,
  },
  toolbarIcon: { fontSize: 18, color: '#fff', fontWeight: '600' },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.sm,
  },
  zoomDisplay: {
    paddingHorizontal: spacing.sm,
    minWidth: 50,
  },
  zoomText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  modalityText: { color: colors.primary, fontSize: 12, fontWeight: '600', marginLeft: spacing.sm },
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  panArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageWrapper: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    width: '100%',
  },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 220 },
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
