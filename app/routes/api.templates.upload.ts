import type { ActionFunctionArgs } from "@remix-run/node";
import {
  json,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
  MaxPartSizeExceededError, // Import for specific error handling
} from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server";
import { extractDocxPlaceholders, extractXlsxPlaceholders } from "~/lib/placeholderExtractor.server";
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // TODO: Implement actual user authentication to get real userId from session/request context
  // For now, using a placeholder. This is critical for security and data ownership.
  const userId = randomUUID(); // Replace with actual authenticated user ID

  try {
    const uploadHandler = unstable_createMemoryUploadHandler({ maxPartSize: MAX_FILE_SIZE });
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);

    const file = formData.get("templateFile") as File | null; // Received from upload handler
    const templateName = (formData.get("templateName") as string | null) || file?.name;

    if (!file || typeof file.name !== 'string' || file.size === 0) {
      return json({ error: "No file provided or file is invalid." }, { status: 400 });
    }

    if (!templateName) {
        return json({ error: "Template name is missing." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      // This check is technically redundant if maxPartSize in handler works as expected,
      // but good for explicit error messaging.
      return json({ error: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.` }, { status: 413 });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['docx', 'xlsx'].includes(fileExtension)) {
      return json({ error: "Invalid file type. Only .docx and .xlsx are allowed." }, { status: 400 });
    }

    // Convert the File object from the upload handler to a Buffer
    // File objects from unstable_createMemoryUploadHandler have an arrayBuffer method
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let placeholders: string[] | undefined = [];
    if (fileExtension === 'docx') {
      placeholders = await extractDocxPlaceholders(buffer);
    } else if (fileExtension === 'xlsx') {
      placeholders = await extractXlsxPlaceholders(buffer);
    }

    if (placeholders === undefined) { // Indicates an error during extraction
      return json({ error: "Failed to extract placeholders from the template." }, { status: 500 });
    }

    // Sanitize filename for storage if necessary, though randomUUID prefix helps avoid collisions
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageFileName = `${userId}/${randomUUID()}-${safeFileName}`;

    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('templates') // Bucket name
      .upload(storageFileName, buffer, {
        contentType: file.type || (fileExtension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        upsert: false,
      });

    if (storageError || !storageData) {
      console.error("Supabase storage error:", storageError);
      return json({ error: "Failed to upload template to storage.", details: storageError?.message }, { status: 500 });
    }

    const { data: dbData, error: dbError } = await supabaseAdmin.from('templates').insert({
      user_id: userId,
      name: templateName,
      file_path: storageData.path,
      file_size: file.size,
      placeholders: placeholders,
      file_type: fileExtension // Storing file type
    }).select(); // .select() to get the inserted row back if needed

    if (dbError) {
      console.error("Supabase DB error:", dbError);
      // Attempt to clean up storage if DB insert fails
      await supabaseAdmin.storage.from('templates').remove([storageData.path]);
      return json({ error: "Failed to save template metadata.", details: dbError?.message }, { status: 500 });
    }

    return json({
        success: true,
        message: "Template uploaded successfully!",
        template: dbData ? dbData[0] : null // Return the created template metadata
    });

  } catch (error: any) {
    console.error("Template upload failed:", error);
    let errorMessage = "Unknown error during template upload.";
    let status = 500;

    if (error instanceof MaxPartSizeExceededError || error.name === 'MaxPartSizeExceededError') {
        errorMessage = `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
        status = 413;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return json({ error: "Template upload failed.", details: errorMessage }, { status });
  }
};
