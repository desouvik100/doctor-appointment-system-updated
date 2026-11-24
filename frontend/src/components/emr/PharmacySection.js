import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const PharmacySection = ({ clinicId }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    medicineName: '', genericName: '', brandName: '', manufacturer: '',
    category: 'tablet', composition: '', strength: '', currentStock: 0,
    unit: 'units', costPrice: 0, sellingPrice: 0, mrp: 0, gstRate: 12,
    minStockLevel: 10, reorderLevel: 20, expiryDate: '', requiresPrescription: false
  });

  useEffect(() => { fetchInventory(); fetchSummary(); }, [clinicId]);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`/api/pharmacy/clinic/${clinicId}`);
      setInventory(res.data.items || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`/api/pharmacy/clinic/${clinicId}/summary`);
      setSummary(res.data.summary || {});
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`/api/pharmacy/item/${editingItem._id}`, { ...form, clinicId });
        toast.success('Item updated');
      } else {
        await axios.post('/api/pharmacy/add', { ...form, clinicId });
        toast.success('Item added');
      }
      setShowAddModal(false); setEditingItem(null); resetForm(); fetchInventory(); fetchSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const resetForm = () => setForm({
    medicineName: '', genericName: '', brandName: '', manufacturer: '',
    category: 'tablet', composition: '', strength: '', currentStock: 0,
    unit: 'units', costPrice: 0, sellingPrice: 0, mrp: 0, gstRate: 12,
    minStockLevel: 10, reorderLevel: 20, expiryDate: '', requiresPrescription: false
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({ ...item, expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '' });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`/api/pharmacy/item/${id}`);
      toast.success('Item deleted'); fetchInventory(); fetchSummary();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const filteredInventory = inventory.filter(item => {
    const matchSearch = item.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genericName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || item.stockStatus === filter;
    return matchSearch && matchFilter;
  });

  const getStockBadge = (status) => {
    const badges = {
      in_stock: 'bg-emerald-100 text-emerald-700',
      low_stock: 'bg-amber-100 text-amber-700',
      reorder: 'bg-orange-100 text-orange-700',
      out_of_stock: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Items', value: summary.totalItems || 0, icon: 'fa-pills', color: 'blue' },
          { label: 'Low Stock', value: summary.lowStock || 0, icon: 'fa-exclamation-triangle', color: 'amber' },
          { label: 'Out of Stock', value: summary.outOfStock || 0, icon: 'fa-times-circle', color: 'red' },
          { label: 'Expiring Soon', value: summary.expiringSoon || 0, icon: 'fa-clock', color: 'orange' },
          { label: 'Total Value', value: `₹${(summary.totalValue || 0).toLocaleString()}`, icon: 'fa-rupee-sign', color: 'emerald' }
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <i className="fas fa-pills text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Pharmacy Inventory</h2>
              <p className="text-sm text-slate-500">Manage medicines and stock</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setEditingItem(null); setShowAddModal(true); }} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-plus mr-2"></i>Add Medicine
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 border border-slate-200 rounded-xl">
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Medicine</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Expiry</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.medicineName}</p>
                    <p className="text-sm text-slate-500">{item.genericName || item.strength}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{item.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.currentStock} {item.unit}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">₹{item.sellingPrice}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockBadge(item.stockStatus)}`}>{item.stockStatus?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInventory.length === 0 && <p className="text-center py-8 text-slate-500">No medicines found</p>}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Edit Medicine' : 'Add Medicine'}</h3>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name *</label>
                  <input type="text" value={form.medicineName} onChange={(e) => setForm({...form, medicineName: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Generic Name</label>
                  <input type="text" value={form.genericName} onChange={(e) => setForm({...form, genericName: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'powder', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Strength</label>
                  <input type="text" value={form.strength} onChange={(e) => setForm({...form, strength: e.target.value})} placeholder="e.g., 500mg" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {['units', 'strips', 'bottles', 'vials', 'tubes', 'boxes', 'packets'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                  <input type="number" value={form.currentStock} onChange={(e) => setForm({...form, currentStock: parseInt(e.target.value)})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Cost Price *</label>
                  <input type="number" value={form.costPrice} onChange={(e) => setForm({...form, costPrice: parseFloat(e.target.value)})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Selling Price *</label>
                  <input type="number" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: parseFloat(e.target.value)})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">MRP</label>
                  <input type="number" value={form.mrp} onChange={(e) => setForm({...form, mrp: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Min Stock Level</label>
                  <input type="number" value={form.minStockLevel} onChange={(e) => setForm({...form, minStockLevel: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input type="number" value={form.reorderLevel} onChange={(e) => setForm({...form, reorderLevel: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="prescription" checked={form.requiresPrescription} onChange={(e) => setForm({...form, requiresPrescription: e.target.checked})} className="w-4 h-4 rounded" />
                <label htmlFor="prescription" className="text-sm text-slate-700">Requires Prescription</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg">{editingItem ? 'Update' : 'Add'} Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacySection;
