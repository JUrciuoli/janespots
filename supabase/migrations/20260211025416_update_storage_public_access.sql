/*
  # Update Storage Policies for Public Access

  ## Overview
  Updates storage policies to allow public uploads without authentication.
  This is necessary for the app to function without requiring user authentication.

  ## Changes
  1. Drop existing restrictive policies
  2. Create new public access policies for all operations

  ## Security
  - Allows public uploads to piece-photos bucket
  - Maintains public read access
  - Allows public updates and deletes (needed for managing photos)
*/

-- Drop existing policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;
END $$;

-- Allow public uploads to piece-photos bucket
CREATE POLICY "Public can upload photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'piece-photos');

-- Allow public updates
CREATE POLICY "Public can update photos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'piece-photos');

-- Allow public deletes
CREATE POLICY "Public can delete photos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'piece-photos');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'piece-photos');