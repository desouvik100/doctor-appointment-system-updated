import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const EnhancedReview = ({ doctorId, userId, appointmentId, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    overallRating: 5,
    punctualityRating: 5,
    behaviorRating: 5,
    treatmentRating: 5,
    review: '',
    wouldRecommend: true,
    visitAgain: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/reviews', {
        ...form,
        doctorId,
        userId,
        appointmentId,
        isVerified: !!appointmentId // Verified if linked to appointment
      });
      toast.success('Review submitted! Thank you for your feedback.');
      onSubmit?.();
      onClose?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  const RatingStars = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)} className={`text-xl transition-colors ${star <= value ? 'text-amber-400' : 'text-slate-200'}`}>
            <i className="fas fa-star"></i>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-2xl">
          <h3 className="text-lg font-bold">Rate Your Experience</h3>
          <p className="text-sm text-white/80">Your feedback helps others find great doctors</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Overall Rating */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">Overall Experience</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setForm({...form, overallRating: star})} className={`text-3xl transition-all ${star <= form.overallRating ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {form.overallRating === 5 ? 'Excellent!' : form.overallRating === 4 ? 'Very Good' : form.overallRating === 3 ? 'Good' : form.overallRating === 2 ? 'Fair' : 'Poor'}
            </p>
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-3 bg-slate-50 rounded-xl p-4">
            <RatingStars label="⏰ Punctuality" value={form.punctualityRating} onChange={v => setForm({...form, punctualityRating: v})} />
            <RatingStars label="😊 Behavior & Communication" value={form.behaviorRating} onChange={v => setForm({...form, behaviorRating: v})} />
            <RatingStars label="💊 Treatment Effectiveness" value={form.treatmentRating} onChange={v => setForm({...form, treatmentRating: v})} />
          </div>

          {/* Written Review */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Review</label>
            <textarea value={form.review} onChange={e => setForm({...form, review: e.target.value})} rows={3} placeholder="Share your experience with this doctor..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"></textarea>
          </div>

          {/* Quick Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-slate-700">Would you recommend this doctor?</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({...form, wouldRecommend: true})} className={`px-3 py-1 rounded-lg text-sm ${form.wouldRecommend ? 'bg-green-500 text-white' : 'bg-white text-slate-600'}`}>Yes</button>
                <button type="button" onClick={() => setForm({...form, wouldRecommend: false})} className={`px-3 py-1 rounded-lg text-sm ${!form.wouldRecommend ? 'bg-red-500 text-white' : 'bg-white text-slate-600'}`}>No</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-slate-700">Would you visit again?</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({...form, visitAgain: true})} className={`px-3 py-1 rounded-lg text-sm ${form.visitAgain ? 'bg-blue-500 text-white' : 'bg-white text-slate-600'}`}>Yes</button>
                <button type="button" onClick={() => setForm({...form, visitAgain: false})} className={`px-3 py-1 rounded-lg text-sm ${!form.visitAgain ? 'bg-red-500 text-white' : 'bg-white text-slate-600'}`}>No</button>
              </div>
            </div>
          </div>

          {appointmentId && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
              <i className="fas fa-check-circle"></i>
              <span>Verified Review - Linked to your appointment</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50">
              {submitting ? <i className="fas fa-spinner fa-spin"></i> : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedReview;
