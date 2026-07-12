import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import { useVoiceInput } from './emr/VoiceInput';

// Bengali character detection regex
const containsBengali = (text) => /[\u0980-\u09FF]/.test(text);

// Auto-detect language from text
const detectLanguage = (text) => {
  if (!text) return 'en';
  return containsBengali(text) ? 'bn' : 'en';
};

// Translations
const translations = {
  en: {
    createPrescription: 'Create Prescription',
    patient: 'Patient',
    diagnosis: 'Diagnosis',
    symptoms: 'Symptoms',
    medicines: 'Medicines',
    addMedicine: 'Add Medicine',
    medicineName: 'Medicine name',
    dosage: 'Dosage',
    frequency: 'Frequency',
    duration: 'Duration',
    instructions: 'Instructions',
    specialInstructions: 'Special instructions',
    recommendedTests: 'Recommended Tests',
    addTest: 'Add test',
    advice: 'Advice',
    followUpDate: 'Follow-up Date',
    previewPrint: 'Preview & Print',
    cancel: 'Cancel',
    savePrescription: 'Save Prescription',
    prescriptionSaved: 'Prescription Saved!',
    sendEmail: 'Send Email',
    whatsApp: 'WhatsApp',
    print: 'Print',
    done: 'Done',
    speak: 'Speak',
    stop: 'Stop',
    listening: 'Listening...',
    digitalPrescription: 'Digital Prescription',
    date: 'Date',
    doctor: 'Doctor',
    prescriptionId: 'Prescription ID',
    // Frequency options
    onceDaily: 'Once daily',
    twiceDaily: 'Twice daily',
    thriceDaily: 'Three times daily',
    fourTimesDaily: 'Four times daily',
    every6Hours: 'Every 6 hours',
    every8Hours: 'Every 8 hours',
    beforeMeals: 'Before meals',
    afterMeals: 'After meals',
    atBedtime: 'At bedtime',
    asNeeded: 'As needed',
    // Duration options
    days3: '3 days',
    days5: '5 days',
    days7: '7 days',
    days10: '10 days',
    days14: '14 days',
    month1: '1 month',
    months2: '2 months',
    months3: '3 months',
    ongoing: 'Ongoing',
    languageNote: ''
  },
  bn: {
    createPrescription: 'প্রেসক্রিপশন তৈরি করুন',
    patient: 'রোগী',
    diagnosis: 'রোগ নির্ণয়',
    symptoms: 'লক্ষণ',
    medicines: 'ওষুধ',
    addMedicine: 'ওষুধ যোগ করুন',
    medicineName: 'ওষুধের নাম',
    dosage: 'মাত্রা',
    frequency: 'কতবার',
    duration: 'সময়কাল',
    instructions: 'নির্দেশনা',
    specialInstructions: 'বিশেষ নির্দেশনা',
    recommendedTests: 'প্রস্তাবিত পরীক্ষা',
    addTest: 'পরীক্ষা যোগ করুন',
    advice: 'পরামর্শ',
    followUpDate: 'ফলো-আপ তারিখ',
    previewPrint: 'প্রিভিউ ও প্রিন্ট',
    cancel: 'বাতিল',
    savePrescription: 'প্রেসক্রিপশন সংরক্ষণ করুন',
    prescriptionSaved: 'প্রেসক্রিপশন সংরক্ষিত!',
    sendEmail: 'ইমেইল পাঠান',
    whatsApp: 'হোয়াটসঅ্যাপ',
    print: 'প্রিন্ট',
    done: 'সম্পন্ন',
    speak: 'বলুন',
    stop: 'থামুন',
    listening: 'শুনছি...',
    digitalPrescription: 'ডিজিটাল প্রেসক্রিপশন',
    date: 'তারিখ',
    doctor: 'ডাক্তার',
    prescriptionId: 'প্রেসক্রিপশন আইডি',
    // Frequency options
    onceDaily: 'দিনে একবার',
    twiceDaily: 'দিনে দুইবার',
    thriceDaily: 'দিনে তিনবার',
    fourTimesDaily: 'দিনে চারবার',
    every6Hours: 'প্রতি ৬ ঘণ্টায়',
    every8Hours: 'প্রতি ৮ ঘণ্টায়',
    beforeMeals: 'খাবার আগে',
    afterMeals: 'খাবার পরে',
    atBedtime: 'ঘুমানোর আগে',
    asNeeded: 'প্রয়োজনে',
    // Duration options
    days3: '৩ দিন',
    days5: '৫ দিন',
    days7: '৭ দিন',
    days10: '১০ দিন',
    days14: '১৪ দিন',
    month1: '১ মাস',
    months2: '২ মাস',
    months3: '৩ মাস',
    ongoing: 'চলমান',
    languageNote: '(বাংলায় লেখা)'
  }
};

const PrescriptionManager = ({ doctorId, doctorName, patientId, patientName, patientEmail, patientPhone, appointmentId, onClose, onSave }) => {
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    symptoms: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    tests: [],
    advice: '',
    followUpDate: ''
  });
  const [saving, setSaving] = useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState(null);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [newTest, setNewTest] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'
  const [detectedLanguage, setDetectedLanguage] = useState('en');

  // Get translation
  const t = translations[language];

  // Auto-detect language from prescription content
  useEffect(() => {
    const allText = [
      prescription.diagnosis,
      prescription.symptoms,
      prescription.advice,
      ...prescription.medicines.map(m => m.name + m.instructions),
      ...prescription.tests
    ].join(' ');
    
    const detected = detectLanguage(allText);
    setDetectedLanguage(detected);
    
    // Auto-switch language if Bengali detected
    if (detected === 'bn' && language === 'en') {
      setLanguage('bn');
    }
  }, [prescription, language]);

  // Voice input hook - supports both English and Bengali
  const { isListening, transcript, isSupported, start, stop } = useVoiceInput({
    language: language === 'bn' ? 'bn-IN' : 'en-IN',
    continuous: true,
    enableCommands: true,
    onResult: useCallback((text) => {
      if (activeVoiceField === 'diagnosis') {
        setPrescription(prev => ({ ...prev, diagnosis: prev.diagnosis + (prev.diagnosis ? ' ' : '') + text }));
      } else if (activeVoiceField === 'symptoms') {
        setPrescription(prev => ({ ...prev, symptoms: prev.symptoms + (prev.symptoms ? ' ' : '') + text }));
      } else if (activeVoiceField === 'advice') {
        setPrescription(prev => ({ ...prev, advice: prev.advice + (prev.advice ? ' ' : '') + text }));
      }
    }, [activeVoiceField])
  });

  const toggleVoice = (field) => {
    if (isListening && activeVoiceField === field) {
      stop();
      setActiveVoiceField(null);
    } else {
      if (isListening) stop();
      setActiveVoiceField(field);
      setTimeout(() => start(), 100);
    }
  };

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

      const response = await axios.post('/api/prescriptions', data);
      toast.success('Prescription saved successfully');
      
      // Store the saved prescription ID and show send options
      const prescriptionId = response.data?.prescription?._id || response.data?._id;
      if (prescriptionId) {
        setSavedPrescriptionId(prescriptionId);
        setShowSendOptions(true);
      } else {
        if (onSave) onSave(data);
        if (onClose) onClose();
      }
    } catch (error) {
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  // Send prescription via Email
  const handleSendEmail = async () => {
    if (!savedPrescriptionId) return;
    const email = patientEmail;
    if (!email) {
      toast.error('Patient email not available');
      return;
    }
    setSendingEmail(true);
    try {
      const response = await axios.post(`/api/prescriptions/${savedPrescriptionId}/send-email`, { email });
      if (response.data.success) {
        toast.success('Prescription sent to email!');
      } else {
        toast.error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Send prescription via WhatsApp
  const handleSendWhatsApp = async () => {
    if (!savedPrescriptionId) return;
    const phone = patientPhone;
    if (!phone) {
      toast.error('Patient phone not available');
      return;
    }
    setSendingWhatsApp(true);
    try {
      const response = await axios.post(`/api/prescriptions/${savedPrescriptionId}/send-whatsapp`, { phone });
      if (response.data.success && response.data.whatsappUrl) {
        window.open(response.data.whatsappUrl, '_blank');
        toast.success('WhatsApp opened!');
      } else {
        toast.error(response.data.message || 'Failed to generate WhatsApp link');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send via WhatsApp');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleCloseAfterSave = () => {
    if (onSave) onSave(prescription);
    if (onClose) onClose();
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
    <html lang="${language}">
    <head>
      <title>Prescription - ${patientName}</title>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
        body { 
          font-family: ${language === 'bn' ? "'Noto Sans Bengali', " : ''}'Arial', sans-serif; 
          padding: 40px; 
          max-width: 800px; 
          margin: 0 auto; 
        }
        .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #0ea5e9; margin: 0; }
        .header p { color: #64748b; margin: 5px 0; }
        .language-badge { 
          display: inline-block; 
          padding: 4px 12px; 
          background: ${language === 'bn' ? '#f59e0b' : '#0ea5e9'}; 
          color: white; 
          border-radius: 20px; 
          font-size: 12px; 
          margin-top: 10px;
        }
        .patient-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .medicine { padding: 10px; margin: 8px 0; background: #f1f5f9; border-radius: 6px; border-left: 3px solid #0ea5e9; }
        .medicine strong { color: #1e293b; }
        .rx { font-size: 24px; color: #0ea5e9; font-weight: bold; }
        .footer { margin-top: 40px; text-align: right; }
        .signature { border-top: 1px solid #1e293b; padding-top: 10px; display: inline-block; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HealthSync</h1>
        <p>${language === 'bn' ? 'ডিজিটাল প্রেসক্রিপশন' : 'Digital Prescription'}</p>
        ${language === 'bn' ? '<span class="language-badge">বাংলায় লেখা</span>' : ''}
      </div>
      
      <div class="patient-info">
        <div>
          <strong>${language === 'bn' ? 'রোগী:' : 'Patient:'}</strong> ${patientName}<br>
          <strong>${language === 'bn' ? 'তারিখ:' : 'Date:'}</strong> ${new Date().toLocaleDateString(language === 'bn' ? 'bn-IN' : 'en-IN')}
        </div>
        <div>
          <strong>${language === 'bn' ? 'ডাক্তার:' : 'Doctor:'}</strong> Dr. ${doctorName}<br>
          <strong>${language === 'bn' ? 'প্রেসক্রিপশন নং:' : 'Prescription ID:'}</strong> RX${Date.now().toString().slice(-8)}
        </div>
      </div>

      <div class="section">
        <h3>${language === 'bn' ? 'রোগ নির্ণয়' : 'Diagnosis'}</h3>
        <p>${prescription.diagnosis}</p>
      </div>

      ${prescription.symptoms ? `
        <div class="section">
          <h3>${language === 'bn' ? 'লক্ষণ' : 'Symptoms'}</h3>
          <p>${prescription.symptoms}</p>
        </div>
      ` : ''}

      <div class="section">
        <h3><span class="rx">℞</span> ${language === 'bn' ? 'ওষুধ' : 'Medicines'}</h3>
        ${prescription.medicines.filter(m => m.name).map(med => `
          <div class="medicine">
            <strong>${med.name}</strong> - ${med.dosage}<br>
            <small>${language === 'bn' ? 'কতবার:' : 'Frequency:'} ${med.frequency} | ${language === 'bn' ? 'সময়কাল:' : 'Duration:'} ${med.duration}</small>
            ${med.instructions ? `<br><small>${language === 'bn' ? 'নির্দেশনা:' : 'Instructions:'} ${med.instructions}</small>` : ''}
          </div>
        `).join('')}
      </div>

      ${prescription.tests.length > 0 ? `
        <div class="section">
          <h3>${language === 'bn' ? 'প্রস্তাবিত পরীক্ষা' : 'Recommended Tests'}</h3>
          <ul>${prescription.tests.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
      ` : ''}

      ${prescription.advice ? `
        <div class="section">
          <h3>${language === 'bn' ? 'পরামর্শ' : 'Advice'}</h3>
          <p>${prescription.advice}</p>
        </div>
      ` : ''}

      ${prescription.followUpDate ? `
        <div class="section">
          <h3>${language === 'bn' ? 'ফলো-আপ তারিখ' : 'Follow-up Date'}</h3>
          <p>${new Date(prescription.followUpDate).toLocaleDateString(language === 'bn' ? 'bn-IN' : 'en-IN')}</p>
        </div>
      ` : ''}

      <div class="footer">
        <div class="signature">
          <strong>Dr. ${doctorName}</strong><br>
          <small>${language === 'bn' ? 'ডিজিটাল স্বাক্ষর' : 'Digital Signature'}</small>
        </div>
      </div>
    </body>
    </html>
  `;

  const frequencyOptions = language === 'bn' 
    ? [
        { value: 'Once daily', label: 'দিনে একবার' },
        { value: 'Twice daily', label: 'দিনে দুইবার' },
        { value: 'Three times daily', label: 'দিনে তিনবার' },
        { value: 'Four times daily', label: 'দিনে চারবার' },
        { value: 'Every 6 hours', label: 'প্রতি ৬ ঘণ্টায়' },
        { value: 'Every 8 hours', label: 'প্রতি ৮ ঘণ্টায়' },
        { value: 'Before meals', label: 'খাবার আগে' },
        { value: 'After meals', label: 'খাবার পরে' },
        { value: 'At bedtime', label: 'ঘুমানোর আগে' },
        { value: 'As needed', label: 'প্রয়োজনে' }
      ]
    : [
        { value: 'Once daily', label: 'Once daily' },
        { value: 'Twice daily', label: 'Twice daily' },
        { value: 'Three times daily', label: 'Three times daily' },
        { value: 'Four times daily', label: 'Four times daily' },
        { value: 'Every 6 hours', label: 'Every 6 hours' },
        { value: 'Every 8 hours', label: 'Every 8 hours' },
        { value: 'Before meals', label: 'Before meals' },
        { value: 'After meals', label: 'After meals' },
        { value: 'At bedtime', label: 'At bedtime' },
        { value: 'As needed', label: 'As needed' }
      ];

  const durationOptions = language === 'bn'
    ? [
        { value: '3 days', label: '৩ দিন' },
        { value: '5 days', label: '৫ দিন' },
        { value: '7 days', label: '৭ দিন' },
        { value: '10 days', label: '১০ দিন' },
        { value: '14 days', label: '১৪ দিন' },
        { value: '1 month', label: '১ মাস' },
        { value: '2 months', label: '২ মাস' },
        { value: '3 months', label: '৩ মাস' },
        { value: 'Ongoing', label: 'চলমান' }
      ]
    : [
        { value: '3 days', label: '3 days' },
        { value: '5 days', label: '5 days' },
        { value: '7 days', label: '7 days' },
        { value: '10 days', label: '10 days' },
        { value: '14 days', label: '14 days' },
        { value: '1 month', label: '1 month' },
        { value: '2 months', label: '2 months' },
        { value: '3 months', label: '3 months' },
        { value: 'Ongoing', label: 'Ongoing' }
      ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{t.createPrescription}</h2>
              <p className="text-indigo-200">{t.patient}: {patientName}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    language === 'en' ? 'bg-white text-indigo-600' : 'text-white/80 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    language === 'bn' ? 'bg-white text-indigo-600' : 'text-white/80 hover:text-white'
                  }`}
                >
                  বাং
                </button>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          {/* Auto-detect indicator */}
          {detectedLanguage === 'bn' && (
            <div className="mt-2 flex items-center gap-2 text-amber-200 text-sm">
              <i className="fas fa-language"></i>
              <span>বাংলা ভাষা সনাক্ত হয়েছে • Bengali detected</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Diagnosis & Symptoms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">{t.diagnosis} *</label>
                {isSupported && (
                  <button
                    type="button"
                    onClick={() => toggleVoice('diagnosis')}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                      isListening && activeVoiceField === 'diagnosis'
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                    }`}
                  >
                    {isListening && activeVoiceField === 'diagnosis' ? `⏹️ ${t.stop}` : `🎤 ${t.speak}`}
                  </button>
                )}
              </div>
              {isListening && activeVoiceField === 'diagnosis' && (
                <div className="text-xs text-red-500 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {t.listening} {transcript}
                </div>
              )}
              <input
                type="text"
                value={prescription.diagnosis}
                onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  isListening && activeVoiceField === 'diagnosis' ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                placeholder={language === 'bn' ? 'রোগ নির্ণয় লিখুন বা 🎤 ক্লিক করুন' : 'Enter diagnosis or click 🎤 to speak'}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">{t.symptoms}</label>
                {isSupported && (
                  <button
                    type="button"
                    onClick={() => toggleVoice('symptoms')}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                      isListening && activeVoiceField === 'symptoms'
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                    }`}
                  >
                    {isListening && activeVoiceField === 'symptoms' ? `⏹️ ${t.stop}` : `🎤 ${t.speak}`}
                  </button>
                )}
              </div>
              {isListening && activeVoiceField === 'symptoms' && (
                <div className="text-xs text-red-500 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {t.listening} {transcript}
                </div>
              )}
              <input
                type="text"
                value={prescription.symptoms}
                onChange={(e) => setPrescription(prev => ({ ...prev, symptoms: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  isListening && activeVoiceField === 'symptoms' ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                placeholder={language === 'bn' ? 'লক্ষণ লিখুন বা 🎤 ক্লিক করুন' : 'Enter symptoms or click 🎤 to speak'}
              />
            </div>
          </div>

          {/* Medicines */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">{t.medicines}</label>
              <button onClick={addMedicine} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <i className="fas fa-plus mr-1"></i>{t.addMedicine}
              </button>
            </div>
            <div className="space-y-3">
              {prescription.medicines.map((med, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">{language === 'bn' ? `ওষুধ ${index + 1}` : `Medicine ${index + 1}`}</span>
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
                      placeholder={`${t.medicineName} *`}
                    />
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder={language === 'bn' ? 'মাত্রা (যেমন ৫০০mg)' : 'Dosage (e.g., 500mg)'}
                    />
                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="">{t.frequency}</option>
                      {frequencyOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="">{t.duration}</option>
                      {durationOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                      className="col-span-2 md:col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder={t.specialInstructions}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tests */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.recommendedTests}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTest}
                onChange={(e) => setNewTest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTest()}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm"
                placeholder={language === 'bn' ? 'পরীক্ষা যোগ করুন (যেমন CBC, Blood Sugar)' : 'Add test (e.g., CBC, Blood Sugar)'}
              />
              <button onClick={addTest} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium">
                {language === 'bn' ? 'যোগ করুন' : 'Add'}
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">{t.advice}</label>
                {isSupported && (
                  <button
                    type="button"
                    onClick={() => toggleVoice('advice')}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                      isListening && activeVoiceField === 'advice'
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                    }`}
                  >
                    {isListening && activeVoiceField === 'advice' ? `⏹️ ${t.stop}` : `🎤 ${t.speak}`}
                  </button>
                )}
              </div>
              {isListening && activeVoiceField === 'advice' && (
                <div className="text-xs text-red-500 mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {t.listening} {transcript}
                </div>
              )}
              <textarea
                value={prescription.advice}
                onChange={(e) => setPrescription(prev => ({ ...prev, advice: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  isListening && activeVoiceField === 'advice' ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                rows={3}
                placeholder={language === 'bn' ? 'সাধারণ পরামর্শ বা 🎤 ক্লিক করুন' : 'General advice or click 🎤 to speak'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.followUpDate}</label>
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
          {!showSendOptions ? (
            <>
              <button onClick={handlePrint} className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl flex items-center gap-2">
                <i className="fas fa-print"></i>{t.previewPrint}
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100">
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  {t.savePrescription}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-600">
                <i className="fas fa-check-circle text-xl"></i>
                <span className="font-medium">{t.prescriptionSaved}</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !patientEmail}
                  className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    patientEmail 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={patientEmail ? `Send to ${patientEmail}` : 'No email available'}
                >
                  {sendingEmail ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-envelope"></i>}
                  {t.sendEmail}
                </button>
                <button 
                  onClick={handleSendWhatsApp}
                  disabled={sendingWhatsApp || !patientPhone}
                  className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    patientPhone 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={patientPhone ? `Send to ${patientPhone}` : 'No phone available'}
                >
                  {sendingWhatsApp ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-whatsapp"></i>}
                  {t.whatsApp}
                </button>
                <button onClick={handlePrint} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl flex items-center gap-2">
                  <i className="fas fa-print"></i>{t.print}
                </button>
                <button 
                  onClick={handleCloseAfterSave}
                  className="px-5 py-2.5 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-800 flex items-center gap-2"
                >
                  <i className="fas fa-check"></i>{t.done}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionManager;
