import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const RescheduleModal = ({ appointment, onClose, onReschedule }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (selectedDate && appointment?.doctorId?._id) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to default slots
      try {
        const response = await axios.get(
          `/api/doctors/${appointment.doctorId._id}/slots?date=${selectedDate}`
        );
        setAvailableSlots(response.data.slots || generateDefaultSlots());
      } catch {
        setAvailableSlots(generateDefaultSlots());
      }
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      if (hour !== 13) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(`/api/appointments/${appointment._id}/reschedule`, {
        newDate: selectedDate,
        newTime: selectedTime,
        reason: reason || 'Rescheduled by user'
      });
      
      toast.success('Appointment rescheduled successfully');
      if (onReschedule) {
        onReschedule({ ...appointment, date: selectedDate, time: selectedTime });
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  // Get maximum date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Reschedule Appointment</h2>
              <p className="text-amber-100 text-sm">Dr. {appointment?.doctorId?.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Current Appointment Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Current:</span>{' '}
            {new Date(appointment?.date).toLocaleDateString('en-US', { 
              weekday: 'long', month: 'short', day: 'numeric' 
            })} at {appointment?.time}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <i className="fas fa-calendar-alt text-amber-500 mr-2"></i>
              Select New Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime('');
              }}
              min={minDateStr}
              max={maxDateStr}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <i className="fas fa-clock text-amber-500 mr-2"></i>
                Select New Time
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${selectedTime === slot 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <i className="fas fa-comment text-amber-500 mr-2"></i>
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you rescheduling?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fas fa-calendar-check"></i>
                Reschedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
