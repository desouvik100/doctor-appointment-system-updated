

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  type: { type: String, enum: ['online', 'in-clinic', 'both'], default: 'both' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['available', 'booked', 'blocked'], default: 'available' },
});

const Slot = mongoose.model('Slot', slotSchema);

async function addTestSlots() {
  try {

    const User = mongoose.model('User');
    const doctors = await User.find({ role: 'doctor' }).limit(5);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in database');
      process.exit(1);
    }
    
    console.log(`Found ${doctors.length} doctors`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeSlots = [
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '10:00', end: '10:30' },
      { start: '10:30', end: '11:00' },
      { start: '11:00', end: '11:30' },
      { start: '11:30', end: '12:00' },
      { start: '14:00', end: '14:30' },
      { start: '14:30', end: '15:00' },
      { start: '15:00', end: '15:30' },
      { start: '15:30', end: '16:00' },
      { start: '16:00', end: '16:30' },
      { start: '16:30', end: '17:00' },
    ];
    
    let slotsCreated = 0;
    
    for (const doctor of doctors) {
      console.log(`\nAdding slots for Dr. ${doctor.name}...`);
      
      for (let i = 0; i < 7; i++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + i);

        if (slotDate.getDay() === 0) continue;
        
        for (const time of timeSlots) {
          const slot = new Slot({
            doctorId: doctor._id,
            date: slotDate,
            startTime: time.start,
            endTime: time.end,
            isBooked: false,
            type: 'both', 
            status: 'available',
          });
          
          await slot.save();
          slotsCreated++;
        }
      }
      
      console.log(`✅ Added slots for Dr. ${doctor.name}`);
    }
    
    console.log(`\n🎉 Successfully created ${slotsCreated} test slots!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestSlots();
