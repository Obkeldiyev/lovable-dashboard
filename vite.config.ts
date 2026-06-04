import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },

  // Required for Capacitor: assets must use relative paths
  base: "./",

  build: {
    // Capacitor needs files in dist/
    outDir: "dist",
    // Larger chunks are fine for native apps (no HTTP/2 multiplexing concern)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          "react-vendor":  ["react", "react-dom", "react-router-dom"],
          "ui-vendor":     ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          "chart-vendor":  ["recharts"],
          "redux-vendor":  ["@reduxjs/toolkit", "react-redux"],
          "query-vendor":  ["@tanstack/react-query"],
        },
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react", "react-dom",
      "react/jsx-runtime", "react/jsx-dev-runtime",
      "@tanstack/react-query", "@tanstack/query-core",
    ],
  },
}));
