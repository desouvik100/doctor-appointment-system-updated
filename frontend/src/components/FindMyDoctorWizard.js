// AI-Powered Find My Doctor Wizard
// Step-by-step questionnaire to help patients find the right specialist
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const FindMyDoctorWizard = ({ onComplete, onClose, onBookDoctor }) => {
  const { t, language, setLanguage, languages } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    language: language,
    ageGroup: '',
    gender: '',
    primaryConcern: '',
    symptoms: [],
    duration: '',
    severity: '',
    additionalInfo: ''
  });
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Wizard steps configuration
  const steps = [
    { id: 'language', title: t('selectLanguage') || 'Select Language', icon: 'fa-globe' },
    { id: 'basic', title: t('basicInfo') || 'Basic Information', icon: 'fa-user' },
    { id: 'concern', title: t('primaryConcern') || 'Primary Concern', icon: 'fa-heartbeat' },
    { id: 'symptoms', title: t('symptoms') || 'Symptoms', icon: 'fa-stethoscope' },
    { id: 'details', title: t('moreDetails') || 'More Details', icon: 'fa-clipboard-list' },
    { id: 'result', title: t('recommendation') || 'AI Recommendation', icon: 'fa-robot' }
  ];

  // Primary health concerns with icons
  const healthConcerns = [
    { id: 'general', label: 'General Health Checkup', labelBn: 'সাধারণ স্বাস্থ্য পরীক্ষা', labelHi: 'सामान्य स्वास्थ्य जांच', icon: 'fa-notes-medical' },
    { id: 'fever', label: 'Fever / Cold / Flu', labelBn: 'জ্বর / সর্দি / ফ্লু', labelHi: 'बुखार / सर्दी / फ्लू', icon: 'fa-thermometer-half' },
    { id: 'stomach', label: 'Stomach / Digestive Issues', labelBn: 'পেট / হজমের সমস্যা', labelHi: 'पेट / पाचन समस्या', icon: 'fa-stomach' },
    { id: 'heart', label: 'Heart / Chest Pain', labelBn: 'হার্ট / বুকে ব্যথা', labelHi: 'दिल / सीने में दर्द', icon: 'fa-heartbeat' },
    { id: 'skin', label: 'Skin Problems', labelBn: 'ত্বকের সমস্যা', labelHi: 'त्वचा की समस्या', icon: 'fa-hand-dots' },
    { id: 'bone', label: 'Bone / Joint Pain', labelBn: 'হাড় / জয়েন্টে ব্যথা', labelHi: 'हड्डी / जोड़ों का दर्द', icon: 'fa-bone' },
    { id: 'eye', label: 'Eye Problems', labelBn: 'চোখের সমস্যা', labelHi: 'आंखों की समस्या', icon: 'fa-eye' },
    { id: 'ear', label: 'Ear / Nose / Throat', labelBn: 'কান / নাক / গলা', labelHi: 'कान / नाक / गला', icon: 'fa-ear-listen' },
    { id: 'mental', label: 'Mental Health / Stress', labelBn: 'মানসিক স্বাস্থ্য / মানসিক চাপ', labelHi: 'मानसिक स्वास्थ्य / तनाव', icon: 'fa-brain' },
    { id: 'women', label: "Women's Health", labelBn: 'মহিলাদের স্বাস্থ্য', labelHi: 'महिला स्वास्थ्य', icon: 'fa-venus' },
    { id: 'child', label: 'Child Health', labelBn: 'শিশু স্বাস্থ্য', labelHi: 'बाल स्वास्थ्य', icon: 'fa-baby' },
    { id: 'dental', label: 'Dental Problems', labelBn: 'দাঁতের সমস্যা', labelHi: 'दांतों की समस्या', icon: 'fa-tooth' },
    { id: 'other', label: 'Other', labelBn: 'অন্যান্য', labelHi: 'अन्य', icon: 'fa-plus-circle' }
  ];

  // Symptoms based on concern
  const symptomsByCategory = {
    general: ['Fatigue', 'Weight changes', 'Loss of appetite', 'General weakness', 'Sleep problems'],
    fever: ['High temperature', 'Body ache', 'Headache', 'Runny nose', 'Sore throat', 'Cough', 'Chills'],
    stomach: ['Abdominal pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Bloating', 'Acidity'],
    heart: ['Chest pain', 'Shortness of breath', 'Palpitations', 'Dizziness', 'Swelling in legs', 'Fatigue'],
    skin: ['Rash', 'Itching', 'Acne', 'Hair loss', 'Skin discoloration', 'Wounds not healing'],
    bone: ['Joint pain', 'Back pain', 'Swelling', 'Stiffness', 'Difficulty walking', 'Muscle pain'],
    eye: ['Blurred vision', 'Eye pain', 'Redness', 'Watery eyes', 'Sensitivity to light', 'Headache'],
    ear: ['Ear pain', 'Hearing loss', 'Ringing in ears', 'Nasal congestion', 'Sore throat', 'Difficulty swallowing'],
    mental: ['Anxiety', 'Depression', 'Insomnia', 'Mood swings', 'Panic attacks', 'Difficulty concentrating'],
    women: ['Irregular periods', 'Pregnancy related', 'Menopause symptoms', 'Pelvic pain', 'Breast concerns'],
    child: ['Fever', 'Cough/Cold', 'Vaccination', 'Growth concerns', 'Behavioral issues', 'Skin rash'],
    dental: ['Toothache', 'Bleeding gums', 'Bad breath', 'Tooth sensitivity', 'Jaw pain'],
    other: ['Please describe in additional info']
  };

  // Doctor specialization mapping
  const specializationMap = {
    general: ['General Physician', 'Internal Medicine'],
    fever: ['General Physician', 'Internal Medicine'],
    stomach: ['Gastroenterologist', 'General Physician'],
    heart: ['Cardiologist', 'Internal Medicine'],
    skin: ['Dermatologist'],
    bone: ['Orthopedic', 'Rheumatologist'],
    eye: ['Ophthalmologist'],
    ear: ['ENT Specialist', 'Otolaryngologist'],
    mental: ['Psychiatrist', 'Psychologist'],
    women: ['Gynecologist', 'Obstetrician'],
    child: ['Pediatrician'],
    dental: ['Dentist', 'Oral Surgeon'],
    other: ['General Physician']
  };

  const getLocalizedLabel = (item) => {
    if (language === 'bn') return item.labelBn || item.label;
    if (language === 'hi') return item.labelHi || item.label;
    return item.label;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === steps.length - 2) {
        // Before showing results, analyze with AI
        analyzeAndRecommend();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const analyzeAndRecommend = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis (in production, this would call an AI API)
    setTimeout(() => {
      const concern = answers.primaryConcern;
      const specialists = specializationMap[concern] || ['General Physician'];
      
      // Generate AI recommendation based on answers
      const recommendation = {
        primarySpecialist: specialists[0],
        alternativeSpecialists: specialists.slice(1),
        urgency: answers.severity === 'severe' ? 'high' : answers.severity === 'moderate' ? 'medium' : 'low',
        reasoning: generateReasoning(),
        tips: generateHealthTips()
      };
      
      setAiRecommendation(recommendation);
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateReasoning = () => {
    const concern = healthConcerns.find(c => c.id === answers.primaryConcern);
    const concernLabel = concern ? getLocalizedLabel(concern) : 'your health concern';
    
    const reasonings = {
      en: `Based on your symptoms related to ${concernLabel} and the duration of ${answers.duration || 'your condition'}, we recommend consulting a specialist who can provide proper diagnosis and treatment.`,
      hi: `${concernLabel} से संबंधित आपके लक्षणों और ${answers.duration || 'आपकी स्थिति'} की अवधि के आधार पर, हम एक विशेषज्ञ से परामर्श करने की सलाह देते हैं।`,
      bn: `${concernLabel} সম্পর্কিত আপনার উপসর্গ এবং ${answers.duration || 'আপনার অবস্থা'} এর সময়কালের উপর ভিত্তি করে, আমরা একজন বিশেষজ্ঞের সাথে পরামর্শ করার পরামর্শ দিই।`
    };
    
    return reasonings[language] || reasonings.en;
  };

  const generateHealthTips = () => {
    const tips = {
      en: [
        'Stay hydrated and get adequate rest',
        'Keep track of your symptoms',
        'Bring any previous medical reports to your appointment',
        'List all medications you are currently taking'
      ],
      hi: [
        'हाइड्रेटेड रहें और पर्याप्त आराम करें',
        'अपने लक्षणों पर नज़र रखें',
        'अपनी पिछली मेडिकल रिपोर्ट अपॉइंटमेंट में लाएं',
        'वर्तमान में ली जा रही सभी दवाओं की सूची बनाएं'
      ],
      bn: [
        'হাইড্রেটেড থাকুন এবং পর্যাপ্ত বিশ্রাম নিন',
        'আপনার উপসর্গগুলি ট্র্যাক করুন',
        'আপনার অ্যাপয়েন্টমেন্টে আগের মেডিকেল রিপোর্ট আনুন',
        'বর্তমানে যে সব ওষুধ খাচ্ছেন তার তালিকা করুন'
      ]
    };
    
    return tips[language] || tips.en;
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'language':
        return renderLanguageStep();
      case 'basic':
        return renderBasicInfoStep();
      case 'concern':
        return renderConcernStep();
      case 'symptoms':
        return renderSymptomsStep();
      case 'details':
        return renderDetailsStep();
      case 'result':
        return renderResultStep();
      default:
        return null;
    }
  };


  const renderLanguageStep = () => (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
        {language === 'bn' ? 'আপনার ভাষা নির্বাচন করুন' : language === 'hi' ? 'अपनी भाषा चुनें' : 'Choose Your Language'}
      </h3>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        {language === 'bn' ? 'আপনার পছন্দের ভাষায় চালিয়ে যান' : language === 'hi' ? 'अपनी पसंदीदा भाषा में जारी रखें' : 'Continue in your preferred language'}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setAnswers({ ...answers, language: lang.code });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 24px',
              background: answers.language === lang.code ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#f8fafc',
              border: answers.language === lang.code ? 'none' : '2px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: answers.language === lang.code ? '#fff' : '#1e293b'
            }}
          >
            <span style={{ fontSize: '32px' }}>{lang.flag}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{lang.nativeName}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>{lang.name}</div>
            </div>
            {answers.language === lang.code && (
              <i className="fas fa-check-circle" style={{ marginLeft: 'auto', fontSize: '20px' }}></i>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicInfoStep = () => (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px', color: '#1e293b', textAlign: 'center' }}>
        {language === 'bn' ? 'আপনার সম্পর্কে বলুন' : language === 'hi' ? 'अपने बारे में बताएं' : 'Tell Us About Yourself'}
      </h3>
      <p style={{ color: '#64748b', marginBottom: '32px', textAlign: 'center' }}>
        {language === 'bn' ? 'এটি আমাদের আরও ভালো সুপারিশ করতে সাহায্য করবে' : language === 'hi' ? 'इससे हमें बेहतर सिफारिश करने में मदद मिलेगी' : 'This helps us provide better recommendations'}
      </p>
      
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Age Group */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            {language === 'bn' ? 'বয়সের গ্রুপ' : language === 'hi' ? 'आयु वर्ग' : 'Age Group'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { value: 'child', label: '0-12', labelText: language === 'bn' ? 'শিশু' : language === 'hi' ? 'बच्चा' : 'Child' },
              { value: 'teen', label: '13-19', labelText: language === 'bn' ? 'কিশোর' : language === 'hi' ? 'किशोर' : 'Teen' },
              { value: 'adult', label: '20-40', labelText: language === 'bn' ? 'প্রাপ্তবয়স্ক' : language === 'hi' ? 'वयस्क' : 'Adult' },
              { value: 'middle', label: '41-60', labelText: language === 'bn' ? 'মধ্যবয়সী' : language === 'hi' ? 'मध्यम आयु' : 'Middle Age' },
              { value: 'senior', label: '60+', labelText: language === 'bn' ? 'বয়স্ক' : language === 'hi' ? 'वरिष्ठ' : 'Senior' }
            ].map((age) => (
              <button
                key={age.value}
                onClick={() => setAnswers({ ...answers, ageGroup: age.value })}
                style={{
                  padding: '12px',
                  background: answers.ageGroup === age.value ? '#6366f1' : '#f8fafc',
                  border: answers.ageGroup === age.value ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: answers.ageGroup === age.value ? '#fff' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <div style={{ fontWeight: '600' }}>{age.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{age.labelText}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            {language === 'bn' ? 'লিঙ্গ' : language === 'hi' ? 'लिंग' : 'Gender'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { value: 'male', icon: 'fa-mars', label: language === 'bn' ? 'পুরুষ' : language === 'hi' ? 'पुरुष' : 'Male' },
              { value: 'female', icon: 'fa-venus', label: language === 'bn' ? 'মহিলা' : language === 'hi' ? 'महिला' : 'Female' },
              { value: 'other', icon: 'fa-genderless', label: language === 'bn' ? 'অন্যান্য' : language === 'hi' ? 'अन्य' : 'Other' }
            ].map((g) => (
              <button
                key={g.value}
                onClick={() => setAnswers({ ...answers, gender: g.value })}
                style={{
                  padding: '16px',
                  background: answers.gender === g.value ? '#6366f1' : '#f8fafc',
                  border: answers.gender === g.value ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: answers.gender === g.value ? '#fff' : '#1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className={`fas ${g.icon}`} style={{ fontSize: '24px' }}></i>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderConcernStep = () => (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px', color: '#1e293b', textAlign: 'center' }}>
        {language === 'bn' ? 'আপনার প্রধান সমস্যা কী?' : language === 'hi' ? 'आपकी मुख्य समस्या क्या है?' : 'What is your main concern?'}
      </h3>
      <p style={{ color: '#64748b', marginBottom: '24px', textAlign: 'center' }}>
        {language === 'bn' ? 'সবচেয়ে উপযুক্ত বিকল্পটি নির্বাচন করুন' : language === 'hi' ? 'सबसे उपयुक्त विकल्प चुनें' : 'Select the most appropriate option'}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', maxWidth: '700px', margin: '0 auto' }}>
        {healthConcerns.map((concern) => (
          <button
            key={concern.id}
            onClick={() => setAnswers({ ...answers, primaryConcern: concern.id, symptoms: [] })}
            style={{
              padding: '16px 12px',
              background: answers.primaryConcern === concern.id ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#f8fafc',
              border: answers.primaryConcern === concern.id ? 'none' : '1px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              color: answers.primaryConcern === concern.id ? '#fff' : '#1e293b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className={`fas ${concern.icon}`} style={{ fontSize: '24px' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center', lineHeight: '1.3' }}>
              {getLocalizedLabel(concern)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSymptomsStep = () => {
    const symptoms = symptomsByCategory[answers.primaryConcern] || symptomsByCategory.general;
    
    return (
      <div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px', color: '#1e293b', textAlign: 'center' }}>
          {language === 'bn' ? 'আপনার উপসর্গগুলি নির্বাচন করুন' : language === 'hi' ? 'अपने लक्षण चुनें' : 'Select Your Symptoms'}
        </h3>
        <p style={{ color: '#64748b', marginBottom: '24px', textAlign: 'center' }}>
          {language === 'bn' ? 'প্রযোজ্য সব নির্বাচন করুন' : language === 'hi' ? 'सभी लागू विकल्प चुनें' : 'Select all that apply'}
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
          {symptoms.map((symptom) => {
            const isSelected = answers.symptoms.includes(symptom);
            return (
              <button
                key={symptom}
                onClick={() => {
                  const newSymptoms = isSelected
                    ? answers.symptoms.filter(s => s !== symptom)
                    : [...answers.symptoms, symptom];
                  setAnswers({ ...answers, symptoms: newSymptoms });
                }}
                style={{
                  padding: '10px 16px',
                  background: isSelected ? '#6366f1' : '#fff',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  color: isSelected ? '#fff' : '#475569',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {isSelected && <i className="fas fa-check" style={{ fontSize: '12px' }}></i>}
                {symptom}
              </button>
            );
          })}
        </div>
      </div>
    );
  };


  const renderDetailsStep = () => (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px', color: '#1e293b', textAlign: 'center' }}>
        {language === 'bn' ? 'আরও কিছু বিবরণ' : language === 'hi' ? 'कुछ और विवरण' : 'A Few More Details'}
      </h3>
      <p style={{ color: '#64748b', marginBottom: '24px', textAlign: 'center' }}>
        {language === 'bn' ? 'এটি আমাদের আরও সঠিক সুপারিশ দিতে সাহায্য করবে' : language === 'hi' ? 'इससे हमें अधिक सटीक सिफारिश देने में मदद मिलेगी' : 'This helps us give more accurate recommendations'}
      </p>
      
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Duration */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            {language === 'bn' ? 'কতদিন ধরে এই সমস্যা?' : language === 'hi' ? 'यह समस्या कितने समय से है?' : 'How long have you had this issue?'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { value: 'today', label: language === 'bn' ? 'আজই শুরু হয়েছে' : language === 'hi' ? 'आज ही शुरू हुआ' : 'Started today' },
              { value: 'few_days', label: language === 'bn' ? 'কয়েক দিন' : language === 'hi' ? 'कुछ दिन' : 'Few days' },
              { value: 'week', label: language === 'bn' ? '১ সপ্তাহ+' : language === 'hi' ? '1 सप्ताह+' : '1 week+' },
              { value: 'month', label: language === 'bn' ? '১ মাস+' : language === 'hi' ? '1 महीना+' : '1 month+' },
              { value: 'long', label: language === 'bn' ? 'দীর্ঘদিন ধরে' : language === 'hi' ? 'लंबे समय से' : 'Long time' }
            ].map((d) => (
              <button
                key={d.value}
                onClick={() => setAnswers({ ...answers, duration: d.value })}
                style={{
                  padding: '12px',
                  background: answers.duration === d.value ? '#6366f1' : '#f8fafc',
                  border: answers.duration === d.value ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: answers.duration === d.value ? '#fff' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            {language === 'bn' ? 'সমস্যার তীব্রতা' : language === 'hi' ? 'समस्या की गंभीरता' : 'Severity of the issue'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { value: 'mild', label: language === 'bn' ? 'হালকা' : language === 'hi' ? 'हल्का' : 'Mild', color: '#22c55e' },
              { value: 'moderate', label: language === 'bn' ? 'মাঝারি' : language === 'hi' ? 'मध्यम' : 'Moderate', color: '#f59e0b' },
              { value: 'severe', label: language === 'bn' ? 'গুরুতর' : language === 'hi' ? 'गंभीर' : 'Severe', color: '#ef4444' }
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setAnswers({ ...answers, severity: s.value })}
                style={{
                  padding: '14px',
                  background: answers.severity === s.value ? s.color : '#f8fafc',
                  border: answers.severity === s.value ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: answers.severity === s.value ? '#fff' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            {language === 'bn' ? 'অতিরিক্ত তথ্য (ঐচ্ছিক)' : language === 'hi' ? 'अतिरिक्त जानकारी (वैकल्पिक)' : 'Additional Information (Optional)'}
          </label>
          <textarea
            value={answers.additionalInfo}
            onChange={(e) => setAnswers({ ...answers, additionalInfo: e.target.value })}
            placeholder={language === 'bn' ? 'আপনার সমস্যা সম্পর্কে আরও কিছু বলুন...' : language === 'hi' ? 'अपनी समस्या के बारे में और बताएं...' : 'Tell us more about your issue...'}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderResultStep = () => {
    if (isAnalyzing) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fas fa-robot fa-spin" style={{ fontSize: '36px', color: '#fff' }}></i>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            {language === 'bn' ? 'AI বিশ্লেষণ করছে...' : language === 'hi' ? 'AI विश्लेषण कर रहा है...' : 'AI is analyzing...'}
          </h3>
          <p style={{ color: '#64748b' }}>
            {language === 'bn' ? 'আপনার জন্য সেরা ডাক্তার খুঁজছি' : language === 'hi' ? 'आपके लिए सबसे अच्छा डॉक्टर ढूंढ रहा है' : 'Finding the best doctor for you'}
          </p>
        </div>
      );
    }

    if (!aiRecommendation) return null;

    const urgencyColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
    const urgencyLabels = {
      high: { en: 'High Priority', hi: 'उच्च प्राथमिकता', bn: 'উচ্চ অগ্রাধিকার' },
      medium: { en: 'Medium Priority', hi: 'मध्यम प्राथमिकता', bn: 'মাঝারি অগ্রাধিকার' },
      low: { en: 'Low Priority', hi: 'कम प्राथमिकता', bn: 'কম অগ্রাধিকার' }
    };

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fas fa-check" style={{ fontSize: '32px', color: '#fff' }}></i>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
            {language === 'bn' ? 'AI সুপারিশ প্রস্তুত!' : language === 'hi' ? 'AI सिफारिश तैयार!' : 'AI Recommendation Ready!'}
          </h3>
        </div>

        {/* Main Recommendation Card */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#fff',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <i className="fas fa-user-md" style={{ fontSize: '20px' }}></i>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>
              {language === 'bn' ? 'প্রস্তাবিত বিশেষজ্ঞ' : language === 'hi' ? 'अनुशंसित विशेषज्ञ' : 'Recommended Specialist'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>
            {aiRecommendation.primarySpecialist}
          </h2>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: urgencyColors[aiRecommendation.urgency],
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <i className="fas fa-exclamation-circle"></i>
            {urgencyLabels[aiRecommendation.urgency][language] || urgencyLabels[aiRecommendation.urgency].en}
          </div>
        </div>

        {/* Reasoning */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <i className="fas fa-lightbulb" style={{ color: '#f59e0b' }}></i>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>
              {language === 'bn' ? 'কেন এই সুপারিশ' : language === 'hi' ? 'यह सिफारिश क्यों' : 'Why this recommendation'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {aiRecommendation.reasoning}
          </p>
        </div>

        {/* Alternative Specialists */}
        {aiRecommendation.alternativeSpecialists.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              {language === 'bn' ? 'বিকল্প বিশেষজ্ঞ' : language === 'hi' ? 'वैकल्पिक विशेषज्ञ' : 'Alternative Specialists'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {aiRecommendation.alternativeSpecialists.map((spec, i) => (
                <span key={i} style={{
                  padding: '6px 12px',
                  background: '#eef2ff',
                  color: '#6366f1',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Health Tips */}
        <div style={{
          background: '#ecfdf5',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <i className="fas fa-heart" style={{ color: '#10b981' }}></i>
            <span style={{ fontWeight: '600', color: '#065f46' }}>
              {language === 'bn' ? 'স্বাস্থ্য টিপস' : language === 'hi' ? 'स्वास्थ्य सुझाव' : 'Health Tips'}
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#047857', fontSize: '14px' }}>
            {aiRecommendation.tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              if (onBookDoctor) {
                onBookDoctor(aiRecommendation.primarySpecialist);
              }
              if (onComplete) {
                onComplete(aiRecommendation);
              }
            }}
            style={{
              flex: 1,
              padding: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <i className="fas fa-calendar-check"></i>
            {language === 'bn' ? 'ডাক্তার খুঁজুন' : language === 'hi' ? 'डॉक्टर खोजें' : 'Find Doctors'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '14px 20px',
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {language === 'bn' ? 'পরে' : language === 'hi' ? 'बाद में' : 'Later'}
          </button>
        </div>
      </div>
    );
  };


  // Check if can proceed to next step
  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'language': return true;
      case 'basic': return answers.ageGroup && answers.gender;
      case 'concern': return answers.primaryConcern;
      case 'symptoms': return answers.symptoms.length > 0;
      case 'details': return answers.duration && answers.severity;
      default: return true;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-robot" style={{ color: '#fff', fontSize: '18px' }}></i>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {language === 'bn' ? 'আমার ডাক্তার খুঁজুন' : language === 'hi' ? 'मेरा डॉक्टर खोजें' : 'Find My Doctor'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                {language === 'bn' ? 'AI-চালিত সুপারিশ' : language === 'hi' ? 'AI-संचालित सिफारिश' : 'AI-Powered Recommendation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Steps */}
        {currentStep < steps.length - 1 && (
          <div style={{ padding: '16px 24px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              {steps.slice(0, -1).map((step, index) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: index < steps.length - 2 ? 1 : 'none' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: index <= currentStep ? '#6366f1' : '#e2e8f0',
                    color: index <= currentStep ? '#fff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}>
                    {index < currentStep ? <i className="fas fa-check"></i> : index + 1}
                  </div>
                  {index < steps.length - 2 && (
                    <div style={{
                      flex: 1,
                      height: '3px',
                      background: index < currentStep ? '#6366f1' : '#e2e8f0',
                      margin: '0 8px',
                      borderRadius: '2px',
                      transition: 'all 0.3s'
                    }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
              {language === 'bn' ? `ধাপ ${currentStep + 1}/${steps.length - 1}` : language === 'hi' ? `चरण ${currentStep + 1}/${steps.length - 1}` : `Step ${currentStep + 1} of ${steps.length - 1}`}
              {' - '}
              {steps[currentStep].title}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        {currentStep < steps.length - 1 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff'
          }}>
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  {language === 'bn' ? 'পিছনে' : language === 'hi' ? 'पीछे' : 'Back'}
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStep > 0 && currentStep < steps.length - 2 && (
                <button
                  onClick={handleSkip}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {language === 'bn' ? 'এড়িয়ে যান' : language === 'hi' ? 'छोड़ें' : 'Skip'}
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                style={{
                  padding: '10px 24px',
                  background: canProceed() ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  color: canProceed() ? '#fff' : '#94a3b8',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {currentStep === steps.length - 2 ? (
                  <>
                    <i className="fas fa-magic"></i>
                    {language === 'bn' ? 'AI বিশ্লেষণ' : language === 'hi' ? 'AI विश्लेषण' : 'Get AI Analysis'}
                  </>
                ) : (
                  <>
                    {language === 'bn' ? 'পরবর্তী' : language === 'hi' ? 'अगला' : 'Next'}
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindMyDoctorWizard;
