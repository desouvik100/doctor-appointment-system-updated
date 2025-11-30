import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './HealthCheckup.css';

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
    name: userName || '',
    age: '',
    gender: '',
    phone: userPhone || '',
    email: userEmail || '',
    address: ''
  });

  useEffect(() => {
    fetchPackages();
    fetchClinics();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    if (selectedClinic && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedClinic, selectedDate]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/health-checkup/packages');
      setPackages(response.data);
    } catch (error) {
      // Use default packages if API fails
      setPackages(getDefaultPackages());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPackages = () => [
    { id: 'basic', name: 'Basic Health Checkup', price: 999, discountedPrice: 799, discount: 20, duration: '2-3 hours', tests: [{name: 'CBC'}, {name: 'Blood Sugar'}, {name: 'Lipid Profile'}, {name: 'Liver Function'}, {name: 'Kidney Function'}, {name: 'Urine Routine'}], fastingRequired: true },
    { id: 'standard', name: 'Standard Health Checkup', price: 1999, discountedPrice: 1499, discount: 25, duration: '3-4 hours', tests: [{name: 'CBC'}, {name: 'Blood Sugar'}, {name: 'HbA1c'}, {name: 'Lipid Profile'}, {name: 'Thyroid'}, {name: 'ECG'}, {name: 'X-Ray'}, {name: 'Liver Function'}, {name: 'Kidney Function'}, {name: 'Urine'}], fastingRequired: true },
    { id: 'comprehensive', name: 'Comprehensive Health Checkup', price: 3999, discountedPrice: 2999, discount: 25, duration: '4-5 hours', tests: [{name: 'CBC'}, {name: 'Blood Sugar'}, {name: 'HbA1c'}, {name: 'Lipid Profile'}, {name: 'Thyroid'}, {name: 'Vitamins'}, {name: 'ECG'}, {name: 'X-Ray'}, {name: 'Ultrasound'}, {name: 'Liver'}, {name: 'Kidney'}, {name: 'Urine'}, {name: 'Iron'}, {name: 'Consultation'}], fastingRequired: true },
    { id: 'executive', name: 'Executive Health Checkup', price: 7999, discountedPrice: 5999, discount: 25, duration: '5-6 hours', tests: [{name: 'Full Body'}, {name: 'Echo'}, {name: 'TMT'}, {name: 'Eye'}, {name: 'Dental'}, {name: 'Diet Consultation'}], fastingRequired: true }
  ];

  const fetchClinics = async () => {
    try {
      const response = await axios.get('/api/clinics');
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await axios.get(`/api/health-checkup/user/${userId}`);
      setMyBookings(response.data);
    } catch (error) {
      // Silently fail - bookings will show empty
      setMyBookings([]);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/api/health-checkup/slots/${selectedClinic}/${selectedDate}`);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleBookCheckup = async () => {
    if (!selectedPackage || !selectedClinic || !selectedDate || !selectedTime) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.phone) {
      toast.error('Please fill patient details');
      return;
    }

    setBooking(true);
    try {
      const response = await axios.post('/api/health-checkup/book', {
        userId,
        clinicId: selectedClinic,
        packageType: selectedPackage.id,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        patientDetails,
        reportDelivery: 'email'
      });

      toast.success('Health checkup booked successfully!');
      setSelectedPackage(null);
      setSelectedClinic('');
      setSelectedDate('');
      setSelectedTime('');
      setActiveView('bookings');
      fetchMyBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book checkup');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await axios.put(`/api/health-checkup/${bookingId}/cancel`, { reason: 'User cancelled' });
      toast.success('Booking cancelled');
      fetchMyBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      in_progress: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Blood: '🩸',
      Diabetes: '💉',
      Heart: '❤️',
      Liver: '🫁',
      Kidney: '🫘',
      Thyroid: '🦋',
      Vitamins: '💊',
      Radiology: '📷',
      Urine: '🧪',
      Stool: '🧫',
      'Cancer Markers': '🔬',
      Consultation: '👨‍⚕️',
      Eye: '👁️',
      Dental: '🦷',
      Bone: '🦴',
      Lungs: '🫁',
      Hormones: '⚗️',
      Gynecology: '🩺',
      ENT: '👂'
    };
    return icons[category] || '🔬';
  };

  if (loading) {
    return (
      <div className="health-checkup__loading">
        <div className="health-checkup__spinner"></div>
        <p>Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="health-checkup">
      <div className="health-checkup__header">
        <div className="health-checkup__title">
          <div className="health-checkup__title-icon">
            <i className="fas fa-stethoscope"></i>
          </div>
          <div>
            <h2>Full Body Health Checkup</h2>
            <p>Comprehensive health packages at partner clinics</p>
          </div>
        </div>
        <div className="health-checkup__tabs">
          <button 
            className={`health-checkup__tab ${activeView === 'packages' ? 'health-checkup__tab--active' : ''}`}
            onClick={() => setActiveView('packages')}
          >
            <i className="fas fa-box"></i> Packages
          </button>
          <button 
            className={`health-checkup__tab ${activeView === 'bookings' ? 'health-checkup__tab--active' : ''}`}
            onClick={() => setActiveView('bookings')}
          >
            <i className="fas fa-calendar-check"></i> My Bookings
            {myBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').length > 0 && (
              <span className="health-checkup__badge">
                {myBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeView === 'packages' && !selectedPackage && (
        <div className="health-checkup__packages">
          {packages.map(pkg => (
            <div key={pkg.id} className="health-checkup__package-card">
              <div className="health-checkup__package-header">
                <h3>{pkg.name}</h3>
                <span className="health-checkup__discount-badge">{pkg.discount}% OFF</span>
              </div>
              <div className="health-checkup__package-price">
                <span className="health-checkup__original-price">₹{pkg.price}</span>
                <span className="health-checkup__discounted-price">₹{pkg.discountedPrice}</span>
              </div>
              <div className="health-checkup__package-info">
                <span><i className="fas fa-clock"></i> {pkg.duration}</span>
                <span><i className="fas fa-vial"></i> {pkg.tests.length} Tests</span>
                {pkg.fastingRequired && <span><i className="fas fa-utensils"></i> Fasting Required</span>}
              </div>
              <div className="health-checkup__tests-preview">
                {pkg.tests.slice(0, 5).map((test, idx) => (
                  <span key={idx} className="health-checkup__test-tag">
                    {getCategoryIcon(test.category)} {test.name}
                  </span>
                ))}
                {pkg.tests.length > 5 && (
                  <span className="health-checkup__more-tests">+{pkg.tests.length - 5} more</span>
                )}
              </div>
              <button 
                className="health-checkup__select-btn"
                onClick={() => setSelectedPackage(pkg)}
              >
                Select Package <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeView === 'packages' && selectedPackage && (
        <div className="health-checkup__booking-form">
          <button className="health-checkup__back-btn" onClick={() => setSelectedPackage(null)}>
            <i className="fas fa-arrow-left"></i> Back to Packages
          </button>

          <div className="health-checkup__selected-package">
            <h3>{selectedPackage.name}</h3>
            <div className="health-checkup__package-price">
              <span className="health-checkup__original-price">₹{selectedPackage.price}</span>
              <span className="health-checkup__discounted-price">₹{selectedPackage.discountedPrice}</span>
            </div>
          </div>

          <div className="health-checkup__tests-list">
            <h4><i className="fas fa-list-check"></i> Included Tests ({selectedPackage.tests.length})</h4>
            <div className="health-checkup__tests-grid">
              {selectedPackage.tests.map((test, idx) => (
                <div key={idx} className="health-checkup__test-item">
                  <span className="health-checkup__test-icon">{getCategoryIcon(test.category)}</span>
                  <span>{test.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="health-checkup__form-section">
            <h4><i className="fas fa-hospital"></i> Select Clinic</h4>
            <select 
              value={selectedClinic} 
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="health-checkup__select"
            >
              <option value="">Choose a clinic</option>
              {clinics.map(clinic => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name} - {clinic.city || clinic.address}
                </option>
              ))}
            </select>
          </div>

          <div className="health-checkup__form-row">
            <div className="health-checkup__form-section">
              <h4><i className="fas fa-calendar"></i> Select Date</h4>
              <input 
                type="date" 
                value={selectedDate}
                min={getMinDate()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="health-checkup__input"
              />
            </div>
            <div className="health-checkup__form-section">
              <h4><i className="fas fa-clock"></i> Select Time</h4>
              <div className="health-checkup__time-slots">
                {availableSlots.length === 0 ? (
                  <p className="health-checkup__no-slots">
                    {selectedClinic && selectedDate ? 'No slots available' : 'Select clinic and date first'}
                  </p>
                ) : (
                  availableSlots.map(slot => (
                    <button
                      key={slot}
                      className={`health-checkup__time-slot ${selectedTime === slot ? 'health-checkup__time-slot--selected' : ''}`}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="health-checkup__form-section">
            <h4><i className="fas fa-user"></i> Patient Details</h4>
            <div className="health-checkup__patient-form">
              <input
                type="text"
                placeholder="Full Name *"
                value={patientDetails.name}
                onChange={(e) => setPatientDetails({...patientDetails, name: e.target.value})}
                className="health-checkup__input"
              />
              <input
                type="number"
                placeholder="Age *"
                value={patientDetails.age}
                onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})}
                className="health-checkup__input"
              />
              <select
                value={patientDetails.gender}
                onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}
                className="health-checkup__select"
              >
                <option value="">Select Gender *</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                type="tel"
                placeholder="Phone Number *"
                value={patientDetails.phone}
                onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})}
                className="health-checkup__input"
              />
              <input
                type="email"
                placeholder="Email"
                value={patientDetails.email}
                onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})}
                className="health-checkup__input"
              />
              <input
                type="text"
                placeholder="Address"
                value={patientDetails.address}
                onChange={(e) => setPatientDetails({...patientDetails, address: e.target.value})}
                className="health-checkup__input health-checkup__input--full"
              />
            </div>
          </div>

          {selectedPackage.fastingRequired && (
            <div className="health-checkup__fasting-notice">
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Fasting Required</strong>
                <p>Please fast for 10-12 hours before the checkup. Only water is allowed.</p>
              </div>
            </div>
          )}

          <div className="health-checkup__summary">
            <div className="health-checkup__summary-row">
              <span>Package Price</span>
              <span className="health-checkup__strike">₹{selectedPackage.price}</span>
            </div>
            <div className="health-checkup__summary-row">
              <span>Discount ({selectedPackage.discount}%)</span>
              <span className="health-checkup__discount">-₹{selectedPackage.price - selectedPackage.discountedPrice}</span>
            </div>
            <div className="health-checkup__summary-row health-checkup__summary-total">
              <span>Total Amount</span>
              <span>₹{selectedPackage.discountedPrice}</span>
            </div>
          </div>

          <button 
            className="health-checkup__book-btn"
            onClick={handleBookCheckup}
            disabled={booking || !selectedClinic || !selectedDate || !selectedTime}
          >
            {booking ? (
              <><i className="fas fa-spinner fa-spin"></i> Booking...</>
            ) : (
              <><i className="fas fa-check"></i> Confirm Booking - ₹{selectedPackage.discountedPrice}</>
            )}
          </button>
        </div>
      )}

      {activeView === 'bookings' && (
        <div className="health-checkup__bookings">
          {myBookings.length === 0 ? (
            <div className="health-checkup__empty">
              <i className="fas fa-calendar-xmark"></i>
              <h3>No Bookings Yet</h3>
              <p>Book your first health checkup package</p>
              <button onClick={() => setActiveView('packages')}>
                <i className="fas fa-box"></i> View Packages
              </button>
            </div>
          ) : (
            myBookings.map(booking => (
              <div key={booking._id} className="health-checkup__booking-card">
                <div className="health-checkup__booking-header">
                  <h4>{booking.packageName}</h4>
                  <span 
                    className="health-checkup__status"
                    style={{ backgroundColor: `${getStatusColor(booking.status)}20`, color: getStatusColor(booking.status) }}
                  >
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="health-checkup__booking-details">
                  <div className="health-checkup__booking-detail">
                    <i className="fas fa-hospital"></i>
                    <span>{booking.clinicId?.name || 'Clinic'}</span>
                  </div>
                  <div className="health-checkup__booking-detail">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="health-checkup__booking-detail">
                    <i className="fas fa-clock"></i>
                    <span>{booking.scheduledTime}</span>
                  </div>
                  <div className="health-checkup__booking-detail">
                    <i className="fas fa-rupee-sign"></i>
                    <span>₹{booking.price?.discounted || booking.price?.original}</span>
                  </div>
                </div>
                <div className="health-checkup__booking-tests">
                  <span>{booking.tests?.length || 0} tests included</span>
                </div>
                {booking.status === 'pending' && (
                  <button 
                    className="health-checkup__cancel-btn"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    <i className="fas fa-times"></i> Cancel Booking
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
