const CommissionConfig = require('../models/CommissionConfig');
const FinancialLedger = require('../models/FinancialLedger');
const Payout = require('../models/Payout');
const DoctorWallet = require('../models/DoctorWallet');

class CommissionService {
  
  async calculateCommission(consultationFee, consultationType, clinicId, doctorId = null) {
    const config = await CommissionConfig.getConfigForClinic(clinicId);
    const fee = parseFloat(consultationFee);
    let introOfferApplied = false;
    let introOfferType = null;
    
    if (config.introductoryOffer?.enabled && doctorId) {
      const completedAppointments = await FinancialLedger.countDocuments({ 
        doctorId, 
        status: 'completed' 
      });
      
      if (completedAppointments < config.introductoryOffer.freeAppointments) {
        return {
          type: 'flat',
          rate: 0,
          amount: 0,
          introOfferApplied: true,
          introOfferType: 'free',
          appointmentsRemaining: config.introductoryOffer.freeAppointments - completedAppointments
        };
      } else if (completedAppointments < (config.introductoryOffer.freeAppointments + config.introductoryOffer.reducedFeeAppointments)) {
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
    const commissionConfig = consultationType === 'online' 
      ? config.onlineCommission 
      : config.inClinicCommission;
    
    let commissionAmount;
    if (commissionConfig.type === 'percentage') {
      commissionAmount = Math.round((fee * commissionConfig.value) / 100);
    } else {
      commissionAmount = commissionConfig.value;
    }
    
    return {
      type: commissionConfig.type,
      rate: commissionConfig.value,
      amount: commissionAmount,
      introOfferApplied: false
    };
  }

  calculateGST(commissionAmount, gstRate = 18) {
    const gstAmount = Math.round((commissionAmount * gstRate) / 100);
    return {
      rate: gstRate,
      amount: gstAmount
    };
  }

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

  async calculateFinancialBreakdown(params) {
    const { consultationFee, consultationType, clinicId, doctorId } = params;
    const fee = parseFloat(consultationFee);
    const config = await CommissionConfig.getConfigForClinic(clinicId);
    const commission = await this.calculateCommission(fee, consultationType, clinicId, doctorId);
    const gstOnCommission = this.calculateGST(commission.amount, config.gstRate);
    const totalPatientPaid = fee;
    const gatewayFee = this.calculatePaymentGatewayFee(totalPatientPaid, config.paymentGateway);
    const netDoctorPayout = fee - commission.amount;
    const netPlatformRevenue = commission.amount - gstOnCommission.amount - gatewayFee.totalGatewayCharge;
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
      introOfferApplied: commission.introOfferApplied || false,
      introOfferType: commission.introOfferType || null,
      appointmentsRemaining: commission.appointmentsRemaining || 0,
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

  async createLedgerEntry(params) {
    const { 
      appointmentId, paymentId, doctorId, clinicId, userId, 
      consultationType, consultationFee 
    } = params;
    const breakdown = await this.calculateFinancialBreakdown({
      consultationFee,
      consultationType: consultationType === 'in_person' ? 'in_person' : 'online',
      clinicId
    });
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
    await this.updateDoctorWallet(doctorId, breakdown.netDoctorPayout, appointmentId);
    
    return ledgerEntry;
  }

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

  async createPayout(doctorId, cycle = 'weekly', periodStart, periodEnd) {
    const ledgerEntries = await FinancialLedger.find({
      doctorId,
      status: 'completed',
      payoutStatus: 'pending',
      createdAt: { $gte: periodStart, $lte: periodEnd }
    });
    
    if (ledgerEntries.length === 0) {
      return null;
    }
    const summary = {
      totalAppointments: ledgerEntries.length,
      onlineAppointments: ledgerEntries.filter(e => e.consultationType === 'online').length,
      inClinicAppointments: ledgerEntries.filter(e => e.consultationType === 'in_person').length,
      grossEarnings: ledgerEntries.reduce((sum, e) => sum + e.consultationFee, 0),
      totalCommissionDeducted: ledgerEntries.reduce((sum, e) => sum + e.commission.amount, 0),
      totalGSTDeducted: ledgerEntries.reduce((sum, e) => sum + e.gstOnCommission.amount, 0),
      netPayoutAmount: ledgerEntries.reduce((sum, e) => sum + e.netDoctorPayout, 0)
    };
    const wallet = await DoctorWallet.findOne({ doctorId });
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
    await FinancialLedger.updateMany(
      { _id: { $in: ledgerEntries.map(e => e._id) } },
      { payoutStatus: 'scheduled', payoutId: payout._id }
    );
    
    return payout;
  }

  async processPayout(payoutId, transactionRef, processedBy) {
    const payout = await Payout.findById(payoutId);
    
    if (!payout) {
      throw new Error('Payout not found');
    }
    payout.status = 'completed';
    payout.transactionReference = transactionRef;
    payout.transactionDate = new Date();
    payout.processedBy = processedBy;
    payout.processedAt = new Date();
    await payout.save();
    await FinancialLedger.updateMany(
      { payoutId: payout._id },
      { payoutStatus: 'completed', payoutDate: new Date() }
    );
    const entries = await FinancialLedger.find({ payoutId: payout._id });
    for (const entry of entries) {
      await entry.lockRecord(processedBy);
    }
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
