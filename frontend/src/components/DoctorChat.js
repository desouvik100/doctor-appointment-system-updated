import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

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

  useEffect(() => { initializeChat(); }, [userId, doctorId]);
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (conversation?._id) { const interval = setInterval(fetchMessages, 5000); return () => clearInterval(interval); } }, [conversation]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const initializeChat = async () => {
    try {
      setLoading(true);
      const r = await axios.post('/api/chat/conversation', { patientId: userId, doctorId, appointmentId });
      setConversation(r.data);
      await fetchMessages(r.data._id);
      await markAsRead(r.data._id);
    } catch { toast.error('Failed to start chat'); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId) => { try { const id = convId || conversation?._id; if (!id) return; const r = await axios.get(`/api/chat/messages/${id}`); setMessages(r.data); } catch {} };
  const markAsRead = async (convId) => { try { const id = convId || conversation?._id; if (!id) return; await axios.put(`/api/chat/messages/read/${id}/patient`); } catch {} };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const r = await axios.post('/api/chat/message', { conversationId: conversation._id, senderId: userId, senderType: 'patient', senderName: user.name, message: newMessage.trim() });
      setMessages([...messages, r.data]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
    messages.forEach(msg => { const date = formatDate(msg.createdAt); if (!groups[date]) groups[date] = []; groups[date].push(msg); });
    return groups;
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500">Starting chat...</p>
    </div>
  );

  const messageGroups = groupMessagesByDate();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 flex items-center gap-4">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
              {doctor?.profilePhoto ? <img src={doctor.profilePhoto} alt={doctor.name} className="w-full h-full object-cover" /> : <i className="fas fa-user-md text-white text-xl"></i>}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full"></span>
          </div>
          <div>
            <h3 className="text-white font-bold">Dr. {doctor?.name}</h3>
            <p className="text-indigo-100 text-sm">{doctor?.specialization}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors" title="Video Call">
            <i className="fas fa-video"></i>
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors" title="Voice Call">
            <i className="fas fa-phone"></i>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <i className="fas fa-comments text-2xl text-indigo-500"></i>
            </div>
            <p className="text-slate-600 font-medium">Start a conversation with Dr. {doctor?.name}</p>
            <p className="text-sm text-slate-400">Messages are private and secure</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-medium rounded-full">{date}</span>
              </div>
              {msgs.map((msg) => (
                <div key={msg._id} className={`flex ${msg.senderType === 'patient' ? 'justify-end' : 'justify-start'} mb-3`}>
                  <div className={`max-w-[75%] ${msg.senderType === 'patient' ? 'order-1' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 ${msg.senderType === 'patient' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'}`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-slate-400 ${msg.senderType === 'patient' ? 'justify-end' : ''}`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {msg.senderType === 'patient' && <i className={`fas fa-check${msg.isRead ? '-double text-indigo-500' : ''}`}></i>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
        <button type="button" className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors" title="Attach file">
          <i className="fas fa-paperclip"></i>
        </button>
        <input ref={inputRef} type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" disabled={!newMessage.trim() || sending}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${newMessage.trim() && !sending ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
          {sending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
};

export default DoctorChat;
