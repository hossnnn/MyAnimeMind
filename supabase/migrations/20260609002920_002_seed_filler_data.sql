-- Anime entries for filler data
INSERT INTO anime_cache (id, title_english, title_romaji, episodes, genres, studios, cover_image_medium, status, format) VALUES
(21, 'One Piece', 'ONE PIECE', 1123, ARRAY['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy'], ARRAY['Toei Animation'], 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-Y8hIvQ7UWzHw.png', 'RELEASING', 'TV'),
(1535, 'Death Note', 'DEATH NOTE', 37, ARRAY['Mystery', 'Psychological', 'Supernatural', 'Thriller'], ARRAY['Madhouse'], 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1535-22QccQ1YhKAC.png', 'FINISHED', 'TV'),
(20, 'Naruto', 'NARUTO -ナルト-', 220, ARRAY['Action', 'Adventure', 'Fantasy'], ARRAY['Pierrot'], 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx20-HPqV7W5iSHCg.png', 'FINISHED', 'TV'),
(1735, 'Naruto Shippuden', 'NARUTO -ナルト- 疾風伝', 500, ARRAY['Action', 'Adventure', 'Fantasy'], ARRAY['Pierrot'], 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1735-YqNwX5NikAAG.png', 'FINISHED', 'TV'),
(269, 'Bleach', 'BLEACH', 366, ARRAY['Action', 'Adventure', 'Fantasy'], ARRAY['Pierrot'], 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx269-Y4PYTTFSwKz9.png', 'FINISHED', 'TV')
ON CONFLICT (id) DO NOTHING;

-- Naruto filler episodes (sample)
INSERT INTO filler_data (anime_id, episode_number, filler_type, source_notes) VALUES
(20, 136, 'filler', 'Land of Rice Fields arc'),
(20, 137, 'filler', 'Land of Rice Fields arc'),
(20, 138, 'filler', 'Land of Rice Fields arc'),
(20, 139, 'filler', 'Land of Rice Fields arc'),
(20, 140, 'filler', 'Land of Rice Fields arc'),
(20, 141, 'filler', 'Land of Rice Fields arc'),
(20, 142, 'filler', 'Land of Rice Fields arc'),
(20, 143, 'filler', 'Land of Rice Fields arc'),
(20, 1, 'canon', 'Canon'),
(20, 2, 'canon', 'Canon'),
(20, 3, 'canon', 'Canon'),
(20, 4, 'canon', 'Canon'),
(20, 5, 'canon', 'Canon')
ON CONFLICT (anime_id, episode_number) DO NOTHING;

-- Naruto Shippuden filler (sample)
INSERT INTO filler_data (anime_id, episode_number, filler_type, source_notes) VALUES
(1735, 57, 'filler', 'Filler arc'),
(1735, 58, 'filler', 'Filler arc'),
(1735, 59, 'filler', 'Filler arc'),
(1735, 60, 'filler', 'Filler arc'),
(1735, 1, 'canon', 'Canon'),
(1735, 2, 'canon', 'Canon'),
(1735, 3, 'canon', 'Canon')
ON CONFLICT (anime_id, episode_number) DO NOTHING;

-- Bleach filler (sample)
INSERT INTO filler_data (anime_id, episode_number, filler_type, source_notes) VALUES
(269, 64, 'filler', 'Bount arc'),
(269, 65, 'filler', 'Bount arc'),
(269, 66, 'filler', 'Bount arc'),
(269, 107, 'filler', 'Bount arc'),
(269, 108, 'filler', 'Bount arc'),
(269, 1, 'canon', 'Canon'),
(269, 2, 'canon', 'Canon'),
(269, 3, 'canon', 'Canon')
ON CONFLICT (anime_id, episode_number) DO NOTHING;