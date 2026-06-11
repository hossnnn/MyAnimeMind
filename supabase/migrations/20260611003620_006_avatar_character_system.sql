-- Add avatar character system columns to profiles
ALTER TABLE profiles 
ADD COLUMN avatar_unlocked BOOLEAN DEFAULT false,
ADD COLUMN avatar_character_id INTEGER,
ADD COLUMN avatar_character_name TEXT;

-- Rename avatar_url usage note: we'll keep avatar_url for the character image URL
-- No action needed since avatar_url already exists

-- Add RLS policies for accessing avatar_unlocked (already covered by profiles policies)
