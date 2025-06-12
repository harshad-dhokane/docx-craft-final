import ET_Class from 'easy-template-x'; // Attempt to import the main class/default export
import { Workbook } from 'exceljs';

// Helper type for placeholder data
type PlaceholderData = { [key: string]: string | number | boolean | { _type: 'image', source: Buffer, format: string, width: number, height: number } | any[] };


export async function fillDocxTemplate(templateBuffer: Buffer, data: PlaceholderData): Promise<Buffer> {
  try {
    // easy-template-x v6.2.1 typically uses the default export as the main class constructor.
    // The constructor expects an object with a `template` property (Buffer or path).
    // The `render` method is then called with the data.

    // The library might have issues with complex objects or nested arrays directly if not handled
    // by specific tags (like loops or tables). For simple key-value replacement, it should work.
    // For images, easy-template-x expects data in a specific format, often involving a base64 string
    // or a specific object structure if it supports direct buffer embeds.
    // The provided `PlaceholderData` type includes an image object structure.
    // We may need to transform this to what easy-template-x expects if different.
    // For now, assuming direct string/number/boolean replacement.

    const handler = new ET_Class({ template: templateBuffer });
    const filledBuffer = await handler.render(data); // render returns a Node.js Buffer
    return filledBuffer;

  } catch (error) {
    console.error("Error filling DOCX template with easy-template-x:", error);
    // Provide more context if possible, e.g., data structure issues
    if (error instanceof Error && error.message.includes("Cannot read properties of undefined (reading 'replace')")) {
        console.error("This error in easy-template-x often means a placeholder was expected but not found in data, or data was not in expected format for a tag.");
    }
    throw new Error("Failed to fill DOCX template.");
  }
}

export async function fillXlsxTemplate(templateBuffer: Buffer, data: PlaceholderData): Promise<Buffer> {
  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(templateBuffer);

    const regex = /\{\{([^{}]+?)\}\}|\$\{\s*([^{}]+?)\s*\}/g; // Matches {{tag}} or ${tag}

    workbook.eachSheet(worksheet => {
      for (let i = 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        // Iterate up to actual cell count for the row, not necessarily worksheet.columnCount
        for (let j = 1; j <= row.actualCellCount; j++) {
          const cell = row.getCell(j);

          let cellValueAsString: string | null = null;
          if (cell.value) {
            if (typeof cell.value === 'string') {
              cellValueAsString = cell.value;
            } else if (cell.value instanceof Date) {
              // Dates should ideally be formatted as strings by the user in `data` if specific format needed
              // or use a specific tag in template if library supports date formatting.
              // For simple replacement, convert to ISO string.
              cellValueAsString = cell.value.toISOString();
            } else if (typeof cell.value === 'number' || typeof cell.value === 'boolean') {
              cellValueAsString = String(cell.value);
            } else if (typeof cell.value === 'object' && 'richText' in cell.value && cell.value.richText) {
              const richText = cell.value.richText as any[];
              if (richText && Array.isArray(richText)) {
                cellValueAsString = richText.map(rt => rt.text).join('');
              }
            }
          }

          if (cellValueAsString) {
            cell.value = cellValueAsString.replace(regex, (match, p1, p2) => {
              const key = p1 || p2;
              return data[key] !== undefined ? String(data[key]) : match;
            });
          }

          // Also replace in formulas if they are strings
          if (cell.formula && typeof cell.formula === 'string') {
             cell.formula = cell.formula.replace(regex, (match, p1, p2) => {
              const key = p1 || p2;
              // Be cautious replacing in formulas, ensure data[key] is valid for formula context
              return data[key] !== undefined ? String(data[key]) : match;
            });
          }
        }
      }
    });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  } catch (error) {
    console.error("Error filling XLSX template:", error);
    throw new Error("Failed to fill XLSX template.");
  }
}
