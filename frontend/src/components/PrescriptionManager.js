import { useState } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const PrescriptionManager = ({ doctorId, doctorName, patientId, patientName, appointmentId, onClose, onSave }) => {
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    symptoms: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    tests: [],
    advice: '',
    followUpDate: ''
  });
  const [saving, setSaving] = useState(false);
  const [newTest, setNewTest] = useState('');

  const addMedicine = () => {
    setPrescription(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedicine = (index) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => i === index ? { ...med, [field]: value } : med)
    }));
  };

  const addTest = () => {
    if (newTest.trim()) {
      setPrescription(prev => ({ ...prev, tests: [...prev.tests, newTest.trim()] }));
      setNewTest('');
    }
  };

  const removeTest = (index) => {
    setPrescription(prev => ({ ...prev, tests: prev.tests.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!prescription.diagnosis.trim()) {
      toast.error('Please enter diagnosis');
      return;
    }
    if (prescription.medicines.some(m => !m.name.trim())) {
      toast.error('Please fill all medicine names');
      return;
    }

    try {
      setSaving(true);
      const data = {
        doctorId,
        doctorName,
        patientId,
        patientName,
        appointmentId,
        ...prescription,
        createdAt: new Date().toISOString()
      };

      await axios.post('/api/prescriptions', data);
      toast.success('Prescription saved successfully');
      if (onSave) onSave(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const generatePrintContent = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - ${patientName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #6366f1; margin: 0; }
        .header p { color: #64748b; margin: 5px 0; }
        .patient-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .medicine { padding: 10px; margin: 8px 0; background: #f1f5f9; border-radius: 6px; border-left: 3px solid #6366f1; }
        .medicine strong { color: #1e293b; }
        .rx { font-size: 24px; color: #6366f1; font-weight: bold; }
        .footer { margin-top: 40px; text-align: right; }
        .signature { border-top: 1px solid #1e293b; padding-top: 10px; display: inline-block; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HealthSync</h1>
        <p>Digital Prescription</p>
      </div>
      
      <div class="patient-info">
        <div>
          <strong>Patient:</strong> ${patientName}<br>
          <strong>Date:</strong> ${new Date().toLocaleDateString()}
        </div>
        <div>
          <strong>Doctor:</strong> Dr. ${doctorName}<br>
          <strong>Prescription ID:</strong> RX${Date.now().toString().slice(-8)}
        </div>
      </div>

      <div class="section">
        <h3>Diagnosis</h3>
        <p>${prescription.diagnosis}</p>
      </div>

      ${prescription.symptoms ? `
        <div class="section">
          <h3>Symptoms</h3>
          <p>${prescription.symptoms}</p>
        </div>
      ` : ''}

      <div class="section">
        <h3><span class="rx">℞</span> Medicines</h3>
        ${prescription.medicines.filter(m => m.name).map(med => `
          <div class="medicine">
            <strong>${med.name}</strong> - ${med.dosage}<br>
            <small>Frequency: ${med.frequency} | Duration: ${med.duration}</small>
            ${med.instructions ? `<br><small>Instructions: ${med.instructions}</small>` : ''}
          </div>
        `).join('')}
      </div>

      ${prescription.tests.length > 0 ? `
        <div class="section">
          <h3>Recommended Tests</h3>
          <ul>${prescription.tests.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
      ` : ''}

      ${prescription.advice ? `
        <div class="section">
          <h3>Advice</h3>
          <p>${prescription.advice}</p>
        </div>
      ` : ''}

      ${prescription.followUpDate ? `
        <div class="section">
          <h3>Follow-up Date</h3>
          <p>${new Date(prescription.followUpDate).toLocaleDateString()}</p>
        </div>
      ` : ''}

      <div class="footer">
        <div class="signature">
          <strong>Dr. ${doctorName}</strong><br>
          <small>Digital Signature</small>
        </div>
      </div>
    </body>
    </html>
  `;

  const frequencyOptions = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Before meals', 'After meals', 'At bedtime', 'As needed'];
  const durationOptions = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months', 'Ongoing'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Create Prescription</h2>
              <p className="text-indigo-200">Patient: {patientName}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Diagnosis & Symptoms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Diagnosis *</label>
              <input
                type="text"
                value={prescription.diagnosis}
                onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter diagnosis"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Symptoms</label>
              <input
                type="text"
                value={prescription.symptoms}
                onChange={(e) => setPrescription(prev => ({ ...prev, symptoms: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter symptoms"
              />
            </div>
          </div>

          {/* Medicines */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Medicines</label>
              <button onClick={addMedicine} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <i className="fas fa-plus mr-1"></i>Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {prescription.medicines.map((med, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Medicine {index + 1}</span>
                    {prescription.medicines.length > 1 && (
                      <button onClick={() => removeMedicine(index)} className="text-red-500 hover:text-red-600">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder="Medicine name *"
                    />
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder="Dosage (e.g., 500mg)"
                    />
                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="">Frequency</option>
                      {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="">Duration</option>
                      {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                      className="col-span-2 md:col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder="Special instructions"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tests */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Recommended Tests</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTest}
                onChange={(e) => setNewTest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTest()}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm"
                placeholder="Add test (e.g., CBC, Blood Sugar)"
              />
              <button onClick={addTest} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium">
                Add
              </button>
            </div>
            {prescription.tests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prescription.tests.map((test, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                    {test}
                    <button onClick={() => removeTest(index)} className="hover:text-purple-900">
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Advice & Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Advice</label>
              <textarea
                value={prescription.advice}
                onChange={(e) => setPrescription(prev => ({ ...prev, advice: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"
                rows={3}
                placeholder="General advice for patient"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Date</label>
              <input
                type="date"
                value={prescription.followUpDate}
                onChange={(e) => setPrescription(prev => ({ ...prev, followUpDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button onClick={handlePrint} className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl flex items-center gap-2">
            <i className="fas fa-print"></i>Preview & Print
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
              Save Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionManager;
