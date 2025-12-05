import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const EmergencyContacts = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '', isPrimary: false });

  const emergencyNumbers = [
    { name: 'Ambulance', number: '102', icon: 'fa-ambulance', color: 'from-red-500 to-rose-600' },
    { name: 'Police', number: '100', icon: 'fa-shield-alt', color: 'from-blue-500 to-indigo-600' },
    { name: 'Fire', number: '101', icon: 'fa-fire', color: 'from-orange-500 to-amber-600' },
    { name: 'Women Helpline', number: '1091', icon: 'fa-female', color: 'from-pink-500 to-rose-600' },
    { name: 'Child Helpline', number: '1098', icon: 'fa-child', color: 'from-purple-500 to-violet-600' },
    { name: 'Emergency', number: '112', icon: 'fa-exclamation-triangle', color: 'from-red-600 to-red-700' }
  ];

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = () => {
    const saved = localStorage.getItem('emergency_contacts_' + userId);
    if (saved) setContacts(JSON.parse(saved));
  };

  const saveContacts = (newContacts) => {
    localStorage.setItem('emergency_contacts_' + userId, JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) { toast.error('Name and phone required'); return; }
    saveContacts([...contacts, { ...newContact, id: Date.now() }]);
    setNewContact({ name: '', phone: '', relationship: '', isPrimary: false });
    setShowAddForm(false);
    toast.success('Contact added');
  };

  const handleDeleteContact = (id) => { saveContacts(contacts.filter(c => c.id !== id)); toast.success('Removed'); };
  const setPrimaryContact = (id) => { saveContacts(contacts.map(c => ({ ...c, isPrimary: c.id === id }))); toast.success('Updated'); };
  const callNumber = (num) => { window.location.href = 'tel:' + num; };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Emergency Contacts</h2>
        <p className="text-red-100">Quick access to emergency services</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Emergency Helplines</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {emergencyNumbers.map((item, idx) => (
            <button key={idx} onClick={() => callNumber(item.number)} className="group flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:shadow-lg transition-all text-left">
              <div className={'w-12 h-12 rounded-xl bg-gradient-to-br ' + item.color + ' flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform'}>
                <i className={'fas ' + item.icon + ' text-white text-lg'}></i>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-lg font-bold text-red-600">{item.number}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Personal Contacts</h3>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg">Add Contact</button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Name *" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="tel" placeholder="Phone *" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddContact} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl">Save</button>
              <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl">Cancel</button>
            </div>
          </div>
        )}

        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <i className="fas fa-user-plus text-2xl text-slate-400"></i>
            </div>
            <p className="text-slate-500">No personal contacts added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className={'flex items-center gap-4 p-4 rounded-xl ' + (contact.isPrimary ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50')}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">{contact.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{contact.name}</h4>
                  <p className="text-sm text-slate-500">{contact.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => callNumber(contact.phone)} className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center"><i className="fas fa-phone"></i></button>
                  {!contact.isPrimary && <button onClick={() => setPrimaryContact(contact.id)} className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center"><i className="fas fa-star"></i></button>}
                  <button onClick={() => handleDeleteContact(contact.id)} className="w-10 h-10 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;
