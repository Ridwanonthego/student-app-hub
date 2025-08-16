

import React, { useState, useCallback, useEffect, useRef } from 'react';
import WatchFinderPage from './apps/movie-flix/MovieFlixPage';
import AiHumanizerPage from './apps/ai-humanizer/AiHumanizerPage';
import AiCvArchitectPage from './apps/ai-cv-architect/AiCvArchitectPage';
import BanglaNutriPlanPage from './apps/bangla-nutri-plan/BanglaNutriPlanPage';
import StataAssistantPage from './apps/stata-assistant/StataAssistantPage';
import ShikhokPage from './apps/shikhok/ShikhokPage';
import ConceptClearPage from './apps/concept-clear/ConceptClearPage';
import GeminiBanglaPage from './apps/dhaka-gpt/DhakaGptPage';
import SettingsPage from './apps/settings/SettingsPage';
import TodoListPage from './apps/todo-list/TodoListPage';
import { AppCardProps, Page, Profile, AppHubPreferences } from './types';
import { MovieIcon, HumanizerIcon, CvIcon, NutritionIcon, StataIcon, ShikhokIcon, BrainCircuitIcon, MenuIcon, SpinnerIcon, EyeIcon, EyeOffIcon, GearIcon, ChatBubbleIcon, CloseIcon, TodoListIcon, ThemeIcon, HomeIcon, TherapyIcon, ExternalLinkIcon, UserIcon, CheckIcon, SparklesIcon, PinIcon, PinSolidIcon } from './components/Icons';
import { supabase } from './supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { wallpapers } from './media/wallpapers';
import { hoverSound, clickSound } from './media/sounds';
import { Database } from './supabase/database.types';
import MusicPlayer from './components/MusicPlayer';
import Chat from './apps/chat/Chat';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useWebRTC } from './hooks/useWebRTC';
import { CallCapsule } from './components/CallCapsule';

const fictionalNames = [
  'Aragorn', 'BilboBaggins', 'Gandalf', 'Legolas', 'Gimli', 'FrodoBaggins', 'SamwiseGamgee',
  'LukeSkywalker', 'DarthVader', 'PrincessLeia', 'HanSolo', 'Chewbacca', 'Yoda',
  'HarryPotter', 'HermioneGranger', 'RonWeasley', 'AlbusDumbledore', 'SeverusSnape',
  'JonSnow', 'DaenerysTargaryen', 'TyrionLannister', 'AryaStark', 'CerseiLannister',
  'SherlockHolmes', 'JohnWatson', 'JamesBond', 'IndianaJones', 'KatnissEverdeen',
  'TonyStark', 'SteveRogers', 'ThorOdinson', 'BruceBanner', 'PeterParker',
  'ClarkKent', 'BruceWayne', 'DianaPrince', 'MasterChief', 'LaraCroft',
  'GeraltOfRivia', 'Ciri', 'Yennefer', 'EzioAuditore', 'Kratos',
  'Neo', 'Trinity', 'Morpheus', 'AgentSmith', 'JohnWick', 'OptimusPrime'
];

const OnboardingForm: React.FC<{ user: User; onComplete: (updatedProfile: Profile) => void; }> = ({ user, onComplete }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const suggestUsername = () => {
        const randomName = fictionalNames[Math.floor(Math.random() * fictionalNames.length)];
        const randomNumber = Math.floor(Math.random() * 90) + 10;
        setUsername(`${randomName}${randomNumber}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !geminiApiKey.trim() || !username.trim()) {
            setError("All fields are required.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // Check if username is unique
            const { data: existingUser, error: checkError } = await (supabase
                .from('profiles') as any)
                .select('username')
                .eq('username', username)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError; // Don't throw if user not found
            if (existingUser) {
                setError('This username is already taken. Please choose another.');
                setLoading(false);
                return;
            }

            const { data, error: updateError } = await (supabase
                .from('profiles') as any)
                .update({
                    full_name: fullName,
                    username: username,
                    gemini_api_key: geminiApiKey,
                })
                .eq('id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;
            
            if (data) {
                onComplete(data as Profile);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-poppins">
            <div className="w-full max-w-lg bg-zinc-800 p-8 rounded-lg border-2 border-zinc-700 shadow-2xl">
                <h1 className="text-3xl font-bold text-lime-400 text-center mb-2">Welcome!</h1>
                <p className="text-center text-zinc-400 mb-6">Let's set up your profile to get started.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-bold text-zinc-300 mb-1">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            placeholder="Your full name (private)"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-3 text-white focus:outline-none focus:border-lime-400"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="username" className="block text-sm font-bold text-zinc-300 mb-1">Username</label>
                        <div className="flex items-center gap-2">
                            <input
                                id="username"
                                type="text"
                                placeholder="Your public username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-3 text-white focus:outline-none focus:border-lime-400"
                                required
                            />
                            <button type="button" onClick={suggestUsername} className="p-3 bg-zinc-700 border-2 border-zinc-600 rounded-md text-lime-400 hover:border-lime-400 transition-colors" aria-label="Suggest Username">
                                <SparklesIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="geminiApiKey" className="block text-sm font-bold text-zinc-300 mb-1">Gemini API Key</label>
                         <input
                            id="geminiApiKey"
                            type="password"
                            placeholder="Enter your Gemini API Key"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-3 text-white focus:outline-none focus:border-lime-400"
                            required
                        />
                        <div className="text-xs text-zinc-400 mt-2 p-3 bg-zinc-900/50 rounded-md border border-zinc-700">
                            <p>
                                Your Gemini API key is required to power the AI features in this hub.
                                <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="font-bold text-lime-400 hover:underline ml-1 inline-flex items-center gap-1">
                                    Get your key from Google AI Studio <ExternalLinkIcon className="w-3 h-3"/>
                                </a>
                            </p>
                        </div>
                    </div>
                     {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-lime-400 text-zinc-900 font-bold p-3 rounded-md hover:bg-lime-500 transition-colors disabled:bg-zinc-600 flex items-center justify-center"
                    >
                        {loading ? <SpinnerIcon /> : 'Save and Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const initialApps: (Omit<AppCardProps, 'onSelect'> & { pageId: string; href?: string })[] = [
    { title: "WatchFinder", pageId: 'watchfinder', description: "I will help you find movies and help you escape the what to watch process", icon: <MovieIcon />, hue: 180 },
    { title: "AI Humanizer", pageId: 'ai-humanizer', description: "Make your AI-written text undetectable.", icon: <HumanizerIcon />, hue: 320 },
    { title: "Cv Expert", pageId: 'ai-cv-architect', description: "1 click cv from a Linkedin Link.", icon: <CvIcon />, hue: 260 },
    { title: "BanglaNutriPlan", pageId: 'bangla-nutri-plan', description: "Personalized Bangladeshi diet plans.", icon: <NutritionIcon />, hue: 30 },
    { title: "Stata Assistant", pageId: 'stata-assistant', description: "Debug & analyze Stata code with AI.", icon: <StataIcon />, hue: 300 },
    { title: "शिक्षक App", pageId: 'shikhok', description: "Teaches you whole curriculum through exciting podcasts from your College books", icon: <ShikhokIcon />, hue: 50 },
    { title: "Concept Clear", pageId: 'concept-clear', description: "Understand complex topics easily.", icon: <BrainCircuitIcon />, hue: 90 },
    { title: "Kajer List", pageId: 'todo-list', description: "An intelligent to-do list that understands you.", icon: <TodoListIcon/>, hue: 50 },
    { title: "Thera.py", pageId: 'thera-py', href: "https://therapy-one-psi.vercel.app/", description: "Confidential Ai Therapist. New login required.", icon: <TherapyIcon />, hue: 200 },
];

const AppCard: React.FC<AppCardProps & { playHoverSound: () => void; playClickSound: () => void; isThemed: boolean; isPinned: boolean; onTogglePin: () => void; canPin: boolean; }> = ({ title, description, icon, onSelect, hue, playHoverSound, playClickSound, isThemed, isPinned, onTogglePin, canPin }) => (
  <div
    onClick={() => { playClickSound(); onSelect(); }}
    onMouseEnter={playHoverSound}
    className={`relative group p-4 rounded-lg transition-all duration-200 cursor-pointer flex flex-col h-full
      ${isThemed
        ? `bg-black/20 backdrop-blur-sm border-2 border-[hsl(${hue},_70%,_60%)] hover:bg-black/40 hover:shadow-[4px_4px_0px_0px_hsl(${hue},_70%,_60%)]`
        : `bg-zinc-800 border-2 border-[hsl(${hue},_70%,_60%)] hover:shadow-[6px_6px_0px_0px_hsl(${hue},_70%,_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5`
      }`}
  >
    <button
        onClick={(e) => {
            e.stopPropagation();
            if (isPinned || canPin) {
                playClickSound();
                onTogglePin();
            } else {
                alert("You can only pin up to 2 apps.");
            }
        }}
        className={`absolute top-2 right-2 p-1.5 rounded-full z-10 transition-all duration-200 
            ${isPinned 
                ? 'bg-lime-400/80 text-black' 
                : 'bg-black/20 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/50'}
            ${!isPinned && !canPin ? 'cursor-not-allowed opacity-50' : ''}
        `}
        aria-label={isPinned ? "Unpin app" : "Pin app"}
    >
        {isPinned ? <PinSolidIcon className="w-5 h-5"/> : <PinIcon className="w-5 h-5"/>}
    </button>
    <div className="flex items-center gap-3 mb-2">
      <div className={isThemed ? `text-[hsl(${hue},_70%,_60%)]` : `text-[hsl(${hue},_70%,_60%)]`}>{icon}</div>
      <h2 className={`text-xl font-bold text-white`}>{title}</h2>
    </div>
    <p className={`text-sm mt-1 flex-grow ${isThemed ? 'text-white/80' : 'text-zinc-400'}`}>{description}</p>
  </div>
);

const ThemeSwitcher: React.FC<{
  current: string;
  onChange: (wallpaper: string) => void;
  playHoverSound: () => void;
  playClickSound: () => void;
}> = ({ current, onChange, playHoverSound, playClickSound }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (url: string) => {
    playClickSound();
    onChange(url);
    setIsOpen(false);
  };
  
  const handleRandom = () => {
    playClickSound();
    onChange('random');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { playClickSound(); setIsOpen(!isOpen); }}
        onMouseEnter={playHoverSound}
        className="p-3 bg-zinc-800/50 border-2 border-lime-400 rounded-full hover:bg-zinc-700/70 transition-colors shadow-lg backdrop-blur-sm"
        aria-label="Change Theme"
      >
        <ThemeIcon className="w-6 h-6 text-lime-400" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-800/80 backdrop-blur-md border-2 border-zinc-600 rounded-lg shadow-2xl p-2 z-20">
            <button onMouseEnter={playHoverSound} onClick={handleRandom} className={`w-full text-left p-2 rounded font-bold ${current === 'random' ? 'bg-lime-500 text-black' : 'hover:bg-zinc-700 text-white'}`}>Random Rotation</button>
            <button onMouseEnter={playHoverSound} onClick={() => handleSelect('default')} className={`w-full text-left p-2 rounded font-bold ${current === 'default' ? 'bg-lime-500 text-black' : 'hover:bg-zinc-700 text-white'}`}>Solid Black</button>
            <div className="h-px bg-zinc-600 my-1"></div>
            <div className="max-h-48 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2">
                {wallpapers.map(url => (
                  <img
                    key={url}
                    src={url}
                    onMouseEnter={playHoverSound}
                    onClick={() => handleSelect(url)}
                    className={`w-full h-24 object-cover rounded cursor-pointer border-2 transition-all ${current === url ? 'border-lime-400 scale-105' : 'border-transparent hover:border-lime-400'}`}
                    alt="Wallpaper thumbnail"
                  />
                ))}
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

type AppDef = (Omit<AppCardProps, 'onSelect'> & { pageId: string; href?: string });

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>('hub');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wallpaper, setWallpaper] = useState('random'); // 'default', 'random', or a URL
  const [currentWallpaperUrl, setCurrentWallpaperUrl] = useState(wallpapers[0]);
  const [apps, setApps] = useState<AppDef[]>(initialApps);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [pinnedApps, setPinnedApps] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const hoverAudioRef = useRef<HTMLAudioElement>(null);
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const wallpaperIntervalRef = useRef<number | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- HOOKS ---
  const { pause: pauseMusic, ...musicPlayerProps } = useMusicPlayer(session);
  const { 
      callState,
      duration: callDuration,
      initiateCall,
      answerCall,
      hangUp,
      remoteAudioRef,
      ringtoneAudioRef,
      ringbackAudioRef,
  } = useWebRTC(session, pauseMusic);

  const playHoverSound = useCallback(() => {
    if (hoverAudioRef.current) {
      hoverAudioRef.current.volume = 0.25;
      hoverAudioRef.current.currentTime = 0;
      hoverAudioRef.current.play().catch(e => {});
    }
  }, []);

  const playClickSound = useCallback(() => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(e => {});
    }
  }, []);
  
  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) {
          setProfile(null);
          setPage('hub');
          setShowOnboarding(false);
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfileAndPrefs = async () => {
      if (session?.user) {
        const { data, error } = await (supabase
            .from('profiles') as any)
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error.message);
        } else {
            const typedData = data as Profile | null;
            setProfile(typedData);
            if (typedData && (!typedData.full_name || !typedData.gemini_api_key || !typedData.username)) {
                setShowOnboarding(true);
            } else {
                setShowOnboarding(false);
            }
        }

        const { data: prefResult, error: prefError } = await (supabase
            .from('app_hub_preferences') as any)
            .select('wallpaper, app_order, recently_used, pinned_apps')
            .eq('user_id', session.user.id)
            .single();
        
        const typedPrefResult = prefResult as AppHubPreferences | null;
        if (typedPrefResult) {
            setWallpaper(typedPrefResult.wallpaper || 'random');
            setRecentlyUsed(typedPrefResult.recently_used || []);
            setPinnedApps(typedPrefResult.pinned_apps || []);
            if (typedPrefResult.app_order) {
                const orderedApps = typedPrefResult.app_order
                    .map((pageId: string) => initialApps.find(app => app.pageId === pageId))
                    .filter((app: AppDef | undefined): app is AppDef => !!app);
                const remainingApps = initialApps.filter(app => !typedPrefResult.app_order.includes(app.pageId));
                setApps([...orderedApps, ...remainingApps]);
            } else {
                setApps(initialApps);
            }
        } else if (prefError && prefError.code !== 'PGRST116') {
             console.error('Error fetching preferences', prefError);
        } else {
            setWallpaper('random');
            setRecentlyUsed([]);
            setPinnedApps([]);
            setApps(initialApps);
        }
      }
    };
    fetchProfileAndPrefs();
  }, [session]);

    // Wallpaper rotation effect
    useEffect(() => {
        const rotateWallpaper = () => {
            const randomWallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];
            setCurrentWallpaperUrl(randomWallpaper);
        };

        if (wallpaperIntervalRef.current) {
            clearInterval(wallpaperIntervalRef.current);
            wallpaperIntervalRef.current = null;
        }

        if (wallpaper === 'random') {
            rotateWallpaper(); // Set one immediately
            wallpaperIntervalRef.current = window.setInterval(rotateWallpaper, 15 * 60 * 1000);
        }

        return () => {
            if (wallpaperIntervalRef.current) {
                clearInterval(wallpaperIntervalRef.current);
            }
        };
    }, [wallpaper]);


  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (isSigningUp) {
      if (password !== confirmPassword) {
          setAuthError("Passwords do not match.");
          setAuthLoading(false);
          return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
      } else {
        setSignupSuccess(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
    
    setAuthLoading(false);
  };
  
  const handleWallpaperChange = async (newWallpaper: string) => {
      setWallpaper(newWallpaper);
      if (session?.user) {
          await (supabase.from('app_hub_preferences') as any).upsert({
              user_id: session.user.id,
              wallpaper: newWallpaper,
          }, { onConflict: 'user_id' });
      }
  };
  
  const handleAppSelect = async (pageId: string) => {
    const selectedApp = apps.find(app => app.pageId === pageId) || initialApps.find(app => app.pageId === pageId);

    if (session?.user) {
        const newRecent = [pageId, ...recentlyUsed.filter(p => p !== pageId)].slice(0, 3);
        setRecentlyUsed(newRecent);
        await (supabase.from('app_hub_preferences') as any).upsert({
            user_id: session.user.id,
            recently_used: newRecent,
        }, { onConflict: 'user_id' });
    }

    if (selectedApp?.href) {
        window.open(selectedApp.href, '_blank', 'noopener,noreferrer');
    } else {
        setPage(pageId as Page);
    }
  };
  
  const unpinnedApps = apps.filter(app => !pinnedApps.includes(app.pageId));

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newUnpinnedAppOrder = [...unpinnedApps];
    const draggedItemContent = newUnpinnedAppOrder.splice(dragItem.current, 1)[0];
    newUnpinnedAppOrder.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;

    const finalFullOrder = [...apps.filter(a => pinnedApps.includes(a.pageId)), ...newUnpinnedAppOrder];
    setApps(finalFullOrder);

    if (session?.user) {
        const newOrderIds = finalFullOrder.map(app => app.pageId);
        await (supabase.from('app_hub_preferences') as any).upsert({
            user_id: session.user.id,
            app_order: newOrderIds,
        }, { onConflict: 'user_id' });
    }
  };
  
  const handleTogglePin = async (pageId: string) => {
    const isCurrentlyPinned = pinnedApps.includes(pageId);
    let newPinnedApps: string[];

    if (isCurrentlyPinned) {
        newPinnedApps = pinnedApps.filter(id => id !== pageId);
    } else {
        if (pinnedApps.length >= 2) {
            alert("You can only pin a maximum of 2 apps.");
            return;
        }
        newPinnedApps = [...pinnedApps, pageId];
    }

    setPinnedApps(newPinnedApps);

    if (session?.user) {
        await (supabase.from('app_hub_preferences') as any).upsert({
            user_id: session.user.id,
            pinned_apps: newPinnedApps,
        }, { onConflict: 'user_id' });
    }
};

  const geminiApiKey = profile?.gemini_api_key || (process.env.API_KEY as string);
  const isThemed = wallpaper !== 'default';
  const finalWallpaperUrl = wallpaper === 'random' ? currentWallpaperUrl : wallpaper;

  const renderPage = () => {
    switch (page) {
      case 'watchfinder': return <WatchFinderPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} userId={session?.user.id!} />;
      case 'ai-humanizer': return <AiHumanizerPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} />;
      case 'ai-cv-architect': return <AiCvArchitectPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} user={session?.user!} />;
      case 'bangla-nutri-plan': return <BanglaNutriPlanPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} user={session?.user!} />;
      case 'stata-assistant': return <StataAssistantPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} />;
      case 'shikhok': return <ShikhokPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} />;
      case 'concept-clear': return <ConceptClearPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} />;
      case 'gemini-bangla': return <GeminiBanglaPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} user={session?.user!} />;
      case 'settings': return <SettingsPage onNavigateBack={() => setPage('hub')} user={session?.user!} />;
      case 'todo-list': return <TodoListPage onNavigateBack={() => setPage('hub')} apiKey={geminiApiKey} user={session?.user!} />;
      default: return null;
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
            <SpinnerIcon className="w-12 h-12 text-lime-400" />
        </div>
    );
  }

  if (!session || !profile) {
    if (signupSuccess) {
      return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-poppins">
            <div className="w-full max-w-md bg-zinc-800 p-8 rounded-lg border-2 border-zinc-700 shadow-2xl text-center">
                <CheckIcon className="w-16 h-16 text-lime-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Confirmation Email Sent!</h1>
                <p className="text-zinc-300 mb-6">
                    Check your email for a confirmation link. Once confirmed, return here to sign in.
                </p>
                <button
                    onClick={() => {
                        setSignupSuccess(false);
                        setIsSigningUp(false);
                    }}
                    className="w-full mt-2 bg-lime-400 text-zinc-900 font-bold p-3 rounded-md hover:bg-lime-500 transition-colors"
                >
                    Go to Sign In
                </button>
            </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-poppins">
        <div className="w-full max-w-md bg-zinc-800 p-8 rounded-lg border-2 border-zinc-700 shadow-2xl">
          <h1 className="text-3xl font-bold text-lime-400 text-center mb-2">Student's Hub Pro</h1>
          <p className="text-center text-zinc-400 mb-6">{isSigningUp ? "Create a new account" : "Welcome back! Sign in to continue."}</p>
          <form onSubmit={handleAuthAction}>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-3 text-white focus:outline-none focus:border-lime-400"
                required
                autoComplete="email"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-3 text-white focus:outline-none focus:border-lime-400"
                  required
                />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white">
                  {showPassword ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
              {isSigningUp && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-700 border-2 border-zinc-600 rounded-md p-3 text-white focus:outline-none focus:border-lime-400"
                    required
                  />
                </div>
              )}
            </div>
            {authError && <p className="text-red-400 text-sm mt-4">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-6 bg-lime-400 text-zinc-900 font-bold p-3 rounded-md hover:bg-lime-500 transition-colors disabled:bg-zinc-600 flex items-center justify-center"
            >
              {authLoading ? <SpinnerIcon /> : (isSigningUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>
          <p className="text-center text-sm text-zinc-400 mt-6">
            {isSigningUp ? "Already have an account?" : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSigningUp(!isSigningUp); setAuthError(null); setPassword(''); setConfirmPassword(''); }} className="font-bold text-lime-400 hover:underline">
              {isSigningUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
      return (
          <OnboardingForm 
              user={session.user} 
              onComplete={(updatedProfile) => {
                  setProfile(updatedProfile);
                  setShowOnboarding(false);
              }}
          />
      );
  }

  const recentAppObjects = recentlyUsed
      .map(pageId => initialApps.find(app => app.pageId === pageId))
      .filter((app): app is AppDef => !!app);
      
  const pinnedAppObjects = pinnedApps
      .map(pageId => initialApps.find(app => app.pageId === pageId))
      .filter((app): app is AppDef => !!app);
  
  const canPinMore = pinnedApps.length < 2;
  
  const imageGenLinks = [
    { href: 'https://huggingface.co/spaces/black-forest-labs/FLUX.1-dev', title: 'High quality', description: 'FLUX.1-dev' },
    { href: 'https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell', title: 'Fastest and Optimized', description: 'FLUX.1-schnell' },
    { href: 'https://huggingface.co/spaces/black-forest-labs/FLUX.1-Kontext-Dev', title: 'Edit image with text', description: 'FLUX.1-Kontext-Dev' },
    { href: 'https://huggingface.co/spaces/multimodalart/flux-fill-outpaint', title: 'Expand image', description: 'flux-fill-outpaint' },
    { href: 'https://huggingface.co/spaces/OzzyGT/diffusers-fast-inpaint', title: 'Edit image into anything', description: 'diffusers-fast-inpaint' }
  ];

  const videoGenLinks = [
    { href: 'https://aistudio.google.com/prompts/new_video', title: 'Veo 2', description: 'Google AI Studio' },
    { href: 'https://huggingface.co/spaces/multimodalart/wan2-1-fast', title: 'Wan fast (4 second)', description: 'wan2-1-fast' },
    { href: 'https://huggingface.co/spaces/Wan-AI/Wan-2.2-5B', title: 'Wan quality', description: 'Wan-2.2-5B' }
  ];

  const ToolLinkButton: React.FC<{ href: string; title: string; description: string; }> = ({ href, title, description }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={playHoverSound}
      onClick={playClickSound}
      className={`p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-3 group
        ${isThemed
          ? `bg-black/20 backdrop-blur-sm border-2 border-zinc-600 hover:bg-black/40 hover:border-lime-400`
          : `bg-zinc-800 border-2 border-zinc-700 hover:border-lime-400 hover:-translate-x-0.5 hover:-translate-y-0.5`
        }`}
    >
      <div className="flex-grow">
        <h4 className="font-bold text-white group-hover:text-lime-400 transition-colors">{title}</h4>
        <p className={`text-sm ${isThemed ? 'text-white/70' : 'text-zinc-400'}`}>{description}</p>
      </div>
      <ExternalLinkIcon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
    </a>
  );

  return (
    <>
       <audio ref={hoverAudioRef} src={hoverSound} preload="auto"></audio>
       <audio ref={clickAudioRef} src={clickSound} preload="auto"></audio>
       
       {musicPlayerProps.playlist.length > 0 && (
           <div className={`fixed top-1/2 -translate-y-1/2 left-4 z-50 transition-transform duration-300 ease-in-out ${page !== 'hub' ? '-translate-x-full focus-within:translate-x-0 hover:translate-x-0' : ''}`}>
               <MusicPlayer
                   isExpanded={musicPlayerProps.isPlayerExpanded}
                   onToggleExpand={() => musicPlayerProps.setIsPlayerExpanded(!musicPlayerProps.isPlayerExpanded)}
                   onGoToHub={() => setPage('hub')}
                   currentTrack={musicPlayerProps.playlist[musicPlayerProps.currentTrackIndex]}
                   {...musicPlayerProps}
               />
           </div>
       )}

       <Chat user={session.user} profile={profile!} initiateCall={initiateCall}/>
       
       {callState.status !== 'idle' && (
           <CallCapsule
               callState={callState}
               duration={callDuration}
               onAnswer={answerCall}
               onHangUp={hangUp}
               onDecline={hangUp}
           />
       )}
       <audio ref={ringtoneAudioRef} src="https://cdn.pixabay.com/audio/2022/03/15/audio_731c14a273.mp3" preload="auto" loop playsInline></audio>
       <audio ref={ringbackAudioRef} src="https://cdn.pixabay.com/audio/2022/01/20/audio_29b2cce24e.mp3" preload="auto" loop playsInline></audio>
       <audio ref={remoteAudioRef} autoPlay playsInline />

       <div
         className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-500"
         style={{
           backgroundImage: isThemed ? `url(${finalWallpaperUrl})` : 'none',
           backgroundColor: isThemed ? 'transparent' : '#18181b'
         }}
       >
         <div className={`min-h-screen transition-colors duration-500 ${isThemed ? 'bg-black/50' : ''}`}>
           {page === 'hub' ? (
             <div className={`container mx-auto px-4 py-8 transition-all duration-300 ease-in-out ${musicPlayerProps.isPlayerExpanded ? 'pl-72' : 'pl-24'}`}>
               <header className="flex flex-col sm:flex-row sm:justify-between items-center mb-8 gap-4">
                  {/* Welcome Group */}
                  <div className="w-full sm:w-auto flex items-center gap-4 order-1 sm:order-none">
                      <div className="w-14 h-14 rounded-full border-2 border-lime-400 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                              <UserIcon className="w-8 h-8 text-lime-400" />
                          )}
                      </div>
                     <div>
                        <h1 className="text-3xl font-bold text-white">Welcome, {profile?.full_name?.split(' ')[0] || profile?.username || "User"}!</h1>
                        <p className="text-zinc-400">What will you create today?</p>
                     </div>
                  </div>
                  {/* Controls Group */}
                  <div className="w-full sm:w-auto flex justify-end order-2 sm:order-none">
                      <div className="flex items-center gap-2 sm:gap-4">
                           <button
                              onClick={() => { playClickSound(); setPage('gemini-bangla'); }}
                              onMouseEnter={playHoverSound}
                              className="px-4 py-2 bg-zinc-800/50 border-2 border-lime-400 rounded-lg hover:bg-zinc-700/70 transition-colors shadow-lg backdrop-blur-sm flex items-center gap-2 text-white font-bold"
                          >
                              <ChatBubbleIcon className="w-6 h-6 text-lime-400" />
                              <span className="hidden sm:inline">Gemini Bangla</span>
                          </button>
                         <button onClick={() => { playClickSound(); setPage('settings'); }} onMouseEnter={playHoverSound} className="p-3 bg-zinc-800/50 border-2 border-lime-400 rounded-full hover:bg-zinc-700/70 transition-colors shadow-lg backdrop-blur-sm" aria-label="Settings"><GearIcon className="w-6 h-6 text-lime-400" /></button>
                         <ThemeSwitcher current={wallpaper} onChange={handleWallpaperChange} playHoverSound={playHoverSound} playClickSound={playClickSound} />
                      </div>
                  </div>
               </header>
                
                {pinnedAppObjects.length > 0 && (
                  <div className="mb-12">
                      <h2 className="text-2xl font-bold text-white mb-4">Pinned Apps</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {pinnedAppObjects.map(app => (
                              <AppCard
                                  key={`pinned-${app.pageId}`}
                                  {...app}
                                  onSelect={() => handleAppSelect(app.pageId)}
                                  playHoverSound={playHoverSound}
                                  playClickSound={playClickSound}
                                  isThemed={isThemed}
                                  isPinned={true}
                                  onTogglePin={() => handleTogglePin(app.pageId)}
                                  canPin={canPinMore}
                              />
                          ))}
                      </div>
                  </div>
                )}
                
                {recentAppObjects.length > 0 && (
                  <div className="mb-12">
                      <h2 className="text-2xl font-bold text-white mb-4">Recently Used</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recentAppObjects.map(app => (
                              <AppCard
                                  key={`recent-${app.pageId}`}
                                  {...app}
                                  onSelect={() => handleAppSelect(app.pageId)}
                                  playHoverSound={playHoverSound}
                                  playClickSound={playClickSound}
                                  isThemed={isThemed}
                                  isPinned={pinnedApps.includes(app.pageId)}
                                  onTogglePin={() => handleTogglePin(app.pageId)}
                                  canPin={canPinMore}
                              />
                          ))}
                      </div>
                  </div>
                )}
                
                <h2 className="text-2xl font-bold text-white mb-4">All Apps</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {unpinnedApps.map((app, index) => (
                   <div
                    key={app.pageId}
                    draggable
                    onDragStart={() => dragItem.current = index}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="cursor-grab active:cursor-grabbing"
                   >
                     <AppCard
                       {...app}
                       onSelect={() => handleAppSelect(app.pageId)}
                       playHoverSound={playHoverSound}
                       playClickSound={playClickSound}
                       isThemed={isThemed}
                       isPinned={false}
                       onTogglePin={() => handleTogglePin(app.pageId)}
                       canPin={canPinMore}
                     />
                   </div>
                 ))}
               </div>

               <div className="mt-16">
                  <h2 className="text-3xl font-bold text-white mb-6">Creative AI Tools</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                          <h3 className="text-xl font-semibold text-lime-400 mb-4 border-l-4 border-lime-400 pl-3">Image Generation</h3>
                          <div className="space-y-3">
                              {imageGenLinks.map(link => <ToolLinkButton key={link.href} {...link} />)}
                          </div>
                      </div>
                      <div>
                          <h3 className="text-xl font-semibold text-lime-400 mb-4 border-l-4 border-lime-400 pl-3">Video Generation</h3>
                          <div className="space-y-3">
                              {videoGenLinks.map(link => <ToolLinkButton key={link.href} {...link} />)}
                          </div>
                      </div>
                  </div>
              </div>

             </div>
           ) : (
             renderPage()
           )}
         </div>
       </div>
    </>
  );
};

export default App;
