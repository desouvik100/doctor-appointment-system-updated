import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const ComplianceSection = ({ clinicId }) => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('checklists');
  const [form, setForm] = useState({ checklistName: '', checklistType: 'nabh', version: '1.0' });

  const checklistTypes = ['nabh', 'jci', 'iso', 'hipaa', 'custom'];
  const gradeColors = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444', F: '#dc2626' };
  const statusColors = { draft: '#64748b', in_progress: '#3b82f6', completed: '#10b981', approved: '#059669' };

  useEffect(() => { fetchChecklists(); fetchSummary(); }, [clinicId]);

  const fetchChecklists = async () => {
    try {
      const res = await axios.get(`/api/compliance/checklists/clinic/${clinicId}`);
      setChecklists(res.data.checklists || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`/api/compliance/summary/${clinicId}`);
      setSummary(res.data.summary);
    } catch (err) { console.error(err); }
  };

  const createFromTemplate = async (type) => {
    try {
      const templateRes = await axios.get(`/api/compliance/templates/${type}`);
      const template = templateRes.data.template;
      await axios.post('/api/compliance/checklists', { ...template, clinicId });
      toast.success(`${type.toUpperCase()} checklist created`);
      fetchChecklists();
      setShowModal(false);
    } catch (err) { toast.error('Failed to create checklist'); }
  };

  const submitForReview = async (id) => {
    try {
      await axios.post(`/api/compliance/checklists/${id}/submit`);
      toast.success('Submitted for review');
      fetchChecklists();
    } catch (err) { toast.error('Failed to submit'); }
  };

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Checklists', value: summary.totalChecklists, color: '#6366f1', icon: 'clipboard-list' },
            { label: 'Avg Compliance', value: `${summary.avgCompliance}%`, color: summary.avgCompliance >= 80 ? '#10b981' : '#f59e0b', icon: 'chart-line' },
            { label: 'Certifications', value: summary.certifications?.length || 0, color: '#10b981', icon: 'certificate' },
            { label: 'Upcoming Audits', value: summary.upcomingAssessments?.length || 0, color: '#3b82f6', icon: 'calendar-check' }
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Compliance & Accreditation</h2>
              <p className="text-sm text-slate-500">NABH, JCI, ISO compliance tracking</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-plus mr-2"></i>New Checklist
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['checklists', 'certifications', 'standards'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>
          ))}
        </div>

        {/* Checklists Tab */}
        {activeTab === 'checklists' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map(checklist => (
              <div key={checklist._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium uppercase">{checklist.checklistType}</span>
                    <h3 className="font-semibold text-slate-800 mt-1">{checklist.checklistName}</h3>
                  </div>
                  {checklist.grade && (
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: gradeColors[checklist.grade] }}>{checklist.grade}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Compliance</span>
                    <span className="font-medium">{checklist.compliancePercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${checklist.compliancePercentage || 0}%`, background: checklist.compliancePercentage >= 80 ? '#10b981' : checklist.compliancePercentage >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[checklist.status]}15`, color: statusColors[checklist.status] }}>{checklist.status?.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-400">v{checklist.version}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setSelectedChecklist(checklist)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium">View</button>
                  {checklist.status === 'in_progress' && (
                    <button onClick={() => submitForReview(checklist._id)} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-sm font-medium">Submit</button>
                  )}
                </div>
              </div>
            ))}
            {checklists.length === 0 && <p className="col-span-full text-center py-8 text-slate-500">No checklists found. Create one from a template!</p>}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div>
            {summary?.certifications?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {summary.certifications.map((cert, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                      <i className="fas fa-certificate text-green-500 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 uppercase">{cert.type}</h4>
                      <p className="text-sm text-slate-500">#{cert.certificationNumber}</p>
                      <p className="text-xs text-slate-400">Expires: {new Date(cert.expiryDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <i className="fas fa-certificate text-4xl mb-4 text-slate-300"></i>
                <p>No certifications yet</p>
                <p className="text-sm">Complete compliance checklists to earn certifications</p>
              </div>
            )}
          </div>
        )}

        {/* Standards Tab */}
        {activeTab === 'standards' && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { type: 'nabh', name: 'NABH', desc: 'National Accreditation Board for Hospitals', icon: 'hospital', color: '#3b82f6' },
              { type: 'jci', name: 'JCI', desc: 'Joint Commission International', icon: 'globe', color: '#8b5cf6' },
              { type: 'iso', name: 'ISO 9001', desc: 'Quality Management System', icon: 'award', color: '#f59e0b' },
              { type: 'hipaa', name: 'HIPAA', desc: 'Health Insurance Portability', icon: 'lock', color: '#10b981' }
            ].map(std => (
              <div key={std.type} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${std.color}15` }}>
                    <i className={`fas fa-${std.icon}`} style={{ color: std.color }}></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{std.name}</h4>
                    <p className="text-xs text-slate-500">{std.desc}</p>
                  </div>
                </div>
                <button onClick={() => createFromTemplate(std.type)} className="w-full py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium">
                  <i className="fas fa-plus mr-2"></i>Create Checklist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Checklist Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Create Checklist</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">Choose a compliance standard to create a checklist from template:</p>
              <div className="space-y-2">
                {checklistTypes.map(type => (
                  <button key={type} onClick={() => createFromTemplate(type)} className="w-full py-3 px-4 border border-slate-200 rounded-xl text-left hover:bg-slate-50 flex items-center justify-between">
                    <span className="font-medium uppercase">{type}</span>
                    <i className="fas fa-chevron-right text-slate-400"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Details Modal */}
      {selectedChecklist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium uppercase">{selectedChecklist.checklistType}</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">{selectedChecklist.checklistName}</h3>
              </div>
              <button onClick={() => setSelectedChecklist(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Compliance Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-3">
                      <div className="h-3 rounded-full" style={{ width: `${selectedChecklist.compliancePercentage || 0}%`, background: selectedChecklist.compliancePercentage >= 80 ? '#10b981' : '#f59e0b' }}></div>
                    </div>
                    <span className="font-bold text-lg">{selectedChecklist.compliancePercentage || 0}%</span>
                  </div>
                </div>
                {selectedChecklist.grade && (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: gradeColors[selectedChecklist.grade] }}>{selectedChecklist.grade}</div>
                )}
              </div>
              <div className="space-y-4">
                {(selectedChecklist.categories || []).map((cat, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">{cat.categoryName}</h4>
                    <div className="space-y-2">
                      {(cat.items || []).map((item, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm">
                          <span className={`w-5 h-5 rounded flex items-center justify-center ${item.status === 'compliant' ? 'bg-green-100 text-green-600' : item.status === 'non_compliant' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                            <i className={`fas fa-${item.status === 'compliant' ? 'check' : item.status === 'non_compliant' ? 'times' : 'minus'}`}></i>
                          </span>
                          <span className="flex-1 text-slate-600">{item.requirement}</span>
                          <span className="text-xs text-slate-400">{item.standard}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceSection;
