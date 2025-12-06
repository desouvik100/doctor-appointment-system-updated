// backend/services/invoiceService.js
// Professional Invoice generation and email service

const { sendEmail } = require('./emailService');

// Generate unique invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `HS-INV-${year}${month}${day}-${random}`;
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

// Format date
function formatDate(date, format = 'long') {
  const d = new Date(date);
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Generate professional invoice HTML
function generateInvoiceHTML(invoiceData) {
  const {
    invoiceNumber,
    patient,
    doctor,
    clinic,
    appointment,
    payment,
    generatedAt
  } = invoiceData;

  const invoiceDate = formatDate(generatedAt || Date.now());
  const appointmentDate = appointment?.date ? formatDate(appointment.date) : invoiceDate;

  // Calculate amounts
  const consultationFee = payment?.consultationFee || payment?.amount || doctor?.consultationFee || 500;
  const platformFee = payment?.platformFee || Math.round(consultationFee * 0.07);
  const subtotal = consultationFee + platformFee;
  const taxRate = 18;
  const tax = payment?.tax || Math.round(subtotal * (taxRate / 100));
  const discount = payment?.discount || 0;
  const totalAmount = payment?.totalAmount || (subtotal + tax - discount);
  const amountInWords = numberToWords(totalAmount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} - HealthSync</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 14px; 
      color: #1a1a2e; 
      line-height: 1.6; 
      background: #f0f2f5;
      padding: 20px;
    }
    
    .invoice-wrapper {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    /* Header Section */
    .invoice-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      color: white;
      padding: 40px 50px;
      position: relative;
      overflow: hidden;
    }
    
    .invoice-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    
    .invoice-header::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }
    
    .company-brand {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .company-logo {
      width: 70px;
      height: 70px;
      background: white;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }
    
    .company-info h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
      letter-spacing: -0.5px;
    }
    
    .company-info p {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 42px;
      font-weight: 300;
      letter-spacing: 3px;
      margin-bottom: 15px;
    }
    
    .invoice-number-box {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 500;
      display: inline-block;
    }
    
    .invoice-date {
      margin-top: 15px;
      font-size: 13px;
      opacity: 0.9;
    }
    
    /* Status Badge */
    .status-ribbon {
      position: absolute;
      top: 25px;
      right: -35px;
      background: ${payment?.status === 'completed' || payment?.status === 'success' ? '#10b981' : '#f59e0b'};
      color: white;
      padding: 8px 50px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      transform: rotate(45deg);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    /* Body Section */
    .invoice-body {
      padding: 50px;
    }
    
    /* Parties Section */
    .parties-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .party-card {
      background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e2e8f0;
    }
    
    .party-card h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #667eea;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .party-card .name {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 12px;
    }
    
    .party-card .detail {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
      font-size: 13px;
      color: #64748b;
    }
    
    .party-card .detail i {
      width: 20px;
      color: #667eea;
    }
    
    /* Appointment Details */
    .appointment-section {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 40px;
      border: 2px solid #667eea30;
    }
    
    .appointment-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .appointment-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    
    .appointment-item {
      text-align: center;
      padding: 15px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .appointment-item .icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .appointment-item .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 5px;
    }
    
    .appointment-item .value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }

    /* Items Table */
    .items-section {
      margin-bottom: 40px;
    }
    
    .items-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 20px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    
    .items-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .items-table th {
      color: white;
      padding: 18px 20px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    .items-table th:last-child {
      text-align: right;
    }
    
    .items-table td {
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;
      background: white;
    }
    
    .items-table tr:last-child td {
      border-bottom: none;
    }
    
    .items-table tr:hover td {
      background: #f8fafc;
    }
    
    .items-table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    
    .item-name {
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    
    .item-desc {
      font-size: 12px;
      color: #64748b;
    }
    
    .item-code {
      display: inline-block;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
    }
    
    /* Totals Section */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .totals-box {
      width: 380px;
      background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e2e8f0;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 14px;
    }
    
    .total-row.subtotal {
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 15px;
      margin-bottom: 10px;
    }
    
    .total-row.discount {
      color: #10b981;
    }
    
    .total-row.grand-total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 15px -25px -25px;
      padding: 20px 25px;
      border-radius: 0 0 16px 16px;
      font-size: 18px;
      font-weight: 700;
    }
    
    .amount-words {
      font-size: 12px;
      color: #64748b;
      font-style: italic;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px dashed #e2e8f0;
    }

    /* Payment Info */
    .payment-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .payment-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    
    .payment-card h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 15px;
    }
    
    .payment-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .payment-status.paid {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #16a34a;
    }
    
    .payment-status.pending {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #d97706;
    }
    
    .payment-detail {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    
    .payment-detail:last-child {
      border-bottom: none;
    }
    
    /* Terms Section */
    .terms-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 40px;
    }
    
    .terms-section h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 15px;
    }
    
    .terms-section ul {
      list-style: none;
      padding: 0;
    }
    
    .terms-section li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 10px 0;
      font-size: 12px;
      color: #64748b;
    }
    
    .terms-section li::before {
      content: '✓';
      color: #667eea;
      font-weight: bold;
    }
    
    /* Footer */
    .invoice-footer {
      background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
      color: white;
      padding: 40px 50px;
      text-align: center;
    }
    
    .footer-brand {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 15px;
    }
    
    .footer-contact {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    
    .footer-contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      opacity: 0.9;
    }
    
    .footer-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      margin: 25px 0;
    }
    
    .footer-legal {
      font-size: 11px;
      opacity: 0.7;
      line-height: 1.8;
    }
    
    /* QR Code Section */
    .qr-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      margin-top: 20px;
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 8px;
      padding: 5px;
      object-fit: contain;
    }
    
    .qr-info {
      text-align: left;
      font-size: 12px;
    }
    
    /* Print Styles */
    @media print {
      body { background: white; padding: 0; }
      .invoice-wrapper { box-shadow: none; border-radius: 0; }
      .status-ribbon { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    
    @media (max-width: 600px) {
      .header-content { flex-direction: column; gap: 30px; }
      .invoice-meta { text-align: left; }
      .parties-section { grid-template-columns: 1fr; }
      .appointment-grid { grid-template-columns: repeat(2, 1fr); }
      .payment-info { grid-template-columns: 1fr; }
      .totals-box { width: 100%; }
      .footer-contact { flex-direction: column; gap: 15px; }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="status-ribbon">${payment?.status === 'completed' || payment?.status === 'success' ? 'PAID' : 'PENDING'}</div>

    <!-- Header -->
    <div class="invoice-header">
      <div class="header-content">
        <div class="company-brand">
          <div class="company-logo">🏥</div>
          <div class="company-info">
            <h1>HealthSync</h1>
            <p>Your Healthcare Management Platform</p>
          </div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number-box">${invoiceNumber}</div>
          <div class="invoice-date">
            <strong>Invoice Date:</strong> ${invoiceDate}
          </div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Parties -->
      <div class="parties-section">
        <div class="party-card">
          <h3>📋 Billed To</h3>
          <div class="name">${patient?.name || 'Patient'}</div>
          <div class="detail"><span>📧</span> ${patient?.email || 'Not provided'}</div>
          <div class="detail"><span>📱</span> ${patient?.phone || 'Not provided'}</div>
          ${patient?.address ? `<div class="detail"><span>📍</span> ${patient.address}</div>` : ''}
        </div>
        <div class="party-card">
          <h3>🏥 Service Provider</h3>
          <div class="name">${clinic?.name || 'HealthSync Clinic'}</div>
          <div class="detail"><span>👨‍⚕️</span> Dr. ${doctor?.name || 'Doctor'} (${doctor?.specialization || 'General Physician'})</div>
          <div class="detail"><span>🎓</span> ${doctor?.qualification || 'MBBS'}</div>
          ${doctor?.registrationNumber ? `<div class="detail"><span>📋</span> Reg. No: ${doctor.registrationNumber}</div>` : ''}
          ${clinic?.address ? `<div class="detail"><span>📍</span> ${clinic.address}</div>` : ''}
        </div>
      </div>

      <!-- Appointment Details -->
      <div class="appointment-section">
        <h3>📅 Appointment Details</h3>
        <div class="appointment-grid">
          <div class="appointment-item">
            <div class="icon">📆</div>
            <div class="label">Date</div>
            <div class="value">${formatDate(appointment?.date, 'short')}</div>
          </div>
          <div class="appointment-item">
            <div class="icon">⏰</div>
            <div class="label">Time</div>
            <div class="value">${appointment?.time || 'N/A'}</div>
          </div>
          <div class="appointment-item">
            <div class="icon">${appointment?.consultationType === 'online' ? '🌐' : '🏥'}</div>
            <div class="label">Type</div>
            <div class="value">${appointment?.consultationType === 'online' ? 'Online' : 'In-Person'}</div>
          </div>
          <div class="appointment-item">
            <div class="icon">🎫</div>
            <div class="label">Token</div>
            <div class="value">${appointment?.tokenNumber || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="items-section">
        <h3>💰 Billing Details</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="item-name">Medical Consultation</div>
                <div class="item-desc">Professional consultation with Dr. ${doctor?.name || 'Doctor'}</div>
                <div class="item-code">SAC: 999312</div>
              </td>
              <td>999312</td>
              <td>1</td>
              <td>${formatCurrency(consultationFee)}</td>
              <td>${formatCurrency(consultationFee)}</td>
            </tr>
            <tr>
              <td>
                <div class="item-name">Platform Service Fee</div>
                <div class="item-desc">HealthSync booking, scheduling & support services</div>
                <div class="item-code">SAC: 998314</div>
              </td>
              <td>998314</td>
              <td>1</td>
              <td>${formatCurrency(platformFee)}</td>
              <td>${formatCurrency(platformFee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          <div class="total-row">
            <span>CGST (${taxRate/2}%)</span>
            <span>${formatCurrency(tax/2)}</span>
          </div>
          <div class="total-row">
            <span>SGST (${taxRate/2}%)</span>
            <span>${formatCurrency(tax/2)}</span>
          </div>
          ${discount > 0 ? `
          <div class="total-row discount">
            <span>Discount</span>
            <span>- ${formatCurrency(discount)}</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>Total Amount</span>
            <span>${formatCurrency(totalAmount)}</span>
          </div>
          <div class="amount-words">
            <strong>Amount in words:</strong> ${amountInWords} Only
          </div>
        </div>
      </div>

      <!-- Payment Info -->
      <div class="payment-info">
        <div class="payment-card">
          <h4>Payment Status</h4>
          <div class="payment-status ${payment?.status === 'completed' || payment?.status === 'success' ? 'paid' : 'pending'}">
            ${payment?.status === 'completed' || payment?.status === 'success' ? '✅ Payment Received' : '⏳ Payment Pending'}
          </div>
          ${payment?.paidAt ? `<div class="payment-detail"><span>Paid On</span><span>${formatDate(payment.paidAt, 'short')}</span></div>` : ''}
        </div>
        <div class="payment-card">
          <h4>Payment Details</h4>
          ${payment?.transactionId ? `<div class="payment-detail"><span>Transaction ID</span><span>${payment.transactionId}</span></div>` : ''}
          <div class="payment-detail"><span>Payment Method</span><span>${payment?.paymentMethod || 'Online Payment'}</span></div>
          <div class="payment-detail"><span>Currency</span><span>INR (₹)</span></div>
        </div>
      </div>

      <!-- Terms -->
      <div class="terms-section">
        <h4>📜 Terms & Conditions</h4>
        <ul>
          <li>This invoice is generated electronically and is valid without signature.</li>
          <li>Payment is due immediately unless otherwise agreed upon.</li>
          <li>For refund policy, please refer to our terms of service at healthsync.com/terms</li>
          <li>Medical consultations are subject to the doctor's professional judgment.</li>
          <li>Please retain this invoice for your records and tax purposes.</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-brand">🏥 HealthSync</div>
      <p>Your Trusted Healthcare Management Platform</p>
      
      <div class="footer-contact">
        <div class="footer-contact-item">📧 desouvik0000@gmail.com</div>
        <div class="footer-contact-item">📞 +91-7001268485</div>
        <div class="footer-contact-item">🌐 healthsync.com</div>
        <div class="footer-contact-item">📍 Bankura, West Bengal, India - 722101</div>
      </div>
      
      <div class="footer-divider"></div>
      
      <div class="footer-legal">
        <p>This is a computer-generated invoice and does not require a physical signature.</p>
        <p>© ${new Date().getFullYear()} HealthSync Healthcare Platform. All rights reserved.</p>
        <p>For any queries regarding this invoice, please contact our support team.</p>
      </div>
      
      <div class="qr-section">
        <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`HealthSync Invoice\nInvoice: ${invoiceNumber}\nAmount: ${formatCurrency(totalAmount)}\nDate: ${formatDate(generatedAt, 'short')}\nPatient: ${patient?.name || 'N/A'}\nDoctor: Dr. ${doctor?.name || 'N/A'}`)}" alt="Invoice QR Code" />
        <div class="qr-info">
          <strong>Scan to verify</strong><br>
          Invoice: ${invoiceNumber}<br>
          Generated: ${formatDate(generatedAt, 'short')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}


// Convert number to words (Indian format)
function numberToWords(num) {
  if (num === 0) return 'Zero Rupees';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  }
  
  function convert(n) {
    if (n === 0) return '';
    
    let result = '';
    
    // Crores (10 million)
    if (n >= 10000000) {
      result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    
    // Lakhs (100 thousand)
    if (n >= 100000) {
      result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    
    // Thousands
    if (n >= 1000) {
      result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    
    // Hundreds and below
    if (n > 0) {
      result += convertLessThanThousand(n);
    }
    
    return result.trim();
  }
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }
  
  return result;
}

// Send invoice via email
async function sendInvoiceEmail(invoiceData) {
  const { patient, invoiceNumber, appointment } = invoiceData;
  
  if (!patient?.email) {
    console.warn('⚠️ No email address for invoice');
    return { success: false, message: 'No email address provided' };
  }

  const invoiceHTML = generateInvoiceHTML(invoiceData);
  const totalAmount = invoiceData.payment?.totalAmount || invoiceData.payment?.amount || 0;
  
  // Get frontend URL from environment or use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5005';
  const appointmentId = appointment?._id || appointment?.id || '';
  const viewInvoiceUrl = appointmentId ? `${backendUrl}/api/invoices/view/${appointmentId}` : `${frontendUrl}/dashboard`;

  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 0; background: #f0f2f5; }
    .email-container { max-width: 600px; margin: 0 auto; }
    .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 16px 16px 0 0; }
    .email-header h1 { margin: 0 0 10px; font-size: 28px; }
    .email-body { background: white; padding: 40px; }
    .invoice-card { background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea; }
    .invoice-card h3 { margin: 0 0 15px; color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .invoice-detail:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #667eea; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: 600; margin-top: 20px; }
    .email-footer { background: #1a1a2e; color: white; padding: 30px; text-align: center; border-radius: 0 0 16px 16px; }
    .email-footer p { margin: 5px 0; opacity: 0.9; font-size: 13px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🏥 HealthSync</h1>
      <p>Your Invoice is Ready!</p>
    </div>
    <div class="email-body">
      <p>Dear <strong>${patient.name || 'Patient'}</strong>,</p>
      <p>Thank you for choosing HealthSync for your healthcare needs. Please find your invoice details below:</p>
      
      <div class="invoice-card">
        <h3>📋 Invoice Summary</h3>
        <div class="invoice-detail"><span>Invoice Number</span><span>${invoiceNumber}</span></div>
        <div class="invoice-detail"><span>Invoice Date</span><span>${formatDate(invoiceData.generatedAt, 'short')}</span></div>
        <div class="invoice-detail"><span>Doctor</span><span>Dr. ${invoiceData.doctor?.name || 'Doctor'}</span></div>
        <div class="invoice-detail"><span>Appointment</span><span>${formatDate(invoiceData.appointment?.date, 'short')} at ${invoiceData.appointment?.time || 'N/A'}</span></div>
        <div class="invoice-detail"><span>Total Amount</span><span>${formatCurrency(totalAmount)}</span></div>
      </div>
      
      <p>The complete invoice with detailed breakdown is attached below. You can also access it from your HealthSync dashboard.</p>
      
      <p style="text-align: center;">
        <a href="${viewInvoiceUrl}" class="btn" target="_blank">View Full Invoice</a>
      </p>
      
      <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br><strong>The HealthSync Team</strong></p>
    </div>
    <div class="email-footer">
      <p><strong>HealthSync Healthcare Platform</strong></p>
      <p>📧 desouvik0000@gmail.com | 📞 +91-7001268485</p>
      <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: patient.email,
      subject: `Invoice ${invoiceNumber} - HealthSync Healthcare | ${formatCurrency(totalAmount)}`,
      html: emailHTML,
      text: `Your HealthSync invoice ${invoiceNumber} is ready. Amount: ${formatCurrency(totalAmount)}. Login to your dashboard to view and download the complete invoice.`
    });

    console.log('✅ Invoice email sent to:', patient.email);
    return { 
      success: true, 
      message: 'Invoice sent successfully',
      invoiceNumber,
      email: patient.email
    };
  } catch (error) {
    console.error('❌ Failed to send invoice email:', error.message);
    return { 
      success: false, 
      message: 'Failed to send invoice email',
      error: error.message 
    };
  }
}

// Generate and send invoice for an appointment
async function generateAndSendInvoice(appointment, patient, doctor, clinic, payment) {
  const invoiceNumber = generateInvoiceNumber();
  
  const invoiceData = {
    invoiceNumber,
    patient,
    doctor,
    clinic,
    appointment,
    payment,
    generatedAt: new Date()
  };

  // Send email
  const emailResult = await sendInvoiceEmail(invoiceData);

  return {
    ...emailResult,
    invoiceNumber,
    invoiceHTML: generateInvoiceHTML(invoiceData)
  };
}

module.exports = {
  generateInvoiceNumber,
  generateInvoiceHTML,
  sendInvoiceEmail,
  generateAndSendInvoice,
  formatCurrency,
  numberToWords
};
