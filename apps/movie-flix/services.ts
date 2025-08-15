
import { MediaListResponse, MediaDetails, Media, Movie, TvShow, DiscoverFilters, Genre, Language } from './types';

const TMDB_API_KEY = 'fa6762c13774edcc1abbf8f6e639a9e5';
const TMDB_API_URL = 'https://api.themoviedb.org/3';

const GENRE_MAP: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};
export const getGenreName = (id: number) => GENRE_MAP[id] || 'Unknown';

const tmdbFetch = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const url = new URL(`${TMDB_API_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.status_message || 'Network response from TMDB was not ok.');
  }
  return response.json();
};

export const searchMedia = (query: string, page: number = 1): Promise<MediaListResponse> => {
  return tmdbFetch<MediaListResponse>('/search/multi', { query, page: String(page) });
};

export const getMediaDetails = (mediaId: number, mediaType: 'movie' | 'tv'): Promise<MediaDetails> => {
  return tmdbFetch<MediaDetails>(`/${mediaType}/${mediaId}`);
};

export const getNowPlayingMovies = (): Promise<MediaListResponse> => {
  return tmdbFetch<MediaListResponse>('/movie/now_playing');
};

export const getPopularTvShows = (): Promise<MediaListResponse> => {
  return tmdbFetch<MediaListResponse>('/tv/popular');
};

export const getPopularAnime = (): Promise<MediaListResponse> => {
    return tmdbFetch<MediaListResponse>('/discover/tv', {
        with_genres: '16',
        with_keywords: '210024',
        sort_by: 'popularity.desc'
    });
};

export const getUpcomingMovies = (): Promise<MediaListResponse> => {
  return tmdbFetch<MediaListResponse>('/movie/upcoming');
};

export const getPopularInBDMovies = (): Promise<MediaListResponse> => {
  return tmdbFetch<MediaListResponse>('/movie/popular', { region: 'BD' });
};

export const getPopularHindiMovies = (): Promise<MediaListResponse> => {
  return tmdbFetch<MediaListResponse>('/discover/movie', {
    with_original_language: 'hi',
    region: 'IN',
    sort_by: 'popularity.desc',
    'vote_count.gte': '100',
  });
};

export const getMediaByTitleAndYear = async (title: string, year: string, type: 'movie' | 'tv series'): Promise<Media | null> => {
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const endpoint = `/search/${mediaType}`;
    
    const params: { query: string; year?: string; first_air_date_year?: string } = { query: title };
    if (year) {
      if(mediaType === 'movie') params.year = year;
      else params.first_air_date_year = year;
    }

    try {
        const response = await tmdbFetch<MediaListResponse>(endpoint, params);

        if (response.results && response.results.length > 0) {
            let matchedResult = response.results[0];
            if (year) {
                const yearMatch = response.results.find(m => {
                    const releaseDate = mediaType === 'movie' ? (m as Movie).release_date : (m as TvShow).first_air_date;
                    return releaseDate && releaseDate.startsWith(year);
                });
                if (yearMatch) matchedResult = yearMatch;
            }
             // Add media_type to the result, as it's missing from /search/movie and /search/tv
            return { ...matchedResult, media_type: mediaType } as Media;
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch ${type} details from TMDB for:`, title, error);
        return null;
    }
};

export const getMovieGenres = (): Promise<{ genres: Genre[] }> => {
    return tmdbFetch<{ genres: Genre[] }>('/genre/movie/list');
};

export const getTvGenres = (): Promise<{ genres: Genre[] }> => {
    return tmdbFetch<{ genres: Genre[] }>('/genre/tv/list');
};

export const getLanguages = (): Promise<Language[]> => {
    return tmdbFetch<Language[]>('/configuration/languages');
};

export const discoverMedia = (filters: DiscoverFilters): Promise<MediaListResponse> => {
    const { mediaType, genre, year, rating, language } = filters;
    
    let endpoint = `/discover/movie`;
    if (mediaType === 'tv' || mediaType === 'anime') {
        endpoint = `/discover/tv`;
    }

    const params: Record<string, string> = {
        sort_by: 'popularity.desc',
        'vote_count.gte': '100', // Ensure some level of quality
    };

    if (genre) params.with_genres = genre;
    if (year) {
        if (mediaType === 'movie') params.primary_release_year = String(year);
        else params.first_air_date_year = String(year);
    }
    if (rating) params['vote_average.gte'] = String(rating);
    if (language) params.with_original_language = language;

    if (mediaType === 'anime') {
        params.with_keywords = '210024'; // Anime keyword
        params.with_genres = '16'; // Ensure Animation genre
    }

    return tmdbFetch<MediaListResponse>(endpoint, params);
};
