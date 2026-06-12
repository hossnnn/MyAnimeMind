import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  searchAnimeForAvatar,
  searchCharacters,
  getAnimeCharacters,
  type AvatarSearchResult,
  type AniListCharacter,
  type AnimeCharacterEdge,
} from '../lib/anilist';
import {
  User,
  Lock,
  Search,
  ArrowLeft,
  Check,
  X,
  Wallet,
  Sparkles,
  Users,
} from 'lucide-react';

export default function AvatarEditorPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [avatarUnlocked, setAvatarUnlocked] = useState(false);
  const [searchMode, setSearchMode] = useState<'anime' | 'character'>('anime');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [animeResults, setAnimeResults] = useState<AvatarSearchResult[]>([]);
  const [characterResults, setCharacterResults] = useState<AniListCharacter[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AvatarSearchResult | null>(null);
  const [animeCharacters, setAnimeCharacters] = useState<AnimeCharacterEdge[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<AniListCharacter | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<{
    character_id: number | null;
    character_name: string | null;
    character_image: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserAvatarStatus();
    }
  }, [user]);

  const loadUserAvatarStatus = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('avatar_unlocked, avatar_character_id, avatar_character_name, avatar_url')
      .eq('id', user!.id)
      .single();

    if (data) {
      setAvatarUnlocked(data.avatar_unlocked || false);
      setCurrentAvatar({
        character_id: data.avatar_character_id,
        character_name: data.avatar_character_name,
        character_image: data.avatar_url,
      });
    }
    setLoading(false);
  };

  const handleUnlock = async () => {
    if (!user || user.tokens < 500) {
      setMessage('Not enough tokens! You need 500 tokens to unlock avatar customization.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setUnlocking(true);
    try {
      // Deduct tokens
      const { error: tokenError } = await supabase.from('token_transactions').insert({
        user_id: user.id,
        amount: -500,
        reason: 'Unlocked avatar customization',
      });

      if (tokenError) throw tokenError;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_unlocked: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setAvatarUnlocked(true);
      await refreshUser();
      setMessage('Avatar customization unlocked! You can now choose any anime character as your avatar.');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Failed to unlock. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
    setUnlocking(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    if (searchMode === 'anime') {
      const results = await searchAnimeForAvatar(searchQuery);
      setAnimeResults(results);
      setSelectedAnime(null);
      setAnimeCharacters([]);
    } else {
      const results = await searchCharacters(searchQuery);
      setCharacterResults(results);
    }
    setSearching(false);
  };

  const handleSelectAnime = async (anime: AvatarSearchResult) => {
    setSelectedAnime(anime);
    setLoadingCharacters(true);
    const characters = await getAnimeCharacters(anime.id);
    setAnimeCharacters(characters);
    setLoadingCharacters(false);
  };

  const handleSaveAvatar = async () => {
    if (!selectedCharacter || !user) return;

    setSaving(true);
    try {
      const imageUrl = selectedCharacter.image.large || selectedCharacter.image.medium;
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: imageUrl,
          avatar_character_id: selectedCharacter.id,
          avatar_character_name: selectedCharacter.name.full,
        })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentAvatar({
        character_id: selectedCharacter.id,
        character_name: selectedCharacter.name.full,
        character_image: imageUrl,
      });
      setSelectedCharacter(null);
      setMessage('Avatar updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Failed to save avatar. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(false);
  };

  const handleClearAvatar = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          avatar_character_id: null,
          avatar_character_name: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentAvatar(null);
      setMessage('Avatar cleared.');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Failed to clear avatar. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg">Sign in to customize your avatar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Locked state
  if (!avatarUnlocked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="card p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Avatar Customization Locked</h1>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Unlock the ability to choose any anime character as your avatar for a one-time fee of 500 tokens!
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 inline-block">
              <div className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-indigo-400" />
                <span className="text-white font-medium">Your balance:</span>
                <span className="text-indigo-400 font-bold">{user.tokens}</span>
                <span className="text-slate-400">tokens</span>
              </div>
            </div>

            <button
              onClick={handleUnlock}
              disabled={unlocking || user.tokens < 500}
              className={`btn ${user.tokens >= 500 ? 'btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed'} px-8 py-3`}
            >
              {unlocking ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Unlocking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Unlock for 500 Tokens
                </span>
              )}
            </button>

            {user.tokens < 500 && (
              <p className="text-amber-400 text-sm mt-4">
                You need {500 - user.tokens} more tokens to unlock this feature.
              </p>
            )}
          </div>

          {message && (
            <div className="mt-4 p-4 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-center">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unlocked state - Avatar Editor
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="w-7 h-7 text-indigo-400" />
              Avatar Editor
            </h1>
            <p className="text-slate-400 text-sm mt-1">Choose your anime character avatar</p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center">
            {message}
          </div>
        )}

        {/* Current Avatar Preview */}
        {currentAvatar && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Current Avatar</h2>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-400/50">
                {currentAvatar.character_image ? (
                  <img
                    src={currentAvatar.character_image}
                    alt={currentAvatar.character_name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">{currentAvatar.character_name || 'Default Avatar'}</p>
                <button
                  onClick={handleClearAvatar}
                  className="text-slate-400 text-sm hover:text-red-400 transition-colors mt-1"
                >
                  Clear Avatar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Mode Toggle */}
        <div className="card p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setSearchMode('anime');
                setAnimeResults([]);
                setCharacterResults([]);
                setSelectedAnime(null);
                setAnimeCharacters([]);
                setSearchQuery('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'anime'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search by Anime
            </button>
            <button
              onClick={() => {
                setSearchMode('character');
                setAnimeResults([]);
                setCharacterResults([]);
                setSelectedAnime(null);
                setAnimeCharacters([]);
                setSearchQuery('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'character'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Search by Character
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchMode === 'anime' ? 'Search for an anime...' : 'Search for a character (e.g., Gojo)...'}
                className="input w-full pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="btn btn-primary"
            >
              {searching ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Anime Search Results */}
        {searchMode === 'anime' && animeResults.length > 0 && !selectedAnime && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select an Anime</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {animeResults.map((anime) => (
                <button
                  key={anime.id}
                  onClick={() => handleSelectAnime(anime)}
                  className="group text-left"
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-800 mb-2 ring-2 ring-transparent group-hover:ring-indigo-400 transition-all">
                    {anime.coverImage?.large && (
                      <img
                        src={anime.coverImage.large}
                        alt={anime.title.english || anime.title.romaji || 'Anime'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2 group-hover:text-white transition-colors">
                    {anime.title.english || anime.title.romaji}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Anime - Character List */}
        {selectedAnime && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedAnime(null);
                    setAnimeCharacters([]);
                    setSelectedCharacter(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedAnime.title.english || selectedAnime.title.romaji}
                  </h2>
                  <p className="text-slate-400 text-sm">Characters from this anime</p>
                </div>
              </div>
            </div>

            {loadingCharacters ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : animeCharacters.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No characters found for this anime.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {animeCharacters.map(({ node }) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedCharacter(node)}
                    className={`group text-center ${
                      selectedCharacter?.id === node.id ? 'ring-2 ring-indigo-400 rounded-xl' : ''
                    }`}
                  >
                    <div className="aspect-square rounded-full overflow-hidden bg-slate-800 mb-2 ring-2 ring-transparent group-hover:ring-indigo-400 transition-all mx-auto w-24 h-24">
                      {node.image?.large ? (
                        <img
                          src={node.image.large}
                          alt={node.name.full}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                      {node.name.full}
                    </p>
                    {node.name.native && (
                      <p className="text-xs text-slate-500">{node.name.native}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Character Search Results (Direct) */}
        {searchMode === 'character' && characterResults.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select a Character</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {characterResults.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character)}
                  className={`group text-center ${
                    selectedCharacter?.id === character.id ? 'ring-2 ring-indigo-400 rounded-xl' : ''
                  }`}
                >
                  <div className="aspect-square rounded-full overflow-hidden bg-slate-800 mb-2 ring-2 ring-transparent group-hover:ring-indigo-400 transition-all mx-auto w-24 h-24">
                    {character.image?.large ? (
                      <img
                        src={character.image.large}
                        alt={character.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                    {character.name.full}
                  </p>
                  {character.name.native && (
                    <p className="text-xs text-slate-500">{character.name.native}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Character Preview & Save */}
        {selectedCharacter && (
          <div className="card p-6 border border-indigo-500/50">
            <h2 className="text-lg font-semibold text-white mb-4">Preview Your New Avatar</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-800 ring-4 ring-indigo-400/50 flex-shrink-0">
                {selectedCharacter.image?.large ? (
                  <img
                    src={selectedCharacter.image.large}
                    alt={selectedCharacter.name.full}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-white">{selectedCharacter.name.full}</h3>
                {selectedCharacter.name.native && (
                  <p className="text-slate-400">{selectedCharacter.name.native}</p>
                )}
                <p className="text-slate-400 text-sm mt-2">
                  This character will be your new avatar across MyAnimeMind.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="btn btn-ghost"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Save Avatar
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no results */}
        {searchMode === 'anime' && animeResults.length === 0 && searchQuery && !searching && (
          <div className="card p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No anime found. Try a different search.</p>
          </div>
        )}

        {searchMode === 'character' && characterResults.length === 0 && searchQuery && !searching && (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No characters found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
