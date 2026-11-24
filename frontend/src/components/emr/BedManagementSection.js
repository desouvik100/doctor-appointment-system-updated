import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const BedManagementSection = ({ clinicId }) => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [occupancyStats, setOccupancyStats] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [filter, setFilter] = useState({ wardType: '', status: '' });

  const [bedForm, setBedForm] = useState({
    bedNumber: '', wardType: 'general', wardName: '', roomNumber: '', floorNumber: '',
    bedType: 'standard', hasOxygen: false, hasMonitor: false, hasVentilator: false,
    dailyRate: 500
  });

  const [bulkForm, setBulkForm] = useState({
    wardType: 'general', wardName: '', floorNumber: '', startNumber: 1, count: 10, dailyRate: 500
  });

  useEffect(() => { fetchData(); }, [clinicId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchBeds(), fetchOccupancy()]);
    setLoading(false);
  };

  const fetchBeds = async () => {
    try {
      const params = {};
      if (filter.wardType) params.wardType = filter.wardType;
      if (filter.status) params.status = filter.status;
      const res = await axios.get(`/api/beds/clinic/${clinicId}`, { params });
      setBeds(res.data.beds || []);
    } catch (err) { console.error(err); }
  };

  const fetchOccupancy = async () => {
    try {
      const res = await axios.get(`/api/beds/occupancy/${clinicId}`);
      setOccupancyStats(res.data);
    } catch (err) { console.error(err); }
  };

  // Fetch beds when filter changes (but not on initial mount)
  useEffect(() => { 
    if (!loading) {
      fetchBeds(); 
    }
  }, [filter.wardType, filter.status]);

  const handleCreateBed = async (e) => {
    e.preventDefault();
    if (!bedForm.bedNumber) { toast.error('Bed number is required'); return; }
    try {
      await axios.post('/api/beds/create', { ...bedForm, clinicId });
      toast.success('Bed created successfully');
      setShowCreateModal(false);
      resetBedForm();
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create bed'); }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    try {
      const beds = [];
      for (let i = 0; i < bulkForm.count; i++) {
        beds.push({
          bedNumber: `${bulkForm.wardType.toUpperCase().slice(0, 3)}-${bulkForm.startNumber + i}`,
          wardType: bulkForm.wardType,
          wardName: bulkForm.wardName,
          floorNumber: bulkForm.floorNumber,
          dailyRate: bulkForm.dailyRate,
          bedType: 'standard'
        });
      }
      await axios.post('/api/beds/bulk-create', { beds, clinicId });
      toast.success(`${bulkForm.count} beds created successfully`);
      setShowBulkModal(false);
      setBulkForm({ wardType: 'general', wardName: '', floorNumber: '', startNumber: 1, count: 10, dailyRate: 500 });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create beds'); }
  };

  const handleUpdateStatus = async (bedId, status, notes = '') => {
    try {
      await axios.put(`/api/beds/${bedId}/status`, { status, maintenanceNotes: notes });
      toast.success('Bed status updated');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
  };

  const handleDeleteBed = async (bedId) => {
    if (!window.confirm('Deactivate this bed?')) return;
    try {
      await axios.delete(`/api/beds/${bedId}`);
      toast.success('Bed deactivated');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to deactivate bed'); }
  };

  const resetBedForm = () => {
    setBedForm({
      bedNumber: '', wardType: 'general', wardName: '', roomNumber: '', floorNumber: '',
      bedType: 'standard', hasOxygen: false, hasMonitor: false, hasVentilator: false,
      dailyRate: 500
    });
  };

  const getBedStatusColor = (status) => {
    const colors = {
      available: 'bg-emerald-500',
      occupied: 'bg-red-500',
      reserved: 'bg-amber-500',
      maintenance: 'bg-slate-500',
      cleaning: 'bg-blue-500'
    };
    return colors[status] || 'bg-slate-400';
  };

  const getBedStatusBadge = (status) => {
    const badges = {
      available: 'bg-emerald-100 text-emerald-700',
      occupied: 'bg-red-100 text-red-700',
      reserved: 'bg-amber-100 text-amber-700',
      maintenance: 'bg-slate-100 text-slate-700',
      cleaning: 'bg-blue-100 text-blue-700'
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Occupancy Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <i className="fas fa-bed text-slate-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{occupancyStats.totals?.total || 0}</p>
          <p className="text-sm text-slate-500">Total Beds</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <i className="fas fa-check-circle text-emerald-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{occupancyStats.totals?.available || 0}</p>
          <p className="text-sm text-slate-500">Available</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <i className="fas fa-user text-red-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{occupancyStats.totals?.occupied || 0}</p>
          <p className="text-sm text-slate-500">Occupied</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <i className="fas fa-clock text-amber-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{occupancyStats.totals?.reserved || 0}</p>
          <p className="text-sm text-slate-500">Reserved</p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <i className="fas fa-chart-pie text-indigo-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{occupancyStats.totals?.occupancyRate || 0}%</p>
          <p className="text-sm text-slate-500">Occupancy Rate</p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <i className="fas fa-bed text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Bed Management</h2>
              <p className="text-sm text-slate-500">Manage hospital beds and wards</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBulkModal(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200">
              <i className="fas fa-layer-group mr-2"></i>Bulk Add
            </button>
            <button onClick={() => { resetBedForm(); setShowCreateModal(true); }} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg">
              <i className="fas fa-plus mr-2"></i>Add Bed
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select value={filter.wardType} onChange={(e) => setFilter({...filter, wardType: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-xl">
            <option value="">All Wards</option>
            <option value="general">General</option>
            <option value="semi_private">Semi-Private</option>
            <option value="private">Private</option>
            <option value="icu">ICU</option>
            <option value="pediatric">Pediatric</option>
            <option value="maternity">Maternity</option>
          </select>
          <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-xl">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </div>

        {/* Ward-wise Occupancy */}
        {occupancyStats.stats?.length > 0 && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <h3 className="font-semibold text-slate-700 mb-3">Ward-wise Occupancy</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {occupancyStats.stats.map(ward => (
                <div key={ward._id} className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="font-medium text-slate-800 capitalize">{ward._id?.replace('_', ' ')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ward.total > 0 ? (ward.occupied / ward.total * 100) : 0}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{ward.occupied}/{ward.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beds Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {beds.map(bed => (
            <div key={bed._id} className={`p-4 rounded-xl border-2 ${bed.status === 'available' ? 'border-emerald-200 bg-emerald-50' : bed.status === 'occupied' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setSelectedBed(bed)}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">{bed.bedNumber}</span>
                <div className={`w-3 h-3 rounded-full ${getBedStatusColor(bed.status)}`}></div>
              </div>
              <p className="text-xs text-slate-500 capitalize">{bed.wardType?.replace('_', ' ')}</p>
              {bed.roomNumber && <p className="text-xs text-slate-400">Room {bed.roomNumber}</p>}
              {bed.currentPatientId?.name && (
                <p className="text-xs text-red-600 mt-1 truncate">{bed.currentPatientId.name}</p>
              )}
              <div className="flex gap-1 mt-2">
                {bed.hasOxygen && <i className="fas fa-wind text-blue-400 text-xs" title="Oxygen"></i>}
                {bed.hasMonitor && <i className="fas fa-heartbeat text-red-400 text-xs" title="Monitor"></i>}
                {bed.hasVentilator && <i className="fas fa-lungs text-purple-400 text-xs" title="Ventilator"></i>}
              </div>
            </div>
          ))}
        </div>
        {beds.length === 0 && <p className="text-center py-8 text-slate-500">No beds found. Add beds to get started.</p>}
      </div>

      {/* Create Bed Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Add New Bed</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleCreateBed} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bed Number *</label>
                  <input type="text" value={bedForm.bedNumber} onChange={(e) => setBedForm({...bedForm, bedNumber: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="e.g., GEN-101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ward Type</label>
                  <select value={bedForm.wardType} onChange={(e) => setBedForm({...bedForm, wardType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="general">General</option>
                    <option value="semi_private">Semi-Private</option>
                    <option value="private">Private</option>
                    <option value="icu">ICU</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="maternity">Maternity</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                  <input type="text" value={bedForm.roomNumber} onChange={(e) => setBedForm({...bedForm, roomNumber: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input type="text" value={bedForm.floorNumber} onChange={(e) => setBedForm({...bedForm, floorNumber: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Rate (₹)</label>
                <input type="number" value={bedForm.dailyRate} onChange={(e) => setBedForm({...bedForm, dailyRate: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Facilities</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={bedForm.hasOxygen} onChange={(e) => setBedForm({...bedForm, hasOxygen: e.target.checked})} className="w-4 h-4 rounded" />
                    <span className="text-sm">Oxygen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={bedForm.hasMonitor} onChange={(e) => setBedForm({...bedForm, hasMonitor: e.target.checked})} className="w-4 h-4 rounded" />
                    <span className="text-sm">Monitor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={bedForm.hasVentilator} onChange={(e) => setBedForm({...bedForm, hasVentilator: e.target.checked})} className="w-4 h-4 rounded" />
                    <span className="text-sm">Ventilator</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg">Add Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Bulk Add Beds</h3>
              <button onClick={() => setShowBulkModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleBulkCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ward Type</label>
                  <select value={bulkForm.wardType} onChange={(e) => setBulkForm({...bulkForm, wardType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="general">General</option>
                    <option value="semi_private">Semi-Private</option>
                    <option value="private">Private</option>
                    <option value="icu">ICU</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="maternity">Maternity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input type="text" value={bulkForm.floorNumber} onChange={(e) => setBulkForm({...bulkForm, floorNumber: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="e.g., 1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Number</label>
                  <input type="number" value={bulkForm.startNumber} onChange={(e) => setBulkForm({...bulkForm, startNumber: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Beds</label>
                  <input type="number" value={bulkForm.count} onChange={(e) => setBulkForm({...bulkForm, count: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Rate (₹)</label>
                <input type="number" value={bulkForm.dailyRate} onChange={(e) => setBulkForm({...bulkForm, dailyRate: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
              </div>
              <p className="text-sm text-slate-500">This will create {bulkForm.count} beds numbered {bulkForm.wardType.toUpperCase().slice(0, 3)}-{bulkForm.startNumber} to {bulkForm.wardType.toUpperCase().slice(0, 3)}-{bulkForm.startNumber + bulkForm.count - 1}</p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg">Create {bulkForm.count} Beds</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Details Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Bed {selectedBed.bedNumber}</h3>
              <button onClick={() => setSelectedBed(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBedStatusBadge(selectedBed.status)}`}>{selectedBed.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ward</span>
                <span className="font-medium capitalize">{selectedBed.wardType?.replace('_', ' ')}</span>
              </div>
              {selectedBed.roomNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Room</span>
                  <span className="font-medium">{selectedBed.roomNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Daily Rate</span>
                <span className="font-medium">₹{selectedBed.dailyRate}</span>
              </div>
              {selectedBed.currentPatientId && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">Currently Occupied</p>
                  <p className="text-red-800">{selectedBed.currentPatientId.name}</p>
                </div>
              )}
              
              {selectedBed.status !== 'occupied' && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['available', 'maintenance', 'cleaning'].filter(s => s !== selectedBed.status).map(status => (
                      <button key={status} onClick={() => { handleUpdateStatus(selectedBed._id, status); setSelectedBed(null); }} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 capitalize">
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedBed.status !== 'occupied' && (
                <button onClick={() => { handleDeleteBed(selectedBed._id); setSelectedBed(null); }} className="w-full py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm">
                  <i className="fas fa-trash mr-2"></i>Deactivate Bed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagementSection;
