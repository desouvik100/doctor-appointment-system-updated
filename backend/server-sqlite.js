const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database
const db = new sqlite3.Database(':memory:');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Clinics table
    db.run(`CREATE TABLE clinics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Doctors table
    db.run(`CREATE TABLE doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        clinic_id INTEGER,
        fees DECIMAL(10,2) NOT NULL,
        available_days TEXT NOT NULL,
        available_time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics (id)
    )`);

    // Appointments table
    db.run(`CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        clinic_id INTEGER NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status TEXT DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (doctor_id) REFERENCES doctors (id),
        FOREIGN KEY (clinic_id) REFERENCES clinics (id)
    )`);

    // Receptionists table
    db.run(`CREATE TABLE receptionists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        clinic_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics (id)
    )`);

    // Insert sample data
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const adminPassword = bcrypt.hashSync('admin123', 10);

    // Sample clinic
    db.run(`INSERT INTO clinics (name, address, phone) VALUES 
        ('City Medical Center', '123 Main St, Downtown', '+1-555-0123')`);

    // Sample doctor
    db.run(`INSERT INTO doctors (name, specialization, clinic_id, fees, available_days, available_time) VALUES 
        ('Dr. John Smith', 'Cardiologist', 1, 150.00, 'Monday,Tuesday,Wednesday', '09:00-17:00')`);

    // Sample user
    db.run(`INSERT INTO users (name, email, password, phone) VALUES 
        ('John Doe', 'john@example.com', ?, '+1-555-0100')`, [hashedPassword]);

    // Sample receptionist
    db.run(`INSERT INTO receptionists (name, email, password, clinic_id) VALUES 
        ('Jane Reception', 'reception@clinic.com', ?, 1)`, [hashedPassword]);

    console.log('✅ SQLite database initialized with sample data');
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret1234567', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Doctor Appointment System API - SQLite Version' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, phone],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'Email already exists' });
                    }
                    return res.status(500).json({ message: 'Registration failed' });
                }

                const token = jwt.sign(
                    { id: this.lastID, email },
                    process.env.JWT_SECRET || 'secret1234567',
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'User registered successfully',
                    token,
                    user: { id: this.lastID, name, email, phone }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Server error' });
            }

            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET || 'secret1234567',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin login
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Simple admin check
        if (email === 'admin@example.com' && password === 'admin123') {
            const token = jwt.sign(
                { id: 'admin', email, role: 'admin' },
                process.env.JWT_SECRET || 'secret1234567',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Admin login successful',
                token,
                admin: { id: 'admin', name: 'System Admin', email }
            });
        } else {
            res.status(400).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Clinic auth
app.post('/api/auth/clinic-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get(`SELECT r.*, c.name as clinic_name FROM receptionists r 
                JOIN clinics c ON r.clinic_id = c.id 
                WHERE r.email = ?`, [email], async (err, receptionist) => {
            if (err) {
                return res.status(500).json({ message: 'Server error' });
            }

            if (!receptionist) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, receptionist.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: receptionist.id, email: receptionist.email, role: 'receptionist' },
                process.env.JWT_SECRET || 'secret1234567',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Receptionist login successful',
                token,
                receptionist: {
                    id: receptionist.id,
                    name: receptionist.name,
                    email: receptionist.email,
                    clinic_name: receptionist.clinic_name
                }
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Clinic routes
app.get('/api/clinics', (req, res) => {
    db.all('SELECT * FROM clinics ORDER BY created_at DESC', (err, clinics) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(clinics);
    });
});

app.post('/api/clinics', (req, res) => {
    const { name, address, phone } = req.body;

    db.run(
        'INSERT INTO clinics (name, address, phone) VALUES (?, ?, ?)',
        [name, address, phone],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Failed to create clinic' });
            }

            res.status(201).json({
                message: 'Clinic created successfully',
                clinic: { id: this.lastID, name, address, phone }
            });
        }
    );
});

// Doctor routes
app.get('/api/doctors', (req, res) => {
    db.all(`SELECT d.*, c.name as clinic_name FROM doctors d 
            LEFT JOIN clinics c ON d.clinic_id = c.id 
            ORDER BY d.created_at DESC`, (err, doctors) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(doctors);
    });
});

app.post('/api/doctors', (req, res) => {
    const { name, specialization, clinic_id, fees, available_days, available_time } = req.body;

    db.run(
        'INSERT INTO doctors (name, specialization, clinic_id, fees, available_days, available_time) VALUES (?, ?, ?, ?, ?, ?)',
        [name, specialization, clinic_id, fees, available_days, available_time],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Failed to create doctor' });
            }

            res.status(201).json({
                message: 'Doctor created successfully',
                doctor: { id: this.lastID, name, specialization, clinic_id, fees, available_days, available_time }
            });
        }
    );
});

// Appointment routes
app.get('/api/appointments', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(`SELECT a.*, d.name as doctor_name, d.specialization, c.name as clinic_name 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.id 
            JOIN clinics c ON a.clinic_id = c.id 
            WHERE a.user_id = ? 
            ORDER BY a.appointment_date DESC, a.appointment_time DESC`, [userId], (err, appointments) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(appointments);
    });
});

app.post('/api/appointments', authenticateToken, (req, res) => {
    const { doctor_id, clinic_id, appointment_date, appointment_time } = req.body;
    const user_id = req.user.id;

    db.run(
        'INSERT INTO appointments (user_id, doctor_id, clinic_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?)',
        [user_id, doctor_id, clinic_id, appointment_date, appointment_time],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Failed to book appointment' });
            }

            res.status(201).json({
                message: 'Appointment booked successfully',
                appointment: { id: this.lastID, user_id, doctor_id, clinic_id, appointment_date, appointment_time }
            });
        }
    );
});

// Clinic appointments (for receptionists)
app.get('/api/clinic-appointments/:clinicId', authenticateToken, (req, res) => {
    const clinicId = req.params.clinicId;

    db.all(`SELECT a.*, u.name as patient_name, u.phone as patient_phone, 
                   d.name as doctor_name, d.specialization 
            FROM appointments a 
            JOIN users u ON a.user_id = u.id 
            JOIN doctors d ON a.doctor_id = d.id 
            WHERE a.clinic_id = ? 
            ORDER BY a.appointment_date DESC, a.appointment_time DESC`, [clinicId], (err, appointments) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(appointments);
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 SQLite Server running on port ${PORT}`);
});