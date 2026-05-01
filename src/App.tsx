import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Zap, Dna, Calendar, Brain, Shield, Battery, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { DigitalTwin, LifeEvent, AppAlert, AppMode, Resolution, PassiveAction } from './types';
import { DEFAULT_TWIN, INITIAL_EVENTS, MODE_META } from './constants';
import {
  computeContext, calculateRisk, runDailyPreMortem, generateResolutions,
  recalculateSchedule, computeEnergy, detectMode, generatePassiveActions,
  minutesToTime, calcDayScore,
} from './engine';

import NotificationLayer from './components/NotificationLayer';
import Dashboard from './components/Dashboard';
import ContextPanel from './components/ContextPanel';
import SimulationLab from './components/SimulationLab';
import EnergyPanel from './components/EnergyPanel';
import BrainPanel from './components/BrainPanel';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'dash' | 'context' | 'simulate' | 'energy' | 'brain';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'dash',     label: 'Timeline', Icon: Activity    },
  { id: 'context',  label: 'Context',  Icon: Shield      },
  { id: 'simulate', label: 'Lab',      Icon: FlaskConical },
  { id: 'energy',   label: 'Energy',   Icon: Battery     },
  { id: 'brain',    label: 'Twin',     Icon: Dna         },
];

// ─── Pre-Mortem Modal ─────────────────────────────────────────────────────────

function PreMortemModal({ issueCount, onDismiss }: { issueCount: number; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-sm w-full glass-panel p-8 rounded-[3rem] text-center relative space-y-6"
        style={{ border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 60px rgba(30,58,138,0.3)' }}
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center rotate-6 shadow-2xl shadow-blue-900/50 active-glow">
            <Calendar className="text-white" size={36} />
          </div>
        </div>
        <div className="pt-6 space-y-3">
          <p className="text-[10px] font-mono text-blue-400/70 uppercase tracking-[0.3em]">Morning Briefing</p>
          <h2 className="text-3xl font-black tracking-tight text-white">Day Pre-Mortem</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {issueCount > 0
              ? <>I've detected <span className="text-red-400 font-bold">{issueCount} conflict{issueCount > 1 ? 's' : ''}</span> in today's schedule. Ready to re-thread your temporal architecture?</>
              : <>Your schedule looks <span className="text-emerald-400 font-bold">clean</span>. No conflicts predicted. Execute your day.</>
            }
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-white text-black rounded-2xl font-black text-base hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
        >
          EXECUTE DAY
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── State ──
  const [twin, setTwin] = useState<DigitalTwin>(() => {
    try { const s = localStorage.getItem('lifepilot_twin_v4'); return s ? JSON.parse(s) : DEFAULT_TWIN; }
    catch { return DEFAULT_TWIN; }
  });
  const [events, setEvents] = useState<LifeEvent[]>(INITIAL_EVENTS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>('dash');
  const [isLearning, setIsLearning] = useState(false);
  const [showPreMortem, setShowPreMortem] = useState(true);
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());

  const currentTimeMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  // ── Derived / Computed ──
  const activeEvent = useMemo(
    () => events.find(ev => currentTimeMins >= ev.startTime && currentTimeMins < ev.startTime + ev.duration),
    [events, currentTimeMins]
  );

  const mode = useMemo(() => detectMode(activeEvent, currentTimeMins), [activeEvent, currentTimeMins]);

  const context = useMemo(
    () => computeContext(currentTimeMins, events, twin),
    [currentTimeMins, events, twin]
  );

  const predictedIssues = useMemo(() => runDailyPreMortem(events, twin), [events, twin]);

  const resolutions = useMemo(() => generateResolutions(events, twin), [events, twin]);

  const energy = useMemo(
    () => computeEnergy(events, currentTimeMins, twin),
    [events, currentTimeMins, twin]
  );

  const passiveActions = useMemo(
    () => generatePassiveActions(activeEvent, mode, context).map(a => ({
      ...a,
      executed: executedActions.has(a.id),
    })),
    [activeEvent, mode, context, executedActions]
  );

  // ── Persistence & Learning ──
  const triggerLearning = useCallback(() => {
    setIsLearning(true);
    setTimeout(() => setIsLearning(false), 2500);
  }, []);

  const updateTwin = useCallback((updater: (prev: DigitalTwin) => DigitalTwin) => {
    setTwin(prev => {
      const next = updater(prev);
      try { localStorage.setItem('lifepilot_twin_v4', JSON.stringify(next)); } catch {}
      return next;
    });
    triggerLearning();
  }, [triggerLearning]);

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Recalculate schedule statuses every minute ──
  useEffect(() => {
    setEvents(prev => recalculateSchedule(prev, currentTimeMins, twin));
  }, [currentTimeMins, twin]);

  // ── Autonomous Agent Loop (every 5s) ──
  useEffect(() => {
    const interval = setInterval(() => {
      // Escalate alerts
      if (predictedIssues.length > 0 && alerts.every(a => a.id !== 'premortem')) {
        const severity = predictedIssues[0].severity;
        const level = severity === 'high' ? 'ACTION' : 'FYI';
        setAlerts(prev => [...prev.filter(a => a.id !== 'premortem'), {
          id: 'premortem',
          level,
          message: `${predictedIssues.length} schedule conflict${predictedIssues.length > 1 ? 's' : ''} predicted`,
          detail: `Earliest: ${predictedIssues[0].reason}`,
          timestamp: Date.now(),
        }]);
      } else if (predictedIssues.length === 0) {
        setAlerts(prev => prev.filter(a => a.id !== 'premortem'));
      }

      // Critical alert if next high-stakes event is in < 15 min with a conflict
      const nextExam = events.find(e =>
        (e.type === 'exam' || e.type === 'meeting') &&
        e.startTime > currentTimeMins &&
        e.startTime - currentTimeMins < 15 &&
        e.status === 'critical'
      );
      if (nextExam && alerts.every(a => a.id !== `crit-${nextExam.id}`)) {
        setAlerts(prev => [...prev, {
          id: `crit-${nextExam.id}`,
          level: 'CRITICAL',
          message: `You may miss your ${nextExam.label}!`,
          detail: `Starts in ${nextExam.startTime - currentTimeMins} minutes — check Cascade Resolver`,
          timestamp: Date.now(),
        }]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [predictedIssues, alerts, events, currentTimeMins]);

  // ── Actions ──
  const handleApplyFix = useCallback((res: Resolution) => {
    setEvents(res.applyFix(events));
    updateTwin(prev => ({
      ...prev,
      learningMetrics: {
        ...prev.learningMetrics,
        fixPreference: res.type,
        decisionHistory: [
          ...prev.learningMetrics.decisionHistory,
          { timestamp: Date.now(), type: res.type, eventLabel: res.title },
        ].slice(-20),
      },
    }));
    setAlerts(prev => prev.filter(a => a.id !== 'premortem'));
  }, [events, updateTwin]);

  const handleDelayEvent = useCallback((id: string) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    setEvents(prev => recalculateSchedule(
      prev.map(e => e.id === id ? { ...e, startTime: e.startTime + 5, isSimulated: true } : e),
      currentTimeMins, twin
    ));
    updateTwin(prev => ({
      ...prev,
      avgDelayByType: {
        ...prev.avgDelayByType,
        [ev.type]: (prev.avgDelayByType[ev.type] || 0) + 2,
      },
      learningMetrics: {
        ...prev.learningMetrics,
        delayHistory: [
          ...prev.learningMetrics.delayHistory,
          { timestamp: Date.now(), eventType: ev.type, minutes: 5 },
        ].slice(-20),
      },
    }));
  }, [events, currentTimeMins, twin, updateTwin]);

  const handleUpdateEvent = useCallback((id: string, changes: Partial<LifeEvent>) => {
    setEvents(prev => {
      const updated = prev.map(ev => ev.id === id ? { ...ev, ...changes } : ev);
      return recalculateSchedule(updated, currentTimeMins, twin);
    });
  }, [currentTimeMins, twin]);

  const handleCommitSimulation = useCallback((newEvents: LifeEvent[]) => {
    setEvents(newEvents);
    setActiveTab('dash');
  }, []);

  const handleExecuteAction = useCallback((id: string) => {
    setExecutedActions(prev => new Set([...prev, id]));
  }, []);

  const handleDismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const modeMeta = MODE_META[mode];
  const score = calcDayScore(events);

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden"
      style={{ background: '#020204', backgroundImage: 'radial-gradient(ellipse at 20% 10%, rgba(59,130,246,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)' }}>

      {/* Scanline */}
      <div className="scanline" />

      {/* Neural orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] left-[15%] w-[500px] h-[500px] rounded-full blur-[140px] animate-float" style={{ background: 'rgba(59,130,246,0.06)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full blur-[120px] animate-float" style={{ background: 'rgba(139,92,246,0.05)', animationDelay: '-4s' }} />
      </div>

      {/* 3-Tier Notifications */}
      <NotificationLayer
        alerts={alerts}
        onDismiss={handleDismissAlert}
        onResolve={() => { setActiveTab('brain'); setShowPreMortem(false); }}
      />

      {/* Pre-Mortem Modal */}
      <AnimatePresence>
        {showPreMortem && (
          <PreMortemModal
            issueCount={predictedIssues.length}
            onDismiss={() => {
              setShowPreMortem(false);
              if (predictedIssues.length > 0) setActiveTab('brain');
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3"
        style={{ background: 'rgba(2,2,4,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight gradient-text">LifePilot</h1>
              <Activity size={16} className="text-blue-500" />
              {isLearning && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[8px] px-1.5 py-0.5 bg-purple-600 text-white rounded font-black uppercase"
                >
                  Syncing
                </motion.span>
              )}
            </div>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode badge */}
            <div className="px-2.5 py-1 rounded-xl text-[10px] font-black glass-panel"
              style={{ color: modeMeta.color, borderColor: modeMeta.color + '30', background: modeMeta.color + '10' }}>
              {modeMeta.icon} {mode}
            </div>

            {/* Score ring */}
            <div className="relative w-9 h-9">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <motion.circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke={score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  animate={{ strokeDashoffset: 2 * Math.PI * 14 * (1 - score / 100) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black text-white">{score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dash' && (
              <Dashboard
                events={events}
                activeEvent={activeEvent}
                predictedIssues={predictedIssues}
                currentTimeMins={currentTimeMins}
                twin={twin}
                isLearning={isLearning}
                onDelayEvent={handleDelayEvent}
                onUpdateEvent={handleUpdateEvent}
              />
            )}
            {activeTab === 'context' && (
              <ContextPanel
                context={context}
                mode={mode}
                passiveActions={passiveActions}
                onExecuteAction={handleExecuteAction}
              />
            )}
            {activeTab === 'simulate' && (
              <SimulationLab
                events={events}
                twin={twin}
                onCommit={handleCommitSimulation}
              />
            )}
            {activeTab === 'energy' && (
              <EnergyPanel
                energy={energy}
                events={events}
                currentTimeMins={currentTimeMins}
              />
            )}
            {activeTab === 'brain' && (
              <BrainPanel
                twin={twin}
                events={events}
                resolutions={resolutions}
                isLearning={isLearning}
                onApplyFix={handleApplyFix}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ padding: '0 1rem 1.25rem' }}>
        <motion.nav
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-lg mx-auto pointer-events-auto glass-panel rounded-full px-2 py-2 flex gap-1"
          style={{ backdropFilter: 'blur(40px) saturate(200%)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-full transition-all relative"
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
                />
              )}
              <tab.Icon
                size={18}
                className={`relative z-10 transition-colors ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500'}`}
              />
              <span className={`text-[8px] font-black uppercase tracking-wider relative z-10 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-slate-600'}`}>
                {tab.label}
              </span>
              {/* Badge for alerts */}
              {tab.id === 'brain' && resolutions.length > 0 && (
                <div className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {tab.id === 'context' && context.intentState === 'Critical' && (
                <div className="absolute top-1.5 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </motion.nav>
      </div>
    </div>
  );
}
