-- Content from drizzle/migrations/0001_storage_policies.sql
-- Create function to set up storage policies
CREATE OR REPLACE FUNCTION create_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Templates bucket policies
  DROP POLICY IF EXISTS "Users can upload their own templates" ON storage.objects;
  CREATE POLICY "Users can upload their own templates"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'templates' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can view their own templates" ON storage.objects;
  CREATE POLICY "Users can view their own templates"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'templates' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can update their own templates" ON storage.objects;
  CREATE POLICY "Users can update their own templates"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'templates' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can delete their own templates" ON storage.objects;
  CREATE POLICY "Users can delete their own templates"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'templates' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Generated PDFs bucket policies
  DROP POLICY IF EXISTS "Users can upload their own generated PDFs" ON storage.objects;
  CREATE POLICY "Users can upload their own generated PDFs"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'generated_pdfs' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can view their own generated PDFs" ON storage.objects;
  CREATE POLICY "Users can view their own generated PDFs"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'generated_pdfs' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can update their own generated PDFs" ON storage.objects;
  CREATE POLICY "Users can update their own generated PDFs"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'generated_pdfs' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can delete their own generated PDFs" ON storage.objects;
  CREATE POLICY "Users can delete their own generated PDFs"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'generated_pdfs' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Profile images bucket policies
  DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
  CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'profile-images' AND
      auth.uid()::text = (storage.foldername(name))[1] AND
      auth.role() = 'authenticated'
    );

  DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
  CREATE POLICY "Users can view their own avatars"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'profile-images' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'profile-images' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
END;
$$;

-- Content from drizzle/migrations/0004_execute_storage_policies.sql
-- Execute the storage policies function
SELECT create_storage_policies();

-- Content from drizzle/migrations/0005_fix_profile_images.sql
-- Drop existing policies for profile-images bucket
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;

-- Create new, more permissive policies for profile-images bucket
CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own profile images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Content from drizzle/migrations/0006_fix_profile_rls.sql
-- First, enable RLS on storage.objects if not already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- This is redundant as it's in the previous block

-- Drop all existing policies for profile-images bucket
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Profile images access" ON storage.objects;

-- Create separate policies for different operations on profile-images
CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own profile images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Make sure the storage.objects table is accessible
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;
