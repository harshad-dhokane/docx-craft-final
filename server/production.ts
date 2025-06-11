import express from 'express';
import path from 'path';
import fs from 'fs';
import type { Express, Request, Response, NextFunction } from 'express';

export function setupProduction(app: Express) {
  const distPath = path.resolve(process.cwd(), 'dist', 'public');
  
  if (fs.existsSync(distPath)) {
    // CORS middleware for production
    app.use((req: Request, res: Response, next: NextFunction) => {
      const allowedOrigins = ['https://docxcraft.onrender.com', 'http://localhost:5000'];
      const origin = req.headers.origin;
      
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    });

    // Serve static files with aggressive caching
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true
      })
    );

    // Handle client-side routing
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      // Skip API routes
      if (req.path.startsWith('/api')) {
        next();
        return;
      }

      res.sendFile(path.join(distPath, 'index.html'), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    });
  } else {
    console.error('Production build not found:', distPath);
  }
}