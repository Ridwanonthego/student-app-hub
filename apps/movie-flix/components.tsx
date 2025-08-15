

import React, { useState, useEffect } from 'react';
import { SearchBarProps, ChatboxProps, MediaCardProps, MediaGridProps, MediaDetailViewProps, TasteProfileModalProps, FilterModalProps, Media, MovieDetails, TvShowDetails, Genre, DiscoverFilters, TasteProfile, Language } from './types';
import { getGenreName } from './services';
import { StarIcon, SparklesIcon, CloseIcon, PlayIcon, DownloadIcon, FilterIcon, CheckIcon, StarOutlineIcon, ThumbsUpIcon, ThumbsUpSolidIcon, ThumbsDownIcon, ThumbsDownSolidIcon } from '../../components/Icons';
import Loader from '../../components/Loader';

const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// --- SearchBar Component ---
export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for movies or series..."
        className="flex-grow bg-slate-800 border-2 border-slate-600 rounded-md p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="bg-cyan-400 text-slate-900 font-bold p-3 rounded-md border-2 border-cyan-400 hover:bg-cyan-500 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center w-14"
        disabled={isLoading}
      >
        {isLoading ? <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : 'Go'}
      </button>
    </form>
  );
};

// --- Chatbox Component ---
export const Chatbox: React.FC<ChatboxProps> = ({ onChat, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChat(prompt);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='e.g., "funny action movie in space"'
        className="flex-grow bg-slate-800 border-2 border-slate-600 rounded-md p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        disabled={isLoading}
      />
       <button 
        type="submit" 
        className="bg-slate-900 text-cyan-400 font-bold p-3 rounded-md border-2 border-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all disabled:bg-slate-600 disabled:text-slate-400 disabled:border-slate-600 disabled:cursor-not-allowed flex items-center justify-center w-14"
        disabled={isLoading}
      >
        {isLoading ? <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon />}
      </button>
    </form>
  );
};


// --- MediaCard Component ---
export const MediaCard: React.FC<MediaCardProps> = ({ media, onSelect }) => {
    const posterSrc = media.poster_path ? `${TMDB_IMAGE_URL}${media.poster_path}` : 'https://via.placeholder.com/500x750.png?text=No+Image';
    const title = 'title' in media ? media.title : media.name;
    const releaseDate = 'release_date' in media ? media.release_date : media.first_air_date;
    
    return (
        <div 
            onClick={() => onSelect(media.id, media.media_type)}
            className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden group transition-all duration-300 hover:border-cyan-400 hover:shadow-[6px_6px_0px_0px_rgba(34,211,238,1)] hover:-translate-x-1 hover:-translate-y-1 cursor-pointer"
            aria-label={`View details for ${title}`}
        >
            <div className="relative">
                <img src={posterSrc} alt={`Poster for ${title}`} className="w-full h-80 object-cover" />
                <div className="absolute top-2 right-2 bg-black/70 p-2 rounded-md flex items-center gap-1.5 backdrop-blur-sm">
                    <StarIcon />
                    <span className="text-white font-bold text-sm">{media.vote_average ? media.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-white font-bold text-lg truncate" title={title}>{title}</h3>
                <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
                    <span>{releaseDate ? releaseDate.substring(0, 4) : 'Unknown'}</span>
                    <span className="border border-slate-600 text-slate-300 rounded-full px-2 py-0.5 text-xs">{media.genre_ids && media.genre_ids.length > 0 ? getGenreName(media.genre_ids[0]) : 'Media'}</span>
                </div>
            </div>
        </div>
    );
};

// --- MediaGrid Component ---
export const MediaGrid: React.FC<MediaGridProps> = ({ title, media, isLoading, onSelectMedia }) => (
    <section className="mb-12">
        {title && <h2 className="text-3xl font-bold text-white border-l-4 border-cyan-400 pl-4 mb-6">{title}</h2>}
        {isLoading && media.length === 0 && <Loader className="border-cyan-400" />}
        {!isLoading && media.length === 0 && <p className="text-slate-400 text-center py-8">No items found.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {media.map(item => <MediaCard key={`${item.media_type}-${item.id}`} media={item} onSelect={onSelectMedia} />)}
        </div>
    </section>
);


// --- MediaDetailView Component ---
const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  value || value === 0 ? (
    <div className="mb-2">
      <p className="text-sm font-bold text-cyan-400">{label}</p>
      <p className="text-slate-300">{value}</p>
    </div>
  ) : null
);

export const MediaDetailView: React.FC<MediaDetailViewProps> = ({ media, onClose, onToggleFavorite, isFavorite, onToggleLike, isLiked, onToggleDislike, isDisliked }) => {
  const isMovie = media.media_type === 'movie';
  const title = isMovie ? (media as MovieDetails).title : (media as TvShowDetails).name;
  const releaseDate = isMovie ? (media as MovieDetails).release_date : (media as TvShowDetails).first_air_date;
  const year = releaseDate ? releaseDate.substring(0, 4) : '';
  const runtimeValue = isMovie ? (media as MovieDetails).runtime : (media as TvShowDetails).episode_run_time?.[0];
  const runtime = runtimeValue ? (isMovie ? `${runtimeValue} min` : `${runtimeValue} min/ep`) : null;
  
  const watchUrl = `https://www.2embed.cc/embed${isMovie ? '' : 'tv'}/${media.id}`;
  const downloadUrl = `https://fojik.site/?s=${encodeURIComponent(title)}`;
  const torrentUrl = `https://1337x.to/search/${encodeURIComponent(`${title} ${year}`).replace(/%20/g, '+')}/1/`;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
        <div
            className="bg-slate-900 border-2 border-cyan-400 rounded-lg shadow-[8px_8px_0px_0px_rgba(34,211,238,1)] w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="sticky top-0 bg-slate-900/80 backdrop-blur-sm p-4 flex justify-between items-center border-b-2 border-slate-800">
                <h2 className="text-2xl font-bold text-white" id="media-detail-title">{title} ({year})</h2>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors" aria-label="Close details">
                    <CloseIcon />
                </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8" aria-labelledby="media-detail-title">
                  <div className="md:w-1/3 flex-shrink-0">
                      <img src={media.poster_path ? `${TMDB_IMAGE_URL}${media.poster_path}` : 'https://via.placeholder.com/400x600.png?text=No+Image'} alt={`Poster for ${title}`} className="w-full rounded-md border-2 border-slate-700" />
                  </div>
                  <div className="md:w-2/3">
                      {media.tagline && <p className="text-slate-400 italic mb-4">"{media.tagline}"</p>}
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-slate-800 p-2 rounded-md">
                              <StarIcon />
                              <span className="text-white font-bold text-lg">{media.vote_average ? media.vote_average.toFixed(1) : 'N/A'}</span>
                          </div>
                          <button
                            onClick={() => onToggleLike(media.id, media.media_type, title)}
                            className="p-2 rounded-full text-slate-400 hover:text-green-400 hover:bg-slate-800 transition-colors"
                            aria-label={isLiked ? 'Unlike' : 'Like'}
                          >
                              {isLiked ? <ThumbsUpSolidIcon className="h-6 w-6 text-green-400" /> : <ThumbsUpIcon className="h-6 w-6" />}
                          </button>
                          <button
                            onClick={() => onToggleDislike(media.id, media.media_type, title)}
                            className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            aria-label={isDisliked ? 'Remove dislike' : 'Dislike'}
                          >
                              {isDisliked ? <ThumbsDownSolidIcon className="h-6 w-6 text-red-400" /> : <ThumbsDownIcon className="h-6 w-6" />}
                          </button>
                          <button
                              onClick={() => onToggleFavorite(media.id, media.media_type)}
                              className="p-2 rounded-full text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-colors"
                              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                          >
                              {isFavorite ? <StarIcon className="h-6 w-6 text-yellow-400" /> : <StarOutlineIcon className="h-6 w-6" />}
                          </button>
                          <span className="text-slate-400 border border-slate-600 px-2 py-1 rounded-full text-xs">{media.status}</span>
                          {runtime && <span className="text-slate-400 border border-slate-600 px-2 py-1 rounded-full text-xs">{runtime}</span>}
                      </div>
                      <p className="text-slate-300 mb-6">{media.overview}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DetailItem label="Genre" value={media.genres.map(g => g.name).join(', ')} />
                          <DetailItem label="Release Date" value={releaseDate} />
                           {!isMovie && <DetailItem label="Seasons" value={(media as TvShowDetails).number_of_seasons} />}
                           {!isMovie && <DetailItem label="Episodes" value={(media as TvShowDetails).number_of_episodes} />}
                      </div>
                  </div>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-4">Watch & Download</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                      <a
                          href={watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white font-bold p-3 rounded-md border-2 border-rose-700 hover:bg-rose-600 transition-all text-center"
                      >
                          <PlayIcon /> Watch Online
                      </a>
                      <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold p-3 rounded-md border-2 border-emerald-700 hover:bg-emerald-600 transition-all text-center"
                      >
                          <DownloadIcon /> Direct Download
                      </a>
                      <a
                          href={torrentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white font-bold p-3 rounded-md border-2 border-sky-700 hover:bg-sky-600 transition-all text-center"
                      >
                          <DownloadIcon /> Torrent
                      </a>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                      Note: Links lead to external sites. We are not responsible for their content. Use a VPN for safety.
                  </p>
              </div>
            </div>
        </div>
    </div>
  );
};

// --- TagInput Component ---
interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            e.preventDefault();
            if (!tags.includes(inputValue.trim())) {
                onTagsChange([...tags, inputValue.trim()]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span key={tag} className="bg-cyan-400/20 text-cyan-300 text-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-cyan-200 hover:text-white">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-slate-900 border-2 border-slate-600 rounded-md p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
        </div>
    );
};

// --- TasteProfileModal Component ---
export const TasteProfileModal: React.FC<TasteProfileModalProps> = ({ isOpen, onClose, onSave, initialProfile, genres }) => {
    const [profile, setProfile] = useState<TasteProfile>(initialProfile);

    useEffect(() => {
        setProfile(initialProfile);
    }, [initialProfile, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(profile);
        onClose();
    };
    
    const handleGenreChange = (genreName: string, list: keyof TasteProfile) => {
        const currentList = profile[list] as string[];
        const newList = currentList.includes(genreName)
            ? currentList.filter(g => g !== genreName)
            : [...currentList, genreName];
        setProfile(prev => ({ ...prev, [list]: newList }));
    };
    
    const decades = ['2020s', '2010s', '2000s', '1990s', '1980s', 'Older'];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div
                className="bg-slate-800 border-2 border-cyan-400 rounded-lg shadow-[8px_8px_0px_0px_rgba(34,211,238,1)] w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 flex justify-between items-center border-b-2 border-slate-700 sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10">
                    <h2 className="text-xl font-bold text-white" id="taste-modal-title">Tune Your Taste Profile</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors" aria-label="Close tuning modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Favorite Genres</h3>
                        <div className="flex flex-wrap gap-2">
                           {genres.map(genre => (
                               <button key={genre.id} onClick={() => handleGenreChange(genre.name, 'favoriteGenres')} className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${profile.favoriteGenres.includes(genre.name) ? 'bg-cyan-400 text-slate-900 border-cyan-400 font-bold' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                                   {genre.name}
                               </button>
                           ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Excluded Genres</h3>
                        <div className="flex flex-wrap gap-2">
                           {genres.map(genre => (
                               <button key={genre.id} onClick={() => handleGenreChange(genre.name, 'excludedGenres')} className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${profile.excludedGenres.includes(genre.name) ? 'bg-rose-500 text-white border-rose-500 font-bold' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                                   {genre.name}
                               </button>
                           ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Favorite Actors or Directors</h3>
                        <TagInput tags={profile.favoriteActors} onTagsChange={tags => setProfile(p => ({...p, favoriteActors: tags}))} placeholder="Add names and press Enter..." />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Favorite Keywords or Themes</h3>
                        <TagInput tags={profile.favoriteKeywords} onTagsChange={tags => setProfile(p => ({...p, favoriteKeywords: tags}))} placeholder="e.g., time travel, dystopia..." />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Describe Your Perfect Movie/Show</h3>
                        <textarea
                            value={profile.preferredDescription || ''}
                            onChange={e => setProfile(p => ({...p, preferredDescription: e.target.value}))}
                            placeholder="e.g., I love mind-bending sci-fi thrillers like Inception, but with a bit of dark humor. I dislike slow-paced dramas."
                            className="w-full h-24 bg-slate-900 border-2 border-slate-600 rounded-md p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Preferred Decades</h3>
                         <div className="flex flex-wrap gap-2">
                           {decades.map(decade => (
                               <button key={decade} onClick={() => handleGenreChange(decade, 'preferredDecades')} className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${profile.preferredDecades.includes(decade) ? 'bg-cyan-400 text-slate-900 border-cyan-400 font-bold' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                                   {decade}
                               </button>
                           ))}
                        </div>
                    </div>
                </div>
                 <div className="mt-auto p-4 flex justify-end gap-4 border-t-2 border-slate-700 sticky bottom-0 bg-slate-800/80 backdrop-blur-sm">
                    <button onClick={onClose} className="text-slate-400 font-bold p-3 rounded-md hover:bg-slate-700 transition-colors">Cancel</button>
                     <button onClick={handleSave} className="bg-cyan-400 text-slate-900 font-bold py-3 px-5 rounded-md border-2 border-cyan-400 hover:bg-cyan-500 transition-all">Save Preferences</button>
                </div>
            </div>
        </div>
    );
};

// --- FilterModal Component ---
export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, genres, languages }) => {
    const [filters, setFilters] = useState<DiscoverFilters>({ mediaType: 'movie' });

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(filters);
        onClose();
    };
    
    const currentYear = new Date().getFullYear();

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-slate-800 border-2 border-cyan-400 rounded-lg shadow-[8px_8px_0px_0px_rgba(34,211,238,1)] w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b-2 border-slate-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><FilterIcon /> Discover Content</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><CloseIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Media Type */}
                    <div>
                        <label className="block text-sm font-bold text-cyan-400 mb-2">Media Type</label>
                        <div className="flex gap-2">
                           {(['movie', 'tv', 'anime'] as const).map(type => (
                               <button key={type} onClick={() => setFilters(f => ({...f, mediaType: type, genre: undefined}))} className={`flex-1 capitalize px-3 py-2 text-sm rounded-md border-2 transition-colors ${filters.mediaType === type ? 'bg-cyan-400 text-slate-900 border-cyan-400 font-bold' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                                   {type}
                               </button>
                           ))}
                        </div>
                    </div>
                    {/* Genre */}
                    {filters.mediaType !== 'anime' && (
                        <div>
                             <label htmlFor="genre-select" className="block text-sm font-bold text-cyan-400 mb-2">Genre</label>
                             <select id="genre-select" value={filters.genre || ''} onChange={e => setFilters(f => ({...f, genre: e.target.value || undefined}))} className="w-full bg-slate-900 border-2 border-slate-600 rounded-md p-2 text-white focus:outline-none focus:border-cyan-400">
                                 <option value="">Any Genre</option>
                                 {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                             </select>
                        </div>
                    )}
                    {/* Year & Rating */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="year-input" className="block text-sm font-bold text-cyan-400 mb-2">Release Year</label>
                            <input id="year-input" type="number" placeholder="e.g., 2023" min="1900" max={currentYear} value={filters.year || ''} onChange={e => setFilters(f => ({...f, year: e.target.value ? Number(e.target.value) : undefined}))} className="w-full bg-slate-900 border-2 border-slate-600 rounded-md p-2 text-white focus:outline-none focus:border-cyan-400" />
                        </div>
                        <div>
                             <label htmlFor="rating-input" className="block text-sm font-bold text-cyan-400 mb-2">Min. Rating (0-10)</label>
                             <input id="rating-input" type="number" placeholder="e.g., 7.5" min="0" max="10" step="0.1" value={filters.rating || ''} onChange={e => setFilters(f => ({...f, rating: e.target.value ? Number(e.target.value) : undefined}))} className="w-full bg-slate-900 border-2 border-slate-600 rounded-md p-2 text-white focus:outline-none focus:border-cyan-400" />
                        </div>
                    </div>
                    {/* Language */}
                    <div>
                         <label htmlFor="language-select" className="block text-sm font-bold text-cyan-400 mb-2">Original Language</label>
                         <select id="language-select" value={filters.language || ''} onChange={e => setFilters(f => ({...f, language: e.target.value || undefined}))} className="w-full bg-slate-900 border-2 border-slate-600 rounded-md p-2 text-white focus:outline-none focus:border-cyan-400">
                             <option value="">Any Language</option>
                             {languages.sort((a,b) => a.english_name.localeCompare(b.english_name)).map(l => <option key={l.iso_639_1} value={l.iso_639_1}>{l.english_name}</option>)}
                         </select>
                    </div>
                </div>
                 <div className="p-4 flex justify-end gap-4 border-t-2 border-slate-700">
                    <button onClick={onClose} className="text-slate-400 font-bold p-3 rounded-md hover:bg-slate-700 transition-colors">Cancel</button>
                    <button onClick={handleApply} className="bg-cyan-400 text-slate-900 font-bold py-3 px-5 rounded-md border-2 border-cyan-400 hover:bg-cyan-500 transition-all">Apply Filters</button>
                </div>
            </div>
        </div>
    );
};
