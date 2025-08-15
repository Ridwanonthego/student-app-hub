

import { ChatUser } from "../chat/types";

// Base types from TMDB
export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type: 'movie';
}

export interface TvShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type: 'tv';
}

export type Media = Movie | TvShow;

// Detailed types
export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime: number | null;
  status: string;
  tagline: string | null;
}

export interface TvShowDetails extends TvShow {
  genres: { id: number; name: string }[];
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  tagline: string | null;
}

export type MediaDetails = MovieDetails | TvShowDetails;

// API Response type
export interface MediaListResponse {
  page: number;
  results: Media[];
  total_pages: number;
  total_results: number;
}

// Data model types
export interface Genre {
  id: number;
  name: string;
}

export interface Favorite {
  id: number;
  media_type: 'movie' | 'tv';
}

export interface RatedItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface TasteProfile {
  favoriteGenres: string[];
  favoriteActors: string[];
  favoriteKeywords: string[];
  excludedGenres: string[];
  preferredDecades: string[];
  preferredDescription?: string;
  likedItems?: RatedItem[];
  dislikedItems?: RatedItem[];
}

export interface DiscoverFilters {
    mediaType: 'movie' | 'tv' | 'anime';
    genre?: string;
    year?: number;
    rating?: number;
    language?: string;
}

// Component Prop types
export interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export interface ChatboxProps {
  onChat: (prompt: string) => void;
  isLoading: boolean;
}

export interface MediaCardProps {
    media: Media;
    onSelect: (mediaId: number, mediaType: 'movie' | 'tv') => void;
}

export interface MediaGridProps {
    title?: string;
    media: Media[];
    isLoading: boolean;
    onSelectMedia: (mediaId: number, mediaType: 'movie' | 'tv') => void;
}

export interface MediaDetailViewProps {
    media: MediaDetails;
    onClose: () => void;
    onToggleFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => void;
    isFavorite: boolean;
    onToggleLike: (mediaId: number, mediaType: 'movie' | 'tv', title: string) => void;
    isLiked: boolean;
    onToggleDislike: (mediaId: number, mediaType: 'movie' | 'tv', title: string) => void;
    isDisliked: boolean;
    onWatchWithFriend: () => void;
}

export interface TasteProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tasteProfile: TasteProfile) => void;
    initialProfile: TasteProfile;
    genres: Genre[];
}

export interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: DiscoverFilters) => void;
    genres: Genre[];
    languages: Language[];
}

export interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onSendInvite: (user: ChatUser) => void;
}


// Gemini types
export interface GeminiMediaSuggestion {
    title: string;
    year: string;
    type: 'movie' | 'tv series';
}