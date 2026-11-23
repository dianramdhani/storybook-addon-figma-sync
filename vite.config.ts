import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': `${process.cwd()}/src`,
    },
  },
  test: {
    // Batasi worker agar tidak menghabiskan RAM di mesin dev; suite kecil, 1 worker cukup.
    maxWorkers: 1,
  },
});
