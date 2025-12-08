import { useState, useEffect, useMemo } from 'react';

const DashboardAnalytics = ({ appointments = [], doctors = [], users = [], revenue = [] }) => {
  const [timeRange, setTimeRange] = useState('week');

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    const daysBack = ranges[timeRange];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const filteredAppointments = appointments.filter(a => new Date(a.date) >= startDate);
    const completed = filteredAppointments.filter(a => a.status === 'completed').length;
    const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length;
    const pending = filteredAppointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

    // Calculate revenue
    const totalRevenue = filteredAppointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.amount || a.doctorId?.consultationFee || 500), 0);

    // Daily breakdown for chart
    const dailyData = [];
    for (let i = Math.min(daysBack, 14) - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(a => 
        new Date(a.date).toISOString().split('T')[0] === dateStr
      );
      dailyData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        appointments: dayAppointments.length,
        completed: dayAppointments.filter(a => a.status === 'completed').length,
        revenue: dayAppointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (a.amount || 500), 0)
      });
    }

    return {
      total: filteredAppointments.length,
      completed,
      cancelled,
      pending,
      totalRevenue,
      dailyData,
      completionRate: filteredAppointments.length > 0 
        ? Math.round((completed / filteredAppointments.length) * 100) 
        : 0
    };
  }, [appointments, timeRange]);

  // Specialization breakdown
  const specializationData = useMemo(() => {
    const breakdown = {};
    appointments.forEach(apt => {
      const spec = apt.doctorId?.specialization || 'Other';
      breakdown[spec] = (breakdown[spec] || 0) + 1;
    });
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / appointments.length) * 100) }));
  }, [appointments]);

  const maxAppointments = Math.max(...stats.dailyData.map(d => d.appointments), 1);

  return (
    <div className="dashboard-analytics space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Analytics Overview</h2>
        <div className="flex gap-2">
          {[
            { key: 'week', label: '7 Days' },
            { key: 'month', label: '30 Days' },
            { key: 'quarter', label: '90 Days' }
          ].map(range => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${timeRange === range.key 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Appointments" 
          value={stats.total} 
          icon="fa-calendar-check" 
          color="indigo"
          trend={`${stats.completionRate}% completed`}
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          icon="fa-check-circle" 
          color="emerald"
          trend={`${stats.cancelled} cancelled`}
        />
        <StatCard 
          title="Pending" 
          value={stats.pending} 
          icon="fa-clock" 
          color="amber"
        />
        <StatCard 
          title="Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon="fa-rupee-sign" 
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Appointments Trend</h3>
          <div className="h-48 flex items-end gap-2">
            {stats.dailyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{day.appointments}</span>
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-500"
                    style={{ height: `${(day.appointments / maxAppointments) * 120}px`, minHeight: day.appointments > 0 ? '8px' : '2px' }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400 mt-2 truncate w-full text-center">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialization Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Specializations</h3>
          <div className="space-y-4">
            {specializationData.length > 0 ? specializationData.map((spec, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{spec.name}</span>
                  <span className="text-sm text-slate-500">{spec.count} ({spec.percentage}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${spec.percentage}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Completion Rate Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Completion Rate</h3>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e2e8f0" strokeWidth="12" fill="none" />
              <circle 
                cx="64" cy="64" r="56" 
                stroke="url(#gradient)" 
                strokeWidth="12" 
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${stats.completionRate * 3.52} 352`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-slate-800">{stats.completionRate}%</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">{stats.completed} of {stats.total} completed</p>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-user-md text-blue-600"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{doctors.length}</p>
                  <p className="text-sm text-slate-500">Active Doctors</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <i className="fas fa-users text-emerald-600"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                  <p className="text-sm text-slate-500">Registered Users</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <i className="fas fa-chart-line text-amber-600"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {appointments.length > 0 ? Math.round(appointments.length / Math.max(doctors.length, 1)) : 0}
                  </p>
                  <p className="text-sm text-slate-500">Avg per Doctor</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <i className="fas fa-rupee-sign text-purple-600"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    ₹{stats.total > 0 ? Math.round(stats.totalRevenue / stats.completed || 0) : 0}
                  </p>
                  <p className="text-sm text-slate-500">Avg Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend }) => {
  const colors = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', gradient: 'from-indigo-500 to-indigo-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', gradient: 'from-amber-500 to-amber-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' }
  }[color];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <i className={`fas ${icon} ${colors.text} text-xl`}></i>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
      {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
    </div>
  );
};

export default DashboardAnalytics;
