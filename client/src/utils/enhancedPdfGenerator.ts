import { Workbook } from 'exceljs';
import { TemplateHandler, MimeType } from 'easy-template-x';
import { Buffer } from 'buffer';
import { supabase } from '@/integrations/supabase/client';
import { convertToPdfOnServer, checkServerHealth } from './serverPdfGenerator';

interface ImageData {
  _type: 'image';
  source: Buffer;
  format: MimeType;
  width: number;
  height: number;
  altText?: string;
  transparencyPercent?: number;
}

type PlaceholderValue = string | ImageData;

interface GenerationOptions {
  templateId: string;
  templateName: string;
  placeholderData: Record<string, PlaceholderValue>;
  placeholders: string[];
  format: 'pdf' | 'docx' | 'xlsx';
  userId: string;
}

// Helper function to convert base64 image to ImageData with proper format
const convertBase64ToImageData = async (base64String: string, altText: string = ''): Promise<ImageData> => {
  console.log('Converting base64 to ImageData for:', altText);

  try {
    // Validate base64 string
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Invalid base64 string provided');
    }

    // Extract and validate data URL components
    const dataUrlMatch = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      throw new Error('Invalid data URL format. Expected format: data:image/[type];base64,[data]');
    }

    const [, imageType, base64Data] = dataUrlMatch;

    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Empty base64 data');
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Validate buffer size
    if (buffer.length === 0) {
      throw new Error('Failed to decode base64 data');
    }

    // Determine format using proper MimeType enum based on detected type
    let format: MimeType;
    const normalizedType = imageType.toLowerCase();

    switch (normalizedType) {
      case 'jpeg':
      case 'jpg':
        format = MimeType.Jpeg;
        break;
      case 'png':
        format = MimeType.Png;
        break;
      case 'gif':
        format = MimeType.Gif;
        break;
      case 'bmp':
        format = MimeType.Bmp;
        break;
      case 'svg':
        format = MimeType.Svg;
        break;
      default:
        console.warn(`Unsupported image type: ${imageType}, defaulting to PNG`);
        format = MimeType.Png;
    }

    console.log(`Detected image format: ${format} (${imageType}), buffer size: ${buffer.length} bytes`);

    // Use more reasonable dimensions for document layout
    return {
      _type: 'image',
      source: buffer,
      format: format,
      width: 200,  // Match example dimensions
      height: 200, // Match example dimensions
      altText: altText || 'Inserted Image'
    };
  } catch (error) {
    console.error('Error converting base64 to ImageData:', error);
    throw new Error(`Image conversion failed: ${error.message}`);
  }
};

const handleExcel = async (templateBuffer: ArrayBuffer, data: Record<string, PlaceholderValue>): Promise<Blob> => {
  console.log('Processing Excel template with enhanced placeholder replacement...');
  const workbook = new Workbook();
  await workbook.xlsx.load(templateBuffer);

  console.log(`Excel workbook loaded with ${workbook.worksheets.length} worksheets`);
  
  workbook.worksheets.forEach((worksheet, wsIndex) => {
    console.log(`Processing worksheet ${wsIndex + 1}: ${worksheet.name || 'Unnamed'}`);
    
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (cell && cell.value !== null && cell.value !== undefined) {
          let cellText = '';

          // Enhanced cell value extraction
          if (typeof cell.value === 'string') {
            cellText = cell.value;
          } else if (typeof cell.value === 'number') {
            cellText = cell.value.toString();
          } else if (typeof cell.value === 'boolean') {
            cellText = cell.value.toString();
          } else if (cell.value && typeof cell.value === 'object') {
            // Handle Excel rich text and formula objects
            if ('text' in cell.value && cell.value.text) {
              cellText = String(cell.value.text);
            } else if ('richText' in cell.value && Array.isArray(cell.value.richText)) {
              cellText = cell.value.richText
                .map((rt: any) => (rt && rt.text) ? String(rt.text) : '')
                .join('');
            } else if ('result' in cell.value && cell.value.result != null) {
              cellText = String(cell.value.result);
            } else if ('formula' in cell.value && cell.value.formula) {
              cellText = String(cell.value.formula);
            } else if ('hyperlink' in cell.value && cell.value.hyperlink) {
              cellText = String(cell.value.hyperlink);
            } else {
              cellText = String(cell.value);
            }
          }

          // Also check cell text property
          if (!cellText && cell.text) {
            cellText = cell.text;
          }

          // Store original styling
          const originalStyle = {
            font: cell.font ? { ...cell.font } : undefined,
            alignment: cell.alignment ? { ...cell.alignment } : undefined,
            border: cell.border ? { ...cell.border } : undefined,
            fill: cell.fill ? { ...cell.fill } : undefined,
            numFmt: cell.numFmt,
            protection: cell.protection ? { ...cell.protection } : undefined
          };

          let finalText = cellText;
          let hasChanges = false;

          // Process multiple placeholder patterns
          Object.entries(data).forEach(([key, value]) => {
            // Pattern 1: {{placeholder}}
            const doubleBraceRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            // Pattern 2: {placeholder}
            const singleBraceRegex = new RegExp(`\\{${key}\\}`, 'g');
            // Pattern 3: <<placeholder>>
            const angleBraceRegex = new RegExp(`<<${key}>>`, 'g');
            // Pattern 4: $placeholder$
            const dollarRegex = new RegExp(`\\$${key}\\$`, 'g');

            const patterns = [doubleBraceRegex, singleBraceRegex, angleBraceRegex, dollarRegex];
            
            patterns.forEach((regex, patternIndex) => {
              if (regex.test(finalText)) {
                console.log(`Found placeholder "${key}" in cell ${getCellAddress(rowNumber, colNumber)} using pattern ${patternIndex + 1}`);
                
                // Handle different value types
                let replacementText = '';

                if (typeof value === 'string') {
                  // Check if it's a base64 image
                  if (value.startsWith('data:image/') && value.includes('base64,')) {
                    // Extract image type for better display
                    const typeMatch = value.match(/data:image\/([^;]+)/);
                    const imageType = typeMatch ? typeMatch[1].toUpperCase() : 'IMAGE';
                    replacementText = `[${imageType} Image]`;
                  } else {
                    replacementText = value;
                  }
                } else if (value && typeof value === 'object' && '_type' in value && value._type === 'image') {
                  // Handle ImageData objects
                  const format = value.format ? value.format.split('/').pop()?.toUpperCase() : 'IMAGE';
                  replacementText = `[${format} Image]`;
                } else {
                  replacementText = String(value || '');
                }

                finalText = finalText.replace(regex, replacementText);
                hasChanges = true;
              }
            });
          });

          if (hasChanges) {
            console.log(`Updated cell ${getCellAddress(rowNumber, colNumber)}: "${cellText}" -> "${finalText}"`);
            cell.value = finalText;

            // Restore original styling
            if (originalStyle.font) cell.font = originalStyle.font;
            if (originalStyle.alignment) cell.alignment = originalStyle.alignment;
            if (originalStyle.border) cell.border = originalStyle.border;
            if (originalStyle.fill) cell.fill = originalStyle.fill;
            if (originalStyle.numFmt) cell.numFmt = originalStyle.numFmt;
            if (originalStyle.protection) cell.protection = originalStyle.protection;
          }
        }
      });
    });
  });

  console.log('Excel processing complete, generating buffer...');
  const buffer = await workbook.xlsx.writeBuffer();
  console.log(`Excel buffer generated, size: ${buffer.byteLength} bytes`);
  
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

// Helper function for Excel cell address (add to global scope)
const getCellAddress = (row: number, col: number): string => {
  let columnName = '';
  let colNum = col;
  while (colNum > 0) {
    colNum--;
    columnName = String.fromCharCode(65 + (colNum % 26)) + columnName;
    colNum = Math.floor(colNum / 26);
  }
  return columnName + row;
};

const handleWord = async (templateBuffer: ArrayBuffer, data: Record<string, PlaceholderValue>): Promise<Blob> => {
  console.log('Starting Word document processing...');
  const handler = new TemplateHandler();

  // Process the data with exact format required by easy-template-x
  const processedData: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    console.log(`Processing placeholder: ${key}, type: ${typeof value}`);

    if (typeof value === 'string') {
      // Check if it's a base64 image with more robust detection
      if (value.startsWith('data:image/') && value.includes('base64,')) {
        try {
          console.log(`Converting image for placeholder: ${key}, data length: ${value.length}`);
          const imageData = await convertBase64ToImageData(value, key);

          // Use exact format as specified by easy-template-x documentation
          processedData[key] = {
            _type: 'image',
            source: imageData.source,
            format: imageData.format,
            width: imageData.width,
            height: imageData.height,
            altText: imageData.altText || key
          };

          console.log(`Successfully processed image for ${key}:`, {
            format: imageData.format,
            width: imageData.width,
            height: imageData.height,
            bufferSize: imageData.source.length,
            altText: imageData.altText
          });
        } catch (error) {
          console.error(`Failed to process image for ${key}:`, error);
          // Provide more informative error message in document
          processedData[key] = `[Image Error: ${error.message}]`;
        }
      } else {
        // Regular text value
        processedData[key] = value;
      }
    } else if (value && typeof value === 'object' && '_type' in value && value._type === 'image') {
      // Handle pre-processed ImageData objects
      try {
        processedData[key] = {
          _type: 'image',
          source: value.source,
          format: value.format || MimeType.Png,
          width: value.width || 200,
          height: value.height || 200,
          altText: value.altText || key
        };
        console.log(`Using existing ImageData for ${key}`);
      } catch (error) {
        console.error(`Failed to process existing ImageData for ${key}:`, error);
        processedData[key] = `[Image Error: ${error.message}]`;
      }
    } else {
      // Convert other values to string
      processedData[key] = String(value || '');
    }
  }

  console.log('Processing document with data keys:', Object.keys(processedData));
  const logData = JSON.stringify(processedData, (key, value) => {
    if (value instanceof Buffer) return `[Buffer: ${value.length} bytes]`;
    if (typeof value === 'object' && value && '_type' in value && value._type === 'image') {
      return `[ImageData: ${value.format}, ${value.width}x${value.height}]`;
    }
    return value;
  }, 2);
  console.log('Processed data structure:', logData);

  try {
    console.log('Calling easy-template-x handler.process...');
    const doc = await handler.process(templateBuffer, processedData);
    console.log('Document processed successfully, size:', doc.byteLength);

    if (doc.byteLength === 0) {
      throw new Error('Generated document is empty');
    }

    return new Blob([doc], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Error processing Word template:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Provide more specific error information
    let errorMessage = 'Document processing failed';
    if (error.message.includes('image')) {
      errorMessage += ': Image processing error - ' + error.message;
    } else if (error.message.includes('template')) {
      errorMessage += ': Template error - ' + error.message;
    } else {
      errorMessage += ': ' + error.message;
    }

    throw new Error(errorMessage);
  }
};

const convertToPdfUsingLibreOffice = async (blob: Blob, originalFileName: string): Promise<Blob> => {
  console.log('Converting to PDF using LibreOffice:', originalFileName);

  try {
    const formData = new FormData();
    formData.append('file', blob, originalFileName);

    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`PDF conversion failed: ${errorData.error || response.statusText}`);
    }

    const pdfBlob = await response.blob();
    console.log('LibreOffice PDF conversion successful, size:', pdfBlob.size);

    if (pdfBlob.size === 0) {
      throw new Error('PDF conversion resulted in an empty file');
    }

    return pdfBlob;
  } catch (error) {
    console.error('LibreOffice conversion failed:', error);
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateEnhancedPDF = async ({ 
  templateId,
  templateName, 
  placeholderData,
  format,
  userId 
}: GenerationOptions): Promise<void> => {
  try {
    console.log('=== Starting Enhanced Document Generation ===');
    console.log('Template ID:', templateId);
    console.log('Format:', format);
    console.log('User ID:', userId);
    console.log('Placeholder data keys:', Object.keys(placeholderData));

    // Get template info from database
    console.log('Fetching template from database...');
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template fetch error: ${templateError.message}`);
    }
    if (!template) {
      console.error('Template not found');
      throw new Error('Template not found');
    }

    console.log('Template found:', template.name, 'File path:', template.file_path);

    // Download template file from Supabase storage
    console.log('Downloading template file from storage...');
    const { data: fileData, error: fileError } = await supabase.storage
      .from('templates')
      .download(template.file_path);

    if (fileError) {
      console.error('Template download error:', fileError);
      throw new Error(`Template download error: ${fileError.message}`);
    }
    if (!fileData) {
      console.error('Template file is empty');
      throw new Error('Template file is empty');
    }

    console.log('Template file downloaded successfully, size:', fileData.size);

    const templateBuffer = await fileData.arrayBuffer();
    console.log('Template buffer created, size:', templateBuffer.byteLength);

    let resultBlob: Blob;
    let finalFormat = format;

    // Process based on format
    switch (format) {
      case 'xlsx':
        console.log('Processing Excel document...');
        resultBlob = await handleExcel(templateBuffer, placeholderData);
        break;
      case 'docx':
        console.log('Processing Word document...');
        resultBlob = await handleWord(templateBuffer, placeholderData);
        break;
      case 'pdf':
        console.log('Processing document for PDF conversion...');
        if (template.name.endsWith('.xlsx')) {
          // For Excel templates, first generate xlsx then convert to PDF
          console.log('Processing Excel template for PDF...');
          const excelBlob = await handleExcel(templateBuffer, placeholderData);
          resultBlob = await convertToPdfUsingLibreOffice(excelBlob, template.name);
          finalFormat = 'pdf';
        } else {
          // For Word templates, first generate docx then convert to PDF
          console.log('Processing Word template for PDF...');
          const wordBlob = await handleWord(templateBuffer, placeholderData);
          resultBlob = await convertToPdfUsingLibreOffice(wordBlob, template.name);
          finalFormat = 'pdf';
        }
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log('Document processed successfully, blob size:', resultBlob.size);

    // Generate filename
    const baseFileName = templateName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${baseFileName}_${timestamp}`;
    const fullFileName = `${fileName}.${finalFormat}`;

    console.log('Generated filename:', fullFileName);

    // Upload to Supabase storage
    const storagePath = `${userId}/${Date.now()}-${fullFileName}`;
    console.log('Uploading to storage path:', storagePath);

    const { error: uploadError } = await supabase.storage
      .from('generated_pdfs')
      .upload(storagePath, resultBlob);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    console.log('File uploaded to storage successfully');

    // Convert placeholderData to JSON-compatible format for database storage
    const jsonPlaceholderData: Record<string, any> = {};
    Object.entries(placeholderData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('data:image/') && value.includes('base64,')) {
        // Extract image type and size info for better tracking
        const typeMatch = value.match(/data:image\/([^;]+)/);
        const imageType = typeMatch ? typeMatch[1].toUpperCase() : 'UNKNOWN';
        const sizeKB = Math.round(value.length * 0.75 / 1024); // Approximate size in KB
        jsonPlaceholderData[key] = `[${imageType} Image - ~${sizeKB}KB]`;
      } else if (typeof value === 'object' && value && '_type' in value && value._type === 'image') {
        const format = value.format ? value.format.split('/').pop()?.toUpperCase() : 'IMAGE';
        const sizeKB = value.source ? Math.round(value.source.length / 1024) : 0;
        jsonPlaceholderData[key] = `[${format} Image - ${sizeKB}KB]`;
      } else {
        jsonPlaceholderData[key] = typeof value === 'string' ? value : String(value || '');
      }
    });

    // Save metadata to database
    console.log('Saving metadata to database...');
    const { data: generatedFile, error: insertError } = await supabase
      .from('generated_pdfs')
      .insert({
        name: fullFileName,
        user_id: userId,
        template_id: templateId,
        file_path: storagePath,
        file_size: resultBlob.size,
        placeholder_data: jsonPlaceholderData,
        generated_date: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    console.log('Metadata saved to database successfully');

    // Update template use count
    console.log('Updating template use count...');
    await supabase
      .from('templates')
      .update({ 
        use_count: (template.use_count || 0) + 1 
      })
      .eq('id', templateId);

    // Log activity
    console.log('Logging activity...');
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: `${finalFormat.toUpperCase()} Generated`,
        resource_type: 'generated_file',
        resource_id: generatedFile.id,
        metadata: { 
          template_name: template.name,
          generated_name: fullFileName,
          placeholders_filled: Object.keys(placeholderData).length
        }
      });

    // Trigger download
    console.log('Triggering download...');
    const url = window.URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('=== Document Generation Complete ===');
    console.log('Document generated, saved to Supabase, and download triggered successfully');

  } catch (error) {
    console.error('=== Document Generation Failed ===');
    console.error('Error generating document:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};