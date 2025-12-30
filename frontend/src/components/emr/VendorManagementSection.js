import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const VendorManagementSection = ({ clinicId }) => {
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vendors');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    name: '', vendorCode: '', email: '', phone: '', gstNumber: '', categories: [], paymentTerms: 'net_30'
  });
  const [poForm, setPOForm] = useState({
    vendorId: '', items: [], expectedDeliveryDate: '', notes: '', priority: 'normal'
  });
  const [newItem, setNewItem] = useState({ itemName: '', quantity: 1, unitPrice: 0, unit: 'pcs' });

  const categories = ['medicines', 'surgical', 'consumables', 'equipment', 'lab_supplies', 'office_supplies'];
  const statusColors = {
    draft: '#64748b', pending_approval: '#f59e0b', approved: '#3b82f6', ordered: '#8b5cf6',
    partial_received: '#f59e0b', received: '#10b981', cancelled: '#ef4444'
  };

  useEffect(() => { fetchVendors(); fetchPurchaseOrders(); }, [clinicId]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`/api/vendors/vendors/clinic/${clinicId}`);
      setVendors(res.data.vendors || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await axios.get(`/api/vendors/purchase-orders/clinic/${clinicId}`);
      setPurchaseOrders(res.data.purchaseOrders || []);
    } catch (err) { console.error(err); }
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/vendors/vendors', { ...vendorForm, clinicId });
      toast.success('Vendor created successfully');
      setShowVendorModal(false);
      setVendorForm({ name: '', vendorCode: '', email: '', phone: '', gstNumber: '', categories: [], paymentTerms: 'net_30' });
      fetchVendors();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create vendor'); }
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    if (poForm.items.length === 0) { toast.error('Add at least one item'); return; }
    try {
      await axios.post('/api/vendors/purchase-orders', { ...poForm, clinicId });
      toast.success('Purchase order created');
      setShowPOModal(false);
      setPOForm({ vendorId: '', items: [], expectedDeliveryDate: '', notes: '', priority: 'normal' });
      fetchPurchaseOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create PO'); }
  };

  const addItemToPO = () => {
    if (!newItem.itemName || newItem.quantity < 1) { toast.error('Enter item details'); return; }
    setPOForm(prev => ({ ...prev, items: [...prev.items, { ...newItem, totalPrice: newItem.quantity * newItem.unitPrice }] }));
    setNewItem({ itemName: '', quantity: 1, unitPrice: 0, unit: 'pcs' });
  };

  const approvePO = async (id) => {
    try {
      await axios.post(`/api/vendors/purchase-orders/${id}/approve`);
      toast.success('PO approved');
      fetchPurchaseOrders();
    } catch (err) { toast.error('Failed to approve'); }
  };

  const formatCurrency = (amt) => `₹${(amt || 0).toLocaleString('en-IN')}`;

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors', value: vendors.length, color: '#6366f1', icon: 'store' },
          { label: 'Active Vendors', value: vendors.filter(v => v.status === 'active').length, color: '#10b981', icon: 'check-circle' },
          { label: 'Open POs', value: purchaseOrders.filter(p => !['received', 'cancelled'].includes(p.status)).length, color: '#f59e0b', icon: 'file-alt' },
          { label: 'Total PO Value', value: formatCurrency(purchaseOrders.reduce((s, p) => s + (p.totalAmount || 0), 0)), color: '#3b82f6', icon: 'rupee-sign' }
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <i className="fas fa-truck text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Vendor & Purchase Orders</h2>
              <p className="text-sm text-slate-500">Manage suppliers and procurement</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowVendorModal(true)} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg">
              <i className="fas fa-plus mr-2"></i>Add Vendor
            </button>
            <button onClick={() => setShowPOModal(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200">
              <i className="fas fa-file-alt mr-2"></i>New PO
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['vendors', 'purchase-orders'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab.replace('-', ' ')}</button>
          ))}
        </div>

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Vendor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Categories</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">GST</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(vendor => (
                  <tr key={vendor._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{vendor.name}</p>
                      <p className="text-xs text-slate-500">{vendor.vendorCode}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      <p>{vendor.email}</p>
                      <p>{vendor.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(vendor.categories || []).slice(0, 2).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs capitalize">{c.replace('_', ' ')}</span>
                        ))}
                        {(vendor.categories?.length || 0) > 2 && <span className="text-xs text-slate-400">+{vendor.categories.length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{vendor.gstNumber || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${vendor.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{vendor.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setSelectedVendor(vendor)} className="p-2 hover:bg-slate-100 rounded-lg"><i className="fas fa-eye text-slate-500"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendors.length === 0 && <p className="text-center py-8 text-slate-500">No vendors found</p>}
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'purchase-orders' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">PO #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Vendor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{po.poNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{po.vendorId?.name || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{po.items?.length || 0} items</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(po.totalAmount)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[po.status]}15`, color: statusColors[po.status] }}>
                        {po.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPO(po)} className="p-2 hover:bg-slate-100 rounded-lg"><i className="fas fa-eye text-slate-500"></i></button>
                        {po.status === 'pending_approval' && <button onClick={() => approvePO(po._id)} className="p-2 hover:bg-green-50 rounded-lg"><i className="fas fa-check text-green-500"></i></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchaseOrders.length === 0 && <p className="text-center py-8 text-slate-500">No purchase orders found</p>}
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Add Vendor</h3>
              <button onClick={() => setShowVendorModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleVendorSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name *</label>
                  <input type="text" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Code</label>
                  <input type="text" value={vendorForm.vendorCode} onChange={e => setVendorForm({...vendorForm, vendorCode: e.target.value.toUpperCase()})} placeholder="Auto-generated" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                  <input type="text" value={vendorForm.gstNumber} onChange={e => setVendorForm({...vendorForm, gstNumber: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-1 text-sm">
                        <input type="checkbox" checked={vendorForm.categories.includes(cat)} onChange={e => {
                          if (e.target.checked) setVendorForm({...vendorForm, categories: [...vendorForm.categories, cat]});
                          else setVendorForm({...vendorForm, categories: vendorForm.categories.filter(c => c !== cat)});
                        }} className="rounded" />
                        <span className="capitalize">{cat.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowVendorModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:shadow-lg">Add Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">New Purchase Order</h3>
              <button onClick={() => setShowPOModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handlePOSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor *</label>
                  <select value={poForm.vendorId} onChange={e => setPOForm({...poForm, vendorId: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
                  <input type="date" value={poForm.expectedDeliveryDate} onChange={e => setPOForm({...poForm, expectedDeliveryDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              
              {/* Add Items */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="font-medium text-slate-700 mb-3">Add Items</h4>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  <input type="text" placeholder="Item name" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input type="number" placeholder="Qty" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input type="number" placeholder="Price" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <button type="button" onClick={addItemToPO} className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100">Add</button>
                </div>
                {poForm.items.length > 0 && (
                  <div className="space-y-2">
                    {poForm.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                        <span className="text-sm">{item.itemName} x {item.quantity}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{formatCurrency(item.totalPrice)}</span>
                          <button type="button" onClick={() => setPOForm({...poForm, items: poForm.items.filter((_, idx) => idx !== i)})} className="text-red-500 hover:text-red-600"><i className="fas fa-times"></i></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2 border-t border-slate-200">
                      <span className="font-semibold">Total: {formatCurrency(poForm.items.reduce((s, i) => s + i.totalPrice, 0))}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPOModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:shadow-lg">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagementSection;
