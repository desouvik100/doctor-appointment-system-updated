import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const AmbulanceBooking = ({ userId, userName, userPhone, userLocation }) => {
  const [activeView, setActiveView] = useState('book');
  const [bookings, setBookings] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    patientName: userName || '', patientPhone: userPhone || '', emergencyType: 'Other', ambulanceType: 'Basic', notes: '',
    pickupLocation: { address: '', latitude: userLocation?.latitude || null, longitude: userLocation?.longitude || null, landmark: '' }
  });

  const emergencyTypes = ['Cardiac', 'Accident', 'Pregnancy', 'Breathing', 'Stroke', 'Other'];
  const ambulanceTypes = [
    { type: 'Basic', desc: 'Basic Life Support', price: '₹500-800', icon: 'fa-ambulance', gradient: 'from-blue-500 to-cyan-600' },
    { type: 'Advanced', desc: 'Advanced Life Support', price: '₹1000-1500', icon: 'fa-heartbeat', gradient: 'from-purple-500 to-violet-600' },
    { type: 'ICU', desc: 'Mobile ICU', price: '₹2000-3000', icon: 'fa-hospital', gradient: 'from-red-500 to-rose-600' },
    { type: 'Neonatal', desc: 'Neonatal Care', price: '₹2500-3500', icon: 'fa-baby', gradient: 'from-pink-500 to-rose-600' }
  ];

  useEffect(() => { fetchBookings(); fetchNearbyHospitals(); }, []);

  const fetchBookings = async () => { try { const r = await axios.get(`/api/ambulance/user/${userId}`); setBookings(r.data); } catch {} };
  const fetchNearbyHospitals = async () => {
    try {
      const params = userLocation?.latitude ? `?lat=${userLocation.latitude}&lng=${userLocation.longitude}` : '';
      const r = await axios.get(`/api/ambulance/nearby-hospitals${params}`);
      setHospitals(r.data);
    } catch {}
  };

  const handleEmergencyCall = () => window.location.href = 'tel:102';

  const handleBookAmbulance = async () => {
    if (!bookingData.patientName || !bookingData.patientPhone) { toast.error('Please fill patient details'); return; }
    setLoading(true);
    try {
      const r = await axios.post('/api/ambulance/book', { userId, ...bookingData });
      toast.success(r.data.message);
      setShowBookingForm(false); fetchBookings(); setActiveView('bookings');
      const { emergencyNumbers } = r.data;
      toast((t) => (<div><strong>🚨 Emergency Numbers:</strong><p>Ambulance: {emergencyNumbers.ambulance}</p><p>Emergency: {emergencyNumbers.nationalEmergency}</p></div>), { duration: 10000 });
    } catch { toast.error('Failed to book ambulance'); }
    finally { setLoading(false); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel?')) return;
    try { await axios.put(`/api/ambulance/cancel/${bookingId}`); toast.success('Booking cancelled'); fetchBookings(); }
    catch { toast.error('Failed to cancel booking'); }
  };

  const getStatusColor = (status) => ({
    'Requested': 'bg-amber-100 text-amber-700', 'Dispatched': 'bg-blue-100 text-blue-700', 'En Route': 'bg-purple-100 text-purple-700',
    'Arrived': 'bg-emerald-100 text-emerald-700', 'Completed': 'bg-green-100 text-green-700', 'Cancelled': 'bg-red-100 text-red-700'
  }[status] || 'bg-slate-100 text-slate-700');

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setBookingData({ ...bookingData, pickupLocation: { ...bookingData.pickupLocation, latitude: position.coords.latitude, longitude: position.coords.longitude } }); toast.success('Location updated'); },
        () => toast.error('Could not get location')
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold">Medical Emergency?</h3>
              <p className="text-red-100">Call 102 immediately for fastest response</p>
            </div>
          </div>
          <button onClick={handleEmergencyCall} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:shadow-lg transition-all">
            <i className="fas fa-phone"></i> Call 102
          </button>
        </div>
      </div>

      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-ambulance text-red-500"></i> Ambulance Service
        </h2>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {[{ id: 'book', icon: 'fa-plus-circle', label: 'Book' }, { id: 'bookings', icon: 'fa-history', label: 'History' }, { id: 'hospitals', icon: 'fa-hospital', label: 'Hospitals' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
              <i className={`fas ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Book View - Type Selection */}
      {activeView === 'book' && !showBookingForm && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Select Ambulance Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ambulanceTypes.map(amb => (
              <div key={amb.type} onClick={() => { setBookingData({...bookingData, ambulanceType: amb.type}); setShowBookingForm(true); }}
                className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-lg ${bookingData.ambulanceType === amb.type ? 'border-indigo-500' : 'border-slate-100 hover:border-indigo-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${amb.gradient} flex items-center justify-center shadow-lg`}>
                    <i className={`fas ${amb.icon} text-white text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{amb.type}</h4>
                    <p className="text-sm text-slate-500">{amb.desc}</p>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">{amb.price}</p>
                  </div>
                  <i className="fas fa-chevron-right text-slate-300"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book View - Form */}
      {activeView === 'book' && showBookingForm && (
        <div className="space-y-4">
          <button onClick={() => setShowBookingForm(false)} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
            <i className="fas fa-arrow-left"></i> Back
          </button>

          <div className={`bg-gradient-to-r ${ambulanceTypes.find(a => a.type === bookingData.ambulanceType)?.gradient} rounded-2xl p-5 text-white flex items-center gap-4`}>
            <i className="fas fa-ambulance text-3xl"></i>
            <span className="text-xl font-bold">{bookingData.ambulanceType} Ambulance</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Patient Name</label>
                <input type="text" value={bookingData.patientName} onChange={(e) => setBookingData({...bookingData, patientName: e.target.value})} placeholder="Enter patient name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input type="tel" value={bookingData.patientPhone} onChange={(e) => setBookingData({...bookingData, patientPhone: e.target.value})} placeholder="Enter phone number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Type</label>
              <select value={bookingData.emergencyType} onChange={(e) => setBookingData({...bookingData, emergencyType: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {emergencyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Address</label>
              <textarea value={bookingData.pickupLocation.address} onChange={(e) => setBookingData({ ...bookingData, pickupLocation: {...bookingData.pickupLocation, address: e.target.value} })}
                placeholder="Enter full pickup address" rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={getCurrentLocation} className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-200 transition-colors">
                <i className="fas fa-location-crosshairs"></i> Use Current Location
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Landmark (Optional)</label>
              <input type="text" value={bookingData.pickupLocation.landmark} onChange={(e) => setBookingData({ ...bookingData, pickupLocation: {...bookingData.pickupLocation, landmark: e.target.value} })}
                placeholder="Nearby landmark" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
              <textarea value={bookingData.notes} onChange={(e) => setBookingData({...bookingData, notes: e.target.value})} placeholder="Any additional information..." rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button onClick={handleBookAmbulance} disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all">
              {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Booking...</> : <><i className="fas fa-ambulance mr-2"></i> Book Ambulance Now</>}
            </button>
          </div>
        </div>
      )}

      {/* Bookings View */}
      {activeView === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className="fas fa-ambulance text-3xl text-slate-400"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No bookings yet</h3>
              <p className="text-slate-500">Your ambulance booking history will appear here</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                      <i className="fas fa-ambulance text-white"></i>
                    </div>
                    <span className="font-bold text-slate-800">{booking.ambulanceType} Ambulance</span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 mb-4">
                  <p className="flex items-center gap-2"><i className="fas fa-user text-indigo-400"></i> {booking.patientName}</p>
                  <p className="flex items-center gap-2"><i className="fas fa-phone text-indigo-400"></i> {booking.patientPhone}</p>
                  <p className="flex items-center gap-2"><i className="fas fa-exclamation-circle text-indigo-400"></i> {booking.emergencyType}</p>
                  <p className="flex items-center gap-2"><i className="fas fa-calendar text-indigo-400"></i> {new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                {booking.driverName && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                    <h4 className="font-semibold text-emerald-800 mb-2">Driver Details</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm text-emerald-700">
                      <p><i className="fas fa-user mr-1"></i> {booking.driverName}</p>
                      <p><i className="fas fa-phone mr-1"></i> {booking.driverPhone}</p>
                      <p><i className="fas fa-car mr-1"></i> {booking.vehicleNumber}</p>
                    </div>
                  </div>
                )}
                {['Requested', 'Dispatched'].includes(booking.status) && (
                  <button onClick={() => handleCancelBooking(booking._id)} className="px-4 py-2 bg-red-100 text-red-600 font-medium rounded-xl hover:bg-red-200 transition-colors">
                    Cancel Booking
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Hospitals View */}
      {activeView === 'hospitals' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-hospital text-indigo-500"></i> Nearby Hospitals
          </h3>
          {hospitals.map((hospital, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-800">{hospital.name}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <i className="fas fa-route text-indigo-400"></i> {hospital.distance}
                    <i className="fas fa-phone text-indigo-400 ml-2"></i> {hospital.phone}
                  </p>
                </div>
                {hospital.emergency && <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">24/7 Emergency</span>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.location.href = `tel:${hospital.phone}`} className="flex-1 py-2 bg-emerald-100 text-emerald-600 font-medium rounded-xl hover:bg-emerald-200 transition-colors">
                  <i className="fas fa-phone mr-2"></i> Call
                </button>
                <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(hospital.name)}`, '_blank')} className="flex-1 py-2 bg-indigo-100 text-indigo-600 font-medium rounded-xl hover:bg-indigo-200 transition-colors">
                  <i className="fas fa-directions mr-2"></i> Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmbulanceBooking;
