'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Bookmark, 
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  MessageSquare
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    { sender: 'ai', text: 'Welcome Dr. Miller. I have loaded Sophia Vance\'s electronic medical records. How can I assist with her chart today?', time: '10:42 AM' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [drugQuery, setDrugQuery] = useState('');
  const [drugAlert, setDrugAlert] = useState<{ status: 'safe' | 'danger' | 'warning' | null; message: string }>({ status: null, message: '' });
  const [isChecking, setIsChecking] = useState(false);

  // Recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = 'Processing clinical request...';
      if (userMsg.toLowerCase().includes('migraine')) {
        aiResponse = 'Based on Sophia\'s history of recurrent unilateral throbbing headaches associated with photophobia, she meets the criteria for migraine without aura. Consider initiating Sumatriptan 50mg, but monitor blood pressure due to cardiovascular contraindications.';
      } else if (userMsg.toLowerCase().includes('referral') || userMsg.toLowerCase().includes('letter')) {
        aiResponse = `**Draft Referral Letter:**\n\nDear Dr. Chen,\n\nI am referring Sophia Vance (34yo F) for further neurological evaluation of persistent migraines. Patient reports 4-5 episodes/month, unresponsive to standard NSAIDs. Please find her vitals and recent MRI report attached.\n\nBest regards,\nDr. Miller, MD`;
      } else if (userMsg.toLowerCase().includes('icd')) {
        aiResponse = 'ICD-10 Code recommendations:\n- **G43.909**: Migraine, unspecified, not intractable, without status migrainosus\n- **R51.9**: Headache, unspecified';
      } else {
        aiResponse = 'I have updated the patient chart with your notes. I will audit this for HIPAA and insurance compliance before final signature.';
      }
      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput('Patient reports unilateral, throbbing headache localized to the left temporal region, lasting 18 hours. Accompanied by severe nausea.');
    } else {
      setIsRecording(true);
      setTranscriptionText('Listening to clinical dictation...');
      const phrases = [
        'Patient reports...',
        'Patient reports unilateral...',
        'Patient reports unilateral, throbbing headache...',
        'Patient reports unilateral, throbbing headache localized to the left temporal region...'
      ];
      let step = 0;
      const interval = setInterval(() => {
        if (step < phrases.length) {
          setTranscriptionText(phrases[step]);
          step++;
        } else {
          clearInterval(interval);
        }
      }, 800);
    }
  };

  const checkDrugInteraction = (val: string) => {
    setDrugQuery(val);
    if (!val.trim()) {
      setDrugAlert({ status: null, message: '' });
      return;
    }
    setIsChecking(true);
    
    setTimeout(() => {
      setIsChecking(false);
      const query = val.toLowerCase();
      if (query.includes('sumatriptan') || query.includes('imitrex')) {
        setDrugAlert({
          status: 'warning',
          message: 'Moderate interaction with patient\'s SSRI therapy. Risk of Serotonin Syndrome. Monitor clinical symptoms.'
        });
      } else if (query.includes('sulfa') || query.includes('bactrim')) {
        setDrugAlert({
          status: 'danger',
          message: 'CRITICAL WARNING: Patient has a documented severe allergy to sulfonamides. DO NOT prescribe.'
        });
      } else if (query.includes('propranolol') || query.includes('inderal')) {
        setDrugAlert({
          status: 'safe',
          message: 'No active interaction. Propranolol is safe and recommended as a migraine prophylactic.'
        });
      } else {
        setDrugAlert({
          status: 'warning',
          message: `Screening ${val} against EMR allergy list... No immediate drug-drug contraindications found, but confirm with lab panel.`
        });
      }
    }, 600);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 z-40 h-full w-[380px] bg-slate-50 border-l border-brand-border flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-brand-border bg-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  HealthSync AI Copilot
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary animate-ping"></span>
                </h3>
                <p className="text-[11px] text-brand-muted">Clinical Intelligence v2.4</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-brand-muted hover:text-slate-700 transition"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Patient Card Sticky Summarized */}
          <div className="p-4 bg-white border-b border-brand-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-sm">
                  SV
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">Sophia Vance</h4>
                  <p className="text-[11px] text-brand-muted">34yo Female • DOB: 11/04/1991</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">ID: #99402</span>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 p-1.5 rounded border border-brand-border/40">
                <span className="text-brand-muted block text-[9px] uppercase font-semibold">Primary Complaint</span>
                <span className="font-medium text-slate-700">Recurrent migraines</span>
              </div>
              <div className="bg-brand-danger/5 p-1.5 rounded border border-brand-danger/10">
                <span className="text-brand-danger block text-[9px] uppercase font-semibold">Active Allergies</span>
                <span className="font-medium text-brand-danger">Sulfa drugs</span>
              </div>
            </div>
          </div>

          {/* Interactive Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Drug Interaction Auditor */}
            <Card className="p-3 border border-brand-border/60 hover:shadow-none hover:translate-y-0" hoverEffect={false}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-brand-primary" />
                  Prescription Safety Auditor
                </h5>
                {isChecking && <RefreshCw className="w-3 h-3 text-brand-primary animate-spin" />}
              </div>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type medication to screen (e.g. Sumatriptan)..."
                  value={drugQuery}
                  onChange={(e) => checkDrugInteraction(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-slate-800 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
              </div>

              {drugAlert.status && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 p-2 rounded text-[11px] flex gap-1.5 items-start ${
                    drugAlert.status === 'danger' ? 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20' :
                    drugAlert.status === 'warning' ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' :
                    'bg-brand-success/10 text-brand-success border border-brand-success/20'
                  }`}
                >
                  {drugAlert.status === 'danger' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {drugAlert.status === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {drugAlert.status === 'safe' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{drugAlert.message}</span>
                </motion.div>
              )}
            </Card>

            {/* Smart Medical Billing Suggestions */}
            <Card className="p-3 border border-brand-border/60 hover:shadow-none hover:translate-y-0" hoverEffect={false}>
              <h5 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-brand-accent" />
                ICD-10 / CPT Coding Assistant
              </h5>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center p-1.5 bg-slate-50 hover:bg-slate-100/80 rounded border border-brand-border/40 transition cursor-pointer">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-700">G43.909</span>
                    <p className="text-[10px] text-brand-muted">Migraine without aura, intractable</p>
                  </div>
                  <span className="text-[9px] bg-sky-50 text-brand-primary border border-sky-100 px-1.5 py-0.5 rounded font-medium">94% Confidence</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-slate-50 hover:bg-slate-100/80 rounded border border-brand-border/40 transition cursor-pointer">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-700">99214</span>
                    <p className="text-[10px] text-brand-muted">Outpatient visit, 30-39 min clinic</p>
                  </div>
                  <span className="text-[9px] bg-teal-50 text-brand-accent border border-teal-100 px-1.5 py-0.5 rounded font-medium">Auto-CPT</span>
                </div>
              </div>
            </Card>

            {/* Chat Messages */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AI Consultation Notes</span>
                <span className="text-[9px] text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Updated 2m ago</span>
              </div>
              
              <div className="space-y-2.5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-2.5 rounded-lg text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-brand-primary text-white rounded-br-none' 
                        : 'bg-white text-slate-700 border border-brand-border/60 rounded-bl-none shadow-sm shadow-slate-100'
                    }`}>
                      {msg.text.split('\n').map((line, idx) => (
                        <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>{line}</p>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Voice Transcription Drawer & Text Input */}
          <div className="p-4 border-t border-brand-border bg-white space-y-3">
            {isRecording && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-slate-50 p-2.5 rounded-lg border border-brand-primary/20 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-primary font-semibold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand-danger animate-pulse"></span>
                    Live Dictation Mode
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{formatTime(recordingTimer)}</span>
                </div>
                <p className="text-[11px] text-slate-600 italic leading-relaxed">"{transcriptionText}"</p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleVoiceToggle} 
                  className="w-full text-brand-danger hover:bg-red-50 text-[10px] h-7"
                >
                  Stop and Commit Draft Notes
                </Button>
              </motion.div>
            )}

            <div className="flex gap-2">
              <Button
                variant={isRecording ? 'danger' : 'secondary'}
                size="icon"
                onClick={handleVoiceToggle}
                className="w-10 h-10 rounded-lg shrink-0"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand-primary" />}
              </Button>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask AI, draft referral, summarize chart..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg pl-3 pr-9 h-10 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-slate-800 placeholder:text-slate-400"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-1.5 top-1.5 p-1 rounded-md text-brand-primary hover:bg-slate-100 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-[9px] text-brand-muted text-center leading-normal">
              HIPAA compliant. Certified safe. Patient data is encrypted end-to-end.
            </p>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
