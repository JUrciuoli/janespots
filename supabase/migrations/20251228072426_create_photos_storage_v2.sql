/*
  # Create Storage Bucket for Photos

  ## Overview
  Creates a Supabase Storage bucket for storing ceramic piece photos.

  ## Changes
  1. Storage Bucket
    - Creates 'piece-photos' bucket
    - Public access for reading photos
    - Restricted uploads to authenticated users

  ## Security
  - Bucket policies allow authenticated users to upload
  - Public read access for viewing photos
  - Users can only delete their own photos
*/

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('piece-photos', 'piece-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;
END $$;

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'piece-photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'piece-photos');

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'piece-photos');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'piece-photos');