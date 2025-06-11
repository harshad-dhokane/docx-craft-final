import express from 'express';
import path from 'path';
import fs from 'fs';
import type { Express } from 'express';

export function setupProduction(app: Express) {
  const distPath = path.resolve(process.cwd(), 'dist', 'public');
  
  if (fs.existsSync(distPath)) {
    // Serve static files with aggressive caching
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true
      })
    );

    // Handle client-side routing
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api')) {
        next();
        return;
      }

      res.sendFile(path.join(distPath, 'index.html'), {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    });
  } else {
    console.error('Production build not found:', distPath);
  }
}