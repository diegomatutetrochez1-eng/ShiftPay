import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` permite servir el build desde un archivo local,
// útil al empaquetarlo más adelante como app de Windows (Tauri/Electron/WebView2).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
