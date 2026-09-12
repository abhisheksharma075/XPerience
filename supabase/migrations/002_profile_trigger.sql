-- ==============================================================================
-- Migration: 002_profile_trigger.sql
-- Description: Automatic profile creation trigger for new authenticated users
-- ==============================================================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_username TEXT;
  default_display_name TEXT;
BEGIN
  -- Generate default username from metadata or email prefix + unique suffix
  default_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(COALESCE(NEW.email, 'player'), '@', 1) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6)
  );

  -- Generate default display name
  default_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(COALESCE(NEW.email, 'Player'), '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    xp,
    level,
    gold,
    strength,
    intelligence,
    discipline,
    vitality,
    current_streak,
    longest_streak,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    default_username,
    default_display_name,
    NEW.raw_user_meta_data->>'avatar_url',
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to execute automatically after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
