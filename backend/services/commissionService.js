const CommissionConfig = require('../models/CommissionConfig');
const FinancialLedger = require('../models/FinancialLedger');
const Payout = require('../models/Payout');
const DoctorWallet = require('../models/DoctorWallet');

class CommissionService {
  /**
   * Calculate commission based on consultation type and clinic config
   * Supports introductory offers for new clinics/doctors
   * @param {Number} consultationFee - Base consultation fee
   * @param {String} consultationType - 'online' or 'in_person'
   * @param {ObjectId} clinicId - Clinic ID for config lookup
   * @param {ObjectId} doctorId - Doctor ID for intro offer tracking
   * @returns {Object} Commission breakdown
   */
  async calculateCommission(consultationFee, consultationType, clinicId, doctorId = null) {
    const config = await CommissionConfig.getConfigForClinic(clinicId);
    const fee = parseFloat(consultationFee);
    
    // Check introductory offer eligibility
    let introOfferApplied = false;
    let introOfferType = null;
    
    if (config.introductoryOffer?.enabled && doctorId) {
      const completedAppointments = await FinancialLedger.countDocuments({ 
        doctorId, 
        status: 'completed' 
      });
      
      if (completedAppointments < config.introductoryOffer.freeAppointments) {
        // Free period - no commission
        return {
          type: 'flat',
          rate: 0,
          amount: 0,
          introOfferApplied: true,
          introOfferType: 'free',
          appointmentsRemaining: config.introductoryOffer.freeAppointments - completedAppointments
        };
      } else if (completedAppointments < (config.introductoryOffer.freeAppointments + config.introductoryOffer.reducedFeeAppointments)) {
        // Reduced fee period
        introOfferApplied = true;
        introOfferType = 'reduced';
        return {
          type: 'flat',
          rate: config.introductoryOffer.reducedFeeValue,
          amount: config.introductoryOffer.reducedFeeValue,
          introOfferApplied: true,
          introOfferType: 'reduced',
          appointmentsRemaining: (config.introductoryOffer.freeAppointments + config.introductoryOffer.reducedFeeAppointments) - completedAppointments
        };
      }
    }
    
    // Standard commission calculation
    const commissionConfig = consultationType === 'online' 
      ? config.onlineCommission 
      : config.inClinicCommission;
    
    let commissionAmount;
    if (commissionConfig.type === 'percentage') {
      commissionAmount = Math.round((fee * commissionConfig.value) / 100);
    } else {
      // Flat fee
      commissionAmount = commissionConfig.value;
    }
    
    return {
      type: commissionConfig.type,
      rate: commissionConfig.value,
      amount: commissionAmount,
      introOfferApplied: false
    };
  }

  /**
   * Calculate GST on commission (18% in India)
   * GST is only on platform commission, NOT on consultation fee
   * @param {Number} commissionAmount - Platform commission amount
   * @param {Number} gstRate - GST rate (default 18%)
   * @returns {Object} GST breakdown
   */
  calculateGST(commissionAmount, gstRate = 18) {
    const gstAmount = Math.round((commissionAmount * gstRate) / 100);
    return {
      rate: gstRate,
      amount: gstAmount
    };
  }

  /**
   * Calculate payment gateway fees
   * Gateway fees are deducted from platform's share
   * @param {Number} totalAmount - Total transaction amount
   * @param {Object} gatewayConfig - Gateway fee configuration
   * @returns {Object} Gateway fee breakdown
   */
  calculatePaymentGatewayFee(totalAmount, gatewayConfig = { feePercentage: 2, gstOnFee: 18, fixedFee: 0 }) {
    const feeAmount = Math.round((totalAmount * gatewayConfig.feePercentage) / 100) + gatewayConfig.fixedFee;
    const gstOnFee = Math.round((feeAmount * gatewayConfig.gstOnFee) / 100);
    const totalGatewayCharge = feeAmount + gstOnFee;
    
    return {
      feePercentage: gatewayConfig.feePercentage,
      feeAmount: feeAmount,
      gstOnFee: gstOnFee,
      totalGatewayCharge: totalGatewayCharge
    };
  }

  /**
   * Calculate complete financial breakdown for a booking
   * @param {Object} params - Booking parameters
   * @returns {Object} Complete financial breakdown
   */
  async calculateFinancialBreakdown(params) {
    const { consultationFee, consultationType, clinicId, doctorId } = params;
    const fee = parseFloat(consultationFee);
    
    // Get config
    const config = await CommissionConfig.getConfigForClinic(clinicId);
    
    // 1. Calculate platform commission (with intro offer check)
    const commission = await this.calculateCommission(fee, consultationType, clinicId, doctorId);
    
    // 2. Calculate GST on commission only (NOT on consultation fee)
    const gstOnCommission = this.calculateGST(commission.amount, config.gstRate);
    
    // 3. Total amount patient pays (consultation fee only - GST exempt for medical)
    const totalPatientPaid = fee;
    
    // 4. Calculate payment gateway fees on total transaction
    const gatewayFee = this.calculatePaymentGatewayFee(totalPatientPaid, config.paymentGateway);
    
    // 5. Calculate net amounts
    // Doctor gets: Consultation Fee - Commission
    const netDoctorPayout = fee - commission.amount;
    
    // Platform gets: Commission - GST on Commission - Gateway Fees
    const netPlatformRevenue = commission.amount - gstOnCommission.amount - gatewayFee.totalGatewayCharge;
    
    // Platform's GST liability (to be paid to government)
    const platformGSTLiability = gstOnCommission.amount;
    
    return {
      consultationFee: fee,
      commission,
      gstOnCommission,
      paymentGatewayFee: gatewayFee,
      totalPatientPaid,
      netDoctorPayout,
      netPlatformRevenue,
      platformGSTLiability,
      // Intro offer details
      introOfferApplied: commission.introOfferApplied || false,
      introOfferType: commission.introOfferType || null,
      appointmentsRemaining: commission.appointmentsRemaining || 0,
      // Summary for display
      summary: {
        patientPays: totalPatientPaid,
        doctorReceives: netDoctorPayout,
        platformCommission: commission.amount,
        gstOnCommission: gstOnCommission.amount,
        gatewayCharges: gatewayFee.totalGatewayCharge,
        platformNetRevenue: netPlatformRevenue,
        introOfferApplied: commission.introOfferApplied || false
      }
    };
  }


  /**
   * Create financial ledger entry for a completed payment
   * @param {Object} params - Appointment and payment details
   * @returns {Object} Created ledger entry
   */
  async createLedgerEntry(params) {
    const { 
      appointmentId, paymentId, doctorId, clinicId, userId, 
      consultationType, consultationFee 
    } = params;
    
    // Calculate full breakdown
    const breakdown = await this.calculateFinancialBreakdown({
      consultationFee,
      consultationType: consultationType === 'in_person' ? 'in_person' : 'online',
      clinicId
    });
    
    // Create ledger entry
    const ledgerEntry = new FinancialLedger({
      appointmentId,
      paymentId,
      doctorId,
      clinicId,
      userId,
      consultationType: consultationType === 'in_person' ? 'in_person' : 'online',
      consultationFee: breakdown.consultationFee,
      commission: breakdown.commission,
      gstOnCommission: breakdown.gstOnCommission,
      paymentGatewayFee: breakdown.paymentGatewayFee,
      totalPatientPaid: breakdown.totalPatientPaid,
      netDoctorPayout: breakdown.netDoctorPayout,
      netPlatformRevenue: breakdown.netPlatformRevenue,
      platformGSTLiability: breakdown.platformGSTLiability,
      status: 'completed',
      payoutStatus: 'pending'
    });
    
    await ledgerEntry.save();
    
    // Update doctor wallet
    await this.updateDoctorWallet(doctorId, breakdown.netDoctorPayout, appointmentId);
    
    return ledgerEntry;
  }

  /**
   * Update doctor wallet with earnings
   */
  async updateDoctorWallet(doctorId, amount, appointmentId) {
    let wallet = await DoctorWallet.findOne({ doctorId });
    
    if (!wallet) {
      wallet = new DoctorWallet({ doctorId });
    }
    
    wallet.transactions.push({
      type: 'earning',
      amount: amount,
      description: 'Consultation earnings (after commission)',
      appointmentId,
      status: 'completed'
    });
    
    wallet.balance += amount;
    wallet.totalEarnings += amount;
    wallet.pendingAmount += amount;
    wallet.stats.totalAppointments += 1;
    wallet.stats.completedAppointments += 1;
    wallet.stats.lastUpdated = new Date();
    
    await wallet.save();
    return wallet;
  }

  /**
   * Get pending payouts for a doctor
   */
  async getPendingPayouts(doctorId) {
    const ledgerEntries = await FinancialLedger.find({
      doctorId,
      status: 'completed',
      payoutStatus: 'pending'
    }).populate('appointmentId', 'date time');
    
    const totalPending = ledgerEntries.reduce((sum, entry) => sum + entry.netDoctorPayout, 0);
    
    return {
      entries: ledgerEntries,
      totalPending,
      count: ledgerEntries.length
    };
  }

  /**
   * Create payout for doctor
   */
  async createPayout(doctorId, cycle = 'weekly', periodStart, periodEnd) {
    // Get all pending ledger entries for the period
    const ledgerEntries = await FinancialLedger.find({
      doctorId,
      status: 'completed',
      payoutStatus: 'pending',
      createdAt: { $gte: periodStart, $lte: periodEnd }
    });
    
    if (ledgerEntries.length === 0) {
      return null;
    }
    
    // Calculate summary
    const summary = {
      totalAppointments: ledgerEntries.length,
      onlineAppointments: ledgerEntries.filter(e => e.consultationType === 'online').length,
      inClinicAppointments: ledgerEntries.filter(e => e.consultationType === 'in_person').length,
      grossEarnings: ledgerEntries.reduce((sum, e) => sum + e.consultationFee, 0),
      totalCommissionDeducted: ledgerEntries.reduce((sum, e) => sum + e.commission.amount, 0),
      totalGSTDeducted: ledgerEntries.reduce((sum, e) => sum + e.gstOnCommission.amount, 0),
      netPayoutAmount: ledgerEntries.reduce((sum, e) => sum + e.netDoctorPayout, 0)
    };
    
    // Get doctor's bank details
    const wallet = await DoctorWallet.findOne({ doctorId });
    
    // Create payout record
    const payout = new Payout({
      doctorId,
      payoutCycle: cycle,
      periodStart,
      periodEnd,
      summary,
      ledgerEntries: ledgerEntries.map(e => e._id),
      status: 'pending',
      bankDetails: wallet?.bankDetails || {}
    });
    
    payout.generateInvoiceNumber();
    await payout.save();
    
    // Update ledger entries with payout reference
    await FinancialLedger.updateMany(
      { _id: { $in: ledgerEntries.map(e => e._id) } },
      { payoutStatus: 'scheduled', payoutId: payout._id }
    );
    
    return payout;
  }

  /**
   * Process payout (mark as completed)
   */
  async processPayout(payoutId, transactionRef, processedBy) {
    const payout = await Payout.findById(payoutId);
    
    if (!payout) {
      throw new Error('Payout not found');
    }
    
    // Update payout status
    payout.status = 'completed';
    payout.transactionReference = transactionRef;
    payout.transactionDate = new Date();
    payout.processedBy = processedBy;
    payout.processedAt = new Date();
    await payout.save();
    
    // Update ledger entries
    await FinancialLedger.updateMany(
      { payoutId: payout._id },
      { payoutStatus: 'completed', payoutDate: new Date() }
    );
    
    // Lock ledger entries
    const entries = await FinancialLedger.find({ payoutId: payout._id });
    for (const entry of entries) {
      await entry.lockRecord(processedBy);
    }
    
    // Update doctor wallet
    const wallet = await DoctorWallet.findOne({ doctorId: payout.doctorId });
    if (wallet) {
      wallet.transactions.push({
        type: 'payout',
        amount: -payout.summary.netPayoutAmount,
        description: `Payout ${payout.invoiceNumber}`,
        status: 'completed',
        payoutMethod: payout.paymentMethod,
        payoutReference: transactionRef,
        processedBy
      });
      wallet.pendingAmount -= payout.summary.netPayoutAmount;
      wallet.totalPayouts += payout.summary.netPayoutAmount;
      await wallet.save();
    }
    
    return payout;
  }

  /**
   * Get doctor earnings report
   */
  async getDoctorEarningsReport(doctorId, startDate, endDate) {
    const entries = await FinancialLedger.find({
      doctorId,
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('appointmentId', 'date time consultationType')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });
    
    const summary = {
      totalAppointments: entries.length,
      grossEarnings: entries.reduce((sum, e) => sum + e.consultationFee, 0),
      totalCommission: entries.reduce((sum, e) => sum + e.commission.amount, 0),
      netEarnings: entries.reduce((sum, e) => sum + e.netDoctorPayout, 0),
      pendingPayout: entries.filter(e => e.payoutStatus === 'pending').reduce((sum, e) => sum + e.netDoctorPayout, 0),
      completedPayout: entries.filter(e => e.payoutStatus === 'completed').reduce((sum, e) => sum + e.netDoctorPayout, 0)
    };
    
    return { entries, summary };
  }

  /**
   * Get admin revenue report
   */
  async getAdminRevenueReport(startDate, endDate) {
    const entries = await FinancialLedger.find({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    return {
      totalTransactions: entries.length,
      totalConsultationFees: entries.reduce((sum, e) => sum + e.consultationFee, 0),
      totalCommissionEarned: entries.reduce((sum, e) => sum + e.commission.amount, 0),
      totalGSTCollected: entries.reduce((sum, e) => sum + e.gstOnCommission.amount, 0),
      totalGatewayFees: entries.reduce((sum, e) => sum + e.paymentGatewayFee.totalGatewayCharge, 0),
      netPlatformRevenue: entries.reduce((sum, e) => sum + e.netPlatformRevenue, 0),
      totalDoctorPayouts: entries.reduce((sum, e) => sum + e.netDoctorPayout, 0),
      gstLiability: entries.reduce((sum, e) => sum + e.platformGSTLiability, 0)
    };
  }

  /**
   * Export report to CSV format
   */
  async exportToCSV(entries, type = 'doctor') {
    const headers = type === 'doctor' 
      ? ['Date', 'Appointment ID', 'Consultation Fee', 'Commission', 'Net Earnings', 'Payout Status']
      : ['Date', 'Doctor', 'Clinic', 'Consultation Fee', 'Commission', 'GST', 'Gateway Fee', 'Net Revenue'];
    
    const rows = entries.map(e => {
      if (type === 'doctor') {
        return [
          new Date(e.createdAt).toLocaleDateString('en-IN'),
          e.appointmentId?.toString().slice(-8) || 'N/A',
          e.consultationFee,
          e.commission.amount,
          e.netDoctorPayout,
          e.payoutStatus
        ];
      } else {
        return [
          new Date(e.createdAt).toLocaleDateString('en-IN'),
          e.doctorId?.toString().slice(-8) || 'N/A',
          e.clinicId?.toString().slice(-8) || 'N/A',
          e.consultationFee,
          e.commission.amount,
          e.gstOnCommission.amount,
          e.paymentGatewayFee.totalGatewayCharge,
          e.netPlatformRevenue
        ];
      }
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new CommissionService();
