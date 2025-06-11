import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { setupProduction } from "./production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Improved CORS logic
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      'https://docxcraft.onrender.com',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://0.0.0.0:5000',
      'https://*.replit.dev',
      'http://*.replit.dev'
    ];

// Add current Replit host if available
if (process.env.REPL_SLUG) {
  allowedOrigins.push(`https://${process.env.REPL_ID}-00-${process.env.REPL_SLUG}.${process.env.REPLIT_CLUSTER || 'sisko'}.replit.dev`);
}
if (process.env.REPL_SLUG) {
  allowedOrigins.push(`https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER?.toLowerCase() || 'user'}.replit.dev`);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests
      
      // Allow all origins in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[CORS] Development mode - allowing origin: ${origin}`);
        return callback(null, true);
      }
      
      if (allowedOrigins.includes("*") || allowedOrigins.some(allowed => origin?.includes(allowed))) {
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
  // Force production mode on Render or when dist directory exists
  const isProduction = process.env.NODE_ENV === "production" || 
                      process.env.RENDER || 
                      fs.existsSync(path.join(process.cwd(), 'dist', 'public'));
                      
  if (isProduction) {
    console.log("[Server] Running in production mode");
    setupProduction(app);
  } else {
    console.log("[Server] Running in development mode");
    await setupVite(app, server);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
  });
})();
