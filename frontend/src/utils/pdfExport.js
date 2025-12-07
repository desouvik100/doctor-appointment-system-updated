// PDF Export Utility using browser's print functionality
// This approach works without external dependencies

export const exportToPDF = (elementId, filename = 'export') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  // Get computed styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');

  // Create print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        ${styles}
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 20px;
          background: white !important;
          color: #1e293b !important;
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

// Export appointments to PDF
export const exportAppointmentsToPDF = (appointments, title = 'Appointments Report') => {
  const content = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">HealthSync</h1>
        <h2 style="color: #64748b; font-weight: normal;">${title}</h2>
        <p style="color: #94a3b8;">Generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Date</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Time</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Patient</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Doctor</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${appointments.map(apt => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                ${new Date(apt.date).toLocaleDateString()}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${apt.time}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                ${apt.userId?.name || apt.patientName || 'N/A'}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                Dr. ${apt.doctorId?.name || 'N/A'}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                <span style="
                  padding: 4px 12px; 
                  border-radius: 20px; 
                  font-size: 12px;
                  background: ${apt.status === 'completed' ? '#dcfce7' : apt.status === 'confirmed' ? '#dbeafe' : apt.status === 'cancelled' ? '#fee2e2' : '#fef3c7'};
                  color: ${apt.status === 'completed' ? '#166534' : apt.status === 'confirmed' ? '#1e40af' : apt.status === 'cancelled' ? '#991b1b' : '#92400e'};
                ">${apt.status}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>Total Appointments: ${appointments.length}</p>
        <p>© ${new Date().getFullYear()} HealthSync - Healthcare Management System</p>
      </div>
    </div>
  `;

  openPrintWindow(content, title);
};

// Export patient report to PDF
export const exportPatientReportPDF = (patient, appointments = [], healthData = {}) => {
  const content = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px;">
        <h1 style="color: #6366f1; margin: 0;">HealthSync</h1>
        <h2 style="color: #1e293b; margin-top: 10px;">Patient Health Report</h2>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Patient Information</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 150px;">Name:</td>
            <td style="padding: 8px 0; font-weight: 600;">${patient.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Email:</td>
            <td style="padding: 8px 0;">${patient.email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Phone:</td>
            <td style="padding: 8px 0;">${patient.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Blood Group:</td>
            <td style="padding: 8px 0;">${healthData.bloodGroup || 'N/A'}</td>
          </tr>
        </table>
      </div>

      ${appointments.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Appointment History</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Date</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Doctor</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${appointments.slice(0, 10).map(apt => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${new Date(apt.date).toLocaleDateString()}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">Dr. ${apt.doctorId?.name || 'N/A'}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${apt.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>© ${new Date().getFullYear()} HealthSync - This is a computer-generated document</p>
      </div>
    </div>
  `;

  openPrintWindow(content, `Patient_Report_${patient.name}`);
};

// Export transaction history to PDF
export const exportTransactionsPDF = (transactions, title = 'Transaction History') => {
  const content = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">HealthSync</h1>
        <h2 style="color: #64748b; font-weight: normal;">${title}</h2>
        <p style="color: #94a3b8;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Date</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Description</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Amount</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(txn => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                ${new Date(txn.createdAt || txn.date).toLocaleDateString()}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                ${txn.description || txn.type || 'Transaction'}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${txn.type === 'credit' ? '#10b981' : '#ef4444'};">
                ${txn.type === 'credit' ? '+' : '-'}₹${txn.amount}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                ${txn.status || 'completed'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; text-align: right; font-weight: bold;">
        Total Transactions: ${transactions.length}
      </div>
    </div>
  `;

  openPrintWindow(content, title);
};

// Helper function to open print window
const openPrintWindow = (content, title) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

export default {
  exportToPDF,
  exportAppointmentsToPDF,
  exportPatientReportPDF,
  exportTransactionsPDF
};
