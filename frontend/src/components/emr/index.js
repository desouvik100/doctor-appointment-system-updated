/**
 * EMR Components Index
 * Export all EMR-related components
 */

// Navigation & UI
export { default as EMRSidebar } from './EMRSidebar';
export { default as LockedScreen } from './LockedScreen';
export { default as SubscriptionBadge } from './SubscriptionBadge';
export { default as EMRFooter } from './EMRFooter';

// Basic Plan Screens
export { default as PatientRegistration } from './PatientRegistration';
export { default as VisitHistory } from './VisitHistory';
export { default as SystematicHistoryEMR } from './SystematicHistoryEMR';
export { default as BasicPrescription } from './BasicPrescription';
export { default as UploadedReports } from './UploadedReports';

// Standard Plan Screens
export { default as DoctorNotes } from './DoctorNotes';
export { default as FollowUpScheduling } from './FollowUpScheduling';
export { default as MedicationHistory } from './MedicationHistory';
export { default as PatientTimeline } from './PatientTimeline';

// Advanced Plan Screens
export { default as EMRDashboard } from './EMRDashboard';
export { default as AnalyticsReports } from './AnalyticsReports';
export { default as AuditLogs } from './AuditLogs';
export { default as StaffManagement } from './StaffManagement';
export { default as DataExport } from './DataExport';

// Subscription Management Screens
export { default as SubscriptionPlans } from './SubscriptionPlans';
export { default as SubscriptionCheckout } from './SubscriptionCheckout';
export { default as SubscriptionStatus } from './SubscriptionStatus';

// Clinical Features
export { default as VitalsRecorder } from './VitalsRecorder';
export { default as VitalsTrends } from './VitalsTrends';
export { default as MedicalHistoryForm } from './MedicalHistoryForm';
export { default as MedicalHistorySummary, AllergyBadge, ConditionBadge, MedicationBadge, CriticalAlertsBanner } from './MedicalHistorySummary';
export { default as LabOrderForm } from './LabOrderForm';
export { default as LabOrderTracker } from './LabOrderTracker';
export { default as LabRequisitionPrint } from './LabRequisitionPrint';
export { default as DiagnosisCoder } from './DiagnosisCoder';
export { default as DiagnosisList } from './DiagnosisList';
export { default as DiagnosisPrompt, useDiagnosisPrompt } from './DiagnosisPrompt';
export { default as DrugInteractionChecker } from './DrugInteractionChecker';
export { default as RxNormDrugSearch } from './RxNormDrugSearch';
export { default as DocumentGenerator, LabRequisitionButton, ClinicalSummaryButton, DischargeSummaryButton, ReferralLetterButton } from './DocumentGenerator';
export { default as SmartAlertPanel } from './SmartAlertPanel';
export { default as EPrescribeForm } from './EPrescribeForm';
export { default as AllergyAlert, AllergyAlertBanner, AllergyAlertList } from './AllergyAlert';
export { default as InteractionOverrideModal } from './InteractionOverrideModal';

// WhatsApp Integration
export { default as WhatsAppIntegration, WhatsAppQuickButton, WhatsAppBulkSend } from './WhatsAppIntegration';
export { default as WhatsAppPanel } from './WhatsAppPanel';

// Voice Input
export { default as VoiceInput, VoiceTextArea, useVoiceInput } from './VoiceInput';

// Hospital EMR Features
export { default as PharmacySection } from './PharmacySection';
export { default as BillingSection } from './BillingSection';
export { default as StaffScheduleSection } from './StaffScheduleSection';
export { default as ClinicAnalyticsSection } from './ClinicAnalyticsSection';
export { default as AdvancedQueueSection } from './AdvancedQueueSection';
export { default as IPDSection } from './IPDSection';
export { default as AuditLogSection } from './AuditLogSection';
export { default as BedManagementSection } from './BedManagementSection';

// Feature Gating
export { default as LockedFeature, useFeatureAccess, withFeatureAccess } from './LockedFeature';
export { 
  EMR_FEATURES, 
  isFeatureAvailable, 
  getFeaturesForPlan, 
  getLockedFeatures,
  getRequiredPlanForFeature,
  PLAN_HIERARCHY,
  PLAN_NAMES,
  PLAN_PRICING
} from './featureFlags';
