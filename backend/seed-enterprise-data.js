/**
 * Seed Enterprise Features Data
 * Run: node seed-enterprise-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HospitalBranch = require('./models/HospitalBranch');
const InsuranceClaim = require('./models/InsuranceClaim');
const Vendor = require('./models/Vendor');
const PurchaseOrder = require('./models/PurchaseOrder');
const ComplianceChecklist = require('./models/ComplianceChecklist');
const PatientFeedback = require('./models/PatientFeedback');
const BranchStaff = require('./models/BranchStaff');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthsync';

// Get clinicId from command line or use default
const CLINIC_ID = process.argv[2] || '692408378417f465fcdd1dfc';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const clinicId = new mongoose.Types.ObjectId(CLINIC_ID);
    console.log(`Seeding data for clinic: ${CLINIC_ID}`);

    // 1. Seed Hospital Branches
    console.log('\n📍 Creating Hospital Branches...');
    const existingBranches = await HospitalBranch.countDocuments({ organizationId: clinicId });
    let branches = [];
    if (existingBranches === 0) {
      branches = await HospitalBranch.insertMany([
        {
          organizationId: clinicId,
          organizationName: 'Care Hospital',
          branchName: 'Care Hospital - Main Branch',
          branchCode: 'CH-MAIN',
          branchType: 'main',
          city: 'Kolkata',
          state: 'West Bengal',
          address: '123 Park Street, Kolkata 700016',
          phone: '033-22001234',
          email: 'main@carehospital.com',
          totalBeds: 150,
          staffCount: 85,
          doctorCount: 25,
          status: 'active'
        },
        {
          organizationId: clinicId,
          organizationName: 'Care Hospital',
          branchName: 'Care Hospital - Salt Lake',
          branchCode: 'CH-SL',
          branchType: 'satellite',
          city: 'Kolkata',
          state: 'West Bengal',
          address: 'Sector V, Salt Lake, Kolkata 700091',
          phone: '033-22005678',
          email: 'saltlake@carehospital.com',
          totalBeds: 80,
          staffCount: 45,
          doctorCount: 15,
          status: 'active'
        },
        {
          organizationId: clinicId,
          organizationName: 'Care Hospital',
          branchName: 'Care Clinic - Howrah',
          branchCode: 'CC-HWH',
          branchType: 'clinic',
          city: 'Howrah',
          state: 'West Bengal',
          address: 'GT Road, Howrah 711101',
          phone: '033-22009012',
          email: 'howrah@carehospital.com',
          totalBeds: 20,
          staffCount: 15,
          doctorCount: 5,
          status: 'active'
        },
        {
          organizationId: clinicId,
          organizationName: 'Care Hospital',
          branchName: 'Care Diagnostics - New Town',
          branchCode: 'CD-NT',
          branchType: 'diagnostic_center',
          city: 'Kolkata',
          state: 'West Bengal',
          address: 'Action Area 1, New Town, Kolkata 700156',
          phone: '033-22003456',
          email: 'newtown@carehospital.com',
          totalBeds: 0,
          staffCount: 20,
          doctorCount: 3,
          status: 'active'
        }
      ]);
      console.log(`✅ Created ${branches.length} branches`);
    } else {
      console.log(`⏭️ Skipped - ${existingBranches} branches already exist`);
    }

    // 2. Seed Insurance Claims
    console.log('\n🏥 Creating Insurance Claims...');
    const existingClaims = await InsuranceClaim.countDocuments({ clinicId });
    let claims = [];
    if (existingClaims === 0) {
      // Get a patient ID from the database
      const patient = await User.findOne({ role: 'patient' });
      const patientId = patient?._id || clinicId; // fallback to clinicId if no patient
      
      claims = await InsuranceClaim.insertMany([
        {
          clinicId,
          patientId,
          claimNumber: 'CLM-2024-001',
          patientName: 'Rahul Sharma',
          policyNumber: 'SH-POL-123456',
          insuranceProvider: 'Star Health',
          claimType: 'cashless',
          treatmentType: 'ipd',
          claimAmount: 85000,
          approvedAmount: 75000,
          status: 'approved',
          diagnosisDescription: 'Appendectomy surgery'
        },
        {
          clinicId,
          patientId,
          claimNumber: 'CLM-2024-002',
          patientName: 'Priya Patel',
          policyNumber: 'ICICI-789012',
          insuranceProvider: 'ICICI Lombard',
          claimType: 'reimbursement',
          treatmentType: 'opd',
          claimAmount: 12000,
          status: 'under_review',
          diagnosisDescription: 'Diabetes management consultation'
        },
        {
          clinicId,
          patientId,
          claimNumber: 'CLM-2024-003',
          patientName: 'Amit Kumar',
          policyNumber: 'HDFC-345678',
          insuranceProvider: 'HDFC Ergo',
          claimType: 'cashless',
          treatmentType: 'ipd',
          claimAmount: 250000,
          status: 'submitted',
          diagnosisDescription: 'Cardiac bypass surgery'
        },
        {
          clinicId,
          patientId,
          claimNumber: 'CLM-2024-004',
          patientName: 'Sneha Das',
          policyNumber: 'BA-901234',
          insuranceProvider: 'Bajaj Allianz',
          claimType: 'pre_auth',
          treatmentType: 'daycare',
          claimAmount: 35000,
          status: 'pre_approved',
          diagnosisDescription: 'Cataract surgery - left eye'
        },
        {
          clinicId,
          patientId,
          claimNumber: 'CLM-2024-005',
          patientName: 'Vikram Singh',
          policyNumber: 'MB-567890',
          insuranceProvider: 'Max Bupa',
          claimType: 'cashless',
          treatmentType: 'emergency',
          claimAmount: 45000,
          approvedAmount: 45000,
          status: 'settled',
          diagnosisDescription: 'Road accident - fracture treatment'
        }
      ]);
      console.log(`✅ Created ${claims.length} insurance claims`);
    } else {
      console.log(`⏭️ Skipped - ${existingClaims} claims already exist`);
    }

    // 3. Seed Vendors
    console.log('\n🚚 Creating Vendors...');
    const existingVendors = await Vendor.countDocuments({ clinicId });
    let vendors = [];
    if (existingVendors === 0) {
      vendors = await Vendor.insertMany([
        {
          clinicId,
          name: 'MedSupply India Pvt Ltd',
          vendorCode: 'VND-001',
          email: 'orders@medsupply.in',
          phone: '9876543210',
          gstNumber: '19AABCU9603R1ZM',
          categories: ['medicines', 'consumables'],
          paymentTerms: 'net_30',
          status: 'active',
          rating: 4.5
        },
        {
          clinicId,
          name: 'Surgical Instruments Co',
          vendorCode: 'VND-002',
          email: 'sales@surgicalco.com',
          phone: '9876543211',
          gstNumber: '19AABCU9604R1ZN',
          categories: ['surgical', 'equipment'],
          paymentTerms: 'net_45',
          status: 'active',
          rating: 4.2
        },
        {
          clinicId,
          name: 'LabTech Solutions',
          vendorCode: 'VND-003',
          email: 'info@labtech.in',
          phone: '9876543212',
          gstNumber: '19AABCU9605R1ZO',
          categories: ['lab_supplies', 'equipment'],
          paymentTerms: 'net_30',
          status: 'active',
          rating: 4.8
        },
        {
          clinicId,
          name: 'Office Essentials',
          vendorCode: 'VND-004',
          email: 'contact@officeess.com',
          phone: '9876543213',
          categories: ['office_supplies'],
          paymentTerms: 'net_15',
          status: 'active',
          rating: 4.0
        }
      ]);
      console.log(`✅ Created ${vendors.length} vendors`);
    } else {
      vendors = await Vendor.find({ clinicId });
      console.log(`⏭️ Skipped - ${existingVendors} vendors already exist`);
    }

    // 4. Seed Purchase Orders
    console.log('\n📦 Creating Purchase Orders...');
    const existingPOs = await PurchaseOrder.countDocuments({ clinicId });
    let pos = [];
    if (existingPOs === 0 && vendors.length >= 3) {
      pos = await PurchaseOrder.insertMany([
        {
          clinicId,
          poNumber: 'PO-2024-001',
          vendorId: vendors[0]._id,
          vendorName: vendors[0].name,
          items: [
            { itemName: 'Paracetamol 500mg', quantity: 1000, unitPrice: 2, unit: 'tablets', totalPrice: 2000 },
            { itemName: 'Surgical Gloves (Box)', quantity: 50, unitPrice: 250, unit: 'boxes', totalPrice: 12500 }
          ],
          totalAmount: 14500,
          status: 'approved',
          expectedDeliveryDate: new Date('2025-01-05'),
          priority: 'normal'
        },
        {
          clinicId,
          poNumber: 'PO-2024-002',
          vendorId: vendors[1]._id,
          vendorName: vendors[1].name,
          items: [
            { itemName: 'Surgical Scissors', quantity: 10, unitPrice: 1500, unit: 'pcs', totalPrice: 15000 },
            { itemName: 'Forceps Set', quantity: 5, unitPrice: 3000, unit: 'sets', totalPrice: 15000 }
          ],
          totalAmount: 30000,
          status: 'sent',
          expectedDeliveryDate: new Date('2025-01-10'),
          priority: 'high'
        },
        {
          clinicId,
          poNumber: 'PO-2024-003',
          vendorId: vendors[2]._id,
          vendorName: vendors[2].name,
          items: [
            { itemName: 'Blood Collection Tubes', quantity: 500, unitPrice: 15, unit: 'pcs', totalPrice: 7500 },
            { itemName: 'Microscope Slides', quantity: 200, unitPrice: 10, unit: 'pcs', totalPrice: 2000 }
          ],
          totalAmount: 9500,
          status: 'received',
          expectedDeliveryDate: new Date('2024-12-28'),
          actualDeliveryDate: new Date('2024-12-27'),
          priority: 'normal'
        },
        {
          clinicId,
          poNumber: 'PO-2024-004',
          vendorId: vendors[0]._id,
          vendorName: vendors[0].name,
          items: [
            { itemName: 'Amoxicillin 500mg', quantity: 500, unitPrice: 8, unit: 'capsules', totalPrice: 4000 },
            { itemName: 'IV Cannula', quantity: 100, unitPrice: 45, unit: 'pcs', totalPrice: 4500 }
          ],
          totalAmount: 8500,
          status: 'pending_approval',
          expectedDeliveryDate: new Date('2025-01-15'),
          priority: 'urgent'
        }
      ]);
      console.log(`✅ Created ${pos.length} purchase orders`);
    } else {
      console.log(`⏭️ Skipped - ${existingPOs} POs already exist`);
    }

    // 5. Seed Compliance Checklists
    console.log('\n🛡️ Creating Compliance Checklists...');
    const existingChecklists = await ComplianceChecklist.countDocuments({ clinicId });
    let checklists = [];
    if (existingChecklists === 0) {
      checklists = await ComplianceChecklist.insertMany([
      {
        clinicId,
        checklistName: 'NABH Entry Level Certification 2024',
        checklistType: 'nabh',
        version: '5.0',
        status: 'in_progress',
        compliancePercentage: 72,
        grade: 'B',
        categories: [
          {
            categoryName: 'Access, Assessment and Continuity of Care',
            categoryCode: 'AAC',
            items: [
              { requirement: 'Registration process is defined', standard: 'AAC.1', status: 'compliant', priority: 'major' },
              { requirement: 'Emergency patients are assessed immediately', standard: 'AAC.2', status: 'compliant', priority: 'critical' },
              { requirement: 'Initial assessment is documented', standard: 'AAC.3', status: 'partial', priority: 'major' }
            ]
          },
          {
            categoryName: 'Care of Patients',
            categoryCode: 'COP',
            items: [
              { requirement: 'Care is planned and documented', standard: 'COP.1', status: 'compliant', priority: 'critical' },
              { requirement: 'High-risk patients are identified', standard: 'COP.2', status: 'non_compliant', priority: 'critical' },
              { requirement: 'Pain management protocols exist', standard: 'COP.3', status: 'compliant', priority: 'major' }
            ]
          },
          {
            categoryName: 'Hospital Infection Control',
            categoryCode: 'HIC',
            items: [
              { requirement: 'Hand hygiene protocols are followed', standard: 'HIC.1', status: 'compliant', priority: 'critical' },
              { requirement: 'Biomedical waste is segregated', standard: 'HIC.2', status: 'compliant', priority: 'critical' },
              { requirement: 'Sterilization protocols are documented', standard: 'HIC.3', status: 'partial', priority: 'critical' }
            ]
          }
        ],
        assessmentDate: new Date('2024-12-15'),
        nextAssessmentDate: new Date('2025-06-15')
      },
      {
        clinicId,
        checklistName: 'ISO 9001:2015 Quality Management',
        checklistType: 'iso',
        version: '2015',
        status: 'completed',
        compliancePercentage: 88,
        grade: 'A',
        certificationStatus: 'certified',
        certificationNumber: 'ISO-QMS-2024-1234',
        certificationExpiryDate: new Date('2027-03-15'),
        categories: [
          {
            categoryName: 'Quality Management System',
            categoryCode: 'QMS',
            items: [
              { requirement: 'Quality policy is documented', standard: 'QMS.1', status: 'compliant', priority: 'major' },
              { requirement: 'Quality objectives are measurable', standard: 'QMS.2', status: 'compliant', priority: 'major' }
            ]
          }
        ],
        assessmentDate: new Date('2024-03-15')
      }
    ]);
    console.log(`✅ Created ${checklists.length} compliance checklists`);
    } else {
      console.log(`⏭️ Skipped - ${existingChecklists} checklists already exist`);
    }

    // 6. Seed Patient Feedback
    console.log('\n💬 Creating Patient Feedback...');
    const existingFeedback = await PatientFeedback.countDocuments({ clinicId });
    let feedbacks = [];
    if (existingFeedback === 0) {
      feedbacks = await PatientFeedback.insertMany([
      {
        clinicId,
        patientName: 'Ananya Roy',
        feedbackType: 'post_visit',
        ratings: { overall: 5, doctorBehavior: 5, staffBehavior: 4, waitTime: 4, cleanliness: 5, facilities: 5 },
        npsScore: 10,
        npsCategory: 'promoter',
        comments: 'Excellent experience! Dr. Sharma was very thorough and explained everything clearly.',
        wouldRecommend: true
      },
      {
        clinicId,
        patientName: 'Rajesh Gupta',
        feedbackType: 'post_visit',
        ratings: { overall: 4, doctorBehavior: 5, staffBehavior: 4, waitTime: 3, cleanliness: 4, facilities: 4 },
        npsScore: 8,
        npsCategory: 'passive',
        comments: 'Good service overall, but waiting time was a bit long.',
        wouldRecommend: true
      },
      {
        clinicId,
        patientName: 'Meera Krishnan',
        feedbackType: 'appreciation',
        ratings: { overall: 5, doctorBehavior: 5, staffBehavior: 5, waitTime: 5, cleanliness: 5, facilities: 5 },
        npsScore: 10,
        npsCategory: 'promoter',
        comments: 'Very clean and modern facility. Staff was extremely helpful.',
        wouldRecommend: true
      },
      {
        clinicId,
        patientName: 'Suresh Menon',
        feedbackType: 'complaint',
        ratings: { overall: 2, doctorBehavior: 4, staffBehavior: 2, waitTime: 2, cleanliness: 3, facilities: 3 },
        npsScore: 3,
        npsCategory: 'detractor',
        comments: 'Billing process was confusing and took too long. Need improvement.',
        isComplaint: true,
        complaintStatus: 'open',
        wouldRecommend: false
      },
      {
        clinicId,
        patientName: 'Kavita Sharma',
        feedbackType: 'post_visit',
        ratings: { overall: 5, doctorBehavior: 5, staffBehavior: 5, waitTime: 4, cleanliness: 5, facilities: 5 },
        npsScore: 9,
        npsCategory: 'promoter',
        comments: 'Dr. Patel is amazing! Very patient and caring.',
        wouldRecommend: true
      },
      {
        clinicId,
        patientName: 'Arun Nair',
        feedbackType: 'complaint',
        ratings: { overall: 3, doctorBehavior: 4, staffBehavior: 2, waitTime: 3, cleanliness: 4, facilities: 4 },
        npsScore: 5,
        npsCategory: 'detractor',
        comments: 'Reception staff was rude. Doctor was good though.',
        isComplaint: true,
        complaintStatus: 'resolved',
        resolution: 'Spoke with reception team and provided additional training.',
        wouldRecommend: false
      },
      {
        clinicId,
        patientName: 'Pooja Verma',
        feedbackType: 'general',
        ratings: { overall: 4, doctorBehavior: 4, staffBehavior: 4, waitTime: 3, cleanliness: 5, facilities: 4 },
        npsScore: 7,
        npsCategory: 'passive',
        comments: 'Overall good experience. Parking could be better.',
        wouldRecommend: true
      },
      {
        clinicId,
        patientName: 'Deepak Joshi',
        feedbackType: 'post_discharge',
        ratings: { overall: 5, doctorBehavior: 5, staffBehavior: 5, waitTime: 5, cleanliness: 5, facilities: 5 },
        npsScore: 10,
        npsCategory: 'promoter',
        comments: 'Best hospital in the area! Highly recommended.',
        wouldRecommend: true
      }
    ]);
    console.log(`✅ Created ${feedbacks.length} patient feedbacks`);
    } else {
      console.log(`⏭️ Skipped - ${existingFeedback} feedbacks already exist`);
    }

    // 7. Seed Branch Staff (with user accounts)
    console.log('\n👥 Creating Branch Staff...');
    const existingBranchStaff = await BranchStaff.countDocuments({ organizationId: clinicId });
    let branchStaffList = [];
    if (existingBranchStaff === 0 && branches.length > 0) {
      const hashedPassword = await bcrypt.hash('Branch@123', 10);
      
      // Create staff users and branch staff records
      const staffData = [
        { name: 'Priya Mukherjee', email: 'priya.saltlake@carehospital.com', role: 'branch_manager', branchIndex: 1, department: 'Administration' },
        { name: 'Amit Das', email: 'amit.saltlake@carehospital.com', role: 'receptionist', branchIndex: 1, department: 'OPD' },
        { name: 'Sunita Roy', email: 'sunita.howrah@carehospital.com', role: 'branch_admin', branchIndex: 2, department: 'Administration' },
        { name: 'Ravi Kumar', email: 'ravi.howrah@carehospital.com', role: 'receptionist', branchIndex: 2, department: 'OPD' },
        { name: 'Neha Sharma', email: 'neha.newtown@carehospital.com', role: 'lab_tech', branchIndex: 3, department: 'Laboratory' },
        { name: 'Vikram Singh', email: 'vikram.newtown@carehospital.com', role: 'receptionist', branchIndex: 3, department: 'Reception' }
      ];

      for (const staff of staffData) {
        // Check if user already exists
        let user = await User.findOne({ email: staff.email });
        if (!user) {
          user = await User.create({
            name: staff.name,
            email: staff.email,
            password: hashedPassword,
            phone: '9876543' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            role: 'receptionist',
            clinicId: clinicId,
            branchId: branches[staff.branchIndex]._id,
            department: staff.department,
            isActive: true
          });
        }

        // Create branch staff record
        const branchStaff = await BranchStaff.create({
          userId: user._id,
          branchId: branches[staff.branchIndex]._id,
          organizationId: clinicId,
          name: staff.name,
          email: staff.email,
          phone: user.phone,
          role: staff.role,
          department: staff.department,
          permissions: {
            canManageStaff: staff.role === 'branch_admin' || staff.role === 'branch_manager',
            canManagePatients: true,
            canManageAppointments: true,
            canManageBilling: staff.role === 'branch_admin' || staff.role === 'branch_manager',
            canViewReports: staff.role !== 'receptionist',
            canManageInventory: staff.role === 'branch_admin'
          },
          isActive: true
        });
        branchStaffList.push(branchStaff);
      }

      // Update branch staff counts
      for (let i = 1; i < branches.length; i++) {
        const count = branchStaffList.filter(s => s.branchId.toString() === branches[i]._id.toString()).length;
        await HospitalBranch.findByIdAndUpdate(branches[i]._id, { staffCount: count });
      }

      console.log(`✅ Created ${branchStaffList.length} branch staff members`);
      console.log('   Staff can login with email and password: Branch@123');
    } else {
      console.log(`⏭️ Skipped - ${existingBranchStaff} branch staff already exist`);
    }

    console.log('\n✨ Enterprise data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`  - ${branches.length} Hospital Branches`);
    console.log(`  - ${claims.length} Insurance Claims`);
    console.log(`  - ${vendors.length} Vendors`);
    console.log(`  - ${pos.length} Purchase Orders`);
    console.log(`  - ${checklists.length} Compliance Checklists`);
    console.log(`  - ${feedbacks.length} Patient Feedbacks`);
    console.log(`  - ${branchStaffList.length} Branch Staff Members`);
    
    if (branchStaffList.length > 0) {
      console.log('\n📧 Branch Staff Login Credentials:');
      console.log('   Password for all: Branch@123');
      branchStaffList.forEach(s => console.log(`   - ${s.email} (${s.role})`));
    }

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedData();
