import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const MedicineDelivery = ({ userId, userAddress }) => {
  const [activeView, setActiveView] = useState('shop');
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '', phone: '', address: '', city: '', state: '', pincode: '', landmark: ''
  });

  useEffect(() => { fetchMedicines(); fetchCategories(); fetchOrders(); }, []);
  useEffect(() => { const timer = setTimeout(() => fetchMedicines(), 300); return () => clearTimeout(timer); }, [searchTerm, selectedCategory]);

  const fetchMedicines = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      const response = await axios.get(`/api/medicines/catalog?${params}`);
      setMedicines(response.data);
    } catch { console.error('Error fetching medicines'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => { try { const r = await axios.get('/api/medicines/categories'); setCategories(r.data); } catch {} };
  const fetchOrders = async () => { try { const r = await axios.get(`/api/medicines/orders/${userId}`); setOrders(r.data); } catch {} };

  const addToCart = (medicine) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) setCart(cart.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { ...medicine, quantity: 1 }]);
    toast.success(`${medicine.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) { const newQty = item.quantity + delta; return newQty > 0 ? { ...item, quantity: newQty } : item; }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const discount = subtotal > 1000 ? subtotal * 0.1 : 0;
    return { subtotal, deliveryFee, discount, total: subtotal + deliveryFee - discount };
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.address) { toast.error('Please fill in delivery details'); return; }
    try {
      await axios.post('/api/medicines/order', {
        userId, medicines: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price, manufacturer: item.manufacturer, requiresPrescription: item.requiresPrescription })),
        deliveryAddress, paymentMethod: 'COD'
      });
      toast.success('Order placed successfully!');
      setCart([]); setShowCheckout(false); fetchOrders(); setActiveView('orders');
    } catch { toast.error('Failed to place order'); }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try { await axios.put(`/api/medicines/order/${orderId}/cancel`); toast.success('Order cancelled'); fetchOrders(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to cancel order'); }
  };

  const handleReorder = async (orderId) => {
    try { await axios.post(`/api/medicines/reorder/${orderId}`); toast.success('Reorder placed successfully!'); fetchOrders(); }
    catch { toast.error('Failed to reorder'); }
  };

  const getStatusColor = (status) => ({
    'Placed': 'bg-blue-100 text-blue-700', 'Confirmed': 'bg-purple-100 text-purple-700', 'Processing': 'bg-amber-100 text-amber-700',
    'Shipped': 'bg-cyan-100 text-cyan-700', 'Out for Delivery': 'bg-emerald-100 text-emerald-700', 'Delivered': 'bg-green-100 text-green-700', 'Cancelled': 'bg-red-100 text-red-700'
  }[status] || 'bg-slate-100 text-slate-700');

  const totals = getCartTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-pills text-indigo-500"></i> Medicine Delivery
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {[{ id: 'shop', icon: 'fa-store', label: 'Shop' }, { id: 'orders', icon: 'fa-box', label: 'My Orders' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                <i className={`fas ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setShowCheckout(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              <i className="fas fa-shopping-cart"></i>
              <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">{cart.length}</span>
              ₹{totals.total.toFixed(0)}
            </button>
          )}
        </div>
      </div>

      {/* Shop View */}
      {activeView === 'shop' && (
        <>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setSelectedCategory('')} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!selectedCategory ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{cat}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500">Loading medicines...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {medicines.map(medicine => (
                <div key={medicine.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all group relative">
                  {medicine.requiresPrescription && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Rx</span>
                  )}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <i className="fas fa-capsules text-indigo-500 text-2xl"></i>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm text-center mb-1 truncate">{medicine.name}</h3>
                  <p className="text-xs text-slate-500 text-center mb-1 truncate">{medicine.manufacturer}</p>
                  <span className="block text-xs text-indigo-500 text-center mb-2">{medicine.category}</span>
                  <p className="text-lg font-bold text-slate-800 text-center mb-3">₹{medicine.price}</p>
                  <button onClick={() => addToCart(medicine)} className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all">
                    <i className="fas fa-plus mr-1"></i> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Orders View */}
      {activeView === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className="fas fa-box-open text-3xl text-slate-400"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No orders yet</h3>
              <p className="text-slate-500 mb-6">Start shopping for medicines</p>
              <button onClick={() => setActiveView('shop')} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                <i className="fas fa-store mr-2"></i> Browse Medicines
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">#{order.orderNumber}</span>
                    <span className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {order.medicines.slice(0, 3).map((med, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">{med.name} x{med.quantity}</span>
                  ))}
                  {order.medicines.length > 3 && <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-lg">+{order.medicines.length - 3} more</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-800">₹{order.totalAmount}</span>
                  <div className="flex gap-2">
                    {['Placed', 'Confirmed', 'Processing'].includes(order.orderStatus) && (
                      <button onClick={() => handleCancelOrder(order._id)} className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-xl hover:bg-red-200 transition-colors">Cancel</button>
                    )}
                    {order.orderStatus === 'Delivered' && (
                      <button onClick={() => handleReorder(order._id)} className="px-4 py-2 bg-indigo-100 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-200 transition-colors">
                        <i className="fas fa-redo mr-1"></i> Reorder
                      </button>
                    )}
                  </div>
                </div>
                {order.estimatedDelivery && !['Delivered', 'Cancelled'].includes(order.orderStatus) && (
                  <p className="mt-3 text-sm text-slate-500 flex items-center gap-2">
                    <i className="fas fa-truck text-indigo-400"></i> Expected by {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCheckout(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-shopping-cart text-indigo-500"></i> Checkout
              </h3>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <i className="fas fa-times text-slate-500"></i>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Cart Items</h4>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-sm text-slate-500">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center">-</button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center">
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Delivery Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name" value={deliveryAddress.fullName} onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="tel" placeholder="Phone Number" value={deliveryAddress.phone} onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <textarea placeholder="Full Address" value={deliveryAddress.address} onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                  className="w-full mt-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} />
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <input type="text" placeholder="City" value={deliveryAddress.city} onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="text" placeholder="State" value={deliveryAddress.state} onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="text" placeholder="Pincode" value={deliveryAddress.pincode} onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Delivery Fee</span><span>{totals.deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${totals.deliveryFee}`}</span></div>
                {totals.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount (10%)</span><span>-₹{totals.discount.toFixed(0)}</span></div>}
                <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200"><span>Total</span><span>₹{totals.total.toFixed(0)}</span></div>
              </div>

              <button onClick={handlePlaceOrder} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                <i className="fas fa-check mr-2"></i> Place Order (Cash on Delivery)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineDelivery;
