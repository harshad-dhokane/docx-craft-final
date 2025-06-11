import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'wouter']
          }
        }
      },
      sourcemap: false,
      minify: true,
      cssMinify: true
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '5000', 10),
      proxy: {
        '/api': {
          target: process.env.NODE_ENV === 'production'
            ? 'https://docxcraft.onrender.com'
            : 'http://localhost:5000',
          changeOrigin: true,
          secure: true
        }
      },
      allowedHosts: [
          'docxcraft.onrender.com',
          '.onrender.com',
          'localhost',
          '127.0.0.1',
          '.replit.dev'
        ]

    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '5000', 10)
    }
  };
});
