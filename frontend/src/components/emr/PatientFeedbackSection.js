import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const PatientFeedbackSection = ({ clinicId }) => {
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filter, setFilter] = useState({ feedbackType: '', isComplaint: '' });
  const [responseText, setResponseText] = useState('');

  const feedbackTypes = ['consultation', 'service', 'facility', 'staff', 'billing', 'general'];
  const npsColors = { promoter: '#10b981', passive: '#f59e0b', detractor: '#ef4444' };

  useEffect(() => { fetchFeedback(); fetchAnalytics(); }, [clinicId, filter]);

  const fetchFeedback = async () => {
    try {
      const params = new URLSearchParams(filter);
      const res = await axios.get(`/api/feedback/clinic/${clinicId}?${params}`);
      setFeedback(res.data.feedback || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`/api/feedback/analytics/${clinicId}`);
      setAnalytics(res.data.analytics);
    } catch (err) { console.error(err); }
  };

  const handleRespond = async (id) => {
    if (!responseText.trim()) { toast.error('Enter a response'); return; }
    try {
      await axios.post(`/api/feedback/${id}/respond`, { responseText });
      toast.success('Response sent');
      setSelectedFeedback(null);
      setResponseText('');
      fetchFeedback();
    } catch (err) { toast.error('Failed to send response'); }
  };

  const handleResolve = async (id) => {
    try {
      await axios.post(`/api/feedback/${id}/resolve`, { resolution: 'Resolved by staff' });
      toast.success('Complaint resolved');
      fetchFeedback();
    } catch (err) { toast.error('Failed to resolve'); }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i key={i} className={`fas fa-star ${i < rating ? 'text-amber-400' : 'text-slate-200'}`}></i>
    ));
  };

  const getNPSColor = (score) => score >= 50 ? '#10b981' : score >= 0 ? '#f59e0b' : '#ef4444';

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* NPS & Stats */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 col-span-2 md:col-span-1">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">NPS Score</p>
              <p className="text-4xl font-bold" style={{ color: getNPSColor(analytics.nps?.score || 0) }}>{analytics.nps?.score || 0}</p>
              <p className="text-xs text-slate-400 mt-1">{analytics.nps?.total || 0} responses</p>
            </div>
          </div>
          {[
            { label: 'Avg Rating', value: (analytics.ratings?.avgOverall || 0).toFixed(1), color: '#f59e0b', icon: 'star' },
            { label: 'Total Feedback', value: analytics.ratings?.totalFeedback || 0, color: '#3b82f6', icon: 'comments' },
            { label: 'Promoters', value: analytics.nps?.distribution?.find(d => d._id === 'promoter')?.count || 0, color: '#10b981', icon: 'smile' },
            { label: 'Complaints', value: analytics.complaints?.reduce((s, c) => s + c.count, 0) || 0, color: '#ef4444', icon: 'exclamation-circle' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <i className={`fas fa-${stat.icon}`} style={{ color: stat.color }}></i>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <i className="fas fa-comment-dots text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Patient Feedback & NPS</h2>
              <p className="text-sm text-slate-500">Monitor satisfaction and resolve complaints</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['overview', 'feedback', 'complaints', 'analytics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-pink-50 text-pink-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* NPS Distribution */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-4">NPS Distribution</h3>
              <div className="space-y-3">
                {['promoter', 'passive', 'detractor'].map(cat => {
                  const count = analytics.nps?.distribution?.find(d => d._id === cat)?.count || 0;
                  const total = analytics.nps?.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-slate-600">{cat}s</span>
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: npsColors[cat] }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-4">Rating Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Overall', value: analytics.ratings?.avgOverall },
                  { label: 'Doctor Behavior', value: analytics.ratings?.avgDoctorBehavior },
                  { label: 'Staff Behavior', value: analytics.ratings?.avgStaffBehavior },
                  { label: 'Wait Time', value: analytics.ratings?.avgWaitTime },
                  { label: 'Cleanliness', value: analytics.ratings?.avgCleanliness }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(Math.round(item.value || 0))}</div>
                      <span className="text-sm font-medium w-8">{(item.value || 0).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div>
            <div className="flex gap-3 mb-4">
              <select value={filter.feedbackType} onChange={e => setFilter({...filter, feedbackType: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-xl">
                <option value="">All Types</option>
                {feedbackTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              {feedback.map(fb => (
                <div key={fb._id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-800">{fb.patientId?.name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500">{new Date(fb.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(fb.ratings?.overall || 0)}</div>
                      {fb.isComplaint && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">Complaint</span>}
                    </div>
                  </div>
                  {fb.comments && <p className="text-slate-600 text-sm mb-3">{fb.comments}</p>}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs capitalize">{fb.feedbackType}</span>
                    <button onClick={() => setSelectedFeedback(fb)} className="text-sm text-pink-600 hover:underline">
                      {fb.responseGiven ? 'View Response' : 'Respond'}
                    </button>
                  </div>
                </div>
              ))}
              {feedback.length === 0 && <p className="text-center py-8 text-slate-500">No feedback found</p>}
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {feedback.filter(f => f.isComplaint).map(fb => (
              <div key={fb._id} className="border border-red-200 rounded-xl p-4 bg-red-50/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-800">{fb.patientId?.name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-500">{new Date(fb.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${fb.complaintStatus === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {fb.complaintStatus || 'open'}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-3">{fb.comments}</p>
                {fb.complaintStatus !== 'resolved' && (
                  <button onClick={() => handleResolve(fb._id)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                    <i className="fas fa-check mr-2"></i>Mark Resolved
                  </button>
                )}
              </div>
            ))}
            {feedback.filter(f => f.isComplaint).length === 0 && <p className="text-center py-8 text-slate-500">No complaints</p>}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics?.trend && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Monthly Trend</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Month</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Responses</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Avg Rating</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Avg NPS</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.trend.map((t, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-800">{t._id}</td>
                      <td className="py-3 px-4 text-slate-600">{t.count}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(Math.round(t.avgRating || 0))}</div>
                          <span className="text-sm">{(t.avgRating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: getNPSColor(t.npsAvg || 0) }}>{Math.round(t.npsAvg || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Feedback Details</h3>
              <button onClick={() => { setSelectedFeedback(null); setResponseText(''); }} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{selectedFeedback.patientId?.name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500">{new Date(selectedFeedback.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex">{renderStars(selectedFeedback.ratings?.overall || 0)}</div>
              </div>
              
              {selectedFeedback.comments && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600">{selectedFeedback.comments}</p>
                </div>
              )}

              {selectedFeedback.responseGiven ? (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Your Response</p>
                  <p className="text-sm text-slate-600">{selectedFeedback.responseText}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Response</label>
                  <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={3} placeholder="Thank you for your feedback..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"></textarea>
                  <button onClick={() => handleRespond(selectedFeedback._id)} className="mt-3 w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-medium rounded-xl hover:shadow-lg">
                    Send Response
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientFeedbackSection;
