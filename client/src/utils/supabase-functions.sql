
-- Function to increment template use count
CREATE OR REPLACE FUNCTION increment_template_use_count(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  UPDATE templates 
  SET use_count = COALESCE(use_count, 0) + 1 
  WHERE id = template_id;
END;
$$;
