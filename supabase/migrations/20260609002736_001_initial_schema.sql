-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  accent_color TEXT DEFAULT '#6366f1',
  is_public BOOLEAN DEFAULT true,
  tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anime cache (stores AniList data)
CREATE TABLE anime_cache (
  id INTEGER PRIMARY KEY, -- AniList ID
  title_english TEXT,
  title_romaji TEXT,
  title_native TEXT,
  synopsis TEXT,
  episodes INTEGER,
  genres TEXT[],
  studios TEXT[],
  start_date DATE,
  end_date DATE,
  season TEXT,
  year INTEGER,
  cover_image_medium TEXT,
  cover_image_large TEXT,
  banner_image TEXT,
  average_score INTEGER,
  popularity INTEGER,
  status TEXT,
  format TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id)
);

-- User anime entries (watched/rated)
CREATE TABLE user_anime (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER REFERENCES anime_cache(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch')),
  score INTEGER CHECK (score >= 0 AND score <= 10),
  episodes_watched INTEGER DEFAULT 0,
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);

-- User episode progress
CREATE TABLE user_episode_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER REFERENCES anime_cache(id) ON DELETE CASCADE NOT NULL,
  episode_number INTEGER NOT NULL,
  watched BOOLEAN DEFAULT true,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anime_id, episode_number)
);

-- Token transaction log
CREATE TABLE token_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User purchased items
CREATE TABLE user_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL,
  item_data JSONB,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public lists
CREATE TABLE public_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- List items
CREATE TABLE list_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public_lists(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER REFERENCES anime_cache(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(list_id, anime_id)
);

-- Filler data
CREATE TABLE filler_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  anime_id INTEGER REFERENCES anime_cache(id) ON DELETE CASCADE NOT NULL,
  episode_number INTEGER NOT NULL,
  filler_type TEXT CHECK (filler_type IN ('canon', 'mixed', 'filler')) NOT NULL,
  source_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(anime_id, episode_number)
);

-- Drop reasons
CREATE TABLE drop_reasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  anime_id INTEGER REFERENCES anime_cache(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  custom_reason TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood recommendation history
CREATE TABLE recommendation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  time_preference TEXT,
  exclusions JSONB,
  recommended_anime_ids INTEGER[],
  selected_anime_id INTEGER,
  rated BOOLEAN DEFAULT false,
  rated_within_7_days BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Filler correction suggestions
CREATE TABLE filler_corrections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  anime_id INTEGER REFERENCES anime_cache(id) ON DELETE CASCADE NOT NULL,
  episode_number INTEGER NOT NULL,
  current_type TEXT NOT NULL,
  suggested_type TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_episode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE filler_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE filler_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for anime_cache (public read)
CREATE POLICY "anime_cache_read" ON anime_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "anime_cache_insert" ON anime_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anime_cache_update" ON anime_cache FOR UPDATE TO authenticated USING (true);

-- RLS Policies for user_anime
CREATE POLICY "user_anime_read" ON user_anime FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_anime_insert" ON user_anime FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_anime_update" ON user_anime FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_anime_delete" ON user_anime FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_episode_progress
CREATE POLICY "episode_progress_read" ON user_episode_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "episode_progress_insert" ON user_episode_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "episode_progress_update" ON user_episode_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "episode_progress_delete" ON user_episode_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for token_transactions
CREATE POLICY "tokens_read" ON token_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tokens_insert" ON token_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_purchases
CREATE POLICY "purchases_read" ON user_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "purchases_insert" ON user_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for public_lists
CREATE POLICY "lists_read" ON public_lists FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "lists_insert" ON public_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_update" ON public_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_delete" ON public_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for list_items
CREATE POLICY "list_items_read" ON list_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "list_items_insert" ON list_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "list_items_update" ON list_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "list_items_delete" ON list_items FOR DELETE TO authenticated USING (true);

-- RLS Policies for filler_data (public read)
CREATE POLICY "filler_read" ON filler_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "filler_insert" ON filler_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "filler_update" ON filler_data FOR UPDATE TO authenticated USING (true);

-- RLS Policies for drop_reasons (private read, own write)
CREATE POLICY "drop_reasons_read" ON drop_reasons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "drop_reasons_insert" ON drop_reasons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recommendation_history
CREATE POLICY "reco_read" ON recommendation_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reco_insert" ON recommendation_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reco_update" ON recommendation_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for filler_corrections
CREATE POLICY "corr_read" ON filler_corrections FOR SELECT TO authenticated USING (true);
CREATE POLICY "corr_insert" ON filler_corrections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)), COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_user_anime_user_id ON user_anime(user_id);
CREATE INDEX idx_user_anime_anime_id ON user_anime(anime_id);
CREATE INDEX idx_episode_progress_user_anime ON user_episode_progress(user_id, anime_id);
CREATE INDEX idx_filler_anime_episode ON filler_data(anime_id, episode_number);
CREATE INDEX idx_drop_reasons_anime ON drop_reasons(anime_id);
CREATE INDEX idx_public_lists_user ON public_lists(user_id);