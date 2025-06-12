import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server";

// TODO: Replace with actual user authentication
const getUserIdPlaceholder = async (request: Request): Promise<string | null> => {
  console.warn("Using placeholder user ID for template deletion. Integrate actual authentication.");
  // For testing, this should be the ID of a user who owns the template being deleted.
  // Returning null to bypass ownership for initial dev. NOT SAFE FOR PRODUCTION.
  return null;
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed. Use DELETE." }, { status: 405 });
  }

  const { templateId } = params;

  if (!templateId) {
    return json({ error: "Template ID is required." }, { status: 400 });
  }

  try {
    const currentUserId = await getUserIdPlaceholder(request); // Placeholder

    // Fetch template metadata to get file_path and check ownership
    const { data: template, error: fetchError } = await supabaseAdmin
      .from("templates")
      .select("file_path, user_id")
      .eq("id", templateId)
      .single();

    if (fetchError || !template) {
      console.error("Error fetching template metadata or template not found:", fetchError);
      // If template doesn't exist, it's effectively "deleted" from user's perspective.
      return json({ message: "Template not found." }, { status: 404 });
    }

    // TODO: Enforce ownership check once auth is integrated
    if (!currentUserId) {
        console.warn(`Bypassing ownership check for template deletion ${templateId} due to placeholder user ID. Secure this!`);
    } else if (template.user_id !== currentUserId) {
       console.warn(`User ${currentUserId} attempted to delete template ${templateId} owned by ${template.user_id}`);
       return json({ error: "Forbidden. You do not have access to delete this template." }, { status: 403 });
    }

    // Delete from Supabase Storage
    // It's important to handle the case where template.file_path might be null or empty if data integrity isn't guaranteed
    if (template.file_path) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("templates")
          .remove([template.file_path]);

        if (storageError) {
          // Log the error but proceed to attempt DB deletion, as the file might already be gone
          // or the primary goal is to remove the metadata reference.
          console.warn(`Error deleting template from storage (path: ${template.file_path}): ${storageError.message}`);
          // Depending on desired strictness, you could return an error here:
          // return json({ error: "Failed to delete template file from storage.", details: storageError.message }, { status: 500 });
        }
    } else {
        console.warn(`Template ID ${templateId} has no file_path associated. Skipping storage deletion.`);
    }


    // Delete from Database
    const { error: dbError } = await supabaseAdmin
      .from("templates")
      .delete()
      .eq("id", templateId);

    if (dbError) {
      console.error(`Error deleting template metadata (ID: ${templateId}) from database:`, dbError);
      // This is more critical. If storage was deleted but DB fails, we have an issue.
      return json({ error: "Failed to delete template metadata from database.", details: dbError.message }, { status: 500 });
    }

    // Deletion successful
    // return json({ success: true, message: "Template deleted successfully." }, { status: 200 });
    // Alternatively, return 204 No Content for DELETE operations
    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error(`Error deleting template ${templateId}:`, error);
    return json({ error: "An unexpected error occurred during template deletion.", details: error.message }, { status: 500 });
  }
};
