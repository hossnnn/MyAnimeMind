import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAnimeDetails } from '../lib/anilist';
import { supabase } from '../lib/supabase';
import type { AniListAnime } from '../lib/anilist';
import type { UserAnime, FillerData, EpisodeProgress, DropReason } from '../types';
import {
  Star,
  ArrowLeft,
  Calendar,
  PlayCircle,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AnimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<AniListAnime | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEntry, setUserEntry] = useState<UserAnime | null>(null);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const [fillerData, setFillerData] = useState<Map<number, FillerData>>(new Map());
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [userScore, setUserScore] = useState<number>(0);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [hideFiller, setHideFiller] = useState(false);
  const [dropReason, setDropReason] = useState<string>('');
  const [customDropReason, setCustomDropReason] = useState('');
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropReasons, setDropReasons] = useState<DropReason[]>([]);

  const dropReasonOptions = [
    'Got boring / pacing issues',
    'Animation quality dropped',
    "Didn't like the characters",
    'Too much filler',
    'Triggering content',
    'Other',
  ];

  useEffect(() => {
    if (id) {
      loadAnime();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      loadUserData();
      loadFillerData();
      loadDropReasons();
    }
  }, [user, id]);

  const loadAnime = async () => {
    setLoading(true);
    const animeData = await getAnimeDetails(parseInt(id!));
    setAnime(animeData);
    setLoading(false);

    if (animeData) {
      await supabase.from('anime_cache').upsert({
        id: animeData.id,
        title_english: animeData.title.english,
        title_romaji: animeData.title.romaji,
        title_native: animeData.title.native,
        synopsis: animeData.description,
        episodes: animeData.episodes,
        genres: animeData.genres,
        studios: animeData.studios.nodes.map((s) => s.name),
        start_date: animeData.startDate.year
          ? `${animeData.startDate.year}-${String(animeData.startDate.month || 1).padStart(2, '0')}-${String(animeData.startDate.day || 1).padStart(2, '0')}`
          : null,
        season: animeData.season,
        year: animeData.startDate?.year,
        cover_image_medium: animeData.coverImage?.medium,
        cover_image_large: animeData.coverImage?.large,
        banner_image: animeData.bannerImage,
        average_score: animeData.averageScore,
        popularity: animeData.popularity,
        status: animeData.status,
        format: animeData.format,
        cached_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }
  };

  const loadUserData = async () => {
    const [animeEntry, episodes] = await Promise.all([
      supabase.from('user_anime').select('*').eq('user_id', user!.id).eq('anime_id', id).single(),
      supabase.from('user_episode_progress').select('*').eq('user_id', user!.id).eq('anime_id', id),
    ]);

    if (animeEntry.data) {
      setUserEntry(animeEntry.data as UserAnime);
      setSelectedStatus(animeEntry.data.status);
      setUserScore(animeEntry.data.score || 0);
    }

    if (episodes.data) {
      const watched = new Set(episodes.data.map((e: EpisodeProgress) => e.episode_number).filter(Boolean));
      setWatchedEpisodes(watched);
    }
  };

  const loadFillerData = async () => {
    const { data } = await supabase
      .from('filler_data')
      .select('*')
      .eq('anime_id', id);
    if (data) {
      const map = new Map<number, FillerData>();
      data.forEach((item) => map.set((item as FillerData).episode_number, item as FillerData));
      setFillerData(map);
    }
  };

  const loadDropReasons = async () => {
    const { data } = await supabase
      .from('drop_reasons')
      .select('*')
      .eq('anime_id', id)
      .not('is_private', 'eq', true);
    if (data) {
      setDropReasons(data as DropReason[]);
    }
  };

  const updateStatus = async (status: string) => {
    if (!user || !anime) return;

    const updateData = {
      user_id: user.id,
      anime_id: anime.id,
      status,
      score: userScore,
    };

    if (userEntry) {
      await supabase.from('user_anime').update({ status, score: userScore }).eq('id', userEntry.id);
    } else {
      await supabase.from('user_anime').insert(updateData);
      // Award tokens
      await supabase.from('token_transactions').insert({
        user_id: user.id,
        amount: 2,
        reason: 'Added anime to list',
      });
      await supabase
        .from('profiles')
        .update({ tokens: user.tokens + 2 })
        .eq('id', user.id);
    }

    if (status === 'completed') {
      await supabase.from('token_transactions').insert({
        user_id: user.id,
        amount: 10,
        reason: 'Completed a series',
      });
      const { data } = await supabase.from('profiles').select('tokens').eq('id', user.id).single();
      if (data) {
        await supabase.from('profiles').update({ tokens: data.tokens + 10 }).eq('id', user.id);
      }
    }

    loadUserData();
  };

  const updateScore = async (score: number) => {
    if (!user || !anime) return;
    setUserScore(score);

    if (userEntry) {
      await supabase.from('user_anime').update({ score }).eq('id', userEntry.id);
    }
  };

  const toggleEpisode = async (episodeNumber: number) => {
    if (!user || !anime) return;

    const isWatched = watchedEpisodes.has(episodeNumber);

    if (isWatched) {
      await supabase
        .from('user_episode_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', anime.id)
        .eq('episode_number', episodeNumber);
      setWatchedEpisodes((prev) => {
        const next = new Set(prev);
        next.delete(episodeNumber);
        return next;
      });
    } else {
      await supabase.from('user_episode_progress').insert({
        user_id: user.id,
        anime_id: anime.id,
        episode_number: episodeNumber,
        watched: true,
      });
      setWatchedEpisodes((prev) => new Set([...prev, episodeNumber]));
    }

    // Update episode count
    const newCount = isWatched ? watchedEpisodes.size - 1 : watchedEpisodes.size + 1;
    await supabase.from('user_anime').update({ episodes_watched: newCount }).eq('user_id', user.id).eq('anime_id', anime.id);
  };

  const handleDrop = async () => {
    if (!user || !anime) return;
    const reasonToSend = dropReason === 'Other' ? customDropReason : dropReason;
    await supabase.from('drop_reasons').insert({
      user_id: user.id,
      anime_id: anime.id,
      reason: dropReason,
      custom_reason: reasonToSend,
      is_private: dropReason === 'Triggering content',
    });
    await updateStatus('dropped');
    setShowDropModal(false);
    loadDropReasons();
  };

  const markAllWatched = async () => {
    if (!user || !anime || !anime.episodes) return;
    const episodes = Array.from({ length: anime.episodes }, (_, i) => i + 1);
    const inserts = episodes.map((ep) => ({
      user_id: user.id,
      anime_id: anime.id,
      episode_number: ep,
      watched: true,
    }));
    await supabase.from('user_episode_progress').upsert(inserts, { onConflict: 'user_id,anime_id,episode_number' });
    setWatchedEpisodes(new Set(episodes));
  };

  const getFillerStyle = (episodeNumber: number) => {
    const fillerInfo = fillerData.get(episodeNumber);
    if (!fillerInfo) return '';
    switch (fillerInfo.filler_type) {
      case 'filler':
        return 'filler-filler';
      case 'mixed':
        return 'filler-mixed';
      case 'canon':
        return 'filler-canon';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-96 rounded-xl mb-8" />
          <div className="skeleton h-8 w-1/2 mb-4" />
          <div className="skeleton h-4 w-1/4" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Anime not found</h2>
          <Link to="/search" className="btn btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const episodeList = Array.from({ length: anime.episodes || 0 }, (_, i) => i + 1);
  const displayedEpisodes = showAllEpisodes ? episodeList : episodeList.slice(0, 24);
  const hasFillerInfo = fillerData.size > 0;

  const progress = anime.episodes
    ? (watchedEpisodes.size / anime.episodes) * 100
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Hero Section */}
        {anime.bannerImage && (
          <div className="relative h-64 sm:h-80 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 rounded-none sm:rounded-xl overflow-hidden">
            <img
              src={anime.bannerImage}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Cover Image */}
          <div className="flex-shrink-0 mx-auto">
            {anime.coverImage?.large && (
              <img
                src={anime.coverImage.large}
                alt={anime.title.english || anime.title.romaji || 'Anime'}
                className="w-48 h-72 object-cover rounded-xl shadow-2xl md:-mt-32 relative z-10 bg-slate-800"
                loading="lazy"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {anime.title.english || anime.title.romaji}
            </h1>
            {anime.title.native && (
              <p className="text-xl text-slate-400 mb-4">{anime.title.native}</p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
              {anime.genres.map((genre) => (
                <Link
                  key={genre}
                  to={`/search?genre=${encodeURIComponent(genre)}`}
                  className="badge badge-primary hover:bg-indigo-500/30 transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-slate-400 mb-6">
              {anime.averageScore && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold text-lg">{anime.averageScore}%</span>
                  <span>Score</span>
                </div>
              )}
              {anime.episodes && (
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-400" />
                  <span className="text-white font-medium">{anime.episodes}</span>
                  <span>Episodes</span>
                </div>
              )}
              {anime.format && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">{anime.format}</span>
                </div>
              )}
              {anime.status && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-medium">{anime.status}</span>
                </div>
              )}
              {anime.studios.nodes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-400" />
                  <span className="text-white font-medium">
                    {anime.studios.nodes.map((s) => s.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {user && (
              <div className="card p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        if (e.target.value === 'dropped') {
                          setShowDropModal(true);
                        } else {
                          updateStatus(e.target.value);
                        }
                      }}
                      className="input"
                    >
                      <option value="">Select status...</option>
                      <option value="watching">Watching</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="dropped">Dropped</option>
                      <option value="plan_to_watch">Plan to Watch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Rating</label>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                        <button
                          key={score}
                          onClick={() => updateScore(score)}
                          className={`p-2 rounded transition-colors ${
                            score <= userScore
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${score <= userScore ? 'fill-yellow-400' : ''}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedStatus && anime.episodes && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Progress</span>
                      <span className="text-sm text-white">{watchedEpisodes.size}/{anime.episodes}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={markAllWatched} className="btn btn-ghost text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark All Watched
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        {anime.description && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Synopsis</h2>
            <p
              className="text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: anime.description }}
            />
          </div>
        )}

        {/* Episodes */}
        {anime.episodes && anime.episodes > 0 && (
          <div className="card p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-white">Episodes</h2>
              <div className="flex flex-wrap gap-2">
                {hasFillerInfo && (
                  <>
                    <div className="flex items-center gap-4 mr-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-400">Canon</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-xs text-slate-400">Mixed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-slate-400">Filler</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setHideFiller(!hideFiller)}
                      className={`btn text-sm ${hideFiller ? 'btn-danger' : 'btn-ghost'}`}
                    >
                      {hideFiller ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {hideFiller ? 'Show Filler' : 'Hide Filler'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
              {displayedEpisodes
                .filter((ep) => !hideFiller || fillerData.get(ep)?.filler_type !== 'filler')
                .map((ep) => {
                  const isWatched = watchedEpisodes.has(ep);
                  return (
                    <button
                      key={ep}
                      onClick={() => user && toggleEpisode(ep)}
                      disabled={!user}
                      className={`relative p-3 rounded-lg text-sm font-medium transition-all ${getFillerStyle(ep)} ${
                        isWatched
                          ? 'bg-indigo-500/20 border-indigo-500'
                          : 'bg-slate-700/50 border-slate-600'
                      } ${
                        user ? 'hover:ring-2 hover:ring-indigo-500 cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span className="text-slate-300">Ep {ep}</span>
                      {isWatched && (
                        <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-indigo-400" />
                      )}
                    </button>
                  );
                })}
            </div>

            {anime.episodes > 24 && (
              <button
                onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                className="mt-4 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showAllEpisodes ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show all {anime.episodes} episodes
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Drop Reasons */}
        {dropReasons.length >= 3 && (
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h2 className="text-xl font-bold text-white">Others dropped this because...</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {(() => {
                const reasonCounts: Record<string, number> = {};
                dropReasons.forEach((r) => {
                  reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
                });
                return Object.entries(reasonCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([reason, count]) => (
                    <span key={reason} className="badge bg-yellow-500/20 text-yellow-400 text-sm px-4 py-2">
                      {reason} ({count})
                    </span>
                  ));
              })()}
            </div>
          </div>
        )}

        <div className="text-center text-sm text-slate-500">
          Data provided by{' '}
          <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
            AniList
          </a>
        </div>
      </div>

      {/* Drop Modal */}
      {showDropModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowDropModal(false)}>
          <div className="modal-content animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Why did you drop this?</h3>
            <p className="text-slate-400 text-sm mb-4">
              This helps others discover potential issues with anime.
            </p>
            <div className="space-y-3 mb-6">
              {dropReasonOptions.map((reason) => (
                <label
                  key={reason}
                  className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                    dropReason === reason
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="dropReason"
                    value={reason}
                    checked={dropReason === reason}
                    onChange={() => setDropReason(reason)}
                    className="hidden"
                  />
                  {reason}
                </label>
              ))}
              {dropReason === 'Other' && (
                <input
                  type="text"
                  value={customDropReason}
                  onChange={(e) => setCustomDropReason(e.target.value)}
                  placeholder="Enter your reason..."
                  className="input"
                />
              )}
              {dropReason === 'Triggering content' && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm">
                  This reason will be kept private and not shared with others.
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDropModal(false)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={handleDrop} disabled={!dropReason} className="btn btn-danger flex-1">
                Confirm Drop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
