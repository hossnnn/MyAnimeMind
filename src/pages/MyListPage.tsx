import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserAnime, AnimeCache } from '../types';
import {
  Star,
  Grid,
  List,
  SortAsc,
  SortDesc,
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Calendar,
  LayoutGrid,
} from 'lucide-react';

export default function MyListPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<(UserAnime & { anime: AnimeCache })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'title' | 'score' | 'updated'>('updated');
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_anime')
      .select(`*, anime:anime_cache(*)`)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) {
      setEntries(data as (UserAnime & { anime: AnimeCache })[]);
    }
    setLoading(false);
  };

  const statusOptions = [
    { value: '', label: 'All Status', icon: List },
    { value: 'watching', label: 'Watching', icon: PlayCircle },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
    { value: 'plan_to_watch', label: 'Plan to Watch', icon: Calendar },
    { value: 'on_hold', label: 'On Hold', icon: PauseCircle },
    { value: 'dropped', label: 'Dropped', icon: XCircle },
  ];

  const filteredEntries = entries
    .filter((e) => !filter || e.status === filter)
    .sort((a, b) => {
      const multi = sortDesc ? -1 : 1;
      switch (sortBy) {
        case 'title':
          return (
            multi *
            ((a.anime?.title_english || a.anime?.title_romaji || '').localeCompare(
              b.anime?.title_english || b.anime?.title_romaji || ''
            ))
          );
        case 'score':
          return multi * ((b.score || 0) - (a.score || 0));
        case 'updated':
        default:
          return multi * (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      }
    });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      watching: 'text-emerald-400 bg-emerald-500/20',
      completed: 'text-blue-400 bg-blue-500/20',
      plan_to_watch: 'text-slate-400 bg-slate-500/20',
      on_hold: 'text-yellow-400 bg-yellow-500/20',
      dropped: 'text-red-400 bg-red-500/20',
    };
    return colors[status] || '';
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sign in to view your list</h2>
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">My Anime List</h1>
          <Link to="/search" className="btn btn-primary">
            Add Anime
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const Icon = status.icon;
              return (
                <button
                  key={status.value}
                  onClick={() => setFilter(status.value)}
                  className={`btn text-sm ${
                    status.value === filter ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {status.label}
                  {status.value && entries.filter((e) => e.status === status.value).length > 0 && (
                    <span className="ml-1 text-xs">
                      ({entries.filter((e) => e.status === status.value).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input w-32"
            >
              <option value="updated">Updated</option>
              <option value="title">Title</option>
              <option value="score">Score</option>
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="btn btn-ghost p-2"
              title={sortDesc ? 'Descending' : 'Ascending'}
            >
              {sortDesc ? <SortDesc className="w-5 h-5" /> : <SortAsc className="w-5 h-5" />}
            </button>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-poster rounded-lg" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg mb-4">
              {filter ? `No anime with status "${filter}"` : 'Your list is empty'}
            </p>
            <Link to="/search" className="btn btn-primary">
              Search for Anime
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredEntries.map((entry) => (
              <Link
                key={entry.id}
                to={`/anime/${entry.anime_id}`}
                className="group"
              >
                <div className="relative aspect-poster rounded-lg overflow-hidden bg-slate-800 mb-3">
                  {entry.anime?.cover_image_extra_large ? (
                    <img
                      src={entry.anime.cover_image_extra_large}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : entry.anime?.cover_image_large ? (
                    <img
                      src={entry.anime.cover_image_large}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : entry.anime?.cover_image_medium ? (
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 left-2">
                    <span className={`badge text-xs ${getStatusColor(entry.status)}`}>
                      {entry.status.replace('_', ' ')}
                    </span>
                  </div>
                  {entry.score ? (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-xs">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{entry.score}</span>
                    </div>
                  ) : null}
                </div>
                <h3 className="text-sm font-medium text-slate-200 line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors">
                  {entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'}
                </h3>
                <div className="text-xs text-slate-400">
                  {entry.episodes_watched && entry.anime?.episodes ? (
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" />
                      {entry.episodes_watched}/{entry.anime.episodes}
                    </span>
                  ) : entry.anime?.episodes ? (
                    <span>{entry.anime.episodes} eps</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <Link
                key={entry.id}
                to={`/anime/${entry.anime_id}`}
                className="card p-4 flex items-center gap-4 group hover:ring-2 hover:ring-indigo-500 transition-all"
              >
                {entry.anime?.cover_image_extra_large ? (
                  <img
                    src={entry.anime.cover_image_extra_large}
                    alt=""
                    className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                ) : entry.anime?.cover_image_large ? (
                  <img
                    src={entry.anime.cover_image_large}
                    alt=""
                    className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                ) : entry.anime?.cover_image_medium ? (
                  <img
                    src={entry.anime.cover_image_medium}
                    alt=""
                    className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">
                    {entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {entry.anime?.synopsis?.slice?.(0, 100) || 'No description available'}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`badge text-xs ${getStatusColor(entry.status)}`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                  {entry.score && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{entry.score}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
