/**
 * LabRequisitionPrint Component
 * Generates PDF-ready lab requisition with patient details and ordered tests
 * Requirements: 2.4
 */

import { forwardRef } from 'react';
import './LabRequisitionPrint.css';

const LabRequisitionPrint = forwardRef(({ 
  order, 
  patient, 
  clinic,
  doctor 
}, ref) => {
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate patient age
  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Check if any test requires fasting
  const hasFastingTests = () => {
    return order?.tests?.some(test => test.fasting);
  };

  // Get urgency label
  const getUrgencyLabel = (urgency) => {
    const labels = {
      routine: 'Routine',
      urgent: 'URGENT',
      stat: 'STAT - IMMEDIATE'
    };
    return labels[urgency] || 'Routine';
  };

  if (!order) return null;

  return (
    <div className="lab-requisition-print" ref={ref}>
      {/* Header */}
      <div className="requisition-header">
        <div className="clinic-info">
          <h1 className="clinic-name">{clinic?.name || 'Medical Clinic'}</h1>
          <p className="clinic-address">{clinic?.address || ''}</p>
          <p className="clinic-contact">
            {clinic?.phone && `Tel: ${clinic.phone}`}
            {clinic?.email && ` | Email: ${clinic.email}`}
          </p>
        </div>
        <div className="document-info">
          <h2 className="document-title">LABORATORY REQUISITION</h2>
          <div className="order-number-box">
            <span className="label">Order #:</span>
            <span className="value">{order.orderNumber}</span>
          </div>
        </div>
      </div>

      {/* Urgency Banner */}
      {order.tests?.[0]?.urgency && order.tests[0].urgency !== 'routine' && (
        <div className={`urgency-banner urgency-${order.tests[0].urgency}`}>
          ⚠️ {getUrgencyLabel(order.tests[0].urgency)} PROCESSING REQUIRED
        </div>
      )}

      {/* Patient Information */}
      <section className="patient-section">
        <h3 className="section-title">Patient Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Patient Name:</span>
            <span className="value">{patient?.name || '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Patient ID:</span>
            <span className="value">{patient?.patientId || patient?._id || '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Date of Birth:</span>
            <span className="value">{formatDate(patient?.dateOfBirth)}</span>
          </div>
          <div className="info-item">
            <span className="label">Age:</span>
            <span className="value">{calculateAge(patient?.dateOfBirth)} years</span>
          </div>
          <div className="info-item">
            <span className="label">Gender:</span>
            <span className="value">{patient?.gender || '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Phone:</span>
            <span className="value">{patient?.phone || '-'}</span>
          </div>
        </div>
      </section>

      {/* Order Information */}
      <section className="order-section">
        <h3 className="section-title">Order Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Order Date:</span>
            <span className="value">{formatDate(order.orderDate)} {formatTime(order.orderDate)}</span>
          </div>
          <div className="info-item">
            <span className="label">Ordering Physician:</span>
            <span className="value">{doctor?.name || order.orderedBy?.name || '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Priority:</span>
            <span className={`value priority-${order.tests?.[0]?.urgency || 'routine'}`}>
              {getUrgencyLabel(order.tests?.[0]?.urgency)}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Expected Completion:</span>
            <span className="value">{formatDate(order.expectedCompletionDate)}</span>
          </div>
        </div>
      </section>

      {/* Tests Ordered */}
      <section className="tests-section">
        <h3 className="section-title">Tests Ordered</h3>
        <table className="tests-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Test Name</th>
              <th>Category</th>
              <th>Sample Type</th>
              <th>Special Requirements</th>
            </tr>
          </thead>
          <tbody>
            {order.tests?.map((test, idx) => (
              <tr key={idx}>
                <td className="test-code">{test.testCode}</td>
                <td className="test-name">{test.testName}</td>
                <td>{test.category}</td>
                <td>{test.sampleType || 'Blood'}</td>
                <td>
                  {test.fasting && <span className="fasting-badge">Fasting Required</span>}
                  {test.fromPanel && <span className="panel-badge">Panel: {test.fromPanel}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tests-summary">
          <span>Total Tests: {order.tests?.length || 0}</span>
        </div>
      </section>

      {/* Fasting Instructions */}
      {hasFastingTests() && (
        <section className="fasting-section">
          <h3 className="section-title">⚠️ Fasting Instructions</h3>
          <div className="fasting-content">
            <p>One or more tests require fasting. Please ensure the patient has:</p>
            <ul>
              <li>Fasted for at least 8-12 hours before sample collection</li>
              <li>Only consumed water during the fasting period</li>
              <li>Avoided alcohol for 24 hours prior to testing</li>
            </ul>
          </div>
        </section>
      )}

      {/* Clinical Notes */}
      {order.clinicalNotes && (
        <section className="notes-section">
          <h3 className="section-title">Clinical Notes</h3>
          <p className="notes-content">{order.clinicalNotes}</p>
        </section>
      )}

      {/* Patient Instructions */}
      {order.patientInstructions && (
        <section className="instructions-section">
          <h3 className="section-title">Patient Instructions</h3>
          <p className="instructions-content">{order.patientInstructions}</p>
        </section>
      )}

      {/* Sample Collection */}
      <section className="collection-section">
        <h3 className="section-title">Sample Collection (Lab Use Only)</h3>
        <div className="collection-grid">
          <div className="collection-item">
            <span className="label">Collection Date:</span>
            <span className="value-line"></span>
          </div>
          <div className="collection-item">
            <span className="label">Collection Time:</span>
            <span className="value-line"></span>
          </div>
          <div className="collection-item">
            <span className="label">Collected By:</span>
            <span className="value-line"></span>
          </div>
          <div className="collection-item">
            <span className="label">Specimen ID:</span>
            <span className="value-line"></span>
          </div>
        </div>
        <div className="specimen-checklist">
          <h4>Specimens Collected:</h4>
          <div className="checklist-items">
            <label><input type="checkbox" /> Blood (Red Top)</label>
            <label><input type="checkbox" /> Blood (Purple Top - EDTA)</label>
            <label><input type="checkbox" /> Blood (Blue Top - Citrate)</label>
            <label><input type="checkbox" /> Blood (Green Top - Heparin)</label>
            <label><input type="checkbox" /> Urine</label>
            <label><input type="checkbox" /> Other: ___________</label>
          </div>
        </div>
      </section>

      {/* Signatures */}
      <section className="signatures-section">
        <div className="signature-box">
          <div className="signature-line"></div>
          <span className="signature-label">Ordering Physician Signature</span>
        </div>
        <div className="signature-box">
          <div className="signature-line"></div>
          <span className="signature-label">Date</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="requisition-footer">
        <p className="footer-note">
          This requisition is valid for 30 days from the order date. 
          Please bring this form and a valid ID to the laboratory.
        </p>
        <div className="barcode-placeholder">
          <span className="barcode-text">{order.orderNumber}</span>
        </div>
        <p className="print-date">
          Printed: {new Date().toLocaleString()}
        </p>
      </footer>
    </div>
  );
});

LabRequisitionPrint.displayName = 'LabRequisitionPrint';

export default LabRequisitionPrint;
