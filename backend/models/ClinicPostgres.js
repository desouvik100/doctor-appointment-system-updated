// models/ClinicPostgres.js - PostgreSQL Clinic model with tenant support
const { getPool } = require('../config/database');

class Clinic {
  constructor(clinicData) {
    this.id = clinicData.id;
    this.tenantId = clinicData.tenant_id;
    this.name = clinicData.name;
    this.type = clinicData.type || 'clinic';
    this.address = clinicData.address || {};
    this.contactInfo = clinicData.contact_info || {};
    this.parentClinicId = clinicData.parent_clinic_id;
    this.settings = clinicData.settings || {};
    this.timezone = clinicData.timezone || 'UTC';
    this.isActive = clinicData.is_active !== false; // Default to true
    this.createdAt = clinicData.created_at;
    this.updatedAt = clinicData.updated_at;
  }

  /**
   * Create a new clinic
   */
  static async create(clinicData, tenantId) {
    const pool = getPool();
    const { 
      name, 
      type = 'clinic',
      address = {},
      contactInfo = {},
      parentClinicId = null,
      settings = {},
      timezone = 'UTC',
      isActive = true
    } = clinicData;

    try {
      // Validate required fields
      if (!name || name.trim().length === 0) {
        throw new Error('Clinic name is required');
      }

      // Validate parent clinic exists if provided
      if (parentClinicId) {
        const parentClinic = await this.findById(parentClinicId, tenantId);
        if (!parentClinic) {
          throw new Error('Parent clinic not found in this tenant');
        }
      }

      // Insert clinic
      const result = await pool.query(
        `INSERT INTO clinics (tenant_id, name, type, address, contact_info, parent_clinic_id, settings, timezone, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          tenantId, 
          name.trim(), 
          type,
          JSON.stringify(address),
          JSON.stringify(contactInfo),
          parentClinicId,
          JSON.stringify(settings),
          timezone,
          isActive
        ]
      );

      const clinic = new Clinic(result.rows[0]);
      console.log(`✅ Clinic created: ${clinic.name} (${clinic.type})`);
      return clinic;

    } catch (error) {
      console.error('Error creating clinic:', error.message);
      throw error;
    }
  }

  /**
   * Find clinic by ID within tenant
   */
  static async findById(clinicId, tenantId) {
    const pool = getPool();

    try {
      const result = await pool.query(
        'SELECT * FROM clinics WHERE id = $1 AND tenant_id = $2',
        [clinicId, tenantId]
      );

      return result.rows.length > 0 ? new Clinic(result.rows[0]) : null;

    } catch (error) {
      console.error('Error finding clinic by ID:', error.message);
      throw error;
    }
  }

  /**
   * Find all clinics in tenant with optional filters
   */
  static async findAll(tenantId, filters = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM clinics WHERE tenant_id = $1';
    const params = [tenantId];
    let paramCount = 1;

    // Add type filter
    if (filters.type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(filters.type);
    }

    // Add active filter
    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
    }

    // Add parent clinic filter
    if (filters.parentClinicId !== undefined) {
      paramCount++;
      if (filters.parentClinicId === null) {
        query += ` AND parent_clinic_id IS NULL`;
      } else {
        query += ` AND parent_clinic_id = $${paramCount}`;
        params.push(filters.parentClinicId);
      }
    }

    // Add search filter
    if (filters.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR address::text ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Add city filter (from address JSON)
    if (filters.city) {
      paramCount++;
      query += ` AND address->>'city' ILIKE $${paramCount}`;
      params.push(`%${filters.city}%`);
    }

    // Add ordering
    query += ' ORDER BY name ASC';

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
      return result.rows.map(row => new Clinic(row));

    } catch (error) {
      console.error('Error finding clinics:', error.message);
      throw error;
    }
  }

  /**
   * Update clinic
   */
  async update(updateData) {
    const pool = getPool();
    const allowedFields = ['name', 'type', 'address', 'contact_info', 'parent_clinic_id', 'settings', 'timezone', 'is_active'];
    const updates = [];
    const params = [this.id, this.tenantId];
    let paramCount = 2;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        if (['address', 'contact_info', 'settings'].includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else if (key === 'name' && (!value || value.trim().length === 0)) {
          throw new Error('Clinic name cannot be empty');
        } else {
          updates.push(`${key} = $${paramCount}`);
          params.push(key === 'name' ? value.trim() : value);
        }
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('updated_at = NOW()');

    try {
      const query = `UPDATE clinics SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`;
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Clinic not found or access denied');
      }

      // Update current instance
      Object.assign(this, new Clinic(result.rows[0]));
      console.log(`✅ Clinic updated: ${this.name}`);
      return this;

    } catch (error) {
      console.error('Error updating clinic:', error.message);
      throw error;
    }
  }

  /**
   * Delete clinic (soft delete by setting isActive to false)
   */
  async softDelete() {
    return await this.update({ is_active: false });
  }

  /**
   * Hard delete clinic (permanent deletion)
   */
  async delete() {
    const pool = getPool();

    try {
      // Check if clinic has child clinics
      const childClinics = await Clinic.findAll(this.tenantId, { parentClinicId: this.id });
      if (childClinics.length > 0) {
        throw new Error('Cannot delete clinic with child clinics. Delete or reassign child clinics first.');
      }

      // Check if clinic has associated users
      const userCheckResult = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE clinic_id = $1 AND tenant_id = $2',
        [this.id, this.tenantId]
      );

      if (parseInt(userCheckResult.rows[0].count) > 0) {
        throw new Error('Cannot delete clinic with associated users. Reassign users first.');
      }

      // Check if clinic has associated doctors
      const doctorCheckResult = await pool.query(
        'SELECT COUNT(*) as count FROM doctors WHERE clinic_id = $1 AND tenant_id = $2',
        [this.id, this.tenantId]
      );

      if (parseInt(doctorCheckResult.rows[0].count) > 0) {
        throw new Error('Cannot delete clinic with associated doctors. Reassign doctors first.');
      }

      const result = await pool.query(
        'DELETE FROM clinics WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [this.id, this.tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Clinic not found or access denied');
      }

      console.log(`✅ Clinic deleted: ${this.name}`);
      return result.rows[0];

    } catch (error) {
      console.error('Error deleting clinic:', error.message);
      throw error;
    }
  }

  /**
   * Get clinic hierarchy (parent and children)
   */
  async getHierarchy() {
    const pool = getPool();

    try {
      // Get parent clinic
      let parent = null;
      if (this.parentClinicId) {
        parent = await Clinic.findById(this.parentClinicId, this.tenantId);
      }

      // Get child clinics
      const children = await Clinic.findAll(this.tenantId, { parentClinicId: this.id });

      return {
        current: this,
        parent,
        children
      };

    } catch (error) {
      console.error('Error getting clinic hierarchy:', error.message);
      throw error;
    }
  }

  /**
   * Get clinic statistics for tenant
   */
  static async getStats(tenantId) {
    const pool = getPool();

    try {
      const result = await pool.query(
        `SELECT 
           type,
           is_active,
           COUNT(*) as count
         FROM clinics 
         WHERE tenant_id = $1 
         GROUP BY type, is_active`,
        [tenantId]
      );

      const stats = {
        total: 0,
        active: 0,
        inactive: 0,
        byType: {}
      };

      result.rows.forEach(row => {
        const count = parseInt(row.count);
        stats.total += count;
        
        if (row.is_active) {
          stats.active += count;
        } else {
          stats.inactive += count;
        }

        if (!stats.byType[row.type]) {
          stats.byType[row.type] = { active: 0, inactive: 0, total: 0 };
        }
        
        if (row.is_active) {
          stats.byType[row.type].active += count;
        } else {
          stats.byType[row.type].inactive += count;
        }
        stats.byType[row.type].total += count;
      });

      return stats;

    } catch (error) {
      console.error('Error getting clinic stats:', error.message);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      type: this.type,
      address: this.address,
      contactInfo: this.contactInfo,
      parentClinicId: this.parentClinicId,
      settings: this.settings,
      timezone: this.timezone,
      isActive: this.isActive,
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
      type: this.type,
      address: this.address,
      contactInfo: this.contactInfo,
      parentClinicId: this.parentClinicId,
      settings: this.settings,
      timezone: this.timezone,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }

  /**
   * Convert to legacy format for backward compatibility
   */
  toLegacyJSON() {
    return {
      _id: this.id,
      name: this.name,
      type: this.type,
      address: this.address.street || '',
      city: this.address.city || '',
      state: this.address.state || '',
      pincode: this.address.zipCode || '',
      phone: this.contactInfo.phone || '',
      email: this.contactInfo.email || '',
      logoUrl: this.settings.logoUrl || '',
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Clinic;