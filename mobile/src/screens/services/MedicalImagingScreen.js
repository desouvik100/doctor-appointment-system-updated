/**
 * Medical Imaging Screen - View imaging reports and scans
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
  Alert,
  Share,
  Linking,
  PermissionsAndroid,
  Platform,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DocumentPicker from 'react-native-document-picker';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { DicomViewer } from '../../components/imaging';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

// API base URL - Production
const API_BASE_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

const MedicalImagingScreen = ({ navigation }) => {
  const { user } = useUser();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const patientId = user?.id || user?._id;

  // Handle DICOM file upload
  const handleUpload = async () => {
    try {
      // Pick DICOM files
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      if (!results || results.length === 0) {
        return;
      }

      // Filter for DICOM files
      const dicomFiles = results.filter(file => {
        const ext = file.name?.toLowerCase().split('.').pop();
        return ['dcm', 'dicom', 'dic'].includes(ext) || file.type === 'application/dicom';
      });

      if (dicomFiles.length === 0) {
        Alert.alert(
          'Invalid Files',
          'Please select DICOM files (.dcm, .dicom). Other image formats are not supported for medical imaging.',
          [{ text: 'OK' }]
        );
        return;
      }

      setUploading(true);

      // Create FormData for upload
      const formData = new FormData();
      dicomFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type || 'application/dicom',
          name: file.name || `dicom_${index}.dcm`,
        });
      });
      formData.append('patientId', patientId);

      // Upload to server
      const response = await fetch(`${API_BASE_URL}/imaging/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Upload Successful',
          `${dicomFiles.length} DICOM file(s) uploaded successfully. The images will be processed and available shortly.`,
          [{ text: 'OK', onPress: () => fetchReports() }]
        );
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled - do nothing
        return;
      }
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload DICOM files. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  const imagingTypes = [
    { id: 'all', label: 'All', emoji: '📋' },
    { id: 'X-Ray', label: 'X-Ray', emoji: '🦴' },
    { id: 'CT', label: 'CT Scan', emoji: '🔬' },
    { id: 'MRI', label: 'MRI', emoji: '🧲' },
    { id: 'Ultrasound', label: 'Ultrasound', emoji: '📡' },
    { id: 'other', label: 'Other', emoji: '📷' },
  ];

  // Handle image download
  const handleDownload = async () => {
    if (!selectedImage || !selectedReport) return;

    try {
      setDownloading(true);
      
      // Build the correct download URL from the image's fileUrl
      let imageUrl;
      if (selectedImage.fileUrl) {
        // fileUrl is like /uploads/imaging/patientId/filename
        // Need to prepend the base URL (without /api)
        const baseUrl = API_BASE_URL.replace('/api', '');
        imageUrl = `${baseUrl}${selectedImage.fileUrl}`;
      } else if (selectedImage.url) {
        imageUrl = selectedImage.url;
      } else {
        imageUrl = `${API_BASE_URL}/imaging/${selectedReport._id}/images/${selectedImage._id || encodeURIComponent(selectedImage.fileName)}`;
      }
      
      console.log('Download URL:', imageUrl);

      if (Platform.OS === 'android') {
        // For Android 13+ (API 33+), we don't need WRITE_EXTERNAL_STORAGE
        // For older versions, request permission
        const androidVersion = Platform.Version;
        
        if (androidVersion < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'This app needs access to your storage to download medical images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Allow',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Storage permission is needed to download files. Please enable it in app settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
              ]
            );
            setDownloading(false);
            return;
          }
        }
      }

      // Show download options
      Alert.alert(
        'Download Medical Image',
        `File: ${selectedImage.fileName || selectedImage.description}\n\nThis is a DICOM medical imaging file.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open in Browser', 
            onPress: async () => {
              try {
                console.log('Opening URL from download:', imageUrl);
                await Linking.openURL(imageUrl);
              } catch (e) {
                console.error('Open URL error:', e);
                Alert.alert('Error', 'Could not open the file URL. Please try copying the URL manually.');
              }
            }
          },
          {
            text: 'Copy URL',
            onPress: () => {
              // Import Clipboard if needed, for now just show the URL
              Alert.alert(
                'File URL',
                imageUrl,
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download the file. Please try again later.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle image share
  const handleShare = async () => {
    if (!selectedImage || !selectedReport) return;

    try {
      // Build the correct URL
      let imageUrl = '';
      if (selectedImage.fileUrl) {
        const baseUrl = API_BASE_URL.replace('/api', '');
        imageUrl = `${baseUrl}${selectedImage.fileUrl}`;
      } else if (selectedImage.url) {
        imageUrl = selectedImage.url;
      }

      const shareContent = {
        title: `Medical Image - ${selectedReport.imagingType}`,
        message: `Medical Imaging Report\n\n` +
          `Type: ${selectedReport.imagingType} - ${selectedReport.bodyPart}\n` +
          `Report #: ${selectedReport.reportNumber}\n` +
          `Date: ${formatDate(selectedReport.procedureDate)}\n` +
          `File: ${selectedImage.fileName || selectedImage.description}\n` +
          (imageUrl ? `\nDownload: ${imageUrl}` : '') +
          `\n\nNote: DICOM files require specialized medical imaging software to view.`,
      };

      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        // Successfully shared
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share the file. Please try again.');
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchReports();
    }
  }, [patientId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/imaging/patient/${patientId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || 'demo-token'}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch imaging reports');
      }

      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports || []);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Error fetching imaging reports:', err);
      // Show demo data for development
      setReports(getDemoReports());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDemoReports = () => [
    {
      _id: '1',
      reportNumber: 'IMG-2024-001',
      imagingType: 'X-Ray',
      bodyPart: 'Chest',
      status: 'verified',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. Sarah Wilson',
      reportedByName: 'Dr. Michael Chen',
      findings: 'Normal chest X-ray. No acute cardiopulmonary abnormality.',
      impression: 'Normal study',
      images: [
        { fileName: 'chest_pa.jpg', thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Chest_Xray_PA_3-8-2010.png/220px-Chest_Xray_PA_3-8-2010.png', description: 'PA View' },
        { fileName: 'chest_lateral.jpg', thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Chest_X-ray_lateral.jpg/170px-Chest_X-ray_lateral.jpg', description: 'Lateral View' }
      ]
    },
    {
      _id: '2',
      reportNumber: 'IMG-2024-002',
      imagingType: 'MRI',
      bodyPart: 'Brain',
      status: 'reported',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. James Lee',
      reportedByName: 'Dr. Emily Brown',
      findings: 'No evidence of acute intracranial abnormality. Normal brain parenchyma.',
      impression: 'Normal MRI brain',
      images: [
        { fileName: 'brain_t1.jpg', thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Human_brain_NIH.jpg/220px-Human_brain_NIH.jpg', description: 'T1 Weighted' },
        { fileName: 'brain_t2.jpg', thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/MRI_brain_sagittal_section.jpg/170px-MRI_brain_sagittal_section.jpg', description: 'T2 Weighted' }
      ]
    },
    {
      _id: '3',
      reportNumber: 'IMG-2024-003',
      imagingType: 'CT',
      bodyPart: 'Abdomen',
      status: 'pending_report',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. Sarah Wilson',
      findings: null,
      impression: null,
      images: []
    },
    {
      _id: '4',
      reportNumber: 'IMG-2024-004',
      imagingType: 'Ultrasound',
      bodyPart: 'Abdomen',
      status: 'verified',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. Michael Chen',
      reportedByName: 'Dr. Lisa Wang',
      findings: 'Liver, gallbladder, pancreas, spleen, and kidneys appear normal. No free fluid.',
      impression: 'Normal abdominal ultrasound',
      images: [
        { fileName: 'liver.jpg', thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ultrasound_of_human_liver.jpg/220px-Ultrasound_of_human_liver.jpg', description: 'Liver' },
        { fileName: 'kidney.jpg', thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Ultrasound_Scan_ND_0125143756_1441570.png/220px-Ultrasound_Scan_ND_0125143756_1441570.png', description: 'Right Kidney' }
      ]
    }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return colors.success;
      case 'reported': return colors.info;
      case 'pending_report': return colors.warning;
      case 'scheduled': return colors.secondary;
      case 'ordered': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'reported': return 'Reported';
      case 'pending_report': return 'Pending Report';
      case 'scheduled': return 'Scheduled';
      case 'ordered': return 'Ordered';
      default: return status;
    }
  };

  const getImagingEmoji = (type) => {
    switch (type) {
      case 'X-Ray': return '🦴';
      case 'CT': return '🔬';
      case 'MRI': return '🧲';
      case 'Ultrasound': return '📡';
      case 'PET': return '⚛️';
      case 'Mammography': return '🩺';
      case 'other': return '📷';
      default: return '📷';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredReports = filterType === 'all' 
    ? reports 
    : reports.filter(r => r.imagingType === filterType);

  const renderReportCard = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedReport(item)}>
      <Card variant="gradient" style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportIconContainer}>
            <Text style={styles.reportEmoji}>{getImagingEmoji(item.imagingType)}</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportType}>{item.imagingType} - {item.bodyPart}</Text>
            <Text style={styles.reportNumber}>{item.reportNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>📅</Text>
            <Text style={styles.detailText}>{formatDate(item.procedureDate || item.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>👨‍⚕️</Text>
            <Text style={styles.detailText}>{item.orderedByName || 'N/A'}</Text>
          </View>
        </View>

        {item.impression && (
          <View style={styles.impressionContainer}>
            <Text style={styles.impressionLabel}>Impression:</Text>
            <Text style={styles.impressionText} numberOfLines={2}>{item.impression}</Text>
          </View>
        )}

        {item.images && item.images.length > 0 && (
          <View style={styles.imagesPreview}>
            <Text style={styles.imagesCount}>
              📷 {item.images.length} image{item.images.length > 1 ? 's' : ''} available
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderReportDetail = () => {
    if (!selectedReport) return null;

    return (
      <Modal
        visible={!!selectedReport}
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.backButton}>
              <Text style={styles.backEmoji}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Report Info Card */}
            <Card variant="gradient" style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailEmoji}>{getImagingEmoji(selectedReport.imagingType)}</Text>
                <View style={styles.detailHeaderInfo}>
                  <Text style={styles.detailTitle}>
                    {selectedReport.imagingType} - {selectedReport.bodyPart}
                  </Text>
                  <Text style={styles.detailSubtitle}>{selectedReport.reportNumber}</Text>
                </View>
              </View>

              <View style={[styles.statusBadgeLarge, { backgroundColor: `${getStatusColor(selectedReport.status)}20` }]}>
                <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedReport.status) }]}>
                  {getStatusLabel(selectedReport.status)}
                </Text>
              </View>
            </Card>

            {/* Dates & Doctors */}
            <Card variant="default" style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Study Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Procedure Date</Text>
                <Text style={styles.infoValue}>{formatDate(selectedReport.procedureDate)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ordered By</Text>
                <Text style={styles.infoValue}>{selectedReport.orderedByName || 'N/A'}</Text>
              </View>
              
              {selectedReport.reportedByName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reported By</Text>
                  <Text style={styles.infoValue}>{selectedReport.reportedByName}</Text>
                </View>
              )}
            </Card>

            {/* Findings */}
            {selectedReport.findings && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Findings</Text>
                <Text style={styles.findingsText}>{selectedReport.findings}</Text>
              </Card>
            )}

            {/* Impression */}
            {selectedReport.impression && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Impression</Text>
                <Text style={styles.impressionDetailText}>{selectedReport.impression}</Text>
              </Card>
            )}

            {/* Recommendations */}
            {selectedReport.recommendations && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                <Text style={styles.findingsText}>{selectedReport.recommendations}</Text>
              </Card>
            )}

            {/* Images */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Images ({selectedReport.images.length})</Text>
                <View style={styles.imagesGrid}>
                  {selectedReport.images.map((img, index) => {
                    // Get the image URL - check thumbnailUrl, url, or fileUrl
                    const imageUrl = img.thumbnailUrl || img.url || (img.fileUrl ? `${API_BASE_URL.replace('/api', '')}${img.fileUrl}` : null);
                    
                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.imageItem}
                        onPress={() => {
                          setSelectedImage(img);
                          setImageViewerVisible(true);
                        }}
                      >
                        {imageUrl ? (
                          <Image 
                            source={{ uri: imageUrl }}
                            style={styles.imageThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderEmoji}>🖼️</Text>
                          </View>
                        )}
                        <Text style={styles.imageLabel} numberOfLines={1}>
                          {img.description || img.fileName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* No Report Yet */}
            {!selectedReport.findings && !selectedReport.impression && (
              <Card variant="default" style={styles.infoCard}>
                <View style={styles.pendingContainer}>
                  <Text style={styles.pendingEmoji}>⏳</Text>
                  <Text style={styles.pendingTitle}>Report Pending</Text>
                  <Text style={styles.pendingText}>
                    The radiologist is reviewing your images. The report will be available soon.
                  </Text>
                </View>
              </Card>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderImageViewer = () => {
    if (!selectedImage) return null;

    // Build the image URL from available sources
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    // Check if we have a fileUrl that's a DICOM file - use render endpoint
    let imageUrl = selectedImage.thumbnailUrl || selectedImage.url;
    
    if (!imageUrl && selectedImage.fileUrl) {
      // fileUrl is like /uploads/imaging/patientId/filename.dcm
      // Convert to render endpoint: /api/imaging/render/patientId/filename.dcm
      const fileUrlParts = selectedImage.fileUrl.split('/');
      const filename = fileUrlParts.pop();
      const patientIdFromPath = fileUrlParts.pop();
      
      // Use render endpoint for DICOM files
      if (filename.toLowerCase().endsWith('.dcm') || filename.toLowerCase().endsWith('.dicom')) {
        imageUrl = `${API_BASE_URL}/imaging/render/${patientIdFromPath}/${filename}`;
      } else {
        imageUrl = `${baseUrl}${selectedImage.fileUrl}`;
      }
    }

    // Debug logging
    console.log('selectedImage:', JSON.stringify(selectedImage, null, 2));
    console.log('Built imageUrl:', imageUrl);

    // Build metadata for the viewer
    const imageMetadata = {
      modality: selectedReport?.imagingType || 'IMG',
      bodyPart: selectedReport?.bodyPart || '',
      studyDate: selectedReport?.procedureDate || selectedReport?.createdAt,
      patientName: user?.name || '',
      patientId: patientId,
      institutionName: 'HealthSync Medical',
    };

    return (
      <Modal
        visible={imageViewerVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {
          setImageViewerVisible(false);
          setSelectedImage(null);
        }}
      >
        <View style={styles.dicomViewerContainer}>
          <DicomViewer
            imageUrl={imageUrl}
            metadata={imageMetadata}
            onClose={() => {
              setImageViewerVisible(false);
              setSelectedImage(null);
            }}
            showToolbar={true}
            showMetadata={true}
          />
          
          {/* Footer with download/share buttons */}
          <View style={styles.imageViewerFooter}>
            <TouchableOpacity 
              style={[styles.imageViewerButton, downloading && styles.imageViewerButtonDisabled]} 
              onPress={handleDownload}
              disabled={downloading}
            >
              <Text style={styles.imageViewerButtonText}>
                {downloading ? '⏳ Downloading...' : '📥 Download'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageViewerButtonSecondary} onPress={handleShare}>
              <Text style={styles.imageViewerButtonSecondaryText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading imaging reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backEmoji}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Imaging</Text>
        <TouchableOpacity 
          onPress={handleUpload} 
          style={styles.uploadButton}
          disabled={uploading}
        >
          <Text style={styles.uploadEmoji}>{uploading ? '⏳' : '📤'}</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEmoji}>🩻</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Your Imaging Records</Text>
            <Text style={styles.bannerSubtitle}>
              View X-Rays, CT, MRI, and Ultrasound reports
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {imagingTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterTab,
              filterType === type.id && styles.filterTabActive
            ]}
            onPress={() => setFilterType(type.id)}
          >
            <Text style={styles.filterEmoji}>{type.emoji}</Text>
            <Text style={[
              styles.filterLabel,
              filterType === type.id && styles.filterLabelActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🩻</Text>
          <Text style={styles.emptyTitle}>No Imaging Reports</Text>
          <Text style={styles.emptyText}>
            {filterType === 'all' 
              ? "You don't have any imaging reports yet."
              : `No ${filterType} reports found.`}
          </Text>
          <TouchableOpacity 
            style={styles.uploadButtonLarge} 
            onPress={handleUpload}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? '⏳ Uploading...' : '📤 Upload DICOM Files'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Report Detail Modal */}
      {renderReportDetail()}
      
      {/* Image Viewer Modal */}
      {renderImageViewer()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backEmoji: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  banner: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bannerEmoji: {
    fontSize: 48,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.headlineSmall,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    maxHeight: 60,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.sm,
  },
  filterTabActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  filterLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  filterLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  reportCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reportEmoji: {
    fontSize: 24,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  reportNumber: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  reportDetails: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailEmoji: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  impressionContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  impressionLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  impressionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  imagesPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  imagesCount: {
    ...typography.labelMedium,
    color: colors.info,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  uploadButtonLarge: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  uploadButtonText: {
    ...typography.labelLarge,
    color: colors.textInverse,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  detailCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  detailSubtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusTextLarge: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  infoCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  findingsText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  impressionDetailText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 24,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  imageItem: {
    width: (width - spacing.xl * 2 - spacing.lg * 2 - spacing.md * 2) / 3,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  imageThumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceLight,
  },
  imagePlaceholderEmoji: {
    fontSize: 32,
  },
  imageLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pendingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  pendingEmoji: {
    fontSize: 48,
  },
  pendingTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pendingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  // Image Viewer Styles
  dicomViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageViewerFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    gap: spacing.md,
  },
  imageViewerButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  imageViewerButtonDisabled: {
    opacity: 0.6,
  },
  imageViewerButtonText: {
    ...typography.labelLarge,
    color: colors.textInverse,
    fontWeight: '600',
  },
  imageViewerButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  imageViewerButtonSecondaryText: {
    ...typography.labelLarge,
    color: colors.textInverse,
    fontWeight: '600',
  },
});

export default MedicalImagingScreen;
