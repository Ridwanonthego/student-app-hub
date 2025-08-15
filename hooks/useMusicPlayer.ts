import { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { songList, Song } from '../media/songs';

export const useMusicPlayer = (session: Session | null) => {
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(0.3);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
    const [isSongLoading, setIsSongLoading] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

    // Shuffle playlist on initial load
    useEffect(() => {
        setPlaylist(songList.sort(() => 0.5 - Math.random()));
    }, []);

    const preloadNextTrack = useCallback((trackIndex: number) => {
        if (preloadAudioRef.current && playlist.length > 0) {
            const nextIndex = (trackIndex + 1) % playlist.length;
            preloadAudioRef.current.src = playlist[nextIndex].url;
            preloadAudioRef.current.load();
        }
    }, [playlist]);

    // Initialize player and event listeners
    useEffect(() => {
        if (playlist.length === 0 || !session?.user.id) return;

        const audio = new Audio();
        audioRef.current = audio;
        preloadAudioRef.current = new Audio();
        
        const setAudioData = () => {
            setDuration(audio.duration);
            setProgress(audio.currentTime);
        };
        const setAudioTime = () => setProgress(audio.currentTime);
        const handleEnded = () => handleNext();
        const handleCanPlay = () => {
            setIsSongLoading(false);
            if (isPlaying) {
                 audio.play().catch(e => console.error("Autoplay failed:", e));
            }
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.volume = volume;

        // Load the first track
        audio.src = playlist[currentTrackIndex].url;
        preloadNextTrack(currentTrackIndex);
        
        if(isPlaying) {
          audio.play().catch(e => {
              console.warn("Autoplay was blocked by the browser. Playback will start on user interaction.");
              setIsPlaying(false);
          });
        }

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('play', () => setIsPlaying(true));
            audio.removeEventListener('pause', () => setIsPlaying(false));
            audio.pause();
            if (preloadAudioRef.current) {
                preloadAudioRef.current.pause();
            }
        };
    }, [playlist, session?.user.id]);
    
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const playTrack = useCallback((index: number) => {
        if (!audioRef.current || !playlist[index]) return;
        setIsSongLoading(true);
        setCurrentTrackIndex(index);
        audioRef.current.src = playlist[index].url;
        audioRef.current.play().catch(e => console.error("Play failed:", e));
        preloadNextTrack(index);
        setIsPlaying(true);
    }, [playlist, preloadNextTrack]);

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Play failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = useCallback(() => {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        playTrack(nextIndex);
    }, [currentTrackIndex, playlist.length, playTrack]);

    const handlePrev = () => {
        const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        playTrack(prevIndex);
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(audioRef.current) {
            audioRef.current.currentTime = parseFloat(e.target.value);
            setProgress(parseFloat(e.target.value));
        }
    };

    const pause = useCallback(() => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    return {
        playlist,
        currentTrackIndex,
        isPlaying,
        volume,
        progress,
        duration,
        isPlayerExpanded,
        isLoading: isSongLoading,
        setIsPlayerExpanded,
        onSelectTrack: playTrack,
        onPlayPause: handlePlayPause,
        onNext: handleNext,
        onPrev: handlePrev,
        onVolumeChange: handleVolumeChange,
        onSeek: handleSeek,
        pause,
    };
};
