import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server";

// TODO: Replace with actual user authentication
const getUserIdPlaceholder = async (request: Request): Promise<string | null> => {
  console.warn("Using placeholder user ID for template download. Integrate actual authentication.");
  // This should be the ID of a user who owns templates for testing.
  // For now, returning null to bypass ownership check for initial dev.
  // THIS IS NOT SAFE FOR PRODUCTION.
  return null;
};

const getContentType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'docx') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (extension === 'xlsx') {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    return 'application/octet-stream'; // Default
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { templateId } = params;

  if (!templateId) {
    return json({ error: "Template ID is required." }, { status: 400 });
  }

  // Basic UUID validation (optional, but good practice)
  // const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  // if (!uuidRegex.test(templateId)) {
  //   return json({ error: "Invalid Template ID format." }, { status: 400 });
  // }

  try {
    const currentUserId = await getUserIdPlaceholder(request); // Placeholder

    // Fetch template metadata
    const { data: template, error: dbError } = await supabaseAdmin
      .from("templates")
      .select("file_path, name, user_id, file_type") // Select user_id for ownership check and file_type
      .eq("id", templateId)
      .single();

    if (dbError || !template) {
      console.error("Error fetching template metadata or template not found:", dbError);
      return json({ error: "Template not found or database error." }, { status: 404 });
    }

    // TODO: Enforce ownership check once auth is integrated
    // if (currentUserId && template.user_id !== currentUserId) {
    //   console.warn(`User ${currentUserId} attempted to download template ${templateId} owned by ${template.user_id}`);
    //   return json({ error: "Forbidden. You do not have access to this template." }, { status: 403 });
    // }
    if (!currentUserId) { // This condition means ownership is NOT checked if currentUserId is null
        console.warn(`Bypassing ownership check for template download ${templateId} due to placeholder user ID. Secure this!`);
    }


    // Download from Supabase Storage
    const { data: fileBlob, error: storageError } = await supabaseAdmin.storage
      .from("templates")
      .download(template.file_path);

    if (storageError || !fileBlob) {
      console.error(`Error downloading template ${template.file_path} from storage:`, storageError);
      return json({ error: "Failed to download template file from storage.", details: storageError.message }, { status: 500 });
    }

    const contentType = template.file_type
      ? getContentType(template.file_type) // Prefer stored file_type if available
      : getContentType(template.name);    // Fallback to inferring from name

    return new Response(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${template.name}"`,
        "Content-Length": fileBlob.size.toString(),
      },
    });

  } catch (error: any) {
    console.error(`Error downloading template ${templateId}:`, error);
    return json({ error: "An unexpected error occurred during template download.", details: error.message }, { status: 500 });
  }
};
