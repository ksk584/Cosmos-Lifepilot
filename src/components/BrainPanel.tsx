import React from 'react';
import { motion } from 'framer-motion';
import { Dna, Brain, RefreshCw, CheckCircle2, ChevronRight, Target, Smartphone, TrendingUp } from 'lucide-react';
import type { DigitalTwin, LifeEvent, Resolution } from '../types';
import { TYPE_COLORS } from '../constants';

interface Props {
  twin: DigitalTwin;
  events: LifeEvent[];
  resolutions: Resolution[];
  isLearning: boolean;
  onApplyFix: (res: Resolution) => void;
}

export default function BrainPanel({ twin, events, resolutions, isLearning, onApplyFix }: Props) {
  const recentDecisions = twin.learningMetrics.decisionHistory.slice(-5).reverse();
  const recentDelays = twin.learningMetrics.delayHistory.slice(-5).reverse();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Twin Identity */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden text-center"
        style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        <div className={`w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 ${isLearning ? 'neural-glow' : ''}`}>
          <Dna className={`text-purple-400 ${isLearning ? 'animate-pulse' : ''}`} size={32} />
        </div>
        <h2 className="text-2xl font-black gradient-text">Digital Twin</h2>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
          {isLearning ? '⚡ Syncing neural weights...' : 'Neural Optimization Engine'}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Efficiency', value: `${twin.dailyEfficiencyScore}%` },
            { label: 'Buffer Pref', value: `${twin.learningMetrics.preferredBuffer}m` },
            { label: 'Fix Style', value: twin.learningMetrics.fixPreference },
          ].map(({ label, value }) => (
            <div key={label} className="glass-panel rounded-xl py-2 px-1">
              <p className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-black text-white capitalize mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Weights */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Neural Weights</p>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Priority</p>
        </div>
        {Object.entries(twin.learningMetrics.priorityWeights).map(([type, weight], i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="space-y-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2 capitalize">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[type] || '#fff' }} />
                {type}
              </span>
              <span className="font-mono text-xs font-bold text-blue-400">{weight}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${TYPE_COLORS[type] || '#3b82f6'}60, ${TYPE_COLORS[type] || '#3b82f6'})` }}
                initial={{ width: 0 }}
                animate={{ width: `${weight}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cascade Resolver */}
      <div className="space-y-3">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] px-1">Cascade Resolver</p>
        {resolutions.length === 0 ? (
          <div className="glass-panel rounded-3xl py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-emerald-400" size={28} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Clear</p>
          </div>
        ) : (
          resolutions.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel rounded-2xl p-4 flex items-center gap-3 group hover:bg-white/[0.03] transition-all border border-white/5"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                res.type === 'trim' ? 'bg-emerald-500/10 text-emerald-400' :
                res.type === 'shift' ? 'bg-blue-500/10 text-blue-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {res.type === 'trim' ? <Smartphone size={14} /> : res.type === 'shift' ? <RefreshCw size={14} /> : <Target size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{res.title}</p>
                  {res.type === twin.learningMetrics.fixPreference && (
                    <span className="text-[7px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-black">AI Pick</span>
                  )}
                </div>
                <p className="text-sm font-bold text-white leading-snug">{res.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={9} className="text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400">+{res.healthDelta} health</span>
                </div>
              </div>
              <button
                onClick={() => onApplyFix(res)}
                className="w-10 h-10 glass-panel border-white/10 text-white rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-blue-500 hover:border-blue-400 flex-shrink-0"
              >
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Learning Log */}
      {(recentDecisions.length > 0 || recentDelays.length > 0) && (
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-purple-400" />
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Learning Log</p>
          </div>
          <div className="space-y-2">
            {recentDecisions.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="text-purple-400">→</span>
                <span className="text-slate-400">Applied <span className="text-white font-bold">{d.type}</span> fix on <span className="text-slate-300">{d.eventLabel}</span></span>
              </div>
            ))}
            {recentDelays.map((d, i) => (
              <div key={`d-${i}`} className="flex items-center gap-2 text-[10px]">
                <span className="text-amber-400">⏱</span>
                <span className="text-slate-400">Logged +{d.minutes}m delay on <span className="text-slate-300">{d.eventType}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
