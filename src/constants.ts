import type { DigitalTwin, LifeEvent } from './types';

// ─── Default Digital Twin ───────────────────────────────────────────────────────

export const DEFAULT_TWIN: DigitalTwin = {
  baseWakeTime: '07:00',
  baseSleepTime: '23:30',
  commuteHabitDelay: 5,
  dailyEfficiencyScore: 85,
  stressThreshold: 70,
  onboarded: true,
  learningMetrics: {
    preferredBuffer: 15,
    ignoreRate: 0.05,
    priorityWeights: {
      exam: 100,
      meeting: 80,
      class: 60,
      study: 50,
      travel: 30,
      health: 20,
      personal: 10,
      sleep: 90,
    },
    fixPreference: 'trim',
    decisionHistory: [],
    delayHistory: [],
  },
  avgDelayByType: { travel: 5, health: 0, personal: 0, study: 0, exam: 0, meeting: 2, class: 0, sleep: 0 },
};

// ─── Initial Schedule ──────────────────────────────────────────────────────────

export const INITIAL_EVENTS: LifeEvent[] = [
  { id: '1',  startTime: 420,  label: 'Wake Up',              duration: 30,  type: 'personal', status: 'smooth', icon: '☀️', priority: 95, energyCost: 5,  isLocked: true },
  { id: '2',  startTime: 450,  label: 'Morning Run',          duration: 45,  type: 'health',   status: 'smooth', icon: '🏃', priority: 70, energyCost: 40 },
  { id: '3',  startTime: 510,  label: 'Commute to College',   duration: 35,  type: 'travel',   status: 'watch',  icon: '🚌', priority: 80, energyCost: 20 },
  { id: '4',  startTime: 555,  label: 'Physics Exam',         duration: 120, type: 'exam',     status: 'smooth', icon: '📝', priority: 100, energyCost: 90, isLocked: true },
  { id: '5',  startTime: 675,  label: 'Lunch + Break',        duration: 45,  type: 'personal', status: 'watch',  icon: '🍱', priority: 40, energyCost: -30 }, // negative = restoring
  { id: '6',  startTime: 720,  label: 'Group Project Meet',   duration: 60,  type: 'meeting',  status: 'watch',  icon: '👥', priority: 80, energyCost: 50 },
  { id: '7',  startTime: 810,  label: 'Gym Session',          duration: 60,  type: 'health',   status: 'watch',  icon: '💪', priority: 60, energyCost: 60 },
  { id: '8',  startTime: 900,  label: 'Coding Lab',           duration: 90,  type: 'class',    status: 'smooth', icon: '💻', priority: 70, energyCost: 50 },
  { id: '9',  startTime: 1020, label: 'Dinner + Wind Down',   duration: 60,  type: 'personal', status: 'smooth', icon: '🍽️', priority: 30, energyCost: -40 },
  { id: '10', startTime: 1110, label: 'Study Block',          duration: 120, type: 'study',    status: 'smooth', icon: '📚', priority: 65, energyCost: 70 },
  { id: '11', startTime: 1410, label: 'Sleep',                duration: 390, type: 'sleep',    status: 'smooth', icon: '🌙', priority: 90, energyCost: -100, isLocked: true },
];

// ─── Color Maps ────────────────────────────────────────────────────────────────

export const TYPE_COLORS: Record<string, string> = {
  personal: '#a855f7',
  health:   '#10b981',
  travel:   '#3b82f6',
  exam:     '#ef4444',
  meeting:  '#f59e0b',
  class:    '#06b6d4',
  study:    '#6366f1',
  sleep:    '#8b5cf6',
};

export const STATUS_COLORS: Record<string, string> = {
  smooth:   '#10b981',
  watch:    '#f59e0b',
  conflict: '#f97316',
  critical: '#ef4444',
};

export const MODE_META = {
  HOME:   { label: 'Home Mode',   icon: '🏠', color: '#3b82f6',  tint: 'rgba(59,130,246,0.04)'  },
  STUDY:  { label: 'Study Mode',  icon: '🎓', color: '#6366f1',  tint: 'rgba(99,102,241,0.06)'  },
  TRAVEL: { label: 'Travel Mode', icon: '🚗', color: '#f59e0b',  tint: 'rgba(245,158,11,0.04)'  },
  SLEEP:  { label: 'Sleep Mode',  icon: '🌙', color: '#8b5cf6',  tint: 'rgba(139,92,246,0.06)'  },
};
