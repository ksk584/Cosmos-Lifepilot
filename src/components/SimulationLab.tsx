import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, RotateCcw, TrendingUp, TrendingDown, Zap, X } from 'lucide-react';
import type { LifeEvent, DigitalTwin, SimulationParams, SimulationResult } from '../types';
import { runSimulation, minutesToTime, calcDayScore } from '../engine';
import { TYPE_COLORS } from '../constants';

interface Props {
  events: LifeEvent[];
  twin: DigitalTwin;
  onCommit: (events: LifeEvent[]) => void;
}

const DEFAULT_PARAMS: SimulationParams = {
  leaveTimeOffset: 0,
  skippedEventIds: [],
  routeMultiplier: 1.0,
};

export default function SimulationLab({ events, twin, onCommit }: Props) {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runSimulation(events, params, twin);
      setResult(res);
      setIsRunning(false);
    }, 600);
  }, [events, params, twin]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setResult(null);
  };

  const toggleSkip = (id: string) => {
    setParams(p => ({
      ...p,
      skippedEventIds: p.skippedEventIds.includes(id)
        ? p.skippedEventIds.filter(x => x !== id)
        : [...p.skippedEventIds, id],
    }));
    setResult(null);
  };

  const displayEvents = result ? result.events : events;
  const originalScore = calcDayScore(events);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Header */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <RefreshCw size={100} className="animate-spin-slow" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-blue-400" />
            <h2 className="text-lg font-black">What-If Lab</h2>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Simulate decisions and see full-day ripple effects before committing.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel rounded-3xl p-5 space-y-5">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Simulation Controls</p>

        {/* Leave time slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">Leave Time Offset</span>
            <span className={`text-sm font-black font-mono ${params.leaveTimeOffset > 0 ? 'text-red-400' : params.leaveTimeOffset < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {params.leaveTimeOffset > 0 ? `+${params.leaveTimeOffset}m late` : params.leaveTimeOffset < 0 ? `${params.leaveTimeOffset}m early` : 'On time'}
            </span>
          </div>
          <input
            type="range" min={-30} max={60} step={5}
            value={params.leaveTimeOffset}
            onChange={e => { setParams(p => ({ ...p, leaveTimeOffset: +e.target.value })); setResult(null); }}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-600">
            <span>-30m early</span><span>on time</span><span>+60m late</span>
          </div>
        </div>

        {/* Route multiplier */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">Route Condition</span>
            <span className={`text-sm font-black font-mono ${params.routeMultiplier > 1.2 ? 'text-red-400' : params.routeMultiplier > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {params.routeMultiplier === 1 ? 'Clear' : params.routeMultiplier <= 1.2 ? 'Slow' : 'Heavy Traffic'}
            </span>
          </div>
          <input
            type="range" min={1.0} max={2.0} step={0.1}
            value={params.routeMultiplier}
            onChange={e => { setParams(p => ({ ...p, routeMultiplier: +e.target.value })); setResult(null); }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-600">
            <span>Clear road</span><span>Normal</span><span>2× traffic</span>
          </div>
        </div>

        {/* Skip events */}
        <div className="space-y-2">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Skip Events</p>
          <div className="flex flex-wrap gap-2">
            {events.filter(e => !e.isLocked).map(ev => (
              <button
                key={ev.id}
                onClick={() => toggleSkip(ev.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                  params.skippedEventIds.includes(ev.id)
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 line-through opacity-60'
                    : 'bg-white/[0.04] text-slate-300 border-white/[0.06] hover:border-white/20'
                }`}
              >
                {ev.icon} {ev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            {isRunning
              ? <><RefreshCw size={16} className="animate-spin" /> Simulating...</>
              : <><Play size={16} /> Run Simulation</>
            }
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Delta summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Health Δ',
                  value: `${result.healthDelta >= 0 ? '+' : ''}${result.healthDelta}`,
                  sub: `${originalScore} → ${originalScore + result.healthDelta}`,
                  color: result.healthDelta >= 0 ? '#10b981' : '#ef4444',
                  Icon: result.healthDelta >= 0 ? TrendingUp : TrendingDown,
                },
                {
                  label: 'Conflicts',
                  value: `${result.newConflictCount}`,
                  sub: `${result.resolvedConflictCount > 0 ? `${result.resolvedConflictCount} resolved` : 'unchanged'}`,
                  color: result.newConflictCount === 0 ? '#10b981' : result.newConflictCount > 2 ? '#ef4444' : '#f59e0b',
                  Icon: Zap,
                },
                {
                  label: 'Affected',
                  value: `${result.affectedEvents.length}`,
                  sub: 'events rippled',
                  color: '#3b82f6',
                  Icon: RefreshCw,
                },
              ].map(({ label, value, sub, color, Icon }) => (
                <div key={label} className="glass-panel rounded-2xl p-3 text-center">
                  <Icon size={14} className="mx-auto mb-1" style={{ color }} />
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className="text-xl font-black mt-0.5" style={{ color }}>{value}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Ripple timeline */}
            <div className="glass-panel rounded-3xl p-4 space-y-2">
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-3">Ripple Effect</p>
              {result.events.map(ev => {
                const original = events.find(e => e.id === ev.id);
                const shifted = original && ev.startTime !== original.startTime;
                const skipped = !result.events.find(e => e.id === ev.id);
                return (
                  <div key={ev.id} className={`flex items-center gap-3 py-1.5 px-2 rounded-xl transition-all ${ev.isSimulated ? 'bg-purple-500/5 border border-purple-500/10' : ''}`}>
                    <span className="text-sm">{ev.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${ev.isSimulated ? 'text-purple-300' : 'text-slate-300'}`}>{ev.label}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[10px] font-mono ${ev.isSimulated ? 'text-purple-400' : 'text-slate-500'}`}>
                        {minutesToTime(ev.startTime)}
                        {original && shifted && <span className="text-[9px] text-slate-600 ml-1">(was {minutesToTime(original.startTime)})</span>}
                      </p>
                    </div>
                    {ev.isSimulated && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 animate-pulse" />}
                  </div>
                );
              })}
            </div>

            {/* Commit / Discard */}
            <div className="flex gap-3">
              <button
                onClick={() => onCommit(result.events)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95"
              >
                ✓ Commit Changes
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 glass-panel text-slate-400 hover:text-white rounded-2xl font-bold text-sm transition-all"
              >
                ✕ Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
