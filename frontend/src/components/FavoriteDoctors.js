// frontend/src/components/FavoriteDoctors.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FavoriteDoctors.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const FavoriteDoctors = ({ userId, onBookAppointment }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/favorites/${userId}`);
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (doctorId) => {
    try {
      await axios.delete(`${API_URL}/favorites/${userId}/${doctorId}`);
      toast.success('Removed from favorites');
      setFavorites(favorites.filter(f => f._id !== doctorId));
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="spinner"></div>
        <p>Loading favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <i className="fas fa-heart"></i>
        <h3>No favorite doctors yet</h3>
        <p>Save your preferred doctors for quick booking</p>
      </div>
    );
  }

  return (
    <div className="favorite-doctors">
      <div className="favorites-header">
        <h3>
          <i className="fas fa-heart"></i>
          My Favorite Doctors
        </h3>
        <span className="favorites-count">{favorites.length} saved</span>
      </div>

      <div className="favorites-grid">
        {favorites.map(doctor => (
          <div key={doctor._id} className="favorite-card">
            <button 
              className="remove-favorite"
              onClick={() => handleRemoveFavorite(doctor._id)}
              title="Remove from favorites"
            >
              <i className="fas fa-heart"></i>
            </button>

            <div className="doctor-avatar">
              {doctor.profilePhoto ? (
                <img src={doctor.profilePhoto} alt={doctor.name} />
              ) : (
                <div className="avatar-placeholder">
                  {doctor.name?.charAt(0) || 'D'}
                </div>
              )}
            </div>

            <div className="doctor-info">
              <h4>Dr. {doctor.name}</h4>
              <p className="specialization">{doctor.specialization}</p>
              
              <div className="doctor-meta">
                {doctor.rating > 0 && (
                  <span className="rating">
                    <i className="fas fa-star"></i>
                    {doctor.rating.toFixed(1)}
                  </span>
                )}
                {doctor.experience > 0 && (
                  <span className="experience">
                    {doctor.experience} yrs exp
                  </span>
                )}
              </div>

              <div className="doctor-fee">
                <i className="fas fa-rupee-sign"></i>
                {doctor.consultationFee || 500}
              </div>
            </div>

            <button 
              className="book-btn"
              onClick={() => onBookAppointment && onBookAppointment(doctor)}
            >
              <i className="fas fa-calendar-plus"></i>
              Book Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Heart button component to add/remove favorites
export const FavoriteButton = ({ userId, doctorId, isFavorite, onToggle }) => {
  const [favorite, setFavorite] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!userId) {
      toast.error('Please login to save favorites');
      return;
    }

    try {
      setLoading(true);
      if (favorite) {
        await axios.delete(`${API_URL}/favorites/${userId}/${doctorId}`);
        toast.success('Removed from favorites');
      } else {
        await axios.post(`${API_URL}/favorites/${userId}`, { doctorId });
        toast.success('Added to favorites');
      }
      setFavorite(!favorite);
      onToggle && onToggle(!favorite);
    } catch (error) {
      toast.error('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className={`favorite-btn ${favorite ? 'active' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <i className={`${favorite ? 'fas' : 'far'} fa-heart`}></i>
    </button>
  );
};

export default FavoriteDoctors;
