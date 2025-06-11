import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

export class LibreOfficePDFConverter {
  private tempDir: string;

  constructor() {
    // Use the OS temp directory instead of hardcoding /tmp
    this.tempDir = path.join(os.tmpdir(), 'pdf-conversion');
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async convertToPDF(inputBuffer: Buffer, originalFileName: string): Promise<Buffer> {
    const sessionId = randomUUID();
    const inputDir = path.join(this.tempDir, sessionId);
    const outputDir = path.join(this.tempDir, `${sessionId}_output`);
    
    try {
      // Create session directories
      await fs.mkdir(inputDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      // Write input file
      const inputPath = path.join(inputDir, originalFileName);
      await fs.writeFile(inputPath, inputBuffer);

      // Convert to PDF using LibreOffice
      await this.runLibreOfficeConversion(inputPath, outputDir);

      // Read the generated PDF
      const pdfFileName = this.getPDFFileName(originalFileName);
      const pdfPath = path.join(outputDir, pdfFileName);
      
      // Check if PDF was created
      try {
        await fs.access(pdfPath);
      } catch {
        throw new Error(`PDF conversion failed: ${pdfFileName} not found in output directory`);
      }

      const pdfBuffer = await fs.readFile(pdfPath);
      
      // Cleanup
      await this.cleanup(inputDir, outputDir);
      
      return pdfBuffer;
    } catch (error) {
      // Cleanup on error
      await this.cleanup(inputDir, outputDir);
      throw error;
    }
  }

  private async getLibreOfficeCommand(): Promise<string> {
    if (process.platform === 'win32') {
      // Check common installation paths on Windows
      const possiblePaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
      ];
      
      for (const path of possiblePaths) {
        try {
          await fs.access(path);
          return path;
        } catch {
          continue;
        }
      }
      throw new Error('LibreOffice not found in common installation paths');
    }
    
    return 'libreoffice'; // Default command for Unix-like systems
  }

  private async runLibreOfficeConversion(inputPath: string, outputDir: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const args = [
        '--headless',
        '--invisible',
        '--nodefault',
        '--nolockcheck',
        '--nologo',
        '--norestore',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputPath
      ];

      try {
        const command = await this.getLibreOfficeCommand();
        console.log('Running LibreOffice conversion:', command, args.join(' '));
        
        const process = spawn(command, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 30000 // 30 second timeout
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          console.log(`LibreOffice process exited with code ${code}`);
          console.log('stdout:', stdout);
          console.log('stderr:', stderr);

          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`LibreOffice conversion failed with code ${code}. stderr: ${stderr}`));
          }
        });

        process.on('error', (error) => {
          reject(new Error(`Failed to start LibreOffice: ${error.message}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private getPDFFileName(originalFileName: string): string {
    const nameWithoutExt = path.parse(originalFileName).name;
    return `${nameWithoutExt}.pdf`;
  }

  private async cleanup(inputDir: string, outputDir: string): Promise<void> {
    try {
      await fs.rm(inputDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup input directory:', error);
    }
    
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup output directory:', error);
    }
  }

  async checkLibreOfficeAvailability(): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        // On Windows, just check if we can find the executable
        const command = await this.getLibreOfficeCommand();
        await fs.access(command);
        return true;
      }

      // On Unix-like systems, try running the command
      return new Promise((resolve) => {
        const process = spawn('libreoffice', ['--version'], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        process.on('close', (code) => {
          resolve(code === 0);
        });

        process.on('error', () => {
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }
}

export const pdfConverter = new LibreOfficePDFConverter();