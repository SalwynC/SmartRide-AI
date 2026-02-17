import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();
const rootDir = process.cwd();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          // Don't exit on Vite error - server should keep running
          console.warn("⚠️  Vite error (but server continues):", msg);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("/{*path}", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(rootDir, "client", "index.html");

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("⚠️  Vite initialization failed, serving static fallback:", error instanceof Error ? error.message : String(error));
    // Serve a basic fallback if Vite fails to initialize
    app.use("/{*path}", async (req, res) => {
      const clientTemplate = path.resolve(rootDir, "client", "index.html");
      try {
        const template = await fs.promises.readFile(clientTemplate, "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        res.status(500).send("Server Error: Could not load index.html");
      }
    });
  }
}
