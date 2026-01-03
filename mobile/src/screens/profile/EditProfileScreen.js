/**
 * Edit Profile Screen - Full profile editing with photo upload
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { updateProfile, updateProfilePhoto } from '../../services/api/profileService';

const EditProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useUser();
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
    }
  }, [user]);

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
        quality: 0.7,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      });
      
      if (!result.didCancel && result.assets?.[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      });
      
      if (!result.didCancel && result.assets?.[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const uploadPhoto = async (asset) => {
    if (!asset.base64) {
      Alert.alert('Error', 'Failed to process image');
      return;
    }

    setUploadingPhoto(true);
    try {
      const base64Image = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
      const response = await updateProfilePhoto(user.id || user._id, base64Image);
      
      if (response.success) {
        setPhotoUri(response.user?.profilePhoto || asset.uri);
        Alert.alert('Success', 'Photo updated successfully');
        if (refreshUser) refreshUser();
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
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
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
      };

      const response = await updateProfile(user.id || user._id, profileData);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => {
            if (refreshUser) refreshUser();
            navigation.goBack();
          }}
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
              value === option && { color: '#fff' }
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
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
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
          >
            <Icon name="camera" size={16} color="#fff" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <Card variant="default" style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput, { backgroundColor: colors.surfaceLight, color: colors.textMuted, borderColor: colors.surfaceBorder }]}
              value={email}
              editable={false}
              placeholder="Email cannot be changed"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          {renderPicker('Blood Type', bloodType, bloodTypes, setBloodType)}
          {renderPicker('Gender', gender, genders, setGender)}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Birth</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceLight, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Emergency Contact</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Emergency contact number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Known Allergies</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceLight, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="List any known allergies (e.g., Penicillin, Peanuts)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.headlineMedium },
  saveBtn: { ...typography.buttonSmall, fontWeight: '600' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarContainer: { position: 'relative' },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  changePhotoText: { ...typography.labelMedium, color: '#fff' },
  formCard: { padding: spacing.xl },
  inputGroup: { marginBottom: spacing.lg },
  label: { ...typography.labelMedium, marginBottom: spacing.sm },
  input: {
    ...typography.bodyLarge,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  disabledInput: { opacity: 0.6 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  hint: { ...typography.labelSmall, marginTop: spacing.xs },
  pickerScroll: { flexDirection: 'row' },
  pickerOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  pickerText: { ...typography.labelMedium },
});

export default EditProfileScreen;
