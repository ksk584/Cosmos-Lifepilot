import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { exec } from 'child_process';
import type { Plugin } from 'vite';

function batteryApiPlugin(): Plugin {
  return {
    name: 'battery-api',
    configureServer(server) {
      server.middlewares.use('/api/battery', (req, res) => {
        exec('powershell -Command "(Get-WmiObject -Class Win32_Battery).EstimatedChargeRemaining; (Get-WmiObject -Class Win32_Battery).BatteryStatus"', (err, stdout) => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          const lines = stdout.trim().split('\n').map(l => l.trim()).filter(Boolean);
          const level = lines[0] ? parseInt(lines[0], 10) : null;
          const status = lines[1] ? parseInt(lines[1], 10) : null;
          // BatteryStatus: 2 = AC (charging/plugged in), 1 = Discharging
          const isCharging = status === 2;

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ level, isCharging }));
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), batteryApiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
