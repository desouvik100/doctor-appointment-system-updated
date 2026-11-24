

const path = require('path');
const fs = require('fs');
const FILE_CONFIGS = {
  image: {
    maxSize: 5 * 1024 * 1024, 
    allowedMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    magicBytes: {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    }
  },
  document: {
    maxSize: 10 * 1024 * 1024, 
    allowedMimes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    magicBytes: {
      'application/pdf': [0x25, 0x50, 0x44, 0x46],
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47]
    }
  },
  medical: {
    maxSize: 50 * 1024 * 1024, 
    allowedMimes: ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.dcm'],
    magicBytes: {
      'application/pdf': [0x25, 0x50, 0x44, 0x46],
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47]
    }
  }
};
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /eval\(/i,
  /document\./i,
  /window\./i
];

function validateMagicBytes(buffer, expectedMime, config) {
  const magicBytes = config.magicBytes[expectedMime];
  if (!magicBytes) return true; 

  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false;
    }
  }
  return true;
}

function sanitizeFilename(filename) {
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_\.]/g, '_');
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 250 - ext.length) + ext;
  }
  
  return sanitized;
}

function checkDangerousContent(buffer) {
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      return { safe: false, pattern: pattern.toString() };
    }
  }
  
  return { safe: true };
}

function createFileValidator(fileType = 'document') {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.document;

  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    const filesToValidate = Array.isArray(files) ? files : [files];

    for (const file of filesToValidate) {
      if (!file) continue;
      if (file.size > config.maxSize) {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds limit of ${config.maxSize / (1024 * 1024)}MB`,
          maxSize: config.maxSize
        });
      }
      if (!config.allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_FILE_TYPE',
          message: `File type ${file.mimetype} is not allowed`,
          allowedTypes: config.allowedMimes
        });
      }
      const ext = path.extname(file.originalname).toLowerCase();
      if (!config.allowedExtensions.includes(ext)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_EXTENSION',
          message: `File extension ${ext} is not allowed`,
          allowedExtensions: config.allowedExtensions
        });
      }
      if (file.buffer) {
        if (!validateMagicBytes(file.buffer, file.mimetype, config)) {
          return res.status(400).json({
            success: false,
            code: 'FILE_TYPE_MISMATCH',
            message: 'File content does not match declared type'
          });
        }
        const safetyCheck = checkDangerousContent(file.buffer);
        if (!safetyCheck.safe) {
          return res.status(400).json({
            success: false,
            code: 'DANGEROUS_CONTENT',
            message: 'File contains potentially dangerous content'
          });
        }
      } else if (file.path) {
        try {
          const fd = fs.openSync(file.path, 'r');
          const buffer = Buffer.alloc(100);
          fs.readSync(fd, buffer, 0, 100, 0);
          fs.closeSync(fd);

          if (!validateMagicBytes(buffer, file.mimetype, config)) {
            fs.unlinkSync(file.path); 
            return res.status(400).json({
              success: false,
              code: 'FILE_TYPE_MISMATCH',
              message: 'File content does not match declared type'
            });
          }
        } catch (error) {
          console.error('File validation error:', error);
        }
      }
      file.originalname = sanitizeFilename(file.originalname);
    }

    next();
  };
}

const validateImage = createFileValidator('image');

const validateDocument = createFileValidator('document');

const validateMedicalFile = createFileValidator('medical');

function validateFile(options = {}) {
  const config = {
    maxSize: options.maxSize || 10 * 1024 * 1024,
    allowedMimes: options.allowedMimes || ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: options.allowedExtensions || ['.pdf', '.jpg', '.jpeg', '.png'],
    magicBytes: options.magicBytes || FILE_CONFIGS.document.magicBytes
  };

  return createFileValidator('custom');
}

module.exports = {
  validateImage,
  validateDocument,
  validateMedicalFile,
  validateFile,
  sanitizeFilename,
  FILE_CONFIGS
};
