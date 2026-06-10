export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  accent_color: string;
  is_public: boolean;
  tokens: number;
  created_at: string;
  updated_at: string;
}

export interface AnimeCache {
  id: number;
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  synopsis: string | null;
  episodes: number | null;
  genres: string[];
  studios: string[];
  start_date: string | null;
  end_date: string | null;
  season: string | null;
  year: number | null;
  cover_image_medium: string | null;
  cover_image_large: string | null;
  banner_image: string | null;
  average_score: number | null;
  popularity: number;
  status: string;
  format: string | null;
  cached_at: string;
}

export interface UserAnime {
  id: string;
  user_id: string;
  anime_id: number;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  score: number | null;
  episodes_watched: number;
  start_date: string | null;
  finish_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  anime?: AnimeCache;
}

export interface EpisodeProgress {
  id: string;
  user_id: string;
  anime_id: number;
  episode_number: number;
  watched: boolean;
  watched_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  item_type: string;
  item_data: Record<string, unknown>;
  purchased_at: string;
}

export interface PublicList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface ListItem {
  id: string;
  list_id: string;
  anime_id: number;
  order_index: number;
  notes: string | null;
  anime?: AnimeCache;
}

export interface FillerData {
  id: string;
  anime_id: number;
  episode_number: number;
  filler_type: 'canon' | 'mixed' | 'filler';
  source_notes: string | null;
}

export interface DropReason {
  id: string;
  user_id: string | null;
  anime_id: number;
  reason: string;
  custom_reason: string | null;
  is_private: boolean;
  created_at: string;
}

export interface RecommendationHistory {
  id: string;
  user_id: string;
  mood: string;
  time_preference: string | null;
  exclusions: Record<string, unknown>;
  recommended_anime_ids: number[];
  selected_anime_id: number | null;
  rated: boolean;
  rated_within_7_days: boolean;
  created_at: string;
}

export interface UserStats {
  totalWatched: number;
  totalEpisodes: number;
  totalTimeHours: number;
  favoriteGenre: string | null;
  favoriteStudio: string | null;
  mostLikedAnime: { anime_id: number; score: number; title: string } | null;
}

export type WatchStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

export interface MoodAnswer {
  vibe: string;
  timePreference: string;
  exclusions: string[];
}
