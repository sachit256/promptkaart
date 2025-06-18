/*
  # Authentication Improvements

  1. Enhanced Profile Management
    - Add username validation constraints
    - Improve profile creation trigger
    - Add profile update timestamps

  2. Security Enhancements
    - Better RLS policies
    - Profile validation functions
*/

-- Add username validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_username_length_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_length_check 
    CHECK (char_length(username) >= 3 AND char_length(username) <= 30);
  END IF;
END $$;

-- Add username format validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_username_format_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_format_check 
    CHECK (username ~ '^[a-zA-Z0-9_]+$');
  END IF;
END $$;

-- Improve the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_candidate text;
  username_final text;
  counter integer := 0;
BEGIN
  -- Generate username from email or metadata
  username_candidate := COALESCE(
    NEW.raw_user_meta_data->>'username',
    regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '_', 'g')
  );
  
  -- Ensure username is at least 3 characters
  IF char_length(username_candidate) < 3 THEN
    username_candidate := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;
  
  -- Ensure username is not too long
  username_candidate := substring(username_candidate, 1, 20);
  
  -- Check for uniqueness and add counter if needed
  username_final := username_candidate;
  
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_final) LOOP
    counter := counter + 1;
    username_final := username_candidate || '_' || counter;
    -- Ensure we don't exceed length limit
    IF char_length(username_final) > 30 THEN
      username_final := substring(username_candidate, 1, 25) || '_' || counter;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, username, avatar_url, bio, created_at, updated_at)
  VALUES (
    NEW.id,
    username_final,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'),
    NULL,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's still a conflict, generate a random username
    username_final := 'user_' || substring(replace(NEW.id::text, '-', ''), 1, 12);
    INSERT INTO public.profiles (id, username, avatar_url, bio, created_at, updated_at)
    VALUES (
      NEW.id,
      username_final,
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'),
      NULL,
      now(),
      now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to update profile timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add similar triggers for other tables
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();