/**
 * Generate unique token for appointments
 * Format: [Prefix]-[Number]
 * Example: A-45, B-12
 */
const generateToken = async (Appointment, clinicId, date) => {
  try {
    // Create new date objects to avoid mutation
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all appointments for the clinic on the same date
    const appointmentsOnDate = await Appointment.find({
      clinicId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ createdAt: -1 });

    // Generate token number (sequential)
    const tokenNumber = appointmentsOnDate.length + 1;

    // Generate prefix based on clinic or use default 'A'
    // You can customize this logic based on clinic name or ID
    const prefix = 'A';

    return `${prefix}-${tokenNumber}`;
  } catch (error) {
    console.error('Error generating token:', error);
    // Fallback token
    return `A-${Date.now().toString().slice(-4)}`;
  }
};

/**
 * Generate room number for appointment
 * Can be based on doctor's schedule or clinic configuration
 */
const generateRoomNumber = (schedule) => {
  if (schedule && schedule.roomNumber) {
    return schedule.roomNumber;
  }
  // Default room assignment logic
  return 'Room-1';
};

module.exports = {
  generateToken,
  generateRoomNumber
};

