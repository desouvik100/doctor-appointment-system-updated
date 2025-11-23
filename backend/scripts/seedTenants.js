// scripts/seedTenants.js - Seed database with sample tenant data
require('dotenv').config();
const { connectDB, closePool } = require('../config/database');
const TenantManager = require('../utils/tenantManager');

const sampleTenants = [
  {
    name: 'Default Clinic',
    subdomain: 'default',
    settings: {
      isDefault: true,
      branding: {
        primaryColor: '#4facfe',
        logo: null
      },
      features: {
        multiDoctor: true,
        onlineBooking: true,
        smsNotifications: false
      }
    },
    subscriptionInfo: {
      plan: 'free',
      maxUsers: 100,
      maxClinics: 1
    },
    defaultClinic: {
      name: 'Main Clinic',
      address: {
        street: '123 Healthcare Ave',
        city: 'Medical City',
        state: 'HC',
        zipCode: '12345',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0123',
        email: 'info@defaultclinic.com',
        website: 'https://defaultclinic.com'
      }
    }
  },
  {
    name: 'City Medical Center',
    subdomain: 'citymedical',
    settings: {
      branding: {
        primaryColor: '#28a745',
        logo: null
      },
      features: {
        multiDoctor: true,
        onlineBooking: true,
        smsNotifications: true,
        telehealth: true
      }
    },
    subscriptionInfo: {
      plan: 'professional',
      maxUsers: 500,
      maxClinics: 5
    },
    defaultClinic: {
      name: 'City Medical Center - Main Branch',
      address: {
        street: '456 Medical Plaza',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0456',
        email: 'contact@citymedical.com',
        website: 'https://citymedical.com'
      }
    }
  },
  {
    name: 'Rural Health Network',
    subdomain: 'ruralhealth',
    settings: {
      branding: {
        primaryColor: '#17a2b8',
        logo: null
      },
      features: {
        multiDoctor: true,
        onlineBooking: true,
        smsNotifications: true,
        mobileApp: true
      }
    },
    subscriptionInfo: {
      plan: 'enterprise',
      maxUsers: 1000,
      maxClinics: 20
    },
    defaultClinic: {
      name: 'Rural Health Network - Central Hub',
      address: {
        street: '789 Country Road',
        city: 'Smalltown',
        state: 'TX',
        zipCode: '75001',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0789',
        email: 'info@ruralhealth.org',
        website: 'https://ruralhealth.org'
      }
    }
  }
];

const seedTenants = async () => {
  try {
    console.log('🌱 Starting tenant seeding...');
    
    // Connect to database
    await connectDB();
    
    // Check if tenants already exist
    const existingTenants = await TenantManager.getAllTenants();
    
    if (existingTenants.length > 0) {
      console.log(`ℹ️  Found ${existingTenants.length} existing tenants`);
      
      // Ask if user wants to continue
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('Use --force flag to seed anyway');
        return;
      }
    }
    
    // Seed each tenant
    for (const tenantData of sampleTenants) {\n      try {\n        // Check if tenant already exists\n        const existing = await TenantManager.getTenantBySubdomain(tenantData.subdomain);\n        \n        if (existing) {\n          console.log(`⏭️  Tenant '${tenantData.subdomain}' already exists, skipping...`);\n          continue;\n        }\n        \n        // Provision new tenant\n        const tenant = await TenantManager.provisionTenant(tenantData);\n        console.log(`✅ Seeded tenant: ${tenant.name} (${tenant.subdomain})`);\n        \n      } catch (error) {\n        console.error(`❌ Failed to seed tenant '${tenantData.subdomain}':`, error.message);\n      }\n    }\n    \n    console.log('🎉 Tenant seeding completed!');\n    \n    // Display summary\n    const allTenants = await TenantManager.getAllTenants();\n    console.log('\\n📊 Tenant Summary:');\n    allTenants.forEach(tenant => {\n      console.log(`  - ${tenant.name} (${tenant.subdomain})`);\n    });\n    \n  } catch (error) {\n    console.error('❌ Seeding failed:', error.message);\n    process.exit(1);\n  } finally {\n    await closePool();\n    process.exit(0);\n  }\n};\n\n// Run seeding if this file is executed directly\nif (require.main === module) {\n  seedTenants();\n}\n\nmodule.exports = { seedTenants, sampleTenants };