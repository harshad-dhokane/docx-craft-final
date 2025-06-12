import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server";
import { fillDocxTemplate, fillXlsxTemplate } from "~/lib/documentGenerator.server";

// Placeholder for user auth
// TODO: Replace with actual user authentication and retrieve real user ID
const getUserIdPlaceholder = async (request: Request): Promise<string | null> => {
    console.warn("Using placeholder user ID for document generation. Integrate actual authentication.");
    return null; // Bypasses ownership check for now
};

// Helper to determine Content-Type, duplicated from download route, consider moving to a shared util
const getContentType = (fileNameOrType: string): string => {
    const normalizedInput = fileNameOrType.toLowerCase();
    if (normalizedInput.includes('/')) { // Likely a MIME type already
        return normalizedInput;
    }
    const extension = normalizedInput.split('.').pop();
    if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/octet-stream'; // Default
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { templateId } = params;
  if (!templateId) {
    return json({ error: "Template ID is required" }, { status: 400 });
  }

  let placeholderData: any;
  try {
    // Check if request body is empty
    const rawBody = await request.text();
    if (!rawBody) {
        return json({ error: "Request body is empty. Placeholder data is required." }, { status: 400 });
    }
    placeholderData = JSON.parse(rawBody);
  } catch (e) {
    return json({ error: "Invalid JSON data for placeholders in request body." }, { status: 400 });
  }

  if (typeof placeholderData !== 'object' || placeholderData === null) {
    return json({ error: "Placeholder data must be a valid JSON object." }, { status: 400 });
  }

  try {
    const currentUserId = await getUserIdPlaceholder(request);

    const { data: template, error: dbError } = await supabaseAdmin
      .from("templates")
      .select("file_path, name, user_id, file_type")
      .eq("id", templateId)
      .single();

    if (dbError || !template) {
      return json({ error: "Template not found." }, { status: 404 });
    }

    // TODO: Enforce ownership check once auth is integrated and currentUserId is not null
    if (currentUserId && template.user_id !== currentUserId) {
       console.warn(`User ${currentUserId} attempted to generate document from template ${templateId} owned by ${template.user_id}`);
       return json({ error: "Forbidden. You do not have access to this template." }, { status: 403 });
    }
    if (!currentUserId) {
        console.warn(`Bypassing ownership check for template ${templateId} generation due to placeholder user ID. Secure this!`);
    }

    const { data: fileBlob, error: storageError } = await supabaseAdmin.storage
      .from("templates")
      .download(template.file_path);

    if (storageError || !fileBlob) {
      console.error("Storage download error:", storageError);
      return json({ error: "Failed to download template file from storage.", details: storageError.message }, { status: 500 });
    }

    const templateBuffer = Buffer.from(await fileBlob.arrayBuffer());
    let generatedBuffer: Buffer;

    const fileTypeToUse = template.file_type || template.name.split('.').pop()?.toLowerCase();

    if (fileTypeToUse === 'docx') {
      generatedBuffer = await fillDocxTemplate(templateBuffer, placeholderData);
    } else if (fileTypeToUse === 'xlsx') {
      generatedBuffer = await fillXlsxTemplate(templateBuffer, placeholderData);
    } else {
      return json({ error: `Unsupported template type: ${fileTypeToUse}. Only .docx and .xlsx are supported for generation.` }, { status: 400 });
    }

    const originalNameWithoutExt = template.name.substring(0, template.name.lastIndexOf('.')) || template.name;
    const generatedFileName = `Generated-${originalNameWithoutExt}.${fileTypeToUse}`;
    const contentType = getContentType(fileTypeToUse); // Use determined fileTypeToUse

    // Increment use_count (best effort, if it fails, document generation still proceeds)
    try {
        const { error: updateError } = await supabaseAdmin
            .rpc('increment_template_use_count', { template_id_param: templateId });
        if (updateError) {
            console.warn(`Failed to increment use_count for template ${templateId}:`, updateError);
        }
    } catch (rpcError) {
        console.warn(`RPC call to increment_template_use_count failed for template ${templateId}:`, rpcError);
    }


    return new Response(generatedBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${generatedFileName}"`,
        "Content-Length": generatedBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error(`Error generating document for template ${templateId}:`, error);
    return json({ error: "Failed to generate document.", details: error.message }, { status: 500 });
  }
};
