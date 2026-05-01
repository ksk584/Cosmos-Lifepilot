import type { LifeEvent, DigitalTwin, Status, PredictedIssue, Resolution, SimulationParams, SimulationResult, EnergyState, EnergySuggestion, PassiveAction, AppMode } from './types';

// ─── Utility ───────────────────────────────────────────────────────────────────

export function minutesToTime(m: number): string {
  const h = Math.floor(((m % 1440) + 1440) % 1440 / 60);
  const min = Math.floor(m % 60);
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

export function timeToMinutes(t: string): number {
  if (!t || typeof t !== 'string') return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function calcDayScore(events: LifeEvent[]): number {
  let score = 100;
  events.forEach(e => {
    if (e.status === 'critical')      score -= e.type === 'exam' || e.type === 'meeting' ? 20 : 15;
    else if (e.status === 'conflict') score -= 10;
    else if (e.status === 'watch')    score -= 5;
  });
  return Math.min(100, Math.max(0, score));
}

// ─── 1. Context Engine ─────────────────────────────────────────────────────────

export function computeContext(currentMins: number, events: LifeEvent[], twin: DigitalTwin) {
  const activeEvent = events.find(ev => currentMins >= ev.startTime && currentMins < ev.startTime + ev.duration);
  const nextEvent = events.find(ev => ev.startTime > currentMins);
  const timeToNext = nextEvent ? nextEvent.startTime - currentMins : 999;

  // Infer location
  let location = 'Home';
  if (activeEvent?.type === 'travel') location = 'Commute';
  else if (activeEvent?.type === 'exam' || activeEvent?.type === 'class' || activeEvent?.type === 'meeting') location = 'College';
  else if (activeEvent?.type === 'health' && activeEvent.label.toLowerCase().includes('gym')) location = 'Gym';
  else if (currentMins > 390 && currentMins < 1380) location = 'Home';

  // Infer activity
  let activity = 'Idle';
  if (activeEvent?.type === 'health') activity = activeEvent.label.toLowerCase().includes('run') ? 'Running' : 'Working Out';
  else if (activeEvent?.type === 'travel') activity = 'Commuting';
  else if (activeEvent?.type === 'exam' || activeEvent?.type === 'study') activity = 'Deep Focus';
  else if (activeEvent?.type === 'meeting') activity = 'In Meeting';
  else if (activeEvent?.type === 'class') activity = 'In Class';
  else if (activeEvent?.type === 'sleep') activity = 'Sleeping';

  // Stress level (0–100): rises as time-to-next-high-stakes event shrinks
  let stressBase = 20;
  if (nextEvent?.type === 'exam' || nextEvent?.type === 'meeting') {
    if (timeToNext < 15) stressBase = 90;
    else if (timeToNext < 30) stressBase = 70;
    else if (timeToNext < 60) stressBase = 50;
    else stressBase = 30;
  }
  const stressLevel = Math.min(100, stressBase + (twin.commuteHabitDelay * 2));

  // Intent score
  const intentScore = Math.min(100, Math.round(
    (stressLevel * 0.4) +
    (timeToNext < 20 ? 40 : timeToNext < 40 ? 20 : 5) +
    (activeEvent?.type === 'exam' || activeEvent?.type === 'meeting' ? 20 : 0)
  ));

  const intentState =
    intentScore >= 80 ? 'Critical' :
    intentScore >= 55 ? 'Urgent' :
    intentScore >= 30 ? 'Normal' : 'Relaxed';

  // Simulated signals
  const batteryLevel = Math.max(10, 100 - Math.floor(currentMins / 14.4));
  const isCharging = currentMins < 450 || currentMins > 1380;

  const signals = [
    { label: 'Location',    value: location,               icon: '📍', confidence: 85 },
    { label: 'Activity',    value: activity,               icon: '🚶', confidence: 78 },
    { label: 'Stress',      value: `${stressLevel}%`,      icon: '🧠', confidence: 72 },
    { label: 'Battery',     value: `${batteryLevel}%`,     icon: isCharging ? '⚡' : '🔋', confidence: 99 },
    { label: 'Time to Next',value: nextEvent ? `${timeToNext}m → ${nextEvent.label}` : 'Free', icon: '⏱', confidence: 95 },
    { label: 'App Usage',   value: activeEvent?.type === 'study' ? 'Notion, PDF' : activeEvent?.type === 'travel' ? 'Maps, WhatsApp' : 'General', icon: '📱', confidence: 60 },
  ];

  return { location, activity, stressLevel, intentScore, intentState, signals, batteryLevel, isCharging };
}

// ─── 2. Prediction Engine ──────────────────────────────────────────────────────

export function calculateRisk(event: LifeEvent, allEvents: LifeEvent[], twin: DigitalTwin): Status {
  const end = event.startTime + event.duration;
  const ghostDelay = twin.avgDelayByType[event.type] || 0;
  const predictedEnd = end + ghostDelay;

  const sorted = [...allEvents].sort((a, b) => a.startTime - b.startTime);
  const next = sorted.find(e => e.startTime > event.startTime);
  if (!next) return 'smooth';

  const buffer = next.startTime - predictedEnd;
  const isHighStakes = next.type === 'exam' || next.type === 'meeting';

  if (buffer < 0 || (isHighStakes && buffer < 15)) return 'critical';
  if (buffer < 10) return 'conflict';
  if (buffer < 20) return 'watch';
  return 'smooth';
}

// ─── 3. Pre-Mortem / Cascade Detection ────────────────────────────────────────

export function runDailyPreMortem(events: LifeEvent[], twin: DigitalTwin): PredictedIssue[] {
  const issues: PredictedIssue[] = [];
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  const buffer = twin.learningMetrics.preferredBuffer;

  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    const gap = next.startTime - (cur.startTime + cur.duration);
    const ghostDelay = twin.avgDelayByType[cur.type] || 0;
    const effectiveGap = gap - ghostDelay;

    if (effectiveGap < buffer) {
      issues.push({
        eventAId: cur.id,
        eventBId: next.id,
        overlap: buffer - effectiveGap,
        reason: effectiveGap < 0 ? 'Hard Overlap' : 'Tight Buffer',
        severity: effectiveGap < -10 ? 'high' : effectiveGap < 0 ? 'medium' : 'low',
      });
    }
  }
  return issues;
}

// ─── 4. Cascade Resolver ──────────────────────────────────────────────────────

export function simulateChange(events: LifeEvent[], targetId: string, changes: Partial<LifeEvent>): LifeEvent[] {
  let updated = events.map(ev => ev.id === targetId ? { ...ev, ...changes, isSimulated: true } : { ...ev });
  const sorted = [...updated].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    const curEnd = sorted[i].startTime + sorted[i].duration;
    if (curEnd > sorted[i + 1].startTime && !sorted[i + 1].isLocked) {
      sorted[i + 1] = { ...sorted[i + 1], startTime: curEnd, isSimulated: true };
    }
  }
  return sorted;
}

export function generateResolutions(events: LifeEvent[], twin: DigitalTwin): Resolution[] {
  const issues = runDailyPreMortem(events, twin);
  if (issues.length === 0) return [];

  const resolutions: Resolution[] = [];
  const firstIssue = issues[0];
  const eventA = events.find(e => e.id === firstIssue.eventAId);
  const eventB = events.find(e => e.id === firstIssue.eventBId);
  if (!eventA || !eventB) return [];

  const gap = firstIssue.overlap;

  if (!eventA.isLocked && eventA.duration > gap + 15) {
    resolutions.push({
      id: `trim-${eventA.id}`,
      title: 'Targeted Trim',
      description: `Shorten "${eventA.label}" by ${gap}m to create buffer.`,
      healthDelta: 12,
      type: 'trim',
      applyFix: (evs) => simulateChange(evs, eventA.id, { duration: eventA.duration - gap }),
    });
  }

  if (!eventB.isLocked) {
    resolutions.push({
      id: `shift-${eventB.id}`,
      title: 'Cascade Shift',
      description: `Push "${eventB.label}" +${gap}m — cascades forward.`,
      healthDelta: 5,
      type: 'shift',
      applyFix: (evs) => simulateChange(evs, eventB.id, { startTime: eventB.startTime + gap }),
    });
  }

  const low = events.find(e => twin.learningMetrics.priorityWeights[e.type] < 30 && e.id !== eventB.id && !e.isLocked);
  if (low) {
    resolutions.push({
      id: `skip-${low.id}`,
      title: 'Priority Sacrifice',
      description: `Cancel "${low.label}" to restore balance.`,
      healthDelta: 25,
      type: 'skip',
      applyFix: (evs) => evs.filter(e => e.id !== low.id),
    });
  }

  return resolutions.sort((a, b) => a.type === twin.learningMetrics.fixPreference ? -1 : 1);
}

// ─── 5. Recalculate Schedule ──────────────────────────────────────────────────

export function recalculateSchedule(events: LifeEvent[], currentMins: number, twin: DigitalTwin): LifeEvent[] {
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    const curEnd = sorted[i].startTime + sorted[i].duration;
    if (curEnd > sorted[i + 1].startTime && !sorted[i + 1].isLocked) {
      sorted[i + 1] = { ...sorted[i + 1], startTime: curEnd };
    }
  }
  return sorted.map(ev => ({ ...ev, status: calculateRisk(ev, sorted, twin) }));
}

// ─── 6. What-If Simulation ────────────────────────────────────────────────────

export function runSimulation(events: LifeEvent[], params: SimulationParams, twin: DigitalTwin): SimulationResult {
  let simEvents = events
    .filter(ev => !params.skippedEventIds.includes(ev.id))
    .map(ev => {
      if (ev.type === 'travel') {
        return { ...ev, duration: Math.round(ev.duration * params.routeMultiplier), isSimulated: true };
      }
      return { ...ev };
    });

  // Apply leave time offset to the first travel event
  const travelIdx = simEvents.findIndex(e => e.type === 'travel');
  if (travelIdx !== -1 && params.leaveTimeOffset !== 0) {
    simEvents[travelIdx] = {
      ...simEvents[travelIdx],
      startTime: simEvents[travelIdx].startTime + params.leaveTimeOffset,
      isSimulated: true,
    };
  }

  // Cascade
  const sorted = [...simEvents].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    const curEnd = sorted[i].startTime + sorted[i].duration;
    if (curEnd > sorted[i + 1].startTime && !sorted[i + 1].isLocked) {
      sorted[i + 1] = { ...sorted[i + 1], startTime: curEnd, isSimulated: true };
    }
  }

  const finalEvents = sorted.map(ev => ({ ...ev, status: calculateRisk(ev, sorted, twin) }));
  const originalIssues = runDailyPreMortem(events, twin).length;
  const newIssues = runDailyPreMortem(finalEvents, twin).length;

  const originalScore = calcDayScore(events);
  const newScore = calcDayScore(finalEvents);

  return {
    events: finalEvents,
    healthDelta: newScore - originalScore,
    newConflictCount: newIssues,
    resolvedConflictCount: Math.max(0, originalIssues - newIssues),
    affectedEvents: finalEvents.filter(e => e.isSimulated).map(e => e.id),
  };
}

// ─── 7. Energy Engine ─────────────────────────────────────────────────────────

export function computeEnergy(events: LifeEvent[], currentMins: number, twin: DigitalTwin): EnergyState {
  const wakeTime = timeToMinutes(twin.baseWakeTime);
  const sleepEvent = events.find(e => e.type === 'sleep');
  const lastSleepEnd = sleepEvent ? (sleepEvent.startTime - 1440 + sleepEvent.duration) : wakeTime - 60;
  const sleepDuration = wakeTime - lastSleepEnd;
  const fatigueFromSleep = sleepDuration < 360 ? 80 : sleepDuration < 420 ? 50 : sleepDuration < 480 ? 25 : 10;

  // Cumulative energy cost so far today
  const elapsed = events.filter(e => e.startTime + e.duration <= currentMins);
  const energySpent = elapsed.reduce((acc, e) => acc + (e.energyCost > 0 ? e.energyCost : 0), 0);
  const energyRestored = elapsed.reduce((acc, e) => acc + (e.energyCost < 0 ? Math.abs(e.energyCost) : 0), 0);
  const netFatigue = Math.min(100, Math.max(0, fatigueFromSleep + (energySpent - energyRestored) * 0.3));

  // Overload: how many events in next 2 hours
  const upcoming = events.filter(e => e.startTime >= currentMins && e.startTime <= currentMins + 120);
  const overloadScore = Math.min(100, upcoming.length * 22);
  const focusScore = Math.max(0, 100 - netFatigue - overloadScore * 0.3);

  const suggestions: EnergySuggestion[] = [];

  if (netFatigue > 60) {
    suggestions.push({ id: 'break', type: 'break', message: 'Take a 10-min break soon', icon: '☕', afterEventId: elapsed[elapsed.length - 1]?.id });
  }
  if (overloadScore > 50) {
    suggestions.push({ id: 'focus', type: 'focus', message: 'Consider a focus block after next event', icon: '🎯' });
  }
  if (energySpent > 150) {
    suggestions.push({ id: 'hydrate', type: 'hydrate', message: 'Hydration check — drink water', icon: '💧' });
  }
  if (focusScore > 70 && upcoming.some(e => e.type === 'study')) {
    suggestions.push({ id: 'move', type: 'focus', message: 'High focus window — great time to study', icon: '⚡' });
  }

  return { fatigueScore: netFatigue, overloadScore, focusScore, suggestions };
}

// ─── 8. Mode Detection ────────────────────────────────────────────────────────

export function detectMode(activeEvent: LifeEvent | undefined, currentMins: number): AppMode {
  if (!activeEvent) {
    if (currentMins >= 1380 || currentMins < 420) return 'SLEEP';
    return 'HOME';
  }
  if (activeEvent.type === 'sleep') return 'SLEEP';
  if (activeEvent.type === 'travel') return 'TRAVEL';
  if (activeEvent.type === 'study' || activeEvent.type === 'exam' || activeEvent.type === 'class') return 'STUDY';
  return 'HOME';
}

// ─── 9. Passive Context Actions ───────────────────────────────────────────────

export function generatePassiveActions(activeEvent: LifeEvent | undefined, mode: AppMode, context: ReturnType<typeof computeContext>): PassiveAction[] {
  const actions: PassiveAction[] = [];

  if (mode === 'STUDY' && activeEvent?.type === 'exam') {
    actions.push({ id: 'dnd', label: 'Enable Focus Mode', description: 'Block distracting apps during exam', icon: '🔕', type: 'setting', trigger: 'Exam active' });
    actions.push({ id: 'msg-exam', label: 'Send Status', description: '"In exam till ' + minutesToTime(activeEvent.startTime + activeEvent.duration) + '"', icon: '💬', type: 'message', trigger: 'Exam active' });
  }
  if (mode === 'TRAVEL') {
    actions.push({ id: 'maps', label: 'Open Navigation', description: 'Get directions to college', icon: '🗺️', type: 'map', trigger: 'Travel active' });
    actions.push({ id: 'msg-travel', label: 'Send ETA', description: '"On my way, arriving at ' + (activeEvent ? minutesToTime(activeEvent.startTime + activeEvent.duration) : '?') + '"', icon: '💬', type: 'message', trigger: 'Commute active' });
  }
  if (mode === 'SLEEP') {
    actions.push({ id: 'sleep-dnd', label: 'Enable Sleep DND', description: 'Silent all notifications until wake time', icon: '🌙', type: 'setting', trigger: 'Sleep mode' });
  }
  if (context.intentState === 'Critical') {
    actions.push({ id: 'urgent-msg', label: 'Auto-Reply Active', description: '"Busy right now, will respond soon"', icon: '⚡', type: 'message', trigger: 'Critical intent' });
  }

  return actions;
}
