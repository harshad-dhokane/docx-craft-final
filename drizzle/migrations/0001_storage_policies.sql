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