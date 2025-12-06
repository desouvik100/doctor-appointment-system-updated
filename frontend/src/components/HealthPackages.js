// frontend/src/components/HealthPackages.js
// Health Packages - Bundle Consultations at Discounted Rates
import { useState, useEffect } from 'react';
import './HealthPackages.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const HealthPackages = ({ userId, onClose }) => {
  const [packages, setPackages] = useState([]);
  const [userPackages, setUserPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchPackages();
    if (userId) {
      fetchUserPackages();
    }
  }, [userId]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/health-packages`);
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Fetch packages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/health-packages/user/${userId}`);
      const data = await response.json();
      setUserPackages(data);
    } catch (error) {
      console.error('Fetch user packages error:', error);
    }
  };

  const handlePurchase = async (pkg) => {
    // In production, integrate with PayU payment
    const confirmed = window.confirm(`Purchase ${pkg.name} for ₹${pkg.discountedPrice}?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/health-packages/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          packageId: pkg._id,
          amountPaid: pkg.discountedPrice,
          paymentId: `PAY_${Date.now()}` // Mock payment ID
        })
      });

      if (response.ok) {
        alert('Package purchased successfully!');
        fetchUserPackages();
        setActiveTab('my-packages');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase package');
    }
  };

  const getPackageIcon = (type) => {
    switch (type) {
      case 'consultation': return 'fa-user-md';
      case 'checkup': return 'fa-heartbeat';
      case 'wellness': return 'fa-spa';
      case 'corporate': return 'fa-building';
      case 'family': return 'fa-users';
      default: return 'fa-box';
    }
  };

  const getPackageColor = (type) => {
    switch (type) {
      case 'consultation': return '#6366f1';
      case 'checkup': return '#22c55e';
      case 'wellness': return '#f59e0b';
      case 'corporate': return '#3b82f6';
      case 'family': return '#ec4899';
      default: return '#6366f1';
    }
  };

  if (loading) {
    return (
      <div className="health-packages">
        <div className="health-packages__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="health-packages">
      <div className="health-packages__header">
        <h2><i className="fas fa-gift"></i> Health Packages</h2>
        {onClose && (
          <button className="health-packages__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="health-packages__tabs">
        <button 
          className={`tab ${activeTab === 'browse' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <i className="fas fa-store"></i> Browse Packages
        </button>
        <button 
          className={`tab ${activeTab === 'my-packages' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('my-packages')}
        >
          <i className="fas fa-box-open"></i> My Packages
          {userPackages.length > 0 && (
            <span className="tab-badge">{userPackages.length}</span>
          )}
        </button>
      </div>

      <div className="health-packages__content">
        {activeTab === 'browse' && (
          <>
            {/* Featured Banner */}
            <div className="featured-banner">
              <div className="featured-banner__content">
                <span className="featured-banner__badge">Limited Time Offer</span>
                <h3>Save up to 40% on Health Packages</h3>
                <p>Bundle consultations and health checkups at discounted rates</p>
              </div>
              <div className="featured-banner__icon">
                <i className="fas fa-percentage"></i>
              </div>
            </div>

            {/* Packages Grid */}
            <div className="packages-grid">
              {packages.map((pkg) => (
                <div 
                  key={pkg._id} 
                  className={`package-card ${pkg.isFeatured ? 'package-card--featured' : ''}`}
                >
                  {pkg.badge && (
                    <span className="package-card__badge">{pkg.badge}</span>
                  )}
                  
                  <div 
                    className="package-card__icon"
                    style={{ background: `linear-gradient(135deg, ${getPackageColor(pkg.packageType)} 0%, ${getPackageColor(pkg.packageType)}99 100%)` }}
                  >
                    <i className={`fas ${getPackageIcon(pkg.packageType)}`}></i>
                  </div>

                  <h3>{pkg.name}</h3>
                  <p className="package-card__description">{pkg.description}</p>

                  <div className="package-card__includes">
                    <h4>Includes:</h4>
                    <ul>
                      {pkg.includes?.slice(0, 4).map((item, idx) => (
                        <li key={idx}>
                          <i className="fas fa-check"></i>
                          {item.quantity > 1 && <span className="qty">{item.quantity}x</span>}
                          {item.name}
                        </li>
                      ))}
                      {pkg.includes?.length > 4 && (
                        <li className="more">+{pkg.includes.length - 4} more</li>
                      )}
                    </ul>
                  </div>

                  <div className="package-card__pricing">
                    <div className="price-original">₹{pkg.originalPrice}</div>
                    <div className="price-discounted">₹{pkg.discountedPrice}</div>
                    {pkg.discountPercent && (
                      <span className="discount-badge">{pkg.discountPercent}% OFF</span>
                    )}
                  </div>

                  <div className="package-card__validity">
                    <i className="fas fa-calendar"></i>
                    Valid for {pkg.validityDays} days
                  </div>

                  <button 
                    className="package-card__buy-btn"
                    onClick={() => handlePurchase(pkg)}
                  >
                    <i className="fas fa-shopping-cart"></i> Buy Now
                  </button>
                </div>
              ))}
            </div>

            {packages.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-box-open"></i>
                <p>No packages available at the moment</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'my-packages' && (
          <div className="my-packages">
            {userPackages.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-shopping-bag"></i>
                <p>You haven't purchased any packages yet</p>
                <button onClick={() => setActiveTab('browse')}>
                  <i className="fas fa-store"></i> Browse Packages
                </button>
              </div>
            ) : (
              <div className="user-packages-list">
                {userPackages.map((userPkg) => (
                  <div 
                    key={userPkg._id} 
                    className={`user-package-card ${userPkg.status !== 'active' ? 'user-package-card--inactive' : ''}`}
                  >
                    <div className="user-package-card__header">
                      <div 
                        className="user-package-card__icon"
                        style={{ background: getPackageColor(userPkg.packageId?.packageType) }}
                      >
                        <i className={`fas ${getPackageIcon(userPkg.packageId?.packageType)}`}></i>
                      </div>
                      <div className="user-package-card__info">
                        <h4>{userPkg.packageId?.name}</h4>
                        <span className={`status-badge status-badge--${userPkg.status}`}>
                          {userPkg.status}
                        </span>
                      </div>
                    </div>

                    <div className="user-package-card__dates">
                      <div>
                        <span className="label">Purchased</span>
                        <span className="value">
                          {new Date(userPkg.purchaseDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="label">Expires</span>
                        <span className="value">
                          {new Date(userPkg.expiryDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="user-package-card__usage">
                      <h5>Remaining Items:</h5>
                      <div className="usage-items">
                        {userPkg.remainingItems?.map((item, idx) => (
                          <div key={idx} className="usage-item">
                            <span className="usage-item__name">{item.name}</span>
                            <span className="usage-item__count">
                              {item.remaining}/{item.total}
                            </span>
                            <div className="usage-item__bar">
                              <div 
                                className="usage-item__bar-fill"
                                style={{ width: `${(item.remaining / item.total) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {userPkg.status === 'active' && (
                      <button className="user-package-card__use-btn">
                        <i className="fas fa-calendar-plus"></i> Book Appointment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthPackages;
