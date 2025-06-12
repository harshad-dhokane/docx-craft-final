-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );

  INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    NEW.id,
    'user_signup',
    'auth',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'signup_time', NOW(),
      'confirmed_at', NEW.confirmed_at
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;

  IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, metadata, created_at)
    VALUES (
      NEW.id,
      'email_confirmed',
      'auth',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'confirmed_at', NEW.confirmed_at
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();