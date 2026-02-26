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
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
  optimizeDeps: {
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
