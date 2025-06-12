import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server"; // Using admin client for now

// TODO: Replace this with actual user authentication logic
const getUserIdFromRequest = async (request: Request): Promise<string | null> => {
  // In a real app, this would involve session validation, JWT decoding, etc.
  // For now, let's use a hardcoded placeholder if no other mechanism is readily available.
  // This is a placeholder for demonstration. In a real scenario, if no user is authenticated,
  // this should probably throw an error or return null, leading to an empty list or auth error.
  console.warn("Using placeholder user ID for listing templates. Integrate actual authentication.");
  // Example: return "00000000-0000-0000-0000-000000000000"; // A valid UUID format
  // To make this testable without a user, we might fetch all templates for now,
  // or require a specific known user ID that has templates from the upload step.
  // For the purpose of this subtask, let's assume we have a known placeholder user ID used in upload.
  // The userId used in the upload subtask was `randomUUID()`, so we can't easily query for that specific one here
  // without knowing it.
  // Option 1: Query for a *specific known* placeholder UserId (if one was consistently used in upload tests)
  // Option 2: For now, to see *any* data, fetch all templates and acknowledge this needs user-scoping.
  // Let's go with Option 2 for initial development visibility, with a strong TODO.
  return null; // Setting to null to signify fetching all for now, to be replaced by actual user ID.
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const userId = await getUserIdFromRequest(request);

    // TODO: When auth is integrated, if userId is null, throw an authentication error.
    // For now, if userId is null, we'll fetch all templates to demonstrate the query.
    // This is NOT production-ready for multi-user.

    let query = supabaseAdmin.from("templates").select(`
      id,
      name,
      file_path,
      file_size,
      placeholders,
      upload_date,
      use_count,
      file_type
    `); // Added file_type

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      // This branch is for current development ease ONLY.
      console.warn("Fetching all templates as no specific user ID provided/available. Secure this for multi-user.");
    }

    const { data: templates, error } = await query.order("upload_date", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return json({ error: "Failed to fetch templates", details: error.message }, { status: 500 });
    }

    return json({ templates });

  } catch (error: any) {
    console.error("Error in list templates loader:", error);
    return json({ error: "An unexpected error occurred", details: error.message }, { status: 500 });
  }
};
