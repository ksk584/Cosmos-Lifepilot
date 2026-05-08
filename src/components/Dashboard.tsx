import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap, Clock, Check, X, Edit2, Plus, Trash2 } from 'lucide-react';
import type { LifeEvent, DigitalTwin, PredictedIssue } from '../types';
import { minutesToTime, calcDayScore } from '../engine';
import { TYPE_COLORS } from '../constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditState {
  id: string;
  field: 'label' | 'startTime';
  value: string;
}

interface Props {
  events: LifeEvent[];
  activeEvent: LifeEvent | undefined;
  predictedIssues: PredictedIssue[];
  currentTimeMins: number;
  twin: DigitalTwin;
  isLearning: boolean;
  onDelayEvent: (id: string) => void;
  onUpdateEvent: (id: string, changes: Partial<LifeEvent>) => void;
  onAddEvent: (newEvent: Omit<LifeEvent, 'id' | 'status'>) => void;
  onDeleteEvent: (id: string) => void;
}

// ─── Default Mappings for New Events ──────────────────────────────────────────

const TYPE_DEFAULTS = {
  study: { icon: '📚', priority: 60, energyCost: 40 },
  meeting: { icon: '👥', priority: 80, energyCost: 50 },
  travel: { icon: '🚗', priority: 70, energyCost: 20 },
  personal: { icon: '☕', priority: 30, energyCost: -20 },
  exam: { icon: '📝', priority: 100, energyCost: 90 },
  class: { icon: '🎓', priority: 70, energyCost: 50 },
  health: { icon: '💪', priority: 60, energyCost: 60 },
  sleep: { icon: '🌙', priority: 90, energyCost: -100 }
};

function AddEventModal({ onAdd, onClose }: { onAdd: (e: Omit<LifeEvent, 'id' | 'status'>) => void; onClose: () => void }) {
  const [label, setLabel] = useState('New Event');
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<LifeEvent['type']>('personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [h, m] = time.split(':').map(Number);
    const startTime = h * 60 + m;
    onAdd({
      label,
      startTime,
      duration,
      type,
      ...TYPE_DEFAULTS[type]
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm glass-panel p-6 rounded-3xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-white text-lg">Add Custom Event</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Label</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration (m)</label>
              <input type="number" value={duration} min={5} step={5} onChange={e => setDuration(parseInt(e.target.value))} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-[#1a1b23] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none">
              {Object.keys(TYPE_DEFAULTS).map(t => (
                <option key={t} value={t}>{TYPE_DEFAULTS[t as keyof typeof TYPE_DEFAULTS].icon} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black mt-2 transition-colors">Add to Timeline</button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Helper: detect conflicts (events that overlap with at least one other) ───

function getConflictingIds(events: LifeEvent[]): Set<string> {
  const conflicting = new Set<string>();
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.startTime + cur.duration > next.startTime) {
      conflicting.add(cur.id);
      conflicting.add(next.id);
    }
  }
  return conflicting;
}

// ─── Sub-component: Inline Label Editor ──────────────────────────────────────

function LabelEditor({
  event,
  isEditing,
  editValue,
  onStart,
  onChange,
  onCommit,
  onCancel,
}: {
  event: LifeEvent;
  isEditing: boolean;
  editValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isEditing) ref.current?.focus(); }, [isEditing]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={ref}
          value={editValue}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel(); }}
          className="flex-1 bg-white/10 border border-blue-500/50 rounded-lg px-2 py-0.5 text-sm font-bold text-white outline-none focus:border-blue-400 min-w-0"
          style={{ maxWidth: 160 }}
        />
        <button onClick={onCommit} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Check size={12} /></button>
        <button onClick={onCancel} className="text-red-400 hover:text-red-300 transition-colors"><X size={12} /></button>
      </div>
    );
  }

  return (
    <div
      className="group/label flex items-center gap-1.5 cursor-text"
      onClick={onStart}
      title="Click to edit label"
    >
      <p className="font-bold text-white text-sm truncate group-hover/label:text-blue-300 transition-colors">
        {event.label}
      </p>
      <Edit2 size={10} className="text-slate-600 group-hover/label:text-blue-400 opacity-0 group-hover/label:opacity-100 transition-all flex-shrink-0" />
    </div>
  );
}

// ─── Sub-component: Inline Time Editor ───────────────────────────────────────

function TimeEditor({
  event,
  isEditing,
  editValue,
  onStart,
  onChange,
  onCommit,
  onCancel,
}: {
  event: LifeEvent;
  isEditing: boolean;
  editValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isEditing) ref.current?.focus(); }, [isEditing]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <input
          ref={ref}
          type="time"
          value={editValue}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel(); }}
          onBlur={onCommit}
          className="bg-white/10 border border-blue-500/50 rounded-md px-1.5 py-0.5 text-[10px] font-mono text-blue-300 outline-none focus:border-blue-400"
          style={{ colorScheme: 'dark' }}
        />
      </div>
    );
  }

  return (
    <div
      className="group/time flex items-center gap-1 cursor-pointer"
      onClick={onStart}
      title="Click to edit start time"
    >
      <span className="text-[9px] font-mono text-slate-500 group-hover/time:text-blue-400 transition-colors">
        {minutesToTime(event.startTime)} – {minutesToTime(event.startTime + event.duration)}
      </span>
      <Edit2 size={8} className="text-slate-700 group-hover/time:text-blue-400 opacity-0 group-hover/time:opacity-100 transition-all" />
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function Dashboard({
  events,
  activeEvent,
  predictedIssues,
  currentTimeMins,
  twin,
  isLearning,
  onDelayEvent,
  onUpdateEvent,
  onAddEvent,
  onDeleteEvent,
}: Props) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Refs for auto-scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // ── Conflict detection (recalculated on every event change) ──
  const conflictingIds = useMemo(() => getConflictingIds(events), [events]);

  // ── Score ──
  const score = useMemo(() => calcDayScore(events), [events]);

  // ── Auto-scroll to active event when it changes ──
  useEffect(() => {
    if (!activeRef.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const el = activeRef.current;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTarget = el.offsetTop - container.offsetTop - (containerRect.height / 2) + (elRect.height / 2);
    container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, [activeEvent?.id]);

  // ── Edit helpers ──
  const startEdit = useCallback((id: string, field: EditState['field'], currentValue: string) => {
    setEditState({ id, field, value: currentValue });
  }, []);

  const commitEdit = useCallback(() => {
    if (!editState) return;
    const { id, field, value } = editState;

    if (field === 'label') {
      const trimmed = value.trim();
      if (trimmed) onUpdateEvent(id, { label: trimmed });
    } else if (field === 'startTime') {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        onUpdateEvent(id, { startTime: h * 60 + m });
      }
    }
    setEditState(null);
  }, [editState, onUpdateEvent]);

  const cancelEdit = useCallback(() => setEditState(null), []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Day Health Score ─────────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at 80% 50%, ${score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'}, transparent 70%)` }}
        />
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Day Health Score</p>
            <div className="flex items-end gap-3">
              <motion.span
                key={score}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-5xl font-black tabular-nums ${score > 70 ? 'text-emerald-400' : score > 40 ? 'text-amber-400' : 'text-red-400'}`}
              >
                {score}
              </motion.span>
              <span className="text-2xl text-slate-600 font-bold mb-1">/100</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {predictedIssues.length > 0
                ? `⚠️ ${predictedIssues.length} conflict${predictedIssues.length > 1 ? 's' : ''} predicted`
                : '✅ Temporal architecture clear'}
            </p>
          </div>
          <div className="flex-shrink-0 w-20 h-20 relative">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle
                cx="40" cy="40" r="32"
                fill="none"
                stroke={score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - score / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
              {score}%
            </div>
          </div>
        </div>

        {/* Breathing space bar */}
        <div className="mt-4 space-y-1">
          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Breathing Space</p>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            {events.map((ev, i) => {
              const next = events[i + 1];
              const gap = next ? next.startTime - (ev.startTime + ev.duration) : 60;
              const totalSpan = events[events.length - 1].startTime + events[events.length - 1].duration - events[0].startTime;
              const evW = (ev.duration / totalSpan) * 100;
              const gapW = gap > 0 ? (gap / totalSpan) * 100 : 0;
              const isActive = ev.id === activeEvent?.id;
              return (
                <React.Fragment key={ev.id}>
                  <motion.div
                    className="h-full rounded-sm flex-shrink-0"
                    animate={{ opacity: isActive ? 1 : 0.5 }}
                    style={{ width: `${evW}%`, backgroundColor: TYPE_COLORS[ev.type] }}
                    title={ev.label}
                  />
                  {next && gapW > 0 && (
                    <div className="h-full flex-shrink-0 bg-white/5" style={{ width: `${gapW}%` }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Neural Timeline ───────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Neural Timeline</p>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 hover:bg-blue-500/20 transition-colors uppercase tracking-wide">
            <Plus size={10} /> Add Event
          </button>
        </div>

        {/* Scrollable container with auto-scroll */}
        <div
          ref={scrollContainerRef}
          className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar"
        >
          {events.map((ev, idx) => {
            const next = events[idx + 1];
            const gap = next ? next.startTime - (ev.startTime + ev.duration) : 0;
            const isConflict = conflictingIds.has(ev.id);
            const isActive = ev.id === activeEvent?.id;
            const isPast = ev.startTime + ev.duration < currentTimeMins;
            const isFuture = ev.startTime > currentTimeMins;

            const progress = isActive
              ? Math.min(100, Math.round(((currentTimeMins - ev.startTime) / ev.duration) * 100))
              : 0;

            const isEditingLabel = editState?.id === ev.id && editState?.field === 'label';
            const isEditingTime  = editState?.id === ev.id && editState?.field === 'startTime';

            return (
              <React.Fragment key={ev.id}>
                {/* Timeline Event Card */}
                <div ref={isActive ? activeRef : undefined}>
                  <motion.div
                    layout
                    transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
                    className={`relative overflow-hidden rounded-2xl flex items-center gap-3 p-3.5 transition-colors duration-300 ${
                      isConflict
                        ? 'border border-red-500/50 bg-red-500/5'
                        : isActive
                        ? 'border border-transparent'
                        : isPast
                        ? 'border border-white/[0.04] opacity-60'
                        : 'border border-white/[0.06] hover:bg-white/[0.03]'
                    }`}
                    style={{
                      background: isConflict
                        ? 'rgba(239,68,68,0.06)'
                        : isActive
                        ? 'rgba(15,20,30,0.7)'
                        : undefined,
                    }}
                  >
                    {/* ── Active Glow: travelling neon glow using layoutId ── */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="active-glow-ring"
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          style={{
                            boxShadow: 'inset 0 0 0 1.5px rgba(34,211,238,0.5), 0 0 20px rgba(34,211,238,0.15), 0 0 40px rgba(34,211,238,0.07)',
                          }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Active progress fill */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-y-0 left-0 pointer-events-none rounded-l-2xl"
                        style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.08), transparent)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    )}

                    {/* Left status stripe */}
                    {isActive && (
                      <motion.div
                        layoutId="active-stripe"
                        className="absolute left-0 inset-y-0 w-[3px] rounded-l-2xl"
                        style={{ background: 'linear-gradient(180deg, #22d3ee, #3b82f6)' }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        exit={{ scaleY: 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                    {isConflict && !isActive && (
                      <div className="absolute left-0 inset-y-0 w-[3px] rounded-l-2xl bg-red-500" />
                    )}

                    {/* Icon + Live dot */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                          isActive ? 'bg-cyan-500/10' : isPast ? 'bg-white/[0.02]' : 'bg-white/[0.03]'
                        }`}
                        style={{ border: `1px solid ${TYPE_COLORS[ev.type]}${isActive ? '60' : '25'}` }}
                      >
                        {ev.icon}
                      </div>
                      {/* Pulsing LIVE indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"
                              style={{ boxShadow: '0 0 6px #22d3ee' }}
                            />
                          </span>
                        </div>
                      )}
                      {/* Conflict badge */}
                      {isConflict && !isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-[6px] font-black text-white">!</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {/* Time row (editable) */}
                      <TimeEditor
                        event={ev}
                        isEditing={isEditingTime}
                        editValue={editState?.value ?? minutesToTime(ev.startTime)}
                        onStart={() => !ev.isLocked && startEdit(ev.id, 'startTime', minutesToTime(ev.startTime))}
                        onChange={v => setEditState(s => s ? { ...s, value: v } : null)}
                        onCommit={commitEdit}
                        onCancel={cancelEdit}
                      />

                      {/* Label row (editable) */}
                      <LabelEditor
                        event={ev}
                        isEditing={isEditingLabel}
                        editValue={editState?.value ?? ev.label}
                        onStart={() => !ev.isLocked && startEdit(ev.id, 'label', ev.label)}
                        onChange={v => setEditState(s => s ? { ...s, value: v } : null)}
                        onCommit={commitEdit}
                        onCancel={cancelEdit}
                      />

                      {/* Active progress text */}
                      {isActive && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: 'linear-gradient(90deg, #22d3ee, #3b82f6)' }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-cyan-400">{progress}%</span>
                        </div>
                      )}

                      {/* Flags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ev.isSimulated && (
                          <span className="text-[7px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/20 uppercase font-bold">Sim</span>
                        )}
                        {isConflict && (
                          <span className="text-[7px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/20 uppercase font-bold">Temporal Conflict</span>
                        )}
                        {ev.isLocked && (
                          <span className="text-[7px] px-1 py-0.5 bg-white/5 text-slate-600 rounded border border-white/5 uppercase font-bold">Locked</span>
                        )}
                        {isActive && (
                          <span className="text-[7px] px-1 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20 uppercase font-bold">● Live</span>
                        )}
                      </div>
                    </div>

                    {/* Right: status + delay */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                        isConflict                   ? 'text-red-400 bg-red-400/10'     :
                        ev.status === 'smooth'       ? 'text-emerald-400 bg-emerald-400/10' :
                        ev.status === 'watch'        ? 'text-amber-400 bg-amber-400/10'     :
                        ev.status === 'conflict'     ? 'text-orange-400 bg-orange-400/10'   :
                                                       'text-red-400 bg-red-400/10'
                      }`}>
                        {isConflict ? 'conflict' : ev.status}
                      </div>

                      {!ev.isLocked && (
                        <div className="flex gap-1">
                          {isActive && (
                            <button
                              onClick={() => onDelayEvent(ev.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-all text-[9px] font-bold"
                            >
                              <Clock size={9} /> +5m
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteEvent(ev.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                            title="Delete event"
                          >
                            <Trash2 size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Gap indicator */}
                {next && (
                  <div className="relative h-5 flex items-center justify-center">
                    <div className="absolute inset-y-0 w-px bg-slate-800/60 left-1/2" />
                    {gap < 20 && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`relative z-10 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 glass-panel ${
                          gap < 0
                            ? 'text-red-400 border-red-500/30 bg-red-500/10'
                            : 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                        }`}
                      >
                        {gap < 0 ? <AlertTriangle size={8} /> : <Zap size={8} />}
                        {gap < 0 ? `OVERLAP ${Math.abs(gap)}m` : `TIGHT ${gap}m`}
                      </motion.div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {showAddModal && <AddEventModal onAdd={onAddEvent} onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
