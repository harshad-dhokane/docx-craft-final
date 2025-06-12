-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Allow the handle_new_user function to bypass RLS
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- Allow the handle_user_update function to bypass RLS
ALTER FUNCTION public.handle_user_update() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_user_update() SECURITY DEFINER;