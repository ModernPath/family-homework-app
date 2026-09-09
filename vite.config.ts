import path from "node:path";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(rootDir, "public");
const wasmSrc = path.join(rootDir, "node_modules/sql.js/dist/sql-wasm.wasm");
const wasmDest = path.join(publicDir, "sql-wasm.wasm");
const wasmSrcBrowser = path.join(rootDir, "node_modules/sql.js/dist/sql-wasm-browser.wasm");
const wasmDestBrowser = path.join(publicDir, "sql-wasm-browser.wasm");
if (existsSync(wasmSrc)) {
  mkdirSync(publicDir, { recursive: true });
  copyFileSync(wasmSrc, wasmDest);
}
if (existsSync(wasmSrcBrowser)) {
  mkdirSync(publicDir, { recursive: true });
  copyFileSync(wasmSrcBrowser, wasmDestBrowser);
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Family Task Board",
        short_name: "Tasks",
        display: "standalone",
        start_url: "/",
        theme_color: "#F8FAFC",
        background_color: "#F8FAFC",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,webmanifest,wasm}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  server: {
    proxy: {
      "/agent-api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/agent-api/, ""),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environmentMatchGlobs: [["src/**/*.test.tsx", "jsdom"]],
    setupFiles: ["src/test/setup.ts"],
  },
});
