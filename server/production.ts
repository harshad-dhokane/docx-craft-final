
import express from 'express';
import path from 'path';
import fs from 'fs';
import type { Express, Request, Response, NextFunction } from 'express';

export function setupProduction(app: Express) {
  // Use proper path resolution for production
  const projectRoot = path.resolve(process.cwd());
  let staticPath = path.join(projectRoot, 'dist', 'public');
  
  console.log(`[Production] Project root: ${projectRoot}`);
  console.log(`[Production] Static path: ${staticPath}`);
  
  // Try alternative paths if primary doesn't exist
  if (!fs.existsSync(staticPath)) {
    console.warn(`[Production] Primary static directory does not exist: ${staticPath}`);
    
    const altPaths = [
      path.join(projectRoot, 'dist'),
      path.join(projectRoot, 'build'),
      path.join(projectRoot, 'client', 'dist'),
      path.join(projectRoot, 'client', 'build')
    ];
    
    let foundPath = null;
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        const indexExists = fs.existsSync(path.join(altPath, 'index.html'));
        console.log(`[Production] Found alternative path: ${altPath} (has index.html: ${indexExists})`);
        if (indexExists) {
          foundPath = altPath;
          break;
        }
      }
    }
    
    if (foundPath) {
      staticPath = foundPath;
      console.log(`[Production] Using alternative static path: ${staticPath}`);
    } else {
      console.error(`[Production] No valid static directory found`);
      return;
    }
  }

  console.log(`[Production] Serving static files from: ${staticPath}`);
  console.log(`[Production] Contents:`, fs.readdirSync(staticPath));

  // CORS middleware for production
  app.use((req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = [
      'https://docxcraft.onrender.com', 
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://0.0.0.0:5000'
    ];
    
    // Add Replit domains
    if (process.env.REPL_SLUG) {
      allowedOrigins.push(`https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER?.toLowerCase() || 'user'}.replit.dev`);
    }
    
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
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
    express.static(staticPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      index: ['index.html']
    })
  );

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }

    const indexPath = path.join(staticPath, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.error(`[Production] index.html not found at: ${indexPath}`);
      return res.status(404).send('Application not built properly');
    }

    res.sendFile(indexPath, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });
}
