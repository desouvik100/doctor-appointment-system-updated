import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './DoctorChat.css';

const DoctorChat = ({ user, doctor, appointmentId, onClose }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const userId = user?.id || user?._id;
  const doctorId = doctor?._id || doctor?.id;

  useEffect(() => {
    initializeChat();
  }, [userId, doctorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversation?._id) {
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/chat/conversation', {
        patientId: userId,
        doctorId: doctorId,
        appointmentId
      });
      setConversation(response.data);
      await fetchMessages(response.data._id);
      await markAsRead(response.data._id);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const id = convId || conversation?._id;
      if (!id) return;
      const response = await axios.get(`/api/chat/messages/${id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (convId) => {
    try {
      const id = convId || conversation?._id;
      if (!id) return;
      await axios.put(`/api/chat/messages/read/${id}/patient`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await axios.post('/api/chat/message', {
        conversationId: conversation._id,
        senderId: userId,
        senderType: 'patient',
        senderName: user.name,
        message: newMessage.trim()
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="doctor-chat">
        <div className="doctor-chat__loading">
          <div className="doctor-chat__spinner"></div>
          <p>Starting chat...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="doctor-chat">
      <div className="doctor-chat__header">
        <button className="doctor-chat__back" onClick={onClose}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="doctor-chat__doctor-info">
          <div className="doctor-chat__avatar">
            {doctor?.profilePhoto ? (
              <img src={doctor.profilePhoto} alt={doctor.name} />
            ) : (
              <i className="fas fa-user-md"></i>
            )}
            <span className="doctor-chat__status-dot"></span>
          </div>
          <div className="doctor-chat__details">
            <h3>Dr. {doctor?.name}</h3>
            <p>{doctor?.specialization}</p>
          </div>
        </div>
        <div className="doctor-chat__actions">
          <button className="doctor-chat__action-btn" title="Video Call">
            <i className="fas fa-video"></i>
          </button>
          <button className="doctor-chat__action-btn" title="Voice Call">
            <i className="fas fa-phone"></i>
          </button>
        </div>
      </div>

      <div className="doctor-chat__messages">
        {messages.length === 0 ? (
          <div className="doctor-chat__empty">
            <i className="fas fa-comments"></i>
            <p>Start a conversation with Dr. {doctor?.name}</p>
            <span>Messages are private and secure</span>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="doctor-chat__date-group">
              <div className="doctor-chat__date-divider">
                <span>{date}</span>
              </div>
              {msgs.map((msg) => (
                <div
                  key={msg._id}
                  className={`doctor-chat__message ${
                    msg.senderType === 'patient' ? 'doctor-chat__message--sent' : 'doctor-chat__message--received'
                  }`}
                >
                  <div className="doctor-chat__bubble">
                    <p>{msg.message}</p>
                    <span className="doctor-chat__time">
                      {formatTime(msg.createdAt)}
                      {msg.senderType === 'patient' && (
                        <i className={`fas fa-check${msg.isRead ? '-double' : ''}`}></i>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="doctor-chat__input-area" onSubmit={sendMessage}>
        <button type="button" className="doctor-chat__attach-btn" title="Attach file">
          <i className="fas fa-paperclip"></i>
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="doctor-chat__send-btn"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
};

export default DoctorChat;
