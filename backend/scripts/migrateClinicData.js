// scripts/migrateClinicData.js - Migrate clinic data from MongoDB to PostgreSQL
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, closePool } = require('../config/database');
const { createTables } = require('../config/initDatabase');
const TenantManager = require('../utils/tenantManager');
const ClinicPostgres = require('../models/ClinicPostgres');

// MongoDB Clinic model (temporary for migration)
const mongoClinicSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['clinic', 'hospital'], default: 'clinic' },
  address: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  email: String,
  logoUrl: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const MongoClinic = mongoose.model('Clinic', mongoClinicSchema);

const migrateClinicData = async () => {
  let mongoConnection = null;
  
  try {
    console.log('🚀 Starting clinic data migration from MongoDB to PostgreSQL...');
    
    // Connect to PostgreSQL
    console.log('📡 Connecting to PostgreSQL...');
    await connectDB();
    
    // Ensure tables exist
    console.log('🔧 Ensuring PostgreSQL tables exist...');
    await createTables();
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    mongoConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get default tenant (create if doesn't exist)
    let defaultTenant = await TenantManager.getDefaultTenant();
    if (!defaultTenant) {
      console.log('🏢 Creating default tenant...');
      defaultTenant = await TenantManager.createTenant({
        name: 'Default Organization',
        subdomain: 'default',
        settings: { isDefault: true }
      });
    }
    
    console.log(`✅ Using tenant: ${defaultTenant.name} (${defaultTenant.id})`);
    
    // Fetch all clinics from MongoDB
    console.log('📥 Fetching clinics from MongoDB...');
    const mongoClinics = await MongoClinic.find({}).lean();
    console.log(`Found ${mongoClinics.length} clinics in MongoDB`);
    
    if (mongoClinics.length === 0) {
      console.log('ℹ️  No clinics found in MongoDB to migrate');
      return;
    }
    
    // Check if clinics already exist in PostgreSQL
    const existingClinics = await ClinicPostgres.findAll(defaultTenant.id);
    console.log(`Found ${existingClinics.length} existing clinics in PostgreSQL`);
    
    if (existingClinics.length > 0) {
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('⚠️  Clinics already exist in PostgreSQL. Use --force to migrate anyway');
        return;
      }
    }
    
    // Migrate each clinic
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const mongoClinic of mongoClinics) {
      try {
        // Check if clinic already exists in PostgreSQL (by name)
        const existingClinics = await ClinicPostgres.findAll(defaultTenant.id, { 
          search: mongoClinic.name 
        });
        
        const existingClinic = existingClinics.find(c => 
          c.name.toLowerCase() === mongoClinic.name.toLowerCase()
        );
        
        if (existingClinic) {
          console.log(`⏭️  Clinic '${mongoClinic.name}' already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Convert MongoDB format to PostgreSQL format
        const clinicData = {
          name: mongoClinic.name,
          type: mongoClinic.type || 'clinic',
          address: {
            street: mongoClinic.address || '',
            city: mongoClinic.city || '',
            state: mongoClinic.state || '',
            zipCode: mongoClinic.pincode || '',
            country: 'USA'
          },
          contactInfo: {
            phone: mongoClinic.phone || '',
            email: mongoClinic.email || '',
            website: ''
          },
          settings: {
            logoUrl: mongoClinic.logoUrl || ''
          },
          isActive: mongoClinic.isActive !== false
        };
        
        const newClinic = await ClinicPostgres.create(clinicData, defaultTenant.id);
        
        console.log(`✅ Migrated clinic: ${newClinic.name} (${newClinic.type})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to migrate clinic '${mongoClinic.name}':`, error.message);
        errorCount++;
      }
    }
    
    console.log('\\n🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`  - Migrated: ${migratedCount} clinics`);
    console.log(`  - Skipped: ${skippedCount} clinics`);
    console.log(`  - Errors: ${errorCount} clinics`);
    
    if (migratedCount > 0) {
      console.log('\\n✅ Migration successful!');
      console.log('  - All clinic data has been migrated to PostgreSQL');
      console.log('  - Address and contact info have been structured as JSON');
      console.log('  - Legacy fields have been mapped to new schema');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (mongoConnection) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
    await closePool();
    console.log('✅ Disconnected from PostgreSQL');
    process.exit(0);
  }
};

// Create sample clinics helper
const createSampleClinics = async () => {
  try {
    console.log('🏥 Creating sample clinics...');
    
    await connectDB();
    await createTables();
    
    let defaultTenant = await TenantManager.getDefaultTenant();
    if (!defaultTenant) {
      defaultTenant = await TenantManager.createTenant({
        name: 'Default Organization',
        subdomain: 'default',
        settings: { isDefault: true }
      });
    }
    
    const sampleClinics = [
      {
        name: 'Main Medical Center',
        type: 'hospital',
        address: {
          street: '123 Healthcare Avenue',
          city: 'Medical City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        contactInfo: {
          phone: '+1-555-0123',
          email: 'info@mainmedical.com',
          website: 'https://mainmedical.com'
        },
        settings: {
          logoUrl: '',
          departments: ['Emergency', 'Cardiology', 'Neurology']
        }
      },
      {
        name: 'Downtown Family Clinic',
        type: 'clinic',
        address: {
          street: '456 Main Street',
          city: 'Downtown',
          state: 'CA',
          zipCode: '90211',
          country: 'USA'
        },
        contactInfo: {
          phone: '+1-555-0456',
          email: 'contact@downtownfamily.com',
          website: 'https://downtownfamily.com'
        },
        settings: {
          logoUrl: '',
          specialties: ['Family Medicine', 'Pediatrics']
        }
      },
      {
        name: 'Westside Urgent Care',
        type: 'clinic',
        address: {
          street: '789 West Boulevard',
          city: 'Westside',
          state: 'CA',
          zipCode: '90212',
          country: 'USA'
        },
        contactInfo: {
          phone: '+1-555-0789',
          email: 'info@westsideurgent.com',
          website: 'https://westsideurgent.com'
        },
        settings: {
          logoUrl: '',
          services: ['Urgent Care', 'X-Ray', 'Lab Services']
        }
      }
    ];
    
    let createdCount = 0;
    
    for (const clinicData of sampleClinics) {
      try {
        // Check if clinic already exists
        const existing = await ClinicPostgres.findAll(defaultTenant.id, { 
          search: clinicData.name 
        });
        
        if (existing.length > 0) {
          console.log(`⏭️  Clinic '${clinicData.name}' already exists, skipping...`);
          continue;
        }
        
        const clinic = await ClinicPostgres.create(clinicData, defaultTenant.id);
        console.log(`✅ Created sample clinic: ${clinic.name}`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Failed to create clinic '${clinicData.name}':`, error.message);
      }
    }
    
    console.log(`\\n🎉 Created ${createdCount} sample clinics!`);
    
  } catch (error) {
    console.error('❌ Failed to create sample clinics:', error.message);
  } finally {
    await closePool();
    process.exit(0);
  }
};

// Run based on command line argument
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrateClinicData();
      break;
    case 'sample':
      createSampleClinics();
      break;
    default:
      console.log('Usage: node migrateClinicData.js [migrate|sample]');
      console.log('  migrate - Migrate clinics from MongoDB to PostgreSQL');
      console.log('  sample  - Create sample clinics in PostgreSQL');
      console.log('\\nOptions:');
      console.log('  --force - Force migration even if clinics already exist');
      process.exit(1);
  }
}

module.exports = { migrateClinicData, createSampleClinics };