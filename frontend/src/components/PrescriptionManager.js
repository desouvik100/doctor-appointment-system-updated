// frontend/src/components/PrescriptionManager.js
// Digital Prescription System for Doctors
import { useState, useEffect } from 'react';
import './PrescriptionManager.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const PrescriptionManager = ({ appointment, doctor, onClose, onSave }) => {
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    symptoms: [],
    medicines: [],
    labTests: [],
    advice: '',
    dietaryInstructions: '',
    followUpDate: '',
    followUpInstructions: '',
    vitals: {
      bloodPressure: '',
      pulse: '',
      temperature: '',
      weight: '',
      height: '',
      spo2: '',
      bloodSugar: ''
    },
    allergies: []
  });
  
  const [newSymptom, setNewSymptom] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [loading, setSaving] = useState(false);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    duration: '7 days',
    timing: 'after_food',
    instructions: '',
    quantity: 1
  });
  const [newLabTest, setNewLabTest] = useState({ name: '', instructions: '', urgent: false });

  // Common medicines for quick add
  const commonMedicines = [
    { name: 'Paracetamol 500mg', dosage: '1 tablet' },
    { name: 'Azithromycin 500mg', dosage: '1 tablet' },
    { name: 'Cetirizine 10mg', dosage: '1 tablet' },
    { name: 'Omeprazole 20mg', dosage: '1 capsule' },
    { name: 'Amoxicillin 500mg', dosage: '1 capsule' },
    { name: 'Ibuprofen 400mg', dosage: '1 tablet' },
    { name: 'Metformin 500mg', dosage: '1 tablet' },
    { name: 'Vitamin D3 60000IU', dosage: '1 sachet' }
  ];

  const frequencies = [
    'Once daily', 'Twice daily', 'Thrice daily', 'Four times daily',
    'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed'
  ];

  const durations = [
    '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '30 days', 'Continue'
  ];

  const timings = [
    { value: 'before_food', label: 'Before Food' },
    { value: 'after_food', label: 'After Food' },
    { value: 'with_food', label: 'With Food' },
    { value: 'empty_stomach', label: 'Empty Stomach' },
    { value: 'bedtime', label: 'At Bedtime' },
    { value: 'as_needed', label: 'As Needed' }
  ];

  const commonLabTests = [
    'Complete Blood Count (CBC)', 'Blood Sugar (Fasting)', 'Blood Sugar (PP)',
    'HbA1c', 'Lipid Profile', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)',
    'Thyroid Profile (T3, T4, TSH)', 'Urine Routine', 'Chest X-Ray', 'ECG'
  ];

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setPrescription(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, newSymptom.trim()]
      }));
      setNewSymptom('');
    }
  };

  const removeSymptom = (index) => {
    setPrescription(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setPrescription(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const addMedicine = () => {
    if (newMedicine.name && newMedicine.dosage) {
      setPrescription(prev => ({
        ...prev,
        medicines: [...prev.medicines, { ...newMedicine }]
      }));
      setNewMedicine({
        name: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '7 days',
        timing: 'after_food',
        instructions: '',
        quantity: 1
      });
      setShowMedicineForm(false);
    }
  };

  const removeMedicine = (index) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const addLabTest = () => {
    if (newLabTest.name) {
      setPrescription(prev => ({
        ...prev,
        labTests: [...prev.labTests, { ...newLabTest }]
      }));
      setNewLabTest({ name: '', instructions: '', urgent: false });
    }
  };

  const removeLabTest = (index) => {
    setPrescription(prev => ({
      ...prev,
      labTests: prev.labTests.filter((_, i) => i !== index)
    }));
  };

  const quickAddMedicine = (med) => {
    setNewMedicine(prev => ({
      ...prev,
      name: med.name,
      dosage: med.dosage
    }));
    setShowMedicineForm(true);
  };

  const handleSave = async (finalize = false) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/prescriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment._id,
          patientId: appointment.userId?._id || appointment.userId,
          doctorId: doctor._id,
          ...prescription
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (finalize) {
          await fetch(`${API_URL}/api/prescriptions/${data.prescription._id}/finalize`, {
            method: 'POST'
          });
        }
        onSave && onSave(data.prescription);
        onClose && onClose();
      } else {
        alert(data.message || 'Failed to save prescription');
      }
    } catch (error) {
      console.error('Save prescription error:', error);
      alert('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prescription-manager">
      <div className="prescription-manager__header">
        <h2><i className="fas fa-file-prescription"></i> Digital Prescription</h2>
        <button className="prescription-manager__close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="prescription-manager__patient-info">
        <div className="patient-info__item">
          <span className="label">Patient:</span>
          <span className="value">{appointment?.userId?.name || 'N/A'}</span>
        </div>
        <div className="patient-info__item">
          <span className="label">Date:</span>
          <span className="value">{new Date().toLocaleDateString('en-IN')}</span>
        </div>
        <div className="patient-info__item">
          <span className="label">Appointment:</span>
          <span className="value">{appointment?.reason || 'Consultation'}</span>
        </div>
      </div>

      <div className="prescription-manager__content">
        {/* Vitals Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-heartbeat"></i> Vitals</h3>
          <div className="vitals-grid">
            <div className="vital-input">
              <label>Blood Pressure</label>
              <input
                type="text"
                placeholder="120/80 mmHg"
                value={prescription.vitals.bloodPressure}
                onChange={(e) => setPrescription(prev => ({
                  ...prev,
                  vitals: { ...prev.vitals, bloodPressure: e.target.value }
                }))}
              />
            </div>
            <div className="vital-input">
              <label>Pulse</label>
              <input
                type="text"
                placeholder="72 bpm"
                value={prescription.vitals.pulse}
                onChange={(e) => setPrescription(prev => ({
                  ...prev,
                  vitals: { ...prev.vitals, pulse: e.target.value }
                }))}
              />
            </div>
            <div className="vital-input">
              <label>Temperature</label>
              <input
                type="text"
                placeholder="98.6°F"
                value={prescription.vitals.temperature}
                onChange={(e) => setPrescription(prev => ({
                  ...prev,
                  vitals: { ...prev.vitals, temperature: e.target.value }
                }))}
              />
            </div>
            <div className="vital-input">
              <label>SpO2</label>
              <input
                type="text"
                placeholder="98%"
                value={prescription.vitals.spo2}
                onChange={(e) => setPrescription(prev => ({
                  ...prev,
                  vitals: { ...prev.vitals, spo2: e.target.value }
                }))}
              />
            </div>
            <div className="vital-input">
              <label>Weight</label>
              <input
                type="text"
                placeholder="70 kg"
                value={prescription.vitals.weight}
                onChange={(e) => setPrescription(prev => ({
                  ...prev,
                  vitals: { ...prev.vitals, weight: e.target.value }
                }))}
              />
            </div>
            <div className="vital-input">
              <label>Blood Sugar</label>
              <input
                type="text"
                placeholder="100 mg/dL"
                value={prescription.vitals.bloodSugar}
                onChange={(e) => setPrescription(prev => ({
                  ...prev,
                  vitals: { ...prev.vitals, bloodSugar: e.target.value }
                }))}
              />
            </div>
          </div>
        </section>

        {/* Symptoms Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-notes-medical"></i> Symptoms</h3>
          <div className="tags-input">
            <div className="tags-list">
              {prescription.symptoms.map((symptom, index) => (
                <span key={index} className="tag">
                  {symptom}
                  <button onClick={() => removeSymptom(index)}><i className="fas fa-times"></i></button>
                </span>
              ))}
            </div>
            <div className="tag-add">
              <input
                type="text"
                placeholder="Add symptom..."
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              />
              <button onClick={addSymptom}><i className="fas fa-plus"></i></button>
            </div>
          </div>
        </section>

        {/* Diagnosis Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-stethoscope"></i> Diagnosis</h3>
          <textarea
            placeholder="Enter diagnosis..."
            value={prescription.diagnosis}
            onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
            rows={3}
          />
        </section>

        {/* Allergies Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-allergies"></i> Known Allergies</h3>
          <div className="tags-input">
            <div className="tags-list">
              {prescription.allergies.map((allergy, index) => (
                <span key={index} className="tag tag--warning">
                  {allergy}
                  <button onClick={() => setPrescription(prev => ({
                    ...prev,
                    allergies: prev.allergies.filter((_, i) => i !== index)
                  }))}><i className="fas fa-times"></i></button>
                </span>
              ))}
            </div>
            <div className="tag-add">
              <input
                type="text"
                placeholder="Add allergy..."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
              />
              <button onClick={addAllergy}><i className="fas fa-plus"></i></button>
            </div>
          </div>
        </section>

        {/* Medicines Section */}
        <section className="prescription-section prescription-section--medicines">
          <h3><i className="fas fa-pills"></i> Medicines</h3>
          
          {/* Quick Add */}
          <div className="quick-add">
            <span className="quick-add__label">Quick Add:</span>
            <div className="quick-add__buttons">
              {commonMedicines.slice(0, 4).map((med, index) => (
                <button key={index} onClick={() => quickAddMedicine(med)}>
                  {med.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine List */}
          <div className="medicines-list">
            {prescription.medicines.map((med, index) => (
              <div key={index} className="medicine-item">
                <div className="medicine-item__header">
                  <span className="medicine-item__number">{index + 1}</span>
                  <span className="medicine-item__name">{med.name}</span>
                  <button className="medicine-item__remove" onClick={() => removeMedicine(index)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <div className="medicine-item__details">
                  <span><i className="fas fa-prescription-bottle"></i> {med.dosage}</span>
                  <span><i className="fas fa-clock"></i> {med.frequency}</span>
                  <span><i className="fas fa-calendar"></i> {med.duration}</span>
                  <span><i className="fas fa-utensils"></i> {timings.find(t => t.value === med.timing)?.label}</span>
                </div>
                {med.instructions && (
                  <div className="medicine-item__instructions">
                    <i className="fas fa-info-circle"></i> {med.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Medicine Form */}
          {showMedicineForm ? (
            <div className="medicine-form">
              <div className="medicine-form__row">
                <input
                  type="text"
                  placeholder="Medicine name"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 1 tablet)"
                  value={newMedicine.dosage}
                  onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                />
              </div>
              <div className="medicine-form__row">
                <select
                  value={newMedicine.frequency}
                  onChange={(e) => setNewMedicine(prev => ({ ...prev, frequency: e.target.value }))}
                >
                  {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  value={newMedicine.duration}
                  onChange={(e) => setNewMedicine(prev => ({ ...prev, duration: e.target.value }))}
                >
                  {durations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={newMedicine.timing}
                  onChange={(e) => setNewMedicine(prev => ({ ...prev, timing: e.target.value }))}
                >
                  {timings.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="Special instructions (optional)"
                value={newMedicine.instructions}
                onChange={(e) => setNewMedicine(prev => ({ ...prev, instructions: e.target.value }))}
              />
              <div className="medicine-form__actions">
                <button className="btn-cancel" onClick={() => setShowMedicineForm(false)}>Cancel</button>
                <button className="btn-add" onClick={addMedicine}>Add Medicine</button>
              </div>
            </div>
          ) : (
            <button className="btn-add-medicine" onClick={() => setShowMedicineForm(true)}>
              <i className="fas fa-plus"></i> Add Medicine
            </button>
          )}
        </section>

        {/* Lab Tests Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-flask"></i> Lab Tests</h3>
          
          <div className="lab-tests-list">
            {prescription.labTests.map((test, index) => (
              <div key={index} className={`lab-test-item ${test.urgent ? 'lab-test-item--urgent' : ''}`}>
                <span className="lab-test-item__name">
                  {test.urgent && <i className="fas fa-exclamation-circle"></i>}
                  {test.name}
                </span>
                {test.instructions && <span className="lab-test-item__instructions">{test.instructions}</span>}
                <button onClick={() => removeLabTest(index)}><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>

          <div className="lab-test-add">
            <select
              value={newLabTest.name}
              onChange={(e) => setNewLabTest(prev => ({ ...prev, name: e.target.value }))}
            >
              <option value="">Select test...</option>
              {commonLabTests.map(test => (
                <option key={test} value={test}>{test}</option>
              ))}
              <option value="other">Other...</option>
            </select>
            {newLabTest.name === 'other' && (
              <input
                type="text"
                placeholder="Enter test name"
                onChange={(e) => setNewLabTest(prev => ({ ...prev, name: e.target.value }))}
              />
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newLabTest.urgent}
                onChange={(e) => setNewLabTest(prev => ({ ...prev, urgent: e.target.checked }))}
              />
              Urgent
            </label>
            <button onClick={addLabTest} disabled={!newLabTest.name}>
              <i className="fas fa-plus"></i> Add
            </button>
          </div>
        </section>

        {/* Advice Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-comment-medical"></i> Advice</h3>
          <textarea
            placeholder="General advice for the patient..."
            value={prescription.advice}
            onChange={(e) => setPrescription(prev => ({ ...prev, advice: e.target.value }))}
            rows={3}
          />
        </section>

        {/* Dietary Instructions */}
        <section className="prescription-section">
          <h3><i className="fas fa-apple-alt"></i> Dietary Instructions</h3>
          <textarea
            placeholder="Diet recommendations..."
            value={prescription.dietaryInstructions}
            onChange={(e) => setPrescription(prev => ({ ...prev, dietaryInstructions: e.target.value }))}
            rows={2}
          />
        </section>

        {/* Follow-up Section */}
        <section className="prescription-section">
          <h3><i className="fas fa-calendar-check"></i> Follow-up</h3>
          <div className="followup-row">
            <div className="followup-date">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={prescription.followUpDate}
                onChange={(e) => setPrescription(prev => ({ ...prev, followUpDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="followup-instructions">
              <label>Instructions</label>
              <input
                type="text"
                placeholder="Follow-up instructions..."
                value={prescription.followUpInstructions}
                onChange={(e) => setPrescription(prev => ({ ...prev, followUpInstructions: e.target.value }))}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="prescription-manager__footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-draft" onClick={() => handleSave(false)} disabled={loading}>
          {loading ? 'Saving...' : 'Save Draft'}
        </button>
        <button className="btn-primary" onClick={() => handleSave(true)} disabled={loading}>
          {loading ? 'Saving...' : 'Finalize & Send'}
        </button>
      </div>
    </div>
  );
};

export default PrescriptionManager;
