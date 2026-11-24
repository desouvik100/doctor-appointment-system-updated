import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const FamilyMembers = ({ userId }) => {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', relationship: 'spouse', dateOfBirth: '', gender: 'male', bloodGroup: '', phone: '', allergies: '', chronicConditions: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchMembers(); }, [userId]);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`/api/family/user/${userId}`);
      setMembers(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        primaryUserId: userId,
        allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(c => c.trim()) : []
      };
      
      if (editingId) {
        await axios.put(`/api/family/${editingId}`, data);
        toast.success('Member updated');
      } else {
        await axios.post('/api/family', data);
        toast.success('Family member added');
      }
      setShowModal(false);
      setForm({ name: '', relationship: 'spouse', dateOfBirth: '', gender: 'male', bloodGroup: '', phone: '', allergies: '', chronicConditions: '' });
      setEditingId(null);
      fetchMembers();
    } catch (e) { toast.error('Failed to save'); }
  };

  const handleEdit = (member) => {
    setForm({
      name: member.name,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth?.split('T')[0] || '',
      gender: member.gender || 'male',
      bloodGroup: member.bloodGroup || '',
      phone: member.phone || '',
      allergies: member.allergies?.join(', ') || '',
      chronicConditions: member.chronicConditions?.join(', ') || ''
    });
    setEditingId(member._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this family member?')) return;
    try {
      await axios.delete(`/api/family/${id}`);
      toast.success('Removed');
      fetchMembers();
    } catch (e) { toast.error('Failed'); }
  };

  const relationshipIcons = { spouse: '💑', child: '👶', parent: '👨‍👩‍👧', sibling: '👫', grandparent: '👴', other: '👤' };

  if (loading) return <div className="text-center py-8"><i className="fas fa-spinner fa-spin text-2xl text-indigo-500"></i></div>;

  return (
    <div className="family-members">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800"><i className="fas fa-users mr-2 text-indigo-500"></i>Family Members</h2>
        <button onClick={() => { setEditingId(null); setForm({ name: '', relationship: 'spouse', dateOfBirth: '', gender: 'male', bloodGroup: '', phone: '', allergies: '', chronicConditions: '' }); setShowModal(true); }} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
          <i className="fas fa-plus mr-2"></i>Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <i className="fas fa-user-friends text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500">No family members added yet</p>
          <p className="text-sm text-slate-400">Add family members to book appointments for them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member._id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
                    {relationshipIcons[member.relationship] || '👤'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{member.name}</h3>
                    <span className="text-sm text-slate-500 capitalize">{member.relationship}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-indigo-500"><i className="fas fa-edit"></i></button>
                  <button onClick={() => handleDelete(member._id)} className="p-2 text-slate-400 hover:text-red-500"><i className="fas fa-trash"></i></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {member.dateOfBirth && <p className="text-slate-600"><i className="fas fa-birthday-cake w-5 text-slate-400"></i>{new Date(member.dateOfBirth).toLocaleDateString()}</p>}
                {member.bloodGroup && <p className="text-slate-600"><i className="fas fa-tint w-5 text-red-400"></i>{member.bloodGroup}</p>}
                {member.phone && <p className="text-slate-600"><i className="fas fa-phone w-5 text-slate-400"></i>{member.phone}</p>}
                {member.allergies?.length > 0 && <p className="text-orange-600"><i className="fas fa-exclamation-triangle w-5"></i>Allergies: {member.allergies.join(', ')}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">{editingId ? 'Edit' : 'Add'} Family Member</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Relationship *</label>
                  <select value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                  <select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="">Select</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allergies (comma separated)</label>
                <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="e.g., Penicillin, Peanuts" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chronic Conditions (comma separated)</label>
                <input type="text" value={form.chronicConditions} onChange={e => setForm({...form, chronicConditions: e.target.value})} placeholder="e.g., Diabetes, Hypertension" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">{editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMembers;
