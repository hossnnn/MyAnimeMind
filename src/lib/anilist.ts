const ANILIST_API = 'https://graphql.anilist.co';

export interface AniListAnime {
  id: number;
  title: {
    english: string | null;
    romaji: string | null;
    native: string | null;
  };
  description: string | null;
  episodes: number | null;
  genres: string[];
  studios: { nodes: { name: string }[] };
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  season: string | null;
  coverImage: {
    medium: string | null;
    large: string | null;
    extraLarge: string | null;
  };
  bannerImage: string | null;
  averageScore: number | null;
  popularity: number;
  status: string;
  format: string | null;
}

export interface AniListSearchResult {
  id: number;
  title: {
    english: string | null;
    romaji: string | null;
  };
  coverImage: { medium: string | null; large: string | null; extraLarge: string | null };
  episodes: number | null;
  averageScore: number | null;
  genres?: string[];
}

const SEARCH_QUERY = `
  query SearchAnime($search: String) {
    Page(page: 1, perPage: 20) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title { english romaji }
        coverImage { medium large }
        episodes
        averageScore
      }
    }
  }
`;

const DETAIL_QUERY = `
  query GetAnime($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { english romaji native }
      description
      episodes
      genres
      studios { nodes { name } }
      startDate { year month day }
      endDate { year month day }
      season
      coverImage { medium large extraLarge }
      bannerImage
      averageScore
      popularity
      status
      format
    }
  }
`;

const TRENDING_QUERY = `
  query TrendingAnime {
    Page(page: 1, perPage: 12) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title { english romaji }
        coverImage { medium large extraLarge }
        episodes
        averageScore
      }
    }
  }
`;

const MOOD_QUERY = `
  query MoodSearch($genres: [String], $episodes_greater: Int, $episodes_lesser: Int, $sort: [MediaSort]) {
    Page(page: 1, perPage: 20) {
      media(
        type: ANIME,
        genre_in: $genres,
        episodes_greater: $episodes_greater,
        episodes_lesser: $episodes_lesser,
        sort: $sort,
        averageScore_greater: 60
      ) {
        id
        title { english romaji }
        coverImage { medium large extraLarge }
        episodes
        averageScore
        genres
      }
    }
  }
`;

const TOP_RATED_QUERY = `
  query TopRated {
    Page(page: 1, perPage: 100) {
      media(type: ANIME, sort: SCORE_DESC, averageScore_greater: 70) {
        id
        title { english romaji }
        coverImage { medium large extraLarge }
        episodes
        averageScore
      }
    }
  }
`;

export async function searchAniList(search: string): Promise<AniListSearchResult[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search },
      }),
    });
    const json = await response.json();
    return json.data?.Page?.media || [];
  } catch {
    return [];
  }
}

export async function getAnimeDetails(id: number): Promise<AniListAnime | null> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: DETAIL_QUERY,
        variables: { id },
      }),
    });
    const json = await response.json();
    return json.data?.Media || null;
  } catch {
    return null;
  }
}

export async function getTrending(): Promise<AniListSearchResult[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: TRENDING_QUERY }),
    });
    const json = await response.json();
    return json.data?.Page?.media || [];
  } catch {
    return [];
  }
}

export async function getMoodRecommendations(
  mood: string,
  timePreference: string,
  exclusions: string[]
): Promise<AniListSearchResult[]> {
  const moodToGenres: Record<string, string[]> = {
    emotional: ['Drama', 'Romance', 'Tragedy'],
    funny: ['Comedy', 'Parody', 'Gag Humor'],
    mindblowing: ['Psychological', 'Mystery', 'Thriller'],
    action: ['Action', 'Martial Arts', 'Sports'],
    beautiful: ['Drama', 'Romance', 'Slice of Life'],
    chill: ['Slice of Life', 'Iyashikei', 'Comedy'],
    romance: ['Romance', 'Drama', 'Shoujo'],
    educational: ['Historical', 'Educational', 'Military'],
    horror: ['Horror', 'Psychological', 'Thriller'],
    classic: ['Drama', 'Action', 'Adventure'],
  };

  const timeToEpisodes: Record<string, { min: number; max: number }> = {
    short: { min: 0, max: 12 },
    medium: { min: 13, max: 26 },
    long: { min: 50, max: 9999 },
    any: { min: 0, max: 9999 },
  };

  const genres = moodToGenres[mood] || [];
  const episodeRange = timeToEpisodes[timePreference] || timeToEpisodes.any;

  // Filter out excluded genres
  const filteredGenres = genres.filter((g) => !exclusions.includes(g));

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: MOOD_QUERY,
        variables: {
          genres: filteredGenres.length > 0 ? filteredGenres : undefined,
          episodes_greater: episodeRange.min > 0 ? episodeRange.min - 1 : undefined,
          episodes_lesser: episodeRange.max < 9999 ? episodeRange.max + 1 : undefined,
          sort: ['SCORE_DESC', 'POPULARITY_DESC'],
        },
      }),
    });
    const json = await response.json();
    let results = json.data?.Page?.media || [];

    // Filter out exclusions
    if (exclusions.length > 0) {
      results = results.filter(
        (anime: { genres: string[] }) => !anime.genres.some((g) => exclusions.includes(g))
      );
    }

    return results.slice(0, 5);
  } catch {
    return [];
  }
}

export async function getRandomRecommendation(): Promise<AniListSearchResult | null> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: TOP_RATED_QUERY }),
    });
    const json = await response.json();
    const results = json.data?.Page?.media || [];
    if (results.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex];
  } catch {
    return null;
  }
}

// Character-related types and queries
export interface AniListCharacter {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    medium: string | null;
    large: string | null;
  };
}

const CHARACTER_SEARCH_QUERY = `
  query SearchCharacters($search: String) {
    Page(page: 1, perPage: 20) {
      characters(search: $search, sort: FAVOURITES_DESC) {
        id
        name { full native }
        image { medium large }
      }
    }
  }
`;

const ANIME_CHARACTERS_QUERY = `
  query GetAnimeCharacters($id: Int) {
    Media(id: $id, type: ANIME) {
      characters(sort: ROLE, page: 1) {
        edges {
          role
          node {
            id
            name { full native }
            image { medium large }
          }
        }
      }
    }
  }
`;

export async function searchCharacters(search: string): Promise<AniListCharacter[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CHARACTER_SEARCH_QUERY,
        variables: { search },
      }),
    });
    const json = await response.json();
    return json.data?.Page?.characters || [];
  } catch {
    return [];
  }
}

export interface AnimeCharacterEdge {
  role: string;
  node: AniListCharacter;
}

export async function getAnimeCharacters(animeId: number): Promise<AnimeCharacterEdge[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANIME_CHARACTERS_QUERY,
        variables: { id: animeId },
      }),
    });
    const json = await response.json();
    return json.data?.Media?.characters?.edges || [];
  } catch {
    return [];
  }
}
