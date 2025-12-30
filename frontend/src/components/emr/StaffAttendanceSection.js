import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const StaffAttendanceSection = ({ clinicId }) => {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveForm, setLeaveForm] = useState({
    staffId: '', leaveType: 'casual', startDate: '', endDate: '', reason: ''
  });

  const leaveTypes = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid'];
  const statusColors = {
    present: '#10b981', absent: '#ef4444', late: '#f59e0b', half_day: '#3b82f6', on_leave: '#8b5cf6',
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444'
  };

  useEffect(() => { fetchAttendance(); fetchLeaves(); fetchSummary(); }, [clinicId, selectedDate]);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`/api/staff-management/attendance/clinic/${clinicId}`, {
        params: { startDate: selectedDate, endDate: selectedDate }
      });
      setAttendance(res.data.attendance || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`/api/staff-management/leave/clinic/${clinicId}`);
      setLeaves(res.data.leaves || []);
    } catch (err) { console.error(err); }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`/api/staff-management/attendance/summary/${clinicId}`);
      setSummary(res.data.summary || []);
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async (staffId) => {
    try {
      await axios.post('/api/staff-management/attendance/check-in', { clinicId, staffId, checkInMethod: 'manual' });
      toast.success('Checked in successfully');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to check in'); }
  };

  const handleCheckOut = async (staffId) => {
    try {
      await axios.post('/api/staff-management/attendance/check-out', { clinicId, staffId, checkOutMethod: 'manual' });
      toast.success('Checked out successfully');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to check out'); }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/staff-management/leave/apply', { ...leaveForm, clinicId });
      toast.success('Leave request submitted');
      setShowLeaveModal(false);
      setLeaveForm({ staffId: '', leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit leave'); }
  };

  const handleLeaveAction = async (id, action) => {
    try {
      await axios.post(`/api/staff-management/leave/${id}/action`, { action });
      toast.success(`Leave ${action}d`);
      fetchLeaves();
    } catch (err) { toast.error('Failed to process leave'); }
  };

  const formatTime = (date) => date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Present Today', value: attendance.filter(a => a.status === 'present').length, color: '#10b981', icon: 'user-check' },
          { label: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: '#ef4444', icon: 'user-times' },
          { label: 'On Leave', value: attendance.filter(a => a.status === 'on_leave').length, color: '#8b5cf6', icon: 'calendar-minus' },
          { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'pending').length, color: '#f59e0b', icon: 'clock' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <i className={`fas fa-${stat.icon}`} style={{ color: stat.color }}></i>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-user-clock text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Staff Attendance & Leave</h2>
              <p className="text-sm text-slate-500">Track attendance and manage leave requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl" />
            <button onClick={() => setShowLeaveModal(true)} className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg">
              <i className="fas fa-plus mr-2"></i>Apply Leave
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['attendance', 'leaves', 'summary'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>
          ))}
        </div>

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Check In</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Check Out</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Hours</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{record.staffId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{record.staffId?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(record.checkInTime)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(record.checkOutTime)}</td>
                    <td className="py-3 px-4 text-slate-600">{record.workedHours?.toFixed(1) || '-'} hrs</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[record.status]}15`, color: statusColors[record.status] }}>
                        {record.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {!record.checkInTime && <button onClick={() => handleCheckIn(record.staffId?._id)} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100">Check In</button>}
                        {record.checkInTime && !record.checkOutTime && <button onClick={() => handleCheckOut(record.staffId?._id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">Check Out</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && <p className="text-center py-8 text-slate-500">No attendance records for this date</p>}
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Days</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{leave.staffId?.name || 'Unknown'}</p>
                    </td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs capitalize">{leave.leaveType}</span></td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      {new Date(leave.startDate).toLocaleDateString('en-IN')} - {new Date(leave.endDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{leave.totalDays}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[leave.status]}15`, color: statusColors[leave.status] }}>{leave.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleLeaveAction(leave._id, 'approve')} className="p-2 hover:bg-green-50 rounded-lg"><i className="fas fa-check text-green-500"></i></button>
                          <button onClick={() => handleLeaveAction(leave._id, 'reject')} className="p-2 hover:bg-red-50 rounded-lg"><i className="fas fa-times text-red-500"></i></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && <p className="text-center py-8 text-slate-500">No leave requests</p>}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Present</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Absent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Late</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Leave</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{s.staffName}</td>
                    <td className="py-3 px-4 text-green-600">{s.presentDays}</td>
                    <td className="py-3 px-4 text-red-600">{s.absentDays}</td>
                    <td className="py-3 px-4 text-amber-600">{s.lateDays}</td>
                    <td className="py-3 px-4 text-violet-600">{s.leaveDays}</td>
                    <td className="py-3 px-4 text-slate-600">{s.totalWorkedHours?.toFixed(1) || 0} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.length === 0 && <p className="text-center py-8 text-slate-500">No summary data available</p>}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Apply for Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                <select value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  {leaveTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceSection;
