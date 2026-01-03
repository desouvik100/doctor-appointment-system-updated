/**
 * Centralized Error Logging Service
 * ==================================
 * Comprehensive error tracking with:
 * - Structured error logging
 * - Error categorization and severity
 * - Stack trace capture
 * - Request context preservation
 * - Aggregation and alerting
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  LOG_DIR: process.env.LOG_DIR || path.join(__dirname, '../logs'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_FILES: 5,
  ALERT_THRESHOLD: 10, // Errors per minute to trigger alert
  ALERT_EMAIL: process.env.ADMIN_EMAIL
};

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class ErrorLoggingService {
  constructor() {
    this.logDir = CONFIG.LOG_DIR;
    this.errorCounts = new Map();
    this.recentErrors = [];
    this.ensureLogDir();
    this.startErrorRateMonitor();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current log file path
   */
  getLogFilePath(type = 'app') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    }) + '\n';
  }

  /**
   * Write to log file
   */
  writeToFile(type, entry) {
    const filePath = this.getLogFilePath(type);
    
    try {
      // Check file size and rotate if needed
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > CONFIG.MAX_LOG_SIZE) {
          this.rotateLogFile(filePath);
        }
      }

      fs.appendFileSync(filePath, entry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file
   */
  rotateLogFile(filePath) {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, '.log');
    
    // Shift existing rotated files
    for (let i = CONFIG.MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldPath = path.join(dir, `${basename}.${i}.log`);
      const newPath = path.join(dir, `${basename}.${i + 1}.log`);
      
      if (fs.existsSync(oldPath)) {
        if (i === CONFIG.MAX_LOG_FILES - 1) {
          fs.unlinkSync(oldPath);
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    // Rotate current file
    fs.renameSync(filePath, path.join(dir, `${basename}.1.log`));
  }

  /**
   * Log an error with full context
   */
  logError(error, context = {}) {
    const errorData = {
      name: error.name || 'Error',
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...context,
      request: context.req ? {
        method: context.req.method,
        url: context.req.originalUrl || context.req.url,
        headers: {
          'user-agent': context.req.headers?.['user-agent'],
          'content-type': context.req.headers?.['content-type']
        },
        ip: context.req.ip || context.req.headers?.['x-forwarded-for'],
        userId: context.req.user?.id,
        userRole: context.req.user?.role
      } : undefined
    };

    // Track error for rate monitoring
    this.trackError(errorData);

    // Write to error log
    const entry = this.formatLogEntry('error', error.message, errorData);
    this.writeToFile('error', entry);

    // Console output in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('🔴 ERROR:', error.message);
      if (error.stack) console.error(error.stack);
    }

    return errorData;
  }

  /**
   * Log a warning
   */
  logWarning(message, meta = {}) {
    if (LOG_LEVELS[CONFIG.LOG_LEVEL] < LOG_LEVELS.warn) return;

    const entry = this.formatLogEntry('warn', message, meta);
    this.writeToFile('app', entry);

    if (process.env.NODE_ENV !== 'production') {
      console.warn('🟡 WARNING:', message);
    }
  }

  /**
   * Log info
   */
  logInfo(message, meta = {}) {
    if (LOG_LEVELS[CONFIG.LOG_LEVEL] < LOG_LEVELS.info) return;

    const entry = this.formatLogEntry('info', message, meta);
    this.writeToFile('app', entry);

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔵 INFO:', message);
    }
  }

  /**
   * Log debug
   */
  logDebug(message, meta = {}) {
    if (LOG_LEVELS[CONFIG.LOG_LEVEL] < LOG_LEVELS.debug) return;

    const entry = this.formatLogEntry('debug', message, meta);
    this.writeToFile('app', entry);
  }

  /**
   * Log security event
   */
  logSecurity(event, meta = {}) {
    const entry = this.formatLogEntry('security', event, {
      ...meta,
      category: 'security'
    });
    this.writeToFile('security', entry);

    console.log('🔒 SECURITY:', event);
  }

  /**
   * Log API request
   */
  logRequest(req, res, duration) {
    const entry = this.formatLogEntry('info', 'API Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers?.['x-forwarded-for'],
      userId: req.user?.id,
      userAgent: req.headers?.['user-agent']?.substring(0, 100)
    });
    this.writeToFile('access', entry);
  }

  /**
   * Track error for rate monitoring
   */
  trackError(errorData) {
    const now = Date.now();
    const key = `${errorData.name}:${errorData.message?.substring(0, 50)}`;

    // Add to recent errors
    this.recentErrors.push({ timestamp: now, error: errorData });

    // Keep only last 5 minutes
    const cutoff = now - 5 * 60 * 1000;
    this.recentErrors = this.recentErrors.filter(e => e.timestamp > cutoff);

    // Update error counts
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);

    // Reset counts every minute
    setTimeout(() => {
      const current = this.errorCounts.get(key) || 0;
      if (current > 0) {
        this.errorCounts.set(key, current - 1);
      }
    }, 60000);
  }

  /**
   * Start error rate monitoring
   */
  startErrorRateMonitor() {
    setInterval(() => {
      const errorsLastMinute = this.recentErrors.filter(
        e => e.timestamp > Date.now() - 60000
      ).length;

      if (errorsLastMinute >= CONFIG.ALERT_THRESHOLD) {
        this.sendErrorAlert(errorsLastMinute);
      }
    }, 60000);
  }

  /**
   * Send error rate alert
   */
  async sendErrorAlert(errorCount) {
    if (!CONFIG.ALERT_EMAIL) return;

    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Get recent error summary
      const errorSummary = {};
      this.recentErrors.slice(-20).forEach(e => {
        const key = e.error.name || 'Unknown';
        errorSummary[key] = (errorSummary[key] || 0) + 1;
      });

      await transporter.sendMail({
        from: `"HealthSync Alerts" <${process.env.EMAIL_USER}>`,
        to: CONFIG.ALERT_EMAIL,
        subject: `🚨 High Error Rate Alert - ${errorCount} errors/min`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #ef4444;">🚨 High Error Rate Detected</h2>
            <p><strong>${errorCount}</strong> errors detected in the last minute.</p>
            <h3>Error Summary:</h3>
            <ul>
              ${Object.entries(errorSummary).map(([type, count]) => 
                `<li>${type}: ${count}</li>`
              ).join('')}
            </ul>
            <p>Please check the error logs immediately.</p>
            <p><small>Timestamp: ${new Date().toISOString()}</small></p>
          </div>
        `
      });

      console.log('📧 Error alert sent');
    } catch (error) {
      console.error('Failed to send error alert:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(minutes = 60) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentErrors = this.recentErrors.filter(e => e.timestamp > cutoff);

    const byType = {};
    const byEndpoint = {};

    recentErrors.forEach(e => {
      const type = e.error.name || 'Unknown';
      byType[type] = (byType[type] || 0) + 1;

      const endpoint = e.error.request?.url || 'Unknown';
      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
    });

    return {
      total: recentErrors.length,
      timeRange: `${minutes} minutes`,
      byType,
      byEndpoint,
      errorRate: (recentErrors.length / minutes).toFixed(2) + '/min'
    };
  }

  /**
   * Express error handling middleware
   * Returns standardized error responses with field-specific validation errors
   */
  errorMiddleware() {
    return (err, req, res, next) => {
      // Log the error
      this.logError(err, { req });

      // Determine status code
      const statusCode = err.statusCode || err.status || 500;

      // Build standardized error response
      const errorResponse = {
        success: false,
        message: process.env.NODE_ENV === 'production' && statusCode === 500
          ? 'An error occurred' 
          : err.message,
        code: err.code || this.getErrorCode(statusCode),
      };

      // Add field-specific validation errors if present
      if (err.errors && Array.isArray(err.errors)) {
        errorResponse.errors = err.errors;
      } else if (err.name === 'ValidationError' && err.errors) {
        // Handle Mongoose validation errors
        errorResponse.errors = Object.keys(err.errors).map(field => ({
          field,
          message: err.errors[field].message
        }));
        errorResponse.code = 'VALIDATION_ERROR';
      }

      // Add stack trace in development
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
      }

      res.status(statusCode).json(errorResponse);
    };
  }

  /**
   * Get error code based on status code
   */
  getErrorCode(statusCode) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Request logging middleware
   */
  requestLoggerMiddleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logRequest(req, res, duration);
      });

      next();
    };
  }

  /**
   * Read recent logs
   */
  readLogs(type = 'error', lines = 100) {
    const filePath = this.getLogFilePath(type);
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const allLines = content.trim().split('\n');
      const recentLines = allLines.slice(-lines);
      
      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }

  /**
   * Search logs
   */
  searchLogs(type, query, options = {}) {
    const { startDate, endDate, limit = 100 } = options;
    const logs = this.readLogs(type, 1000);

    return logs.filter(log => {
      // Date filter
      if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
      if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;

      // Query filter
      if (query) {
        const logStr = JSON.stringify(log).toLowerCase();
        if (!logStr.includes(query.toLowerCase())) return false;
      }

      return true;
    }).slice(0, limit);
  }
}

// Export singleton
const errorLoggingService = new ErrorLoggingService();

module.exports = {
  errorLoggingService,
  logError: (error, context) => errorLoggingService.logError(error, context),
  logWarning: (message, meta) => errorLoggingService.logWarning(message, meta),
  logInfo: (message, meta) => errorLoggingService.logInfo(message, meta),
  logDebug: (message, meta) => errorLoggingService.logDebug(message, meta),
  logSecurity: (event, meta) => errorLoggingService.logSecurity(event, meta),
  errorMiddleware: () => errorLoggingService.errorMiddleware(),
  requestLoggerMiddleware: () => errorLoggingService.requestLoggerMiddleware()
};
