/**
 * UploadReportScreen - Upload medical reports from camera/gallery
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const UploadReportScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [reportType, setReportType] = useState('lab');
  const [reportName, setReportName] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const reportTypes = [
    { id: 'lab', label: 'Lab Report', icon: '🔬' },
    { id: 'xray', label: 'X-Ray', icon: '📷' },
    { id: 'prescription', label: 'Prescription', icon: '💊' },
    { id: 'scan', label: 'CT/MRI Scan', icon: '🧠' },
    { id: 'other', label: 'Other', icon: '📄' },
  ];

  const handleCamera = async () => {
    // const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
    // if (!result.didCancel && result.assets?.[0]) {
    //   setSelectedImage(result.assets[0]);
    // }
    Alert.alert('Camera', 'Camera functionality will open native camera');
  };

  const handleGallery = async () => {
    // const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    // if (!result.didCancel && result.assets?.[0]) {
    //   setSelectedImage(result.assets[0]);
    // }
    Alert.alert('Gallery', 'Gallery picker will open');
  };

  const handleUpload = async () => {
    if (!reportName.trim()) {
      Alert.alert('Error', 'Please enter a report name');
      return;
    }
    
    setUploading(true);
    try {
      // Simulate upload
      await new Promise(r => setTimeout(r, 2000));
      Alert.alert('Success', 'Report uploaded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Report</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Image</Text>
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setSelectedImage(null)}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadOption} onPress={handleCamera}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOption} onPress={handleGallery}>
                <Text style={styles.uploadIcon}>🖼️</Text>
                <Text style={styles.uploadText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Report Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Type</Text>
          <View style={styles.typeGrid}>
            {reportTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, reportType === type.id && styles.typeCardActive]}
                onPress={() => setReportType(type.id)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[styles.typeLabel, reportType === type.id && styles.typeLabelActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Report Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <Card variant="default" style={styles.inputCard}>
            <Text style={styles.inputLabel}>Report Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Blood Test Report"
              placeholderTextColor={colors.textMuted}
              value={reportName}
              onChangeText={setReportName}
            />
          </Card>
          <Card variant="default" style={styles.inputCard}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={uploading ? 'Uploading...' : 'Upload Report'}
          onPress={handleUpload}
          fullWidth
          size="large"
          disabled={uploading}
        />
      </View>

      {uploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Uploading report...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  placeholder: { width: 44 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  uploadOptions: { flexDirection: 'row', gap: spacing.md },
  uploadOption: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 2, borderColor: colors.surfaceBorder, borderStyle: 'dashed' },
  uploadIcon: { fontSize: 32, marginBottom: spacing.sm },
  uploadText: { ...typography.labelMedium, color: colors.textSecondary },
  imagePreview: { position: 'relative', borderRadius: borderRadius.lg, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: borderRadius.lg },
  removeBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { color: 'white', fontSize: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCard: { width: '31%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  typeCardActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeIcon: { fontSize: 24, marginBottom: spacing.xs },
  typeLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center' },
  typeLabelActive: { color: colors.primary },
  inputCard: { padding: spacing.lg, marginBottom: spacing.md },
  inputLabel: { ...typography.labelMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  input: { ...typography.bodyLarge, color: colors.textPrimary, padding: 0 },
  textArea: { height: 80, textAlignVertical: 'top' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundCard, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, paddingBottom: spacing.xxl, borderTopWidth: 1, borderTopColor: colors.surfaceBorder, ...shadows.large },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.md },
});

export default UploadReportScreen;
