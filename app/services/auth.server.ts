import { supabaseAdmin } from "~/lib/supabase.server"; // Adjusted path assuming supabase.server.ts is in app/lib
import { getUserSession, sessionStorage } from "./session.server";

export const SUPABASE_AUTH_SESSION_KEY = "sb_access_token"; // Key to store Supabase token in session

// Gets the Supabase user based on JWT stored in the session
export async function getCurrentSupabaseUser(request: Request) {
  const session = await getUserSession(request);
  const accessToken = session.get(SUPABASE_AUTH_SESSION_KEY);

  if (!accessToken || typeof accessToken !== 'string') {
    return { user: null, error: null, session };
  }

  // Use the admin client to get user details from an access token.
  // This verifies the token and fetches the user.
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

  // Note: supabaseAdmin.auth.getUser(accessToken) bypasses RLS by default when using service_role_key.
  // If you need a client that respects RLS for this user for further operations, you would use:
  // import { getSupabaseClientWithToken } from "~/lib/supabase.server";
  // const userSupabaseClient = getSupabaseClientWithToken(accessToken);
  // const { data: { user }, error } = await userSupabaseClient.auth.getUser();
  // However, for just *getting* the user object after verifying token, admin client is fine.

  if (error) {
    // This could happen if the token is expired or invalid.
    // Optionally, clear the token from the session here if it's definitively invalid.
    // Example: if (error.status === 401) { session.unset(SUPABASE_AUTH_SESSION_KEY); await sessionStorage.commitSession(session); }
    console.warn("Error getting user from Supabase with session token:", error.message);
    return { user: null, error, session };
  }

  return { user, error: null, session };
}

// Example of a helper to require a user for a loader/action
// Throws a Remix redirect if user is not authenticated.
// import { redirect } from "@remix-run/node";
// export async function requireSupabaseUser(
//   request: Request,
//   redirectTo: string = new URL(request.url).pathname
// ) {
//   const { user, session } = await getCurrentSupabaseUser(request);

//   if (!user) {
//     // You might want to store the intended path in the session to redirect back after login
//     // session.set("redirect_url", redirectTo);
//     // throw redirect("/login", {
//     //   headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
//     // });
//     // For now, just returning null or throwing error to indicate no user
//     return { user: null, session, error: { message: "User not authenticated." } };
//   }

//   return { user, session, error: null };
// }
