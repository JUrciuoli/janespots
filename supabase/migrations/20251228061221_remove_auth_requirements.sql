/*
  # Remove Authentication Requirements

  ## Changes
  1. Makes user_id nullable in pieces table
  2. Drops all existing RLS policies that require authentication
  3. Creates new public policies that allow unrestricted access
  4. Removes user ownership checks from all tables

  ## Security Note
  This migration removes authentication requirements for a single-user application.
  All data will be publicly accessible through the API.
*/

-- Make user_id nullable
ALTER TABLE pieces ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own pieces" ON pieces;
DROP POLICY IF EXISTS "Users can insert own pieces" ON pieces;
DROP POLICY IF EXISTS "Users can update own pieces" ON pieces;
DROP POLICY IF EXISTS "Users can delete own pieces" ON pieces;

DROP POLICY IF EXISTS "Users can view photos of own pieces" ON photos;
DROP POLICY IF EXISTS "Users can insert photos to own pieces" ON photos;
DROP POLICY IF EXISTS "Users can update photos of own pieces" ON photos;
DROP POLICY IF EXISTS "Users can delete photos of own pieces" ON photos;

DROP POLICY IF EXISTS "Users can view notes of own pieces" ON notes;
DROP POLICY IF EXISTS "Users can insert notes to own pieces" ON notes;
DROP POLICY IF EXISTS "Users can update notes of own pieces" ON notes;
DROP POLICY IF EXISTS "Users can delete notes of own pieces" ON notes;

-- Create new public access policies for pieces
CREATE POLICY "Public can view all pieces"
  ON pieces FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert pieces"
  ON pieces FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update pieces"
  ON pieces FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete pieces"
  ON pieces FOR DELETE
  TO public
  USING (true);

-- Create new public access policies for photos
CREATE POLICY "Public can view all photos"
  ON photos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert photos"
  ON photos FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update photos"
  ON photos FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete photos"
  ON photos FOR DELETE
  TO public
  USING (true);

-- Create new public access policies for notes
CREATE POLICY "Public can view all notes"
  ON notes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert notes"
  ON notes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update notes"
  ON notes FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete notes"
  ON notes FOR DELETE
  TO public
  USING (true);