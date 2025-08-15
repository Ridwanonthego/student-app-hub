

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Media, MediaDetails, Movie, TvShow, DiscoverFilters, Genre, Language, TasteProfile, Favorite, RatedItem } from './types';
import { searchMedia, getMediaDetails, getNowPlayingMovies, getPopularTvShows, getPopularAnime, getMovieGenres, getTvGenres, getLanguages, discoverMedia, getUpcomingMovies, getPopularInBDMovies, getPopularHindiMovies } from './services';
import { getMediaRecommendationsFromAI, getFavoritesFromAI } from './gemini-service';
import { SearchBar, Chatbox, MediaGrid, MediaDetailView, TasteProfileModal, FilterModal, UserSearchModal } from './components';
import { BackArrowIcon, TuneIcon, FilterIcon, CloseIcon } from '../../components/Icons';
import Loader from '../../components/Loader';
import { supabase } from '../../supabase/client';
import { ChatUser } from '../chat/types';

const defaultTasteProfile: TasteProfile = {
  favoriteGenres: [],
  favoriteActors: [],
  favoriteKeywords: [],
  excludedGenres: [],
  preferredDecades: [],
  preferredDescription: '',
};

interface WatchFinderPageProps {
  onNavigateBack: () => void;
  apiKey: string;
  userId: string;
}

const WatchFinderPage: React.FC<WatchFinderPageProps> = ({ onNavigateBack, apiKey, userId }) => {
  // Media List State
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [discoverResults, setDiscoverResults] = useState<Media[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Media[]>([]);
  const [popularSeries, setPopularSeries] = useState<Media[]>([]);
  const [popularAnime, setPopularAnime] = useState<Media[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Media[]>([]);
  const [popularInBD, setPopularInBD] = useState<Media[]>([]);
  const [popularHindi, setPopularHindi] = useState<Media[]>([]);
  const [picksForYou, setPicksForYou] = useState<Media[]>([]);
  const [upcomingForYou, setUpcomingForYou] = useState<Media[]>([]);
  const [favoriteDetails, setFavoriteDetails] = useState<Media[]>([]);

  // Data State
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [likedItems, setLikedItems] = useState<RatedItem[]>([]);
  const [dislikedItems, setDislikedItems] = useState<RatedItem[]>([]);


  // Loading State
  const [isLoading, setIsLoading] = useState({
    search: false,
    initial: true,
    ai: false,
    details: false,
    discover: false,
    picks: false,
    upcoming: false,
    favorites: false,
    bd: false,
    hindi: false,
  });

  // UI State
  const [selectedItem, setSelectedItem] = useState<MediaDetails | null>(null);
  const [isTasteModalOpen, setIsTasteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(defaultTasteProfile);
  const [activeFilters, setActiveFilters] = useState<DiscoverFilters | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);


  // Error State
  const [error, setError] = useState<string | null>(null);

  const setLoading = useCallback((key: keyof typeof isLoading, value: boolean) => {
    setIsLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearAllResults = () => {
    setSearchResults([]);
    setDiscoverResults([]);
    setAiRecommendations([]);
    setError(null);
  };

  useEffect(() => {
    const fetchAllInitialData = async () => {
        setIsLoading(prev => ({ ...prev, initial: true, bd: true, hindi: true }));
        setError(null);
        if (!userId) {
            setIsLoading(prev => ({ ...prev, initial: false, bd: false, hindi: false }));
            return;
        }

        try {
            const [
                nowPlayingRes, popularSeriesRes, popularAnimeRes, movieGenresRes, tvGenresRes, languagesRes, popularInBDRes, popularHindiRes,
                profileDataRes, favoritesDataRes, ratingsDataRes
            ] = await Promise.all([
                getNowPlayingMovies(),
                getPopularTvShows(),
                getPopularAnime(),
                getMovieGenres(),
                getTvGenres(),
                getLanguages(),
                getPopularInBDMovies(),
                getPopularHindiMovies(),
                (supabase.from('watchfinder_profiles') as any).select('*').eq('id', userId).single(),
                (supabase.from('watchfinder_favorites') as any).select('media_id, media_type').eq('user_id', userId),
                (supabase.from('watchfinder_ratings') as any).select('media_id, media_type, rating, title').eq('user_id', userId)
            ]);
            
            setNowPlaying(nowPlayingRes.results.slice(0, 10).map(m => ({...m, media_type: 'movie'} as Movie)));
            setPopularSeries(popularSeriesRes.results.slice(0, 10).map(m => ({...m, media_type: 'tv'} as TvShow)));
            setPopularAnime(popularAnimeRes.results.slice(0, 10).map(m => ({...m, media_type: 'tv'} as TvShow)));
            setPopularInBD(popularInBDRes.results.slice(0, 10).map(m => ({...m, media_type: 'movie'} as Movie)));
            setPopularHindi(popularHindiRes.results.slice(0, 10).map(m => ({...m, media_type: 'movie'} as Movie)));

            const allGenres = [...movieGenresRes.genres, ...tvGenresRes.genres];
            const uniqueGenres = allGenres.filter((genre, index, self) => index === self.findIndex(g => g.id === genre.id));
            setGenres(uniqueGenres);
            setLanguages(languagesRes);

            const profileData: any = profileDataRes.data;
            if (profileData) {
                 setTasteProfile({
                    favoriteGenres: profileData.favorite_genres || [],
                    favoriteActors: profileData.favorite_actors || [],
                    favoriteKeywords: profileData.favorite_keywords || [],
                    excludedGenres: profileData.excluded_genres || [],
                    preferredDecades: profileData.preferred_decades || [],
                    preferredDescription: profileData.preferred_description || '',
                });
            }

            const favoritesData: any = favoritesDataRes.data;
            if (favoritesData) setFavorites(favoritesData.map((f: any) => ({ id: f.media_id, media_type: f.media_type as 'movie' | 'tv' })));
            
            const ratingsData: any = ratingsDataRes.data;
            if (ratingsData) {
                setLikedItems(ratingsData.filter((r: any) => r.rating === 'like').map((r: any) => ({ id: r.media_id, media_type: r.media_type as 'movie' | 'tv', title: r.title })));
                setDislikedItems(ratingsData.filter((r: any) => r.rating === 'dislike').map((r: any) => ({ id: r.media_id, media_type: r.media_type as 'movie' | 'tv', title: r.title })));
            }

        } catch (e: any) {
            console.error(e);
            if (e.code !== 'PGRST116') { // Ignore "single row not found" errors
              setError('Failed to fetch initial data. Please try again later.');
            }
        } finally {
            setIsLoading(prev => ({ ...prev, initial: false, bd: false, hindi: false }));
        }
    };

    fetchAllInitialData();
  }, [userId]);

  const hasProfileData = useMemo(() => {
    const hasTasteProfileValues =
      tasteProfile.favoriteGenres.length > 0 ||
      tasteProfile.favoriteActors.length > 0 ||
      tasteProfile.favoriteKeywords.length > 0 ||
      tasteProfile.excludedGenres.length > 0 ||
      tasteProfile.preferredDecades.length > 0 ||
      !!tasteProfile.preferredDescription;

    const hasRatedItems = likedItems.length > 0 || dislikedItems.length > 0;
    return hasTasteProfileValues || hasRatedItems;
  }, [tasteProfile, likedItems, dislikedItems]);

  useEffect(() => {
    if (!isLoading.initial && genres.length > 0 && hasProfileData) {
        const fetchLists = async () => {
            setLoading('picks', true);
            setLoading('upcoming', true);
            try {
                const fullTasteProfile = { ...tasteProfile, likedItems, dislikedItems };
                const picksPromise = getFavoritesFromAI(fullTasteProfile, apiKey);
                const upcomingPromise = getUpcomingMovies();
                const [picks, upcomingRes] = await Promise.all([picksPromise, upcomingPromise]);
                
                setPicksForYou(picks);
        
                const favoriteGenreIds = genres
                    .filter(g => tasteProfile.favoriteGenres.includes(g.name))
                    .map(g => g.id);
                
                if (favoriteGenreIds.length > 0) {
                    const filteredUpcoming = upcomingRes.results.filter(movie =>
                        movie.media_type === 'movie' && movie.genre_ids.some(gid => favoriteGenreIds.includes(gid))
                    );
                    setUpcomingForYou(filteredUpcoming.slice(0, 5) as Movie[]);
                } else {
                    setUpcomingForYou([]);
                }
            } catch (e) {
                setError("Could not load your personalized lists.");
            } finally {
                setLoading('picks', false);
                setLoading('upcoming', false);
            }
        };
        fetchLists();
    }
  }, [isLoading.initial, genres, hasProfileData, apiKey, tasteProfile, likedItems, dislikedItems, setLoading]);

  useEffect(() => {
    if (favorites.length === 0) {
        setFavoriteDetails([]);
        return;
    }
    const fetchDetails = async () => {
        setLoading('favorites', true);
        setError(null);
        try {
            const detailPromises = favorites.map(fav => getMediaDetails(fav.id, fav.media_type));
            const results = await Promise.allSettled(detailPromises);

            const successfulDetails = results
                .filter((result): result is PromiseFulfilledResult<MediaDetails> => result.status === 'fulfilled' && !!result.value)
                .map(result => result.value);
            
            setFavoriteDetails(successfulDetails);

            const failedCount = results.length - successfulDetails.length;
            if (failedCount > 0) {
                console.warn(`Failed to fetch details for ${failedCount} favorite(s).`);
            }
        } catch (e) {
            setError("An unexpected error occurred while loading your favorites.");
        } finally {
            setLoading('favorites', false);
        }
    };
    fetchDetails();
  }, [favorites, setLoading]);
  
  const handleSearch = async (query: string) => {
    if (!query) return;
    clearAllResults();
    setLoading('search', true);
    setActiveFilters(null);
    try {
      const results = await searchMedia(query);
      const filteredResults = results.results.filter(
          (item): item is Movie | TvShow => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path != null
      );
      setSearchResults(filteredResults);
      if (filteredResults.length === 0) setError("No movies or series found for your search.");
    } catch (e) {
      setError('Failed to perform search. Please check your connection.');
    } finally {
      setLoading('search', false);
    }
  };

  const handleAIChat = async (prompt: string) => {
    if (!prompt) return;
    clearAllResults();
    setLoading('ai', true);
    setActiveFilters(null);
    try {
      const fullTasteProfile = { ...tasteProfile, likedItems, dislikedItems };
      const media = await getMediaRecommendationsFromAI(prompt, fullTasteProfile, apiKey);
      setAiRecommendations(media);
       if (media.length === 0) {
        setError("The media detective couldn't find any matches. Try describing the plot or characters differently!");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred with the AI assistant.');
    } finally {
      setLoading('ai', false);
    }
  };
  
  const handleApplyFilters = async (filters: DiscoverFilters) => {
    clearAllResults();
    setLoading('discover', true);
    setActiveFilters(filters);
    try {
        const results = await discoverMedia(filters);
        const filteredResults = results.results.filter(
            (item): item is Movie | TvShow => (item.poster_path != null)
        );
        setDiscoverResults(filteredResults.map(m => (
            filters.mediaType === 'movie'
                ? { ...(m as any), media_type: 'movie' }
                : { ...(m as any), media_type: 'tv' }
        )));
        if (filteredResults.length === 0) setError("No content found for the selected filters.");
    } catch(e) {
        setError(e instanceof Error ? e.message : "Failed to fetch content with the selected filters.");
    } finally {
        setLoading('discover', false);
    }
  };
  
  const handleClearFilters = () => {
      setDiscoverResults([]);
      setActiveFilters(null);
      setError(null);
  };

  const handleSelectItem = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    setLoading('details', true);
    setError(null);
    setSelectedItem(null);
    try {
        const itemDetails = await getMediaDetails(mediaId, mediaType);
        setSelectedItem(itemDetails);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load item details.');
        setTimeout(() => setError(null), 3000);
    } finally {
        setLoading('details', false);
    }
  };

  const handleSaveTasteProfile = async (profile: TasteProfile) => {
    setTasteProfile(profile);
    const { error } = await (supabase.from('watchfinder_profiles') as any).upsert({
        id: userId,
        favorite_genres: profile.favoriteGenres,
        favorite_actors: profile.favoriteActors,
        favorite_keywords: profile.favoriteKeywords,
        excluded_genres: profile.excludedGenres,
        preferred_decades: profile.preferredDecades,
        preferred_description: profile.preferredDescription || '',
    });
    if (error) setError("Could not save your profile.");
  };
  
  const handleToggleFavorite = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    const isFav = favorites.some(f => f.id === mediaId && f.media_type === mediaType);
    if (isFav) {
        const { error } = await (supabase
            .from('watchfinder_favorites') as any)
            .delete()
            .match({ user_id: userId, media_id: mediaId, media_type: mediaType });
        if (!error) setFavorites(prev => prev.filter(f => !(f.id === mediaId && f.media_type === mediaType)));
    } else {
        const { error } = await (supabase
            .from('watchfinder_favorites') as any)
            .insert({ user_id: userId, media_id: mediaId, media_type: mediaType });
        if (!error) setFavorites(prev => [...prev, { id: mediaId, media_type: mediaType }]);
    }
  };

  const handleToggleLike = async (mediaId: number, mediaType: 'movie' | 'tv', title: string) => {
        const isLiked = likedItems.some(item => item.id === mediaId);
        if (isLiked) {
             const { error } = await (supabase.from('watchfinder_ratings') as any).delete().match({ user_id: userId, media_id: mediaId });
             if (!error) setLikedItems(prev => prev.filter(item => item.id !== mediaId));
        } else {
            const { error } = await (supabase.from('watchfinder_ratings') as any).upsert(
                { user_id: userId, media_id: mediaId, media_type: mediaType, title: title, rating: 'like' },
                { onConflict: 'user_id,media_id,media_type' }
            );
            if (!error) {
                setLikedItems(prev => [...prev, { id: mediaId, media_type: mediaType, title }]);
                setDislikedItems(d => d.filter(item => item.id !== mediaId));
            }
        }
    };

    const handleToggleDislike = async (mediaId: number, mediaType: 'movie' | 'tv', title: string) => {
         const isDisliked = dislikedItems.some(item => item.id === mediaId);
        if (isDisliked) {
            const { error } = await (supabase.from('watchfinder_ratings') as any).delete().match({ user_id: userId, media_id: mediaId });
            if (!error) setDislikedItems(prev => prev.filter(item => item.id !== mediaId));
        } else {
            const { error } = await (supabase.from('watchfinder_ratings') as any).upsert(
                { user_id: userId, media_id: mediaId, media_type: mediaType, title: title, rating: 'dislike' },
                { onConflict: 'user_id,media_id,media_type' }
            );
            if (!error) {
                setDislikedItems(prev => [...prev, { id: mediaId, media_type: mediaType, title }]);
                setLikedItems(l => l.filter(item => item.id !== mediaId));
            }
        }
    };
    
    const handleSendWatchInvite = async (receiver: ChatUser) => {
        if (!selectedItem) return;
        const title = 'title' in selectedItem ? selectedItem.title : selectedItem.name;
        
        const { error } = await (supabase.from('chat_messages') as any).insert({
            sender_id: userId,
            receiver_id: receiver.id,
            content: `I am interested to watch this movie with you.`,
            message_type: 'watch-invite',
            payload: {
                status: 'pending',
                movie: {
                    id: selectedItem.id,
                    type: selectedItem.media_type,
                    title: title,
                    poster_path: selectedItem.poster_path
                }
            }
        });
        if (error) {
            setError("Failed to send invite.");
        } else {
            setIsUserSearchModalOpen(false);
            setSelectedItem(null);
            alert(`Invite sent to ${receiver.username}!`);
        }
    };

  const renderContent = () => {
    if (isLoading.initial) return <Loader text="Assembling the silver screen..." className="border-cyan-400" />;
    
    if (activeFilters) {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white border-l-4 border-cyan-400 pl-4">Filtered Results</h2>
                    <button onClick={handleClearFilters} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors p-2 text-sm">
                        <CloseIcon /> Clear Filters
                    </button>
                </div>
                <MediaGrid media={discoverResults} isLoading={isLoading.discover} onSelectMedia={handleSelectItem} />
            </div>
        );
    }
    
    if (searchResults.length > 0) return <MediaGrid title="Search Results" media={searchResults} isLoading={isLoading.search} onSelectMedia={handleSelectItem} />;
    if (aiRecommendations.length > 0) return <MediaGrid title="The Detective's Findings" media={aiRecommendations} isLoading={isLoading.ai} onSelectMedia={handleSelectItem} />;
    
    if (isLoading.ai) return <Loader text="The media detective is on the case..." className="border-cyan-400" />;
    if (isLoading.search) return <Loader text="Searching..." className="border-cyan-400" />;
    if (isLoading.discover) return <Loader text="Discovering..." className="border-cyan-400" />;
    if (error) return <p className="text-center text-red-400 font-mono py-8">{error}</p>;
    
    return (
      <>
        {picksForYou.length > 0 && <MediaGrid title="Picks For You" media={picksForYou} isLoading={isLoading.picks} onSelectMedia={handleSelectItem} />}
        {upcomingForYou.length > 0 && (mediaTypeFilter === 'all' || mediaTypeFilter === 'movie') && <MediaGrid title="Upcoming For You" media={upcomingForYou} isLoading={isLoading.upcoming} onSelectMedia={handleSelectItem} />}
        {favoriteDetails.length > 0 && <MediaGrid title="Your Favorites" media={favoriteDetails.filter(m => mediaTypeFilter === 'all' || m.media_type === mediaTypeFilter)} isLoading={isLoading.favorites} onSelectMedia={handleSelectItem} />}
        
        {(mediaTypeFilter === 'all' || mediaTypeFilter === 'movie') && <MediaGrid title="Now In Theaters" media={nowPlaying} isLoading={isLoading.initial} onSelectMedia={handleSelectItem} />}
        {(mediaTypeFilter === 'all' || mediaTypeFilter === 'tv') && <MediaGrid title="Popular Series" media={popularSeries} isLoading={isLoading.initial} onSelectMedia={handleSelectItem} />}
        {(mediaTypeFilter === 'all' || mediaTypeFilter === 'movie') && <MediaGrid title="Popular in Bangladesh" media={popularInBD} isLoading={isLoading.bd} onSelectMedia={handleSelectItem}/>}
        {(mediaTypeFilter === 'all' || mediaTypeFilter === 'movie') && <MediaGrid title="Popular Hindi Cinema" media={popularHindi} isLoading={isLoading.hindi} onSelectMedia={handleSelectItem}/>}
        {(mediaTypeFilter === 'all' || mediaTypeFilter === 'tv') && <MediaGrid title="Popular Anime" media={popularAnime} isLoading={isLoading.initial} onSelectMedia={handleSelectItem}/>}
      </>
    );
  };

  return (
    <div className="bg-slate-900 rounded-lg border-2 border-slate-800 shadow-2xl max-w-screen-2xl mx-auto overflow-hidden">
      <div className="font-mono text-white">
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={onNavigateBack} 
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors p-2 -ml-2"
                aria-label="Back to Hub"
              >
                  <BackArrowIcon />
                  <span className="hidden sm:inline">Back to Hub</span>
              </button>
              <h1 className="text-3xl font-bold text-cyan-400 tracking-tighter">WatchFinder</h1>
              <div className="flex items-center gap-2">
                 <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors p-2"
                    aria-label="Filter media"
                  >
                      <FilterIcon />
                      <span className="hidden sm:inline">Filter</span>
                  </button>
                  <button
                    onClick={() => setIsTasteModalOpen(true)}
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors p-2 -mr-2"
                    aria-label="Tune recommendations"
                  >
                      <TuneIcon />
                      <span className="hidden sm:inline">Tune</span>
                  </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setMediaTypeFilter('all')} className={`px-4 py-1 text-sm font-bold rounded-full border-2 transition-colors ${mediaTypeFilter === 'all' ? 'bg-cyan-400 text-slate-900 border-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>All</button>
                <button onClick={() => setMediaTypeFilter('movie')} className={`px-4 py-1 text-sm font-bold rounded-full border-2 transition-colors ${mediaTypeFilter === 'movie' ? 'bg-cyan-400 text-slate-900 border-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>Movies</button>
                <button onClick={() => setMediaTypeFilter('tv')} className={`px-4 py-1 text-sm font-bold rounded-full border-2 transition-colors ${mediaTypeFilter === 'tv' ? 'bg-cyan-400 text-slate-900 border-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>TV Shows</button>
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-1/2">
                  <SearchBar onSearch={handleSearch} isLoading={isLoading.search} />
              </div>
              <div className="w-full md:w-1/2">
                  <Chatbox onChat={handleAIChat} isLoading={isLoading.ai} />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
            {isLoading.details && !selectedItem && <Loader text="Loading details..." className="border-cyan-400" />}
            {renderContent()}
        </main>
      </div>

      {selectedItem && (
        <MediaDetailView
            media={selectedItem}
            onClose={() => setSelectedItem(null)}
            isFavorite={favorites.some(f => f.id === selectedItem.id && f.media_type === selectedItem.media_type)}
            onToggleFavorite={handleToggleFavorite}
            isLiked={likedItems.some(item => item.id === selectedItem.id)}
            onToggleLike={handleToggleLike}
            isDisliked={dislikedItems.some(item => item.id === selectedItem.id)}
            onToggleDislike={handleToggleDislike}
            onWatchWithFriend={() => setIsUserSearchModalOpen(true)}
        />
      )}
      
      <UserSearchModal
        isOpen={isUserSearchModalOpen}
        onClose={() => setIsUserSearchModalOpen(false)}
        currentUserId={userId}
        onSendInvite={handleSendWatchInvite}
      />

      <TasteProfileModal 
        isOpen={isTasteModalOpen}
        onClose={() => setIsTasteModalOpen(false)}
        onSave={handleSaveTasteProfile}
        initialProfile={tasteProfile}
        genres={genres}
      />
      
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        genres={genres}
        languages={languages}
      />
    </div>
  );
};

export default WatchFinderPage;
