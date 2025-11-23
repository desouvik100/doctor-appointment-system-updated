# 🏥 Doctor Appointment System

A comprehensive web-based healthcare management system built with React.js and Node.js that allows patients to book appointments, admins to manage the system, and receptionists to handle clinic operations.

## ✨ Features

### 👥 Multi-User System
- **Patient Portal**: Browse doctors, book appointments, manage bookings
- **Admin Dashboard**: Complete system management with CRUD operations
- **Receptionist Interface**: Clinic-specific appointment management

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control
- Secure password hashing with bcrypt
- Protected API routes

### 📊 Management Features
- User management (Create, Read, Update, Delete)
- Doctor management with specializations
- Appointment scheduling and status tracking
- Clinic management system
- Real-time dashboard statistics

## 🚀 Tech Stack

### Frontend
- **React.js** - User interface
- **Bootstrap 5** - Responsive design
- **Axios** - HTTP client
- **Font Awesome** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/doctor-appointment-system.git
cd doctor-appointment-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/doctor_appointment
JWT_SECRET=your_jwt_secret_key_here
PORT=5002
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Database Setup
Populate the database with sample data:
```bash
cd backend
node populate-mongodb.js
```

### 5. Start the Application

**Start Backend** (Terminal 1):
```bash
cd backend
node server-working.js
```

**Start Frontend** (Terminal 2):
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5002

## 🔑 Default Login Credentials

### Admin Access
- **Email**: admin@hospital.com
- **Password**: admin123

### Patient Access
- **Email**: john.doe@email.com
- **Password**: password123

### Receptionist Access
- **Email**: reception1@citygeneral.com
- **Password**: reception123

## 📱 Application Screenshots

### Login Page
Multi-user login interface with separate portals for patients, admins, and receptionists.

### Patient Dashboard
- Browse available doctors by specialization
- Book appointments with preferred time slots
- View and manage existing appointments
- Update appointment status

### Admin Dashboard
- System overview with statistics
- Complete user management (CRUD operations)
- Doctor management with clinic assignments
- Appointment monitoring and reporting

### Receptionist Interface
- Clinic-specific appointment management
- Patient check-in/check-out
- Appointment status updates
- Daily schedule overview

## 🗂️ Project Structure

```
doctor-appointment-system/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   └── Clinic.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── clinicRoutes.js
│   │   └── receptionistRoutes.js
│   ├── server-working.js
│   ├── populate-mongodb.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.js
│   │   │   ├── AdminAuth.js
│   │   │   ├── ClinicAuth.js
│   │   │   ├── DoctorList.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── ClinicDashboard.js
│   │   │   ├── MyAppointments.js
│   │   │   └── BookAppointment.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Patient login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/clinic/login` - Receptionist login
- `POST /api/auth/register` - Patient registration

### Users Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Doctors Management
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments Management
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Clinics Management
- `GET /api/clinics` - Get all clinics
- `POST /api/clinics` - Create new clinic
- `PUT /api/clinics/:id` - Update clinic

## 🛠️ Development

### Running in Development Mode
```bash
# Backend with auto-restart
cd backend
npx nodemon server-working.js

# Frontend with hot reload
cd frontend
npm start
```

### Building for Production
```bash
cd frontend
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running locally or check your connection string
- Verify the database name in your `.env` file

**Port Already in Use**
- Change the port in your `.env` file
- Kill existing processes using the ports

**Authentication Errors**
- Ensure you're using the correct login credentials
- Check if the database has been populated with sample data

### Getting Help

If you encounter any issues:
1. Check the console logs for error messages
2. Ensure all dependencies are installed
3. Verify your environment variables
4. Make sure MongoDB is running

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- React.js community for excellent documentation
- MongoDB for the robust database solution
- Bootstrap team for the responsive framework
- All contributors who helped improve this project

---

⭐ **Star this repository if you found it helpful!**