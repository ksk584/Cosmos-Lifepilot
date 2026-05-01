// ─── Core Types ────────────────────────────────────────────────────────────────

export type Status = 'smooth' | 'watch' | 'conflict' | 'critical';
export type AlertLevel = 'FYI' | 'ACTION' | 'CRITICAL';
export type AppMode = 'HOME' | 'STUDY' | 'TRAVEL' | 'SLEEP';
export type IntentState = 'Relaxed' | 'Normal' | 'Urgent' | 'Critical';
export type EventType = 'personal' | 'health' | 'travel' | 'exam' | 'meeting' | 'class' | 'study' | 'sleep';
export type FixType = 'trim' | 'shift' | 'skip';

// ─── Events ────────────────────────────────────────────────────────────────────

export interface LifeEvent {
  id: string;
  label: string;
  startTime: number;   // minutes from midnight
  duration: number;    // minutes
  type: EventType;
  status: Status;
  icon: string;
  isSimulated?: boolean;
  isLocked?: boolean;  // cannot be moved by cascade
  priority: number;    // 0–100
  energyCost: number;  // 0–100 (how draining it is)
}

// ─── Digital Twin ──────────────────────────────────────────────────────────────

export interface LearningMetrics {
  preferredBuffer: number;
  ignoreRate: number;
  priorityWeights: Record<string, number>;
  fixPreference: FixType;
  decisionHistory: DecisionLog[];
  delayHistory: DelayLog[];
}

export interface DecisionLog {
  timestamp: number;
  type: FixType;
  eventLabel: string;
}

export interface DelayLog {
  timestamp: number;
  eventType: string;
  minutes: number;
}

export interface DigitalTwin {
  baseWakeTime: string;
  baseSleepTime: string;
  commuteHabitDelay: number;
  dailyEfficiencyScore: number;
  stressThreshold: number;
  onboarded: boolean;
  learningMetrics: LearningMetrics;
  avgDelayByType: Record<string, number>;
}

// ─── Context Engine ────────────────────────────────────────────────────────────

export interface ContextSignal {
  label: string;
  value: string;
  icon: string;
  confidence: number; // 0–100
}

export interface ContextState {
  location: string;          // e.g. "Home", "College", "Commute"
  activity: string;          // e.g. "Walking", "Idle", "Studying"
  stressLevel: number;       // 0–100
  intentScore: number;       // 0–100
  intentState: IntentState;
  signals: ContextSignal[];
  batteryLevel: number;      // 0–100 simulated
  isCharging: boolean;
}

// ─── Prediction ────────────────────────────────────────────────────────────────

export interface PredictedIssue {
  eventAId: string;
  eventBId: string;
  overlap: number;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

// ─── Resolution ────────────────────────────────────────────────────────────────

export interface Resolution {
  id: string;
  title: string;
  description: string;
  healthDelta: number;
  type: FixType;
  applyFix: (events: LifeEvent[]) => LifeEvent[];
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export interface AppAlert {
  id: string;
  level: AlertLevel;
  message: string;
  detail?: string;
  timestamp: number;
  dismissed?: boolean;
  countdownSeconds?: number;
}

// ─── Simulation / What-If ──────────────────────────────────────────────────────

export interface SimulationParams {
  leaveTimeOffset: number;      // minutes to delay/advance leave time
  skippedEventIds: string[];    // events toggled off
  routeMultiplier: number;      // 1.0 = normal, 1.5 = slow route
}

export interface SimulationResult {
  events: LifeEvent[];
  healthDelta: number;
  newConflictCount: number;
  resolvedConflictCount: number;
  affectedEvents: string[];
}

// ─── Energy ────────────────────────────────────────────────────────────────────

export interface EnergyState {
  fatigueScore: number;       // 0–100 (higher = more fatigued)
  overloadScore: number;      // 0–100 (too many events)
  focusScore: number;         // 0–100 (available focus capacity)
  suggestions: EnergySuggestion[];
}

export interface EnergySuggestion {
  id: string;
  type: 'break' | 'focus' | 'hydrate' | 'move';
  message: string;
  icon: string;
  afterEventId?: string;
}

// ─── Passive Actions ───────────────────────────────────────────────────────────

export interface PassiveAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: 'message' | 'map' | 'setting' | 'app';
  trigger: string;
  executed?: boolean;
}
