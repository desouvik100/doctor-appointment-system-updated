import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './EmergencyContacts.css';

const EmergencyContacts = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false
  });
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // Default emergency numbers for India
  const emergencyNumbers = [
    { name: 'Ambulance', number: '102', icon: 'fa-ambulance', color: '#ef4444' },
    { name: 'Police', number: '100', icon: 'fa-shield-alt', color: '#3b82f6' },
    { name: 'Fire', number: '101', icon: 'fa-fire', color: '#f97316' },
    { name: 'Women Helpline', number: '1091', icon: 'fa-female', color: '#ec4899' },
    { name: 'Child Helpline', number: '1098', icon: 'fa-child', color: '#8b5cf6' },
    { name: 'Emergency', number: '112', icon: 'fa-exclamation-triangle', color: '#dc2626' }
  ];

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    const saved = localStorage.getItem(`emergency_contacts_${userId}`);
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  };

  const saveContacts = (newContacts) => {
    localStorage.setItem(`emergency_contacts_${userId}`, JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Name and phone are required');
      return;
    }
    const updated = [...contacts, { ...newContact, id: Date.now() }];
    saveContacts(updated);
    setNewContact({ name: '', phone: '', relationship: '', isPrimary: false });
    setShowAddForm(false);
    toast.success('Emergency contact added');
  };

  const handleDeleteContact = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    saveContacts(updated);
    toast.success('Contact removed');
  };


  const setPrimaryContact = (id) => {
    const updated = contacts.map(c => ({
      ...c,
      isPrimary: c.id === id
    }));
    saveContacts(updated);
    toast.success('Primary contact updated');
  };

  const callNumber = (number) => {
    window.location.href = `tel:${number}`;
  };

  const findNearbyHospitals = () => {
    setLoadingHospitals(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://www.google.com/maps/search/hospitals+near+me/@${latitude},${longitude},14z`;
          window.open(mapsUrl, '_blank');
          setLoadingHospitals(false);
        },
        () => {
          window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank');
          setLoadingHospitals(false);
        }
      );
    } else {
      window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank');
      setLoadingHospitals(false);
    }
  };

  const sendSOSAlert = () => {
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
    if (primaryContact) {
      const message = encodeURIComponent(
        `🚨 EMERGENCY SOS from HealthSync!\n\nYour contact needs immediate help. Please call them or emergency services immediately.`
      );
      window.open(`https://wa.me/${primaryContact.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
      toast.success('SOS alert sent to ' + primaryContact.name);
    } else {
      callNumber('112');
    }
  };

  return (
    <div className="emergency-contacts">
      {/* SOS Button */}
      <div className="sos-section">
        <button className="sos-button" onClick={sendSOSAlert}>
          <i className="fas fa-exclamation-circle"></i>
          <span>SOS Emergency</span>
        </button>
        <p className="sos-hint">Tap to alert your emergency contact</p>
      </div>

      {/* Quick Emergency Numbers */}
      <div className="emergency-section">
        <h3><i className="fas fa-phone-alt"></i> Emergency Helplines</h3>
        <div className="emergency-grid">
          {emergencyNumbers.map((item, index) => (
            <button
              key={index}
              className="emergency-number-btn"
              onClick={() => callNumber(item.number)}
              style={{ '--btn-color': item.color }}
            >
              <i className={`fas ${item.icon}`}></i>
              <span className="number">{item.number}</span>
              <span className="label">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Find Nearby Hospitals */}
      <div className="hospitals-section">
        <button 
          className="find-hospitals-btn"
          onClick={findNearbyHospitals}
          disabled={loadingHospitals}
        >
          {loadingHospitals ? (
            <><i className="fas fa-spinner fa-spin"></i> Finding...</>
          ) : (
            <><i className="fas fa-hospital"></i> Find Nearby Hospitals</>
          )}
        </button>
      </div>

      {/* Personal Emergency Contacts */}
      <div className="contacts-section">
        <div className="section-header">
          <h3><i className="fas fa-users"></i> My Emergency Contacts</h3>
          <button 
            className="add-contact-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
          </button>
        </div>

        {showAddForm && (
          <div className="add-contact-form">
            <input
              type="text"
              placeholder="Contact Name"
              value={newContact.name}
              onChange={(e) => setNewContact({...newContact, name: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={newContact.phone}
              onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
            />
            <select
              value={newContact.relationship}
              onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
            <button className="save-btn" onClick={handleAddContact}>
              <i className="fas fa-save"></i> Save Contact
            </button>
          </div>
        )}

        <div className="contacts-list">
          {contacts.length === 0 ? (
            <p className="no-contacts">No emergency contacts added yet</p>
          ) : (
            contacts.map(contact => (
              <div key={contact.id} className={`contact-card ${contact.isPrimary ? 'primary' : ''}`}>
                <div className="contact-info">
                  <h4>{contact.name} {contact.isPrimary && <span className="primary-badge">Primary</span>}</h4>
                  <p><i className="fas fa-phone"></i> {contact.phone}</p>
                  {contact.relationship && (
                    <p><i className="fas fa-heart"></i> {contact.relationship}</p>
                  )}
                </div>
                <div className="contact-actions">
                  <button onClick={() => callNumber(contact.phone)} title="Call">
                    <i className="fas fa-phone"></i>
                  </button>
                  {!contact.isPrimary && (
                    <button onClick={() => setPrimaryContact(contact.id)} title="Set as Primary">
                      <i className="fas fa-star"></i>
                    </button>
                  )}
                  <button onClick={() => handleDeleteContact(contact.id)} title="Delete" className="delete-btn">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
