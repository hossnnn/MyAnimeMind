import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchAniList, getAnimeDetails } from '../lib/anilist';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { AniListSearchResult, AniListAnime } from '../lib/anilist';
import type { UserAnime } from '../types';
import { Search, Star, X, ExternalLink } from 'lucide-react';

export default function SearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<AniListSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AniListAnime | null>(null);
  const [userAnimeMap, setUserAnimeMap] = useState<Record<number, UserAnime>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserAnimeMap();
    }
  }, [user]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const searchResults = await searchAniList(searchQuery);
    setResults(searchResults);
    setLoading(false);
  };

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      performSearch(query);
    }
  };

  const loadUserAnimeMap = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_anime')
      .select('*, anime:anime_cache(*)');
    if (data) {
      const map: Record<number, UserAnime> = {};
      data.forEach((item: UserAnime) => {
        map[item.anime_id] = item;
      });
      setUserAnimeMap(map);
    }
  };

  const handleAnimeClick = async (animeId: number) => {
    setDetailsLoading(true);
    const anime = await getAnimeDetails(animeId);
    if (anime) {
      setSelectedAnime(anime);
    }
    setDetailsLoading(false);
  };

  const handleAddToList = async (status: 'watching' | 'plan_to_watch' | 'completed') => {
    if (!user || !selectedAnime) return;

    const existing = userAnimeMap[selectedAnime.id];

    if (existing) {
      await supabase
        .from('user_anime')
        .update({ status })
        .eq('id', existing.id);
    } else {
      // Cache anime if not already in database
      await supabase.from('anime_cache').upsert({
        id: selectedAnime.id,
        title_english: selectedAnime.title.english,
        title_romaji: selectedAnime.title.romaji,
        title_native: selectedAnime.title.native,
        synopsis: selectedAnime.description,
        episodes: selectedAnime.episodes,
        genres: selectedAnime.genres,
        studios: selectedAnime.studios.nodes.map((s) => s.name),
        start_date: selectedAnime.startDate.year
          ? `${selectedAnime.startDate.year}-${String(selectedAnime.startDate.month || 1).padStart(2, '0')}-${String(selectedAnime.startDate.day || 1).padStart(2, '0')}`
          : null,
        season: selectedAnime.season,
        year: selectedAnime.startDate?.year,
        cover_image_medium: selectedAnime.coverImage?.medium,
        cover_image_large: selectedAnime.coverImage?.large,
        cover_image_extra_large: selectedAnime.coverImage?.extraLarge,
        banner_image: selectedAnime.bannerImage,
        average_score: selectedAnime.averageScore,
        popularity: selectedAnime.popularity,
        status: selectedAnime.status,
        format: selectedAnime.format,
        cached_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      await supabase.from('user_anime').insert({
        user_id: user.id,
        anime_id: selectedAnime.id,
        status,
        episodes_watched: status === 'completed' ? (selectedAnime.episodes || 0) : 0,
      });

      // Award tokens for rating
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

    await loadUserAnimeMap();
    setSelectedAnime(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      watching: 'badge-primary',
      completed: 'badge-success',
      on_hold: 'badge-warning',
      dropped: 'badge-error',
      plan_to_watch: 'bg-slate-500/20 text-slate-400',
    };
    return styles[status] || '';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Search Anime</h1>
          <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                placeholder="Search for anime by title..."
                className="input pl-12 h-14 text-lg"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setSearchParams({});
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-poster rounded-lg" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((anime) => {
              const userEntry = userAnimeMap[anime.id];
              return (
                <button
                  key={anime.id}
                  onClick={() => handleAnimeClick(anime.id)}
                  className="group text-left"
                >
                  <div className="relative aspect-poster rounded-lg overflow-hidden bg-slate-800 mb-3">
                    {anime.coverImage?.extraLarge ? (
                      <img
                        src={anime.coverImage.extraLarge}
                        alt={anime.title.english || anime.title.romaji || 'Anime'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : anime.coverImage?.large ? (
                      <img
                        src={anime.coverImage.large}
                        alt={anime.title.english || anime.title.romaji || 'Anime'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : anime.coverImage?.medium ? (
                      <img
                        src={anime.coverImage.medium}
                        alt={anime.title.english || anime.title.romaji || 'Anime'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">?</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {userEntry && (
                      <div className="absolute top-2 left-2">
                        <span className={`badge ${getStatusBadge(userEntry.status)}`}>
                          {userEntry.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {userEntry?.score && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-xs">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white">{userEntry.score}/10</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-slate-200 line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors">
                    {anime.title.english || anime.title.romaji}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {anime.averageScore && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        {anime.averageScore}%
                      </span>
                    )}
                    {anime.episodes && <span>Eps: {anime.episodes}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">Search for your favorite anime</p>
          </div>
        )}
      </div>

      {/* Anime Detail Modal */}
      {selectedAnime && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setSelectedAnime(null)}>
          <div className="modal-content animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedAnime(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {detailsLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-48 rounded-lg" />
                <div className="skeleton h-8 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ) : (
              <>
                {selectedAnime.bannerImage && (
                  <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-xl">
                    <img
                      src={selectedAnime.bannerImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-800" />
                  </div>
                )}

                <div className="flex gap-4 mb-6">
                  {selectedAnime.coverImage?.extraLarge ? (
                    <img
                      src={selectedAnime.coverImage.extraLarge}
                      alt=""
                      className="w-32 h-48 object-cover rounded-lg -mt-16 relative bg-slate-700"
                    />
                  ) : selectedAnime.coverImage?.large ? (
                    <img
                      src={selectedAnime.coverImage.large}
                      alt=""
                      className="w-32 h-48 object-cover rounded-lg -mt-16 relative bg-slate-700"
                    />
                  ) : null}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {selectedAnime.title.english || selectedAnime.title.romaji}
                    </h2>
                    {selectedAnime.title.native && (
                      <p className="text-slate-400 text-sm mb-2">{selectedAnime.title.native}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedAnime.genres.map((genre) => (
                        <span key={genre} className="badge badge-primary">
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {selectedAnime.averageScore && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-medium">{selectedAnime.averageScore}%</span>
                        </span>
                      )}
                      {selectedAnime.episodes && <span>{selectedAnime.episodes} episodes</span>}
                      {selectedAnime.format && <span>{selectedAnime.format}</span>}
                    </div>
                  </div>
                </div>

                {selectedAnime.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Synopsis</h3>
                    <p
                      className="text-slate-400 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedAnime.description.slice(0, 500) }}
                    />
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Status:</span>{' '}
                      <span className="text-slate-300">{selectedAnime.status}</span>
                    </div>
                    {selectedAnime.studios.nodes.length > 0 && (
                      <div>
                        <span className="text-slate-500">Studio:</span>{' '}
                        <span className="text-slate-300">
                          {selectedAnime.studios.nodes.map((s) => s.name).join(', ')}
                        </span>
                      </div>
                    )}
                    {selectedAnime.startDate?.year && (
                      <div>
                        <span className="text-slate-500">Started:</span>{' '}
                        <span className="text-slate-300">{selectedAnime.startDate.year}</span>
                      </div>
                    )}
                    {selectedAnime.season && (
                      <div>
                        <span className="text-slate-500">Season:</span>{' '}
                        <span className="text-slate-300 capitalize">{selectedAnime.season}</span>
                      </div>
                    )}
                  </div>
                </div>

                {user && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleAddToList('watching')}
                      className="btn btn-primary flex-1"
                    >
                      Add to Watching
                    </button>
                    <button
                      onClick={() => handleAddToList('plan_to_watch')}
                      className="btn btn-secondary flex-1"
                    >
                      Plan to Watch
                    </button>
                    <button
                      onClick={() => handleAddToList('completed')}
                      className="btn btn-success flex-1"
                    >
                      Completed
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <Link
                    to={`/anime/${selectedAnime.id}`}
                    className="flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View Full Details
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
