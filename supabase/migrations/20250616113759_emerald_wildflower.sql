/*
  # Complete database schema for prompts application

  1. New Tables
    - `posts` - Main prompts/posts with content, images, and metadata
    - `comments` - User comments on posts with nested reply support
    - `likes` - Like system for both posts and comments
    - `bookmarks` - User's saved/favorite posts
    - `follows` - User following relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and public access
    - Secure user data with proper access controls

  3. Performance
    - Add indexes for frequently queried columns
    - Implement automatic count updates via triggers
    - Optimize for social media usage patterns

  4. Sample Data
    - Insert example posts for testing
    - Demonstrate all features and relationships
*/

-- Update the ai_source enum to match our needs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_source_type') THEN
    CREATE TYPE ai_source_type AS ENUM ('chatgpt', 'grok', 'gemini');
  END IF;
END $$;

-- Handle posts table - check if it exists and add missing columns
DO $$
BEGIN
  -- Create posts table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
    CREATE TABLE posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title text NOT NULL DEFAULT '',
      description text NOT NULL DEFAULT '',
      content text NOT NULL DEFAULT '',
      prompt text NOT NULL,
      ai_source ai_source_type NOT NULL,
      images text[] DEFAULT '{}',
      category text NOT NULL DEFAULT 'General',
      tags text[] DEFAULT '{}',
      likes_count integer DEFAULT 0,
      comments_count integer DEFAULT 0,
      shares_count integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add missing columns to existing posts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'title') THEN
      ALTER TABLE posts ADD COLUMN title text NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'description') THEN
      ALTER TABLE posts ADD COLUMN description text NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content') THEN
      ALTER TABLE posts ADD COLUMN content text NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'category') THEN
      ALTER TABLE posts ADD COLUMN category text NOT NULL DEFAULT 'General';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'tags') THEN
      ALTER TABLE posts ADD COLUMN tags text[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'likes_count') THEN
      ALTER TABLE posts ADD COLUMN likes_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'comments_count') THEN
      ALTER TABLE posts ADD COLUMN comments_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'shares_count') THEN
      ALTER TABLE posts ADD COLUMN shares_count integer DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Handle comments table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    CREATE TABLE comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      content text NOT NULL,
      likes_count integer DEFAULT 0,
      replies_count integer DEFAULT 0,
      parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add missing columns to existing comments table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'likes_count') THEN
      ALTER TABLE comments ADD COLUMN likes_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'replies_count') THEN
      ALTER TABLE comments ADD COLUMN replies_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_id') THEN
      ALTER TABLE comments ADD COLUMN parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Handle likes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
    CREATE TABLE likes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
      comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
      )
    );
  ELSE
    -- Add missing columns to existing likes table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'likes' AND column_name = 'comment_id') THEN
      ALTER TABLE likes ADD COLUMN comment_id uuid REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'likes_target_check') THEN
      ALTER TABLE likes ADD CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
      );
    END IF;
  END IF;
END $$;

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT follows_not_self CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Create unique constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'likes_user_post_unique') THEN
    CREATE UNIQUE INDEX likes_user_post_unique ON likes(user_id, post_id) WHERE post_id IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'likes_user_comment_unique') THEN
    CREATE UNIQUE INDEX likes_user_comment_unique ON likes(user_id, comment_id) WHERE comment_id IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bookmarks_user_post_unique') THEN
    CREATE UNIQUE INDEX bookmarks_user_post_unique ON bookmarks(user_id, post_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'follows_unique') THEN
    CREATE UNIQUE INDEX follows_unique ON follows(follower_id, following_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like posts/comments" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Authenticated users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON follows;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can like posts/comments" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookmarks" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can follow others" ON follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Create functions for updating counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_profile_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower count for the user being followed
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- Update following count for the user doing the following
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower count for the user being unfollowed
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    -- Update following count for the user doing the unfollowing
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON likes;
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

DROP TRIGGER IF EXISTS trigger_update_profile_counts ON follows;
CREATE TRIGGER trigger_update_profile_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_counts();

-- Insert sample data only if posts table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM posts LIMIT 1) THEN
    -- Only insert if we have profiles to reference
    IF EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
      INSERT INTO posts (user_id, title, description, content, prompt, ai_source, images, category, tags) VALUES
      (
        (SELECT id FROM profiles LIMIT 1),
        'Futuristic City Skyline',
        'Create a stunning futuristic cityscape with neon lights and flying cars',
        'Design a breathtaking futuristic city skyline at night, featuring towering skyscrapers with glowing neon signs, holographic advertisements floating in the air, and sleek flying cars navigating between buildings. The scene should have a cyberpunk aesthetic with purple and blue color schemes, reflecting on wet streets below.',
        'Create a futuristic cyberpunk city skyline at night with neon lights, flying cars, and holographic advertisements',
        'chatgpt',
        ARRAY['https://images.pexels.com/photos/2664947/pexels-photo-2664947.jpeg', 'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg'],
        'Art & Design',
        ARRAY['futuristic', 'cyberpunk', 'cityscape', 'neon']
      ),
      (
        (SELECT id FROM profiles LIMIT 1),
        'Magical Forest Adventure',
        'Imagine a mystical forest filled with glowing creatures and ancient magic',
        'Describe an enchanted forest where bioluminescent plants create a soft, ethereal glow throughout the woodland. Ancient trees with twisted roots and glowing mushrooms dot the landscape, while magical creatures like fireflies the size of hummingbirds dance through the air, leaving trails of sparkling dust.',
        'Generate an enchanted forest scene with bioluminescent plants, magical creatures, and ethereal lighting',
        'gemini',
        ARRAY['https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg', 'https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg'],
        'Fantasy',
        ARRAY['fantasy', 'magic', 'forest', 'creatures']
      ),
      (
        (SELECT id FROM profiles LIMIT 1),
        'Space Station Odyssey',
        'Design an advanced space station orbiting a distant planet',
        'Envision a massive space station with rotating habitation rings, solar panel arrays stretching for kilometers, and docking bays filled with various spacecraft. The station orbits a beautiful alien world with swirling clouds and multiple moons, while stars and nebulae create a spectacular backdrop.',
        'Create a detailed space station design orbiting an alien planet with multiple moons and nebulae in the background',
        'grok',
        ARRAY['https://images.pexels.com/photos/23769/pexels-photo.jpg', 'https://images.pexels.com/photos/73873/star-clusters-rosette-nebula-star-galaxies-73873.jpeg'],
        'Sci-Fi',
        ARRAY['space', 'station', 'future', 'technology']
      );
    END IF;
  END IF;
END $$;