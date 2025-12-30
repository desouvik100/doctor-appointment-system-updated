import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const BillingSection = ({ clinicId, clinicName, clinicAddress, clinicPhone, patients, doctors }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [form, setForm] = useState({
    patientId: '', doctorId: '', billType: 'consultation', items: [], notes: ''
  });
  const [newItem, setNewItem] = useState({ itemType: 'consultation', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 });

  useEffect(() => { fetchBills(); fetchSummary(); }, [clinicId]);

  const fetchBills = async () => {
    try {
      const res = await axios.get(`/api/clinic-billing/clinic/${clinicId}`);
      setBills(res.data.bills || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`/api/clinic-billing/clinic/${clinicId}/revenue-summary`);
      setSummary(res.data.summary || {});
    } catch (err) { console.error(err); }
  };

  const addItem = () => {
    if (!newItem.description || !newItem.unitPrice) { toast.error('Fill item details'); return; }
    const taxAmount = (newItem.unitPrice * newItem.quantity * newItem.taxRate) / 100;
    const total = (newItem.unitPrice * newItem.quantity) - newItem.discount + taxAmount;
    // Use a string key for UI tracking, not sent to backend
    setForm(prev => ({ ...prev, items: [...prev.items, { ...newItem, taxAmount, total, _key: Date.now().toString() }] }));
    setNewItem({ itemType: 'consultation', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 });
  };

  const removeItem = (key) => setForm(prev => ({ ...prev, items: prev.items.filter(i => i._key !== key) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId || form.items.length === 0) { toast.error('Select patient and add items'); return; }
    try {
      // Calculate totals and clean items before sending
      const subtotal = form.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
      const totalDiscount = form.items.reduce((sum, i) => sum + (i.discount || 0), 0);
      const totalTax = form.items.reduce((sum, i) => sum + (i.taxAmount || 0), 0);
      const grandTotal = subtotal - totalDiscount + totalTax;
      
      // Remove _key from items before sending
      const cleanItems = form.items.map(({ _key, ...item }) => item);
      
      await axios.post('/api/clinic-billing/create', { 
        ...form, 
        items: cleanItems,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        clinicId 
      });
      toast.success('Bill created'); setShowCreateModal(false); resetForm(); fetchBills(); fetchSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const resetForm = () => { setForm({ patientId: '', doctorId: '', billType: 'consultation', items: [], notes: '' }); };

  const handlePayment = async (billId, amount, method) => {
    try {
      await axios.post(`/api/clinic-billing/bill/${billId}/payment`, { amount, paymentMethod: method });
      toast.success('Payment recorded'); fetchBills(); fetchSummary();
    } catch (err) { toast.error('Failed'); }
  };

  const handleFinalize = async (billId) => {
    try {
      await axios.post(`/api/clinic-billing/bill/${billId}/finalize`);
      toast.success('Bill finalized'); fetchBills();
    } catch (err) { toast.error('Failed'); }
  };

  const filteredBills = bills.filter(bill => {
    const matchSearch = bill.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || bill.billNumber?.includes(searchTerm);
    const matchFilter = filter === 'all' || bill.paymentStatus === filter;
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status) => {
    const badges = { paid: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-700' };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(summary.totalRevenue || 0).toLocaleString()}`, icon: 'fa-chart-line', color: 'emerald' },
          { label: 'Collected', value: `₹${(summary.totalCollected || 0).toLocaleString()}`, icon: 'fa-check-circle', color: 'blue' },
          { label: 'Pending', value: `₹${(summary.totalPending || 0).toLocaleString()}`, icon: 'fa-clock', color: 'amber' },
          { label: 'Total Bills', value: summary.totalBills || 0, icon: 'fa-file-invoice', color: 'purple' }
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-file-invoice-dollar text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Billing & Invoices</h2>
              <p className="text-sm text-slate-500">Manage patient bills and payments</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-plus mr-2"></i>Create Bill
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Search bills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 border border-slate-200 rounded-xl">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Bills Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Bill #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map(bill => (
                <tr key={bill._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{bill.billNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{bill.patientId?.name || bill.patientName}</p>
                    <p className="text-sm text-slate-500">{bill.patientId?.phone || bill.patientPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(bill.billDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">₹{bill.grandTotal?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-emerald-600">₹{bill.paidAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(bill.paymentStatus)}`}>{bill.paymentStatus}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedBill(bill)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-eye"></i></button>
                      {bill.status === 'draft' && <button onClick={() => handleFinalize(bill._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><i className="fas fa-check"></i></button>}
                      {bill.paymentStatus !== 'paid' && <button onClick={() => handlePayment(bill._id, bill.dueAmount, 'cash')} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><i className="fas fa-rupee-sign"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBills.length === 0 && <p className="text-center py-8 text-slate-500">No bills found</p>}
        </div>
      </div>

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Create New Bill</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
                  <select value={form.patientId} onChange={(e) => setForm({...form, patientId: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p._id} value={p._id}>{p.name} - {p.phone}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                  <select value={form.doctorId} onChange={(e) => setForm({...form, doctorId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select></div>
              </div>

              {/* Add Item */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-700 mb-3">Add Item</h4>
                <div className="grid grid-cols-6 gap-2">
                  <select value={newItem.itemType} onChange={(e) => setNewItem({...newItem, itemType: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {['consultation', 'procedure', 'medicine', 'lab_test', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input type="number" placeholder="Qty" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input type="number" placeholder="Price" value={newItem.unitPrice} onChange={(e) => setNewItem({...newItem, unitPrice: parseFloat(e.target.value)})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <button type="button" onClick={addItem} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm"><i className="fas fa-plus"></i></button>
                </div>
              </div>

              {/* Items List */}
              {form.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">Price</th>
                        <th className="px-3 py-2 text-left">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map(item => (
                        <tr key={item._key} className="border-t border-slate-100">
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">₹{item.unitPrice}</td>
                          <td className="px-3 py-2 font-medium">₹{item.total}</td>
                          <td className="px-3 py-2"><button type="button" onClick={() => removeItem(item._key)} className="text-red-500"><i className="fas fa-times"></i></button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr><td colSpan="3" className="px-3 py-2 text-right font-medium">Grand Total:</td><td className="px-3 py-2 font-bold text-lg">₹{form.items.reduce((sum, i) => sum + i.total, 0)}</td><td></td></tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Create Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Bill Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Hidden in Print */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between print:hidden">
              <h3 className="text-lg font-bold text-slate-800">Invoice Preview</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600">
                  <i className="fas fa-print mr-2"></i>Print
                </button>
                <button onClick={() => setSelectedBill(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            {/* Printable Invoice */}
            <div id="printable-invoice" className="p-8 bg-white print:p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-200">
                <div>
                  <h1 className="text-2xl font-bold text-indigo-600">{clinicName || 'Hospital Name'}</h1>
                  {clinicAddress && <p className="text-sm text-slate-600 mt-1">{clinicAddress}</p>}
                  {clinicPhone && <p className="text-sm text-slate-600">Phone: {clinicPhone}</p>}
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-slate-800">INVOICE</h2>
                  <p className="text-lg font-semibold text-indigo-600">#{selectedBill.billNumber}</p>
                  <p className="text-sm text-slate-500">Date: {new Date(selectedBill.billDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Patient & Clinic Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                  <p className="font-semibold text-slate-800">{selectedBill.patientId?.name || selectedBill.patientName}</p>
                  <p className="text-sm text-slate-600">{selectedBill.patientId?.phone || selectedBill.patientPhone}</p>
                  <p className="text-sm text-slate-600">{selectedBill.patientId?.email}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Status</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedBill.paymentStatus)}`}>
                    {selectedBill.paymentStatus?.toUpperCase()}
                  </span>
                  {selectedBill.doctorId && (
                    <p className="text-sm text-slate-600 mt-2">Dr. {selectedBill.doctorId?.name}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Description</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm text-slate-600">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{item.description}</p>
                        <p className="text-xs text-slate-500 capitalize">{item.itemType}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">₹{item.unitPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">₹{item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-72">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">₹{selectedBill.subtotal?.toLocaleString()}</span>
                  </div>
                  {selectedBill.totalDiscount > 0 && (
                    <div className="flex justify-between py-2 text-sm text-emerald-600">
                      <span>Discount</span>
                      <span>-₹{selectedBill.totalDiscount?.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBill.totalTax > 0 && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-slate-600">Tax</span>
                      <span>₹{selectedBill.totalTax?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-2">
                    <span className="font-bold text-slate-800">Grand Total</span>
                    <span className="font-bold text-xl text-indigo-600">₹{selectedBill.grandTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-slate-600">Paid Amount</span>
                    <span className="text-emerald-600 font-medium">₹{selectedBill.paidAmount?.toLocaleString()}</span>
                  </div>
                  {selectedBill.dueAmount > 0 && (
                    <div className="flex justify-between py-2 text-sm bg-red-50 px-2 rounded">
                      <span className="text-red-600 font-medium">Balance Due</span>
                      <span className="text-red-600 font-bold">₹{selectedBill.dueAmount?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-6 mt-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Info</h4>
                    <p className="text-sm text-slate-600">Payment Method: {selectedBill.payments?.[0]?.paymentMethod || 'Cash/UPI/Card'}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Authorized Signature</h4>
                    <div className="h-12 border-b border-slate-300 w-48 ml-auto"></div>
                  </div>
                </div>
                <div className="text-center mt-8 pt-4 border-t border-dashed border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Thank you for visiting {clinicName || 'our hospital'}. Get well soon!</p>
                  <p className="text-xs text-slate-400">Powered by <span className="font-semibold text-indigo-500">HealthSync</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default BillingSection;
