/**
 * FHIR (Fast Healthcare Interoperability Resources) Service
 * HL7 FHIR R4 compliant data transformation
 */

class FHIRService {
  
  constructor() {
    this.fhirVersion = 'R4';
    this.baseUrl = process.env.FHIR_BASE_URL || 'http://localhost:5000/fhir';
  }
  
  // Convert internal patient to FHIR Patient resource
  toFHIRPatient(patient) {
    return {
      resourceType: 'Patient',
      id: patient._id?.toString(),
      meta: {
        versionId: '1',
        lastUpdated: patient.updatedAt || new Date().toISOString()
      },
      identifier: [
        {
          system: 'urn:healthsync:mrn',
          value: patient.mrn || patient._id?.toString()
        },
        ...(patient.aadhaar ? [{
          system: 'urn:india:aadhaar',
          value: patient.aadhaar
        }] : [])
      ],
      active: true,
      name: [{
        use: 'official',
        family: patient.name?.split(' ').slice(-1)[0] || '',
        given: patient.name?.split(' ').slice(0, -1) || [patient.name]
      }],
      telecom: [
        ...(patient.phone ? [{
          system: 'phone',
          value: patient.phone,
          use: 'mobile'
        }] : []),
        ...(patient.email ? [{
          system: 'email',
          value: patient.email
        }] : [])
      ],
      gender: this.mapGender(patient.gender),
      birthDate: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined,
      address: patient.address ? [{
        use: 'home',
        text: patient.address,
        city: patient.city,
        state: patient.state,
        postalCode: patient.pincode,
        country: 'IN'
      }] : [],
      contact: patient.emergencyContact ? [{
        relationship: [{ text: patient.emergencyContact.relationship || 'Emergency Contact' }],
        name: { text: patient.emergencyContact.name },
        telecom: [{ system: 'phone', value: patient.emergencyContact.phone }]
      }] : []
    };
  }
  
  // Convert FHIR Patient to internal format
  fromFHIRPatient(fhirPatient) {
    const name = fhirPatient.name?.[0];
    const phone = fhirPatient.telecom?.find(t => t.system === 'phone');
    const email = fhirPatient.telecom?.find(t => t.system === 'email');
    const address = fhirPatient.address?.[0];
    
    return {
      name: name ? [...(name.given || []), name.family].filter(Boolean).join(' ') : '',
      gender: this.unmapGender(fhirPatient.gender),
      dateOfBirth: fhirPatient.birthDate,
      phone: phone?.value,
      email: email?.value,
      address: address?.text,
      city: address?.city,
      state: address?.state,
      pincode: address?.postalCode
    };
  }
  
  // Convert internal observation/vitals to FHIR Observation
  toFHIRObservation(observation, patientId) {
    const loincCodes = {
      bloodPressureSystolic: { code: '8480-6', display: 'Systolic blood pressure' },
      bloodPressureDiastolic: { code: '8462-4', display: 'Diastolic blood pressure' },
      heartRate: { code: '8867-4', display: 'Heart rate' },
      temperature: { code: '8310-5', display: 'Body temperature' },
      respiratoryRate: { code: '9279-1', display: 'Respiratory rate' },
      oxygenSaturation: { code: '2708-6', display: 'Oxygen saturation' },
      weight: { code: '29463-7', display: 'Body weight' },
      height: { code: '8302-2', display: 'Body height' },
      bmi: { code: '39156-5', display: 'Body mass index' }
    };
    
    const loinc = loincCodes[observation.type] || { code: 'unknown', display: observation.type };
    
    return {
      resourceType: 'Observation',
      id: observation._id?.toString(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: loinc.code,
          display: loinc.display
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: observation.recordedAt || new Date().toISOString(),
      valueQuantity: {
        value: observation.value,
        unit: observation.unit,
        system: 'http://unitsofmeasure.org'
      }
    };
  }
  
  // Convert internal condition/diagnosis to FHIR Condition
  toFHIRCondition(condition, patientId) {
    return {
      resourceType: 'Condition',
      id: condition._id?.toString(),
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: condition.status || 'active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'encounter-diagnosis',
          display: 'Encounter Diagnosis'
        }]
      }],
      code: {
        coding: [
          ...(condition.icdCode ? [{
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: condition.icdCode,
            display: condition.diagnosis
          }] : []),
          ...(condition.snomedCode ? [{
            system: 'http://snomed.info/sct',
            code: condition.snomedCode
          }] : [])
        ],
        text: condition.diagnosis
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      onsetDateTime: condition.onsetDate,
      recordedDate: condition.recordedAt || new Date().toISOString(),
      note: condition.notes ? [{ text: condition.notes }] : []
    };
  }
  
  // Convert internal medication to FHIR MedicationRequest
  toFHIRMedicationRequest(prescription, patientId, practitionerId) {
    return {
      resourceType: 'MedicationRequest',
      id: prescription._id?.toString(),
      status: prescription.status || 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: prescription.rxcui ? [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: prescription.rxcui,
          display: prescription.medicationName
        }] : [],
        text: prescription.medicationName
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      requester: practitionerId ? {
        reference: `Practitioner/${practitionerId}`
      } : undefined,
      authoredOn: prescription.prescribedAt || new Date().toISOString(),
      dosageInstruction: [{
        text: `${prescription.dosage} ${prescription.frequency}`,
        timing: {
          code: {
            text: prescription.frequency
          }
        },
        doseAndRate: [{
          doseQuantity: {
            value: parseFloat(prescription.dosage) || 1,
            unit: prescription.dosageUnit || 'tablet'
          }
        }]
      }],
      dispenseRequest: {
        numberOfRepeatsAllowed: prescription.refills || 0,
        quantity: {
          value: prescription.quantity || 30,
          unit: prescription.dosageUnit || 'tablet'
        },
        expectedSupplyDuration: {
          value: prescription.duration || 30,
          unit: 'd'
        }
      },
      note: prescription.instructions ? [{ text: prescription.instructions }] : []
    };
  }
  
  // Convert internal encounter/visit to FHIR Encounter
  toFHIREncounter(visit, patientId, practitionerId) {
    return {
      resourceType: 'Encounter',
      id: visit._id?.toString(),
      status: this.mapEncounterStatus(visit.status),
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: visit.visitType === 'telemedicine' ? 'VR' : 'AMB',
        display: visit.visitType === 'telemedicine' ? 'Virtual' : 'Ambulatory'
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '390906007',
          display: 'Follow-up encounter'
        }],
        text: visit.visitType || 'Office Visit'
      }],
      subject: {
        reference: `Patient/${patientId}`
      },
      participant: practitionerId ? [{
        individual: {
          reference: `Practitioner/${practitionerId}`
        }
      }] : [],
      period: {
        start: visit.visitDate || visit.createdAt,
        end: visit.endTime
      },
      reasonCode: visit.chiefComplaint ? [{
        text: visit.chiefComplaint
      }] : [],
      diagnosis: visit.diagnosis ? [{
        condition: {
          display: visit.diagnosis
        }
      }] : []
    };
  }
  
  // Convert internal practitioner/doctor to FHIR Practitioner
  toFHIRPractitioner(doctor) {
    return {
      resourceType: 'Practitioner',
      id: doctor._id?.toString(),
      identifier: [
        ...(doctor.registrationNumber ? [{
          system: 'urn:india:mci',
          value: doctor.registrationNumber
        }] : [])
      ],
      active: doctor.isActive !== false,
      name: [{
        use: 'official',
        prefix: ['Dr.'],
        family: doctor.name?.split(' ').slice(-1)[0] || '',
        given: doctor.name?.split(' ').slice(0, -1) || [doctor.name]
      }],
      telecom: [
        ...(doctor.phone ? [{
          system: 'phone',
          value: doctor.phone
        }] : []),
        ...(doctor.email ? [{
          system: 'email',
          value: doctor.email
        }] : [])
      ],
      qualification: [{
        code: {
          text: doctor.qualification || doctor.specialization
        }
      }]
    };
  }
  
  // Convert internal lab result to FHIR DiagnosticReport
  toFHIRDiagnosticReport(labReport, patientId) {
    return {
      resourceType: 'DiagnosticReport',
      id: labReport._id?.toString(),
      status: labReport.status || 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'LAB',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: labReport.loincCode ? [{
          system: 'http://loinc.org',
          code: labReport.loincCode,
          display: labReport.testName
        }] : [],
        text: labReport.testName
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: labReport.collectedAt,
      issued: labReport.reportedAt || new Date().toISOString(),
      result: labReport.results?.map((r, i) => ({
        reference: `#obs-${i}`,
        display: `${r.name}: ${r.value} ${r.unit}`
      })),
      conclusion: labReport.interpretation
    };
  }
  
  // Create FHIR Bundle
  createBundle(resources, type = 'collection') {
    return {
      resourceType: 'Bundle',
      type,
      timestamp: new Date().toISOString(),
      total: resources.length,
      entry: resources.map(resource => ({
        fullUrl: `${this.baseUrl}/${resource.resourceType}/${resource.id}`,
        resource
      }))
    };
  }
  
  // Create patient summary bundle (IPS - International Patient Summary)
  async createPatientSummary(patientId) {
    const EMRPatient = require('../models/EMRPatient');
    const EMRVisit = require('../models/EMRVisit');
    const Prescription = require('../models/Prescription');
    
    const patient = await EMRPatient.findById(patientId).lean();
    if (!patient) throw new Error('Patient not found');
    
    const visits = await EMRVisit.find({ patientId }).sort({ visitDate: -1 }).limit(10).lean();
    const prescriptions = await Prescription.find({ patientId, status: 'active' }).lean();
    
    const resources = [
      this.toFHIRPatient(patient),
      ...visits.map(v => this.toFHIREncounter(v, patientId, v.doctorId)),
      ...prescriptions.map(p => this.toFHIRMedicationRequest(p, patientId, p.prescriberId))
    ];
    
    // Add conditions from visits
    visits.forEach(v => {
      if (v.diagnosis) {
        resources.push(this.toFHIRCondition({
          diagnosis: v.diagnosis,
          icdCode: v.icdCode,
          recordedAt: v.visitDate
        }, patientId));
      }
    });
    
    return {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: new Date().toISOString(),
      identifier: {
        system: 'urn:healthsync:ips',
        value: `ips-${patientId}-${Date.now()}`
      },
      entry: [
        {
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: {
              coding: [{
                system: 'http://loinc.org',
                code: '60591-5',
                display: 'Patient summary Document'
              }]
            },
            subject: { reference: `Patient/${patientId}` },
            date: new Date().toISOString(),
            title: 'International Patient Summary',
            section: [
              { title: 'Medications', code: { text: 'Medications' } },
              { title: 'Problems', code: { text: 'Problems' } },
              { title: 'History of Past Illness', code: { text: 'History' } }
            ]
          }
        },
        ...resources.map(r => ({
          fullUrl: `${this.baseUrl}/${r.resourceType}/${r.id}`,
          resource: r
        }))
      ]
    };
  }
  
  // Helper methods
  mapGender(gender) {
    const map = { male: 'male', female: 'female', other: 'other', 'Male': 'male', 'Female': 'female' };
    return map[gender] || 'unknown';
  }
  
  unmapGender(fhirGender) {
    const map = { male: 'Male', female: 'Female', other: 'Other' };
    return map[fhirGender] || 'Other';
  }
  
  mapEncounterStatus(status) {
    const map = {
      scheduled: 'planned',
      'in-progress': 'in-progress',
      completed: 'finished',
      cancelled: 'cancelled'
    };
    return map[status] || 'unknown';
  }
}

module.exports = new FHIRService();
