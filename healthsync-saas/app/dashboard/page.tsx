'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Recharts imports loaded dynamically to avoid server compilation mismatch
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const hourlyPatientData = [
  { time: '08:00 AM', actual: 24, forecast: 20 },
  { time: '10:00 AM', actual: 48, forecast: 42 },
  { time: '12:00 PM', actual: 56, forecast: 60 },
  { time: '02:00 PM', actual: 38, forecast: 40 },
  { time: '04:00 PM', actual: 45, forecast: 38 },
  { time: '06:00 PM', actual: 64, forecast: 50 },
  { time: '08:00 PM', actual: 22, forecast: 30 },
];

const departmentData = [
  { name: 'Cardiology', active: 18, peak: 20, waitTime: 12 },
  { name: 'Neurology', active: 14, peak: 15, waitTime: 22 },
  { name: 'Pediatrics', active: 22, peak: 30, waitTime: 8 },
  { name: 'General', active: 35, peak: 40, waitTime: 15 },
  { name: 'Emergency', active: 29, peak: 30, waitTime: 4 },
];

export default function CommandCenterPage() {
  const [patientFilter, setPatientFilter] = useState<'all' | 'waiting' | 'active'>('all');
  
  // Stats definitions
  const stats = [
    { title: 'Clinician Occupancy', value: '84.6%', change: '+3.2%', isPositive: true, desc: 'Active rooms: 22/26', icon: Users, color: 'text-brand-primary bg-sky-50' },
    { title: 'Average Patient Wait', value: '14.2 min', change: '-4.8m', isPositive: true, desc: 'Target limit: 15 min', icon: Clock, color: 'text-brand-secondary bg-emerald-50' },
    { title: 'Triage Throughput', value: '382', change: '+12%', isPositive: true, desc: 'Patients seen today', icon: Activity, color: 'text-brand-accent bg-teal-50' },
    { title: 'AI Copilot Confidence', value: '98.4%', change: '+0.6%', isPositive: true, desc: '14k automated clinical decodes', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  ];

  const livePatients = [
    { id: 1, name: 'Sophia Vance', age: '34yo F', department: 'Neurology', status: 'waiting', waitTime: '22 mins', doc: 'Dr. Miller', triageColor: 'border-l-4 border-l-brand-warning' },
    { id: 2, name: 'Marcus Thorne', age: '45yo M', department: 'Cardiology', status: 'active', waitTime: '6 mins', doc: 'Dr. Lin', triageColor: 'border-l-4 border-l-brand-primary' },
    { id: 3, name: 'Evelyn Vance', age: '8yo F', department: 'Pediatrics', status: 'active', waitTime: '4 mins', doc: 'Dr. Ross', triageColor: 'border-l-4 border-l-brand-primary' },
    { id: 4, name: 'Clara Oswald', age: '52yo F', department: 'General Care', status: 'waiting', waitTime: '18 mins', doc: 'Dr. Watson', triageColor: 'border-l-4 border-l-brand-danger' },
    { id: 5, name: 'Jonathan Crane', age: '61yo M', department: 'Neurology', status: 'completed', waitTime: '12 mins', doc: 'Dr. Miller', triageColor: 'border-l-4 border-l-brand-secondary' }
  ];

  const filteredPatients = livePatients.filter(p => {
    if (patientFilter === 'all') return true;
    if (patientFilter === 'waiting') return p.status === 'waiting';
    if (patientFilter === 'active') return p.status === 'active';
    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Command Center</h1>
          <p className="text-sm text-brand-muted">Real-time telemetry, live hospital orchestration, and dispatch auditing.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" className="h-9 flex items-center space-x-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Telemetry</span>
          </Button>
          <Button variant="primary" size="sm" className="h-9 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>AI Auto-Optimize</span>
          </Button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:-translate-y-1 transition duration-200">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${stat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                  stat.isPositive ? 'text-brand-secondary bg-emerald-50' : 'text-brand-danger bg-red-50'
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{stat.title}</span>
                <span className="text-2xl font-bold text-slate-800 tracking-tight block">{stat.value}</span>
                <span className="text-xs text-brand-muted block">{stat.desc}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Real-time Patient Triage Chart */}
        <Card className="lg:col-span-8 p-6" hoverEffect={false}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base tracking-tight">Real-Time Patient Throughput</h3>
              <p className="text-xs text-brand-muted">Comparative review of forecasted vs. actual check-ins today.</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-primary"></span> Actual</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300"></span> Forecast</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyPatientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="actual" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="forecast" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operational Analytics & Waiting times */}
        <Card className="lg:col-span-4 p-6 flex flex-col" hoverEffect={false}>
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-base tracking-tight">Active Department Load</h3>
            <p className="text-xs text-brand-muted">Departmental occupancy against peak limits.</p>
          </div>
          
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} tickLine={false} width={75} />
                <Tooltip />
                <Bar dataKey="active" fill="#14B8A6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-brand-border mt-4 space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Queue Performance Alerts</h4>
            <div className="bg-amber-50 text-brand-warning text-[11px] p-2.5 rounded-lg border border-amber-100 flex items-start gap-1.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Neurology queue wait time exceeds benchmark by 7 minutes. Recommend doctor allocation optimization.</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Patient Feed & Live Dispatch Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Live Patient Flow Triage */}
        <Card className="lg:col-span-8 p-6" hoverEffect={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base tracking-tight">Live Patient Orchestration</h3>
              <p className="text-xs text-brand-muted">Current status of active clinic visits. Click patient to view chart in AI Copilot.</p>
            </div>
            
            <div className="flex bg-slate-100 p-0.5 border border-brand-border rounded-lg text-xs font-semibold self-start sm:self-center">
              {(['all', 'waiting', 'active'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPatientFilter(tab)}
                  className={`px-3 py-1 rounded-md capitalize cursor-pointer ${
                    patientFilter === tab 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-brand-muted hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-3">Patient</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Wait Time</th>
                  <th className="pb-3">Assigned MD</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition cursor-pointer">
                    <td className={`py-3.5 pl-3 font-semibold text-slate-800 ${patient.triageColor}`}>
                      <div>{patient.name}</div>
                      <span className="text-[10px] text-brand-muted font-normal">{patient.age}</span>
                    </td>
                    <td className="py-3.5 text-slate-700 font-medium">{patient.department}</td>
                    <td className="py-3.5 text-slate-500 font-medium">{patient.waitTime}</td>
                    <td className="py-3.5 text-slate-600 font-medium">{patient.doc}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${
                        patient.status === 'active' ? 'bg-sky-50 text-brand-primary border-sky-100' :
                        patient.status === 'waiting' ? 'bg-amber-50 text-brand-warning border-amber-100' :
                        'bg-emerald-50 text-brand-secondary border-emerald-100'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Button size="sm" variant="ghost" className="h-8 text-[11px] font-semibold text-brand-primary hover:bg-sky-50">
                        View Chart
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Dispatch Recommendations */}
        <Card className="lg:col-span-4 p-6 bg-slate-900 text-white border-none glow-primary flex flex-col justify-between" hoverEffect={true}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-brand-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">HealthSync AI Dispatch</h3>
                <p className="text-[10px] text-slate-400">Live operational suggestions</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">Automation recommendation</span>
                <p className="leading-relaxed">Cardiology clinic at 90% peak capacity. Auto-reschedule 2 general outpatient reviews to telehealth rooms to restore flow.</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">EMR compliance check</span>
                <p className="leading-relaxed">Sophia Vance's diagnostic notes require ICD-10 codification. sumatriptan allergy alert is active.</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button variant="primary" className="w-full text-xs font-semibold h-10 shadow-lg shadow-sky-500/20">
              Approve Dispatch Routing
            </Button>
          </div>
        </Card>

      </div>

    </div>
  );
}
