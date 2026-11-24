import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const ClinicAnalyticsSection = ({ clinicId }) => {
  const [dashboard, setDashboard] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => { fetchAllAnalytics(); }, [clinicId, dateRange]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [dashRes, revRes, catRes, payRes, medRes] = await Promise.allSettled([
        axios.get(`/api/clinic-analytics/clinic/${clinicId}/dashboard`),
        axios.get(`/api/clinic-analytics/clinic/${clinicId}/revenue?days=${dateRange}`),
        axios.get(`/api/clinic-analytics/clinic/${clinicId}/revenue-by-category`),
        axios.get(`/api/clinic-analytics/clinic/${clinicId}/payment-methods`),
        axios.get(`/api/clinic-analytics/clinic/${clinicId}/top-medicines?limit=5`)
      ]);
      
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data.dashboard || {});
      if (revRes.status === 'fulfilled') setRevenueData(revRes.value.data.data || []);
      if (catRes.status === 'fulfilled') setCategoryData(catRes.value.data.data || []);
      if (payRes.status === 'fulfilled') setPaymentData(payRes.value.data.data || []);
      if (medRes.status === 'fulfilled') setTopMedicines(medRes.value.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString()}`;

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <i className="fas fa-chart-bar text-white text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Clinic Analytics</h2>
            <p className="text-sm text-slate-500">Performance insights and reports</p>
          </div>
        </div>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <i className="fas fa-rupee-sign text-2xl mb-2 opacity-80"></i>
          <p className="text-3xl font-bold">{formatCurrency(dashboard.today?.revenue)}</p>
          <p className="text-sm opacity-80">Today's Revenue</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <i className="fas fa-file-invoice text-2xl mb-2 opacity-80"></i>
          <p className="text-3xl font-bold">{dashboard.today?.bills || 0}</p>
          <p className="text-sm opacity-80">Today's Bills</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <i className="fas fa-chart-line text-2xl mb-2 opacity-80"></i>
          <p className="text-3xl font-bold">{formatCurrency(dashboard.month?.revenue)}</p>
          <p className="text-sm opacity-80">This Month</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <i className="fas fa-users text-2xl mb-2 opacity-80"></i>
          <p className="text-3xl font-bold">{dashboard.attendance?.present || 0}/{dashboard.attendance?.total || 0}</p>
          <p className="text-sm opacity-80">Staff Present</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-end gap-2">
          {revenueData.length > 0 ? revenueData.slice(-14).map((day, i) => {
            const maxRevenue = Math.max(...revenueData.map(d => d.revenue || 0));
            const height = maxRevenue > 0 ? ((day.revenue || 0) / maxRevenue) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gradient-to-t from-violet-500 to-purple-400 rounded-t-lg transition-all hover:from-violet-600 hover:to-purple-500" style={{ height: `${Math.max(height, 5)}%` }} title={`₹${day.revenue?.toLocaleString()}`}></div>
                <span className="text-xs text-slate-500 rotate-45 origin-left">{day._id?.slice(5)}</span>
              </div>
            );
          }) : <p className="text-slate-500 m-auto">No revenue data available</p>}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue by Category</h3>
          <div className="space-y-3">
            {categoryData.length > 0 ? categoryData.map((cat, i) => {
              const total = categoryData.reduce((sum, c) => sum + (c.total || 0), 0);
              const percent = total > 0 ? ((cat.total || 0) / total) * 100 : 0;
              const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 capitalize">{cat._id}</span>
                    <span className="font-medium">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            }) : <p className="text-slate-500">No category data</p>}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {paymentData.length > 0 ? paymentData.map((pay, i) => {
              const total = paymentData.reduce((sum, p) => sum + (p.total || 0), 0);
              const percent = total > 0 ? ((pay.total || 0) / total) * 100 : 0;
              const icons = { cash: 'fa-money-bill', card: 'fa-credit-card', upi: 'fa-mobile-alt', insurance: 'fa-shield-alt', other: 'fa-ellipsis-h' };
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <i className={`fas ${icons[pay._id] || 'fa-money-bill'} text-slate-600`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800 capitalize">{pay._id}</span>
                      <span className="text-sm text-slate-600">{percent.toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-slate-500">{formatCurrency(pay.total)} ({pay.count} transactions)</p>
                  </div>
                </div>
              );
            }) : <p className="text-slate-500">No payment data</p>}
          </div>
        </div>
      </div>

      {/* Inventory & Top Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Inventory Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <i className="fas fa-pills text-blue-500 mb-2"></i>
              <p className="text-2xl font-bold text-slate-800">{dashboard.inventory?.total || 0}</p>
              <p className="text-sm text-slate-500">Total Items</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <i className="fas fa-exclamation-triangle text-amber-500 mb-2"></i>
              <p className="text-2xl font-bold text-slate-800">{dashboard.inventory?.lowStock || 0}</p>
              <p className="text-sm text-slate-500">Low Stock</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <i className="fas fa-times-circle text-red-500 mb-2"></i>
              <p className="text-2xl font-bold text-slate-800">{dashboard.inventory?.outOfStock || 0}</p>
              <p className="text-sm text-slate-500">Out of Stock</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <i className="fas fa-check-circle text-emerald-500 mb-2"></i>
              <p className="text-2xl font-bold text-slate-800">{(dashboard.inventory?.total || 0) - (dashboard.inventory?.lowStock || 0) - (dashboard.inventory?.outOfStock || 0)}</p>
              <p className="text-sm text-slate-500">In Stock</p>
            </div>
          </div>
        </div>

        {/* Top Selling Medicines */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Top Selling Medicines</h3>
          <div className="space-y-3">
            {topMedicines.length > 0 ? topMedicines.map((med, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{med._id}</p>
                  <p className="text-sm text-slate-500">{med.totalSold} units sold</p>
                </div>
                <span className="font-medium text-emerald-600">{formatCurrency(med.revenue)}</span>
              </div>
            )) : <p className="text-slate-500">No sales data</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
            <i className="fas fa-download text-slate-600 mb-2"></i>
            <p className="font-medium text-slate-800">Export Report</p>
            <p className="text-sm text-slate-500">Download PDF</p>
          </button>
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
            <i className="fas fa-file-excel text-slate-600 mb-2"></i>
            <p className="font-medium text-slate-800">Export Data</p>
            <p className="text-sm text-slate-500">Download Excel</p>
          </button>
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
            <i className="fas fa-print text-slate-600 mb-2"></i>
            <p className="font-medium text-slate-800">Print Summary</p>
            <p className="text-sm text-slate-500">Daily report</p>
          </button>
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
            <i className="fas fa-sync text-slate-600 mb-2"></i>
            <p className="font-medium text-slate-800">Refresh Data</p>
            <p className="text-sm text-slate-500">Update analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicAnalyticsSection;
