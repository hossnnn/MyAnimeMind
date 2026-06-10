/*
# Add extra_large cover image column

This migration adds a cover_image_extra_large column to the anime_cache table
to store the highest quality image from AniList API for crisp display.

Changes:
- Add cover_image_extra_large TEXT column to anime_cache
*/

ALTER TABLE anime_cache ADD COLUMN IF NOT EXISTS cover_image_extra_large TEXT;