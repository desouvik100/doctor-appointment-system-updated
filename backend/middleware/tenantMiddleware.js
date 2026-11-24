
const TenantManager = require('../utils/tenantManager');

const identifyTenant = async (req, res, next) => {
  try {
    let tenantIdentifier = null;
    let tenant = null;
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    const tenantHeader = req.get('X-Tenant-ID');
    const tenantQuery = req.query.tenant;
    if (tenantHeader) {
      tenantIdentifier = tenantHeader;
    } else if (tenantQuery) {
      tenantIdentifier = tenantQuery;
    } else if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
      tenantIdentifier = subdomain;
    } else {
      tenantIdentifier = 'default';
    }
    tenant = await TenantManager.getTenantBySubdomain(tenantIdentifier);
    
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `No tenant found for identifier: ${tenantIdentifier}`,
        code: 'TENANT_NOT_FOUND'
      });
    }
    req.tenant = tenant;
    req.tenantId = tenant.id;
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
};\n\n\nconst ensureTenantContext = (req, res, next) => {\n  if (!req.tenantId) {\n    return res.status(400).json({\n      error: 'Missing tenant context',\n      message: 'Tenant identification is required for this operation',\n      code: 'MISSING_TENANT_CONTEXT'\n    });\n  }\n  \n  