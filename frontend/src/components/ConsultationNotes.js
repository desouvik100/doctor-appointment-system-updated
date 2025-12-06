import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const ConsultationNotes = ({ doctorId, patientId, appointmentId, patientName }) => {
  const [notes, setNotes] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ privateNotes: '', symptoms: '', diagnosis: '', treatmentPlan: '' });
  const [flagForm, setFlagForm] = useState({ type: 'important', note: '' });

  useEffect(() => { fetchData(); }, [doctorId, patientId]);

  const fetchData = async () => {
    try {
      const [notesRes, flagsRes] = await Promise.all([
        axios.get(`/api/consultation-notes/patient/${patientId}/doctor/${doctorId}`),
        axios.get(`/api/consultation-notes/flags/${patientId}/doctor/${doctorId}`)
      ]);
      setNotes(notesRes.data);
      setFlags(flagsRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/consultation-notes', {
        ...noteForm,
        doctorId,
        patientId,
        appointmentId,
        symptoms: noteForm.symptoms ? noteForm.symptoms.split(',').map(s => s.trim()) : []
      });
      toast.success('Notes saved');
      setShowNoteModal(false);
      fetchData();
    } catch (e) { toast.error('Failed to save'); }
  };

  const handleAddFlag = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/consultation-notes/flag/${patientId}`, { ...flagForm, doctorId });
      toast.success('Flag added');
      setShowFlagModal(false);
      setFlagForm({ type: 'important', note: '' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const flagColors = {
    allergy: 'bg-red-100 text-red-700 border-red-200',
    chronic: 'bg-purple-100 text-purple-700 border-purple-200',
    important: 'bg-amber-100 text-amber-700 border-amber-200',
    followup: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-orange-100 text-orange-700 border-orange-200'
  };

  const flagIcons = { allergy: 'fa-allergies', chronic: 'fa-heartbeat', important: 'fa-star', followup: 'fa-calendar-check', warning: 'fa-exclamation-triangle' };

  if (loading) return <div className="animate-pulse bg-slate-100 rounded-xl h-32"></div>;

  return (
    <div className="consultation-notes">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800">
          <i className="fas fa-notes-medical mr-2 text-indigo-500"></i>
          Notes for {patientName}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowFlagModal(true)} className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">
            <i className="fas fa-flag mr-1"></i>Add Flag
          </button>
          <button onClick={() => setShowNoteModal(true)} className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600">
            <i className="fas fa-plus mr-1"></i>Add Note
          </button>
        </div>
      </div>

      {/* Patient Flags */}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {flags.map((flag, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2 ${flagColors[flag.type]}`}>
              <i className={`fas ${flagIcons[flag.type]}`}></i>
              <span className="capitalize">{flag.type}</span>
              {flag.note && <span className="opacity-75">- {flag.note}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Notes History */}
      {notes.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <i className="fas fa-clipboard text-3xl text-slate-300 mb-2"></i>
          <p className="text-slate-500">No consultation notes yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.map(note => (
            <div key={note._id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">
                  {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {note.isImportant && <span className="text-amber-500"><i className="fas fa-star"></i></span>}
              </div>
              {note.diagnosis && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-slate-500">Diagnosis:</span>
                  <p className="text-slate-800">{note.diagnosis}</p>
                </div>
              )}
              {note.symptoms?.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-slate-500">Symptoms:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {note.symptoms.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {note.privateNotes && (
                <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                  <span className="text-xs font-medium text-yellow-700"><i className="fas fa-lock mr-1"></i>Private Note:</span>
                  <p className="text-sm text-yellow-800 mt-1">{note.privateNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Add Consultation Note</h3>
            </div>
            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms (comma separated)</label>
                <input type="text" value={noteForm.symptoms} onChange={e => setNoteForm({...noteForm, symptoms: e.target.value})} placeholder="e.g., Fever, Headache, Cough" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                <input type="text" value={noteForm.diagnosis} onChange={e => setNoteForm({...noteForm, diagnosis: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Plan</label>
                <textarea value={noteForm.treatmentPlan} onChange={e => setNoteForm({...noteForm, treatmentPlan: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <i className="fas fa-lock mr-1 text-amber-500"></i>Private Notes (only you can see)
                </label>
                <textarea value={noteForm.privateNotes} onChange={e => setNoteForm({...noteForm, privateNotes: e.target.value})} rows={3} placeholder="Personal observations, reminders..." className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNoteModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Add Patient Flag</h3>
            </div>
            <form onSubmit={handleAddFlag} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Flag Type</label>
                <select value={flagForm.type} onChange={e => setFlagForm({...flagForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option value="allergy">🚨 Allergy</option>
                  <option value="chronic">💜 Chronic Condition</option>
                  <option value="important">⭐ Important</option>
                  <option value="followup">📅 Needs Follow-up</option>
                  <option value="warning">⚠️ Warning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <input type="text" value={flagForm.note} onChange={e => setFlagForm({...flagForm, note: e.target.value})} placeholder="e.g., Allergic to Penicillin" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowFlagModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Add Flag</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationNotes;
