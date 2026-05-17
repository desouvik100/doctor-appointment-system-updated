/**
 * DICOM / Medical Image Viewer
 * Shows images in-app with zoom, pan, rotate tools.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  PanResponder,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { spacing, borderRadius } from '../../theme/typography';

const { width: SW, height: SH } = Dimensions.get('window');

const DicomViewer = ({ imageUrl, metadata = {}, onClose, showToolbar = true, showMetadata = true }) => {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [invert, setInvert] = useState(false);

  const lastPan = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    if (imageUrl) {
      setLoading(true);
      setFailed(false);
      setRetryKey(k => k + 1);
    }
  }, [imageUrl]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => { lastPan.current = { ...panRef.current }; },
      onPanResponderMove: (_, g) => {
        setPan({ x: lastPan.current.x + g.dx, y: lastPan.current.y + g.dy });
      },
    })
  ).current;

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setInvert(false);
  };

  // Raw .dcm file with no render endpoint — cannot display natively
  const isRawDicom = imageUrl &&
    (imageUrl.toLowerCase().endsWith('.dcm') || imageUrl.toLowerCase().endsWith('.dicom')) &&
    !imageUrl.includes('/render/');

  const canDisplay = !!imageUrl && !isRawDicom;

  return (
    <View style={s.container}>
      {showToolbar && (
        <View style={s.toolbar}>
          <TouchableOpacity
            style={s.toolBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.toolIcon}>{'<'}</Text>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.toolbarRow}
          >
            <TouchableOpacity style={s.toolBtn} onPress={() => setZoom(z => Math.max(z - 0.25, 0.25))}>
              <Text style={s.toolIcon}>{'-'}</Text>
            </TouchableOpacity>
            <Text style={s.zoomLabel}>{Math.round(zoom * 100)}%</Text>
            <TouchableOpacity style={s.toolBtn} onPress={() => setZoom(z => Math.min(z + 0.25, 5))}>
              <Text style={s.toolIcon}>{'+'}</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.toolBtn} onPress={() => setRotation(r => (r + 90) % 360)}>
              <Text style={s.toolIcon}>{'R'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toolBtn, invert && s.toolBtnActive]}
              onPress={() => setInvert(v => !v)}
            >
              <Text style={s.toolIcon}>{'I'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} onPress={reset}>
              <Text style={s.toolIcon}>{'X'}</Text>
            </TouchableOpacity>
          </ScrollView>
          <Text style={s.modality}>{metadata.modality || 'IMG'}</Text>
        </View>
      )}

      <View style={s.viewer}>
        {canDisplay ? (
          <View style={s.panArea} {...panResponder.panHandlers}>
            {loading && (
              <View style={s.loadingBox}>
                <ActivityIndicator size="large" color="#00D4AA" />
                <Text style={s.loadingText}>Loading image...</Text>
              </View>
            )}
            {!failed && (
              <Image
                key={retryKey}
                source={{ uri: imageUrl, cache: 'reload' }}
                style={[
                  s.image,
                  {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { scale: zoom },
                      { rotate: rotation + 'deg' },
                    ],
                    opacity: loading ? 0 : 1,
                  },
                ]}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setFailed(true); }}
              />
            )}
            {invert && !failed && !loading && (
              <View style={s.invertOverlay} pointerEvents="none" />
            )}
            {failed && (
              <FallbackView
                metadata={metadata}
                imageUrl={imageUrl}
                onRetry={() => { setFailed(false); setLoading(true); setRetryKey(k => k + 1); }}
              />
            )}
          </View>
        ) : (
          <FallbackView metadata={metadata} imageUrl={imageUrl} isRawDicom={isRawDicom} onRetry={null} />
        )}
      </View>

      {showMetadata && !failed && canDisplay && !loading && (
        <>
          <View style={s.metaTL}>
            {metadata.patientName ? <Text style={s.metaText}>{metadata.patientName}</Text> : null}
          </View>
          <View style={s.metaTR}>
            {metadata.bodyPart ? <Text style={s.metaText}>{metadata.bodyPart}</Text> : null}
          </View>
          <View style={s.metaBL}>
            {metadata.institutionName ? <Text style={s.metaText}>{metadata.institutionName}</Text> : null}
          </View>
          <View style={s.metaBR}>
            <Text style={s.metaText}>{'Zoom: ' + Math.round(zoom * 100) + '%'}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const FallbackView = ({ metadata, imageUrl, isRawDicom, onRetry }) => {
  const openWeb = async () => {
    const url = 'https://healthsyncpro.in/imaging';
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Open Browser', 'Visit healthsyncpro.in/imaging to view DICOM files.');
    }
  };

  return (
    <View style={s.fallback}>
      <Text style={s.fallbackIcon}>{'🩻'}</Text>
      <Text style={s.fallbackTitle}>{isRawDicom ? 'DICOM File' : 'Image Unavailable'}</Text>
      <Text style={s.fallbackSub}>
        {isRawDicom
          ? 'This is a raw DICOM file. Open the web viewer for full DICOM support.'
          : 'The image could not be loaded. Check your internet connection.'}
      </Text>
      {(metadata.bodyPart || metadata.modality) ? (
        <View style={s.metaBox}>
          {metadata.modality ? <Text style={s.metaBoxText}>{'Type: ' + metadata.modality}</Text> : null}
          {metadata.bodyPart ? <Text style={s.metaBoxText}>{'Body Part: ' + metadata.bodyPart}</Text> : null}
          {metadata.studyDate ? (
            <Text style={s.metaBoxText}>{'Date: ' + new Date(metadata.studyDate).toLocaleDateString()}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={s.fallbackBtns}>
        {!isRawDicom && onRetry && (
          <TouchableOpacity style={[s.webBtn, { backgroundColor: '#444', marginRight: 8 }]} onPress={onRetry}>
            <Text style={s.webBtnText}>🔄 Retry</Text>
          </TouchableOpacity>
        )}
        {imageUrl ? (
          <TouchableOpacity style={s.webBtn} onPress={openWeb}>
            <Text style={s.webBtnText}>Open Web Viewer</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
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
  toolbarRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.sm },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  toolBtnActive: { backgroundColor: '#00D4AA' },
  toolIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },
  zoomLabel: { color: '#fff', fontSize: 12, minWidth: 44, textAlign: 'center' },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.sm,
  },
  modality: { color: '#00D4AA', fontSize: 12, fontWeight: '600', marginLeft: spacing.sm },
  viewer: { flex: 1, backgroundColor: '#000' },
  panArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: SW, height: SH - 200 },
  invertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingText: { color: '#fff', marginTop: spacing.md, fontSize: 14 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  fallbackIcon: { fontSize: 20, color: '#fff', marginBottom: spacing.lg, fontWeight: '600' },
  fallbackTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: spacing.sm, textAlign: 'center' },
  fallbackSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  metaBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    minWidth: 200,
  },
  metaBoxText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: spacing.xs },
  webBtn: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  webBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fallbackBtns: { flexDirection: 'row', alignItems: 'center' },
  metaTL: { position: 'absolute', top: 80, left: spacing.md },
  metaTR: { position: 'absolute', top: 80, right: spacing.md, alignItems: 'flex-end' },
  metaBL: { position: 'absolute', bottom: 20, left: spacing.md },
  metaBR: { position: 'absolute', bottom: 20, right: spacing.md, alignItems: 'flex-end' },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default DicomViewer;
