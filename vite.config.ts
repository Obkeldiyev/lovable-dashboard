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
        manualChunks: (id) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) return "react-vendor";
          if (id.includes("node_modules/@radix-ui")) return "ui-vendor";
          if (id.includes("node_modules/recharts")) return "chart-vendor";
          if (id.includes("node_modules/@reduxjs") || id.includes("node_modules/react-redux")) return "redux-vendor";
          if (id.includes("node_modules/@tanstack")) return "query-vendor";
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
