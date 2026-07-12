'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  LayoutDashboard, 
  Sparkles, 
  GitMerge, 
  Settings, 
  Search, 
  Bell, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Radio,
  FileText,
  UserCheck
} from 'lucide-react';
import CopilotSidebar from '@/components/CopilotSidebar';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'AI Allergy Alert', desc: 'Patient Sophia Vance has sulfa allergy warning.', type: 'danger', read: false },
    { id: 2, title: 'System Latency Spike', desc: 'EMR API latency exceeded 1.2s in West Wing.', type: 'warning', read: false },
    { id: 3, title: 'Queue Optimized', desc: 'Smart Patient Flow algorithm rerouted 3 cases.', type: 'success', read: true }
  ]);

  const navItems = [
    { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Insights & Predictions', path: '/dashboard/ai-insights', icon: Sparkles },
    { name: 'Smart Patient Flow', path: '/dashboard/patient-flow', icon: GitMerge },
    { name: 'Enterprise Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const activeNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 w-full h-16 bg-white border-b border-brand-border z-30 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-brand-primary animate-pulse" />
          <span className="font-bold text-slate-900 tracking-tight text-sm">HealthSync</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-brand-primary"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
          </button>
          <button 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Floating Collapsible Sidebar (Desktop) */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-brand-border z-20"
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-brand-border/60 justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5 overflow-hidden shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            {!sidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-slate-800 text-base tracking-tight"
              >
                HealthSync
              </motion.span>
            )}
          </Link>

          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-brand-muted hover:text-slate-700 transition"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Operational Workspace Tag */}
        {!sidebarCollapsed && (
          <div className="mx-4 mt-4 p-3 bg-slate-50 border border-brand-border/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Enterprise OS</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-700">Hospital Operator</span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive 
                    ? 'bg-brand-primary/10 text-brand-primary' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-brand-primary' : 'text-slate-400'
                }`} />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out / Footer */}
        <div className="p-3 border-t border-brand-border/60">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-brand-danger hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>SSO Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm">
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-[260px] h-full bg-white flex flex-col p-4 border-r border-brand-border"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-brand-primary" />
                  <span className="font-bold text-slate-800">HealthSync Portal</span>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-semibold ${
                        isActive 
                          ? 'bg-brand-primary/10 text-brand-primary' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-semibold text-brand-danger hover:bg-red-50 transition mt-auto"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>SSO Logout</span>
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Frame */}
      <motion.div
        animate={{ 
          paddingLeft: sidebarCollapsed ? '80px' : '260px',
          paddingRight: copilotOpen ? '380px' : '0px'
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="w-full flex flex-col min-h-screen transition-all"
      >
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-10 w-full h-16 bg-white/80 backdrop-blur-md border-b border-brand-border/60 px-6 flex items-center justify-between">
          
          {/* Header Left: Search & Quick Command */}
          <div className="flex items-center space-x-4 max-w-md w-full">
            <div className="relative w-full hidden md:block">
              <input
                type="text"
                placeholder="Search patient EMR, clinics, or run system command (⌘K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            </div>
            <div className="md:hidden h-10 w-10 flex items-center justify-center">
              {/* placeholder left spacing mobile */}
            </div>
          </div>

          {/* Header Right: System stats, alerts, Copilot toggle */}
          <div className="flex items-center space-x-4">
            
            {/* Live Uptime Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-50 border border-brand-border px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-brand-secondary animate-pulse" />
              <span className="text-slate-600">Enterprise API Uptime</span>
              <span className="text-brand-secondary">99.98%</span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {activeNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-danger animate-ping"></span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-brand-border rounded-xl shadow-xl z-30 p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-xs text-slate-800">Operational Alerts ({activeNotificationCount})</span>
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-brand-primary font-semibold hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-2.5 rounded-lg border text-xs flex gap-2 ${
                              !notif.read ? 'bg-slate-50/80' : 'bg-white opacity-60'
                            } ${
                              notif.type === 'danger' ? 'border-red-100' :
                              notif.type === 'warning' ? 'border-amber-100' :
                              'border-emerald-100'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <span className={`h-2 w-2 rounded-full block ${
                                notif.type === 'danger' ? 'bg-brand-danger' :
                                notif.type === 'warning' ? 'bg-brand-warning' :
                                'bg-brand-secondary'
                              }`} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-700">{notif.title}</h5>
                              <p className="text-[11px] text-brand-muted mt-0.5">{notif.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Selector */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-brand-border/60">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-xs">
                DM
              </div>
              <div className="hidden xl:block">
                <h4 className="font-semibold text-slate-800 text-xs">Dr. Miller</h4>
                <p className="text-[10px] text-brand-muted">Lead Clinician</p>
              </div>
            </div>

            {/* AI Copilot Pinned Toggle Control */}
            <Button
              variant={copilotOpen ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setCopilotOpen(!copilotOpen)}
              className="text-xs shrink-0 flex items-center space-x-1.5 h-9"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">{copilotOpen ? 'Hide Copilot' : 'Open Copilot'}</span>
            </Button>

          </div>

        </header>

        {/* Dynamic Inner Subpage Content */}
        <main className="flex-1 p-6 md:p-8 mt-16 md:mt-0 relative">
          {children}
        </main>

      </motion.div>

      {/* Persistent AI Clinical Copilot (Right Pinned Panel) */}
      <CopilotSidebar isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

    </div>
  );
}
