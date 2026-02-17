import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const rootDir = process.cwd();

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: [
      { find: "@", replacement: path.resolve(rootDir, "client", "src") },
      { find: "@shared", replacement: path.resolve(rootDir, "shared") },
      { find: "@assets", replacement: path.resolve(rootDir, "attached_assets") },
    ],
    conditions: ['import', 'module', 'browser', 'default'],
  },
  root: path.resolve(rootDir, "client"),
  build: {
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these dependencies to avoid ESM/CommonJS issues
    force: true,
    include: [
      "use-sync-external-store", 
      "use-sync-external-store/shim",
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "wouter",
      "@tanstack/react-query",
      "lucide-react",
      "lodash",
      "lodash/get",
      "lodash/isNil",
      "lodash/isFunction",
      "lodash/isArray",
      "lodash/isString",
      "recharts",
    ],
  },
  server: {
    fs: {
      strict: false,
      deny: ["**/.git/**"],
    },
  },
});
