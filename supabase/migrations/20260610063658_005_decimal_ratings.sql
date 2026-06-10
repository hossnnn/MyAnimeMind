/*
# Change rating score to decimal

This migration changes the score column from integer to decimal
to allow ratings with one decimal place (e.g., 7.5, 9.2).

Changes:
- Alter user_anime.score from integer to numeric(3,1)
*/

ALTER TABLE user_anime ALTER COLUMN score TYPE numeric(3,1) USING score::numeric(3,1);