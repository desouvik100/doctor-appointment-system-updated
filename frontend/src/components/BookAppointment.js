import React, { useState } from "react";
import axios from "axios";

function BookAppointment({ doctor, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const appointmentData = {
        doctorId: doctor._id,
        userId: user.id,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        clinicId: doctor.clinicId
      };

      await axios.post("/api/appointments", appointmentData);
      onSuccess();
      alert("Appointment booked successfully!");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-calendar-plus me-2"></i>
              Book Appointment
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="mb-2">
                <i className="fas fa-user-md me-2"></i>
                Dr. {doctor.name}
              </h6>
              <p className="mb-1 small text-muted">
                <i className="fas fa-stethoscope me-1"></i>
                {doctor.specialization}
              </p>
              <p className="mb-0 small text-muted">
                <i className="fas fa-envelope me-1"></i>
                {doctor.email}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-calendar me-1"></i>
                  Appointment Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-clock me-1"></i>
                  Appointment Time
                </label>
                <select
                  className="form-select"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="09:30">09:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="16:30">04:30 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-notes-medical me-1"></i>
                  Reason for Visit
                </label>
                <textarea
                  className="form-control"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe your symptoms or reason for the appointment..."
                  required
                ></textarea>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  {error}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary flex-fill"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-fill"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Booking...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookAppointment;