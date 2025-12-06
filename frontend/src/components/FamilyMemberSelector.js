// frontend/src/components/FamilyMemberSelector.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FamilyMemberSelector.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const FamilyMemberSelector = ({ userId, onSelect, selectedMember }) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'spouse',
    age: '',
    gender: 'male',
    phone: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: ''
  });

  useEffect(() => {
    fetchFamilyMembers();
  }, [userId]);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/family/${userId}`);
      setFamilyMembers(response.data.familyMembers || []);
    } catch (error) {
      console.error('Failed to fetch family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter member name');
      return;
    }

    try {
      const memberData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(c => c.trim()) : []
      };

      await axios.post(`${API_URL}/family/${userId}`, memberData);
      toast.success('Family member added!');
      setShowAddForm(false);
      setFormData({
        name: '',
        relationship: 'spouse',
        age: '',
        gender: 'male',
        phone: '',
        bloodGroup: '',
        allergies: '',
        chronicConditions: ''
      });
      fetchFamilyMembers();
    } catch (error) {
      toast.error('Failed to add family member');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Remove this family member?')) return;

    try {
      await axios.delete(`${API_URL}/family/${userId}/${memberId}`);
      toast.success('Family member removed');
      fetchFamilyMembers();
      if (selectedMember?._id === memberId) {
        onSelect(null);
      }
    } catch (error) {
      toast.error('Failed to remove family member');
    }
  };

  const getRelationshipIcon = (relationship) => {
    const icons = {
      spouse: '💑',
      child: '👶',
      parent: '👨‍👩‍👧',
      sibling: '👫',
      other: '👤'
    };
    return icons[relationship] || '👤';
  };

  return (
    <div className="family-selector">
      <div className="family-selector-header">
        <h4>
          <i className="fas fa-users"></i>
          Book for Family Member
        </h4>
      </div>

      <div className="booking-for-options">
        <button 
          className={`booking-option ${!selectedMember ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          <i className="fas fa-user"></i>
          <span>Myself</span>
        </button>
        
        {loading ? (
          <div className="loading-members">Loading...</div>
        ) : (
          familyMembers.map(member => (
            <button 
              key={member._id}
              className={`booking-option ${selectedMember?._id === member._id ? 'active' : ''}`}
              onClick={() => onSelect(member)}
            >
              <span className="member-icon">{getRelationshipIcon(member.relationship)}</span>
              <div className="member-details">
                <span className="member-name">{member.name}</span>
                <span className="member-relation">{member.relationship}</span>
              </div>
              <button 
                className="delete-member"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMember(member._id);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </button>
          ))
        )}

        <button 
          className="add-member-btn"
          onClick={() => setShowAddForm(true)}
        >
          <i className="fas fa-plus"></i>
          <span>Add Family Member</span>
        </button>
      </div>

      {showAddForm && (
        <div className="add-member-modal">
          <div className="add-member-content">
            <div className="add-member-header">
              <h4>Add Family Member</h4>
              <button onClick={() => setShowAddForm(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Relationship *</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  >
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age"
                    min="0"
                    max="120"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Allergies (comma separated)</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g., Penicillin, Peanuts"
                />
              </div>

              <div className="form-group">
                <label>Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  value={formData.chronicConditions}
                  onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                  placeholder="e.g., Diabetes, Hypertension"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-plus"></i> Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberSelector;
