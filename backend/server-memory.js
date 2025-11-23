const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
let users = [];
let doctors = [
  {
    _id: '1',
    name: 'John Smith',
    email: 'dr.smith@hospital.com',
    phone: '+1-555-0101',
    specialization: 'Cardiology',
    availability: 'Mon-Fri 9AM-5PM',
    clinicId: '1'
  },
  {
    _id: '2',
    name: 'Sarah Johnson',
    email: 'dr.johnson@hospital.com',
    phone: '+1-555-0102',
    specialization: 'Dermatology',
    availability: 'Mon-Wed 10AM-4PM',
    clinicId: '1'
  },
  {
    _id: '3',
    name: 'Michael Brown',
    email: 'dr.brown@hospital.com',
    phone: '+1-555-0103',
    specialization: 'Pediatrics',
    availability: 'Tue-Thu 8AM-6PM',
    clinicId: '1'
  }
];
let appointments = [];
let clinics = [
  {
    _id: '1',
    name: 'City Medical Center',
    address: '123 Main St, City, State 12345',
    phone: '+1-555-0100'
  }
];

// Helper function to generate ID
const generateId = () => Date.now().toString();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Doctor Appointment System API - Memory Version' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      _id: generateId(),
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'patient'
    };

    users.push(user);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin login
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple admin check (in production, this should be in database)
    if (email === 'admin@hospital.com' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: 'admin',
          name: 'System Administrator',
          email: 'admin@hospital.com',
          role: 'admin'
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Doctor Routes
app.get('/api/doctors', (req, res) => {
  res.json(doctors);
});

// Appointment Routes
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.get('/api/appointments/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userAppointments = appointments.filter(apt => apt.userId === userId);
  
  // Populate doctor info
  const populatedAppointments = userAppointments.map(apt => ({
    ...apt,
    doctorId: doctors.find(d => d._id === apt.doctorId)
  }));
  
  res.json(populatedAppointments);
});

app.post('/api/appointments', (req, res) => {
  try {
    const { doctorId, userId, date, time, reason, clinicId } = req.body;

    const appointment = {
      _id: generateId(),
      doctorId,
      userId,
      date,
      time,
      reason,
      clinicId,
      status: 'pending',
      createdAt: new Date()
    };

    appointments.push(appointment);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointmentIndex = appointments.findIndex(apt => apt._id === id);
    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointments[appointmentIndex].status = status;

    res.json(appointments[appointmentIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Receptionist Routes
app.post('/api/receptionists/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple receptionist check (in production, this should be in database)
    if (email === 'reception@hospital.com' && password === 'reception123') {
      const token = jwt.sign(
        { userId: 'reception', role: 'receptionist' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: 'reception',
          name: 'Reception Staff',
          email: 'reception@hospital.com',
          role: 'receptionist',
          clinicId: '1'
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid receptionist credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/receptionists/appointments/:clinicId', (req, res) => {
  const { clinicId } = req.params;
  const clinicAppointments = appointments.filter(apt => apt.clinicId === clinicId);
  
  // Populate user and doctor info
  const populatedAppointments = clinicAppointments.map(apt => ({
    ...apt,
    userId: users.find(u => u._id === apt.userId) || { name: 'Unknown Patient', email: 'unknown@email.com' },
    doctorId: doctors.find(d => d._id === apt.doctorId)
  }));
  
  res.json(populatedAppointments);
});

app.put('/api/receptionists/appointments/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointmentIndex = appointments.findIndex(apt => apt._id === id);
    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointments[appointmentIndex].status = status;

    // Return populated appointment
    const appointment = appointments[appointmentIndex];
    const populatedAppointment = {
      ...appointment,
      userId: users.find(u => u._id === appointment.userId) || { name: 'Unknown Patient', email: 'unknown@email.com' },
      doctorId: doctors.find(d => d._id === appointment.doctorId)
    };

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using in-memory data storage');
  console.log('Demo credentials:');
  console.log('Admin: admin@hospital.com / admin123');
  console.log('Reception: reception@hospital.com / reception123');
});