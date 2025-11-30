import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './AmbulanceBooking.css';

const AmbulanceBooking = ({ userId, userName, userPhone, userLocation }) => {
  const [activeView, setActiveView] = useState('book');
  const [bookings, setBookings] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    patientName: userName || '',
    patientPhone: userPhone || '',
    emergencyType: 'Other',
    ambulanceType: 'Basic',
    notes: '',
    pickupLocation: {
      address: '',
      latitude: userLocation?.latitude || null,
      longitude: userLocation?.longitude || null,
      landmark: ''
    }
  });

  const emergencyTypes = ['Cardiac', 'Accident', 'Pregnancy', 'Breathing', 'Stroke', 'Other'];
  const ambulanceTypes = [
    { type: 'Basic', desc: 'Basic Life Support', price: '₹500-800' },
    { type: 'Advanced', desc: 'Advanced Life Support', price: '₹1000-1500' },
    { type: 'ICU', desc: 'Mobile ICU', price: '₹2000-3000' },
    { type: 'Neonatal', desc: 'Neonatal Care', price: '₹2500-3500' }
  ];

  useEffect(() => {
    fetchBookings();
    fetchNearbyHospitals();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`/api/ambulance/user/${userId}`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchNearbyHospitals = async () => {
    try {
      const params = userLocation?.latitude 
        ? `?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
        : '';
      const response = await axios.get(`/api/ambulance/nearby-hospitals${params}`);
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const handleEmergencyCall = () => {
    window.location.href = 'tel:102';
  };

  const handleBookAmbulance = async () => {
    if (!bookingData.patientName || !bookingData.patientPhone) {
      toast.error('Please fill patient details');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/ambulance/book', {
        userId,
        ...bookingData
      });

      toast.success(response.data.message);
      setShowBookingForm(false);
      fetchBookings();
      setActiveView('bookings');
      
      // Show emergency numbers
      const { emergencyNumbers } = response.data;
      toast((t) => (
        <div>
          <strong>🚨 Emergency Numbers:</strong>
          <p>Ambulance: {emergencyNumbers.ambulance}</p>
          <p>Emergency: {emergencyNumbers.nationalEmergency}</p>
        </div>
      ), { duration: 10000 });
    } catch (error) {
      toast.error('Failed to book ambulance');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel?')) return;
    try {
      await axios.put(`/api/ambulance/cancel/${bookingId}`);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Requested': '#f59e0b',
      'Dispatched': '#3b82f6',
      'En Route': '#8b5cf6',
      'Arrived': '#10b981',
      'Completed': '#22c55e',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBookingData({
            ...bookingData,
            pickupLocation: {
              ...bookingData.pickupLocation,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
          toast.success('Location updated');
        },
        () => toast.error('Could not get location')
      );
    }
  };

  return (
    <div className="ambulance-booking">
      {/* Emergency Banner */}
      <div className="ambulance-booking__emergency-banner">
        <div className="ambulance-booking__emergency-content">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <h3>Medical Emergency?</h3>
            <p>Call 102 immediately for fastest response</p>
          </div>
        </div>
        <button className="ambulance-booking__call-btn" onClick={handleEmergencyCall}>
          <i className="fas fa-phone"></i> Call 102
        </button>
      </div>

      <div className="ambulance-booking__header">
        <h2><i className="fas fa-ambulance"></i> Ambulance Service</h2>
        <div className="ambulance-booking__tabs">
          <button 
            className={activeView === 'book' ? 'active' : ''}
            onClick={() => setActiveView('book')}
          >
            <i className="fas fa-plus-circle"></i> Book
          </button>
          <button 
            className={activeView === 'bookings' ? 'active' : ''}
            onClick={() => setActiveView('bookings')}
          >
            <i className="fas fa-history"></i> History
          </button>
          <button 
            className={activeView === 'hospitals' ? 'active' : ''}
            onClick={() => setActiveView('hospitals')}
          >
            <i className="fas fa-hospital"></i> Hospitals
          </button>
        </div>
      </div>

      {activeView === 'book' && !showBookingForm && (
        <div className="ambulance-booking__types">
          <h3>Select Ambulance Type</h3>
          <div className="ambulance-booking__types-grid">
            {ambulanceTypes.map(amb => (
              <div 
                key={amb.type} 
                className={`ambulance-type-card ${bookingData.ambulanceType === amb.type ? 'selected' : ''}`}
                onClick={() => {
                  setBookingData({...bookingData, ambulanceType: amb.type});
                  setShowBookingForm(true);
                }}
              >
                <div className="ambulance-type-card__icon">
                  <i className="fas fa-ambulance"></i>
                </div>
                <h4>{amb.type}</h4>
                <p>{amb.desc}</p>
                <span className="ambulance-type-card__price">{amb.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'book' && showBookingForm && (
        <div className="ambulance-booking__form">
          <button className="ambulance-booking__back" onClick={() => setShowBookingForm(false)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          
          <div className="ambulance-booking__selected-type">
            <i className="fas fa-ambulance"></i>
            <span>{bookingData.ambulanceType} Ambulance</span>
          </div>

          <div className="ambulance-booking__form-group">
            <label>Patient Name</label>
            <input 
              type="text"
              value={bookingData.patientName}
              onChange={(e) => setBookingData({...bookingData, patientName: e.target.value})}
              placeholder="Enter patient name"
            />
          </div>

          <div className="ambulance-booking__form-group">
            <label>Phone Number</label>
            <input 
              type="tel"
              value={bookingData.patientPhone}
              onChange={(e) => setBookingData({...bookingData, patientPhone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>

          <div className="ambulance-booking__form-group">
            <label>Emergency Type</label>
            <select 
              value={bookingData.emergencyType}
              onChange={(e) => setBookingData({...bookingData, emergencyType: e.target.value})}
            >
              {emergencyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="ambulance-booking__form-group">
            <label>Pickup Address</label>
            <textarea 
              value={bookingData.pickupLocation.address}
              onChange={(e) => setBookingData({
                ...bookingData, 
                pickupLocation: {...bookingData.pickupLocation, address: e.target.value}
              })}
              placeholder="Enter full pickup address"
              rows={3}
            />
            <button className="ambulance-booking__location-btn" onClick={getCurrentLocation}>
              <i className="fas fa-location-crosshairs"></i> Use Current Location
            </button>
          </div>

          <div className="ambulance-booking__form-group">
            <label>Landmark (Optional)</label>
            <input 
              type="text"
              value={bookingData.pickupLocation.landmark}
              onChange={(e) => setBookingData({
                ...bookingData, 
                pickupLocation: {...bookingData.pickupLocation, landmark: e.target.value}
              })}
              placeholder="Nearby landmark"
            />
          </div>

          <div className="ambulance-booking__form-group">
            <label>Additional Notes</label>
            <textarea 
              value={bookingData.notes}
              onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
              placeholder="Any additional information..."
              rows={2}
            />
          </div>

          <button 
            className="ambulance-booking__submit"
            onClick={handleBookAmbulance}
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Booking...</>
            ) : (
              <><i className="fas fa-ambulance"></i> Book Ambulance Now</>
            )}
          </button>
        </div>
      )}

      {activeView === 'bookings' && (
        <div className="ambulance-booking__history">
          {bookings.length === 0 ? (
            <div className="ambulance-booking__empty">
              <i className="fas fa-ambulance"></i>
              <h3>No bookings yet</h3>
              <p>Your ambulance booking history will appear here</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <div className="booking-card__header">
                  <div className="booking-card__type">
                    <i className="fas fa-ambulance"></i>
                    <span>{booking.ambulanceType} Ambulance</span>
                  </div>
                  <span 
                    className="booking-card__status"
                    style={{ background: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </span>
                </div>
                
                <div className="booking-card__details">
                  <p><i className="fas fa-user"></i> {booking.patientName}</p>
                  <p><i className="fas fa-phone"></i> {booking.patientPhone}</p>
                  <p><i className="fas fa-exclamation-circle"></i> {booking.emergencyType}</p>
                  <p><i className="fas fa-calendar"></i> {new Date(booking.createdAt).toLocaleString()}</p>
                </div>

                {booking.driverName && (
                  <div className="booking-card__driver">
                    <h4>Driver Details</h4>
                    <p><i className="fas fa-user"></i> {booking.driverName}</p>
                    <p><i className="fas fa-phone"></i> {booking.driverPhone}</p>
                    <p><i className="fas fa-car"></i> {booking.vehicleNumber}</p>
                  </div>
                )}

                {['Requested', 'Dispatched'].includes(booking.status) && (
                  <button 
                    className="booking-card__cancel"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeView === 'hospitals' && (
        <div className="ambulance-booking__hospitals">
          <h3><i className="fas fa-hospital"></i> Nearby Hospitals</h3>
          {hospitals.map((hospital, index) => (
            <div key={index} className="hospital-card">
              <div className="hospital-card__info">
                <h4>{hospital.name}</h4>
                <p><i className="fas fa-route"></i> {hospital.distance}</p>
                <p><i className="fas fa-phone"></i> {hospital.phone}</p>
              </div>
              {hospital.emergency && (
                <span className="hospital-card__emergency">24/7 Emergency</span>
              )}
              <div className="hospital-card__actions">
                <button onClick={() => window.location.href = `tel:${hospital.phone}`}>
                  <i className="fas fa-phone"></i> Call
                </button>
                <button onClick={() => {
                  const url = `https://www.google.com/maps/search/${encodeURIComponent(hospital.name)}`;
                  window.open(url, '_blank');
                }}>
                  <i className="fas fa-directions"></i> Directions
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
