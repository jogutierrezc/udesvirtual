import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Node built-ins polyfill for exceljs in browser
      stream: "stream-browserify",
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["exceljs"],
  },
  define: {
    global: "globalThis",
  },
}));
