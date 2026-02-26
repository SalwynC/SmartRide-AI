import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// In production CJS build, __dirname is defined natively.
// In dev ESM (tsx), we derive it from import.meta.url.
function getCurrentDir() {
  try {
    // CJS — __dirname available natively
    if (typeof __dirname !== "undefined") return __dirname;
  } catch {}
  // ESM fallback
  return path.dirname(fileURLToPath(import.meta.url));
}
const currentDir = getCurrentDir();

export function serveStatic(app: Express) {
  const distPath = path.resolve(currentDir, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
