import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, UserAnime, AnimeCache, UserStats } from '../types';
import {
  User,
  Edit3,
  Star,
  PlayCircle,
  Clock,
  Heart,
  Trophy,
  Lock,
  Eye,
  EyeOff,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<(UserAnime & { anime: AnimeCache })[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'stats'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ display_name: '', bio: '', is_public: true });

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profileData) {
      setLoading(false);
      return;
    }

    const profile = profileData as Profile;

    // Check if current user can view this profile
    const isOwner = currentUser?.id === profile.id;
    if (!profile.is_public && !isOwner) {
      setLoading(false);
      return;
    }

    setProfile(profile);
    setEditData({
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      is_public: profile.is_public,
    });

    // Load entries if public or owner
    if (profile.is_public || isOwner) {
      const { data: entriesData } = await supabase
        .from('user_anime')
        .select(`*, anime:anime_cache(*)`)
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });

      if (entriesData) {
        setEntries(entriesData as (UserAnime & { anime: AnimeCache })[]);
      }

      // Load stats
      await calculateStats(profile.id);
    }

    setLoading(false);
  };

  const calculateStats = async (userId: string) => {
    // Get completed entries
    const { data: completed } = await supabase
      .from('user_anime')
      .select(`*, anime:anime_cache(*)`)
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get all rated entries for genre/studio analysis
    const { data: rated } = await supabase
      .from('user_anime')
      .select(`*, anime:anime_cache(*)`)
      .eq('user_id', userId)
      .not('score', 'is', null);

    // Episode progress
    const { data: episodes } = await supabase
      .from('user_episode_progress')
      .select('episode_number')
      .eq('user_id', userId);

    // Calculate total episodes
    const totalEpisodesWatched = episodes?.length || 0;
    const totalTimeHours = Math.round(totalEpisodesWatched * 0.4); // ~24 min per episode

    // Calculate favorite genre
    const genreScores: Record<string, number[]> = {};
    const studioScores: Record<string, number[]> = {};
    let highestRated:
      | { anime_id: number; score: number; title: string; updated_at: string }
      | null = null;
    let maxScore = 0;

    rated?.forEach((entry: any) => {
      const score = entry.score;

      // Find highest rated (most recent tiebreak)
      if (score > maxScore || score === maxScore) {
        if (score > maxScore || entry.updated_at > (highestRated?.updated_at || '')) {
          highestRated = {
            anime_id: entry.anime_id,
            score,
            title: entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown',
            updated_at: entry.updated_at,
          };
          maxScore = score;
        }
      }

      // Calculate genre averages
      entry.anime?.genres?.forEach((genre: string) => {
        if (!genreScores[genre]) genreScores[genre] = [];
        genreScores[genre].push(score);
      });

      // Calculate studio averages
      entry.anime?.studios?.forEach((studio: string) => {
        if (!studioScores[studio]) studioScores[studio] = [];
        studioScores[studio].push(score);
      });
    });

    // Find favorite genre (highest avg rating)
    let favoriteGenre: string | null = null;
    let highestGenreAvg = 0;
    Object.entries(genreScores).forEach(([genre, scores]) => {
      if (scores.length >= 3) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > highestGenreAvg) {
          highestGenreAvg = avg;
          favoriteGenre = genre;
        }
      }
    });

    // Find favorite studio
    let favoriteStudio: string | null = null;
    let highestStudioAvg = 0;
    Object.entries(studioScores).forEach(([studio, scores]) => {
      if (scores.length >= 3) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > highestStudioAvg) {
          highestStudioAvg = avg;
          favoriteStudio = studio;
        }
      }
    });

    setStats({
      totalWatched: completed?.length || 0,
      totalEpisodes: totalEpisodesWatched,
      totalTimeHours: totalTimeHours,
      favoriteGenre,
      favoriteStudio,
      mostLikedAnime: highestRated,
    });
  };

  const handleSave = async () => {
    if (!currentUser || !profile) return;

    await supabase
      .from('profiles')
      .update({
        display_name: editData.display_name,
        bio: editData.bio,
        is_public: editData.is_public,
      })
      .eq('id', currentUser.id);

    setProfile({ ...profile, ...editData });
    setEditMode(false);
  };

  const isOwner = currentUser?.id === profile?.id;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="skeleton h-48 rounded-xl mb-8" />
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-bold text-white mb-2">Profile not found</h2>
          <p className="text-slate-400 mb-4">This profile is private or doesn't exist.</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="card overflow-hidden mb-8">
          {profile.banner_url ? (
            <div className="h-48 bg-center bg-cover" style={{ backgroundImage: `url(${profile.banner_url})` }} />
          ) : (
            <div
              className="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
            />
          )}

          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
              <div className="w-32 h-32 rounded-xl bg-slate-800 border-4 border-slate-800 overflow-hidden shadow-xl flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.display_name}
                      onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                      placeholder="Display name"
                      className="bg-slate-700 px-3 py-1 rounded-lg"
                    />
                  ) : (
                    profile.display_name || profile.username
                  )}
                </h1>
                <p className="text-slate-400">@{profile.username}</p>

                {editMode ? (
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="input mt-2 text-sm"
                    rows={2}
                  />
                ) : profile.bio ? (
                  <p className="text-slate-300 text-sm mt-2">{profile.bio}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                {isOwner && (
                  <>
                    {editMode ? (
                      <>
                        <button onClick={() => setEditMode(false)} className="btn btn-ghost btn-sm">
                          Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary btn-sm">
                          Save
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditMode(true)} className="btn btn-secondary btn-sm">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                  <span className="text-indigo-400 font-medium">{profile.tokens}</span>
                  <span className="text-slate-400 text-sm">tokens</span>
                </div>
              </div>
            </div>

            {editMode && (
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.is_public}
                    onChange={(e) => setEditData({ ...editData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-300">
                    {editData.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Public profile
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'list', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`btn text-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="text-sm text-slate-400">Completed</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalWatched}</div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <PlayCircle className="w-5 h-5" />
                <span className="text-sm text-slate-400">Episodes</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalEpisodes || 0}</div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm text-slate-400">Time Spent</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.totalTimeHours > 0 ? stats.totalTimeHours : 0}
                <span className="text-base text-slate-400 ml-1">hours</span>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Star className="w-5 h-5" />
                <span className="text-sm text-slate-400">Rated</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {entries.filter((e) => e.score !== null).length}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Favorites
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <div className="text-sm text-slate-400 mb-2">Favorite Genre</div>
                  <div className="text-lg font-medium text-white">
                    {stats.favoriteGenre || (
                      <span className="text-slate-500">Rate more anime to discover</span>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <div className="text-sm text-slate-400 mb-2">Favorite Studio</div>
                  <div className="text-lg font-medium text-white">
                    {stats.favoriteStudio || (
                      <span className="text-slate-500">Rate more anime to discover</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {stats.mostLikedAnime && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Most Liked Anime
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-24 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-3xl">{stats.mostLikedAnime.score}/10</span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{stats.mostLikedAnime.title}</div>
                    <div className="text-sm text-slate-400">Your highest rated</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {entries.slice(0, 20).map((entry) => (
              <Link
                key={entry.id}
                to={`/anime/${entry.anime_id}`}
                className="group"
              >
                <div className="relative aspect-poster rounded-lg overflow-hidden bg-slate-800 mb-3">
                  {entry.anime?.cover_image_medium ? (
                    <img
                      src={entry.anime.cover_image_medium}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">?</span>
                    </div>
                  )}
                  {entry.score && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-xs">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{entry.score}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'}
                </h3>
              </Link>
            ))}
          </div>
        )}

        {!profile.is_public && isOwner && (
          <div className="card p-4 flex items-center gap-2 text-yellow-400">
            <Lock className="w-5 h-5" />
            <span className="text-sm">Your profile is private. Only you can see your list.</span>
          </div>
        )}
      </div>
    </div>
  );
}
