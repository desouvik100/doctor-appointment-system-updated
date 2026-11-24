import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SecondOpinion = ({ userId, userName }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [requests, setRequests] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    condition: '', currentDiagnosis: '', symptoms: '', duration: '',
    currentTreatment: '', specialization: '', urgency: 'normal', additionalNotes: ''
  });

  const specializations = ['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Gastroenterology', 'Pulmonology', 'Nephrology', 'Endocrinology', 'Dermatology', 'Psychiatry'];

  const expertDoctors = [
    { id: 1, name: 'Dr. Rajesh Sharma', specialization: 'Cardiology', experience: '25 years', hospital: 'AIIMS Delhi', rating: 4.9, fee: 2500 },
    { id: 2, name: 'Dr. Priya Mehta', specialization: 'Oncology', experience: '20 years', hospital: 'Tata Memorial', rating: 4.8, fee: 3000 },
    { id: 3, name: 'Dr. Amit Kumar', specialization: 'Neurology', experience: '22 years', hospital: 'NIMHANS', rating: 4.9, fee: 2800 },
    { id: 4, name: 'Dr. Sunita Reddy', specialization: 'Orthopedics', experience: '18 years', hospital: 'Apollo', rating: 4.7, fee: 2000 }
  ];

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = () => {
    const saved = localStorage.getItem('second_opinion_' + userId);
    if (saved) setRequests(JSON.parse(saved));
  };

  const saveRequests = (data) => {
    localStorage.setItem('second_opinion_' + userId, JSON.stringify(data));
    setRequests(data);
  };

  const handleSubmit = () => {
    if (!formData.condition || !formData.specialization) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const newRequest = { ...formData, id: Date.now(), status: 'pending', createdAt: new Date().toISOString(), userName };
      saveRequests([newRequest, ...requests]);
      setFormData({ condition: '', currentDiagnosis: '', symptoms: '', duration: '', currentTreatment: '', specialization: '', urgency: 'normal', additionalNotes: '' });
      setShowNewRequest(false);
      setActiveStep(1);
      toast.success('Request submitted successfully!');
      setLoading(false);
    }, 1500);
  };

  const getStatusColor = (status) => ({
    pending: 'bg-amber-100 text-amber-700',
    in_review: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700'
  }[status] || 'bg-slate-100 text-slate-700');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Get a Second Opinion</h2>
            <p className="text-purple-100">Connect with top specialists for expert medical advice</p>
          </div>
          <button onClick={() => setShowNewRequest(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
            <i className="fas fa-plus"></i> New Request
          </button>
        </div>
      </div>

      {showNewRequest && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Request Second Opinion</h3>
            <button onClick={() => setShowNewRequest(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times text-slate-500"></i></button>
          </div>

          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(step => (
              <div key={step} className={'flex-1 h-2 rounded-full ' + (activeStep >= step ? 'bg-indigo-500' : 'bg-slate-200')}></div>
            ))}
          </div>

          {activeStep === 1 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800">Medical Condition Details</h4>
              <input type="text" placeholder="Condition/Disease Name *" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea placeholder="Current Diagnosis" value={formData.currentDiagnosis} onChange={(e) => setFormData({...formData, currentDiagnosis: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              <textarea placeholder="Symptoms" value={formData.symptoms} onChange={(e) => setFormData({...formData, symptoms: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              <button onClick={() => setActiveStep(2)} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Continue</button>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800">Select Specialization</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specializations.map(spec => (
                  <button key={spec} onClick={() => setFormData({...formData, specialization: spec})} className={'p-3 rounded-xl text-sm font-medium transition-all ' + (formData.specialization === spec ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100')}>{spec}</button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActiveStep(1)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl">Back</button>
                <button onClick={() => setActiveStep(3)} disabled={!formData.specialization} className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800">Additional Information</h4>
              <select value={formData.urgency} onChange={(e) => setFormData({...formData, urgency: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="normal">Normal (3-5 days)</option>
                <option value="urgent">Urgent (24-48 hours)</option>
                <option value="emergency">Emergency (Same day)</option>
              </select>
              <textarea placeholder="Additional Notes" value={formData.additionalNotes} onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              <div className="flex gap-3">
                <button onClick={() => setActiveStep(2)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Expert Doctors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expertDoctors.map(doc => (
            <div key={doc.id} className="p-4 rounded-xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <i className="fas fa-user-md text-white text-xl"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{doc.name}</h4>
                  <p className="text-sm text-indigo-600">{doc.specialization}</p>
                  <p className="text-xs text-slate-500">{doc.hospital} • {doc.experience}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-1 text-amber-500">
                  <i className="fas fa-star"></i>
                  <span className="font-semibold">{doc.rating}</span>
                </div>
                <span className="font-bold text-slate-800">₹{doc.fee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Your Requests</h3>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <i className="fas fa-file-medical text-2xl text-slate-400"></i>
            </div>
            <p className="text-slate-500">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="p-4 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800">{req.condition}</h4>
                  <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + getStatusColor(req.status)}>{req.status}</span>
                </div>
                <p className="text-sm text-slate-500">{req.specialization} • {new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondOpinion;
