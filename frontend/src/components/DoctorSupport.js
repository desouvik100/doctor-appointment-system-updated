import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './DoctorSupport.css';

const DoctorSupport = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'tickets'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // New ticket form
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'other',
    priority: 'medium'
  });

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/support/my-tickets');
      if (response.data.success) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/support/ticket', formData);
      
      if (response.data.success) {
        toast.success('Support ticket submitted successfully!');
        setFormData({ subject: '', message: '', category: 'other', priority: 'medium' });
        setActiveTab('tickets');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/support/ticket/${ticketId}`);
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/support/ticket/${selectedTicket._id}/reply`, {
        message: replyMessage
      });
      
      if (response.data.success) {
        toast.success('Reply sent successfully');
        setReplyMessage('');
        handleViewTicket(selectedTicket._id);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#ffc107';
      case 'in_progress': return '#17a2b8';
      case 'resolved': return '#28a745';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="doctor-support-overlay" onClick={onClose}>
      <div className="doctor-support-modal" onClick={e => e.stopPropagation()}>
        <div className="support-header">
          <h2><i className="fas fa-headset"></i> Contact Admin Support</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="support-tabs">
          <button 
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => { setActiveTab('new'); setSelectedTicket(null); }}
          >
            <i className="fas fa-plus-circle"></i> New Ticket
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <i className="fas fa-ticket-alt"></i> My Tickets
          </button>
        </div>

        <div className="support-content">
          {/* New Ticket Form */}
          {activeTab === 'new' && (
            <form onSubmit={handleSubmit} className="ticket-form">
              <div className="form-group">
                <label><i className="fas fa-tag"></i> Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="technical">Technical Issue</option>
                  <option value="payment">Payment Issue</option>
                  <option value="account">Account Issue</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label><i className="fas fa-exclamation-triangle"></i> Priority</label>
                <div className="priority-options">
                  {['low', 'medium', 'high', 'urgent'].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`priority-btn ${formData.priority === p ? 'selected' : ''} ${p}`}
                      onClick={() => setFormData({...formData, priority: p})}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-heading"></i> Subject *</label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-group">
                <label><i className="fas fa-comment-alt"></i> Message *</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={5}
                  maxLength={2000}
                  required
                />
                <span className="char-count">{formData.message.length}/2000</span>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Submit Ticket</>
                )}
              </button>
            </form>
          )}

          {/* Tickets List */}
          {activeTab === 'tickets' && !selectedTicket && (
            <div className="tickets-list">
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-ticket-alt"></i>
                  <p>No support tickets yet</p>
                  <button onClick={() => setActiveTab('new')}>Create your first ticket</button>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div 
                    key={ticket._id} 
                    className="ticket-card"
                    onClick={() => handleViewTicket(ticket._id)}
                  >
                    <div className="ticket-header">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <h4>{ticket.subject}</h4>
                    <p className="ticket-meta">
                      <span><i className="fas fa-folder"></i> {ticket.category}</span>
                      <span><i className="fas fa-clock"></i> {formatDate(ticket.createdAt)}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Ticket Detail View */}
          {selectedTicket && (
            <div className="ticket-detail">
              <button className="back-btn" onClick={() => setSelectedTicket(null)}>
                <i className="fas fa-arrow-left"></i> Back to Tickets
              </button>

              <div className="ticket-info">
                <h3>{selectedTicket.subject}</h3>
                <div className="ticket-badges">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedTicket.status) }}
                  >
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedTicket.priority) }}
                  >
                    {selectedTicket.priority}
                  </span>
                  <span className="category-badge">
                    <i className="fas fa-folder"></i> {selectedTicket.category}
                  </span>
                </div>
                <p className="created-at">Created: {formatDate(selectedTicket.createdAt)}</p>
              </div>

              <div className="messages-thread">
                {selectedTicket.messages?.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`message ${msg.sender === 'admin' ? 'admin-msg' : 'doctor-msg'}`}
                  >
                    <div className="message-header">
                      <span className="sender">
                        {msg.sender === 'admin' ? (
                          <><i className="fas fa-user-shield"></i> Admin</>
                        ) : (
                          <><i className="fas fa-user-md"></i> You</>
                        )}
                      </span>
                      <span className="time">{formatDate(msg.timestamp)}</span>
                    </div>
                    <p className="message-content">{msg.message}</p>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'closed' && (
                <div className="reply-section">
                  <textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                  />
                  <button 
                    className="reply-btn" 
                    onClick={handleReply}
                    disabled={loading || !replyMessage.trim()}
                  >
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                    ) : (
                      <><i className="fas fa-reply"></i> Send Reply</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorSupport;
