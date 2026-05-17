/**
 * Seeds a DICOM imaging study for the staff user desouvik0001@gmail.com
 * Uses the sample DICOM file already in backend/data/
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Find the staff user
  const staff = await db.collection('clinicstaffs').findOne({ email: 'desouvik0001@gmail.com' });
  const doctor = await db.collection('doctors').findOne({});
  const clinic = await db.collection('clinics').findOne({});

  const patientId = staff?._id || new mongoose.Types.ObjectId();
  const patientName = staff?.name || 'Souvik De';
  const clinicId = clinic?._id || null;

  console.log('Using patientId:', patientId, 'name:', patientName);

  // Copy sample DICOM to uploads dir
  const sampleDicom = path.join(__dirname, '../data/CT-MONO2-16-brain.dcm');
  const uploadDir = path.join(__dirname, '../uploads/imaging', patientId.toString());
  fs.mkdirSync(uploadDir, { recursive: true });

  const destFile = path.join(uploadDir, 'CT-MONO2-16-brain.dcm');
  if (fs.existsSync(sampleDicom)) {
    fs.copyFileSync(sampleDicom, destFile);
    console.log('Copied DICOM file to', destFile);
  } else {
    console.warn('Sample DICOM not found at', sampleDicom, '— creating placeholder entry');
  }

  const date = new Date();
  const reportNumber = `DCM${date.getFullYear().toString().slice(-2)}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${Math.floor(Math.random()*9000+1000)}`;

  const report = {
    reportNumber,
    patientId,
    patientName,
    orderedByName: 'Dr. ' + (doctor?.name || 'Attending Physician'),
    imagingType: 'ct_scan',
    bodyPart: 'Brain',
    findings: 'CT Brain without contrast. No acute intracranial hemorrhage. Ventricles and sulci are normal in size and configuration. No midline shift. Basal cisterns are patent.',
    impression: 'Normal CT Brain study. No acute intracranial pathology identified.',
    status: 'completed',
    procedureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    reportDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    images: [
      {
        fileName: 'CT-MONO2-16-brain.dcm',
        fileUrl: `/uploads/imaging/${patientId}/CT-MONO2-16-brain.dcm`,
        fileType: 'DICOM',
        description: 'CT Brain Axial Slice',
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (clinicId) report.clinicId = clinicId;

  // Remove existing test entry for this patient
  await db.collection('imagingreports').deleteMany({ patientId, reportNumber: { $regex: /^DCM/ } });

  const result = await db.collection('imagingreports').insertOne(report);
  console.log('Inserted imaging report:', result.insertedId);
  console.log('Report number:', reportNumber);
  console.log('Done!');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
