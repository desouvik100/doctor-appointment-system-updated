import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './FamilyMembers.css';

const FamilyMembers = ({ userId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    age: '',
    gender: '',
    phone: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: ''
  });

  useEffect(() => {
    fetchMembers();
  }, [userId]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`/api/family/${userId}`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship) {
      toast.error('Name and relationship are required');
      return;
    }

    try {
      const data = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(c => c.trim()) : []
      };

      if (editingMember) {
        await axios.put(`/api/family/${userId}/${editingMember._id}`, data);
        toast.success('Family member updated');
      } else {
        await axios.post(`/api/family/${userId}`, data);
        toast.success('Family member added');
      }

      fetchMembers();
      resetForm();
    } catch (error) {
      toast.error('Failed to save family member');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Remove this family member?')) return;

    try {
      await axios.delete(`/api/family/${userId}/${memberId}`);
      toast.success('Family member removed');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to remove family member');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      age: member.age || '',
      gender: member.gender || '',
      phone: member.phone || '',
      bloodGroup: member.bloodGroup || '',
      allergies: member.allergies?.join(', ') || '',
      chronicConditions: member.chronicConditions?.join(', ') || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', relationship: '', age: '', gender: '',
      phone: '', bloodGroup: '', allergies: '', chronicConditions: ''
    });
    setEditingMember(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="family-members__loading"><i className="fas fa-spinner fa-spin"></i></div>;
  }

  return (
    <div className="family-members">
      <div className="family-members__header">
        <h3><i className="fas fa-users"></i> Family Members</h3>
        <button className="family-members__add-btn" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> Add Member
        </button>
      </div>

      {showForm && (
        <form className="family-members__form" onSubmit={handleSubmit}>
          <h4>{editingMember ? 'Edit Member' : 'Add Family Member'}</h4>
          <div className="family-members__form-grid">
            <input
              type="text"
              placeholder="Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({...formData, relationship: e.target.value})}
              required
            >
              <option value="">Relationship *</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
            <select
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
            >
              <option value="">Blood Group</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Allergies (comma separated)"
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              className="family-members__full-width"
            />
            <input
              type="text"
              placeholder="Chronic conditions (comma separated)"
              value={formData.chronicConditions}
              onChange={(e) => setFormData({...formData, chronicConditions: e.target.value})}
              className="family-members__full-width"
            />
          </div>
          <div className="family-members__form-actions">
            <button type="button" onClick={resetForm}>Cancel</button>
            <button type="submit">{editingMember ? 'Update' : 'Add'}</button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="family-members__empty">
          <i className="fas fa-user-friends"></i>
          <p>No family members added yet</p>
          <span>Add family members to book appointments for them</span>
        </div>
      ) : (
        <div className="family-members__list">
          {members.map((member) => (
            <div key={member._id} className="family-members__card">
              <div className="family-members__avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="family-members__info">
                <h4>{member.name}</h4>
                <span className="family-members__relationship">{member.relationship}</span>
                <div className="family-members__details">
                  {member.age && <span><i className="fas fa-birthday-cake"></i> {member.age} yrs</span>}
                  {member.bloodGroup && <span><i className="fas fa-tint"></i> {member.bloodGroup}</span>}
                  {member.phone && <span><i className="fas fa-phone"></i> {member.phone}</span>}
                </div>
              </div>
              <div className="family-members__actions">
                <button onClick={() => handleEdit(member)} title="Edit">
                  <i className="fas fa-edit"></i>
                </button>
                <button onClick={() => handleDelete(member._id)} title="Delete">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyMembers;
