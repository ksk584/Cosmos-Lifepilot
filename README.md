<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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

## Core Features
- **Temporal Architecture:** Automatically detects and resolves scheduling conflicts via the Cascade Resolver.
- **Energy Map:** Tracks your physical and mental fatigue throughout the day based on your events.
- **Device Telemetry:** Polls your actual Windows device battery in real-time to adjust context intent.
