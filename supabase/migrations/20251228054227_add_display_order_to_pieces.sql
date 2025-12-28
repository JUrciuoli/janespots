/*
  # Add display_order field to pieces table

  1. Changes
    - Add `display_order` column to `pieces` table to support manual ordering of ideas
    - Set default value to current timestamp as integer for auto-incrementing behavior
    - Create index on display_order for efficient sorting
  
  2. Notes
    - This field will be used for drag-to-reorder functionality on the Ideas page
    - Higher values will appear later in the list
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pieces' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE pieces ADD COLUMN display_order INTEGER DEFAULT EXTRACT(EPOCH FROM now())::INTEGER;
    CREATE INDEX IF NOT EXISTS idx_pieces_display_order ON pieces(display_order);
  END IF;
END $$;