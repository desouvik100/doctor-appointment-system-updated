/**
 * Clinical Protocols / Care Pathways Service
 * Evidence-based clinical decision support
 */

class ClinicalProtocolService {
  
  constructor() {
    this.protocols = this.initializeProtocols();
  }
  
  initializeProtocols() {
    return {
      'sepsis-screening': {
        name: 'Sepsis Screening Protocol',
        category: 'Emergency',
        triggers: ['fever', 'tachycardia', 'hypotension', 'altered mental status'],
        steps: [
          {
            order: 1,
            name: 'SIRS Criteria Assessment',
            description: 'Check for ≥2 SIRS criteria',
            criteria: [
              'Temperature >38°C or <36°C',
              'Heart rate >90 bpm',
              'Respiratory rate >20 or PaCO2 <32',
              'WBC >12,000 or <4,000 or >10% bands'
            ],
            action: 'If ≥2 criteria met, proceed to step 2'
          },
          {
            order: 2,
            name: 'Infection Source Assessment',
            description: 'Identify suspected infection source',
            actions: [
              'Blood cultures x2 (before antibiotics)',
              'Urinalysis and urine culture',
              'Chest X-ray if respiratory symptoms',
              'Other cultures as indicated'
            ]
          },
          {
            order: 3,
            name: 'Lactate Level',
            description: 'Check serum lactate',
            interpretation: {
              '<2 mmol/L': 'Low risk',
              '2-4 mmol/L': 'Intermediate risk - close monitoring',
              '>4 mmol/L': 'High risk - aggressive resuscitation'
            }
          },
          {
            order: 4,
            name: 'Fluid Resuscitation',
            description: 'If hypotensive or lactate ≥4',
            action: '30 mL/kg crystalloid within 3 hours',
            reassess: 'Reassess volume status and perfusion'
          },
          {
            order: 5,
            name: 'Antibiotic Administration',
            description: 'Broad-spectrum antibiotics within 1 hour',
            note: 'Do not delay for cultures if patient unstable'
          }
        ],
        references: ['Surviving Sepsis Campaign 2021']
      },
      
      'chest-pain-evaluation': {
        name: 'Chest Pain Evaluation Protocol',
        category: 'Cardiology',
        triggers: ['chest pain', 'chest discomfort', 'angina'],
        steps: [
          {
            order: 1,
            name: 'Initial Assessment',
            description: 'Rapid evaluation within 10 minutes',
            actions: [
              '12-lead ECG',
              'Vital signs',
              'Brief history: onset, character, radiation, associated symptoms',
              'Aspirin 325mg if no contraindication'
            ]
          },
          {
            order: 2,
            name: 'HEART Score Calculation',
            components: {
              history: { typical: 2, moderate: 1, atypical: 0 },
              ecg: { significant: 2, nonspecific: 1, normal: 0 },
              age: { '>65': 2, '45-65': 1, '<45': 0 },
              riskFactors: { '≥3': 2, '1-2': 1, '0': 0 },
              troponin: { '>3x': 2, '1-3x': 1, 'normal': 0 }
            },
            interpretation: {
              '0-3': 'Low risk - consider discharge with follow-up',
              '4-6': 'Moderate risk - observation, serial troponins',
              '7-10': 'High risk - admission, cardiology consult'
            }
          },
          {
            order: 3,
            name: 'Troponin Testing',
            description: 'High-sensitivity troponin at 0 and 3 hours',
            action: 'If elevated or rising, activate ACS protocol'
          },
          {
            order: 4,
            name: 'Risk Stratification',
            description: 'Based on HEART score and troponin results',
            pathways: {
              stemi: 'Activate cath lab, door-to-balloon <90 min',
              nstemi: 'Anticoagulation, cardiology consult, cath within 24-72h',
              unstableAngina: 'Admission, stress testing or cath',
              lowRisk: 'Outpatient stress testing within 72h'
            }
          }
        ],
        references: ['ACC/AHA Chest Pain Guidelines 2021']
      },
      
      'diabetic-ketoacidosis': {
        name: 'DKA Management Protocol',
        category: 'Endocrinology',
        triggers: ['hyperglycemia', 'ketosis', 'acidosis'],
        diagnosticCriteria: {
          glucose: '>250 mg/dL',
          pH: '<7.3',
          bicarbonate: '<18 mEq/L',
          ketones: 'Positive serum/urine'
        },
        steps: [
          {
            order: 1,
            name: 'Initial Fluid Resuscitation',
            description: 'NS 1-1.5L in first hour',
            subsequent: '250-500 mL/hr based on hydration status'
          },
          {
            order: 2,
            name: 'Potassium Assessment',
            description: 'Check K+ before insulin',
            action: {
              '<3.3': 'Hold insulin, give K+ 20-30 mEq/hr',
              '3.3-5.3': 'Add K+ 20-30 mEq to each liter of fluid',
              '>5.3': 'Check K+ every 2 hours, add when <5.3'
            }
          },
          {
            order: 3,
            name: 'Insulin Therapy',
            description: 'Regular insulin IV',
            bolus: '0.1 units/kg (optional)',
            infusion: '0.1 units/kg/hr',
            target: 'Glucose decrease 50-70 mg/dL/hr'
          },
          {
            order: 4,
            name: 'Glucose Monitoring',
            description: 'When glucose <200 mg/dL',
            action: 'Change to D5 1/2NS, reduce insulin to 0.02-0.05 units/kg/hr',
            goal: 'Maintain glucose 150-200 until gap closes'
          },
          {
            order: 5,
            name: 'Resolution Criteria',
            criteria: [
              'Glucose <200 mg/dL',
              'pH >7.3',
              'Bicarbonate ≥15 mEq/L',
              'Anion gap ≤12'
            ],
            transition: 'Overlap SC insulin 1-2 hours before stopping IV'
          }
        ],
        monitoring: {
          glucose: 'Every 1 hour',
          bmp: 'Every 2-4 hours',
          abg: 'Every 2-4 hours until stable'
        },
        references: ['ADA Standards of Care 2024']
      },
      
      'stroke-code': {
        name: 'Acute Stroke Protocol',
        category: 'Neurology',
        triggers: ['sudden weakness', 'facial droop', 'speech difficulty', 'vision loss'],
        timeTargets: {
          doorToPhysician: '10 minutes',
          doorToCT: '25 minutes',
          doorToNeedle: '60 minutes',
          doorToGroin: '90 minutes'
        },
        steps: [
          {
            order: 1,
            name: 'Stroke Alert Activation',
            actions: [
              'Notify stroke team',
              'Establish IV access',
              'Labs: CBC, BMP, coags, glucose, troponin',
              'NPO status'
            ]
          },
          {
            order: 2,
            name: 'NIHSS Assessment',
            description: 'Standardized neurological exam',
            components: ['consciousness', 'gaze', 'visual fields', 'facial palsy', 'motor arm/leg', 'ataxia', 'sensory', 'language', 'dysarthria', 'extinction']
          },
          {
            order: 3,
            name: 'CT Head',
            description: 'Non-contrast CT within 25 minutes',
            evaluate: ['hemorrhage', 'early ischemic changes', 'ASPECTS score']
          },
          {
            order: 4,
            name: 'tPA Eligibility',
            window: '≤4.5 hours from last known well',
            contraindications: [
              'Active bleeding',
              'Recent surgery/trauma',
              'History of ICH',
              'BP >185/110 despite treatment',
              'INR >1.7 or platelets <100k'
            ],
            dose: '0.9 mg/kg (max 90mg), 10% bolus, 90% over 1 hour'
          },
          {
            order: 5,
            name: 'Thrombectomy Evaluation',
            criteria: [
              'Large vessel occlusion on CTA',
              'NIHSS ≥6',
              'ASPECTS ≥6',
              '≤24 hours with favorable imaging'
            ],
            action: 'Transfer to thrombectomy-capable center if needed'
          }
        ],
        postTPA: {
          monitoring: 'Neuro checks every 15 min x 2h, then every 30 min x 6h',
          bpTarget: '<180/105 for 24 hours',
          noAnticoagulation: '24 hours post-tPA'
        },
        references: ['AHA/ASA Stroke Guidelines 2019']
      },
      
      'asthma-exacerbation': {
        name: 'Asthma Exacerbation Protocol',
        category: 'Pulmonology',
        triggers: ['wheezing', 'shortness of breath', 'asthma attack'],
        severityAssessment: {
          mild: { peakFlow: '>70%', o2Sat: '>95%', speech: 'sentences' },
          moderate: { peakFlow: '40-70%', o2Sat: '91-95%', speech: 'phrases' },
          severe: { peakFlow: '<40%', o2Sat: '<91%', speech: 'words', accessoryMuscles: true }
        },
        steps: [
          {
            order: 1,
            name: 'Initial Assessment',
            actions: [
              'Vital signs including O2 saturation',
              'Peak flow if able',
              'Brief history: triggers, home medications, prior intubations'
            ]
          },
          {
            order: 2,
            name: 'Oxygen Therapy',
            target: 'SpO2 ≥92%',
            method: 'Nasal cannula or mask as needed'
          },
          {
            order: 3,
            name: 'Bronchodilator Therapy',
            albuterol: '2.5-5mg nebulized every 20 min x 3, then hourly',
            ipratropium: '0.5mg nebulized with first 3 albuterol treatments',
            alternative: 'MDI with spacer: 4-8 puffs every 20 min'
          },
          {
            order: 4,
            name: 'Corticosteroids',
            description: 'Give early in all moderate-severe exacerbations',
            options: [
              'Prednisone 40-60mg PO',
              'Methylprednisolone 125mg IV if severe'
            ]
          },
          {
            order: 5,
            name: 'Reassessment',
            timing: '60-90 minutes after initial treatment',
            goodResponse: 'Peak flow >70%, symptoms improved - consider discharge',
            poorResponse: 'Continue treatments, consider magnesium, ICU if worsening'
          }
        ],
        discharge: {
          criteria: ['Peak flow >70%', 'Symptoms controlled', 'Able to use inhaler'],
          prescriptions: ['Albuterol MDI', 'Prednisone 40mg x 5 days'],
          followUp: 'PCP within 1 week'
        },
        references: ['GINA Guidelines 2023']
      }
    };
  }
  
  // Get all protocols
  getAllProtocols() {
    return Object.entries(this.protocols).map(([id, protocol]) => ({
      id,
      name: protocol.name,
      category: protocol.category,
      triggers: protocol.triggers
    }));
  }
  
  // Get protocol by ID
  getProtocol(protocolId) {
    const protocol = this.protocols[protocolId];
    if (!protocol) return null;
    return { id: protocolId, ...protocol };
  }
  
  // Get protocols by category
  getProtocolsByCategory(category) {
    return Object.entries(this.protocols)
      .filter(([_, p]) => p.category === category)
      .map(([id, protocol]) => ({ id, ...protocol }));
  }
  
  // Check if any protocol should be triggered based on patient data
  checkTriggers(patientData) {
    const triggered = [];
    const symptoms = (patientData.symptoms || []).map(s => s.toLowerCase());
    const vitals = patientData.vitals || {};
    
    Object.entries(this.protocols).forEach(([id, protocol]) => {
      const matchedTriggers = protocol.triggers.filter(trigger => 
        symptoms.some(s => s.includes(trigger.toLowerCase()))
      );
      
      if (matchedTriggers.length > 0) {
        triggered.push({
          protocolId: id,
          protocolName: protocol.name,
          matchedTriggers,
          priority: this.getPriority(protocol.category)
        });
      }
    });
    
    // Sort by priority
    return triggered.sort((a, b) => a.priority - b.priority);
  }
  
  getPriority(category) {
    const priorities = {
      'Emergency': 1,
      'Cardiology': 2,
      'Neurology': 2,
      'Pulmonology': 3,
      'Endocrinology': 3
    };
    return priorities[category] || 5;
  }
  
  // Get categories
  getCategories() {
    const categories = new Set();
    Object.values(this.protocols).forEach(p => categories.add(p.category));
    return Array.from(categories);
  }
}

module.exports = new ClinicalProtocolService();
