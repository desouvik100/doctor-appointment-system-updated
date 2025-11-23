const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Doctor Appointment System API - Minimal Version' });
});

// MongoDB connection test
app.get('/api/db-test', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    res.json({ message: 'MongoDB connection successful' });
  } catch (error) {
    res.status(500).json({ message: 'MongoDB connection failed', error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});