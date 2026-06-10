import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTrending } from '../lib/anilist';
import type { AniListSearchResult } from '../lib/anilist';
import { Sparkles, TrendingUp, Search, Moon, ChevronRight, Star } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState<AniListSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getTrending()
      .then((results) => {
        setTrending(results);
      })
      .catch(() => {
        // Silently fail - trending is optional
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="relative">
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">Your Personal Anime Journey</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Track. Discover.
            <span className="block gradient-text mt-2">Track Your Anime Story</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            MyAnimeMind helps you track your watched anime, discover new favorites based on your mood, and connect with the community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for anime..."
                  className="input pl-12 pr-24 h-14"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary h-10">
                  Search
                </button>
              </div>
            </form>

            <Link to="/mood" className="btn bg-purple-600 hover:bg-purple-700 text-white h-14 px-6 flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Find by Mood
            </Link>
          </div>

          {!user && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/signup" className="btn btn-primary">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white">Trending Now</h2>
            </div>
            <Link to="/search" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="skeleton aspect-poster rounded-lg" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : trending.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trending.map((anime) => (
                <Link
                  key={anime.id}
                  to={`/anime/${anime.id}`}
                  className="group"
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
                    {anime.episodes && (
                      <span className="flex items-center gap-1">
                        Eps: {anime.episodes}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Track Your Progress</h3>
              <p className="text-slate-400 text-sm">
                Mark episodes as watched, track your progress, and earn tokens for completing series.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Moon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Mood Matcher</h3>
              <p className="text-slate-400 text-sm">
                Don't know what to watch? Answer a few questions and get personalized recommendations.
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Filler Detection</h3>
              <p className="text-slate-400 text-sm">
                Skip the filler! Color-coded episode guides for long-running anime help you watch only what matters.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
