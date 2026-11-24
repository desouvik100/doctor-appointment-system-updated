/**
 * useWallet — Health wallet and loyalty points hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useWallet = (userId) => {
  const [balance, setBalance]         = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [loading, setLoading]         = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [walletRes, loyaltyRes] = await Promise.allSettled([
        axios.get('/api/wallet/balance'),
        axios.get('/api/loyalty-points'),
      ]);

      if (walletRes.status === 'fulfilled') {
        const data = walletRes.value.data;
        setBalance(data?.balance || data?.walletBalance || 0);
        setTransactions(data?.transactions || []);
      }

      if (loyaltyRes.status === 'fulfilled') {
        setLoyaltyPoints(loyaltyRes.value.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [userId]);

  const redeemPoints = useCallback(async (points) => {
    try {
      const res = await axios.post('/api/loyalty-points/redeem', { points });
      toast.success(`Redeemed ${points} points successfully`);
      await fetchWallet();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to redeem points');
      return null;
    }
  }, [fetchWallet]);

  useEffect(() => {
    if (userId) fetchWallet();
  }, [userId, fetchWallet]);

  return {
    balance,
    transactions,
    loyaltyPoints,
    loading,
    fetchWallet,
    redeemPoints,
    totalPoints:     loyaltyPoints?.totalPoints || 0,
    availablePoints: loyaltyPoints?.availablePoints || 0,
    tier:            loyaltyPoints?.tier || 'bronze',
  };
};

export default useWallet;
