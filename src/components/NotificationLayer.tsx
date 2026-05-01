import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Zap, Info } from 'lucide-react';
import type { AppAlert } from '../types';

interface Props {
  alerts: AppAlert[];
  onDismiss: (id: string) => void;
  onResolve: () => void;
}

export default function NotificationLayer({ alerts, onDismiss, onResolve }: Props) {
  const critical = alerts.find(a => a.level === 'CRITICAL');
  const nonCritical = alerts.filter(a => a.level !== 'CRITICAL');

  return (
    <>
      {/* Tier 3 — CRITICAL full-screen overlay */}
      <AnimatePresence>
        {critical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="w-full max-w-sm glass-panel rounded-[2rem] overflow-hidden shadow-2xl"
              style={{ border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 60px rgba(239,68,68,0.25)' }}
            >
              {/* Pulsing red header */}
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="bg-red-500/20 p-6 text-center border-b border-red-500/20"
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center mx-auto mb-3"
                >
                  <AlertTriangle className="text-red-400" size={32} />
                </motion.div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Critical Alert</p>
                <p className="text-xl font-black text-white mt-1">{critical.message}</p>
                {critical.detail && <p className="text-sm text-red-300/80 mt-1">{critical.detail}</p>}
              </motion.div>

              <div className="p-6 space-y-3">
                <button
                  onClick={onResolve}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-red-900/30"
                >
                  RESOLVE NOW
                </button>
                <button
                  onClick={() => onDismiss(critical.id)}
                  className="w-full py-3 text-slate-400 hover:text-white text-sm font-bold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier 1 & 2 — Toast banners */}
      <div className="fixed top-4 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {nonCritical.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ y: -60, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.92 }}
              className="pointer-events-auto w-full max-w-lg"
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                  alert.level === 'ACTION'
                    ? 'bg-amber-950/50 border-amber-500/30'
                    : 'bg-slate-900/70 border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.level === 'ACTION' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}>
                  {alert.level === 'ACTION' ? <Zap size={14} className="text-amber-400" /> : <Info size={14} className="text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${alert.level === 'ACTION' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {alert.level === 'ACTION' ? 'Action Required' : 'FYI'}
                  </p>
                  <p className="text-sm font-bold text-white truncate">{alert.message}</p>
                </div>
                {alert.level === 'ACTION' && (
                  <button
                    onClick={onResolve}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-all flex-shrink-0"
                  >
                    FIX
                  </button>
                )}
                <button onClick={() => onDismiss(alert.id)} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
