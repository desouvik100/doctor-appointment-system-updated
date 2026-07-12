'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitMerge, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  ScreenShare, 
  Sparkles, 
  User, 
  Clock, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2,
  Bookmark,
  Activity,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Patient {
  id: number;
  name: string;
  age: string;
  waitTime: number;
  triage: 'critical' | 'urgent' | 'standard';
  status: string;
  room: string;
}

export default function PatientFlowPage() {
  const [patients, setPatients] = useState<Patient[]>([
    { id: 1, name: 'Clara Oswald', age: '52yo F', waitTime: 18, triage: 'critical', status: 'Waiting', room: 'Unallocated' },
    { id: 2, name: 'Sophia Vance', age: '34yo F', waitTime: 22, triage: 'urgent', status: 'Waiting', room: 'Room 102 (Telehealth)' },
    { id: 3, name: 'Marcus Thorne', age: '45yo M', waitTime: 6, triage: 'standard', status: 'In Consultation', room: 'Room 101' },
    { id: 4, name: 'Evelyn Vance', age: '8yo F', waitTime: 4, triage: 'standard', status: 'In Consultation', room: 'Room 103' },
    { id: 5, name: 'Jonathan Crane', age: '61yo M', waitTime: 12, triage: 'urgent', status: 'Waiting', room: 'Unallocated' }
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [telehealthActive, setTelehealthActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [transcripts, setTranscripts] = useState<Array<{ sender: 'doc' | 'pat'; text: string }>>([
    { sender: 'doc', text: 'Good morning Sophia. I see you are reporting recurrent migraines. How long have they been lasting?' },
    { sender: 'pat', text: 'Usually around 12 to 18 hours. They are mostly on the left side of my head and very throbbing.' }
  ]);
  const [transcribeCounter, setTranscribeCounter] = useState(0);

  // Simulated transcription stream
  useEffect(() => {
    if (!telehealthActive) return;
    const transcriptLines = [
      { sender: 'doc', text: 'Are they accompanied by any visual disturbances or photophobia?' },
      { sender: 'pat', text: 'Yes, looking at bright lights makes it much worse. I have to stay in a dark room.' },
      { sender: 'doc', text: 'Understood. Sumatriptan could be an option, but I see a sulfa drug allergy on your chart. Let me audit interactions.' },
      { sender: 'pat', text: 'That would be great, doctor. I am always worried about interactions.' }
    ];

    const interval = setInterval(() => {
      if (transcribeCounter < transcriptLines.length) {
        setTranscripts(prev => [...prev, transcriptLines[transcribeCounter]]);
        setTranscribeCounter(prev => prev + 1);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [telehealthActive, transcribeCounter]);

  const runFlowOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setPatients(prev => {
        return prev.map(p => {
          if (p.name === 'Clara Oswald') {
            return { ...p, room: 'Room 104', status: 'Rerouted (Immediate)', waitTime: 2 };
          }
          if (p.name === 'Jonathan Crane') {
            return { ...p, room: 'Room 105', status: 'Rerouted', waitTime: 5 };
          }
          return p;
        });
      });
      setIsOptimizing(false);
    }, 1200);
  };

  const resetFlow = () => {
    setPatients([
      { id: 1, name: 'Clara Oswald', age: '52yo F', waitTime: 18, triage: 'critical', status: 'Waiting', room: 'Unallocated' },
      { id: 2, name: 'Sophia Vance', age: '34yo F', waitTime: 22, triage: 'urgent', status: 'Waiting', room: 'Room 102 (Telehealth)' },
      { id: 3, name: 'Marcus Thorne', age: '45yo M', waitTime: 6, triage: 'standard', status: 'In Consultation', room: 'Room 101' },
      { id: 4, name: 'Evelyn Vance', age: '8yo F', waitTime: 4, triage: 'standard', status: 'In Consultation', room: 'Room 103' },
      { id: 5, name: 'Jonathan Crane', age: '61yo M', waitTime: 12, triage: 'urgent', status: 'Waiting', room: 'Unallocated' }
    ]);
    setTranscribeCounter(0);
    setTranscripts([
      { sender: 'doc', text: 'Good morning Sophia. I see you are reporting recurrent migraines. How long have they been lasting?' },
      { sender: 'pat', text: 'Usually around 12 to 18 hours. They are mostly on the left side of my head and very throbbing.' }
    ]);
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Smart Patient Flow
            <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3" /> Telehealth Grid
            </span>
          </h1>
          <p className="text-sm text-brand-muted">Automated queue routing, live telemedicine, and consultation room tracking.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={resetFlow} className="h-9 flex items-center space-x-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Grid</span>
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={runFlowOptimizer} 
            disabled={isOptimizing}
            className="h-9 flex items-center space-x-1"
          >
            {isOptimizing ? (
              <span>Rerouting Queues...</span>
            ) : (
              <>
                <GitMerge className="w-3.5 h-3.5 text-white" />
                <span>Optimize Patient Flow</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Telemedicine Room + Live Waiting List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Telehealth Call Workspace Panel */}
        <Card className="lg:col-span-8 p-6 flex flex-col justify-between" hoverEffect={false}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-brand-primary" />
                <h3 className="font-bold text-slate-800 text-base tracking-tight">Active Telehealth Session</h3>
              </div>
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-ping"></span> Live Broadcast
              </span>
            </div>

            {/* Video Mock window */}
            <div className="h-96 w-full rounded-[16px] overflow-hidden relative bg-slate-900 border border-slate-800 flex items-center justify-center">
              {telehealthActive ? (
                <>
                  {/* Mock Patient Picture / Waveform */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gradient-to-t from-slate-950/80 via-slate-900 to-slate-950">
                    <div className="w-24 h-24 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-2 border-brand-primary/50 animate-ping opacity-25"></div>
                      <User className="w-10 h-10 text-brand-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-semibold text-slate-200">Sophia Vance</h4>
                      <p className="text-xs text-brand-muted">34yo Female • Recurrent Migraines</p>
                    </div>
                    
                    {/* Pulsing Audio waveform */}
                    <div className="flex space-x-1.5 h-6 items-end pt-2">
                      <span className="w-1 bg-brand-primary rounded-full animate-[pulse_0.8s_infinite] h-4"></span>
                      <span className="w-1 bg-brand-primary rounded-full animate-[pulse_1.2s_infinite] h-6"></span>
                      <span className="w-1 bg-brand-primary rounded-full animate-[pulse_1.0s_infinite] h-5"></span>
                      <span className="w-1 bg-brand-primary rounded-full animate-[pulse_0.9s_infinite] h-3"></span>
                      <span className="w-1 bg-brand-primary rounded-full animate-[pulse_1.1s_infinite] h-5"></span>
                    </div>
                  </div>

                  {/* Doctor Thumbnail */}
                  <div className="absolute bottom-4 right-4 w-28 h-20 bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-500" />
                    <span className="absolute bottom-1 right-1 text-[9px] text-slate-400">Dr. Miller</span>
                  </div>

                  {/* Vitals overlay */}
                  <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-sm border border-slate-800/80 p-2.5 rounded-lg text-[10px] space-y-1 text-slate-300 font-mono">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Patient Telemetry</span>
                    <div>HR: <span className="text-brand-secondary font-bold">72 bpm</span></div>
                    <div>SPO2: <span className="text-brand-primary font-bold">99%</span></div>
                    <div>Allergies: <span className="text-brand-danger font-bold">Sulfa</span></div>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                    <VideoOff className="w-6 h-6 text-slate-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-400">Telehealth Session Disconnected</h4>
                  <p className="text-xs text-slate-600">Select a waiting telehealth patient to begin consultation.</p>
                </div>
              )}
            </div>

            {/* Video controls */}
            {telehealthActive && (
              <div className="flex items-center justify-center space-x-3 pt-2">
                <Button 
                  variant={micActive ? 'secondary' : 'danger'} 
                  size="icon" 
                  onClick={() => setMicActive(!micActive)}
                  className="w-10 h-10 rounded-full"
                >
                  {micActive ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5 text-white" />}
                </Button>
                
                <Button 
                  variant={videoActive ? 'secondary' : 'danger'} 
                  size="icon" 
                  onClick={() => setVideoActive(!videoActive)}
                  className="w-10 h-10 rounded-full"
                >
                  {videoActive ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5 text-white" />}
                </Button>

                <Button variant="secondary" size="icon" className="w-10 h-10 rounded-full">
                  <ScreenShare className="w-4.5 h-4.5" />
                </Button>

                <Button 
                  variant="danger" 
                  size="icon" 
                  onClick={() => setTelehealthActive(false)}
                  className="w-12 h-12 rounded-full hover:scale-105 shadow-lg shadow-red-500/20"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Real-time AI Transcription Drawer */}
        <Card className="lg:col-span-4 p-6 flex flex-col justify-between h-[510px]" hoverEffect={false}>
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              <h3 className="font-bold text-slate-800 text-base tracking-tight">AI Live Transcription</h3>
            </div>
            
            <p className="text-xs text-brand-muted">Speech-to-text clinical transcription. System is recording audio.</p>

            {/* Transcript stream */}
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-brand-border/60 rounded-xl p-3.5 space-y-3.5 text-xs text-slate-700 font-sans">
              {transcripts.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    t.sender === 'doc' ? 'text-brand-primary' : 'text-brand-accent'
                  }`}>
                    {t.sender === 'doc' ? 'Clinician' : 'Patient'}
                  </span>
                  <p className="leading-relaxed bg-white p-2.5 rounded-lg border border-brand-border/40 shadow-sm shadow-slate-100/50">
                    "{t.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border mt-4">
            <Button 
              variant="primary" 
              className="w-full text-xs font-semibold h-10 shadow-lg shadow-sky-500/10"
              onClick={() => {
                if (!telehealthActive) {
                  setTelehealthActive(true);
                } else {
                  // Trigger draft generation
                }
              }}
            >
              {telehealthActive ? 'Commit Transcripts to Chart' : 'Reconnect Telehealth Room'}
            </Button>
          </div>
        </Card>

      </div>

      {/* Grid: Clinic consultation rooms & Live Waiting queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Patient waiting list & allocated rooms */}
        <Card className="lg:col-span-8 p-6" hoverEffect={false}>
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-base tracking-tight">Clinic Allocation Queue</h3>
            <p className="text-xs text-brand-muted">Waiting patient lists and department consult room mapping.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Triage Priority</th>
                  <th className="pb-3">Wait Time</th>
                  <th className="pb-3">Allocated Location</th>
                  <th className="pb-3">Routing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 font-semibold text-slate-800">
                      <div>{pat.name}</div>
                      <span className="text-[10px] text-brand-muted font-normal">{pat.age}</span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                        pat.triage === 'critical' ? 'bg-red-50 text-brand-danger border-red-100' :
                        pat.triage === 'urgent' ? 'bg-amber-50 text-brand-warning border-amber-100' :
                        'bg-sky-50 text-brand-primary border-sky-100'
                      }`}>
                        {pat.triage}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">{pat.waitTime} mins</td>
                    <td className="py-3.5 text-slate-700 font-semibold">{pat.room}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        pat.status.includes('Rerouted') ? 'bg-emerald-50 text-brand-secondary border-emerald-100' : 'bg-slate-50 text-brand-muted border-slate-100'
                      }`}>
                        {pat.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Visual Room Grid status */}
        <Card className="lg:col-span-4 p-6" hoverEffect={false}>
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-base tracking-tight">Consultation Room Grid</h3>
            <p className="text-xs text-brand-muted">Real-time status of physical and virtual rooms.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-brand-border rounded-xl p-3.5 space-y-1.5">
              <span className="font-bold text-xs text-slate-700 block">Room 101</span>
              <span className="text-[10px] font-mono text-slate-400 block">Cardiology Outpatient</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-50 text-brand-primary border border-sky-100">Occupied</span>
            </div>
            
            <div className="border border-brand-border rounded-xl p-3.5 space-y-1.5">
              <span className="font-bold text-xs text-slate-700 block">Room 102</span>
              <span className="text-[10px] font-mono text-slate-400 block">Neurology Virtual</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">Telehealth</span>
            </div>

            <div className="border border-brand-border rounded-xl p-3.5 space-y-1.5">
              <span className="font-bold text-xs text-slate-700 block">Room 103</span>
              <span className="text-[10px] font-mono text-slate-400 block">Pediatric Exam</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-brand-secondary border border-emerald-100">Available</span>
            </div>

            <div className="border border-brand-border rounded-xl p-3.5 space-y-1.5">
              <span className="font-bold text-xs text-slate-700 block">Room 104</span>
              <span className="text-[10px] font-mono text-slate-400 block">ER Rapid Admission</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-50 text-brand-danger border border-red-100 font-mono">Cleaning</span>
            </div>
          </div>
        </Card>

      </div>

    </div>
  );
}
