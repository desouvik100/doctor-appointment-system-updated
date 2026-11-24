import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AdminCommissionConfig.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const AdminCommissionConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    onlineCommission: { type: 'percentage', value: 10 }, // Tier-2/3 friendly
    inClinicCommission: { type: 'flat', value: 25 }, // Flat fee preferred
    gstRate: 18,
    paymentGateway: { feePercentage: 2, gstOnFee: 18, fixedFee: 0 },
    payoutConfig: { defaultCycle: 'weekly', minimumPayoutAmount: 500, payoutDay: 1 },
    introductoryOffer: { enabled: true, freeAppointments: 50, reducedFeeAppointments: 100, reducedFeeValue: 20 }
  });
  const [previewFee, setPreviewFee] = useState(500);
  const [previewType, setPreviewType] = useState('online');
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/commission/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.data) {
        setConfig(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load commission configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.put(`${API_URL}/commission/config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Commission configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const calculatePreview = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/commission/calculate`, {
        consultationFee: previewFee,
        consultationType: previewType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBreakdown(response.data.data);
    } catch (error) {
      toast.error('Failed to calculate preview');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="admin-commission loading">Loading configuration...</div>;
  }

  return (
    <div className="admin-commission">
      <div className="commission-header">
        <h2>⚙️ Commission & Payout Configuration</h2>
        <p>Configure platform commission rates, GST, and payout settings</p>
      </div>

      <div className="config-grid">
        {/* Online Commission */}
        <div className="config-section">
          <h3>🌐 Online Consultation Commission</h3>
          <div className="form-group">
            <label>Commission Type</label>
            <select
              value={config.onlineCommission.type}
              onChange={(e) => setConfig({
                ...config,
                onlineCommission: { ...config.onlineCommission, type: e.target.value }
              })}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Fee (₹)</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              {config.onlineCommission.type === 'percentage' ? 'Commission Rate (%)' : 'Flat Fee (₹)'}
            </label>
            <input
              type="number"
              value={config.onlineCommission.value}
              onChange={(e) => setConfig({
                ...config,
                onlineCommission: { ...config.onlineCommission, value: parseFloat(e.target.value) }
              })}
              min="0"
              max={config.onlineCommission.type === 'percentage' ? 100 : 10000}
            />
          </div>
        </div>

        {/* In-Clinic Commission */}
        <div className="config-section">
          <h3>🏥 In-Clinic Appointment Commission</h3>
          <div className="form-group">
            <label>Commission Type</label>
            <select
              value={config.inClinicCommission.type}
              onChange={(e) => setConfig({
                ...config,
                inClinicCommission: { ...config.inClinicCommission, type: e.target.value }
              })}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Fee (₹)</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              {config.inClinicCommission.type === 'percentage' ? 'Commission Rate (%)' : 'Flat Fee (₹)'}
            </label>
            <input
              type="number"
              value={config.inClinicCommission.value}
              onChange={(e) => setConfig({
                ...config,
                inClinicCommission: { ...config.inClinicCommission, value: parseFloat(e.target.value) }
              })}
              min="0"
              max={config.inClinicCommission.type === 'percentage' ? 100 : 10000}
            />
          </div>
        </div>

        {/* GST Configuration */}
        <div className="config-section">
          <h3>📋 GST Configuration</h3>
          <div className="form-group">
            <label>GST Rate on Commission (%)</label>
            <input
              type="number"
              value={config.gstRate}
              onChange={(e) => setConfig({ ...config, gstRate: parseFloat(e.target.value) })}
              min="0"
              max="100"
            />
            <small>GST is applied only on platform commission, not on consultation fee</small>
          </div>
        </div>

        {/* Payment Gateway */}
        <div className="config-section">
          <h3>💳 Payment Gateway Fees</h3>
          <div className="form-group">
            <label>Gateway Fee (%)</label>
            <input
              type="number"
              value={config.paymentGateway.feePercentage}
              onChange={(e) => setConfig({
                ...config,
                paymentGateway: { ...config.paymentGateway, feePercentage: parseFloat(e.target.value) }
              })}
              min="0"
              max="10"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>GST on Gateway Fee (%)</label>
            <input
              type="number"
              value={config.paymentGateway.gstOnFee}
              onChange={(e) => setConfig({
                ...config,
                paymentGateway: { ...config.paymentGateway, gstOnFee: parseFloat(e.target.value) }
              })}
              min="0"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Fixed Fee per Transaction (₹)</label>
            <input
              type="number"
              value={config.paymentGateway.fixedFee}
              onChange={(e) => setConfig({
                ...config,
                paymentGateway: { ...config.paymentGateway, fixedFee: parseFloat(e.target.value) }
              })}
              min="0"
            />
          </div>
          <small>Gateway fees are deducted from platform's share, not doctor's</small>
        </div>

        {/* Payout Configuration */}
        <div className="config-section">
          <h3>💰 Payout Settings</h3>
          <div className="form-group">
            <label>Default Payout Cycle</label>
            <select
              value={config.payoutConfig.defaultCycle}
              onChange={(e) => setConfig({
                ...config,
                payoutConfig: { ...config.payoutConfig, defaultCycle: e.target.value }
              })}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Minimum Payout Amount (₹)</label>
            <input
              type="number"
              value={config.payoutConfig.minimumPayoutAmount}
              onChange={(e) => setConfig({
                ...config,
                payoutConfig: { ...config.payoutConfig, minimumPayoutAmount: parseFloat(e.target.value) }
              })}
              min="0"
            />
          </div>
        </div>

        {/* Introductory Offer - Doctor Onboarding */}
        <div className="config-section">
          <h3>🎁 Introductory Offer (Doctor Onboarding)</h3>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={config.introductoryOffer?.enabled || false}
                onChange={(e) => setConfig({
                  ...config,
                  introductoryOffer: { ...config.introductoryOffer, enabled: e.target.checked }
                })}
              />
              Enable Introductory Offer
            </label>
            <small>Helps onboard new doctors with zero-risk trial</small>
          </div>
          {config.introductoryOffer?.enabled && (
            <>
              <div className="form-group">
                <label>Free Appointments (₹0 fee)</label>
                <input
                  type="number"
                  value={config.introductoryOffer?.freeAppointments || 50}
                  onChange={(e) => setConfig({
                    ...config,
                    introductoryOffer: { ...config.introductoryOffer, freeAppointments: parseInt(e.target.value) }
                  })}
                  min="0"
                />
                <small>First X appointments with zero platform fee</small>
              </div>
              <div className="form-group">
                <label>Reduced Fee Appointments</label>
                <input
                  type="number"
                  value={config.introductoryOffer?.reducedFeeAppointments || 100}
                  onChange={(e) => setConfig({
                    ...config,
                    introductoryOffer: { ...config.introductoryOffer, reducedFeeAppointments: parseInt(e.target.value) }
                  })}
                  min="0"
                />
                <small>Next X appointments at reduced rate</small>
              </div>
              <div className="form-group">
                <label>Reduced Fee Amount (₹)</label>
                <input
                  type="number"
                  value={config.introductoryOffer?.reducedFeeValue || 20}
                  onChange={(e) => setConfig({
                    ...config,
                    introductoryOffer: { ...config.introductoryOffer, reducedFeeValue: parseFloat(e.target.value) }
                  })}
                  min="0"
                />
                <small>Flat fee during reduced period</small>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="save-section">
        <button onClick={handleSave} disabled={saving} className="btn-save">
          {saving ? 'Saving...' : '💾 Save Configuration'}
        </button>
      </div>

      {/* Preview Calculator */}
      <div className="preview-section">
        <h3>🧮 Commission Calculator Preview</h3>
        <div className="preview-inputs">
          <div className="form-group">
            <label>Consultation Fee (₹)</label>
            <input
              type="number"
              value={previewFee}
              onChange={(e) => setPreviewFee(parseFloat(e.target.value))}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Consultation Type</label>
            <select value={previewType} onChange={(e) => setPreviewType(e.target.value)}>
              <option value="online">Online</option>
              <option value="in_person">In-Clinic</option>
            </select>
          </div>
          <button onClick={calculatePreview} className="btn-calculate">
            Calculate
          </button>
        </div>

        {breakdown && (
          <div className="breakdown-result">
            <h4>Financial Breakdown</h4>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <span>Patient Pays</span>
                <span className="value">{formatCurrency(breakdown.totalPatientPaid)}</span>
              </div>
              <div className="breakdown-item">
                <span>Platform Commission ({breakdown.commission.rate}%)</span>
                <span className="value negative">-{formatCurrency(breakdown.commission.amount)}</span>
              </div>
              <div className="breakdown-item">
                <span>GST on Commission ({breakdown.gstOnCommission.rate}%)</span>
                <span className="value">{formatCurrency(breakdown.gstOnCommission.amount)}</span>
              </div>
              <div className="breakdown-item">
                <span>Gateway Charges</span>
                <span className="value">{formatCurrency(breakdown.paymentGatewayFee.totalGatewayCharge)}</span>
              </div>
              <div className="breakdown-item highlight doctor">
                <span>Doctor Receives</span>
                <span className="value positive">{formatCurrency(breakdown.netDoctorPayout)}</span>
              </div>
              <div className="breakdown-item highlight platform">
                <span>Platform Net Revenue</span>
                <span className="value">{formatCurrency(breakdown.netPlatformRevenue)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommissionConfig;
