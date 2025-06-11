
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  if (fs.existsSync(distPath)) {
    // Serve static files
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true
    }));
    
    // Handle client-side routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, "index.html"), {
        maxAge: 0,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    });
  }
}

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  try {
    const vite = await createViteServer({
      ...viteConfig({
        command: 'serve',
        mode: 'development'
      }),
      configFile: false,
      customLogger: viteLogger,
      server: {
        middlewareMode: true,
        hmr: { 
          server,
          host: '0.0.0.0'
        },
        host: '0.0.0.0',
        strictPort: false,
        fs: {
          strict: false
        },
        allowedHosts: [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '.replit.dev',
          '.onrender.com'
        ]
      },
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // Skip API routes
        if (url.startsWith("/api")) {
          next();
          return;
        }

        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html"
        );

        if (!fs.existsSync(clientTemplate)) {
          console.error(`[Vite] Template not found: ${clientTemplate}`);
          return res.status(500).send('Template not found');
        }

        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        const html = await vite.transformIndexHtml(url, template);
        
        res.status(200)
          .set({ "Content-Type": "text/html" })
          .end(html);
      } catch (e) {
        console.error(`[Vite] Error processing ${url}:`, e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    console.log('[Vite] Development server setup complete');
  } catch (error) {
    console.error('[Vite] Failed to setup development server:', error);
    throw error;
  }
}
