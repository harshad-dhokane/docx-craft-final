import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Used for user-context client
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Used for admin client

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is not set in environment variables.');
}
if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY is not set in environment variables.');
}
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
}

// Admin client - use with caution, bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Function to get a Supabase client instance for a specific user, respecting RLS.
// This requires the user's JWT access token.
export const getSupabaseClientWithToken = (accessToken: string): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
        autoRefreshToken: false, // Typically managed by Supabase Auth UI client
        persistSession: false, // Sessions are not persisted server-side this way
    }
  });
};

// Generic client that can be used on server for anonymous operations if needed,
// or as a base for client-side like initialization if this file structure was shared.
// However, for server, you'd typically use supabaseAdmin or getSupabaseClientWithToken.
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
