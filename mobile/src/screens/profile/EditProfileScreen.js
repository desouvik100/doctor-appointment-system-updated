/**
 * Edit Profile Screen - Full profile editing with photo upload, verification validation and crop preview
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { updateProfile, updateProfilePhoto } from '../../services/api/profileService';
import { shadows } from '../../theme/shadows';

const EditProfileScreen = ({ navigation }) => {
  const { user, refreshUser, updateUser } = useUser();
  const { colors, isDarkMode } = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Focus tracking state
  const [focusedField, setFocusedField] = useState(null);

  // Errors state
  const [errors, setErrors] = useState({});

  // Image Cropping/Adjustment Modal States
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [selectedPhotoAsset, setSelectedPhotoAsset] = useState(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Saved Crop Configs
  const [appliedCrop, setAppliedCrop] = useState({ scale: 1.0, x: 0, y: 0 });

  const styles = makeStyles(colors, isDarkMode);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBloodType(user.bloodType || '');
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || '');
      setAddress(user.address || '');
      setEmergencyContact(user.emergencyContact || '');
      setAllergies(user.allergies || '');
      setPhotoUri(user.profilePhoto || null);
      if (user.cropConfig) {
        setAppliedCrop(user.cropConfig);
      }
    }
  }, [user]);

  // Validation functions
  const validateField = (field, val) => {
    let err = '';
    const phoneRegex = /^\+?[0-9]{10,14}$/;
    // DD/MM/YYYY format check
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;

    if (field === 'name') {
      if (!val.trim()) {
        err = 'Name is required';
      } else if (val.trim().length < 2) {
        err = 'Name must be at least 2 characters';
      }
    } else if (field === 'phone') {
      if (val && !phoneRegex.test(val.trim())) {
        err = 'Enter a valid phone number (10-14 digits)';
      }
    } else if (field === 'emergencyContact') {
      if (val && !phoneRegex.test(val.trim())) {
        err = 'Enter a valid emergency contact number';
      }
    } else if (field === 'dateOfBirth') {
      if (val && !dobRegex.test(val.trim())) {
        err = 'Use birthdate format DD/MM/YYYY';
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: err,
    }));

    return !err;
  };

  const handleChoosePhoto = () => {
    Alert.alert(
      'Update Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleCamera },
        { text: 'Gallery', onPress: handleGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 700,
        maxHeight: 700,
        includeBase64: true,
      });
      
      if (!result.didCancel && result.assets?.[0]) {
        openCropModal(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 700,
        maxHeight: 700,
        includeBase64: true,
      });
      
      if (!result.didCancel && result.assets?.[0]) {
        openCropModal(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const openCropModal = (asset) => {
    setSelectedPhotoAsset(asset);
    setZoomScale(1.0);
    setOffsetX(0);
    setOffsetY(0);
    setIsCropModalVisible(true);
  };

  const applyCropAndUpload = async () => {
    if (!selectedPhotoAsset || !selectedPhotoAsset.base64) {
      Alert.alert('Error', 'Failed to process image');
      return;
    }

    setIsCropModalVisible(false);
    setUploadingPhoto(true);

    try {
      const base64Image = `data:${selectedPhotoAsset.type || 'image/jpeg'};base64,${selectedPhotoAsset.base64}`;
      const response = await updateProfilePhoto(user.id || user._id, base64Image);
      
      if (response.success && response.user) {
        // Save crop config locally and inside user object
        const cropConfig = { scale: zoomScale, x: offsetX, y: offsetY };
        setAppliedCrop(cropConfig);
        setPhotoUri(response.user.profilePhoto);
        
        // Update user context with new photo & cropConfig
        await updateUser({ 
          profilePhoto: response.user.profilePhoto,
          cropConfig: cropConfig
        });
        
        Alert.alert('Success', 'Profile photo updated and scaled!');
      } else {
        Alert.alert('Error', response.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const isNameValid = validateField('name', name);
    const isPhoneValid = validateField('phone', phone);
    const isEmergencyValid = validateField('emergencyContact', emergencyContact);
    const isDobValid = validateField('dateOfBirth', dateOfBirth);

    if (!isNameValid || !isPhoneValid || !isEmergencyValid || !isDobValid) {
      Alert.alert('Validation Error', 'Please check the invalid fields in the form.');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        name: name.trim(),
        phone: phone.trim(),
        bloodType: bloodType.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender: gender.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        allergies: allergies.trim(),
        cropConfig: appliedCrop, // Persist alignment
      };

      const response = await updateProfile(user.id || user._id, profileData);
      
      if (response.success && response.user) {
        // Update user context with all new data
        await updateUser(response.user);
        
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const renderPicker = (label, value, options, onSelect) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.pickerOption,
              { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder },
              value === option && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.pickerText,
              { color: colors.textSecondary },
              value === option && { color: '#fff', fontWeight: 'bold' }
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtnFrame, { backgroundColor: colors.primary + '15' }]}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar Section with Applied Crop positioning */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
            {photoUri ? (
              <View style={styles.croppedImageWrapper}>
                <Image 
                  source={{ uri: photoUri }} 
                  style={[
                    styles.avatarImage, 
                    {
                      transform: [
                        { scale: appliedCrop.scale },
                        { translateX: appliedCrop.x },
                        { translateY: appliedCrop.y },
                      ]
                    }
                  ]} 
                />
              </View>
            ) : (
              <Avatar name={name || 'User'} size="xlarge" showBorder />
            )}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.changePhotoBtn, { backgroundColor: colors.primary }]}
            onPress={handleChoosePhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.85}
          >
            <Icon name="camera" size={16} color="#fff" />
            <Text style={styles.changePhotoText}>Change & Align Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs Form */}
        <Card variant="default" style={[styles.formCard, { backgroundColor: colors.surface }]}>
          
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.surfaceLight, 
                  color: colors.textPrimary, 
                  borderColor: errors.name ? colors.error : (focusedField === 'name' ? colors.primary : colors.surfaceBorder),
                  borderWidth: (focusedField === 'name' || errors.name) ? 1.5 : (isDarkMode ? 1 : 0),
                }
              ]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                validateField('name', text);
              }}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Email (Disabled) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.disabledInput, { backgroundColor: colors.surfaceLight, color: colors.textMuted, borderColor: colors.surfaceBorder }]}
              value={email}
              editable={false}
              placeholder="Email cannot be changed"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>Registered medical identification email</Text>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.surfaceLight, 
                  color: colors.textPrimary, 
                  borderColor: errors.phone ? colors.error : (focusedField === 'phone' ? colors.primary : colors.surfaceBorder),
                  borderWidth: (focusedField === 'phone' || errors.phone) ? 1.5 : (isDarkMode ? 1 : 0),
                }
              ]}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                validateField('phone', text);
              }}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          {renderPicker('Blood Group', bloodType, bloodTypes, setBloodType)}
          {renderPicker('Gender Identity', gender, genders, setGender)}

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Birth</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.surfaceLight, 
                  color: colors.textPrimary, 
                  borderColor: errors.dateOfBirth ? colors.error : (focusedField === 'dateOfBirth' ? colors.primary : colors.surfaceBorder),
                  borderWidth: (focusedField === 'dateOfBirth' || errors.dateOfBirth) ? 1.5 : (isDarkMode ? 1 : 0),
                }
              ]}
              value={dateOfBirth}
              onChangeText={(text) => {
                setDateOfBirth(text);
                validateField('dateOfBirth', text);
              }}
              onFocus={() => setFocusedField('dateOfBirth')}
              onBlur={() => setFocusedField(null)}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.textMuted}
            />
            {errors.dateOfBirth ? (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            ) : (
              <Text style={[styles.hint, { color: colors.textMuted }]}>Use 10-character date format</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Residential Address</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  backgroundColor: colors.surfaceLight, 
                  color: colors.textPrimary, 
                  borderColor: focusedField === 'address' ? colors.primary : colors.surfaceBorder,
                  borderWidth: focusedField === 'address' ? 1.5 : (isDarkMode ? 1 : 0),
                }
              ]}
              value={address}
              onChangeText={setAddress}
              onFocus={() => setFocusedField('address')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your street name and house address"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Emergency Contact */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Emergency Contact Number</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.surfaceLight, 
                  color: colors.textPrimary, 
                  borderColor: errors.emergencyContact ? colors.error : (focusedField === 'emergencyContact' ? colors.primary : colors.surfaceBorder),
                  borderWidth: (focusedField === 'emergencyContact' || errors.emergencyContact) ? 1.5 : (isDarkMode ? 1 : 0),
                }
              ]}
              value={emergencyContact}
              onChangeText={(text) => {
                setEmergencyContact(text);
                validateField('emergencyContact', text);
              }}
              onFocus={() => setFocusedField('emergencyContact')}
              onBlur={() => setFocusedField(null)}
              placeholder="Primary caregiver or relative contact"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
            {errors.emergencyContact ? <Text style={styles.errorText}>{errors.emergencyContact}</Text> : null}
          </View>

          {/* Known Allergies */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Chronic / Medical Allergies</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  backgroundColor: colors.surfaceLight, 
                  color: colors.textPrimary, 
                  borderColor: focusedField === 'allergies' ? colors.primary : colors.surfaceBorder,
                  borderWidth: focusedField === 'allergies' ? 1.5 : (isDarkMode ? 1 : 0),
                }
              ]}
              value={allergies}
              onChangeText={setAllergies}
              onFocus={() => setFocusedField('allergies')}
              onBlur={() => setFocusedField(null)}
              placeholder="List pharmaceutical or food sensitivity (e.g. Paracetamol, Latex)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Modern Circle Cropping / Adjustment Modal */}
      <Modal
        visible={isCropModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCropModalVisible(false)}
      >
        <View style={styles.cropModalOverlay}>
          <View style={[styles.cropCardContainer, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF' }]}>
            
            <View style={styles.cropHeader}>
              <Text style={[styles.cropTitle, { color: colors.textPrimary }]}>Adjust Profile Photo</Text>
              <TouchableOpacity onPress={() => setIsCropModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Simulated Crop Preview Frame */}
            <View style={styles.cropWindowArea}>
              <View style={[styles.cropWindowCircle, { borderColor: colors.primary }]}>
                {selectedPhotoAsset && (
                  <Image
                    source={{ uri: selectedPhotoAsset.uri }}
                    style={[
                      styles.cropImage,
                      {
                        transform: [
                          { scale: zoomScale },
                          { translateX: offsetX },
                          { translateY: offsetY },
                        ],
                      },
                    ]}
                  />
                )}
              </View>
              {/* Outer grid boundary line indicator */}
              <View style={styles.cropOverlayGrid} pointerEvents="none" />
            </View>

            <Text style={[styles.cropInstructions, { color: colors.textMuted }]}>
              Position the photo in the frame. Scale and align before saving.
            </Text>

            {/* Adjuster Controls */}
            <View style={styles.controlsContainer}>
              
              {/* Scale/Zoom Control */}
              <View style={styles.controlRow}>
                <Icon name="image-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Zoom Scale: {zoomScale.toFixed(1)}x</Text>
                <View style={styles.controlActions}>
                  <TouchableOpacity 
                    onPress={() => setZoomScale(prev => Math.max(1.0, prev - 0.15))}
                    style={[styles.controlBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Icon name="remove" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setZoomScale(prev => Math.min(3.0, prev + 0.15))}
                    style={[styles.controlBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Icon name="add" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Positioning */}
              <View style={styles.controlRow}>
                <Icon name="swap-horizontal-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Horizontal Align</Text>
                <View style={styles.controlActions}>
                  <TouchableOpacity 
                    onPress={() => setOffsetX(prev => prev - 15)}
                    style={[styles.controlBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Icon name="arrow-back" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setOffsetX(prev => prev + 15)}
                    style={[styles.controlBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Icon name="arrow-forward" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Vertical Positioning */}
              <View style={styles.controlRow}>
                <Icon name="swap-vertical-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Vertical Align</Text>
                <View style={styles.controlActions}>
                  <TouchableOpacity 
                    onPress={() => setOffsetY(prev => prev - 15)}
                    style={[styles.controlBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Icon name="arrow-up" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setOffsetY(prev => prev + 15)}
                    style={[styles.controlBtn, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Icon name="arrow-down" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* Bottom Actions */}
            <View style={styles.cropActionsRow}>
              <TouchableOpacity 
                style={[styles.cropCancelBtn, { borderColor: colors.surfaceBorder }]} 
                onPress={() => setIsCropModalVisible(false)}
              >
                <Text style={[styles.cropCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cropApplyBtn, { backgroundColor: colors.primary }]}
                onPress={applyCropAndUpload}
              >
                <Text style={styles.cropApplyText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 10,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: { ...typography.headlineMedium, fontWeight: '800' },
  saveBtnFrame: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  saveBtn: { ...typography.buttonSmall, fontWeight: '700' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  
  // Avatar section styling
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl, marginTop: spacing.md },
  avatarContainer: { 
    position: 'relative',
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  croppedImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.md,
  },
  changePhotoText: { ...typography.labelMedium, color: '#fff', fontWeight: '750' },
  
  // Form Card styling
  formCard: { padding: spacing.xl, borderRadius: borderRadius.xxl, ...shadows.sm, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' },
  inputGroup: { marginBottom: spacing.lg },
  label: { ...typography.labelMedium, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    ...typography.bodyLarge,
    fontSize: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: isDarkMode ? 1 : 0,
  },
  disabledInput: { opacity: 0.6 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  hint: { fontSize: 11, marginTop: spacing.xs },
  errorText: { color: colors.error, fontSize: 11, marginTop: spacing.xs, fontWeight: '600' },
  
  pickerScroll: { flexDirection: 'row', paddingVertical: 4 },
  pickerOption: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: isDarkMode ? 1 : 0,
  },
  pickerText: { ...typography.labelMedium },

  // Crop Modal Styling
  cropModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  cropCardContainer: {
    width: '100%',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.xl,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cropTitle: { ...typography.headlineSmall, fontWeight: '800' },
  cropWindowArea: {
    height: 250,
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.md,
  },
  cropWindowCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cropImage: {
    width: 180,
    height: 180,
  },
  cropOverlayGrid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    margin: 30,
    borderRadius: borderRadius.lg,
  },
  cropInstructions: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  controlsContainer: {
    marginBottom: spacing.xl,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  controlLabel: {
    flex: 1,
    marginLeft: spacing.md,
    ...typography.labelMedium,
    fontWeight: '700',
  },
  controlActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cropActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cropCancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  cropCancelText: { ...typography.button, fontWeight: '750' },
  cropApplyBtn: {
    flex: 1.5,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  cropApplyText: { ...typography.button, color: '#fff', fontWeight: '750' },
});

export default EditProfileScreen;
