// utils/tenantManager.js - Tenant management utilities
const { getPool } = require('../config/database');

class TenantManager {
  
  /**
   * Create a new tenant
   */
  static async createTenant(tenantData) {
    const pool = getPool();
    const { name, subdomain, settings = {}, subscriptionInfo = {} } = tenantData;
    
    try {
      const result = await pool.query(
        `INSERT INTO tenants (name, subdomain, settings, subscription_info) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, subdomain, JSON.stringify(settings), JSON.stringify(subscriptionInfo)]
      );
      
      console.log(`✅ Tenant created: ${name} (${subdomain})`);
      return result.rows[0];
      
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Tenant with subdomain '${subdomain}' already exists`);
      }
      throw error;
    }
  }
  
  /**
   * Get tenant by subdomain
   */
  static async getTenantBySubdomain(subdomain) {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE subdomain = $1',
        [subdomain]
      );
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Error fetching tenant:', error.message);
      throw error;
    }
  }
  
  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId) {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE id = $1',
        [tenantId]
      );
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Error fetching tenant by ID:', error.message);
      throw error;
    }
  }
  
  /**
   * Update tenant settings
   */
  static async updateTenantSettings(tenantId, settings) {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        `UPDATE tenants 
         SET settings = $2, updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [tenantId, JSON.stringify(settings)]
      );
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Error updating tenant settings:', error.message);
      throw error;
    }
  }
  
  /**
   * Get all tenants (admin function)
   */
  static async getAllTenants() {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'SELECT * FROM tenants ORDER BY created_at DESC'
      );
      
      return result.rows;
      
    } catch (error) {
      console.error('Error fetching all tenants:', error.message);
      throw error;
    }
  }
  
  /**
   * Delete tenant (careful - cascades to all related data)
   */
  static async deleteTenant(tenantId) {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'DELETE FROM tenants WHERE id = $1 RETURNING *',
        [tenantId]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ Tenant deleted: ${result.rows[0].name}`);
        return result.rows[0];
      }
      
      return null;
      
    } catch (error) {
      console.error('Error deleting tenant:', error.message);
      throw error;
    }
  }
  
  /**
   * Get default tenant (for backward compatibility)
   */
  static async getDefaultTenant() {
    return await this.getTenantBySubdomain('default');
  }
  
  /**
   * Provision a new tenant with default data
   */
  static async provisionTenant(tenantData) {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, subdomain, settings, subscription_info) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          tenantData.name, 
          tenantData.subdomain, 
          JSON.stringify(tenantData.settings || {}), 
          JSON.stringify(tenantData.subscriptionInfo || {})
        ]
      );
      
      const tenant = tenantResult.rows[0];
      
      // Create default clinic for the tenant
      if (tenantData.defaultClinic) {
        await client.query(
          `INSERT INTO clinics (tenant_id, name, address, contact_info) 
           VALUES ($1, $2, $3, $4)`,
          [
            tenant.id,
            tenantData.defaultClinic.name,
            JSON.stringify(tenantData.defaultClinic.address || {}),
            JSON.stringify(tenantData.defaultClinic.contactInfo || {})
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log(`✅ Tenant provisioned: ${tenant.name} (${tenant.subdomain})`);
      
      return tenant;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TenantManager;