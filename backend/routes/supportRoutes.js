const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// Create support ticket (doctors only)
router.post('/ticket', verifyToken, async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    const userId = req.user.id;

    if (!subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and message are required' 
      });
    }

    // Check if user is a doctor
    const doctor = await Doctor.findOne({ userId: userId });
    if (!doctor && req.user.role !== 'doctor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only doctors can submit support tickets through this endpoint' 
      });
    }

    const ticket = new SupportTicket({
      submittedBy: userId,
      submitterRole: 'doctor',
      doctorId: doctor?._id,
      subject,
      message,
      category: category || 'other',
      priority: priority || 'medium',
      messages: [{
        sender: 'doctor',
        senderId: userId,
        message: message
      }]
    });

    await ticket.save();

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'desouvik0000@gmail.com';
      const user = await User.findById(userId);
      
      await sendEmail({
        to: adminEmail,
        subject: `🎫 New Support Ticket: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">New Support Ticket from Doctor</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> Dr. ${doctor?.name || user?.name || 'Unknown'}</p>
              <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
              <p><strong>Category:</strong> ${category || 'Other'}</p>
              <p><strong>Priority:</strong> <span style="color: ${priority === 'urgent' ? '#dc3545' : priority === 'high' ? '#fd7e14' : '#28a745'}">${priority || 'Medium'}</span></p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #6c757d; font-size: 12px;">Ticket ID: ${ticket._id}</p>
          </div>
        `
      });
      console.log(`✅ Support ticket notification sent to admin: ${adminEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Admin will respond soon.',
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit support ticket', 
      error: error.message 
    });
  }
});

// Get doctor's tickets
router.get('/my-tickets', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tickets = await SupportTicket.find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .select('-messages');

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
});

// Get single ticket with messages
router.get('/ticket/:ticketId', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await SupportTicket.findById(ticketId)
      .populate('submittedBy', 'name email')
      .populate('doctorId', 'name specialization')
      .populate('respondedBy', 'name');

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Check access - only ticket owner or admin can view
    if (ticket.submittedBy._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Mark messages as read for the viewer
    const viewerRole = req.user.role === 'admin' ? 'doctor' : 'admin';
    ticket.messages.forEach(msg => {
      if (msg.sender === viewerRole) {
        msg.read = true;
      }
    });
    await ticket.save();

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket' 
    });
  }
});

// Add message to ticket (doctor reply)
router.post('/ticket/:ticketId/reply', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Check if user owns this ticket
    if (ticket.submittedBy.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Add message
    ticket.messages.push({
      sender: 'doctor',
      senderId: userId,
      message
    });

    // Reopen if closed
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      ticket.status = 'open';
    }

    await ticket.save();

    // Notify admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'desouvik0000@gmail.com';
      await sendEmail({
        to: adminEmail,
        subject: `📩 Reply on Ticket: ${ticket.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">New Reply on Support Ticket</h2>
            <p><strong>Ticket:</strong> ${ticket.subject}</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #6c757d; font-size: 12px;">Ticket ID: ${ticket._id}</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to notify admin:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reply' 
    });
  }
});

// ============ ADMIN ENDPOINTS ============

// Get all tickets (admin only)
router.get('/admin/tickets', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('submittedBy', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
});

// Admin reply to ticket
router.post('/admin/ticket/:ticketId/reply', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, status } = req.body;
    const adminId = req.user.id;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    const ticket = await SupportTicket.findById(ticketId)
      .populate('submittedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Add admin message
    ticket.messages.push({
      sender: 'admin',
      senderId: adminId,
      message
    });

    // Update status if provided
    if (status) {
      ticket.status = status;
      if (status === 'resolved') ticket.resolvedAt = new Date();
      if (status === 'closed') ticket.closedAt = new Date();
    } else {
      ticket.status = 'in_progress';
    }

    ticket.respondedBy = adminId;
    ticket.respondedAt = new Date();
    ticket.adminResponse = message;

    await ticket.save();

    // Notify doctor via email
    if (ticket.submittedBy?.email) {
      try {
        await sendEmail({
          to: ticket.submittedBy.email,
          subject: `📬 Admin Response: ${ticket.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">Response to Your Support Ticket</h2>
              <p>Dear Dr. ${ticket.submittedBy.name},</p>
              <p>Admin has responded to your support ticket:</p>
              <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
                <p style="white-space: pre-wrap; margin: 0;">${message}</p>
              </div>
              <p><strong>Ticket Status:</strong> ${ticket.status}</p>
              <p>You can reply to this ticket from your dashboard.</p>
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
              <p style="color: #6c757d; font-size: 12px;">Ticket ID: ${ticket._id}</p>
            </div>
          `
        });
        console.log(`✅ Admin response sent to doctor: ${ticket.submittedBy.email}`);
      } catch (emailError) {
        console.error('Failed to notify doctor:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket
    });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reply' 
    });
  }
});

// Update ticket status (admin only)
router.patch('/admin/ticket/:ticketId/status', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { 
        status,
        ...(status === 'resolved' && { resolvedAt: new Date() }),
        ...(status === 'closed' && { closedAt: new Date() })
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    res.json({
      success: true,
      message: 'Status updated',
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
});

// Get ticket stats (admin only)
router.get('/admin/stats', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await SupportTicket.aggregate([
      { $match: { status: { $in: ['open', 'in_progress'] } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byPriority: priorityStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
});

module.exports = router;
