import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server";
import { sessionStorage, SUPABASE_AUTH_SESSION_KEY, getUserSession } from "~/services/session.server";
// import { Form, useActionData, useLoaderData } from "@remix-run/react";
// import type { LoaderFunctionArgs } from "@remix-run/node";

// Optional: Loader to redirect if already logged in
// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const { user } = await getCurrentSupabaseUser(request); // Assuming getCurrentSupabaseUser is also in auth.server.ts
//   if (user) {
//     return redirect("/dashboard");
//   }
//   return json({});
// };

export const meta: MetaFunction = () => [{ title: "Login" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
  }

  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  // Basic server-side validation
  if (typeof email !== 'string' || !email.includes('@') || email.trim().length === 0) {
    return json({ error: "Invalid email address.", formErrorTarget: "email" }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return json({ error: "Password must be at least 6 characters.", formErrorTarget: "password" }, { status: 400 });
  }

  try {
    const { data: supabaseAuthData, error: supabaseError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (supabaseError || !supabaseAuthData.session) {
      console.error("Supabase login error:", supabaseError);
      return json({ error: supabaseError?.message || "Invalid login credentials.", formErrorTarget: "general" }, { status: 401 });
    }

    const { user, session: supabaseSession } = supabaseAuthData;

    if (!user || !supabaseSession || !supabaseSession.access_token) {
         return json({ error: "Login failed: No session data returned from Supabase.", formErrorTarget: "general" }, { status: 500 });
    }

    // Get existing Remix session or create a new one
    const remixSession = await getUserSession(request); // Using getUserSession from session.server.ts

    remixSession.set(SUPABASE_AUTH_SESSION_KEY, supabaseSession.access_token);

    // Optionally store refresh token if needed for server-side refresh later
    if (supabaseSession.refresh_token) {
        remixSession.set("sb_refresh_token", supabaseSession.refresh_token);
    }

    // Optionally store user ID or minimal user info if useful for quick checks,
    // but always re-validate with Supabase for critical actions.
    remixSession.set("userId", user.id);


    // Redirect to dashboard or a protected route
    // The Set-Cookie header will be included in the redirect response by commitSession
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(remixSession),
      },
    });

  } catch (error: any) {
    console.error("Login action error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return json({ error: "Login failed due to an unexpected server error.", details: errorMessage, formErrorTarget: "general" }, { status: 500 });
  }
};

// Basic UI (can be expanded later)
/*
import { Form, useActionData } from "@remix-run/react";

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "20px" }}>
      <h1>Login</h1>
      <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "300px" }}>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" name="email" id="email" required
                 style={{ border: actionData?.formErrorTarget === 'email' ? '1px solid red' : '1px solid #ccc', padding: '8px', borderRadius: '4px' }} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" name="password" id="password" required
                 style={{ border: actionData?.formErrorTarget === 'password' ? '1px solid red' : '1px solid #ccc', padding: '8px', borderRadius: '4px' }}/>
        </div>
        {actionData?.error && (
          <p style={{color: 'red'}}>
            {actionData.error}
            {actionData.details && <><br/><small>{actionData.details}</small></>}
          </p>
        )}
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Login
        </button>
      </Form>
    </div>
  );
}
*/
