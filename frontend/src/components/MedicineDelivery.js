import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './MedicineDelivery.css';

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
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
    fetchOrders();
  }, []);

  const fetchMedicines = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await axios.get(`/api/medicines/catalog?${params}`);
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/medicines/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/medicines/orders/${userId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const addToCart = (medicine) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === medicine.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
    toast.success(`${medicine.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const discount = subtotal > 1000 ? subtotal * 0.1 : 0;
    return { subtotal, deliveryFee, discount, total: subtotal + deliveryFee - discount };
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.address) {
      toast.error('Please fill in delivery details');
      return;
    }

    try {
      const response = await axios.post('/api/medicines/order', {
        userId,
        medicines: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          manufacturer: item.manufacturer,
          requiresPrescription: item.requiresPrescription
        })),
        deliveryAddress,
        paymentMethod: 'COD'
      });

      toast.success('Order placed successfully!');
      setCart([]);
      setShowCheckout(false);
      fetchOrders();
      setActiveView('orders');
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await axios.put(`/api/medicines/order/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReorder = async (orderId) => {
    try {
      await axios.post(`/api/medicines/reorder/${orderId}`);
      toast.success('Reorder placed successfully!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Placed': '#3b82f6',
      'Confirmed': '#8b5cf6',
      'Processing': '#f59e0b',
      'Shipped': '#06b6d4',
      'Out for Delivery': '#10b981',
      'Delivered': '#22c55e',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const totals = getCartTotal();

  return (
    <div className="medicine-delivery">
      <div className="medicine-delivery__header">
        <h2><i className="fas fa-pills"></i> Medicine Delivery</h2>
        <div className="medicine-delivery__tabs">
          <button 
            className={activeView === 'shop' ? 'active' : ''}
            onClick={() => setActiveView('shop')}
          >
            <i className="fas fa-store"></i> Shop
          </button>
          <button 
            className={activeView === 'orders' ? 'active' : ''}
            onClick={() => setActiveView('orders')}
          >
            <i className="fas fa-box"></i> My Orders
          </button>
        </div>
        {cart.length > 0 && (
          <button className="medicine-delivery__cart-btn" onClick={() => setShowCheckout(true)}>
            <i className="fas fa-shopping-cart"></i>
            <span className="medicine-delivery__cart-count">{cart.length}</span>
            ₹{totals.total.toFixed(0)}
          </button>
        )}
      </div>

      {activeView === 'shop' && (
        <>
          <div className="medicine-delivery__filters">
            <div className="medicine-delivery__search">
              <i className="fas fa-search"></i>
              <input 
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="medicine-delivery__categories">
              <button 
                className={!selectedCategory ? 'active' : ''}
                onClick={() => setSelectedCategory('')}
              >
                All
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  className={selectedCategory === cat ? 'active' : ''}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="medicine-delivery__loading">
              <div className="medicine-delivery__spinner"></div>
            </div>
          ) : (
            <div className="medicine-delivery__grid">
              {medicines.map(medicine => (
                <div key={medicine.id} className="medicine-card">
                  {medicine.requiresPrescription && (
                    <span className="medicine-card__rx">Rx</span>
                  )}
                  <div className="medicine-card__icon">
                    <i className="fas fa-capsules"></i>
                  </div>
                  <h3>{medicine.name}</h3>
                  <p className="medicine-card__manufacturer">{medicine.manufacturer}</p>
                  <span className="medicine-card__category">{medicine.category}</span>
                  <div className="medicine-card__price">₹{medicine.price}</div>
                  <button 
                    className="medicine-card__add-btn"
                    onClick={() => addToCart(medicine)}
                  >
                    <i className="fas fa-plus"></i> Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeView === 'orders' && (
        <div className="medicine-delivery__orders">
          {orders.length === 0 ? (
            <div className="medicine-delivery__empty">
              <i className="fas fa-box-open"></i>
              <h3>No orders yet</h3>
              <p>Start shopping for medicines</p>
              <button onClick={() => setActiveView('shop')}>
                <i className="fas fa-store"></i> Browse Medicines
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-card__header">
                  <div>
                    <span className="order-card__number">#{order.orderNumber}</span>
                    <span className="order-card__date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span 
                    className="order-card__status"
                    style={{ background: getStatusColor(order.orderStatus) }}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <div className="order-card__items">
                  {order.medicines.slice(0, 3).map((med, i) => (
                    <span key={i}>{med.name} x{med.quantity}</span>
                  ))}
                  {order.medicines.length > 3 && (
                    <span className="order-card__more">+{order.medicines.length - 3} more</span>
                  )}
                </div>
                <div className="order-card__footer">
                  <span className="order-card__total">₹{order.totalAmount}</span>
                  <div className="order-card__actions">
                    {['Placed', 'Confirmed', 'Processing'].includes(order.orderStatus) && (
                      <button 
                        className="order-card__cancel"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Cancel
                      </button>
                    )}
                    {order.orderStatus === 'Delivered' && (
                      <button 
                        className="order-card__reorder"
                        onClick={() => handleReorder(order._id)}
                      >
                        <i className="fas fa-redo"></i> Reorder
                      </button>
                    )}
                  </div>
                </div>
                {order.estimatedDelivery && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                  <div className="order-card__eta">
                    <i className="fas fa-truck"></i>
                    Expected by {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="medicine-delivery__modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="medicine-delivery__modal" onClick={e => e.stopPropagation()}>
            <div className="medicine-delivery__modal-header">
              <h3><i className="fas fa-shopping-cart"></i> Checkout</h3>
              <button onClick={() => setShowCheckout(false)}><i className="fas fa-times"></i></button>
            </div>
            
            <div className="medicine-delivery__checkout">
              <div className="medicine-delivery__cart-items">
                <h4>Cart Items</h4>
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__info">
                      <span className="cart-item__name">{item.name}</span>
                      <span className="cart-item__price">₹{item.price}</span>
                    </div>
                    <div className="cart-item__qty">
                      <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="medicine-delivery__address">
                <h4>Delivery Address</h4>
                <div className="medicine-delivery__form-row">
                  <input 
                    type="text"
                    placeholder="Full Name"
                    value={deliveryAddress.fullName}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                  />
                  <input 
                    type="tel"
                    placeholder="Phone Number"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                  />
                </div>
                <textarea 
                  placeholder="Full Address"
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                />
                <div className="medicine-delivery__form-row">
                  <input 
                    type="text"
                    placeholder="City"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                  />
                  <input 
                    type="text"
                    placeholder="State"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                  />
                  <input 
                    type="text"
                    placeholder="Pincode"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                  />
                </div>
              </div>

              <div className="medicine-delivery__summary">
                <div className="medicine-delivery__summary-row">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(0)}</span>
                </div>
                <div className="medicine-delivery__summary-row">
                  <span>Delivery Fee</span>
                  <span>{totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="medicine-delivery__summary-row medicine-delivery__discount">
                    <span>Discount (10%)</span>
                    <span>-₹{totals.discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="medicine-delivery__summary-row medicine-delivery__total">
                  <span>Total</span>
                  <span>₹{totals.total.toFixed(0)}</span>
                </div>
              </div>

              <button className="medicine-delivery__place-order" onClick={handlePlaceOrder}>
                <i className="fas fa-check"></i> Place Order (Cash on Delivery)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineDelivery;
