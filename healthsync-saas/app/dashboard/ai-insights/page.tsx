'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Terminal, 
  Activity, 
  ShieldCheck, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  CheckCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const readmissionRiskData = [
  { month: 'Jan', standardRisk: 14.5, optimizedRisk: 14.5 },
  { month: 'Feb', standardRisk: 15.2, optimizedRisk: 13.1 },
  { month: 'Mar', standardRisk: 16.0, optimizedRisk: 11.4 },
  { month: 'Apr', standardRisk: 15.8, optimizedRisk: 9.8 },
  { month: 'May', standardRisk: 16.5, optimizedRisk: 8.5 },
  { month: 'Jun', standardRisk: 17.2, optimizedRisk: 6.9 },
  { month: 'Jul', standardRisk: 16.9, optimizedRisk: 5.2 },
];

export default function AiInsightsPage() {
  const [terminalPrompt, setTerminalPrompt] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: 'HealthSync AI Analytics Terminal v2.4 initialized.' },
    { type: 'output', text: 'All clinical audits comply with HIPAA Subpart C regulations.' }
  ]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedAuditType, setSelectedAuditType] = useState<'recap' | 'drugs' | 'compliance'>('recap');

  const executeCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalPrompt.trim()) return;

    const cmd = terminalPrompt.trim();
    setTerminalLogs(prev => [...prev, { type: 'input', text: cmd }]);
    setTerminalPrompt('');

    setTimeout(() => {
      let response = '';
      const lower = cmd.toLowerCase();
      if (lower.includes('readmission') || lower.includes('cohort')) {
        response = 'SUCCESS: Generated Q2 Readmission Cohort analysis. Forecasted readmission rates decreased by 11.7% due to AI-guided scheduling optimizer integration.';
      } else if (lower.includes('drug') || lower.includes('interaction')) {
        response = 'SUCCESS: Scanned 1,482 active prescriptions. 0 high-risk conflicts found. 2 moderate SSRI interaction warnings flagged for audit.';
      } else if (lower.includes('hipaa') || lower.includes('compliance')) {
        response = 'SUCCESS: HIPAA Log check passed. 100% compliance record. Audit ID: HS-LOG-993A. PII redactor modules reporting fully active.';
      } else {
        response = `COMMAND NOT FOUND: "${cmd}". Available commands: "analyze readmission", "audit drug interactions", "check HIPAA compliance".`;
      }
      setTerminalLogs(prev => [...prev, { type: 'output', text: response }]);
    }, 800);
  };

  const startRiskAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          AI Insights & Analytics
          <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" /> AI Agent Enabled
          </span>
        </h1>
        <p className="text-sm text-brand-muted">Predictive health modelling, drug safety auditing, and conversational clinical analytics.</p>
      </div>

      {/* Analytics Main Visualisation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Readmission Risk Area Chart */}
        <Card className="lg:col-span-8 p-6" hoverEffect={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base tracking-tight">Patient Cohort Readmission Forecast</h3>
              <p className="text-xs text-brand-muted">Projections of 30-day readmissions comparing baseline vs. HealthSync AI Optimization.</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-primary/40"></span> Baseline Forecast</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-secondary/40"></span> Optimized Cohort</span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readmissionRiskData}>
                <defs>
                  <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
                <Tooltip />
                <Area type="monotone" dataKey="standardRisk" stroke="#94A3B8" fillOpacity={1} fill="url(#colorStandard)" strokeWidth={2} />
                <Area type="monotone" dataKey="optimizedRisk" stroke="#22C55E" fillOpacity={1} fill="url(#colorOptimized)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Clinical Auditor Panel */}
        <Card className="lg:col-span-4 p-6 flex flex-col justify-between" hoverEffect={false}>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base tracking-tight">Active Clinical Safety Auditing</h3>
              <p className="text-xs text-brand-muted">Automated real-time EMR scan status.</p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-brand-border">
              {(['recap', 'drugs', 'compliance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedAuditType(tab)}
                  className={`py-1 text-[10px] font-bold rounded-md capitalize cursor-pointer transition ${
                    selectedAuditType === tab 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-brand-muted hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 border border-brand-border p-3.5 rounded-xl space-y-2.5 text-xs">
              {selectedAuditType === 'recap' && (
                <>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Active Records:</span>
                    <span className="text-slate-800">4,281 Patients</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">High Risk Alerts:</span>
                    <span className="text-brand-danger font-semibold">1 Active</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Last Database Sync:</span>
                    <span className="text-brand-secondary font-semibold">Just Now</span>
                  </div>
                </>
              )}
              {selectedAuditType === 'drugs' && (
                <>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Interaction Audits:</span>
                    <span className="text-slate-800">14k completed</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Flagged Conflicts:</span>
                    <span className="text-brand-warning font-semibold">2 Flagged</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Safety Level:</span>
                    <span className="text-brand-secondary font-semibold">99.98% Safe</span>
                  </div>
                </>
              )}
              {selectedAuditType === 'compliance' && (
                <>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">HIPAA Audits:</span>
                    <span className="text-slate-800">100% Compliant</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">SOC-2 Type II Log:</span>
                    <span className="text-brand-secondary font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Encrypted Nodes:</span>
                    <span className="text-slate-800 font-semibold">24 active</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-brand-border">
            <Button 
              variant="primary" 
              className="w-full text-xs font-semibold h-10 flex items-center justify-center space-x-1.5"
              onClick={startRiskAudit}
              disabled={isAuditing}
            >
              {isAuditing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Auditing Database...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Execute Full Safety Audit</span>
                </>
              )}
            </Button>
          </div>
        </Card>

      </div>

      {/* Interactive AI Analytics Terminal & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Mock Terminal Card */}
        <Card className="lg:col-span-8 p-6 bg-slate-900 border-none glow-primary text-slate-100 flex flex-col justify-between h-[420px]" hoverEffect={false}>
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-brand-primary" />
                <span className="font-mono text-xs font-bold text-slate-200">HealthSync AI Terminal Shell</span>
              </div>
              <div className="flex space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              </div>
            </div>

            {/* Terminal logs list */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 py-4 text-slate-300">
              {terminalLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log.type === 'input' ? (
                    <span className="text-brand-primary font-bold">&gt; {log.text}</span>
                  ) : (
                    <div className="whitespace-pre-line pl-3 border-l border-brand-primary/20 text-slate-300">{log.text}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Form Input */}
            <form onSubmit={executeCommand} className="flex gap-2 border-t border-white/10 pt-3">
              <span className="font-mono text-brand-primary font-bold self-center text-xs">&gt;</span>
              <input
                type="text"
                value={terminalPrompt}
                onChange={(e) => setTerminalPrompt(e.target.value)}
                placeholder="Ask AI terminal (e.g. 'audit drug interactions', 'check HIPAA compliance')..."
                className="flex-1 bg-transparent font-mono text-xs focus:outline-none text-white placeholder:text-slate-500"
              />
              <Button type="submit" variant="primary" className="h-8 px-4 text-[10px] uppercase font-bold shrink-0">
                Execute
              </Button>
            </form>
          </div>
        </Card>

        {/* AI Compliance Stream / Event Log */}
        <Card className="lg:col-span-4 p-6" hoverEffect={false}>
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-base tracking-tight">Security & Compliance Log</h3>
            <p className="text-xs text-brand-muted">Real-time immutable SOC-2 audit logs.</p>
          </div>

          <div className="space-y-3.5">
            <div className="flex gap-3 items-start border-l-2 border-l-brand-secondary pl-3">
              <span className="h-2 w-2 rounded-full bg-brand-secondary shrink-0 mt-1"></span>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">10:48:12 AM</span>
                <span className="text-xs font-semibold text-slate-700 block">PII Redactor Active</span>
                <p className="text-[10px] text-brand-muted mt-0.5 leading-normal">Redacted patient address and SSID before generating external diagnostic model.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-l-2 border-l-brand-secondary pl-3">
              <span className="h-2 w-2 rounded-full bg-brand-secondary shrink-0 mt-1"></span>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">10:46:04 AM</span>
                <span className="text-xs font-semibold text-slate-700 block">HIPAA Audit Signature Created</span>
                <p className="text-[10px] text-brand-muted mt-0.5 leading-normal">Compliance certificate verified for outpatient prescription dispatch (Dr. Miller).</p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-l-2 border-l-brand-primary pl-3">
              <span className="h-2 w-2 rounded-full bg-brand-primary shrink-0 mt-1"></span>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">10:42:00 AM</span>
                <span className="text-xs font-semibold text-slate-700 block">Allergy Screen Audit</span>
                <p className="text-[10px] text-brand-muted mt-0.5 leading-normal">Sumatriptan allergy screen completed for Sophia Vance. Warning logged.</p>
              </div>
            </div>
          </div>
        </Card>

      </div>

    </div>
  );
}
