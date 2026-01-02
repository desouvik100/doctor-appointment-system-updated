/**
 * Symptom Checker Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import apiClient from '../../services/api/apiClient';

const BODY_PARTS = [
  { id: 'head', label: 'Head', icon: '🧠' },
  { id: 'chest', label: 'Chest', icon: '🫁' },
  { id: 'stomach', label: 'Stomach', icon: '🫃' },
  { id: 'back', label: 'Back', icon: '🔙' },
  { id: 'arms', label: 'Arms', icon: