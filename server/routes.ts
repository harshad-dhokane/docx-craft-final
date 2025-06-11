import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { pdfConverter } from "./pdfConverter";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // PDF conversion endpoint using LibreOffice
  app.post("/api/convert-to-pdf", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      console.log(`Converting file to PDF: ${req.file.originalname}`);
      
      // Check if LibreOffice is available
      const isAvailable = await pdfConverter.checkLibreOfficeAvailability();
      if (!isAvailable) {
        return res.status(500).json({ error: "LibreOffice is not available for PDF conversion" });
      }

      // Convert to PDF using LibreOffice
      const pdfBuffer = await pdfConverter.convertToPDF(req.file.buffer, req.file.originalname);
      
      console.log(`PDF conversion successful, size: ${pdfBuffer.length} bytes`);

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.[^/.]+$/, '')}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF conversion failed:', error);
      res.status(500).json({ 
        error: "PDF conversion failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Health check endpoint for PDF conversion service
  app.get("/api/pdf-service-health", async (req, res) => {
    try {
      const isAvailable = await pdfConverter.checkLibreOfficeAvailability();
      res.json({ 
        status: isAvailable ? "healthy" : "unavailable",
        libreoffice: isAvailable,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
