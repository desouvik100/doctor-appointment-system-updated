'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Shield, 
  Activity, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Database,
  Terminal
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@healthsync.co');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<'admin' | 'doctor' | 'dev'>('admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative Floating Particles & Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Pitch and Stats (Linear / Stripe style) */}
        <div className="md:col-span-7 space-y-6 pr-0 md:pr-8">
          
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-3.5 py-1.5 rounded-full text-xs font-semibold glow-primary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>HealthSync v2.4 Platform Release</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              The modern <span className="text-brand-primary">operating system</span> for enterprise healthcare.
            </h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-xl">
              Automate clinical logistics, orchestrate real-time patient queues, and unlock instant AI-powered diagnostics. Secure, compliant, and developer-first.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 pt-6"
          >
            <div className="border-l-2 border-brand-primary/40 pl-3">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">99.99%</span>
              <p className="text-xs text-brand-muted mt-0.5">SLA Uptime Guarantee</p>
            </div>
            <div className="border-l-2 border-brand-accent/40 pl-3">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">&lt;840ms</span>
              <p className="text-xs text-brand-muted mt-0.5">API Endpoint Latency</p>
            </div>
            <div className="border-l-2 border-brand-secondary/40 pl-3">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">100%</span>
              <p className="text-xs text-brand-muted mt-0.5">HIPAA & SOC2 Compliant</p>
            </div>
          </motion.div>

          {/* Feature Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-2.5 pt-4 text-xs text-slate-600"
          >
            <span className="flex items-center gap-1.5 bg-white border border-brand-border px-3 py-1.5 rounded-full shadow-sm">
              <Shield className="w-3.5 h-3.5 text-brand-primary" /> End-to-end Encryption
            </span>
            <span className="flex items-center gap-1.5 bg-white border border-brand-border px-3 py-1.5 rounded-full shadow-sm">
              <Database className="w-3.5 h-3.5 text-brand-secondary" /> Immutable Audit Trails
            </span>
            <span className="flex items-center gap-1.5 bg-white border border-brand-border px-3 py-1.5 rounded-full shadow-sm">
              <Terminal className="w-3.5 h-3.5 text-brand-accent" /> Developer-First Webhooks
            </span>
          </motion.div>

        </div>

        {/* Right Side: Login Card (Apple / Notion style) */}
        <div className="md:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-panel p-8 w-full border border-brand-border/60 hover:shadow-xl hover:translate-y-0" hoverEffect={false}>
              
              {/* Header Logo */}
              <div className="flex items-center space-x-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Activity className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg tracking-tight">HealthSync</h3>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-brand-primary">Enterprise Cloud</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Sign In to Dashboard</h2>
              <p className="text-xs text-brand-muted mb-6">Access the demo hospital operator panel.</p>

              {/* Role Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100/80 border border-brand-border p-1 rounded-lg mb-6">
                {(['admin', 'doctor', 'dev'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      if (r === 'admin') setEmail('admin@healthsync.co');
                      else if (r === 'doctor') setEmail('dr.miller@healthsync.co');
                      else setEmail('dev@healthsync.co');
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all capitalize cursor-pointer ${
                      role === r 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-brand-muted hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full text-sm bg-slate-50/50 border border-brand-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-600">Password</label>
                    <a href="#" className="text-[11px] text-brand-primary font-semibold hover:underline">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-sm bg-slate-50/50 border border-brand-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition text-slate-800"
                  />
                </div>

                {/* Interactive Demo Sign-in Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-semibold relative overflow-hidden"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating System...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Launch Operational Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Bottom Notice */}
              <div className="mt-6 pt-4 border-t border-brand-border/60 flex items-center space-x-2 text-[10px] text-brand-muted leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-brand-secondary shrink-0" />
                <span>Single-Sign On (SSO) active. HIPAA auditing logs initialized on launch.</span>
              </div>

            </Card>
          </motion.div>
        </div>

      </div>

    </div>
  );
}
