import { useState, useEffect } from 'react';
import axios from '../api/config';

const QueueDisplay = ({ appointmentId, doctorName }) => {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetchPosition();
      const interval = setInterval(fetchPosition, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [appointmentId]);

  const fetchPosition = async () => {
    try {
      const res = await axios.get(`/api/queue/position/${appointmentId}`);
      setPosition(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`/api/queue/checkin/${appointmentId}`);
      fetchPosition();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="animate-pulse bg-slate-100 rounded-xl h-32"></div>;
  if (!position || position.position === 0) return null;

  const getStatusColor = () => {
    if (position.status === 'in-consultation') return 'from-green-500 to-emerald-600';
    if (position.position <= 2) return 'from-amber-500 to-orange-600';
    return 'from-indigo-500 to-purple-600';
  };

  return (
    <div className={`bg-gradient-to-br ${getStatusColor()} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/80 text-sm">Your Queue Position</p>
          <h2 className="text-4xl font-bold">{position.status === 'in-consultation' ? 'Your Turn!' : `#${position.position}`}</h2>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-sm">Token Number</p>
          <p className="text-2xl font-bold">{position.tokenNumber}</p>
        </div>
      </div>

      {position.status === 'waiting' && (
        <>
          <div className="bg-white/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Estimated Wait</p>
                <p className="text-xl font-semibold">{position.estimatedWaitMinutes || 0} mins</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">Current Token</p>
                <p className="text-xl font-semibold">#{position.currentToken || 0}</p>
              </div>
            </div>
          </div>

          {position.position <= 2 && (
            <div className="bg-white/30 rounded-lg p-3 flex items-center gap-2 animate-pulse">
              <i className="fas fa-bell"></i>
              <span className="font-medium">Get ready! Your turn is coming soon</span>
            </div>
          )}
        </>
      )}

      {position.status === 'in-consultation' && (
        <div className="bg-white/30 rounded-lg p-4 flex items-center gap-3">
          <i className="fas fa-door-open text-2xl"></i>
          <div>
            <p className="font-semibold">Please proceed to the consultation room</p>
            <p className="text-sm text-white/80">Dr. {doctorName} is ready to see you</p>
          </div>
        </div>
      )}

      {!position.checkInTime && position.status === 'waiting' && (
        <button onClick={handleCheckIn} className="w-full mt-4 bg-white text-indigo-600 font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors">
          <i className="fas fa-check-circle mr-2"></i>Check In
        </button>
      )}
    </div>
  );
};

export default QueueDisplay;
