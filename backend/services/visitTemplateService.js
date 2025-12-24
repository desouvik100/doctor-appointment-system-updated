/**
 * Visit Templates Service
 * Pre-built templates for common conditions
 */

class VisitTemplateService {
  
  constructor() {
    this.templates = this.initializeTemplates();
  }
  
  initializeTemplates() {
    return {
      // Primary Care Templates
      'upper-respiratory-infection': {
        name: 'Upper Respiratory Infection',
        category: 'Primary Care',
        icdCodes: ['J06.9', 'J00'],
        chiefComplaint: 'Cough, runny nose, sore throat',
        hpiTemplate: 'Patient presents with {duration} history of upper respiratory symptoms including {symptoms}. Denies {negatives}.',
        symptoms: ['cough', 'nasal congestion', 'sore throat', 'low-grade fever', 'fatigue'],
        negatives: ['shortness of breath', 'chest pain', 'high fever'],
        physicalExam: {
          general: 'Alert, no acute distress',
          heent: 'Mild pharyngeal erythema, no exudates. TMs clear. Nasal mucosa edematous.',
          lungs: 'Clear to auscultation bilaterally',
          neck: 'No lymphadenopathy'
        },
        assessment: 'Acute upper respiratory infection, likely viral',
        plan: [
          'Supportive care with rest and hydration',
          'OTC analgesics for pain/fever (acetaminophen or ibuprofen)',
          'Saline nasal spray for congestion',
          'Return if symptoms worsen or persist >10 days'
        ],
        prescriptions: [
          { name: 'Acetaminophen 500mg', dosage: '1-2 tablets', frequency: 'every 6 hours as needed', duration: '5 days' }
        ]
      },
      
      'hypertension-followup': {
        name: 'Hypertension Follow-up',
        category: 'Chronic Disease',
        icdCodes: ['I10'],
        chiefComplaint: 'Blood pressure follow-up',
        hpiTemplate: 'Patient with known hypertension presents for routine follow-up. Current medications: {medications}. Reports {compliance} with medications.',
        vitalsRequired: ['bloodPressure', 'heartRate', 'weight'],
        physicalExam: {
          general: 'Well-appearing, no acute distress',
          cardiovascular: 'Regular rate and rhythm, no murmurs',
          extremities: 'No edema'
        },
        assessment: 'Essential hypertension - {control_status}',
        plan: [
          'Continue current antihypertensive regimen',
          'Lifestyle modifications: low sodium diet, regular exercise',
          'Home BP monitoring',
          'Follow-up in 3 months',
          'Labs: BMP, lipid panel if due'
        ]
      },
      
      'diabetes-followup': {
        name: 'Diabetes Type 2 Follow-up',
        category: 'Chronic Disease',
        icdCodes: ['E11.9'],
        chiefComplaint: 'Diabetes follow-up',
        hpiTemplate: 'Patient with Type 2 DM presents for routine follow-up. Last HbA1c: {last_a1c}. Current medications: {medications}.',
        vitalsRequired: ['bloodPressure', 'weight', 'bloodGlucose'],
        physicalExam: {
          general: 'Well-appearing',
          cardiovascular: 'Regular rate and rhythm',
          extremities: 'No edema, pulses intact, sensation intact to monofilament',
          skin: 'No ulcers or lesions'
        },
        assessment: 'Type 2 diabetes mellitus - {control_status}',
        plan: [
          'Continue current diabetes regimen',
          'Diet and exercise counseling',
          'HbA1c today if >3 months since last',
          'Annual: eye exam, foot exam, urine microalbumin',
          'Follow-up in 3 months'
        ],
        labsToOrder: ['HbA1c', 'BMP', 'Lipid Panel', 'Urine Microalbumin']
      },
      
      'acute-gastroenteritis': {
        name: 'Acute Gastroenteritis',
        category: 'Primary Care',
        icdCodes: ['K52.9', 'A09'],
        chiefComplaint: 'Nausea, vomiting, diarrhea',
        hpiTemplate: 'Patient presents with {duration} of GI symptoms including {symptoms}. Last oral intake: {intake}. Urine output: {urine}.',
        symptoms: ['nausea', 'vomiting', 'diarrhea', 'abdominal cramps', 'low-grade fever'],
        physicalExam: {
          general: 'Mild distress, {hydration_status}',
          abdomen: 'Soft, diffuse tenderness, hyperactive bowel sounds, no rebound/guarding',
          skin: 'Skin turgor {turgor}'
        },
        assessment: 'Acute gastroenteritis, likely viral',
        plan: [
          'Oral rehydration with clear fluids',
          'BRAT diet when tolerating',
          'Antiemetic if needed',
          'Return if unable to keep fluids down, bloody stool, or high fever'
        ],
        prescriptions: [
          { name: 'Ondansetron 4mg ODT', dosage: '1 tablet', frequency: 'every 8 hours as needed', duration: '3 days' }
        ]
      },
      
      'low-back-pain': {
        name: 'Acute Low Back Pain',
        category: 'Musculoskeletal',
        icdCodes: ['M54.5'],
        chiefComplaint: 'Low back pain',
        hpiTemplate: 'Patient presents with {duration} of low back pain. Onset: {onset}. Location: {location}. Radiation: {radiation}. Red flags: {red_flags}.',
        redFlags: ['bowel/bladder dysfunction', 'saddle anesthesia', 'progressive weakness', 'fever', 'weight loss', 'trauma'],
        physicalExam: {
          musculoskeletal: 'Paravertebral tenderness, limited ROM, no midline tenderness',
          neurological: 'Strength 5/5 bilateral LE, sensation intact, reflexes symmetric, negative SLR'
        },
        assessment: 'Acute mechanical low back pain without red flags',
        plan: [
          'NSAIDs for pain/inflammation',
          'Muscle relaxant if significant spasm',
          'Activity as tolerated, avoid bed rest',
          'Heat/ice for comfort',
          'Physical therapy if not improving in 2-4 weeks',
          'Return if red flag symptoms develop'
        ],
        prescriptions: [
          { name: 'Ibuprofen 600mg', dosage: '1 tablet', frequency: 'three times daily with food', duration: '7 days' },
          { name: 'Cyclobenzaprine 10mg', dosage: '1 tablet', frequency: 'at bedtime', duration: '5 days' }
        ]
      },
      
      'anxiety-disorder': {
        name: 'Generalized Anxiety Disorder',
        category: 'Mental Health',
        icdCodes: ['F41.1'],
        chiefComplaint: 'Anxiety, worry',
        hpiTemplate: 'Patient presents with {duration} of anxiety symptoms. GAD-7 score: {gad7}. PHQ-9 score: {phq9}. Sleep: {sleep}. Stressors: {stressors}.',
        screeningTools: ['GAD-7', 'PHQ-9'],
        physicalExam: {
          general: 'Anxious appearing but cooperative',
          psychiatric: 'Alert, oriented, {mood}, {affect}, no SI/HI, judgment intact'
        },
        assessment: 'Generalized anxiety disorder - {severity}',
        plan: [
          'Discuss treatment options: therapy, medication, or both',
          'Refer to therapy/counseling',
          'Consider SSRI if moderate-severe',
          'Sleep hygiene education',
          'Stress management techniques',
          'Follow-up in 2-4 weeks'
        ]
      },
      
      'well-child-visit': {
        name: 'Well Child Visit',
        category: 'Pediatrics',
        icdCodes: ['Z00.129'],
        chiefComplaint: 'Well child check',
        hpiTemplate: 'Patient presents for {age} well child visit. Development: {development}. Diet: {diet}. Sleep: {sleep}. Concerns: {concerns}.',
        vitalsRequired: ['weight', 'height', 'headCircumference', 'bloodPressure'],
        physicalExam: {
          general: 'Well-appearing, appropriate for age',
          heent: 'Normocephalic, TMs clear, oropharynx normal',
          cardiovascular: 'Regular rate and rhythm, no murmurs',
          lungs: 'Clear bilaterally',
          abdomen: 'Soft, non-tender',
          musculoskeletal: 'Normal gait, no deformities',
          neurological: 'Age-appropriate development',
          skin: 'No rashes or lesions'
        },
        assessment: 'Well child, age-appropriate development',
        plan: [
          'Immunizations per schedule',
          'Anticipatory guidance provided',
          'Safety counseling',
          'Next well visit in {next_visit}'
        ]
      },
      
      'prenatal-visit': {
        name: 'Routine Prenatal Visit',
        category: 'OB/GYN',
        icdCodes: ['Z34.90'],
        chiefComplaint: 'Prenatal visit',
        hpiTemplate: 'G{gravida}P{para} at {weeks} weeks gestation. LMP: {lmp}. EDD: {edd}. Fetal movement: {movement}. Concerns: {concerns}.',
        vitalsRequired: ['bloodPressure', 'weight', 'fundalHeight', 'fetalHeartRate'],
        physicalExam: {
          general: 'Well-appearing pregnant female',
          cardiovascular: 'Regular rate and rhythm',
          abdomen: 'Gravid, fundal height {fh} cm, FHT {fht} bpm',
          extremities: 'Trace/no edema'
        },
        assessment: 'Intrauterine pregnancy at {weeks} weeks - uncomplicated',
        plan: [
          'Continue prenatal vitamins',
          'Labs as indicated for gestational age',
          'Discuss warning signs',
          'Next visit in {next_visit}'
        ]
      }
    };
  }
  
  // Get all templates
  getAllTemplates() {
    return Object.entries(this.templates).map(([id, template]) => ({
      id,
      name: template.name,
      category: template.category,
      icdCodes: template.icdCodes
    }));
  }
  
  // Get templates by category
  getTemplatesByCategory(category) {
    return Object.entries(this.templates)
      .filter(([_, t]) => t.category === category)
      .map(([id, template]) => ({ id, ...template }));
  }
  
  // Get single template
  getTemplate(templateId) {
    const template = this.templates[templateId];
    if (!template) return null;
    return { id: templateId, ...template };
  }
  
  // Apply template to visit with patient data
  applyTemplate(templateId, patientData = {}) {
    const template = this.templates[templateId];
    if (!template) throw new Error('Template not found');
    
    // Replace placeholders in HPI
    let hpi = template.hpiTemplate;
    Object.entries(patientData).forEach(([key, value]) => {
      hpi = hpi.replace(`{${key}}`, value || `[${key}]`);
    });
    
    return {
      ...template,
      hpiTemplate: hpi,
      appliedAt: new Date(),
      patientData
    };
  }
  
  // Get categories
  getCategories() {
    const categories = new Set();
    Object.values(this.templates).forEach(t => categories.add(t.category));
    return Array.from(categories);
  }
}

module.exports = new VisitTemplateService();
