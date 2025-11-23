// config/initDatabase.js - Database initialization and schema setup
const { getPool } = require('./database');

const createTables = async () => {
  const pool = getPool();
  
  try {
    console.log('🔄 Creating database tables...');
    
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');
    
    // Create tenants table (foundation for multi-tenancy)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        settings JSONB DEFAULT '{}',
        subscription_info JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tenants table created');
    
    // Create default tenant for existing system
    await pool.query(`
      INSERT INTO tenants (name, subdomain, settings) 
      VALUES ('Default Clinic', 'default', '{"isDefault": true}')
      ON CONFLICT (subdomain) DO NOTHING
    `);
    console.log('✅ Default tenant created');
    
    // Create users table with tenant support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'patient',
        clinic_id UUID DEFAULT NULL,
        profile JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      )
    `);
    console.log('✅ Users table created');
    
    // Create indexes for users table
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id)');
    console.log('✅ User indexes created');
    
    // Create clinics table with tenant support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address JSONB NOT NULL DEFAULT '{}',
        contact_info JSONB NOT NULL DEFAULT '{}',
        parent_clinic_id UUID REFERENCES clinics(id),
        settings JSONB DEFAULT '{}',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Clinics table created');
    
    // Create indexes for clinics table
    await pool.query('CREATE INDEX IF NOT EXISTS idx_clinics_tenant ON clinics(tenant_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_clinics_parent ON clinics(parent_clinic_id)');
    console.log('✅ Clinic indexes created');
    
    // Create doctors table with tenant support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        license_number VARCHAR(100),
        profile JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Doctors table created');
    
    // Create indexes for doctors table
    await pool.query('CREATE INDEX IF NOT EXISTS idx_doctors_tenant ON doctors(tenant_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id)');
    console.log('✅ Doctor indexes created');
    
    // Create appointments table with partitioning support (basic structure)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        patient_email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        appointment_date DATE NOT NULL,
        slot_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        token_number INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'booked',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Appointments table created');
    
    // Create indexes for appointments table
    await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_patient_email ON appointments(patient_email)');
    console.log('✅ Appointment indexes created');
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
};

const dropTables = async () => {
  const pool = getPool();
  
  try {
    console.log('🔄 Dropping all tables...');
    
    await pool.query('DROP TABLE IF EXISTS appointments CASCADE');
    await pool.query('DROP TABLE IF EXISTS doctors CASCADE');
    await pool.query('DROP TABLE IF EXISTS clinics CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS tenants CASCADE');
    
    console.log('✅ All tables dropped');
    
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
    throw error;
  }
};

module.exports = {
  createTables,
  dropTables
};