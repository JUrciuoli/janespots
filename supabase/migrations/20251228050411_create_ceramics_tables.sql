/*
  # Ceramics Tracker Database Schema

  ## Overview
  Creates the core database structure for a ceramics tracking application where potters
  can track their pieces through various creation stages, maintain a gallery of completed
  works, and plan future pieces.

  ## New Tables

  ### `pieces`
  Main table for tracking ceramic pieces through their lifecycle
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Name of the piece
  - `description` (text, nullable) - Optional description
  - `stage` (text) - Current stage: 'idea', 'wet', 'leather_hard', 'bone_dry', 'bisque_firing', 'glaze_firing', 'completed'
  - `is_graveyard` (boolean) - Marks failed pieces
  - `is_commission` (boolean) - Indicates if piece is a commission
  - `priority` (integer, nullable) - Order for planned pieces
  - `created_at` (timestamptz) - Creation timestamp
  - `completed_at` (timestamptz, nullable) - Completion timestamp

  ### `photos`
  Stores photos associated with pieces
  - `id` (uuid, primary key) - Unique identifier
  - `piece_id` (uuid, foreign key) - References pieces table
  - `url` (text) - Photo URL
  - `is_primary` (boolean) - Indicates primary photo for gallery display
  - `created_at` (timestamptz) - Upload timestamp

  ### `notes`
  Stores notes about pieces throughout their creation process
  - `id` (uuid, primary key) - Unique identifier
  - `piece_id` (uuid, foreign key) - References pieces table
  - `content` (text) - Note content
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enables RLS on all tables
  - Users can only access their own pieces and related data
  - Authenticated users required for all operations
  - Read, insert, update, and delete policies configured for proper ownership checks
*/

-- Create pieces table
CREATE TABLE IF NOT EXISTS pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  stage text NOT NULL DEFAULT 'idea',
  is_graveyard boolean DEFAULT false,
  is_commission boolean DEFAULT false,
  priority integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_stage CHECK (stage IN ('idea', 'wet', 'leather_hard', 'bone_dry', 'bisque_firing', 'glaze_firing', 'completed'))
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid REFERENCES pieces(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid REFERENCES pieces(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Pieces policies
CREATE POLICY "Users can view own pieces"
  ON pieces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pieces"
  ON pieces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pieces"
  ON pieces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pieces"
  ON pieces FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "Users can view photos of own pieces"
  ON photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = photos.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to own pieces"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = photos.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of own pieces"
  ON photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = photos.piece_id
      AND pieces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = photos.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own pieces"
  ON photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = photos.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

-- Notes policies
CREATE POLICY "Users can view notes of own pieces"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = notes.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes to own pieces"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = notes.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes of own pieces"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = notes.piece_id
      AND pieces.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = notes.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes of own pieces"
  ON notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pieces
      WHERE pieces.id = notes.piece_id
      AND pieces.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pieces_user_id_idx ON pieces(user_id);
CREATE INDEX IF NOT EXISTS pieces_stage_idx ON pieces(stage);
CREATE INDEX IF NOT EXISTS photos_piece_id_idx ON photos(piece_id);
CREATE INDEX IF NOT EXISTS notes_piece_id_idx ON notes(piece_id);