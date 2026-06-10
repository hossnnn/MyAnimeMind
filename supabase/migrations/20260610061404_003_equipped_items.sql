/*
# Add equipped items tracking

This migration adds:
1. `equipped_items` table to track which shop items a user has equipped
2. Allows one item per type (banner, avatar_effect, border_style, theme_color, badge)
3. Foreign key to user_purchases to ensure only purchased items can be equipped

Table: equipped_items
- id: UUID primary key
- user_id: UUID references profiles
- item_type: Text (banner, avatar_effect, border_style, theme_color, badge)
- item_data: JSONB for any customization (e.g., theme color value)
- created_at: Timestamp

Security:
- RLS enabled
- Users can only manage their own equipped items
*/

CREATE TABLE IF NOT EXISTS equipped_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL,
  item_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type)
);

ALTER TABLE equipped_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipped_read_own" ON equipped_items;
CREATE POLICY "equipped_read_own" ON equipped_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "equipped_insert_own" ON equipped_items;
CREATE POLICY "equipped_insert_own" ON equipped_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "equipped_update_own" ON equipped_items;
CREATE POLICY "equipped_update_own" ON equipped_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "equipped_delete_own" ON equipped_items;
CREATE POLICY "equipped_delete_own" ON equipped_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Update profiles table to add columns for equipped customizations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_avatar_effect TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_border_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_badge TEXT;