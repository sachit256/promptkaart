/*
  # Fix Username Handling with @ Prefix

  1. Updates
    - Update username validation to allow @ prefix
    - Modify handle_new_user function to create usernames with @ prefix
    - Update existing usernames to have @ prefix if they don't already

  2. Security
    - Maintain existing RLS policies
    - Keep username uniqueness constraints
*/

-- Update username format validation to allow @ prefix
DO $$
BEGIN
  -- Drop existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_username_format_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_username_format_check;
  END IF;
  
  -- Add new constraint that allows @ prefix
  ALTER TABLE profiles ADD CONSTRAINT profiles_username_format_check 
  CHECK (username ~ '^@[a-zA-Z0-9_]+$');
END $$;

-- Update username length validation for @ prefix
DO $$
BEGIN
  -- Drop existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_username_length_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_username_length_check;
  END IF;
  
  -- Add new constraint (minimum 4 chars including @)
  ALTER TABLE profiles ADD CONSTRAINT profiles_username_length_check 
  CHECK (char_length(username) >= 4 AND char_length(username) <= 31);
END $$;

-- Update existing usernames to have @ prefix if they don't already
UPDATE profiles 
SET username = '@' || username 
WHERE NOT username LIKE '@%';

-- Improve the handle_new_user function to create usernames with @ prefix
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
  
  -- Remove @ if it already exists at the start
  IF username_candidate LIKE '@%' THEN
    username_candidate := substring(username_candidate, 2);
  END IF;
  
  -- Ensure username is at least 3 characters (will be 4 with @)
  IF char_length(username_candidate) < 3 THEN
    username_candidate := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;
  
  -- Ensure username is not too long (max 30 chars including @)
  username_candidate := substring(username_candidate, 1, 20);
  
  -- Add @ prefix
  username_final := '@' || username_candidate;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_final) LOOP
    counter := counter + 1;
    username_final := '@' || username_candidate || '_' || counter;
    -- Ensure we don't exceed length limit
    IF char_length(username_final) > 31 THEN
      username_final := '@' || substring(username_candidate, 1, 25) || '_' || counter;
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
    username_final := '@user_' || substring(replace(NEW.id::text, '-', ''), 1, 12);
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