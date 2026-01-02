/**
 * Database Backup Service
 * =======================
 * Automated daily backups with:
 * - MongoDB dump to local/cloud storage
 * - Retention policy (keep last N backups)
 * - Compression
 * - Notification on success/failure
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Configuration
const CONFIG = {
  BACKUP_DIR: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
  RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthsync',
  BACKUP_TIME: process.env.BACKUP_CRON || '0 2 * * *', // 2 AM daily
  COMPRESS: true,
  NOTIFY_EMAIL: process.env.ADMIN_EMAIL
};

class BackupService {
  constructor() {
    this.backupDir = CONFIG.BACKUP_DIR;
    this.ensureBackupDir();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Generate backup filename with timestamp
   */
  generateBackupName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `healthsync_backup_${timestamp}`;
  }

  /**
   * Parse MongoDB URI to get database name
   */
  getDatabaseName() {
    try {
      const uri = CONFIG.MONGODB_URI;
      const dbName = uri.split('/').pop().split('?')[0];
      return dbName || 'healthsync';
    } catch (error) {
      return 'healthsync';
    }
  }

  /**
   * Run MongoDB backup using mongodump
   */
  async createBackup() {
    const backupName = this.generateBackupName();
    const backupPath = path.join(this.backupDir, backupName);
    const dbName = this.getDatabaseName();

    console.log(`🔄 Starting database backup: ${backupName}`);

    return new Promise((resolve, reject) => {
      // Build mongodump command
      let command = `mongodump --uri="${CONFIG.MONGODB_URI}" --out="${backupPath}"`;
      
      // Add gzip compression if enabled
      if (CONFIG.COMPRESS) {
        command = `mongodump --uri="${CONFIG.MONGODB_URI}" --archive="${backupPath}.gz" --gzip`;
      }

      exec(command, { maxBuffer: 1024 * 1024 * 100 }, async (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Backup failed: ${error.message}`);
          await this.notifyBackupStatus(false, error.message);
          reject(error);
          return;
        }

        const backupFile = CONFIG.COMPRESS ? `${backupPath}.gz` : backupPath;
        const stats = fs.existsSync(backupFile) ? fs.statSync(backupFile) : null;
        const sizeInMB = stats ? (stats.size / (1024 * 1024)).toFixed(2) : 'unknown';

        console.log(`✅ Backup completed: ${backupFile} (${sizeInMB} MB)`);

        // Clean old backups
        await this.cleanOldBackups();

        // Notify success
        await this.notifyBackupStatus(true, null, {
          filename: backupFile,
          size: `${sizeInMB} MB`,
          timestamp: new Date()
        });

        resolve({
          success: true,
          filename: backupFile,
          size: `${sizeInMB} MB`,
          timestamp: new Date()
        });
      });
    });
  }

  /**
   * Create backup using mongoose (alternative method)
   */
  async createBackupWithMongoose() {
    const mongoose = require('mongoose');
    const backupName = this.generateBackupName();
    const backupPath = path.join(this.backupDir, `${backupName}.json`);

    console.log(`🔄 Starting mongoose backup: ${backupName}`);

    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const backup = {};

      for (const collection of collections) {
        const collectionName = collection.name;
        // Skip system collections
        if (collectionName.startsWith('system.')) continue;

        const data = await mongoose.connection.db
          .collection(collectionName)
          .find({})
          .toArray();
        
        backup[collectionName] = data;
        console.log(`  📦 Backed up ${collectionName}: ${data.length} documents`);
      }

      // Write to file
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

      // Compress if enabled
      if (CONFIG.COMPRESS) {
        const zlib = require('zlib');
        const gzip = zlib.createGzip();
        const input = fs.createReadStream(backupPath);
        const output = fs.createWriteStream(`${backupPath}.gz`);
        
        await new Promise((resolve, reject) => {
          input.pipe(gzip).pipe(output)
            .on('finish', resolve)
            .on('error', reject);
        });

        // Remove uncompressed file
        fs.unlinkSync(backupPath);
      }

      const finalPath = CONFIG.COMPRESS ? `${backupPath}.gz` : backupPath;
      const stats = fs.statSync(finalPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`✅ Mongoose backup completed: ${finalPath} (${sizeInMB} MB)`);

      await this.cleanOldBackups();

      return {
        success: true,
        filename: finalPath,
        size: `${sizeInMB} MB`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Mongoose backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups() {
    const retentionMs = CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - retentionMs;

    try {
      const files = fs.readdirSync(this.backupDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime.getTime() < cutoffDate) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deletedCount++;
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned ${deletedCount} old backup(s)`);
      }
    } catch (error) {
      console.error(`Error cleaning old backups: ${error.message}`);
    }
  }

  /**
   * List available backups
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        backups.push({
          filename: file,
          path: filePath,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          created: stats.mtime,
          isDirectory: stats.isDirectory()
        });
      }

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error(`Error listing backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupPath) {
    console.log(`🔄 Starting restore from: ${backupPath}`);

    return new Promise((resolve, reject) => {
      let command;

      if (backupPath.endsWith('.gz')) {
        command = `mongorestore --uri="${CONFIG.MONGODB_URI}" --archive="${backupPath}" --gzip --drop`;
      } else {
        command = `mongorestore --uri="${CONFIG.MONGODB_URI}" "${backupPath}" --drop`;
      }

      exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Restore failed: ${error.message}`);
          reject(error);
          return;
        }

        console.log(`✅ Restore completed from: ${backupPath}`);
        resolve({ success: true, message: 'Restore completed successfully' });
      });
    });
  }

  /**
   * Send notification about backup status
   */
  async notifyBackupStatus(success, error = null, details = null) {
    if (!CONFIG.NOTIFY_EMAIL) return;

    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const subject = success 
        ? '✅ HealthSync Database Backup Successful'
        : '❌ HealthSync Database Backup Failed';

      const html = success
        ? `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #22c55e;">✅ Database Backup Successful</h2>
            <p>Your daily database backup completed successfully.</p>
            <table style="border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Filename:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${details?.filename}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Size:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${details?.size}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Timestamp:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${details?.timestamp}</td></tr>
            </table>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #ef4444;">❌ Database Backup Failed</h2>
            <p>Your daily database backup failed. Please investigate immediately.</p>
            <p><strong>Error:</strong> ${error}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `;

      await transporter.sendMail({
        from: `"HealthSync Backup" <${process.env.EMAIL_USER}>`,
        to: CONFIG.NOTIFY_EMAIL,
        subject,
        html
      });

      console.log(`📧 Backup notification sent to ${CONFIG.NOTIFY_EMAIL}`);
    } catch (emailError) {
      console.error(`Failed to send backup notification: ${emailError.message}`);
    }
  }

  /**
   * Start scheduled backup cron job
   */
  startScheduledBackups() {
    console.log(`⏰ Scheduling daily backups at: ${CONFIG.BACKUP_TIME}`);

    cron.schedule(CONFIG.BACKUP_TIME, async () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🕐 Running scheduled backup - ${new Date().toISOString()}`);
      console.log(`${'='.repeat(50)}\n`);

      try {
        await this.createBackup();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });

    console.log('✅ Backup scheduler started');
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    const backups = this.listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        latestBackup: null,
        oldestBackup: null,
        totalSize: '0 MB'
      };
    }

    const totalSize = backups.reduce((sum, b) => {
      const size = parseFloat(b.size.replace(' MB', ''));
      return sum + size;
    }, 0);

    return {
      totalBackups: backups.length,
      latestBackup: backups[0],
      oldestBackup: backups[backups.length - 1],
      totalSize: `${totalSize.toFixed(2)} MB`,
      retentionDays: CONFIG.RETENTION_DAYS
    };
  }
}

// Export singleton
module.exports = new BackupService();
