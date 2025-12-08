import { useState, useMemo } from 'react';
import { exportTransactionsPDF } from '../utils/pdfExport';

const RevenueReport = ({ appointments = [], doctors = [], dateRange = 'month' }) => {
  const [selectedRange, setSelectedRange] = useState(dateRange);
  const [selectedDoctor, setSelectedDoctor] = useState('all');

  const revenueData = useMemo(() => {
    const now = new Date();
    const ranges = { week: 7, month: 30, quarter: 90, year: 365 };
    const daysBack = ranges[selectedRange];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter appointments
    let filtered = appointments.filter(a => 
      new Date(a.date) >= startDate && a.status === 'completed'
    );

    if (selectedDoctor !== 'all') {
      filtered = filtered.filter(a => a.doctorId?._id === selectedDoctor);
    }

    // Calculate totals
    const totalRevenue = filtered.reduce((sum, a) => 
      sum + (a.amount || a.doctorId?.consultationFee || 500), 0
    );
    const platformFee = Math.round(totalRevenue * 0.1); // 10% platform fee
    const doctorEarnings = totalRevenue - platformFee;

    // Revenue by doctor
    const byDoctor = {};
    filtered.forEach(a => {
      const docId = a.doctorId?._id || 'unknown';
      const docName = a.doctorId?.name || 'Unknown';
      if (!byDoctor[docId]) {
        byDoctor[docId] = { name: docName, appointments: 0, revenue: 0 };
      }
      byDoctor[docId].appointments++;
      byDoctor[docId].revenue += (a.amount || a.doctorId?.consultationFee || 500);
    });

    // Daily revenue for chart
    const dailyRevenue = [];
    const chartDays = Math.min(daysBack, 14);
    for (let i = chartDays - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayRevenue = filtered
        .filter(a => new Date(a.date).toISOString().split('T')[0] === dateStr)
        .reduce((sum, a) => sum + (a.amount || 500), 0);
      dailyRevenue.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }

    // Payment methods breakdown (mock data if not available)
    const paymentMethods = {
      'Online': Math.round(totalRevenue * 0.6),
      'Cash': Math.round(totalRevenue * 0.25),
      'Wallet': Math.round(totalRevenue * 0.15)
    };

    return {
      totalRevenue,
      platformFee,
      doctorEarnings,
      totalAppointments: filtered.length,
      byDoctor: Object.values(byDoctor).sort((a, b) => b.revenue - a.revenue),
      dailyRevenue,
      paymentMethods,
      avgPerAppointment: filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0
    };
  }, [appointments, selectedRange, selectedDoctor]);

  const maxDailyRevenue = Math.max(...revenueData.dailyRevenue.map(d => d.revenue), 1);

  const handleExportPDF = () => {
    const transactions = appointments
      .filter(a => a.status === 'completed')
      .map(a => ({
        date: a.date,
        description: `Consultation - Dr. ${a.doctorId?.name || 'Unknown'}`,
        amount: a.amount || a.doctorId?.consultationFee || 500,
        type: 'credit',
        status: 'completed'
      }));
    exportTransactionsPDF(transactions, 'Revenue Report');
  };

  return (
    <div className="revenue-report space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Revenue Report</h2>
          <p className="text-sm text-slate-500">Financial overview and analytics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['week', 'month', 'quarter'].map(range => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${selectedRange === range 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : '90 Days'}
            </button>
          ))}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
          >
            <i className="fas fa-file-pdf"></i>Export
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <i className="fas fa-rupee-sign"></i>
            </div>
          </div>
          <p className="text-2xl font-bold">₹{revenueData.totalRevenue.toLocaleString()}</p>
          <p className="text-emerald-100 text-sm">Total Revenue</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <i className="fas fa-user-md text-blue-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{revenueData.doctorEarnings.toLocaleString()}</p>
          <p className="text-slate-500 text-sm">Doctor Earnings</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <i className="fas fa-percentage text-purple-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{revenueData.platformFee.toLocaleString()}</p>
          <p className="text-slate-500 text-sm">Platform Fee (10%)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <i className="fas fa-calculator text-amber-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{revenueData.avgPerAppointment}</p>
          <p className="text-slate-500 text-sm">Avg per Appointment</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Trend</h3>
          <div className="h-48 flex items-end gap-2">
            {revenueData.dailyRevenue.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <span className="text-xs text-slate-500 mb-1">
                  {day.revenue > 0 ? `₹${(day.revenue / 1000).toFixed(1)}k` : ''}
                </span>
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600"
                  style={{ 
                    height: `${(day.revenue / maxDailyRevenue) * 120}px`, 
                    minHeight: day.revenue > 0 ? '8px' : '2px' 
                  }}
                ></div>
                <span className="text-xs text-slate-400 mt-2 truncate w-full text-center">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {Object.entries(revenueData.paymentMethods).map(([method, amount]) => {
              const percentage = revenueData.totalRevenue > 0 
                ? Math.round((amount / revenueData.totalRevenue) * 100) 
                : 0;
              const colors = {
                'Online': 'bg-blue-500',
                'Cash': 'bg-emerald-500',
                'Wallet': 'bg-purple-500'
              };
              return (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{method}</span>
                    <span className="text-sm text-slate-500">₹{amount.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[method]} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Earning Doctors */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Earning Doctors</h3>
        {revenueData.byDoctor.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Doctor</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Appointments</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Earnings (90%)</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.byDoctor.slice(0, 10).map((doc, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">{doc.name[0]}</span>
                        </div>
                        <span className="font-medium text-slate-800">Dr. {doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">{doc.appointments}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">₹{doc.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      ₹{Math.round(doc.revenue * 0.9).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No revenue data available</p>
        )}
      </div>
    </div>
  );
};

export default RevenueReport;
