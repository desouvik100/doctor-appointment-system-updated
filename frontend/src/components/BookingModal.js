// frontend/src/components/BookingModal.js
import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import './BookingModal.css';

// SVG Lucide Icons for Premium UI
const Icons = {
  Calendar: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Verified: () => (
    <svg className="w-4.5 h-4.5 text-sky-500 fill-sky-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 11 2 2 4-4"></path>
    </svg>
  ),
  Star: () => (
    <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  Video: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z"></path>
      <rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect>
    </svg>
  ),
  MapPin: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"></path>
    </svg>
  ),
  Check: () => (
    <svg className="w-4.5 h-4.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Stethoscope: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.8C3.5 2.1 2 3.1 2 4.6V15c0 3.3 2.7 6 6 6s6-2.7 6-6V5c0-1.7 1.3-3 3-3s3 1.3 3 3v3"></path>
      <path d="M14 10h4"></path>
      <circle cx="20" cy="10" r="2"></circle>
      <path d="M12 15h2a4 4 0 0 0 4-4v-1"></path>
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <line x1="9" y1="22" x2="9" y2="16"></line>
      <line x1="15" y1="22" x2="15" y2="16"></line>
      <line x1="9" y1="16" x2="15" y2="16"></line>
      <path d="M8 6h2v2H8V6Z"></path>
      <path d="M14 6h2v2h-2V6Z"></path>
      <path d="M8 10h2v2H8v-2Z"></path>
      <path d="M14 10h2v2h-2v-2Z"></path>
    </svg>
  ),
  Info: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  Receipt: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path>
      <path d="M16 8H8"></path>
      <path d="M16 12H8"></path>
      <path d="M13 16H8"></path>
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const BookingModal = ({ doctor, user, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('in_person');
  const [reason, setReason] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [availability, setAvailability] = useState(null);
  
  // Payment state
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch payment config on mount
  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  // Fetch booked times and available slots when date changes
  useEffect(() => {
    if (selectedDate && doctor?._id) {
      fetchBookedTimes();
      fetchAvailableSlots();
    }
  }, [selectedDate, doctor]);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayAvailable, setDayAvailable] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState('');

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      const response = await axios.get(`/api/doctors/${doctor._id}/available-slots?date=${selectedDate}`);
      if (response.data.success) {
        if (response.data.available) {
          setDayAvailable(true);
          setAvailableSlots(response.data.slots || []);
        } else {
          setDayAvailable(false);
          setUnavailableReason(response.data.reason || 'Doctor not available on this date');
          setAvailableSlots([]);
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setDayAvailable(true);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const response = await axios.get('/api/payments/config');
      setPaymentConfig(response.data);
      console.log('Payment config:', response.data);
    } catch (error) {
      console.error('Error fetching payment config:', error);
    }
  };

  // Check availability when time changes
  useEffect(() => {
    if (selectedTime && selectedDate && doctor?._id) {
      checkTimeAvailability();
    } else {
      setAvailability(null);
    }
  }, [selectedTime]);

  const fetchBookedTimes = async () => {
    try {
      const response = await axios.get(`/api/appointments/booked-times/${doctor._id}/${selectedDate}`);
      setBookedTimes(response.data.bookedTimes || []);
    } catch (error) {
      console.error('Error fetching booked times:', error);
    }
  };

  const checkTimeAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const response = await axios.post('/api/appointments/check-availability', {
        doctorId: doctor._id,
        date: selectedDate,
        time: selectedTime
      });
      setAvailability(response.data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({ available: false, message: 'Error checking availability' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const generateTimeSlots = () => {
    if (availableSlots.length > 0) {
      return availableSlots.map(slot => ({
        time: slot.time,
        booked: bookedTimes.includes(slot.time) || !slot.available,
        label: formatTime(slot.time),
        type: slot.type // 'in-clinic', 'virtual', or 'both'
      }));
    }
    
    // Fallback to default slots
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          booked: bookedTimes.includes(timeStr),
          label: formatTime(timeStr),
          type: 'both'
        });
      }
    }
    return slots;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (availability && !availability.available) {
      toast.error('Selected time is not available');
      return;
    }

    try {
      setLoading(true);
      
      const appointmentPayload = {
        userId: user.id,
        doctorId: doctor._id,
        clinicId: doctor.clinicId?._id || doctor.clinicId,
        date: selectedDate,
        time: selectedTime,
        reason,
        consultationType
      };

      const response = await axios.post('/api/appointments', appointmentPayload);
      
      if (paymentConfig?.paymentsEnabled && paymentConfig?.keyId) {
        setAppointmentData(response.data);
        setShowPayment(true);
        setStep(4); // Move to payment screen
        setLoading(false);
      } else {
        toast.success('Appointment booked successfully!');
        if (consultationType === 'online') {
          toast.success('Meet link will be sent to your email', {
            duration: 5000,
            icon: '🎥'
          });
        }
        onSuccess(response.data);
        onClose();
      }
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!appointmentData) return;
    
    try {
      setLoading(true);
      
      const orderResponse = await axios.post('/api/payments/create-order', {
        appointmentId: appointmentData._id,
        userId: user.id
      });
      
      if (orderResponse.data.testMode) {
        toast.success('Appointment confirmed!');
        onSuccess(appointmentData);
        onClose();
        return;
      }
      
      const order = orderResponse.data;
      
      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'HealthSync',
        description: `Consultation with Dr. ${doctor.name}`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointmentData._id
            });
            
            if (verifyResponse.data.success) {
              toast.success('Payment successful! Appointment confirmed.');
              if (consultationType === 'online') {
                toast.success('Meet link will be sent to your email', {
                  duration: 5000,
                  icon: '🎥'
                });
              }
              onSuccess(appointmentData);
              onClose();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#0ea5e9'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed');
        setLoading(false);
      });
      razorpay.open();
      setLoading(false);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  const timeSlots = generateTimeSlots();

  // Calculate fees
  const consultationFee = doctor?.consultationFee || 500;
  const gst = Math.round(consultationFee * 0.22);
  const platformFee = Math.round(consultationFee * 0.07);
  const totalAmount = consultationFee + gst + platformFee;

  const isContinueDisabled = () => {
    if (step === 1) {
      return !selectedDate || !selectedTime || (availability && !availability.available);
    }
    if (step === 2) {
      return !reason;
    }
    return false;
  };

  const getFooterSelectionText = () => {
    if (step === 1) {
      if (selectedDate && selectedTime) {
        return `${formatDate(selectedDate).split(',')[1].trim()} at ${formatTime(selectedTime)}`;
      }
      if (selectedDate) return formatDate(selectedDate);
      return 'Select slot to begin';
    }
    if (step === 2) {
      const typeText = consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit';
      return `${typeText} • ${selectedTime}`;
    }
    if (step === 3) {
      return 'Review your summary';
    }
    return 'Complete Payment';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-hidden">
      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col relative max-h-[calc(100vh-2rem)] overflow-hidden z-10"
      >
        {/* Floating background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            className="absolute w-24 h-24 rounded-full bg-sky-400/5 dark:bg-sky-500/5 blur-xl"
            animate={{ x: [0, 30, -15, 0], y: [0, -20, 15, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{ top: '10%', left: '5%' }}
          />
          <motion.div 
            className="absolute w-36 h-36 rounded-full bg-teal-400/5 dark:bg-teal-500/5 blur-2xl"
            animate={{ x: [0, -20, 30, 0], y: [0, 15, -25, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ bottom: '15%', right: '10%' }}
          />
          <motion.div 
            className="absolute text-sky-500/5 dark:text-sky-400/5"
            animate={{ rotate: 360, y: [0, -8, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ top: '35%', right: '20%' }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </motion.div>
        </div>

        {/* Header (White/Premium) */}
        <div className="px-6 pt-6 pb-4 sm:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-4 text-left">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
              <img 
                src={doctor?.profilePhoto || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face`} 
                alt={doctor?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor?.name || 'Doctor')}&background=0ea5e9&color=fff&size=150&bold=true`;
                }}
              />
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></span>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Dr. {doctor?.name}
                </h2>
                <Icons.Verified />
              </div>
              
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-sky-600 dark:text-sky-400">{doctor?.specialization}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                  <Icons.Star />
                  <span>{doctor?.rating || '4.8'}</span>
                  <span className="text-slate-400 text-[10px]">({doctor?.reviewCount || '150'}+ reviews)</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                <Icons.Building />
                <span className="truncate max-w-[200px] sm:max-w-[320px]">{doctor?.clinicId?.name || 'HealthSync Clinic & Diagnostics'}</span>
              </div>
            </div>
          </div>
          
          <button 
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 self-end sm:self-center" 
            onClick={onClose}
            aria-label="Close booking modal"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-4 sm:px-8 border-b border-slate-50 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/20 z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 px-1">
            <span className={step >= 1 ? 'text-sky-600 dark:text-sky-400 font-bold' : ''}>1. Date & Time</span>
            <span className={step >= 2 ? 'text-sky-600 dark:text-sky-400 font-bold' : ''}>2. Details</span>
            <span className={step >= 3 ? 'text-sky-600 dark:text-sky-400 font-bold' : ''}>3. Review & Confirm</span>
          </div>
          <div className="relative w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-teal-500"
              initial={{ width: '16.6%' }}
              animate={{ width: step === 1 ? '16.6%' : step === 2 ? '50%' : step === 3 ? '83.3%' : '100%' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 booking-modal-scroll z-10 text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Step 1: Date & Time Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Date Input Card */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Icons.Calendar />
                      Select Date
                    </label>
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/85 dark:border-slate-850 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4 cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <Icons.Calendar />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium leading-none mb-1">Appointment Date</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {selectedDate ? formatDate(selectedDate) : "Select consultation date..."}
                          </p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <input
                        type="date"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime('');
                          setAvailability(null);
                        }}
                        min={getMinDate()}
                        max={getMaxDate()}
                        aria-label="Appointment Date"
                      />
                    </div>
                  </div>

                  {/* Time Selector Section */}
                  {selectedDate && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Custom Time Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Icons.Clock />
                          Custom Time
                        </label>
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/85 dark:border-slate-850 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4 cursor-pointer flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                              <Icons.Clock />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium leading-none mb-1">Custom Time Selection</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {selectedTime ? formatTime(selectedTime) : "Select custom consultation time..."}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {checkingAvailability && (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-500 border-t-transparent"></div>
                            )}
                            {availability && !checkingAvailability && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${availability.available ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                                {availability.available ? 'Available' : 'Booked'}
                              </span>
                            )}
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <input
                            type="time"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            min="09:00"
                            max="18:00"
                            aria-label="Appointment Custom Time"
                          />
                        </div>
                      </div>

                      {/* Quick Select Slots */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <Icons.Sparkles />
                            Quick Select Slot
                          </label>
                          
                          {/* Legend */}
                          <div className="flex gap-3 text-[10px] font-semibold text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span> Available</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"></span> Booked</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Selected</span>
                          </div>
                        </div>

                        {slotsLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent mb-2"></div>
                            <span className="text-xs text-slate-400 font-medium">Fetching available slots...</span>
                          </div>
                        ) : !dayAvailable ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850 text-center">
                            <Icons.Info />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">{unavailableReason}</p>
                            <span className="text-xs text-slate-400 mt-1">Please select another date from the calendar.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                className={`relative group rounded-xl py-3 px-2 border text-center transition-all ${
                                  slot.booked 
                                    ? 'bg-slate-50/70 dark:bg-slate-900/10 border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                    : selectedTime === slot.time
                                      ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/30 active:scale-[0.97]'
                                }`}
                                onClick={() => !slot.booked && setSelectedTime(slot.time)}
                                disabled={slot.booked}
                                title={slot.type === 'virtual' ? 'Virtual only' : slot.type === 'in-clinic' ? 'In-clinic only' : 'Both types available'}
                              >
                                <span className="text-xs font-semibold">{slot.label}</span>
                                {slot.type && slot.type !== 'both' && (
                                  <div className="absolute top-1 right-1 opacity-40 group-hover:opacity-80 transition-opacity">
                                    {slot.type === 'virtual' ? <Icons.Video /> : <Icons.Building />}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Consultation Details */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Selectable Cards */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Icons.Stethoscope />
                      Consultation Modality
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Modality Card 1: In-Clinic */}
                      <button
                        type="button"
                        className={`w-full text-left p-5 rounded-[20px] border transition-all duration-300 relative group flex flex-col justify-between overflow-hidden ${
                          consultationType === 'in_person'
                            ? 'border-sky-500 bg-sky-50/10 dark:bg-sky-950/10 shadow-lg shadow-sky-100/30 dark:shadow-none translate-y-[-4px]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:translate-y-[-2px]'
                        }`}
                        onClick={() => setConsultationType('in_person')}
                      >
                        {consultationType === 'in_person' && (
                          <span className="absolute top-0 right-0 w-20 h-20 bg-sky-400/10 rounded-full blur-xl pointer-events-none"></span>
                        )}
                        
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              consultationType === 'in_person' ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              <Icons.Building />
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Fee</span>
                              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">₹{consultationFee}</p>
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">In-Clinic Visit</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">Visit the doctor face-to-face at the clinical facility for physical evaluation.</p>
                          
                          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                              <Icons.Check />
                              <span>Physical exam & diagnostics</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                              <Icons.Check />
                              <span>EMR check and printout</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span>30 mins</span>
                          <span>~10 mins wait</span>
                        </div>
                      </button>

                      {/* Modality Card 2: Online */}
                      <button
                        type="button"
                        className={`w-full text-left p-5 rounded-[20px] border transition-all duration-300 relative group flex flex-col justify-between overflow-hidden ${
                          consultationType === 'online'
                            ? 'border-sky-500 bg-sky-50/10 dark:bg-sky-950/10 shadow-lg shadow-sky-100/30 dark:shadow-none translate-y-[-4px]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:translate-y-[-2px]'
                        }`}
                        onClick={() => setConsultationType('online')}
                      >
                        {consultationType === 'online' && (
                          <span className="absolute top-0 right-0 w-20 h-20 bg-sky-400/10 rounded-full blur-xl pointer-events-none"></span>
                        )}
                        
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              consultationType === 'online' ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              <Icons.Video />
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Fee</span>
                              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">₹{consultationFee}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Online Consultation</h4>
                            <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              ⚡ Auto Meet
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">High-definition, secure online video consultation via Google Meet from home.</p>
                          
                          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                              <Icons.Check />
                              <span>No travel (instant start)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                              <Icons.Check />
                              <span>HIPAA-secure connection</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span>20 mins</span>
                          <span>Instant / No wait</span>
                        </div>
                      </button>
                    </div>

                    {/* Google Meet Info Strip */}
                    {consultationType === 'online' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex gap-3 p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/30 rounded-2xl text-xs text-slate-600 dark:text-slate-400"
                      >
                        <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icons.Info />
                        </div>
                        <div>
                          <strong className="font-semibold text-slate-800 dark:text-slate-200">Google Meet Integration</strong>
                          <p className="mt-0.5">A virtual link will be generated automatically. You'll receive details and link access 18 minutes prior to slot timing.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Reason Textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Icons.Receipt />
                      Reason for Consultation
                    </label>
                    <textarea
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                      placeholder="Describe your symptoms, concern, or booking reason..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      aria-label="Reason for Visit"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation Summary */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Summary Grid */}
                  <div className="bg-slate-50/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-5 rounded-[20px] space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-850">
                      <Icons.Sparkles />
                      Appointment Summary
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <Icons.User />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">Doctor Name</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">Dr. {doctor?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <Icons.Stethoscope />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">Specialization</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{doctor?.specialization}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <Icons.Calendar />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">Schedule Date</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedDate).split(',')[1].trim()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <Icons.Clock />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">Schedule Time</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{formatTime(selectedTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          {consultationType === 'online' ? <Icons.Video /> : <Icons.Building />}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">Consultation Modality</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {consultationType === 'online' ? '🎥 Online Consultation' : '🏥 In-Clinic Visit'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <Icons.Building />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">Clinic Center</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{doctor?.clinicId?.name || 'HealthSync Center'}</p>
                        </div>
                      </div>
                    </div>

                    {reason && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-850/80 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Consultation Reason</span>
                        <p className="text-slate-700 dark:text-slate-350 leading-relaxed bg-white dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/80 p-3 rounded-xl">{reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Details Stripe Card */}
                  <div className="bg-slate-950 text-slate-100 rounded-[20px] p-6 space-y-4 shadow-xl border border-slate-900 relative overflow-hidden">
                    {/* Background accent glow */}
                    <span className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-400/20 to-teal-400/20 rounded-full blur-2xl pointer-events-none"></span>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Icons.Receipt />
                      Payment Invoice breakdown
                    </h3>
                    
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Base Consultation Fee</span>
                        <span className="font-bold text-slate-100">₹{consultationFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Services Tax (22%)</span>
                        <span className="font-bold text-slate-100">₹{gst}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HealthSync Platform Charge (7%)</span>
                        <span className="font-bold text-slate-100">₹{platformFee}</span>
                      </div>
                      <div className="border-t border-dashed border-slate-800 my-2"></div>
                      <div className="flex justify-between items-center text-sm font-bold text-white">
                        <span>Total Payable Amount</span>
                        <span className="text-sky-400 font-extrabold text-base">₹{totalAmount}</span>
                      </div>
                    </div>

                    {paymentConfig?.paymentsEnabled && paymentConfig?.keyId ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-2">
                        <Icons.Lock />
                        <span>Secure payment transaction via Razorpay gateway</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-500 pt-2">
                        <Icons.Info />
                        <span>Test Integration: Real payment transaction is skipped</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Post-Booking Payment screen */}
              {step === 4 && showPayment && appointmentData && (
                <div className="text-center py-10 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900 shadow-md shadow-emerald-500/10">
                    <Icons.Check />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Appointment Created!</h3>
                    <p className="text-sm text-slate-500 mt-1">Please complete transaction payment to confirm your booking slot.</p>
                  </div>

                  <div className="max-w-xs mx-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Payable Fee</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">₹{totalAmount}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Sticky Footer */}
        <div className="border-t border-slate-100 dark:border-slate-850 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
          {/* Current Selection summary / estimated cost */}
          <div className="text-left w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[280px] block">
              {getFooterSelectionText()}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Back Button */}
            {step > 1 && step < 4 && !showPayment && (
              <button
                type="button"
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 active:scale-[0.97] transition-all flex items-center gap-1.5"
                onClick={() => setStep(step - 1)}
              >
                <Icons.ArrowLeft />
                Back
              </button>
            )}
            
            {/* Main Action Buttons */}
            {showPayment ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white dark:border-slate-950 border-t-transparent" />
                ) : (
                  <>
                    <Icons.CreditCard />
                    Pay ₹{totalAmount} with Razorpay
                  </>
                )}
              </motion.button>
            ) : step < 3 ? (
              <motion.button
                whileHover={isContinueDisabled() ? {} : { scale: 1.02 }}
                whileTap={isContinueDisabled() ? {} : { scale: 0.98 }}
                animate={isContinueDisabled() ? { opacity: 0.6 } : { opacity: 1 }}
                type="button"
                className={`w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  isContinueDisabled()
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-slate-800/80'
                    : 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md shadow-sky-500/20 active:scale-[0.98] border-none'
                }`}
                onClick={() => setStep(step + 1)}
                disabled={isContinueDisabled()}
              >
                Continue
                <Icons.ArrowRight />
              </motion.button>
            ) : (
              <motion.button
                whileHover={loading ? {} : { scale: 1.02 }}
                whileTap={loading ? {} : { scale: 0.98 }}
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Icons.Check />
                    {paymentConfig?.paymentsEnabled ? 'Proceed to Payment' : 'Confirm Booking'}
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
