import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { setupProduction } from "./production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Improved CORS logic
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : undefined;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (!allowedOrigins || allowedOrigins.includes("*")) {
        console.log(`[CORS] Allowing all origins`);
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] Allowing origin: ${origin}`);
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Log 403 errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message && err.message.includes("CORS")) {
    console.error(`[403][CORS] ${req.method} ${req.path} :: ${err.message}`);
    return res.status(403).json({ message: "Forbidden: CORS" });
  }
  next(err);
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Set up production or development environment
  if (process.env.NODE_ENV === "production") {
    setupProduction(app);
    // Serve static files from Vite build output using project root-relative path
    const path = require("path");
    const projectRoot = path.resolve(__dirname, "..");
    const staticPath = path.join(projectRoot, "dist", "public");
    const fs = require("fs");
    
    if (!fs.existsSync(staticPath)) {
      console.error(`[Static] Directory does not exist: ${staticPath}`);
      console.error(`[Static] Current directory: ${__dirname}`);
      console.error(`[Static] Project root: ${projectRoot}`);
      // List contents of dist directory if it exists
      const distPath = path.join(projectRoot, "dist");
      if (fs.existsSync(distPath)) {
        console.log(`[Static] Contents of ${distPath}:`, fs.readdirSync(distPath));
      }
    } else {
      console.log(`[Static] Serving static files from: ${staticPath}`);
      console.log(`[Static] Contents:`, fs.readdirSync(staticPath));
    }

    // Serve static files with appropriate caching headers
    app.use(express.static(staticPath, {
      maxAge: '1d',
      etag: true,
    }));

    // Serve index.html for all routes not starting with /api
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile("index.html", { 
        root: staticPath,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    });
  } else {
    await setupVite(app, server);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
  });
})();
