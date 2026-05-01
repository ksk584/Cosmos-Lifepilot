import React from 'react';
import { motion } from 'framer-motion';
import type { ContextState, PassiveAction, AppMode } from '../types';
import { MODE_META } from '../constants';

interface Props {
  context: ContextState;
  mode: AppMode;
  passiveActions: PassiveAction[];
  onExecuteAction: (id: string) => void;
}

const INTENT_COLOR: Record<string, string> = {
  Relaxed: '#10b981',
  Normal:  '#3b82f6',
  Urgent:  '#f59e0b',
  Critical:'#ef4444',
};

export default function ContextPanel({ context, mode, passiveActions, onExecuteAction }: Props) {
  const modeMeta = MODE_META[mode];
  const intentColor = INTENT_COLOR[context.intentState] || '#fff';

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Intent Score Hero */}
      <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ background: `radial-gradient(circle at 50% 0%, ${intentColor}, transparent 70%)` }} />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Intent Score</p>
            <div className="flex items-end gap-2 mt-1">
              <motion.span
                key={context.intentScore}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl font-black tabular-nums"
                style={{ color: intentColor }}
              >
                {context.intentScore}
              </motion.span>
              <span className="text-slate-600 font-bold text-2xl mb-1">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1.5 rounded-xl text-sm font-black uppercase tracking-wide glass-panel"
              style={{ color: intentColor, border: `1px solid ${intentColor}30`, background: `${intentColor}10` }}>
              {context.intentState}
            </div>
            <p className="text-[9px] font-mono text-slate-500 mt-2">{modeMeta.icon} {modeMeta.label}</p>
          </div>
        </div>

        {/* Intent bar */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${intentColor}80, ${intentColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${context.intentScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Live Signals Grid */}
      <div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] px-1 mb-3">Live Signals</p>
        <div className="grid grid-cols-2 gap-2.5">
          {context.signals.map((sig, i) => (
            <motion.div
              key={sig.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-panel rounded-2xl p-3.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base">{sig.icon}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-slate-600">{sig.confidence}%</span>
                </div>
              </div>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{sig.label}</p>
              <p className="text-sm font-bold text-white mt-0.5 truncate">{sig.value}</p>

              {/* Confidence bar */}
              <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500/50 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${sig.confidence}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Passive Actions */}
      {passiveActions.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] px-1 mb-3">Passive Actions</p>
          <div className="space-y-2.5">
            {passiveActions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl flex-shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{action.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{action.description}</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5 uppercase tracking-wider">Trigger: {action.trigger}</p>
                </div>
                <button
                  onClick={() => onExecuteAction(action.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 flex-shrink-0 ${
                    action.executed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                  }`}
                >
                  {action.executed ? 'Done' : 'Run'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {passiveActions.length === 0 && (
        <div className="py-10 text-center text-slate-600 text-sm font-mono">
          No passive actions needed right now
        </div>
      )}
    </div>
  );
}
