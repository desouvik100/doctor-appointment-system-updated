import { useState, useEffect } from 'react';
import axios from '../api/config';

const SecurityWarningBanner = ({ userId }) => {
  const [warnings, setWarnings] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchWarnings = async () => {
      try {
        const response = await axios.get(`/api/security/user/${userId}`);
        if (response.data.success) {
          // Show only recent high/critical alerts that haven't been dismissed
          const recentWarnings = response.data.alerts
            .filter(a => 
              ['high', 'critical'].includes(a.severity) && 
              a.warningSent &&
              new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            )
            .slice(0, 3);
          setWarnings(recentWarnings);
        }
      } catch (error) {
        console.error('Error fetching security warnings:', error);
      }
    };

    fetchWarnings();
  }, [userId]);

  const handleDismiss = (alertId) => {
    setDismissed([...dismissed, alertId]);
  };

  const visibleWarnings = warnings.filter(w => !dismissed.includes(w._id));

  if (visibleWarnings.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleWarnings.map(warning => (
        <div
          key={warning._id}
          className={`p-4 rounded-xl shadow-lg border ${
            warning.severity === 'critical' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              warning.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
            }`}>
              <i className="fas fa-shield-alt text-white text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-semibold ${
                warning.severity === 'critical' ? 'text-red-800' : 'text-amber-800'
              }`}>
                Security Alert
              </h4>
              <p className={`text-xs mt-1 ${
                warning.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {warning.description}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                If this wasn't you, please change your password immediately.
              </p>
            </div>
            <button
              onClick={() => handleDismiss(warning._id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SecurityWarningBanner;
