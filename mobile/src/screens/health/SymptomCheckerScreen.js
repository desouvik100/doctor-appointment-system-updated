/**
 * Symptom Checker Screen - AI-powered symptom analysis
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
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import apiClient from '../../services/api/apiClient';
import { useUser } from '../../context/UserContext';

const BODY_PARTS = [
  { id: 'head', label: 'Head', icon: '🧠' },
  { id: 'chest', label: 'Chest', icon: '🫁' },
  { id: 'stomach', label: 'Stomach', icon: '🤢' },
  { id: 'back', label: 'Back', icon: '🔙' },
  { id: 'arms', label: 'Arms', icon: '💪' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'throat', label: 'Throat', icon: '🗣️' },
  { id: 'skin', label: 'Skin', icon: '🖐️' },
];

const COMMON_SYMPTOMS = [
  { id: 'fever', label: 'Fever', icon: '🌡️' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'cough', label: 'Cough', icon: '😷' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'nausea', label: 'Nausea', icon: '🤮' },
  { id: 'pain', label: 'Body Pain', icon: '😣' },
  { id: 'breathing', label: 'Breathing Issues', icon: '💨' },
  { id: 'dizziness', label: 'Dizziness', icon: '😵' },
];

const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild', color: '#10B981', desc: 'Manageable discomfort' },
  { id: 'moderate', label: 'Moderate', color: '#F59E0B', desc: 'Affecting daily activities' },
  { id: 'severe', label: 'Severe', color: '#EF4444', desc: 'Significant pain/discomfort' },
];

const SymptomCheckerScreen = ({ navigation }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalSymptoms, setAdditionalSymptoms] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleBodyPart = (id) => {
    setSelectedBodyParts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0 && !additionalSymptoms.trim()) {
      Alert.alert('Error', 'Please select at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const symptomsText = [
        ...selectedSymptoms.map(id => COMMON_SYMPTOMS.find(s => s.id === id)?.label),
        ...additionalSymptoms.split(',').map(s => s.trim()).filter(s => s),
      ].join(', ');

      const bodyPartsText = selectedBodyParts
        .map(id => BODY_PARTS.find(b => b.id === id)?.label)
        .join(', ');

      const response = await apiClient.post('/chatbot/message', {
        message: `I'm experiencing the following symptoms: ${symptomsText}. ${bodyPartsText ? `Affected areas: ${bodyPartsText}.` : ''} Severity: ${severity}. ${duration ? `Duration: ${duration}.` : ''} Please analyze these symptoms and provide possible conditions, recommendations, and when to see a doctor.`,
        userId: user?._id,
        context: 'symptom_checker',
      });

      setResult({
        analysis: response.data.response || response.data.message,
        symptoms: symptomsText,
        severity,
        timestamp: new Date().toISOString(),
      });
      setStep(4);
    } catch (error) {
      console.error('Symptom analysis error:', error);
      // Provide offline fallback
      setResult({
        analysis: getOfflineAnalysis(selectedSymptoms, severity),
        symptoms: selectedSymptoms.map(id => COMMON_SYMPTOMS.find(s => s.id === id)?.label).join(', '),
        severity,
        timestamp: new Date().toISOString(),
        isOffline: true,
      });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const getOfflineAnalysis = (symptoms, severity) => {
    const hasEmergency = symptoms.some(s => ['breathing', 'chest'].includes(s)) && severity === 'severe';
    
    if (hasEmergency) {
      return `⚠️ URGENT: Your symptoms may require immediate medical attention.\n\n🚨 Please seek emergency care or call 102 immediately if you experience:\n- Severe chest pain\n- Difficulty breathing\n- Loss of consciousness\n\n📞 Emergency Numbers:\n- Ambulance: 102\n- National Emergency: 112`;
    }

    return `Based on your symptoms, here are some general recommendations:\n\n💊 Self-Care Tips:\n- Rest adequately\n- Stay hydrated\n- Monitor your symptoms\n\n👨‍⚕️ When to See a Doctor:\n- If symptoms persist for more than 3 days\n- If symptoms worsen\n- If you develop new symptoms\n\n⚠️ Note: This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation.`;
  };

  const resetChecker = () => {
    setStep(1);
    setSelectedBodyParts([]);
    setSelectedSymptoms([]);
    setAdditionalSymptoms('');
    setSeverity('moderate');
    setDuration('');
    setResult(null);
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where do you feel discomfort?</Text>
      <Text style={styles.stepSubtitle}>Select affected body areas (optional)</Text>
      
      <View style={styles.grid}>
        {BODY_PARTS.map(part => (
          <TouchableOpacity
            key={part.id}
            style={[styles.gridItem, selectedBodyParts.includes(part.id) && styles.gridItemActive]}
            onPress={() => toggleBodyPart(part.id)}
          >
            <Text style={styles.gridIcon}>{part.icon}</Text>
            <Text style={[styles.gridLabel, selectedBodyParts.includes(part.id) && styles.gridLabelActive]}>
              {part.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What symptoms are you experiencing?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
      
      <View style={styles.grid}>
        {COMMON_SYMPTOMS.map(symptom => (
          <TouchableOpacity
            key={symptom.id}
            style={[styles.gridItem, selectedSymptoms.includes(symptom.id) && styles.gridItemActive]}
            onPress={() => toggleSymptom(symptom.id)}
          >
            <Text style={styles.gridIcon}>{symptom.icon}</Text>
            <Text style={[styles.gridLabel, selectedSymptoms.includes(symptom.id) && styles.gridLabelActive]}>
              {symptom.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>Other symptoms (comma separated)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., runny nose, sore muscles"
        placeholderTextColor={colors.textMuted}
        value={additionalSymptoms}
        onChangeText={setAdditionalSymptoms}
        multiline
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How severe are your symptoms?</Text>
      
      <View style={styles.severityContainer}>
        {SEVERITY_LEVELS.map(level => (
          <TouchableOpacity
            key={level.id}
            style={[styles.severityCard, severity === level.id && { borderColor: level.color, borderWidth: 2 }]}
            onPress={() => setSeverity(level.id)}
          >
            <View style={[styles.severityDot, { backgroundColor: level.color }]} />
            <Text style={styles.severityLabel}>{level.label}</Text>
            <Text style={styles.severityDesc}>{level.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>How long have you had these symptoms?</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., 2 days, 1 week"
        placeholderTextColor={colors.textMuted}
        value={duration}
        onChangeText={setDuration}
      />
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContent}>
      <Card variant="gradient" style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultIcon}>🔍</Text>
          <Text style={styles.resultTitle}>Analysis Result</Text>
        </View>
        
        {result?.isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>Offline Analysis</Text>
          </View>
        )}

        <View style={styles.resultMeta}>
          <Text style={styles.resultMetaText}>Symptoms: {result?.symptoms}</Text>
          <Text style={styles.resultMetaText}>Severity: {result?.severity}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.analysisText}>{result?.analysis}</Text>
      </Card>

      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DoctorSearch')}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.actionBtnGradient}>
            <Text style={styles.actionBtnIcon}>👨‍⚕️</Text>
            <Text style={styles.actionBtnText}>Find a Doctor</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={resetChecker}>
          <Text style={styles.secondaryBtnText}>Check Again</Text>
        </TouchableOpacity>
      </View>

      <Card variant="default" style={styles.disclaimerCard}>
        <Text style={styles.disclaimerIcon}>⚠️</Text>
        <Text style={styles.disclaimerText}>
          This is not a medical diagnosis. Always consult a healthcare professional for proper evaluation and treatment.
        </Text>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Checker</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      {step < 4 && (
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderResult()}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing symptoms...</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      {step < 4 && !loading && (
        <View style={styles.navButtons}>
          {step > 1 && (
            <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.prevBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.nextBtn} 
            onPress={() => step === 3 ? analyzeSymptoms() : setStep(step + 1)}
          >
            <LinearGradient colors={colors.gradientPrimary} style={styles.nextBtnGradient}>
              <Text style={styles.nextBtnText}>{step === 3 ? 'Analyze' : 'Next'}</Text>
              <Text style={styles.nextBtnArrow}>{step === 3 ? '🔍' : '→'}</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface },
  progressDotActive: { backgroundColor: colors.primary, width: 24 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  stepContent: { flex: 1 },
  stepTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  stepSubtitle: { ...typography.bodyMedium, color: colors.textMuted, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  gridItem: { width: '22%', aspectRatio: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  gridItemActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  gridIcon: { fontSize: 24, marginBottom: spacing.xs },
  gridLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center' },
  gridLabelActive: { color: colors.primary },
  inputLabel: { ...typography.labelMedium, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  textInput: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, ...typography.bodyMedium, color: colors.textPrimary, borderWidth: 1, borderColor: colors.surfaceBorder, minHeight: 48 },
  severityContainer: { gap: spacing.md, marginBottom: spacing.xl },
  severityCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  severityDot: { width: 16, height: 16, borderRadius: 8, marginRight: spacing.md },
  severityLabel: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  severityDesc: { ...typography.labelSmall, color: colors.textMuted },
  resultCard: { padding: spacing.xl, marginBottom: spacing.lg },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  resultIcon: { fontSize: 28, marginRight: spacing.md },
  resultTitle: { ...typography.headlineSmall, color: colors.textPrimary },
  offlineBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginBottom: spacing.md },
  offlineBadgeText: { ...typography.labelSmall, color: colors.warning },
  resultMeta: { marginBottom: spacing.md },
  resultMetaText: { ...typography.labelSmall, color: colors.textMuted, marginBottom: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  analysisText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 24 },
  resultActions: { gap: spacing.md, marginBottom: spacing.lg },
  actionBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  actionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  actionBtnIcon: { fontSize: 20, marginRight: spacing.sm },
  actionBtnText: { ...typography.button, color: colors.textInverse },
  secondaryBtn: { backgroundColor: colors.surface, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  secondaryBtnText: { ...typography.button, color: colors.textSecondary },
  disclaimerCard: { padding: spacing.lg, flexDirection: 'row', alignItems: 'flex-start' },
  disclaimerIcon: { fontSize: 20, marginRight: spacing.md },
  disclaimerText: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  loadingOverlay: { alignItems: 'center', paddingVertical: spacing.xxl },
  loadingText: { ...typography.bodyMedium, color: colors.textMuted, marginTop: spacing.md },
  navButtons: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: spacing.xl, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  prevBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  prevBtnText: { ...typography.button, color: colors.textSecondary },
  nextBtn: { flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden', marginLeft: spacing.md },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  nextBtnText: { ...typography.button, color: colors.textInverse, marginRight: spacing.sm },
  nextBtnArrow: { fontSize: 16, color: colors.textInverse },
});

export default SymptomCheckerScreen;
