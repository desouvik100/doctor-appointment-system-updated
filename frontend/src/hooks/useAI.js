/**
 * useAI — AI chatbot and health assistant hook
 */
import { useState, useCallback, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useAI = () => {
  const [messages, setMessages]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [symptoms, setSymptoms]     = useState([]);
  const [analysis, setAnalysis]     = useState(null);
  const abortRef = useRef(null);

  // ─── Chatbot ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (message, context = {}) => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post('/api/chatbot/chat', {
        message,
        context,
        history: messages.slice(-10), // Last 10 messages for context
      });

      const botMsg = {
        role: 'assistant',
        content: res.data?.response || res.data?.message || 'I could not process that request.',
        timestamp: new Date(),
        suggestions: res.data?.suggestions || [],
      };

      setMessages(prev => [...prev, botMsg]);
      return botMsg;
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // ─── Symptom Checker ──────────────────────────────────────────────────
  const checkSymptoms = useCallback(async (symptomList) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await axios.post('/api/ai/symptom-check', {
        symptoms: symptomList,
      });
      setAnalysis(res.data);
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to analyze symptoms');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addSymptom = useCallback((symptom) => {
    setSymptoms(prev => {
      if (prev.includes(symptom)) return prev;
      return [...prev, symptom];
    });
  }, []);

  const removeSymptom = useCallback((symptom) => {
    setSymptoms(prev => prev.filter(s => s !== symptom));
  }, []);

  const clearSymptoms = useCallback(() => {
    setSymptoms([]);
    setAnalysis(null);
  }, []);

  // ─── Report Analyzer ──────────────────────────────────────────────────
  const analyzeReport = useCallback(async (reportData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/ai-report/analyze', reportData);
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to analyze report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Drug Interactions ────────────────────────────────────────────────
  const checkDrugInteractions = useCallback(async (drugs) => {
    try {
      const res = await axios.post('/api/drugs/check-interactions', { drugs });
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to check drug interactions');
      return null;
    }
  }, []);

  // ─── Health Insights ──────────────────────────────────────────────────
  const getHealthInsights = useCallback(async () => {
    try {
      const res = await axios.get('/api/ai-health/insights');
      return res.data;
    } catch { return null; }
  }, []);

  return {
    // Chatbot
    messages,
    loading,
    sendMessage,
    clearChat,

    // Symptom checker
    symptoms,
    analysis,
    checkSymptoms,
    addSymptom,
    removeSymptom,
    clearSymptoms,

    // Other AI features
    analyzeReport,
    checkDrugInteractions,
    getHealthInsights,
  };
};

export default useAI;
