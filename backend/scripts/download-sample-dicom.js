/**
 * Download Sample DICOM File Script
 * Downloads a real DICOM file from a public source for testing
 * 
 * Usage: node scripts/download-sample-dicom.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Sample DICOM files from public sources
const SAMPLE_DICOM_URLS = [
  {
    name: 'CT-MONO2-16-brain.dcm',
    url: 'https://github.com/pydicom/pydicom/raw/main/src/pydicom/data/test_files/CT_small.dcm',
    description: 'CT scan (small)'
  },
  {
    name: 'MR-small.dcm',
    url: 'https://github.com/pydicom/pydicom/raw/main/src/pydicom/data/test_files/MR_small.dcm',
    description: 'MR scan (small)'
  },
  {
    name: 'CR-sample.dcm',
    url: 'https://github.com/pydicom/pydicom/raw/main/src/pydicom/data/test_files/CR_Implicit_Little.dcm',
    description: 'CR X-Ray sample'
  }
];

const dataDir = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`📥 Downloading from: ${url}`);
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`   ↪ Redirecting to: ${redirectUrl}`);
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = Math.round((downloadedSize / totalSize) * 100);
          process.stdout.write(`\r   Progress: ${percent}% (${(downloadedSize/1024).toFixed(1)} KB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n   ✅ Download complete!');
        resolve(destPath);
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Verify DICOM file
function verifyDicom(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Check for DICOM magic number at offset 128
  if (buffer.length > 132) {
    const magic = buffer.slice(128, 132).toString();
    if (magic === 'DICM') {
      return { valid: true, size: buffer.length };
    }
  }
  
  return { valid: false, size: buffer.length };
}

// Main function
async function main() {
  console.log('\n🏥 DICOM Sample File Downloader\n');
  console.log('=' .repeat(50));
  
  const downloadedFiles = [];
  
  for (const sample of SAMPLE_DICOM_URLS) {
    const destPath = path.join(dataDir, sample.name);
    
    console.log(`\n📁 ${sample.name}`);
    console.log(`   ${sample.description}`);
    
    // Check if already exists
    if (fs.existsSync(destPath)) {
      const verification = verifyDicom(destPath);
      if (verification.valid) {
        console.log(`   ⏭️  Already exists (${(verification.size/1024).toFixed(1)} KB)`);
        downloadedFiles.push({ path: destPath, ...sample, size: verification.size });
        continue;
      } else {
        console.log(`   ⚠️  Existing file invalid, re-downloading...`);
        fs.unlinkSync(destPath);
      }
    }
    
    try {
      await downloadFile(sample.url, destPath);
      
      const verification = verifyDicom(destPath);
      if (verification.valid) {
        console.log(`   ✅ Valid DICOM file (${(verification.size/1024).toFixed(1)} KB)`);
        downloadedFiles.push({ path: destPath, ...sample, size: verification.size });
      } else {
        console.log(`   ❌ Downloaded file is not a valid DICOM`);
        fs.unlinkSync(destPath);
      }
    } catch (error) {
      console.log(`   ❌ Download failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (downloadedFiles.length > 0) {
    console.log('\n✅ Downloaded DICOM files:\n');
    downloadedFiles.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
      console.log(`      Path: ${file.path}`);
    });
    
    // Get a patient ID
    console.log('\n📋 To test upload, run:\n');
    console.log(`   node scripts/test-dicom-upload.js <patientId> "${downloadedFiles[0].path}"`);
    
    // Try to get a real patient ID
    try {
      require('dotenv').config();
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
      const User = require('../models/User');
      const user = await User.findOne({}).select('_id name');
      if (user) {
        console.log(`\n   Example with real patient (${user.name}):`);
        console.log(`   node scripts/test-dicom-upload.js ${user._id} "${downloadedFiles[0].path}"`);
      }
      await mongoose.disconnect();
    } catch (e) {
      // Ignore DB errors
    }
  } else {
    console.log('\n❌ No DICOM files were downloaded successfully.');
    console.log('   Please download manually from: https://www.dicomlibrary.com/');
  }
  
  console.log('\n');
}

main().catch(console.error);
