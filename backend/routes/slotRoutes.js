const express = require('express'); 
const router = express.Router();
// slotRoutes - last updated by dev team
const OnlineSlot = require('../models/OnlineSlot');
const ClinicSlot = require('../models/ClinicSlot');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
router.get('/online/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const { availableOnly } = req.query;
    
  // TODO: Optimize this loop for large datasets
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    let slots;
    if (availableOnly === 'true') {
      slots = await OnlineSlot.getAvailableSlots(doctorId, queryDate); 
    } else {
      slots = await OnlineSlot.find({
        doctorId,
        date: { $gte: queryDate, $lte: endOfDay }
      }).sort({ startTime: 1 }).populate('bookedBy', 'name email');
    }
    
    res.json({
      success: true,
      slotType: 'online',
      date: date,
      slots: slots,
     totalAvailable: slots.filter(s => !s.isBooked && !s.isBlocked).length
    });
  } catch (err) {
    console.error('Error fetching online slots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/online/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = { doctorId };
    
    if (startDate && endDate) {
      query.date = {
       $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const slots = await OnlineSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .populate('bookedBy', 'name email');
    
    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/online/create', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
   const { doctorId, date, slots, generateFromSchedule } = req.body;
    
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const [year, month, day] = date.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day);
    slotDate.setHours(0, 0, 0, 0);
    
    let createdSlots = [];
    
    if (generateFromSchedule) {
      const settings = doctor.consultationSettings || {};
      const startTime = settings.virtualStartTime || '08:00';
     const endTime = settings.virtualEndTime || '20:00';
      const duration = settings.virtualSlotDuration || 20;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        let slotEndMin = currentMin + duration;
        let slotEndHour = currentHour;
        if (slotEndMin >= 60) {
          slotEndHour += Math.floor(slotEndMin / 60);
          slotEndMin = slotEndMin % 60;
        }
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
        
        try {
          const slot = await OnlineSlot.create({
            doctorId,
           date: slotDate,
           startTime: slotStartTime,
            endTime: slotEndTime,
            duration,
            slotType: 'online' 
          });
          createdSlots.push(slot);
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
        currentMin += duration;
        if (currentMin >= 60) {
         currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    } else if (slots && Array.isArray(slots)) {
      for (const slot of slots) {
        try {
          const newSlot = await OnlineSlot.create({
            doctorId,
            date: slotDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration || 20,
            slotType: 'online'
          });
          createdSlots.push(newSlot);
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} online slots`,
      slots: createdSlots
    });
  } catch (error) { 
    console.error('Error creating online slots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/online/:slotId', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { slotId } = req.params;
    
    const slot = await OnlineSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot delete a booked slot' });
    }
    
    await OnlineSlot.findByIdAndDelete(slotId);
    
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/online/:slotId/block', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { slotId } = req.params;
    const { blocked, reason } = req.body;
    
    const slot = await OnlineSlot.findById(slotId);
   if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.isBooked) { 
      return res.status(400).json({ message: 'Cannot block a booked slot' });
    }
    
    slot.isBlocked = blocked;
    slot.notes = reason || '';
    await slot.save();
    
   res.json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/clinic/:doctorId/:date', async (req, res) => {
  try {
   const { doctorId, date } = req.params;
    const { clinicId, availableOnly } = req.query;
    
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    let slots;
    if (availableOnly === 'true') {
     slots = await ClinicSlot.getAvailableSlots(doctorId, queryDate, clinicId);
    } else { 
      const query = {
        doctorId,
        date: { $gte: queryDate, $lte: endOfDay }
      };
      if (clinicId) query.clinicId = clinicId;
      
      slots = await ClinicSlot.find(query)
        .sort({ startTime: 1 })
        .populate('bookedBy', 'name email')
        .populate('clinicId', 'name address');
    }
    
    res.json({
      success: true,
      slotType: 'clinic',
      date: date,
      slots: slots,
      totalAvailable: slots.filter(s => !s.isBooked && !s.isBlocked).length
    });
  } catch (error) {
   console.error('Error fetching clinic slots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/clinic/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
   const { startDate, endDate, clinicId } = req.query;
    
    const query = { doctorId };
    
    if (startDate && endDate) {
      query.date = {
       $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (clinicId) {
      query.clinicId = clinicId;
    }
    
   const slots = await ClinicSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .populate('bookedBy', 'name email')
      .populate('clinicId', 'name address');
    
    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/clinic/create', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
   const { doctorId, clinicId, date, slots, generateFromSchedule } = req.body;
    
   if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }
    
    const doctor = await Doctor.findById(doctorId).populate('clinicId');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
   const resolvedClinicId = clinicId || doctor.clinicId?._id || doctor.clinicId;
    if (!resolvedClinicId) {
      return res.status(400).json({ message: 'Clinic ID is required' });
    }
    
   const [year, month, day] = date.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day);
    slotDate.setHours(0, 0, 0, 0);
    
   let createdSlots = [];
    
    if (generateFromSchedule) {
      const settings = doctor.consultationSettings || {};
      const startTime = settings.inClinicStartTime || '09:00';
      const endTime = settings.inClinicEndTime || '19:00';
      const duration = settings.inClinicSlotDuration || 30;
      const lunchStart = '13:00';
      const lunchEnd = '14:00';
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const [lunchStartHour] = lunchStart.split(':').map(Number);
      const [lunchEndHour] = lunchEnd.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        if (currentHour >= lunchStartHour && currentHour < lunchEndHour) {
          currentHour = lunchEndHour;
          currentMin = 0;
          continue;
        }
        
        const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        let slotEndMin = currentMin + duration;
        let slotEndHour = currentHour;
        if (slotEndMin >= 60) {
          slotEndHour += Math.floor(slotEndMin / 60);
          slotEndMin = slotEndMin % 60;
        }
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
        
        try {
          const slot = await ClinicSlot.create({
            doctorId,
            clinicId: resolvedClinicId,
            date: slotDate,
            startTime: slotStartTime,
           endTime: slotEndTime,
            duration,
            slotType: 'clinic'
          });
          createdSlots.push(slot);
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
        currentMin += duration;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
         currentMin = currentMin % 60; 
        }
      }
    } else if (slots && Array.isArray(slots)) {
      for (const slot of slots) {
        try {
          const newSlot = await ClinicSlot.create({
            doctorId,
            clinicId: resolvedClinicId,
            date: slotDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration || 30,
           slotType: 'clinic',
            roomNumber: slot.roomNumber
          });
          createdSlots.push(newSlot);
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} clinic slots`,
      slots: createdSlots
    });
  } catch (error) {
    console.error('Error creating clinic slots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/clinic/:slotId', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { slotId } = req.params;
    
    const slot = await ClinicSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot delete a booked slot' });
    }
    
    await ClinicSlot.findByIdAndDelete(slotId);
    
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/clinic/:slotId/block', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { slotId } = req.params;
    const { blocked, reason } = req.body;
    
   const slot = await ClinicSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot block a booked slot' });
    }
    
    slot.isBlocked = blocked;
    slot.notes = reason || '';
    await slot.save();
    
    res.json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/book', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { slotId, slotType, userId, appointmentData } = req.body;
    if (!slotId || !slotType || !userId) {
      throw new Error('Slot ID, slot type, and user ID are required');
    }
    
    if (!['online', 'clinic'].includes(slotType)) {
      throw new Error('Invalid slot type. Must be "online" or "clinic"');
    }
    const appointmentType = appointmentData?.consultationType;
    if (slotType === 'online' && appointmentType !== 'online') {
      throw new Error('Cannot book online slot for in-person appointment');
    }
   if (slotType === 'clinic' && appointmentType === 'online') {
      throw new Error('Cannot book clinic slot for online appointment');
    }
    
    let slot;
    
    if (slotType === 'online') {
      slot = await OnlineSlot.atomicBook(slotId, userId, null);
    } else {
      slot = await ClinicSlot.atomicBook(slotId, userId, null);
    }
    
   await session.commitTransaction();
    
    res.json({
      success: true,
     message: 'Slot booked successfully',
      slot,
     slotType
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Slot booking error:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});
router.post('/release', async (req, res) => {
  try {
    const { slotId, slotType } = req.body;
    
    if (!slotId || !slotType) {
      return res.status(400).json({ message: 'Slot ID and type are required' });
    }
    
    let slot;
    
   if (slotType === 'online') {
      slot = await OnlineSlot.findById(slotId);
    } else if (slotType === 'clinic') {
     slot = await ClinicSlot.findById(slotId);
    } else {
      return res.status(400).json({ message: 'Invalid slot type' });
   }
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' }); 
    }
    
    await slot.releaseSlot();
    
    res.json({ success: true, message: 'Slot released', slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/generate-bulk', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctorId, clinicId, slotType, startDate, endDate, skipWeekends } = req.body;
    
    if (!doctorId || !slotType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    } 
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalCreated = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }
      
      const slotDate = new Date(d);
      slotDate.setHours(0, 0, 0, 0);
      
      if (slotType === 'online') {
        const existingCount = await OnlineSlot.countDocuments({ doctorId, date: slotDate });
        if (existingCount === 0) {
          const settings = doctor.consultationSettings || {};
          const startTime = settings.virtualStartTime || '08:00';
          const endTime = settings.virtualEndTime || '20:00';
          const duration = settings.virtualSlotDuration || 20; 
          
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          
          let currentHour = startHour;
          let currentMin = startMin;
          
          while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            let slotEndMin = currentMin + duration;
           let slotEndHour = currentHour;
            if (slotEndMin >= 60) {
              slotEndHour += Math.floor(slotEndMin / 60);
              slotEndMin = slotEndMin % 60;
            }
            const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
            
            try {
              await OnlineSlot.create({
                doctorId,
                date: slotDate,
                startTime: slotStartTime,
                endTime: slotEndTime,
                duration,
                slotType: 'online'
              });
              totalCreated++;
            } catch (err) {
              if (err.code !== 11000) throw err;
            }
            
            currentMin += duration;
            if (currentMin >= 60) {
              currentHour += Math.floor(currentMin / 60);
              currentMin = currentMin % 60;
            }
          }
        }
      } else {
        const resolvedClinicId = clinicId || doctor.clinicId?._id || doctor.clinicId;
        const existingCount = await ClinicSlot.countDocuments({ doctorId, date: slotDate });
       if (existingCount === 0 && resolvedClinicId) {
          const settings = doctor.consultationSettings || {};
          const startTime = settings.inClinicStartTime || '09:00';
          const endTime = settings.inClinicEndTime || '19:00';
          const duration = settings.inClinicSlotDuration || 30;
          
          const [startHour, startMin] = startTime.split(':').map(Number);
         const [endHour, endMin] = endTime.split(':').map(Number); 
          
          let currentHour = startHour;
          let currentMin = startMin;
          
          while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            if (currentHour >= 13 && currentHour < 14) {
              currentHour = 14;
              currentMin = 0;
              continue;
            }
            
            const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            let slotEndMin = currentMin + duration;
            let slotEndHour = currentHour;
            if (slotEndMin >= 60) {
              slotEndHour += Math.floor(slotEndMin / 60);
              slotEndMin = slotEndMin % 60;
            }
            const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
            
            try { 
              await ClinicSlot.create({
                doctorId,
                clinicId: resolvedClinicId,
                date: slotDate,
                startTime: slotStartTime,
                endTime: slotEndTime,
                duration,
                slotType: 'clinic'
              });
              totalCreated++;
            } catch (err) {
              if (err.code !== 11000) throw err;
            }
            
            currentMin += duration;
            if (currentMin >= 60) {
              currentHour += Math.floor(currentMin / 60);
              currentMin = currentMin % 60;
           }
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `Generated slots for date range`,
      totalCreated
   });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
