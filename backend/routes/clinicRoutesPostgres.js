// routes/clinicRoutesPostgres.js - PostgreSQL-based clinic routes with tenant support
const express = require('express');
const router = express.Router();
const Clinic = require('../models/ClinicPostgres');
const { identifyTenant, ensureTenantContext, validateTenantAccess } = require('../middleware/tenantMiddleware');
const { auth, requireTenantAdmin } = require('../middleware/authMiddlewarePostgres');

// Apply tenant middleware to all routes
router.use(identifyTenant);
router.use(ensureTenantContext);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'PostgreSQL Clinic routes are working!',
    tenant: req.tenant.name,
    tenantId: req.tenantId
  });
});

// GET ALL CLINICS
// GET /api/clinics
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      isActive, 
      parentClinicId, 
      search, 
      city,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (parentClinicId !== undefined) {
      filters.parentClinicId = parentClinicId === 'null' ? null : parentClinicId;
    }
    if (search) filters.search = search;
    if (city) filters.city = city;
    
    // Pagination
    filters.limit = Math.min(parseInt(limit), 100); // Max 100 per page
    filters.offset = (parseInt(page) - 1) * filters.limit;

    const clinics = await Clinic.findAll(req.tenantId, filters);
    const stats = await Clinic.getStats(req.tenantId);

    res.json({
      clinics: clinics.map(clinic => clinic.toSafeJSON()),
      pagination: {
        page: parseInt(page),
        limit: filters.limit,
        hasMore: clinics.length === filters.limit
      },
      stats,
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name
      }
    });

  } catch (err) {
    console.error('Error fetching clinics:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// GET CLINIC BY ID
// GET /api/clinics/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { includeHierarchy } = req.query;

    const clinic = await Clinic.findById(id, req.tenantId);
    if (!clinic) {
      return res.status(404).json({ 
        error: 'Clinic not found',
        message: 'Clinic not found in this tenant' 
      });
    }

    let response = clinic.toSafeJSON();

    // Include hierarchy if requested
    if (includeHierarchy === 'true') {
      const hierarchy = await clinic.getHierarchy();
      response.hierarchy = {
        parent: hierarchy.parent ? hierarchy.parent.toSafeJSON() : null,
        children: hierarchy.children.map(child => child.toSafeJSON())
      };
    }

    res.json(response);

  } catch (err) {
    console.error('Error fetching clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// CREATE CLINIC
// POST /api/clinics
router.post('/', auth(['admin', 'receptionist']), validateTenantAccess, async (req, res) => {
  try {
    const clinicData = req.body;

    // Validate required fields
    if (!clinicData.name) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Clinic name is required' 
      });
    }

    // Convert legacy format to new format if needed
    if (clinicData.address && typeof clinicData.address === 'string') {
      const legacyAddress = {
        street: clinicData.address,
        city: clinicData.city || '',
        state: clinicData.state || '',
        zipCode: clinicData.pincode || '',
        country: 'USA'
      };
      
      const legacyContactInfo = {
        phone: clinicData.phone || '',
        email: clinicData.email || '',
        website: ''
      };

      clinicData.address = legacyAddress;
      clinicData.contactInfo = legacyContactInfo;
      
      if (clinicData.logoUrl) {
        clinicData.settings = { logoUrl: clinicData.logoUrl };
      }
    }

    const clinic = await Clinic.create(clinicData, req.tenantId);

    res.status(201).json({
      message: 'Clinic created successfully',
      clinic: clinic.toSafeJSON()
    });

  } catch (err) {
    console.error('Error creating clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// UPDATE CLINIC
// PUT /api/clinics/:id
router.put('/:id', auth(['admin', 'receptionist']), validateTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const clinic = await Clinic.findById(id, req.tenantId);
    if (!clinic) {
      return res.status(404).json({ 
        error: 'Clinic not found',
        message: 'Clinic not found in this tenant' 
      });
    }

    // Convert legacy format to new format if needed
    if (updateData.address && typeof updateData.address === 'string') {
      const legacyAddress = {
        street: updateData.address,
        city: updateData.city || clinic.address.city || '',
        state: updateData.state || clinic.address.state || '',
        zipCode: updateData.pincode || clinic.address.zipCode || '',
        country: clinic.address.country || 'USA'
      };
      
      const legacyContactInfo = {
        phone: updateData.phone || clinic.contactInfo.phone || '',
        email: updateData.email || clinic.contactInfo.email || '',
        website: clinic.contactInfo.website || ''
      };

      updateData.address = legacyAddress;
      updateData.contact_info = legacyContactInfo;
      
      if (updateData.logoUrl) {
        updateData.settings = { ...clinic.settings, logoUrl: updateData.logoUrl };
      }
    }

    await clinic.update(updateData);

    res.json({
      message: 'Clinic updated successfully',
      clinic: clinic.toSafeJSON()
    });

  } catch (err) {
    console.error('Error updating clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// SOFT DELETE CLINIC (deactivate)
// PUT /api/clinics/:id/deactivate
router.put('/:id/deactivate', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id, req.tenantId);
    if (!clinic) {
      return res.status(404).json({ 
        error: 'Clinic not found',
        message: 'Clinic not found in this tenant' 
      });
    }

    await clinic.softDelete();

    res.json({
      message: 'Clinic deactivated successfully',
      clinic: clinic.toSafeJSON()
    });

  } catch (err) {
    console.error('Error deactivating clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// REACTIVATE CLINIC
// PUT /api/clinics/:id/activate
router.put('/:id/activate', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id, req.tenantId);
    if (!clinic) {
      return res.status(404).json({ 
        error: 'Clinic not found',
        message: 'Clinic not found in this tenant' 
      });
    }

    await clinic.update({ is_active: true });

    res.json({
      message: 'Clinic activated successfully',
      clinic: clinic.toSafeJSON()
    });

  } catch (err) {
    console.error('Error activating clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// HARD DELETE CLINIC (permanent deletion)
// DELETE /api/clinics/:id
router.delete('/:id', requireTenantAdmin, validateTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id, req.tenantId);
    if (!clinic) {
      return res.status(404).json({ 
        error: 'Clinic not found',
        message: 'Clinic not found in this tenant' 
      });
    }

    const deletedClinic = await clinic.delete();

    res.json({
      message: 'Clinic deleted permanently',
      deletedClinic: {
        id: deletedClinic.id,
        name: deletedClinic.name,
        type: deletedClinic.type
      }
    });

  } catch (err) {
    console.error('Error deleting clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// GET CLINIC HIERARCHY
// GET /api/clinics/:id/hierarchy
router.get('/:id/hierarchy', async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id, req.tenantId);
    if (!clinic) {
      return res.status(404).json({ 
        error: 'Clinic not found',
        message: 'Clinic not found in this tenant' 
      });
    }

    const hierarchy = await clinic.getHierarchy();

    res.json({
      current: hierarchy.current.toSafeJSON(),
      parent: hierarchy.parent ? hierarchy.parent.toSafeJSON() : null,
      children: hierarchy.children.map(child => child.toSafeJSON())
    });

  } catch (err) {
    console.error('Error fetching clinic hierarchy:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// GET ROOT CLINICS (clinics without parent)
// GET /api/clinics/root
router.get('/root/list', async (req, res) => {
  try {
    const { search, city, page = 1, limit = 50 } = req.query;
    
    const filters = {
      parentClinicId: null, // Only root clinics
      isActive: true
    };
    
    if (search) filters.search = search;
    if (city) filters.city = city;
    
    // Pagination
    filters.limit = Math.min(parseInt(limit), 100);
    filters.offset = (parseInt(page) - 1) * filters.limit;

    const clinics = await Clinic.findAll(req.tenantId, filters);

    res.json({
      clinics: clinics.map(clinic => clinic.toSafeJSON()),
      pagination: {
        page: parseInt(page),
        limit: filters.limit,
        hasMore: clinics.length === filters.limit
      }
    });

  } catch (err) {
    console.error('Error fetching root clinics:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// GET CLINIC STATISTICS
// GET /api/clinics/stats
router.get('/stats/summary', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const stats = await Clinic.getStats(req.tenantId);

    res.json({
      stats,
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name
      }
    });

  } catch (err) {
    console.error('Error fetching clinic stats:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// LEGACY COMPATIBILITY ROUTE
// GET /api/clinics/legacy (returns data in old MongoDB format)
router.get('/legacy/format', async (req, res) => {
  try {
    const clinics = await Clinic.findAll(req.tenantId, { isActive: true });
    
    // Convert to legacy format for backward compatibility
    const legacyClinics = clinics.map(clinic => clinic.toLegacyJSON());

    res.json(legacyClinics);

  } catch (err) {
    console.error('Error fetching clinics (legacy):', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;