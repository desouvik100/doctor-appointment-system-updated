import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const HealthCheckup = ({ userId, userName, userEmail, userPhone }) => {
  const [packages, setPackages] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [activeView, setActiveView] = useState('packages');
  const [patientDetails, setPatientDetails] = useState({
    name: userName || '', age: '', gender: '', phone: userPhone || '', email: userEmail || '', address: ''
  });

  useEffect(() => { fetchPackages(); fetchClinics(); fetchMyBookings(); }, []);
  useEffect(() => { if (selectedClinic && selectedDate) fetchAvailableSlots(); }, [selectedClinic, selectedDate]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/health-checkup/packages');
      setPackages(response.data);
    } catch { setPackages(getDefaultPackages()); }
    finally { setLoading(false); }
  };

  const getDefaultPackages = () => [
    { id: 'basic', name: 'Basic Health Checkup', price: 999, discountedPrice: 799, discount: 20, duration: '2-3 hours', tests: [{name: 'CBC'}, {name: 'Blood Sugar'}, {name: 'Lipid Profile'}, {name: 'Liver Function'}, {name: 'Kidney Function'}, {name: 'Urine Routine'}], fastingRequired: true },
    { id: 'standard', name: 'Standard Health Checkup', price: 1999, discountedPrice: 1499, discount: 25, duration: '3-4 hours', tests: [{name: 'CBC'}, {name: 'Blood Sugar'}, {name: 'HbA1c'}, {name: 'Lipid Profile'}, {name: 'Thyroid'}, {name: 'ECG'}, {name: 'X-Ray'}, {name: 'Liver Function'}, {name: 'Kidney Function'}, {name: 'Urine'}], fastingRequired: true },
    { id: 'comprehensive', name: 'Comprehensive Health Checkup', price: 3999, discountedPrice: 2999, discount: 25, duration: '4-5 hours', tests: [{name: 'CBC'}, {name: 'Blood Sugar'}, {name: 'HbA1c'}, {name: 'Lipid Profile'}, {name: 'Thyroid'}, {name: 'Vitamins'}, {name: 'ECG'}, {name: 'X-Ray'}, {name: 'Ultrasound'}, {name: 'Liver'}, {name: 'Kidney'}, {name: 'Urine'}, {name: 'Iron'}, {name: 'Consultation'}], fastingRequired: true },
    { id: 'executive', name: 'Executive Health Checkup', price: 7999, discountedPrice: 5999, discount: 25, duration: '5-6 hours', tests: [{name: 'Full Body'}, {name: 'Echo'}, {name: 'TMT'}, {name: 'Eye'}, {name: 'Dental'}, {name: 'Diet Consultation'}], fastingRequired: true }
  ];

  const fetchClinics = async () => { try { const r = await axios.get('/api/clinics'); setClinics(r.data); } catch {} };
  const fetchMyBookings = async () => { try { const r = await axios.get(`/api/health-checkup/user/${userId}`); setMyBookings(r.data); } catch { setMyBookings([]); } };
  const fetchAvailableSlots = async () => { try { const r = await axios.get(`/api/health-checkup/slots/${selectedClinic}/${selectedDate}`); setAvailableSlots(r.data.availableSlots); } catch { setAvailableSlots([]); } };

  const handleBookCheckup = async () => {
    if (!selectedPackage || !selectedClinic || !selectedDate || !selectedTime) { toast.error('Please fill all required fields'); return; }
    if (!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.phone) { toast.error('Please fill patient details'); return; }
    setBooking(true);
    try {
      await axios.post('/api/health-checkup/book', { userId, clinicId: selectedClinic, packageType: selectedPackage.id, scheduledDate: selectedDate, scheduledTime: selectedTime, patientDetails, reportDelivery: 'email' });
      toast.success('Health checkup booked successfully!');
      setSelectedPackage(null); setSelectedClinic(''); setSelectedDate(''); setSelectedTime(''); setActiveView('bookings'); fetchMyBookings();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to book checkup'); }
    finally { setBooking(false); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try { await axios.put(`/api/health-checkup/${bookingId}/cancel`, { reason: 'User cancelled' }); toast.success('Booking cancelled'); fetchMyBookings(); }
    catch { toast.error('Failed to cancel booking'); }
  };

  const getMinDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };
  const getStatusColor = (status) => ({ pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' }[status] || 'bg-slate-100 text-slate-700');

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500">Loading packages...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <i className="fas fa-stethoscope text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Full Body Health Checkup</h2>
            <p className="text-sm text-slate-500">Comprehensive health packages at partner clinics</p>
          </div>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'packages', icon: 'fa-box', label: 'Packages' },
            { id: 'bookings', icon: 'fa-calendar-check', label: 'My Bookings', badge: myBookings.filter(b => !['cancelled', 'completed'].includes(b.status)).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeView === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <i className={`fas ${tab.icon}`}></i> {tab.label}
              {tab.badge > 0 && <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Packages View */}
      {activeView === 'packages' && !selectedPackage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">{pkg.name}</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{pkg.discount}% OFF</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-sm text-slate-400 line-through">₹{pkg.price}</span>
                <span className="text-3xl font-bold text-indigo-600">₹{pkg.discountedPrice}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1"><i className="fas fa-clock text-indigo-400"></i> {pkg.duration}</span>
                <span className="flex items-center gap-1"><i className="fas fa-vial text-indigo-400"></i> {pkg.tests.length} Tests</span>
                {pkg.fastingRequired && <span className="flex items-center gap-1"><i className="fas fa-utensils text-amber-400"></i> Fasting</span>}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {pkg.tests.slice(0, 4).map((test, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">{test.name}</span>
                ))}
                {pkg.tests.length > 4 && <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-lg">+{pkg.tests.length - 4} more</span>}
              </div>
              <button onClick={() => setSelectedPackage(pkg)} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                Select Package <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Form */}
      {activeView === 'packages' && selectedPackage && (
        <div className="space-y-6">
          <button onClick={() => setSelectedPackage(null)} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
            <i className="fas fa-arrow-left"></i> Back to Packages
          </button>

          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">{selectedPackage.name}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-white/60 line-through">₹{selectedPackage.price}</span>
              <span className="text-3xl font-bold">₹{selectedPackage.discountedPrice}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-list-check text-indigo-500"></i> Included Tests ({selectedPackage.tests.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedPackage.tests.map((test, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                  <i className="fas fa-check text-emerald-500"></i> {test.name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-hospital text-indigo-500"></i> Select Clinic</h4>
            <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Choose a clinic</option>
              {clinics.map(c => <option key={c._id} value={c._id}>{c.name} - {c.city || c.address}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-calendar text-indigo-500"></i> Select Date</h4>
              <input type="date" value={selectedDate} min={getMinDate()} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-clock text-indigo-500"></i> Select Time</h4>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-slate-500">{selectedClinic && selectedDate ? 'No slots available' : 'Select clinic and date first'}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map(slot => (
                    <button key={slot} onClick={() => setSelectedTime(slot)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedTime === slot ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100'}`}>{slot}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-user text-indigo-500"></i> Patient Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name *" value={patientDetails.name} onChange={(e) => setPatientDetails({...patientDetails, name: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="number" placeholder="Age *" value={patientDetails.age} onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={patientDetails.gender} onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Gender *</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input type="tel" placeholder="Phone Number *" value={patientDetails.phone} onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="email" placeholder="Email" value={patientDetails.email} onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="Address" value={patientDetails.address} onChange={(e) => setPatientDetails({...patientDetails, address: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {selectedPackage.fastingRequired && (
            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <i className="fas fa-exclamation-triangle text-amber-500 text-xl mt-0.5"></i>
              <div>
                <p className="font-semibold text-amber-800">Fasting Required</p>
                <p className="text-sm text-amber-700">Please fast for 10-12 hours before the checkup. Only water is allowed.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex justify-between text-slate-600 mb-2"><span>Package Price</span><span className="line-through">₹{selectedPackage.price}</span></div>
            <div className="flex justify-between text-emerald-600 mb-2"><span>Discount ({selectedPackage.discount}%)</span><span>-₹{selectedPackage.price - selectedPackage.discountedPrice}</span></div>
            <div className="flex justify-between text-xl font-bold text-slate-800 pt-3 border-t"><span>Total Amount</span><span>₹{selectedPackage.discountedPrice}</span></div>
          </div>

          <button onClick={handleBookCheckup} disabled={booking || !selectedClinic || !selectedDate || !selectedTime} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {booking ? <><i className="fas fa-spinner fa-spin mr-2"></i> Booking...</> : <><i className="fas fa-check mr-2"></i> Confirm Booking - ₹{selectedPackage.discountedPrice}</>}
          </button>
        </div>
      )}

      {/* Bookings View */}
      {activeView === 'bookings' && (
        <div className="space-y-4">
          {myBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className="fas fa-calendar-xmark text-3xl text-slate-400"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Bookings Yet</h3>
              <p className="text-slate-500 mb-6">Book your first health checkup package</p>
              <button onClick={() => setActiveView('packages')} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                <i className="fas fa-box mr-2"></i> View Packages
              </button>
            </div>
          ) : (
            myBookings.map(b => (
              <div key={b._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-bold text-slate-800">{b.packageName}</h4>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(b.status)}`}>{b.status.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1"><i className="fas fa-hospital text-indigo-400"></i> {b.clinicId?.name || 'Clinic'}</span>
                  <span className="flex items-center gap-1"><i className="fas fa-calendar text-indigo-400"></i> {new Date(b.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><i className="fas fa-clock text-indigo-400"></i> {b.scheduledTime}</span>
                  <span className="flex items-center gap-1"><i className="fas fa-rupee-sign text-indigo-400"></i> ₹{b.price?.discounted || b.price?.original}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{b.tests?.length || 0} tests included</p>
                {b.status === 'pending' && (
                  <button onClick={() => handleCancelBooking(b._id)} className="px-4 py-2 bg-red-100 text-red-600 font-medium rounded-xl hover:bg-red-200 transition-colors">
                    <i className="fas fa-times mr-2"></i> Cancel Booking
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HealthCheckup;
