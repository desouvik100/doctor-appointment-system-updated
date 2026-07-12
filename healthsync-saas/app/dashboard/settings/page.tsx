'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  Sliders, 
  Terminal, 
  Globe, 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Database
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const [showSecret, setShowSecret] = useState(false);
  const [anonymizerActive, setAnonymizerActive] = useState(true);
  const [telehealthSuggestion, setTelehealthSuggestion] = useState(true);
  const [autoRescheduleLimit, setAutoRescheduleLimit] = useState(15);
  const [clinicBranchActive, setClinicBranchActive] = useState({
    westWing: true,
    downtown: true,
    pediatricCenter: false
  });

  const apiKeys = [
    { name: 'Live Production Sync', key: 'hs_live_a89bc27...d01', created: '03/11/2026', status: 'active' },
    { name: 'Physician Portal API', key: 'hs_live_9a01fcc...e22', created: '04/14/2026', status: 'active' },
    { name: 'Development Sandbox', key: 'hs_test_5eef833...902', created: '06/01/2026', status: 'inactive' }
  ];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Enterprise Settings
        </h1>
        <p className="text-sm text-brand-muted">Configure hospital network topology, encryption configurations, developer APIs, and routing thresholds.</p>
      </div>

      {/* Grid: Global Configs & HIPAA Security */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Clinician Flow Policies */}
        <Card className="lg:col-span-6 p-6" hoverEffect={false}>
          <div className="flex items-center space-x-2.5 mb-6">
            <Sliders className="w-5 h-5 text-brand-primary" />
            <div>
              <h3 className="font-bold text-slate-800 text-base tracking-tight">Auto-Routing Flow Policies</h3>
              <p className="text-xs text-brand-muted">Configure automation metrics for the queue dispatcher.</p>
            </div>
          </div>

          <div className="space-y-6 text-xs text-slate-700">
            {/* Auto-reroute threshold slider */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Reroute Critical Care Wait Limit</span>
                <span className="text-brand-primary">{autoRescheduleLimit} minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                value={autoRescheduleLimit}
                onChange={(e) => setAutoRescheduleLimit(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <p className="text-[10px] text-brand-muted leading-relaxed">
                Patients wait longer than this limit will automatically trigger an AI Dispatch routing recommendation.
              </p>
            </div>

            {/* Telehealth suggestions toggle */}
            <div className="flex items-center justify-between py-2 border-t border-brand-border/60">
              <div className="space-y-0.5 pr-4">
                <span className="font-semibold text-slate-700 block">Proactive Telehealth Routing</span>
                <p className="text-[10px] text-brand-muted leading-normal">
                  Reroutes outpatient reviews to empty virtual consultation rooms if physical waiting rooms are at capacity.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setTelehealthSuggestion(!telehealthSuggestion)}
                className="text-slate-600 focus:outline-none cursor-pointer"
              >
                {telehealthSuggestion ? (
                  <ToggleRight className="w-10 h-10 text-brand-primary" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-300" />
                )}
              </button>
            </div>

            {/* Patient anonymizer toggle */}
            <div className="flex items-center justify-between py-2 border-t border-brand-border/60">
              <div className="space-y-0.5 pr-4">
                <span className="font-semibold text-slate-700 block">Automated HIPAA PII Redactor</span>
                <p className="text-[10px] text-brand-muted leading-normal">
                  Anonymizes name, age, and location details in database nodes before transferring diagnostic data to external API integrations.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setAnonymizerActive(!anonymizerActive)}
                className="text-slate-600 focus:outline-none cursor-pointer"
              >
                {anonymizerActive ? (
                  <ToggleRight className="w-10 h-10 text-brand-secondary" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Hospital Branch Topology */}
        <Card className="lg:col-span-6 p-6 flex flex-col justify-between" hoverEffect={false}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <Globe className="w-5 h-5 text-brand-accent" />
              <div>
                <h3 className="font-bold text-slate-800 text-base tracking-tight">Active Hospital Branches</h3>
                <p className="text-xs text-brand-muted">Activate operational centers on the scheduling grid.</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-brand-border rounded-xl">
                <div>
                  <span className="font-semibold text-slate-700 block">West Wing Outpatient Clinic</span>
                  <p className="text-[10px] text-brand-muted mt-0.5">Clinical slots active. 14 consulting rooms configured.</p>
                </div>
                <button
                  onClick={() => setClinicBranchActive(prev => ({ ...prev, westWing: !prev.westWing }))}
                  className="text-slate-500 font-semibold"
                >
                  {clinicBranchActive.westWing ? (
                    <span className="text-brand-secondary">Operational</span>
                  ) : (
                    <span className="text-slate-400">Suspended</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-brand-border rounded-xl">
                <div>
                  <span className="font-semibold text-slate-700 block">Downtown Healthcare Annex</span>
                  <p className="text-[10px] text-brand-muted mt-0.5">Virtual telemedicine center active. 24/7 coverage.</p>
                </div>
                <button
                  onClick={() => setClinicBranchActive(prev => ({ ...prev, downtown: !prev.downtown }))}
                  className="text-slate-500 font-semibold"
                >
                  {clinicBranchActive.downtown ? (
                    <span className="text-brand-secondary">Operational</span>
                  ) : (
                    <span className="text-slate-400">Suspended</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-brand-border rounded-xl">
                <div>
                  <span className="font-semibold text-slate-700 block">Pediatric Speciality Center</span>
                  <p className="text-[10px] text-brand-muted mt-0.5">Currently offline. Schedule for reopening: Q3 2026.</p>
                </div>
                <button
                  onClick={() => setClinicBranchActive(prev => ({ ...prev, pediatricCenter: !prev.pediatricCenter }))}
                  className="text-slate-500 font-semibold"
                >
                  {clinicBranchActive.pediatricCenter ? (
                    <span className="text-brand-secondary">Operational</span>
                  ) : (
                    <span className="text-slate-400">Offline</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-border mt-6 flex justify-end">
            <Button variant="secondary" className="text-xs h-9">
              Add New Branch Clinic
            </Button>
          </div>
        </Card>

      </div>

      {/* Developer API & Integrations (Series B feel) */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="p-6" hoverEffect={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2.5">
              <Key className="w-5 h-5 text-brand-primary" />
              <div>
                <h3 className="font-bold text-slate-800 text-base tracking-tight">Developer API Credentials</h3>
                <p className="text-xs text-brand-muted">Integrate HealthSync clinic routing telemetry directly into your custom patient-facing apps.</p>
              </div>
            </div>
            <Button variant="primary" size="sm" className="h-9 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-white" />
              <span>Generate API Key</span>
            </Button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Credential Name</th>
                  <th className="pb-3">API Client Key</th>
                  <th className="pb-3">Created Date</th>
                  <th className="pb-3">Active Status</th>
                  <th className="pb-3 text-right">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {apiKeys.map((key, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 font-semibold text-slate-800">{key.name}</td>
                    <td className="py-3.5 font-mono text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span>{key.key}</span>
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">{key.created}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        key.status === 'active' ? 'bg-emerald-50 text-brand-secondary border-emerald-100' : 'bg-slate-50 text-brand-muted border-slate-100'
                      }`}>
                        {key.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-600 font-semibold uppercase font-mono text-[10px]">Read/Write EMR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-brand-border/60 mt-4 text-[11px] text-brand-muted flex items-start gap-1.5 leading-relaxed">
            <Shield className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
            <span>All API keys are encrypted at rest. HIPAA telemetry logging remains active for any endpoints accessed using credentials above.</span>
          </div>
        </Card>
      </div>

    </div>
  );
}
