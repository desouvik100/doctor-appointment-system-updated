/**
 * Document Generator Component
 * Generate and download PDFs for lab requisitions, clinical summaries, etc.
 */

import { useState } from 'react';
import axios from '../../api/config';
import './DocumentGenerator.css';

const DOCUMENT_TYPES = {
  'lab-requisition': {
    label: 'Lab Requisition',
    icon: '🧪',
    description: 'Generate lab test order form'
  },
  'clinical-summary': {
    label: 'Clinical Summary',
    icon: '📋',
    description: 'Generate visit summary document'
  },
  'discharge-summary': {
    label: 'Discharge Summary',
    icon: '🏥',
    description: 'Generate hospital discharge document'
  },
  'referral-letter': {
    label: 'Referral Letter',
    icon: '📨',
    description: 'Generate specialist referral'
  },
  'prescription': {
    label: 'Prescription',
    icon: '💊',
    description: 'Generate prescription document'
  },
  'invoice': {
    label: 'Invoice',
    icon: '🧾',
    description: 'Generate payment invoice'
  }
};

const DocumentGenerator = ({
  type,
  data,
  patientId,
  doctorId,
  clinicId,
  onGenerated,
  buttonText,
  buttonClassName = '',
  showPreview = true
}) => {
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [error, setError] = useState('');

  const docConfig = DOCUMENT_TYPES[type] || { label: 'Document', icon: '📄' };

  const generatePreview = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/pdf/preview', {
        type,
        data,
        patientId,
        doctorId,
        clinicId
      });

      if (response.data.success) {
        setPreviewHtml(response.data.html);
        setShowPreviewModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = `/api/pdf/${type}`;
      const payload = {
        [getDataKey(type)]: data,
        patientId,
        doctorId,
        clinicId
      };

      const response = await axios.post(endpoint, payload, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onGenerated?.({ type, success: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate PDF');
      onGenerated?.({ type, success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getDataKey = (docType) => {
    const keyMap = {
      'lab-requisition': 'labOrder',
      'clinical-summary': 'visit',
      'discharge-summary': 'admission',
      'referral-letter': 'referral',
      'prescription': 'prescription',
      'invoice': 'payment'
    };
    return keyMap[docType] || 'data';
  };

  const printPreview = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="document-generator">
      <div className="generator-actions">
        {showPreview && (
          <button
            className={`preview-btn ${buttonClassName}`}
            onClick={generatePreview}
            disabled={loading}
          >
            {loading ? '⏳' : '👁️'} Preview
          </button>
        )}
        <button
          className={`download-btn ${buttonClassName}`}
          onClick={downloadPDF}
          disabled={loading}
        >
          {loading ? '⏳ Generating...' : `${docConfig.icon} ${buttonText || `Download ${docConfig.label}`}`}
        </button>
      </div>

      {error && (
        <div className="generator-error">
          ⚠️ {error}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{docConfig.icon} {docConfig.label} Preview</h3>
              <div className="preview-modal-actions">
                <button onClick={printPreview} className="print-btn">
                  🖨️ Print
                </button>
                <button onClick={downloadPDF} className="download-btn">
                  📥 Download PDF
                </button>
                <button onClick={() => setShowPreviewModal(false)} className="close-btn">
                  ✕
                </button>
              </div>
            </div>
            <div className="preview-modal-content">
              <iframe
                srcDoc={previewHtml}
                title="Document Preview"
                className="preview-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick action buttons for common document types
export const LabRequisitionButton = (props) => (
  <DocumentGenerator type="lab-requisition" {...props} />
);

export const ClinicalSummaryButton = (props) => (
  <DocumentGenerator type="clinical-summary" {...props} />
);

export const DischargeSummaryButton = (props) => (
  <DocumentGenerator type="discharge-summary" {...props} />
);

export const ReferralLetterButton = (props) => (
  <DocumentGenerator type="referral-letter" {...props} />
);

export default DocumentGenerator;
