/*
  # Update stage from 'wet' to 'new'

  1. Changes
    - Drops the old stage constraint
    - Updates existing pieces with stage 'wet' to 'new'
    - Creates a new stage constraint with 'new' instead of 'wet'

  2. Notes
    - This migration safely updates all existing data
    - Maintains data integrity with updated constraint
*/

-- Drop the old constraint first
ALTER TABLE pieces 
DROP CONSTRAINT IF EXISTS valid_stage;

-- Update existing pieces from 'wet' to 'new'
UPDATE pieces 
SET stage = 'new' 
WHERE stage = 'wet';

-- Add the new constraint with 'new' instead of 'wet'
ALTER TABLE pieces 
ADD CONSTRAINT valid_stage 
CHECK (stage IN ('idea', 'new', 'leather_hard', 'bone_dry', 'bisque_firing', 'glaze_firing', 'completed'));