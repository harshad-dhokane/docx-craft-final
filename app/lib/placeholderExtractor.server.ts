import { Workbook } from 'exceljs';
import fs from 'fs/promises'; // Required for DOCX temp file handling, even if simplified
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

// Note: easy-template-x is not directly used here due to complexity of
// just extracting tags without a full data object.
// A more robust DOCX placeholder extraction would be needed for production.

export async function extractDocxPlaceholders(buffer: Buffer): Promise<string[] | undefined> {
  // For DOCX, robust placeholder extraction without filling the template is complex.
  // Common libraries are designed to fill templates, not just list tags.
  // A production solution might involve:
  // 1. Using a library that can parse DOCX XML (e.g., mammoth.js to convert to HTML, then parse)
  // 2. Unzipping the DOCX and parsing document.xml directly.
  // 3. Using a server-side headless document processor (like LibreOffice, but overkill for just tags).

  // For this subtask, we'll return an empty array and log a warning.
  console.warn(
    "DOCX placeholder extraction is currently a simplified stub and returns an empty array. " +
    "A robust implementation is required for actual DOCX placeholder detection."
  );

  // Example of how one *might* write to a temp file if a library needed it,
  // but without such a library, this part is just for structure.
  let tempFilePath: string | undefined;
  try {
    const tempDir = path.join(os.tmpdir(), 'docx-temp-extraction');
    await fs.mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(tempDir, `${randomUUID()}.docx`);
    await fs.writeFile(tempFilePath, buffer);
    // In a real scenario, you'd pass tempFilePath to a library here.
  } catch (error) {
    console.error("Error during temporary DOCX file handling (stubbed):", error);
    // Even if temp file handling fails, for this stub, we return empty array.
  } finally {
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(err => console.error("Failed to delete temp DOCX file (stubbed):", err));
    }
  }

  return []; // Stubbed response
}

export async function extractXlsxPlaceholders(buffer: Buffer): Promise<string[] | undefined> {
  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const placeholders = new Set<string>();

    // Regex to find {{placeholder}} or ${placeholder}
    // It captures the content within the braces.
    const regex = /\{\{([^{}]+?)\}\}|\$\{\s*([^{}]+?)\s*\}/g;

    workbook.eachSheet(worksheet => {
      worksheet.eachRow({ includeEmpty: false }, row => { // Iterate only non-empty rows
        row.eachCell({ includeEmpty: false }, cell => { // Iterate only non-empty cells
          let cellValueAsString: string | null = null;

          if (cell.value) {
            if (typeof cell.value === 'string') {
              cellValueAsString = cell.value;
            } else if (typeof cell.value === 'number' || typeof cell.value === 'boolean') {
              cellValueAsString = String(cell.value);
            } else if (cell.value instanceof Date) {
              cellValueAsString = cell.value.toISOString();
            } else if (typeof cell.value === 'object' && 'richText' in cell.value) {
              // Handle RichText by concatenating text parts
              const richText = cell.value.richText as any[]; // Type assertion
              if (richText && Array.isArray(richText)) {
                cellValueAsString = richText.map(rt => rt.text).join('');
              }
            }
          }

          if (cellValueAsString) {
            let match;
            while ((match = regex.exec(cellValueAsString)) !== null) {
              // match[1] is for {{...}}, match[2] is for ${...}
              placeholders.add(match[1] || match[2]);
            }
          }

          // Also check cell.formula if placeholders can be in formulas
          // Note: Formulas themselves might be complex, this is a basic check.
          if (cell.formula && typeof cell.formula === 'string') {
             let formulaMatch;
            while ((formulaMatch = regex.exec(cell.formula)) !== null) {
              placeholders.add(formulaMatch[1] || formulaMatch[2]);
            }
          }
        });
      });
    });
    return Array.from(placeholders);
  } catch (error) {
    console.error("Error extracting XLSX placeholders:", error);
    return undefined; // Indicates an error occurred
  }
}
