-- Create storage policies for post-images bucket (PRIVATE bucket)
-- Following official Supabase React Native documentation approach

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload images to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create post-images bucket as PRIVATE (not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Enable storage access for users based on user_id (from official docs)
CREATE POLICY "Enable storage access for users based on user_id" 
ON storage.objects
AS PERMISSIVE FOR ALL
TO public
USING (bucket_id = 'post-images' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'post-images' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]); 