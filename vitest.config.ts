import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths'; // Added for path aliases like ~/*

export default defineConfig({
  plugins: [react(), tsconfigPaths()], // Added tsconfigPaths plugin
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup-test-env.ts',
    include: ['./app/**/*.test.{ts,tsx}'], // Specify test file pattern
    css: true, // Enable CSS processing if your components import CSS
  },
});
