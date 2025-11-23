// Temporary endpoint to create admin via API
// Add this to server.js temporarily, then remove after use
// Or call via: POST https://your-backend.onrender.com/api/create-admin

const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdminEndpoint = async (req, res) => {
  try {
    const adminEmail = 'admin@hospital.com';
    const adminPassword = 'Admin@123';

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      return res.json({ 
        success: true, 
        message: 'Admin already exists',
        email: adminEmail 
      });
    }

    // Hash password and create admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      approvalStatus: 'approved',
      isActive: true
    });

    res.json({ 
      success: true, 
      message: 'Admin created successfully',
      email: adminEmail,
      password: adminPassword // Only for initial setup
    });
  } catch (err) {
    if (err.code === 11000) {
      res.json({ 
        success: false, 
        message: 'Admin already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
  }
};

module.exports = createAdminEndpoint;

