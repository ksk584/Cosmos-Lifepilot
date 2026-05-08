

# LifePilot

LifePilot is an autonomous, context-aware scheduling and energy-tracking assistant that acts as your digital twin.

## How to Run Locally

**Prerequisites:** 
- Node.js
- Windows OS (Required for the local battery telemetry plugin to accurately read your device battery)

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` or `.env.local` file in the root directory. You can copy the provided `.env.example`. 
   (Note: No external API keys are required for the base timeline functionality).

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Once the server starts, navigate to the local URL provided in your terminal (usually `http://localhost:5173`) in your web browser to view the application.

## Complete Feature List

### 🧠 1. Context & Intent Detection (Core Brain)
Your app continuously understands your situation.
- **Detects:** Location (home, college, commute), time of day, calendar events, app usage patterns, activity, and phone state (battery, charging).
- **Advanced Signals:** Typing speed (to infer stress level) and app combinations (e.g., Maps + WhatsApp indicates traveling intent).
- **Outputs:** An Intent Score (0–100) and states like Relaxed, Normal, Urgent, or Critical.

### 🔮 2. Prediction Engine
Predicts what will happen next.
- **Calculates:** Expected delays, risk of missing events, schedule conflicts, and habit-based behavior (e.g., “user usually leaves late”).
- **Generates:** Risk Level per event (🟢 Smooth, ⚠️ Watch, 🔴 Conflict, 🚨 Critical).

### 🪞 3. Digital Twin (Personal Model)
Creates a virtual version of your daily routine.
- **Onboarding:** Asks basic questions (wake time, commute, schedule).
- **Learns Over Time:** Daily patterns, delay habits, and app usage behavior, continuously updating predictions.

### 🔮 4. What-If Simulation Engine (Main Feature)
Allows users to simulate decisions before making them.
- **User Can Change:** Leave times, skip events, or change routes.
- **App Shows:** Delay impact, risk increase/decrease, and full-day consequences.
- **Visual:** A ripple effect dynamically spreads across the timeline.

### 📊 5. Smart Timeline Dashboard
A visual overview of your entire day.
- **Displays:** All events in timeline format with color-coded risk levels.
- **Shows:** Day Health Score (0–100) and “breathing space” between events. Updates in real-time when conditions change.

### ⚡ 6. Smart Intervention System
The app takes action automatically (act first, notify second).
- **Examples:** Opens Maps when a delay is predicted, enables DND during focus periods, blocks distracting apps during exams, and escalates alarms if ignored.

### 🔔 7. Predictive Notification System (3-Tier)
- **Tier 1 (FYI):** Silent updates (e.g., “Traffic building ahead”).
- **Tier 2 (Action Required):** Heads-up alert (e.g., “Leave in 8 minutes”).
- **Tier 3 (Critical Alert):** Full-screen override (e.g., “You will miss your exam”).

### 🪞 8. Conflict Pre-Mortem (Daily Simulation)
Runs automatically every morning.
- **Simulates:** The full day to detect conflicts and tight schedules.
- **Notifies:** “2 conflicts predicted today.”

### 🧩 9. Cascade Resolver (Auto Fix System)
Fixes problems instead of just detecting them.
- **Suggests:** Reordering tasks, skipping low-priority events, or adjusting the schedule. Apply solutions with a single tap.

### 📡 10. Passive Context Actions
Automatic real-world actions.
- **Examples:** Auto message (“In class till 11”), opens relevant apps, and adjusts phone settings silently.

### 🔋 11. Energy & Focus Optimization
Improves productivity and well-being.
- **Detects:** Fatigue (late night + early wake) and Overload (too many tasks).
- **Suggests:** Breaks, focus mode, and reduced notifications.

### 📱 12. Smart Mode Switching
Automatically switches between modes based on context and prediction:
- 🎓 **Study Mode**
- 🏠 **Home Mode**
- 🚗 **Travel Mode**
- 🌙 **Sleep Mode**

### 🧠 13. Learning & Adaptation
The system improves continuously.
- **Tracks:** User decisions, ignored alerts, and delays.
- **Adjusts:** Predictions, suggestions, and future interventions.
