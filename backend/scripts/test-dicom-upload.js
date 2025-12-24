/**
 * Test DICOM Upload Script
 * 
 * Usage:
 *   node scripts/test-dicom-upload.js <patientId> <dicomFilePath>
 * 
 * Example:
 *   node scripts/test-dicom-upload.js 507f1f77bcf86cd799439011 ./sample.dcm
 * 
 * Or run without args to create a sample test image
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthsync');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create a minimal valid DICOM file for testing
const createSampleDicom = () => {
  // DICOM file preamble (128 bytes of zeros) + "DICM" magic number
  const preamble = Buffer.alloc(128, 0);
  const magic = Buffer.from('DICM');
  
  // Minimal DICOM dataset with required tags
  // Using Explicit VR Little Endian transfer syntax
  const dataset = [];
  
  // Helper to create DICOM tag
  const addTag = (group, element, vr, value) => {
    const groupBuf = Buffer.alloc(2);
    groupBuf.writeUInt16LE(group);
    const elemBuf = Buffer.alloc(2);
    elemBuf.writeUInt16LE(element);
    const vrBuf = Buffer.from(vr);
    
    let valueBuf = Buffer.from(value);
    // Pad to even length
    if (valueBuf.length % 2 !== 0) {
      valueBuf = Buffer.concat([valueBuf, Buffer.from(' ')]);
    }
    
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(valueBuf.length);
    
    return Buffer.concat([groupBuf, elemBuf, vrBuf, lenBuf, valueBuf]);
  };
  
  // File Meta Information
  dataset.push(addTag(0x0002, 0x0001, 'OB', Buffer.from([0x00, 0x01]))); // File Meta Info Version
  dataset.push(addTag(0x0002, 0x0002, 'UI', '1.2.840.10008.5.1.4.1.1.2')); // Media Storage SOP Class UID (CT)
  dataset.push(addTag(0x0002, 0x0003, 'UI', '1.2.3.4.5.6.7.8.9.' + Date.now())); // Media Storage SOP Instance UID
  dataset.push(addTag(0x0002, 0x0010, 'UI', '1.2.840.10008.1.2.1')); // Transfer Syntax UID (Explicit VR Little Endian)
  
  // Patient Module
  dataset.push(addTag(0x0010, 0x0010, 'PN', 'Test^Patient')); // Patient Name
  dataset.push(addTag(0x0010, 0x0020, 'LO', 'TEST001')); // Patient ID
  dataset.push(addTag(0x0010, 0x0030, 'DA', '19900101')); // Patient Birth Date
  dataset.push(addTag(0x0010, 0x0040, 'CS', 'O')); // Patient Sex
  
  // Study Module
  dataset.push(addTag(0x0020, 0x000D, 'UI', '1.2.3.4.5.6.7.8.9.1.' + Date.now())); // Study Instance UID
  dataset.push(addTag(0x0008, 0x0020, 'DA', new Date().toISOString().slice(0,10).replace(/-/g,''))); // Study Date
  dataset.push(addTag(0x0008, 0x0030, 'TM', new Date().toTimeString().slice(0,8).replace(/:/g,''))); // Study Time
  dataset.push(addTag(0x0008, 0x1030, 'LO', 'Test Study Description')); // Study Description
  
  // Series Module
  dataset.push(addTag(0x0020, 0x000E, 'UI', '1.2.3.4.5.6.7.8.9.2.' + Date.now())); // Series Instance UID
  dataset.push(addTag(0x0008, 0x0060, 'CS', 'CT')); // Modality
  dataset.push(addTag(0x0020, 0x0011, 'IS', '1')); // Series Number
  
  // Image Module
  dataset.push(addTag(0x0008, 0x0018, 'UI', '1.2.3.4.5.6.7.8.9.3.' + Date.now())); // SOP Instance UID
  dataset.push(addTag(0x0020, 0x0013, 'IS', '1')); // Instance Number
  dataset.push(addTag(0x0028, 0x0010, 'US', Buffer.from([0x00, 0x01]))); // Rows (256)
  dataset.push(addTag(0x0028, 0x0011, 'US', Buffer.from([0x00, 0x01]))); // Columns (256)
  
  return Buffer.concat([preamble, magic, ...dataset]);
};

// Main test function
const runTest = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  
  console.log('\n🏥 DICOM Upload Test Script\n');
  console.log('=' .repeat(50));
  
  if (args.length === 0) {
    // Create sample DICOM file
    const samplePath = path.join(__dirname, '../data/sample-test.dcm');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const sampleDicom = createSampleDicom();
    fs.writeFileSync(samplePath, sampleDicom);
    
    console.log('✅ Created sample DICOM file:', samplePath);
    console.log('\n📋 To test upload, run:');
    console.log(`   node scripts/test-dicom-upload.js <patientId> ${samplePath}`);
    console.log('\n📋 Or use the API directly:');
    console.log(`
   curl -X POST http://localhost:5001/api/imaging/upload \\
     -H "Authorization: Bearer <your_token>" \\
     -F "patientId=<patient_id>" \\
     -F "clinicId=<clinic_id>" \\
     -F "files=@${samplePath}"
    `);
  } else if (args.length >= 2) {
    const [patientId, filePath] = args;
    
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      process.exit(1);
    }
    
    console.log('📁 File:', filePath);
    console.log('👤 Patient ID:', patientId);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📊 File size:', (fileBuffer.length / 1024).toFixed(2), 'KB');
    
    // Check DICOM magic number
    const magic = fileBuffer.slice(128, 132).toString();
    if (magic === 'DICM') {
      console.log('✅ Valid DICOM file detected');
    } else {
      console.log('⚠️  No DICOM magic number found (may still be valid)');
    }
    
    // Get a clinic ID from database
    let clinicId = null;
    try {
      const Clinic = require('../models/Clinic');
      const clinic = await Clinic.findOne({}).select('_id name');
      if (clinic) {
        clinicId = clinic._id;
        console.log('🏥 Clinic:', clinic.name);
      }
    } catch (e) {
      // Try to get from doctor
      try {
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ clinicId: { $exists: true } }).select('clinicId');
        if (doctor?.clinicId) {
          clinicId = doctor.clinicId;
        }
      } catch (e2) {
        // Ignore
      }
    }
    
    if (!clinicId) {
      console.log('⚠️  No clinic found, creating a test clinic...');
      const Clinic = require('../models/Clinic');
      const testClinic = new Clinic({
        name: 'Test Imaging Clinic',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@clinic.com'
      });
      await testClinic.save();
      clinicId = testClinic._id;
      console.log('🏥 Created test clinic:', testClinic.name);
    }
    
    // Import and test the upload service
    try {
      const { uploadDicomStudy } = require('../services/imagingStorageService');
      
      console.log('\n📤 Uploading...');
      const result = await uploadDicomStudy([fileBuffer], {
        patientId,
        clinicId: clinicId.toString(),
        validatePatient: false
      });
      
      console.log('\n✅ Upload successful!');
      console.log('   Study ID:', result.studyId);
      console.log('   Study Instance UID:', result.studyInstanceUID);
      console.log('   Total Images:', result.totalImages);
      console.log('   Total Series:', result.totalSeries);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Warnings:', result.errors);
      }
    } catch (error) {
      console.error('\n❌ Upload failed:', error.message);
    }
  } else {
    console.log('Usage:');
    console.log('  node scripts/test-dicom-upload.js                    # Create sample file');
    console.log('  node scripts/test-dicom-upload.js <patientId> <file> # Upload file');
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Done\n');
};

runTest().catch(console.error);
