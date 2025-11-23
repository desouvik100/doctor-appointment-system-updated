// middleware/tenantMiddleware.js - Tenant identification and context middleware
const TenantManager = require('../utils/tenantManager');

/**
 * Middleware to identify and validate tenant from request
 * Supports multiple tenant identification methods:
 * 1. Subdomain (e.g., clinic1.yourdomain.com)
 * 2. Header (X-Tenant-ID)
 * 3. Query parameter (?tenant=subdomain)
 */
const identifyTenant = async (req, res, next) => {
  try {
    let tenantIdentifier = null;
    let tenant = null;
    
    // Method 1: Extract from subdomain
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    // Method 2: Check X-Tenant-ID header
    const tenantHeader = req.get('X-Tenant-ID');
    
    // Method 3: Check query parameter
    const tenantQuery = req.query.tenant;
    
    // Priority: Header > Query > Subdomain
    if (tenantHeader) {
      tenantIdentifier = tenantHeader;
    } else if (tenantQuery) {
      tenantIdentifier = tenantQuery;
    } else if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
      tenantIdentifier = subdomain;
    } else {
      // Default to 'default' tenant for development
      tenantIdentifier = 'default';
    }
    
    // Fetch tenant from database
    tenant = await TenantManager.getTenantBySubdomain(tenantIdentifier);
    
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `No tenant found for identifier: ${tenantIdentifier}`,
        code: 'TENANT_NOT_FOUND'
      });
    }
    
    // Add tenant context to request
    req.tenant = tenant;
    req.tenantId = tenant.id;
    
    // Add tenant info to response headers (for debugging)
    res.set('X-Tenant-Name', tenant.name);
    res.set('X-Tenant-ID', tenant.id);
    
    console.log(`🏢 Request for tenant: ${tenant.name} (${tenant.subdomain})`);
    
    next();
    
  } catch (error) {
    console.error('❌ Tenant identification error:', error.message);
    return res.status(500).json({
      error: 'Tenant identification failed',
      message: error.message,
      code: 'TENANT_ERROR'
    });
  }
};\n\n/**\n * Middleware to ensure tenant context exists in database queries\n * This adds tenant_id filter to all database operations\n */\nconst ensureTenantContext = (req, res, next) => {\n  if (!req.tenantId) {\n    return res.status(400).json({\n      error: 'Missing tenant context',\n      message: 'Tenant identification is required for this operation',\n      code: 'MISSING_TENANT_CONTEXT'\n    });\n  }\n  \n  // Add helper function to request for tenant-aware queries\n  req.addTenantFilter = (query, params = []) => {\n    const tenantFilter = query.includes('WHERE') \n      ? ` AND tenant_id = $${params.length + 1}`\n      : ` WHERE tenant_id = $${params.length + 1}`;\n    \n    return {\n      query: query + tenantFilter,\n      params: [...params, req.tenantId]\n    };\n  };\n  \n  next();\n};\n\n/**\n * Middleware for admin-only tenant operations\n */\nconst requireTenantAdmin = (req, res, next) => {\n  if (!req.user || req.user.role !== 'admin') {\n    return res.status(403).json({\n      error: 'Access denied',\n      message: 'Admin privileges required for tenant operations',\n      code: 'INSUFFICIENT_PRIVILEGES'\n    });\n  }\n  \n  next();\n};\n\n/**\n * Middleware to validate tenant access for user\n */\nconst validateTenantAccess = (req, res, next) => {\n  if (!req.user) {\n    return res.status(401).json({\n      error: 'Authentication required',\n      message: 'User must be authenticated to access tenant resources',\n      code: 'AUTHENTICATION_REQUIRED'\n    });\n  }\n  \n  // Check if user belongs to the current tenant\n  if (req.user.tenant_id !== req.tenantId) {\n    return res.status(403).json({\n      error: 'Tenant access denied',\n      message: 'User does not have access to this tenant',\n      code: 'TENANT_ACCESS_DENIED'\n    });\n  }\n  \n  next();\n};\n\nmodule.exports = {\n  identifyTenant,\n  ensureTenantContext,\n  requireTenantAdmin,\n  validateTenantAccess\n};