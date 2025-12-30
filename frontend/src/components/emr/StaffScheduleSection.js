import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const StaffScheduleSection = ({ clinicId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    staffId: '', staffName: '', role: 'receptionist', date: '', shift: 'morning', startTime: '09:00', endTime: '17:00'
  });

  useEffect(() => { fetchSchedules(); fetchTodayAttendance(); fetchStaff(); }, [clinicId, selectedDate]);

  const fetchSchedules = async () => {
    try {
      const start = new Date(selectedDate); start.setDate(start.getDate() - 3);
      const end = new Date(selectedDate); end.setDate(end.getDate() + 7);
      const res = await axios.get(`/api/staff-schedule/clinic/${clinicId}?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      setSchedules(res.data.schedules || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get(`/api/staff-schedule/clinic/${clinicId}/today`);
      setTodaySummary(res.data.summary || {});
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`/api/receptionists/doctors/${clinicId}`);
      setStaff(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/staff-schedule/create', { ...form, clinicId });
      toast.success('Schedule created'); setShowAddModal(false); resetForm(); fetchSchedules(); fetchTodayAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const resetForm = () => setForm({ staffId: '', staffName: '', role: 'receptionist', date: selectedDate, shift: 'morning', startTime: '09:00', endTime: '17:00' });

  const handleCheckIn = async (scheduleId) => {
    try {
      await axios.post(`/api/staff-schedule/schedule/${scheduleId}/check-in`);
      toast.success('Checked in'); fetchSchedules(); fetchTodayAttendance();
    } catch (err) { toast.error('Failed'); }
  };

  const handleCheckOut = async (scheduleId) => {
    try {
      await axios.post(`/api/staff-schedule/schedule/${scheduleId}/check-out`);
      toast.success('Checked out'); fetchSchedules(); fetchTodayAttendance();
    } catch (err) { toast.error('Failed'); }
  };

  const handleMarkAbsent = async (scheduleId) => {
    try {
      await axios.post(`/api/staff-schedule/schedule/${scheduleId}/absent`, { reason: 'Marked absent by admin' });
      toast.success('Marked absent'); fetchSchedules(); fetchTodayAttendance();
    } catch (err) { toast.error('Failed'); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-slate-100 text-slate-700', confirmed: 'bg-blue-100 text-blue-700',
      checked_in: 'bg-emerald-100 text-emerald-700', checked_out: 'bg-purple-100 text-purple-700',
      absent: 'bg-red-100 text-red-700', leave: 'bg-amber-100 text-amber-700'
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  const getShiftTimes = (shift) => {
    const shifts = { morning: '09:00 - 13:00', afternoon: '13:00 - 17:00', evening: '17:00 - 21:00', night: '21:00 - 09:00', full_day: '09:00 - 21:00' };
    return shifts[shift] || shift;
  };

  const todaySchedules = schedules.filter(s => new Date(s.date).toDateString() === new Date(selectedDate).toDateString());

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: todaySummary.total || 0, icon: 'fa-users', color: 'blue' },
          { label: 'Checked In', value: todaySummary.checkedIn || 0, icon: 'fa-check-circle', color: 'emerald' },
          { label: 'Absent', value: todaySummary.absent || 0, icon: 'fa-times-circle', color: 'red' },
          { label: 'On Leave', value: todaySummary.onLeave || 0, icon: 'fa-calendar-minus', color: 'amber' }
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
            <i className={`fas ${stat.icon} text-${stat.color}-500 mb-2`}></i>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <i className="fas fa-user-clock text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Staff Schedule & Attendance</h2>
              <p className="text-sm text-slate-500">Manage staff shifts and track attendance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl" />
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg">
              <i className="fas fa-plus mr-2"></i>Add Schedule
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Staff</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Shift</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todaySchedules.map(schedule => (
                <tr key={schedule._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {schedule.staffId?.name?.charAt(0) || schedule.staffName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{schedule.staffId?.name || schedule.staffName}</p>
                        <p className="text-sm text-slate-500">{schedule.staffId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{schedule.role}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(schedule.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{schedule.shift}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{schedule.startTime} - {schedule.endTime}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(schedule.status)}`}>{schedule.status?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {schedule.status === 'scheduled' && (
                        <>
                          <button onClick={() => handleCheckIn(schedule._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Check In"><i className="fas fa-sign-in-alt"></i></button>
                          <button onClick={() => handleMarkAbsent(schedule._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Mark Absent"><i className="fas fa-times"></i></button>
                        </>
                      )}
                      {schedule.status === 'checked_in' && (
                        <button onClick={() => handleCheckOut(schedule._id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Check Out"><i className="fas fa-sign-out-alt"></i></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {todaySchedules.length === 0 && <p className="text-center py-8 text-slate-500">No schedules for this date</p>}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Add Schedule</h3>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Staff Member *</label>
                <select value={form.staffId} onChange={(e) => {
                  const selected = staff.find(s => s._id === e.target.value);
                  setForm({...form, staffId: e.target.value, staffName: selected?.name || ''});
                }} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  <option value="">Select Staff</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {['doctor', 'receptionist', 'nurse', 'pharmacist', 'lab_technician', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                  <select value={form.shift} onChange={(e) => setForm({...form, shift: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {['morning', 'afternoon', 'evening', 'night', 'full_day'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg">Create Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffScheduleSection;
