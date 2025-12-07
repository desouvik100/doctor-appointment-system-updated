// Admin Email Sender Component
import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const AdminEmailSender = () => {
  const [recipients, setRecipients] = useState({ doctors: [], patients: [], staff: [] });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Form state
  const [emailType, setEmailType] = useState('single'); // single or bulk
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bulkType, setBulkType] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/email/recipients');
      if (response.data.success) {
        setRecipients(response.data.recipients);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    try {
      setSending(true);

      if (emailType === 'single') {
        const email = customEmail || selectedRecipient;
        if (!email) {
          toast.error('Please select a recipient or enter an email');
          return;
        }

        const response = await axios.post('/api/admin/email/send', {
          recipientEmail: email,
          recipientName: recipientName || 'User',
          subject,
          message
        });

        if (response.data.success) {
          toast.success(`Email sent to ${email}`);
          resetForm();
        }
      } else {
        const response = await axios.post('/api/admin/email/send-bulk', {
          recipientType: bulkType,
          subject,
          message
        });

        if (response.data.success) {
          toast.success(`Bulk email sent! ${response.data.stats.sent} delivered, ${response.data.stats.failed} failed`);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSelectedRecipient('');
    setCustomEmail('');
    setRecipientName('');
    setSubject('');
    setMessage('');
  };

  const allRecipients = [
    ...recipients.doctors,
    ...recipients.patients,
    ...recipients.staff
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <i className="fas fa-envelope text-white text-xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Email</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Send custom messages to users</p>
        </div>
      </div>

      <form onSubmit={handleSendEmail} className="space-y-5">
        {/* Email Type Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            type="button"
            onClick={() => setEmailType('single')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              emailType === 'single'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <i className="fas fa-user mr-2"></i>
            Single Recipient
          </button>
          <button
            type="button"
            onClick={() => setEmailType('bulk')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              emailType === 'bulk'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <i className="fas fa-users mr-2"></i>
            Bulk Email
          </button>
        </div>

        {emailType === 'single' ? (
          <>
            {/* Select from list or custom email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Recipient
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => {
                  setSelectedRecipient(e.target.value);
                  const recipient = allRecipients.find(r => r.email === e.target.value);
                  if (recipient) setRecipientName(recipient.name);
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select from list --</option>
                <optgroup label="👨‍⚕️ Doctors">
                  {recipients.doctors.map(d => (
                    <option key={d.id} value={d.email}>{d.name} ({d.email})</option>
                  ))}
                </optgroup>
                <optgroup label="👤 Patients">
                  {recipients.patients.map(p => (
                    <option key={p.id} value={p.email}>{p.name} ({p.email})</option>
                  ))}
                </optgroup>
                <optgroup label="👥 Staff">
                  {recipients.staff.map(s => (
                    <option key={s.id} value={s.email}>{s.name} ({s.email})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="text-center text-gray-500 dark:text-gray-400 text-sm">— OR —</div>

            {/* Custom Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Email
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </>
        ) : (
          /* Bulk Email Type */
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Send To
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'all', label: 'All Users', icon: 'fa-globe', count: allRecipients.length },
                { value: 'doctors', label: 'Doctors', icon: 'fa-user-md', count: recipients.doctors.length },
                { value: 'patients', label: 'Patients', icon: 'fa-user', count: recipients.patients.length },
                { value: 'staff', label: 'Staff', icon: 'fa-users-cog', count: recipients.staff.length }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBulkType(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    bulkType === option.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <i className={`fas ${option.icon} text-2xl mb-2 ${bulkType === option.value ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                  <p className={`font-medium ${bulkType === option.value ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500">{option.count} recipients</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={6}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Quick Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '📢 Announcement', subject: 'Important Announcement', message: 'Dear User,\n\nWe have an important announcement to share with you.\n\n[Your message here]\n\nThank you for being part of HealthSync.\n\nBest regards,\nHealthSync Team' },
              { label: '🔧 Maintenance', subject: 'Scheduled Maintenance Notice', message: 'Dear User,\n\nWe will be performing scheduled maintenance on our platform.\n\nDate: [Date]\nTime: [Time]\nDuration: [Duration]\n\nDuring this time, some services may be temporarily unavailable.\n\nWe apologize for any inconvenience.\n\nBest regards,\nHealthSync Team' },
              { label: '🎉 Promotion', subject: 'Special Offer for You!', message: 'Dear User,\n\nWe have an exciting offer just for you!\n\n[Offer details]\n\nDon\'t miss out on this limited-time opportunity.\n\nBest regards,\nHealthSync Team' },
              { label: '📋 Reminder', subject: 'Friendly Reminder', message: 'Dear User,\n\nThis is a friendly reminder about [topic].\n\n[Details]\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\nHealthSync Team' }
            ].map((template, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSubject(template.subject);
                  setMessage(template.message);
                }}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={sending}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Sending...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i>
              {emailType === 'single' ? 'Send Email' : `Send to ${bulkType === 'all' ? 'All' : bulkType}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminEmailSender;
