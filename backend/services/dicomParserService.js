/**
 * DICOM Parser Service
 * Extracts metadata from DICOM files for storage and validation
 */

const dicomParser = require('dicom-parser');

// Try to load canvas, but don't fail if not available
let createCanvas = null;
try {
  createCanvas = require('canvas').createCanvas;
} catch (e) {
  console.log('Canvas not available, DICOM to image conversion disabled');
}

// DICOM Tag definitions
const DICOM_TAGS = {
  // Patient Information
  PatientID: 'x00100020',
  PatientName: 'x00100010',
  PatientBirthDate: 'x00100030',
  PatientSex: 'x00100040',
  
  // Study Information
  StudyInstanceUID: 'x0020000d',
  StudyDate: 'x00080020',
  StudyTime: 'x00080030',
  StudyDescription: 'x00081030',
  AccessionNumber: 'x00080050',
  
  // Series Information
  SeriesInstanceUID: 'x0020000e',
  SeriesNumber: 'x00200011',
  SeriesDescription: 'x0008103e',
  Modality: 'x00080060',
  
  // Image Information
  SOPInstanceUID: 'x00080018',
  InstanceNumber: 'x00200013',
  Rows: 'x00280010',
  Columns: 'x00280011',
  BitsAllocated: 'x00280100',
  PixelSpacing: 'x00280030',
  WindowCenter: 'x00281050',
  WindowWidth: 'x00281051',
  SliceLocation: 'x00201041',
  SliceThickness: 'x00180050',
  
  // Institution
  InstitutionName: 'x00080080',
  ReferringPhysicianName: 'x00080090',
  
  // Body Part
  BodyPartExamined: 'x00180015'
};

// Valid DICOM modalities
const VALID_MODALITIES = ['CR', 'CT', 'MR', 'US', 'XA', 'NM', 'PT', 'DX', 'MG', 'OT'];

/**
 * Parse a DICOM file buffer and extract metadata
 * @param {Buffer} fileBuffer - The DICOM file as a buffer
 * @returns {Object} Extracted metadata
 */
function parseDicomFile(fileBuffer) {
  try {
    const byteArray = new Uint8Array(fileBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    
    return {
      success: true,
      metadata: extractMetadata(dataSet),
      isValid: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      isValid: false
    };
  }
}

/**
 * Extract all relevant metadata from a parsed DICOM dataset
 * @param {Object} dataSet - Parsed DICOM dataset
 * @returns {Object} Extracted metadata
 */
function extractMetadata(dataSet) {
  const metadata = {
    patient: extractPatientInfo(dataSet),
    study: extractStudyInfo(dataSet),
    series: extractSeriesInfo(dataSet),
    image: extractImageInfo(dataSet),
    institution: extractInstitutionInfo(dataSet)
  };
  
  return metadata;
}

/**
 * Extract patient information
 */
function extractPatientInfo(dataSet) {
  return {
    patientId: getString(dataSet, DICOM_TAGS.PatientID),
    patientName: formatPatientName(getString(dataSet, DICOM_TAGS.PatientName)),
    birthDate: parseDate(getString(dataSet, DICOM_TAGS.PatientBirthDate)),
    sex: getString(dataSet, DICOM_TAGS.PatientSex)
  };
}

/**
 * Extract study information
 */
function extractStudyInfo(dataSet) {
  return {
    studyInstanceUID: getString(dataSet, DICOM_TAGS.StudyInstanceUID),
    studyDate: parseDate(getString(dataSet, DICOM_TAGS.StudyDate)),
    studyTime: getString(dataSet, DICOM_TAGS.StudyTime),
    studyDescription: getString(dataSet, DICOM_TAGS.StudyDescription),
    accessionNumber: getString(dataSet, DICOM_TAGS.AccessionNumber)
  };
}


/**
 * Extract series information
 */
function extractSeriesInfo(dataSet) {
  const modality = getString(dataSet, DICOM_TAGS.Modality) || 'OT';
  return {
    seriesInstanceUID: getString(dataSet, DICOM_TAGS.SeriesInstanceUID),
    seriesNumber: getNumber(dataSet, DICOM_TAGS.SeriesNumber),
    seriesDescription: getString(dataSet, DICOM_TAGS.SeriesDescription),
    modality: VALID_MODALITIES.includes(modality) ? modality : 'OT',
    bodyPartExamined: getString(dataSet, DICOM_TAGS.BodyPartExamined)
  };
}

/**
 * Extract image information
 */
function extractImageInfo(dataSet) {
  return {
    sopInstanceUID: getString(dataSet, DICOM_TAGS.SOPInstanceUID),
    instanceNumber: getNumber(dataSet, DICOM_TAGS.InstanceNumber),
    rows: getNumber(dataSet, DICOM_TAGS.Rows),
    columns: getNumber(dataSet, DICOM_TAGS.Columns),
    bitsAllocated: getNumber(dataSet, DICOM_TAGS.BitsAllocated),
    pixelSpacing: getNumberArray(dataSet, DICOM_TAGS.PixelSpacing),
    windowCenter: getNumber(dataSet, DICOM_TAGS.WindowCenter),
    windowWidth: getNumber(dataSet, DICOM_TAGS.WindowWidth),
    sliceLocation: getNumber(dataSet, DICOM_TAGS.SliceLocation),
    sliceThickness: getNumber(dataSet, DICOM_TAGS.SliceThickness)
  };
}

/**
 * Extract institution information
 */
function extractInstitutionInfo(dataSet) {
  return {
    institutionName: getString(dataSet, DICOM_TAGS.InstitutionName),
    referringPhysician: formatPatientName(getString(dataSet, DICOM_TAGS.ReferringPhysicianName))
  };
}

// Helper functions

/**
 * Get string value from dataset
 */
function getString(dataSet, tag) {
  try {
    const value = dataSet.string(tag);
    return value ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Get number value from dataset
 */
function getNumber(dataSet, tag) {
  try {
    const value = dataSet.intString(tag);
    return value !== undefined ? value : null;
  } catch {
    try {
      const strValue = dataSet.string(tag);
      return strValue ? parseFloat(strValue) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Get number array from dataset (e.g., pixel spacing)
 */
function getNumberArray(dataSet, tag) {
  try {
    const value = dataSet.string(tag);
    if (!value) return null;
    return value.split('\\').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  } catch {
    return null;
  }
}

/**
 * Parse DICOM date format (YYYYMMDD) to Date object
 */
function parseDate(dateString) {
  if (!dateString || dateString.length < 8) return null;
  
  try {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));
    
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format DICOM patient name (Last^First^Middle) to readable format
 */
function formatPatientName(name) {
  if (!name) return null;
  
  // DICOM names use ^ as separator
  const parts = name.split('^').map(p => p.trim()).filter(p => p);
  
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  
  // Format as "First Last" or "First Middle Last"
  const [lastName, firstName, middleName] = parts;
  
  if (middleName) {
    return `${firstName} ${middleName} ${lastName}`;
  }
  return `${firstName} ${lastName}`;
}

/**
 * Validate if a file is a valid DICOM file
 * @param {Buffer} fileBuffer - The file buffer to validate
 * @returns {Object} Validation result
 */
function validateDicomFile(fileBuffer) {
  try {
    // Check for DICOM magic number "DICM" at offset 128
    if (fileBuffer.length < 132) {
      return { isValid: false, error: 'File too small to be a valid DICOM file' };
    }
    
    const magicNumber = fileBuffer.slice(128, 132).toString('ascii');
    if (magicNumber !== 'DICM') {
      // Try parsing anyway - some DICOM files don't have the preamble
      try {
        const byteArray = new Uint8Array(fileBuffer);
        dicomParser.parseDicom(byteArray);
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'Not a valid DICOM file' };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

/**
 * Check if file extension is valid DICOM
 * @param {string} filename - The filename to check
 * @returns {boolean}
 */
function isValidDicomExtension(filename) {
  if (!filename) return false;
  const ext = filename.toLowerCase().split('.').pop();
  return ['dcm', 'dicom', 'dic'].includes(ext) || !filename.includes('.');
}

/**
 * Extract metadata from multiple DICOM files (for a study)
 * @param {Array<Buffer>} fileBuffers - Array of file buffers
 * @returns {Object} Aggregated study metadata
 */
function parseMultipleDicomFiles(fileBuffers) {
  const results = fileBuffers.map(buffer => parseDicomFile(buffer));
  const validResults = results.filter(r => r.success);
  
  if (validResults.length === 0) {
    return { success: false, error: 'No valid DICOM files found' };
  }
  
  // Group by series
  const seriesMap = new Map();
  
  validResults.forEach(result => {
    const { series, image } = result.metadata;
    const seriesUID = series.seriesInstanceUID;
    
    if (!seriesMap.has(seriesUID)) {
      seriesMap.set(seriesUID, {
        ...series,
        images: []
      });
    }
    
    seriesMap.get(seriesUID).images.push(image);
  });
  
  // Get study info from first valid file
  const firstResult = validResults[0];
  
  return {
    success: true,
    study: {
      ...firstResult.metadata.study,
      patient: firstResult.metadata.patient,
      institution: firstResult.metadata.institution,
      modality: firstResult.metadata.series.modality,
      bodyPartExamined: firstResult.metadata.series.bodyPartExamined,
      series: Array.from(seriesMap.values()),
      totalImages: validResults.length,
      totalSeries: seriesMap.size
    },
    invalidFiles: results.filter(r => !r.success).length
  };
}

module.exports = {
  parseDicomFile,
  parseMultipleDicomFiles,
  validateDicomFile,
  isValidDicomExtension,
  extractMetadata,
  parseDate,
  formatPatientName,
  convertDicomToImage,
  DICOM_TAGS,
  VALID_MODALITIES
};

/**
 * Convert DICOM pixel data to a PNG buffer
 * @param {Buffer} fileBuffer - The DICOM file buffer
 * @param {Object} options - Conversion options { invert: boolean }
 * @returns {Object} { success, imageBuffer, width, height }
 */
function convertDicomToImage(fileBuffer, options = {}) {
  const { invert = false } = options;
  
  // If canvas is not available, skip conversion
  if (!createCanvas) {
    return { success: false, error: 'Canvas not available' };
  }
  
  try {
    const byteArray = new Uint8Array(fileBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    
    const rows = dataSet.uint16(DICOM_TAGS.Rows);
    const columns = dataSet.uint16(DICOM_TAGS.Columns);
    
    if (!rows || !columns) {
      return { success: false, error: 'Missing image dimensions' };
    }
    
    const bitsAllocated = dataSet.uint16(DICOM_TAGS.BitsAllocated) || 16;
    const pixelRepresentation = dataSet.uint16('x00280103') || 0;
    const photometricInterpretation = dataSet.string('x00280004') || 'MONOCHROME2';
    
    // Get window center/width
    let windowCenter = dataSet.intString(DICOM_TAGS.WindowCenter);
    let windowWidth = dataSet.intString(DICOM_TAGS.WindowWidth);
    
    if (typeof windowCenter === 'string' && windowCenter.includes('\\')) {
      windowCenter = parseFloat(windowCenter.split('\\')[0]);
    }
    if (typeof windowWidth === 'string' && windowWidth.includes('\\')) {
      windowWidth = parseFloat(windowWidth.split('\\')[0]);
    }
    
    // Get pixel data
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) {
      return { success: false, error: 'No pixel data found' };
    }
    
    const pixelData = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
    
    // Create canvas
    const canvas = createCanvas(columns, rows);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(columns, rows);
    
    // Convert pixel data
    let minPixel = Infinity;
    let maxPixel = -Infinity;
    const pixelValues = [];
    
    if (bitsAllocated === 16) {
      const pixelData16 = new Int16Array(pixelData.buffer, pixelData.byteOffset, pixelData.length / 2);
      for (let i = 0; i < pixelData16.length && i < rows * columns; i++) {
        let value = pixelRepresentation === 1 ? pixelData16[i] : (pixelData16[i] & 0xFFFF);
        pixelValues.push(value);
        if (value < minPixel) minPixel = value;
        if (value > maxPixel) maxPixel = value;
      }
    } else if (bitsAllocated === 8) {
      for (let i = 0; i < pixelData.length && i < rows * columns; i++) {
        pixelValues.push(pixelData[i]);
        if (pixelData[i] < minPixel) minPixel = pixelData[i];
        if (pixelData[i] > maxPixel) maxPixel = pixelData[i];
      }
    }
    
    // Auto-window if not available
    if (!windowCenter || !windowWidth || isNaN(windowCenter) || isNaN(windowWidth)) {
      windowCenter = (minPixel + maxPixel) / 2;
      windowWidth = maxPixel - minPixel || 1;
    }
    
    const windowMin = windowCenter - windowWidth / 2;
    const windowMax = windowCenter + windowWidth / 2;
    
    // Apply window/level
    for (let i = 0; i < pixelValues.length; i++) {
      let value = pixelValues[i];
      
      if (value <= windowMin) {
        value = 0;
      } else if (value >= windowMax) {
        value = 255;
      } else {
        value = Math.round(((value - windowMin) / windowWidth) * 255);
      }
      
      if (photometricInterpretation === 'MONOCHROME1') {
        value = 255 - value;
      }
      
      // Apply invert if requested
      if (invert) {
        value = 255 - value;
      }
      
      const idx = i * 4;
      imageData.data[idx] = value;
      imageData.data[idx + 1] = value;
      imageData.data[idx + 2] = value;
      imageData.data[idx + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return {
      success: true,
      imageBuffer: canvas.toBuffer('image/png'),
      width: columns,
      height: rows
    };
  } catch (error) {
    console.error('DICOM to image conversion error:', error.message);
    return { success: false, error: error.message };
  }
}
