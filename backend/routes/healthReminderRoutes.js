/**
 * Health Reminder API Routes
 * Requirement 6: Smart Health Reminders
 */

const express = require('express');
const router = express.Router();
const HealthReminder = require('../models/HealthReminder');
const { authenticate } = require('../middleware/roleMiddleware');

// Get all reminders for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, condition } = req.query;
    
    const query = { userId: req.user.id, isActive: true };
    if (status) query.status = status;
    if (type) query.type = type;
    if (condition) query.condition = condition;
    
    const reminders = await HealthReminder.find(query)
      .sort({ scheduledDate: 1 })
      .populate('doctorId', 'name specialization');
    
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get due reminders
router.get('/due', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const reminders = await HealthReminder.find({
      userId: req.user.id,
      isActive: true,
      status: 'active',
      $or: [
        { nextDueDate: { $lte: nextWeek } },
        { scheduledDate: { $lte: nextWeek } }
      ]
    }).sort({ scheduledDate: 1 });
    
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create custom reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      type, title, description, condition, frequency,
      customFrequencyDays, scheduledDate, reminderDaysBefore,
      notificationChannels, doctorId, medicineDetails,
      labTestDetails, vaccinationDetails, priority
    } = req.body;
    
    const reminder = new HealthReminder({
      userId: req.user.id,
      type: type || 'custom',
      title,
      description,
      condition: condition || 'general',
      frequency: frequency || 'once',
      customFrequencyDays,
      scheduledDate: new Date(scheduledDate),
      reminderDaysBefore: reminderDaysBefore || [7, 3, 1, 0],
      notificationChannels: notificationChannels || {},
      doctorId,
      medicineDetails,
      labTestDetails,
      vaccinationDetails,
      priority: priority || 'medium'
    });
    
    await reminder.save();
    
    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Setup condition-based reminders
router.post('/setup/:condition', authenticate, async (req, res) => {
  try {
    const { condition } = req.params;
    let reminders;
    
    switch (condition) {
      case 'diabetes':
        reminders = await HealthReminder.createDiabetesReminders(req.user.id);
        break;
      case 'hypertension':
        reminders = await HealthReminder.createHypertensionReminders(req.user.id);
        break;
      case 'child':
        const { childDOB } = req.body;
        if (!childDOB) {
          return res.status(400).json({ message: 'Child date of birth required' });
        }
        reminders = await HealthReminder.createChildVaccinationReminders(req.user.id, new Date(childDOB));
        break;
      default:
        return res.status(400).json({ message: 'Unknown condition' });
    }
    
    res.status(201).json({
      message: `${condition} reminders created`,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update reminder
router.put('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await HealthReminder.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    const allowedUpdates = [
      'title', 'description', 'frequency', 'customFrequencyDays',
      'scheduledDate', 'reminderDaysBefore', 'notificationChannels',
      'priority', 'isActive'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        reminder[field] = req.body[field];
      }
    });
    
    await reminder.save();
    
    res.json({
      message: 'Reminder updated',
      reminder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark reminder as completed
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { action, appointmentId } = req.body;
    
    const reminder = await HealthReminder.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    reminder.markCompleted(action || 'marked_done', appointmentId);
    await reminder.save();
    
    res.json({
      message: 'Reminder marked as completed',
      reminder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Snooze reminder
router.post('/:id/snooze', authenticate, async (req, res) => {
  try {
    const { days } = req.body;
    
    const reminder = await HealthReminder.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    reminder.snooze(days || 3);
    await reminder.save();
    
    res.json({
      message: `Reminder snoozed for ${days || 3} days`,
      reminder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await HealthReminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reminder statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const reminders = await HealthReminder.find({
      userId: req.user.id,
      isActive: true
    });
    
    const stats = {
      total: reminders.length,
      active: reminders.filter(r => r.status === 'active').length,
      completed: reminders.filter(r => r.status === 'completed').length,
      overdue: reminders.filter(r => r.status === 'overdue').length,
      snoozed: reminders.filter(r => r.status === 'snoozed').length,
      byType: {},
      byPriority: {}
    };
    
    reminders.forEach(r => {
      stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
      stats.byPriority[r.priority] = (stats.byPriority[r.priority] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
