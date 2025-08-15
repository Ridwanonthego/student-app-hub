

import React, { useState } from 'react';
import { Song } from '../media/songs';
import { PlayIcon, PauseIcon, PreviousTrackIcon, NextTrackIcon, VolumeUpIcon, VolumeMuteIcon, ChevronLeftIcon, SpinnerIcon, HomeIcon } from './Icons';

interface MusicPlayerProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onGoToHub: () => void;
  playlist: Song[];
  currentTrack: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectTrack: (index: number) => void;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  progress: number;
  duration: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  currentTrackIndex: number;
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  isExpanded, onToggleExpand, onGoToHub, playlist, currentTrack, isPlaying, onPlayPause, onNext, onPrev, onSelectTrack,
  volume, onVolumeChange, progress, duration, onSeek, isLoading, currentTrackIndex
}) => {
  const expandedWidth = 'w-64';
  const collapsedWidth = 'w-14';
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(0.5);

  const handleMuteToggle = () => {
    if (volume > 0) {
        setVolumeBeforeMute(volume);
        onVolumeChange({ target: { value: '0' } } as React.ChangeEvent<HTMLInputElement>);
    } else {
        onVolumeChange({ target: { value: String(volumeBeforeMute > 0 ? volumeBeforeMute : 0.5) } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className={`relative h-[60vh] max-h-[550px] bg-black/50 backdrop-blur-lg text-white transition-all duration-300 ease-in-out z-50 flex flex-col border-2 border-lime-500/30 rounded-2xl ${isExpanded ? expandedWidth : collapsedWidth}`}>
      <button onClick={onToggleExpand} className="absolute top-1/2 -right-4 -translate-y-1/2 bg-black/50 p-1 rounded-full border-2 border-lime-500/30 hover:bg-black/80 z-10">
        <ChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
      </button>

      {/* Main container for both views */}
      <div className="flex flex-col h-full overflow-hidden">
      
        {/* Expanded View Content */}
        <div className={`flex flex-col h-full transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex justify-between items-center p-4 border-b-2 border-lime-500/30 flex-shrink-0">
             <h3 className="text-xl font-bold text-lime-400">Playlist</h3>
             <button onClick={onGoToHub} className="p-1 hover:bg-white/20 rounded-full" aria-label="Go to Hub">
                <HomeIcon/>
             </button>
          </div>
          <ul className="flex-grow space-y-2 overflow-y-auto p-4 pt-2">
            {playlist.map((song, index) => (
              <li
                key={index}
                onClick={() => !isLoading && onSelectTrack(index)}
                className={`p-2 rounded cursor-pointer transition-colors text-sm ${currentTrackIndex === index ? 'bg-lime-400 text-black font-bold' : 'hover:bg-white/10'}`}
              >
                {index + 1}. {song.name}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Collapsed View Content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-between p-2 py-4 transition-opacity duration-200 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col items-center gap-2">
                <button onClick={handleMuteToggle} aria-label={volume > 0 ? "Mute" : "Unmute"}>
                    {volume > 0 ? <VolumeUpIcon className="w-5 h-5" /> : <VolumeMuteIcon className="w-5 h-5 text-red-500" />}
                </button>
                <div className="h-24 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={onVolumeChange}
                        className="w-20 accent-lime-400 cursor-pointer transform -rotate-90"
                        aria-label="Volume control"
                    />
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <button onClick={onPrev} className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50" disabled={isLoading} aria-label="Previous track"><PreviousTrackIcon className="w-5 h-5" /></button>
              <button onClick={onPlayPause} className="w-10 h-10 flex items-center justify-center bg-lime-400 text-black rounded-full border-2 border-black hover:bg-lime-500 transition-colors disabled:opacity-50" disabled={isLoading} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isLoading ? <SpinnerIcon className="w-5 h-5 text-black"/> : isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </button>
              <button onClick={onNext} className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50" disabled={isLoading} aria-label="Next track"><NextTrackIcon className="w-5 h-5" /></button>
            </div>

            <button onClick={onGoToHub} className="p-1.5 hover:bg-white/20 rounded-full" aria-label="Go to Hub">
                <HomeIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Song Info & Progress Bar (Bottom) */}
        <div className="flex-shrink-0 p-4 border-t-2 border-lime-500/30 bg-black/50">
           <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                <p className="font-bold text-sm truncate">{currentTrack?.name || 'Loading...'}</p>
                <p className="text-xs text-zinc-400">{formatTime(progress)} / {formatTime(duration)}</p>
                <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    value={progress}
                    onChange={onSeek}
                    className="w-full h-1.5 mt-2 accent-lime-400 cursor-pointer"
                    aria-label="Song progress"
                />
                <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleMuteToggle} aria-label={volume > 0 ? "Mute" : "Unmute"}>
                        {volume > 0 ? <VolumeUpIcon className="w-5 h-5" /> : <VolumeMuteIcon className="w-5 h-5 text-red-500" />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={onVolumeChange}
                        className="w-full h-1.5 accent-lime-400 cursor-pointer"
                        aria-label="Volume control"
                    />
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
