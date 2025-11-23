// models/UserPostgres.js - PostgreSQL User model with tenant support
const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.tenantId = userData.tenant_id;
    this.name = userData.name;
    this.email = userData.email;
    this.passwordHash = userData.password_hash;
    this.role = userData.role;
    this.clinicId = userData.clinic_id;
    this.profile = userData.profile || {};
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  /**
   * Create a new user
   */
  static async create(userData, tenantId) {
    const pool = getPool();
    const { name, email, password, role = 'patient', clinicId = null, profile = {} } = userData;

    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, clinic_id, profile) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [tenantId, name, email.toLowerCase().trim(), passwordHash, role, clinicId, JSON.stringify(profile)]
      );

      const user = new User(result.rows[0]);
      console.log(`✅ User created: ${user.email} (${user.role})`);
      return user;

    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists in this tenant');
      }
      throw error;
    }
  }

  /**
   * Find user by email within tenant
   */
  static async findByEmail(email, tenantId) {
    const pool = getPool();

    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
        [email.toLowerCase().trim(), tenantId]
      );

      return result.rows.length > 0 ? new User(result.rows[0]) : null;

    } catch (error) {
      console.error('Error finding user by email:', error.message);
      throw error;
    }
  }

  /**
   * Find user by ID within tenant
   */
  static async findById(userId, tenantId) {
    const pool = getPool();

    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
        [userId, tenantId]
      );

      return result.rows.length > 0 ? new User(result.rows[0]) : null;

    } catch (error) {
      console.error('Error finding user by ID:', error.message);
      throw error;
    }
  }

  /**
   * Find all users in tenant with optional filters
   */
  static async findAll(tenantId, filters = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM users WHERE tenant_id = $1';
    const params = [tenantId];
    let paramCount = 1;

    // Add role filter
    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    // Add clinic filter
    if (filters.clinicId) {
      paramCount++;
      query += ` AND clinic_id = $${paramCount}`;
      params.push(filters.clinicId);
    }

    // Add search filter
    if (filters.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Add ordering
    query += ' ORDER BY created_at DESC';

    // Add pagination
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }
    }

    try {
      const result = await pool.query(query, params);
      return result.rows.map(row => new User(row));

    } catch (error) {
      console.error('Error finding users:', error.message);
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(updateData) {
    const pool = getPool();
    const allowedFields = ['name', 'email', 'role', 'clinic_id', 'profile'];
    const updates = [];
    const params = [this.id, this.tenantId];
    let paramCount = 2;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        if (key === 'profile') {
          updates.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else if (key === 'email') {
          updates.push(`${key} = $${paramCount}`);
          params.push(value.toLowerCase().trim());
        } else {
          updates.push(`${key} = $${paramCount}`);
          params.push(value);
        }
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('updated_at = NOW()');

    try {
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`;
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('User not found or access denied');
      }

      // Update current instance
      Object.assign(this, result.rows[0]);
      console.log(`✅ User updated: ${this.email}`);
      return this;

    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists in this tenant');
      }
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    const pool = getPool();

    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const result = await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
        [passwordHash, this.id, this.tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found or access denied');
      }

      this.passwordHash = passwordHash;
      console.log(`✅ Password updated for user: ${this.email}`);
      return this;

    } catch (error) {
      console.error('Error updating password:', error.message);
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch (error) {
      console.error('Error verifying password:', error.message);
      return false;
    }
  }

  /**
   * Delete user
   */
  async delete() {
    const pool = getPool();

    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [this.id, this.tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found or access denied');
      }

      console.log(`✅ User deleted: ${this.email}`);
      return result.rows[0];

    } catch (error) {
      console.error('Error deleting user:', error.message);
      throw error;
    }
  }

  /**
   * Get user statistics for tenant
   */
  static async getStats(tenantId) {
    const pool = getPool();

    try {
      const result = await pool.query(
        `SELECT 
           role,
           COUNT(*) as count
         FROM users 
         WHERE tenant_id = $1 
         GROUP BY role`,
        [tenantId]
      );

      const stats = {
        total: 0,
        byRole: {}
      };

      result.rows.forEach(row => {
        stats.byRole[row.role] = parseInt(row.count);
        stats.total += parseInt(row.count);
      });

      return stats;

    } catch (error) {
      console.error('Error getting user stats:', error.message);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      email: this.email,
      role: this.role,
      clinicId: this.clinicId,
      profile: this.profile,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convert to safe JSON for client (exclude internal IDs)
   */
  toSafeJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      clinicId: this.clinicId,
      profile: this.profile,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;