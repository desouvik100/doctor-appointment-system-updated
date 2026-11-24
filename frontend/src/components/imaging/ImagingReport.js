/**
 * Imaging Report Component
 * Structured template for radiology reports
 */

import React, { useState, useCallback, useEffect } from 'react';
import './ImagingReport.css';

const REPORT_STATUS = {
  DRAFT: 'draft',
  PRELIMINARY: 'preliminary',
  FINAL: 'final',
  AMENDED: 'amended'
};

const REPORT_SECTIONS = [
  { id: 'clinicalHistory', label: 'Clinical History', required: true },
  { id: 'technique', label: 'Technique', required: true },
  { id: 'comparison', label: 'Comparison', required: false },
  { id: 'findings', label: 'Findings', required: true },
  { id: 'impression', label: 'Impression', required: true },
  { id: 'recommendations', label: 'Recommendations', required: false }
];

const ImagingReport = ({
  studyId,
  study,
  patient,
  onSave,
  onExportPDF,
  existingReport = null,
  readOnly = false
}) => {
  const [report, setReport] = useState({
    reportId: existingReport?.reportId || null,
    studyId: studyId,
    status: existingReport?.status || REPORT_STATUS.DRAFT,
    sections: existingReport?.sections || {
      clinicalHistory: '',
      technique: '',
      comparison: '',
      findings: '',
      impression: '',
      recommendations: ''
    },
    keyImages: existingReport?.keyImages || [],
    createdAt: existingReport?.createdAt || null,
    updatedAt: existingReport?.updatedAt || null,
    signedBy: existingReport?.signedBy || null,
    signedAt: existingReport?.signedAt || null
  });

  const [activeSection, setActiveSection] = useState('findings');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Auto-populate from study metadata
  useEffect(() => {
    if (study && !existingReport) {
      setReport(prev => ({
        ...prev,
        sections: {
          ...prev.sections,
          technique: generateTechniqueText(study)
        }
      }));
    }
  }, [study, existingReport]);

  const generateTechniqueText = (study) => {
    if (!study) return '';
    
    const parts = [];
    if (study.modality) parts.push(study.modality);
    if (study.bodyPart) parts.push(`of the ${study.bodyPart}`);
    if (study.contrastUsed) parts.push('with contrast');
    
    return parts.join(' ') + ' was performed.';
  };

  const handleSectionChange = useCallback((sectionId, value) => {
    if (readOnly) return;
    
    setReport(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: value
      },
      updatedAt: new Date().toISOString()
    }));
  }, [readOnly]);

  const validateReport = useCallback(() => {
    const errors = [];
    
    REPORT_SECTIONS.forEach(section => {
      if (section.required && !report.sections[section.id]?.trim()) {
        errors.push(`${section.label} is required`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [report.sections]);

  const handleSave = useCallback(async (newStatus = null) => {
    if (readOnly) return;
    
    const statusToSave = newStatus || report.status;
    
    // Validate for final/preliminary status
    if (statusToSave !== REPORT_STATUS.DRAFT && !validateReport()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const reportData = {
        ...report,
        status: statusToSave,
        updatedAt: new Date().toISOString()
      };
      
      if (statusToSave === REPORT_STATUS.FINAL && !report.signedAt) {
        reportData.signedAt = new Date().toISOString();
      }
      
      if (onSave) {
        await onSave(reportData);
      }
      
      setReport(reportData);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setIsSaving(false);
    }
  }, [report, readOnly, validateReport, onSave]);

  const handleExportPDF = useCallback(async () => {
    if (onExportPDF) {
      await onExportPDF(report);
    }
  }, [report, onExportPDF]);

  const addKeyImage = useCallback((imageData) => {
    setReport(prev => ({
      ...prev,
      keyImages: [...prev.keyImages, {
        imageId: `img_${Date.now()}`,
        ...imageData,
        addedAt: new Date().toISOString()
      }]
    }));
  }, []);

  const removeKeyImage = useCallback((imageId) => {
    setReport(prev => ({
      ...prev,
      keyImages: prev.keyImages.filter(img => img.imageId !== imageId)
    }));
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case REPORT_STATUS.DRAFT: return 'status-draft';
      case REPORT_STATUS.PRELIMINARY: return 'status-preliminary';
      case REPORT_STATUS.FINAL: return 'status-final';
      case REPORT_STATUS.AMENDED: return 'status-amended';
      default: return '';
    }
  };

  return (
    <div className="imaging-report">
      {/* Header */}
      <div className="report-header">
        <div className="header-info">
          <h2>Imaging Report</h2>
          <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
            {report.status.toUpperCase()}
          </span>
        </div>
        
        <div className="header-actions">
          {!readOnly && (
            <>
              <button 
                className="btn-save"
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                <i className="fas fa-save"></i>
                Save Draft
              </button>
              
              {report.status === REPORT_STATUS.DRAFT && (
                <button 
                  className="btn-preliminary"
                  onClick={() => handleSave(REPORT_STATUS.PRELIMINARY)}
                  disabled={isSaving}
                >
                  Mark Preliminary
                </button>
              )}
              
              {(report.status === REPORT_STATUS.DRAFT || report.status === REPORT_STATUS.PRELIMINARY) && (
                <button 
                  className="btn-finalize"
                  onClick={() => handleSave(REPORT_STATUS.FINAL)}
                  disabled={isSaving}
                >
                  <i className="fas fa-check"></i>
                  Finalize & Sign
                </button>
              )}
            </>
          )}
          
          <button className="btn-export" onClick={handleExportPDF}>
            <i className="fas fa-file-pdf"></i>
            Export PDF
          </button>
        </div>
      </div>

      {/* Patient & Study Info */}
      <div className="report-meta">
        <div className="meta-section">
          <h4>Patient Information</h4>
          <div className="meta-grid">
            <div className="meta-item">
              <span className="label">Name:</span>
              <span className="value">{patient?.name || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="label">ID:</span>
              <span className="value">{patient?.patientId || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="label">DOB:</span>
              <span className="value">{patient?.dateOfBirth || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="label">Gender:</span>
              <span className="value">{patient?.gender || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="meta-section">
          <h4>Study Information</h4>
          <div className="meta-grid">
            <div className="meta-item">
              <span className="label">Modality:</span>
              <span className="value">{study?.modality || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="label">Study Date:</span>
              <span className="value">
                {study?.studyDate ? new Date(study.studyDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="meta-item">
              <span className="label">Accession #:</span>
              <span className="value">{study?.accessionNumber || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="label">Referring:</span>
              <span className="value">{study?.referringPhysician || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <i className="fas fa-exclamation-triangle"></i>
          <ul>
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Report Sections */}
      <div className="report-content">
        <div className="section-tabs">
          {REPORT_SECTIONS.map(section => (
            <button
              key={section.id}
              className={`section-tab ${activeSection === section.id ? 'active' : ''} ${section.required ? 'required' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
              {section.required && <span className="required-marker">*</span>}
            </button>
          ))}
        </div>

        <div className="section-content">
          {REPORT_SECTIONS.map(section => (
            <div
              key={section.id}
              className={`section-panel ${activeSection === section.id ? 'active' : ''}`}
            >
              <textarea
                value={report.sections[section.id]}
                onChange={(e) => handleSectionChange(section.id, e.target.value)}
                placeholder={`Enter ${section.label.toLowerCase()}...`}
                disabled={readOnly}
                rows={10}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Key Images */}
      <div className="key-images-section">
        <h4>Key Images ({report.keyImages.length})</h4>
        <div className="key-images-grid">
          {report.keyImages.map(img => (
            <div key={img.imageId} className="key-image-item">
              <img src={img.thumbnailUrl} alt={img.label || 'Key image'} />
              {img.label && <span className="image-label">{img.label}</span>}
              {!readOnly && (
                <button 
                  className="remove-image"
                  onClick={() => removeKeyImage(img.imageId)}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
          {report.keyImages.length === 0 && (
            <div className="no-images">
              <i className="fas fa-image"></i>
              <p>No key images added</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature */}
      {report.signedAt && (
        <div className="signature-section">
          <div className="signature-line">
            <span className="signed-by">{report.signedBy || 'Radiologist'}</span>
            <span className="signed-date">
              Electronically signed on {new Date(report.signedAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Export for testing
export { REPORT_STATUS, REPORT_SECTIONS };

export default ImagingReport;
