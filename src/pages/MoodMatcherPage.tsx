import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMoodRecommendations, getRandomRecommendation } from '../lib/anilist';
import type { AniListSearchResult } from '../lib/anilist';
import { supabase } from '../lib/supabase';
import {
  Moon,
  Shuffle,
  ChevronRight,
  Star,
  Sparkles,
  Clock,
} from 'lucide-react';

const moodOptions = [
  { id: 'emotional', icon: '😭', label: 'I want to cry', description: 'Emotional, sad, tearjerker' },
  { id: 'funny', icon: '😂', label: 'Make me laugh', description: 'Comedy, parody, lighthearted' },
  { id: 'mindblowing', icon: '🤯', label: 'Blow my mind', description: 'Psychological, thriller, complex' },
  { id: 'action', icon: '⚔️', label: 'Pump me up', description: 'Action, hype, epic battles' },
  { id: 'beautiful', icon: '🎨', label: 'Something beautiful', description: 'Visually stunning, artistic' },
  { id: 'chill', icon: '🛋️', label: 'Chill & relax', description: 'Slice of life, healing' },
  { id: 'romance', icon: '💕', label: 'Feel the romance', description: 'Love story, romantic comedy' },
  { id: 'educational', icon: '🧠', label: 'Teach me something', description: 'Educational, historical' },
  { id: 'horror', icon: '👻', label: 'Creep me out', description: 'Horror, disturbing' },
  { id: 'classic', icon: '🏆', label: 'I want a classic', description: 'Highly rated, influential' },
];

const timeOptions = [
  { id: 'short', icon: '🎬', label: 'One sitting', description: '1-12 episodes' },
  { id: 'medium', icon: '📺', label: 'Weekend binge', description: '13-26 episodes' },
  { id: 'long', icon: '🍿', label: 'Long haul', description: '50+ episodes' },
  { id: 'any', icon: '❓', label: 'No preference', description: 'Any length' },
];

const exclusionOptions = [
  { id: 'Ecchi', label: 'No fanservice / ecchi' },
  { id: 'Hentai', label: 'No adult content' },
  { id: 'Gore', label: 'No gore / extreme violence' },
];

export default function MoodMatcherPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [vibe, setVibe] = useState<string>('');
  const [timePreference, setTimePreference] = useState<string>('');
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AniListSearchResult[]>([]);
  const [randomLoading, setRandomLoading] = useState(false);
  const [surpriseResult, setSurpriseResult] = useState<AniListSearchResult | null>(null);

  const handleVibeSelect = (selected: string) => {
    setVibe(selected);
    setStep(2);
  };

  const handleTimeSelect = (selected: string) => {
    setTimePreference(selected);
    setStep(3);
  };

  const toggleExclusion = (exclusionId: string) => {
    setExclusions((prev) =>
      prev.includes(exclusionId) ? prev.filter((e) => e !== exclusionId) : [...prev, exclusionId]
    );
  };

  const getRecommendations = async () => {
    setLoading(true);
    const results = await getMoodRecommendations(vibe, timePreference, exclusions);
    setRecommendations(results);
    setStep(4);

    if (user && results.length > 0) {
      await supabase.from('recommendation_history').insert({
        user_id: user.id,
        vibe,
        time_preference: timePreference,
        exclusions,
        recommended_anime_ids: results.map((r) => r.id),
      });
    }

    setLoading(false);
  };

  const getSurprise = async () => {
    setRandomLoading(true);
    const result = await getRandomRecommendation();
    setSurpriseResult(result);
    setRandomLoading(false);
  };

  const startOver = () => {
    setStep(1);
    setVibe('');
    setTimePreference('');
    setExclusions([]);
    setRecommendations([]);
    setSurpriseResult(null);
  };

  const getMoodLabel = (vibeId: string) => {
    const moodData = moodOptions.find((m) => m.id === vibeId);
    return moodData?.label || '';
  };

  const getTimeLabel = (timeId: string) => {
    const timeData = timeOptions.find((t) => t.id === timeId);
    return timeData?.label || '';
  };

  const getMoodDescription = (result: AniListSearchResult): string => {
    if (!result.genres?.length) {
      return 'A highly-rated anime based on your preferences.';
    }
    const genre = result.genres[0]?.toLowerCase() || '';
    const descriptions: Record<string, string> = {
      drama: 'An emotional journey that will touch your heart.',
      comedy: 'Laugh-out-loud moments guaranteed.',
      psychological: 'A mind-bending experience that will keep you guessing.',
      action: 'Non-stop excitement and epic confrontations.',
      romance: 'A heartwarming love story.',
      horror: 'Chilling and suspenseful from start to finish.',
      mystery: 'Unravel secrets in this captivating thriller.',
      'slice of life': 'A peaceful, heartwarming slice of everyday life.',
      sports: 'Intense competition and inspirational moments.',
      adventure: 'An epic journey through exciting worlds.',
      fantasy: 'Explore magical worlds and fantastic creatures.',
    };
    return descriptions[genre] || 'Based on your selected preferences.';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
            <Moon className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">Mood Matcher</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            What Should I Watch?
          </h1>
          <p className="text-slate-400 text-lg">
            Answer a few quick questions and we'll find the perfect anime for your mood.
          </p>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    stepNum < step
                      ? 'bg-emerald-500 text-white'
                      : stepNum === step
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {stepNum < step ? '✓' : stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`w-8 h-1 rounded-full transition-colors ${
                      stepNum < step ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center mb-4">
            {step === 1 && (
              <button onClick={getSurprise} className="btn btn-success" disabled={randomLoading}>
                <Shuffle className="w-4 h-4 mr-2" />
                {randomLoading ? 'Finding...' : 'Surprise Me!'}
              </button>
            )}
          </div>

          {surpriseResult && (
            <div className="card p-6 animate-fadeIn">
              <div className="flex gap-4">
                {surpriseResult.coverImage?.extraLarge ? (
                  <img
                    src={surpriseResult.coverImage.extraLarge}
                    alt=""
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                ) : surpriseResult.coverImage?.large ? (
                  <img
                    src={surpriseResult.coverImage.large}
                    alt=""
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                ) : surpriseResult.coverImage?.medium ? (
                  <img
                    src={surpriseResult.coverImage.medium}
                    alt=""
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                ) : null}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {surpriseResult.title.english || surpriseResult.title.romaji}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                    {surpriseResult.averageScore && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {surpriseResult.averageScore}%
                      </span>
                    )}
                    {surpriseResult.episodes && <span>{surpriseResult.episodes} episodes</span>}
                  </div>
                  <Link
                    to={`/anime/${surpriseResult.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-white text-center mb-4">
              What vibe are you feeling right now?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {moodOptions.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleVibeSelect(mood.id)}
                  disabled={randomLoading}
                  className="card card-hover p-5 text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                      <span className="text-2xl">{mood.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">{mood.label}</div>
                      <div className="text-sm text-slate-400">{mood.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-white text-center mb-4">
              How much time do you have?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {timeOptions.map((time) => (
                <button
                  key={time.id}
                  onClick={() => handleTimeSelect(time.id)}
                  className="card card-hover p-5 text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                      <span className="text-2xl">{time.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">{time.label}</div>
                      <div className="text-sm text-slate-400">{time.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center mt-8">
              <button onClick={() => setStep(1)} className="btn btn-ghost">
                Start Over
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-white text-center mb-4">
              Any dealbreakers?
            </h2>
            <p className="text-center text-slate-400 mb-4">(Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {exclusionOptions.map((exclusion) => (
                <button
                  key={exclusion.id}
                  onClick={() => toggleExclusion(exclusion.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    exclusions.includes(exclusion.id)
                      ? 'border-red-500 bg-red-500/10 text-red-300'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm">{exclusion.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setStep(2)} className="btn btn-ghost">
                Back
              </button>
              <button onClick={getRecommendations} disabled={loading} className="btn btn-primary">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <h2 className="text-2xl font-bold text-white">Here's what we found</h2>
              </div>
              <p className="text-slate-400">
                {getMoodLabel(vibe)} &middot; {getTimeLabel(timePreference)}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card p-4">
                    <div className="flex gap-4">
                      <div className="skeleton w-20 h-28 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((result) => (
                  <Link
                    key={result.id}
                    to={`/anime/${result.id}`}
                    className="card card-hover p-4 group"
                  >
                    <div className="flex gap-4">
                      {result.coverImage?.extraLarge ? (
                        <img
                          src={result.coverImage.extraLarge}
                          alt={result.title.english || result.title.romaji || ''}
                          className="w-20 h-28 object-cover rounded-lg"
                          loading="lazy"
                        />
                      ) : result.coverImage?.large ? (
                        <img
                          src={result.coverImage.large}
                          alt={result.title.english || result.title.romaji || ''}
                          className="w-20 h-28 object-cover rounded-lg"
                          loading="lazy"
                        />
                      ) : result.coverImage?.medium ? (
                        <img
                          src={result.coverImage.medium}
                          alt={result.title.english || result.title.romaji || ''}
                          className="w-20 h-28 object-cover rounded-lg"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-lg bg-slate-700 flex items-center justify-center">
                          <span className="text-3xl">?</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                          {result.title.english || result.title.romaji}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          {result.averageScore && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" />
                              {result.averageScore}%
                            </span>
                          )}
                          {result.episodes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.episodes} eps
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {getMoodDescription(result)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🤔</div>
                <p className="text-slate-400 text-lg mb-2">No perfect matches found</p>
                <p className="text-slate-500 text-sm">Try adjusting your preferences</p>
              </div>
            )}

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={startOver} className="btn btn-ghost">
                Start Over
              </button>
              <button
                onClick={() => {
                  setStep(4);
                  getRecommendations();
                }}
                disabled={loading}
                className="btn btn-secondary"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Try Different
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
