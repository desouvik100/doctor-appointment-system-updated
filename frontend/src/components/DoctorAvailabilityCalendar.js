import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const DoctorAvailabilityCalendar = ({ doctorId, onSelectSlot, selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(selectedDate || null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    if (doctorId) {
      fetchAvailability();
    }
  }, [doctorId, currentMonth]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const response = await axios.get(`/api/doctors/${doctorId}/calendar?year=${year}&month=${month}`);
      
      if (response.data.success && response.data.calendar) {
        // Convert calendar array to availability object
        const avail = {};
        response.data.calendar.forEach(day => {
          if (!day.isPast && day.isAvailable) {
            avail[day.date] = { 
              available: true, 
              slots: day.slots?.flatMap(slot => generateSlotsFromRange(slot.startTime, slot.endTime)) || generateTimeSlots()
            };
          }
        });
        setAvailability(avail);
      } else {
        generateDefaultAvailability();
      }
    } catch (error) {
      // Generate default availability if API fails
      generateDefaultAvailability();
    } finally {
      setLoading(false);
    }
  };

  const generateSlotsFromRange = (startTime, endTime) => {
    if (!startTime || !endTime) return [];
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    
    while (current < end) {
      const hour = Math.floor(current / 60);
      const min = current % 60;
      if (hour !== 13) { // Skip lunch hour
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
      current += 30; // 30 min slots
    }
    return slots;
  };

  const generateDefaultAvailability = () => {
    const avail = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Available Mon-Sat (1-6), not Sunday (0)
      if (dayOfWeek !== 0 && date >= new Date().setHours(0,0,0,0)) {
        const dateStr = date.toISOString().split('T')[0];
        avail[dateStr] = { available: true, slots: generateTimeSlots() };
      }
    }
    setAvailability(avail);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      if (hour !== 13) { // Skip lunch hour
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isDateAvailable = (day) => {
    if (!day) return false;
    const dateStr = formatDateStr(day);
    return availability[dateStr]?.available;
  };

  const isPastDate = (day) => {
    if (!day) return true;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateStr = (day) => {
    const year = currentMonth.getFullYear();
    const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}-${day.toString().padStart(2, '0')}`;
  };

  const handleDayClick = (day) => {
    if (!day || isPastDate(day) || !isDateAvailable(day)) return;
    
    const dateStr = formatDateStr(day);
    setSelectedDay(dateStr);
    setSelectedTime(null);
    
    // Get time slots for this day
    const daySlots = availability[dateStr]?.slots || generateTimeSlots();
    setTimeSlots(daySlots);
    
    if (onDateChange) onDateChange(dateStr);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (onSelectSlot) {
      onSelectSlot({ date: selectedDay, time });
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDay(null);
    setTimeSlots([]);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDay(null);
    setTimeSlots([]);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="doctor-availability-calendar">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          disabled={currentMonth <= new Date()}
        >
          <i className="fas fa-chevron-left text-slate-600"></i>
        </button>
        <h3 className="text-lg font-semibold text-slate-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <i className="fas fa-chevron-right text-slate-600"></i>
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((day, index) => {
            const dateStr = day ? formatDateStr(day) : '';
            const isAvailable = isDateAvailable(day);
            const isPast = isPastDate(day);
            const isSelected = dateStr === selectedDay;
            const isToday = day && new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                disabled={!day || isPast || !isAvailable}
                className={`
                  aspect-square p-2 rounded-lg text-sm font-medium transition-all
                  ${!day ? 'invisible' : ''}
                  ${isPast ? 'text-slate-300 cursor-not-allowed' : ''}
                  ${isAvailable && !isPast ? 'hover:bg-indigo-50 cursor-pointer' : ''}
                  ${isAvailable && !isPast ? 'text-slate-700 bg-emerald-50 border border-emerald-200' : ''}
                  ${!isAvailable && !isPast && day ? 'text-slate-400 bg-slate-50' : ''}
                  ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600' : ''}
                  ${isToday && !isSelected ? 'ring-2 ring-indigo-400' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-50"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-indigo-600"></div>
          <span>Selected</span>
        </div>
      </div>

      {/* Time Slots */}
      {selectedDay && timeSlots.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Available Time Slots for {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedTime === time 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'}
                `}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityCalendar;
