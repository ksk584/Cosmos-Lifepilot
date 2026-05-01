import React from 'react';
import { motion } from 'framer-motion';
import { Battery, Coffee, Target, Zap, TrendingDown } from 'lucide-react';
import type { EnergyState, LifeEvent } from '../types';
import { TYPE_COLORS } from '../constants';

interface Props {
  energy: EnergyState;
  events: LifeEvent[];
  currentTimeMins: number;
}

const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  break:   <Coffee size={16} />,
  focus:   <Target size={16} />,
  hydrate: <Zap size={16} />,
  move:    <Zap size={16} />,
};

const SUGGESTION_COLORS: Record<string, string> = {
  break:   '#f59e0b',
  focus:   '#3b82f6',
  hydrate: '#06b6d4',
  move:    '#10b981',
};

export default function EnergyPanel({ energy, events, currentTimeMins }: Props) {
  const metrics = [
    {
      label: 'Fatigue',
      value: energy.fatigueScore,
      color: energy.fatigueScore > 70 ? '#ef4444' : energy.fatigueScore > 40 ? '#f59e0b' : '#10b981',
      icon: <TrendingDown size={14} />,
      description: energy.fatigueScore > 70 ? 'High — rest recommended' : energy.fatigueScore > 40 ? 'Moderate' : 'Low — you\'re good',
    },
    {
      label: 'Overload',
      value: energy.overloadScore,
      color: energy.overloadScore > 60 ? '#ef4444' : energy.overloadScore > 30 ? '#f59e0b' : '#10b981',
      icon: <Battery size={14} />,
      description: energy.overloadScore > 60 ? 'Too many events ahead' : energy.overloadScore > 30 ? 'Manageable load' : 'Schedule is breathable',
    },
    {
      label: 'Focus',
      value: energy.focusScore,
      color: energy.focusScore > 70 ? '#10b981' : energy.focusScore > 40 ? '#f59e0b' : '#ef4444',
      icon: <Target size={14} />,
      description: energy.focusScore > 70 ? 'Peak focus window' : energy.focusScore > 40 ? 'Partial focus available' : 'Low focus capacity',
    },
  ];

  // Build energy timeline (energy cost per event as colored bars)
  const dayStart = 420;
  const dayEnd = 1440;
  const dayRange = dayEnd - dayStart;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Metric cards */}
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: m.color + '15', color: m.color }}>
                  {m.icon}
                </div>
                <span className="text-sm font-bold text-white">{m.label}</span>
              </div>
              <span className="text-xl font-black font-mono" style={{ color: m.color }}>{m.value}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${m.color}60, ${m.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">{m.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Energy Timeline */}
      <div className="glass-panel rounded-3xl p-5">
        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4">Energy Map</p>
        <div className="relative h-8">
          {events.map(ev => {
            const left = ((ev.startTime - dayStart) / dayRange) * 100;
            const width = (ev.duration / dayRange) * 100;
            const isPast = ev.startTime + ev.duration <= currentTimeMins;
            const isNow = ev.startTime <= currentTimeMins && currentTimeMins < ev.startTime + ev.duration;
            const cost = ev.energyCost;
            const color = cost < 0 ? '#10b981' : cost > 70 ? '#ef4444' : cost > 40 ? '#f59e0b' : '#3b82f6';

            return (
              <div
                key={ev.id}
                title={`${ev.label} (${cost > 0 ? '+' : ''}${cost} energy)`}
                className="absolute top-0 h-full rounded-md transition-all"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: color + (isPast ? '30' : isNow ? 'cc' : '60'),
                  border: isNow ? `1px solid ${color}` : 'none',
                }}
              />
            );
          })}

          {/* Current time needle */}
          {currentTimeMins >= dayStart && currentTimeMins <= dayEnd && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_white] z-10"
              style={{ left: `${((currentTimeMins - dayStart) / dayRange) * 100}%` }}
            />
          )}
        </div>

        <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-2">
          <span>07:00</span><span>12:00</span><span>18:00</span><span>00:00</span>
        </div>

        <div className="flex items-center gap-4 mt-3">
          {[['#10b981', 'Restoring'], ['#3b82f6', 'Low cost'], ['#f59e0b', 'Medium'], ['#ef4444', 'High drain']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-[9px] font-mono text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {energy.suggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] px-1 mb-3">Optimizations</p>
          <div className="space-y-2.5">
            {energy.suggestions.map((s, i) => {
              const color = SUGGESTION_COLORS[s.type];
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-panel rounded-2xl p-4 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${color}60` }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: color + '15', color }}>
                    {s.icon}
                  </div>
                  <p className="text-sm font-bold text-slate-200">{s.message}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {energy.suggestions.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-2xl mb-2">⚡</p>
          <p className="text-sm font-bold text-emerald-400">Energy Optimized</p>
          <p className="text-[10px] text-slate-500 mt-1">No interventions needed</p>
        </div>
      )}
    </div>
  );
}
