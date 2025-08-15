

import React, { useState, useCallback, useEffect } from 'react';
import { AiCvArchitectPageProps, CvCollection, CvData, CvStyle, ColorTheme, LogEntry, CvRating } from './types';
import { generateCvWithAI, refineCvWithAI, cleanAndFormatText, rateCv, importAndFormatLinkedIn } from './services';
import { downloadPdf } from './utils';
import { BestPracticesModal, ColorThemePicker, CvDisplayPanel, LogPanel, CvRatingModal } from './components';
import { BackArrowIcon, HelpIcon, SparklesIcon, SpinnerIcon, BuildingIcon, FilterIcon, LinkedInIcon } from '../../components/Icons';
import { supabase } from '../../supabase/client';
import { Session, User } from '@supabase/supabase-js';

const AiCvArchitectPage: React.FC<AiCvArchitectPageProps> = ({ onNavigateBack, apiKey, user }) => {
    // Input State
    const [rawInfo, setRawInfo] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [colorTheme, setColorTheme] = useState<ColorTheme>('Slate');

    // App State
    const [cvs, setCvs] = useState<CvCollection | null>(null);
    const [activeStyle, setActiveStyle] = useState<CvStyle>('Modern');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    
    // Loading/Process State
    const [isLoading, setIsLoading] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isRating, setIsRating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    
    // Modal State
    const [isPracticesModalOpen, setIsPracticesModalOpen] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [cvRating, setCvRating] = useState<CvRating | null>(null);
    
    const isBusy = isLoading || isCleaning || isRefining || isRating || isImporting;
    const dingSound = new Audio('https://res.cloudinary.com/dy80ftu9k/video/upload/v1753917217/ding-126626_dfhzcv.mp3');

    useEffect(() => {
        const fetchCvData = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('cv_data')
                .select('raw_info, linkedin_url, image_url')
                .eq('id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching CV data:", error);
            } else if (data) {
                const typedData = data as any;
                setRawInfo(typedData.raw_info || '');
                setLinkedinUrl(typedData.linkedin_url || '');
                setImageUrl(typedData.image_url || '');
            }
        }
        fetchCvData();
    }, [user]);

    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [{ timestamp, message, type }, ...prev]);
    }, []);

    const handleCleanText = async () => {
        if (!rawInfo.trim() || isBusy) return;
        setIsCleaning(true);
        addLog('Cleaning and formatting input...', 'info');
        try {
            const cleanedText = await cleanAndFormatText(rawInfo, apiKey);
            setRawInfo(cleanedText);
            addLog('Input formatted successfully.', 'success');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMsg);
            addLog(`Formatting failed: ${errorMsg}`, 'error');
        } finally {
            setIsCleaning(false);
        }
    };

    const handleImportFromLinkedIn = async () => {
        if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
            addLog("Please enter a valid LinkedIn profile URL.", "error");
            return;
        }
        if (isBusy) return;
        setIsImporting(true);
        addLog('Importing data from LinkedIn profile...', 'info');
        try {
            const formattedText = await importAndFormatLinkedIn(linkedinUrl, apiKey);
            setRawInfo(formattedText);
            addLog('Professional info imported from LinkedIn.', 'success');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred during import.';
            setError(errorMsg);
            addLog(`LinkedIn import failed: ${errorMsg}`, 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const handleGenerate = async () => {
        if (!rawInfo.trim() || isBusy || !user) return;
        setIsLoading(true);
        setError(null);
        setCvs(null);
        setLogs([]);
        
        try {
            addLog('Saving current info...', 'info');
            await (supabase.from('cv_data') as any).upsert([{
                id: user.id,
                raw_info: rawInfo,
                linkedin_url: linkedinUrl,
                image_url: imageUrl,
            }]);

            addLog('Generation process started.', 'info');
            const styles: CvStyle[] = ['Modern', 'Classic', 'Creative'];
            const generatedCvs: CvCollection = {};
            let personName = '';

            for (const style of styles) {
                addLog(`Generating ${style} style CV...`, 'info');
                const result = await generateCvWithAI(rawInfo, style, colorTheme, apiKey, imageUrl);
                generatedCvs[style] = result;
                if(result.personName) personName = result.personName;
                setCvs({ ...generatedCvs });
                addLog(`${style} style CV generated successfully.`, 'success');
            }
            
            addLog(`All CVs for ${personName} generated!`, 'success');
            dingSound.play();

        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMsg);
            addLog(`Generation failed: ${errorMsg}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async (prompt: string) => {
        const currentCvHtml = cvs?.[activeStyle]?.cvHtml;
        if (!currentCvHtml || isBusy) return;
        
        setIsRefining(true);
        setError(null);
        addLog(`Refining ${activeStyle} CV: "${prompt}"`, 'info');
        
        try {
            const result = await refineCvWithAI(currentCvHtml, prompt, apiKey);
            setCvs(prev => prev ? {
                ...prev,
                [activeStyle]: { ...prev[activeStyle]!, cvHtml: result.cvHtml }
            } : null);
             addLog('Refinement successful.', 'success');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "Refinement failed.";
            setError(errorMsg);
            addLog(`Refinement failed: ${errorMsg}`, 'error');
        } finally {
            setIsRefining(false);
        }
    };
    
    const handleDownload = () => {
        const cvContentElement = document.getElementById('cv-content');
        const personName = cvs?.[activeStyle]?.personName || 'CV';
        if (cvContentElement) {
            downloadPdf(cvContentElement, personName);
            addLog(`Downloading ${activeStyle} CV as PDF.`, 'success');
        } else {
            addLog("Could not find CV content to download.", "error");
            setError("Could not find CV content to download.");
        }
    };

    const handleUpdateCvHtml = (newHtml: string, style: CvStyle) => {
        setCvs(prev => prev ? {
            ...prev,
            [style]: { ...prev[style]!, cvHtml: newHtml }
        } : null);
        addLog(`Saved manual edits to ${style} CV.`, 'success');
    };

    const handleRateCv = async () => {
        const currentCvHtml = cvs?.[activeStyle]?.cvHtml;
        if (!currentCvHtml || isBusy) return;
        
        setIsRating(true);
        setCvRating(null);
        setIsRatingModalOpen(true);
        addLog(`Analyzing ${activeStyle} CV...`, 'info');

        try {
            const result = await rateCv(currentCvHtml, apiKey);
            setCvRating(result);
            addLog(`Analysis complete. Score: ${result.score}/10`, 'success');
        } catch(e) {
            const errorMsg = e instanceof Error ? e.message : "Rating failed.";
            setError(errorMsg);
            addLog(`Rating failed: ${errorMsg}`, 'error');
            setIsRatingModalOpen(false); // Close modal on error
        } finally {
            setIsRating(false);
        }
    }

    return (
        <div className="bg-gray-200 min-h-screen font-sans text-black">
            {/* --- Desktop-Only View --- */}
            <div className="hidden lg:flex lg:flex-col h-screen">
                <header className="bg-white border-b-2 border-black p-3 sm:p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                         <button
                          onClick={onNavigateBack}
                          className="p-2 font-bold border-2 border-black bg-white flex items-center gap-2 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                        >
                            <BackArrowIcon />
                        </button>
                        <div className="flex items-center gap-2">
                            <BuildingIcon />
                            <h1 className="text-xl sm:text-2xl font-extrabold">AI CV Architect</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPracticesModalOpen(true)}
                        className="px-4 py-2 font-bold border-2 border-black bg-white flex items-center gap-2 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        <HelpIcon /> <span className="hidden sm:inline">Best Practices</span>
                    </button>
                </header>

                <main className="flex-1 flex flex-row overflow-hidden">
                    {/* Input Panel */}
                    <div className="w-96 flex-shrink-0 bg-white p-6 lg:p-8 overflow-y-auto flex flex-col">
                        <div className="space-y-6 flex-1">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label htmlFor="brain-dump" className="text-xl font-bold block">Brain Dump</label>
                                    <button onClick={handleCleanText} disabled={isBusy || !rawInfo} className="text-sm font-semibold flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                                        {isCleaning ? <SpinnerIcon /> : <FilterIcon />} Format & Clean
                                    </button>
                                </div>
                                <textarea
                                    id="brain-dump"
                                    rows={10}
                                    value={rawInfo}
                                    onChange={(e) => setRawInfo(e.target.value)}
                                    placeholder="Paste all your information here: job history, skills, education, projects, contact details, career goals, etc. Don't worry about formatting, the AI will handle it."
                                    className="w-full p-3 bg-white border-2 border-black focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none disabled:bg-gray-100"
                                    disabled={isBusy}
                                />
                            </div>
                            <div>
                                <label htmlFor="linkedin-url" className="font-bold block mb-2">LinkedIn Profile URL (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        id="linkedin-url"
                                        type="text"
                                        value={linkedinUrl}
                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                        placeholder="https://linkedin.com/in/your-profile"
                                        className="w-full p-3 bg-white border-2 border-black focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none disabled:bg-gray-100"
                                        disabled={isBusy}
                                    />
                                    <button
                                        onClick={handleImportFromLinkedIn}
                                        disabled={isBusy || !linkedinUrl.includes('linkedin.com/in/')}
                                        className="p-3 font-bold border-2 border-black transition-all duration-150 flex items-center justify-center gap-2 bg-blue-500 text-white shadow-[4px_4px_0px_#000] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none"
                                        aria-label="Import from LinkedIn"
                                    >
                                        {isImporting ? <SpinnerIcon /> : <LinkedInIcon />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="image-url" className="font-bold block mb-2">Profile Image URL (Optional)</label>
                                <input
                                    id="image-url"
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/your-photo.jpg"
                                    className="w-full p-3 bg-white border-2 border-black focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none disabled:bg-gray-100"
                                    disabled={isBusy}
                                />
                            </div>
                            <div>
                                <label className="font-bold block mb-2">Color Theme</label>
                                <ColorThemePicker selectedTheme={colorTheme} onChange={setColorTheme} disabled={isBusy} />
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={!rawInfo.trim() || isBusy}
                            className="w-full mt-8 py-4 text-xl font-bold text-white bg-indigo-600 border-2 border-black transition-all duration-150 flex items-center justify-center gap-3 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {isLoading ? <><SpinnerIcon /> Generating...</> : <><SparklesIcon /> Generate CVs</>}
                        </button>
                    </div>

                    {/* CV Display Panel */}
                    <div className="flex-1 flex">
                        <CvDisplayPanel
                            cvs={cvs}
                            activeStyle={activeStyle}
                            onStyleChange={setActiveStyle}
                            isLoading={isLoading}
                            error={error}
                            onRefine={handleRefine}
                            isRefining={isRefining}
                            onUpdateCvHtml={handleUpdateCvHtml}
                            onDownload={handleDownload}
                            onRate={handleRateCv}
                            isRating={isRating}
                        />
                    </div>
                    
                    {/* Log Panel */}
                    <div className="w-64 flex-shrink-0">
                        <LogPanel logs={logs} />
                    </div>
                </main>

                <BestPracticesModal isOpen={isPracticesModalOpen} onClose={() => setIsPracticesModalOpen(false)} />
                <CvRatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} rating={cvRating} isRating={isRating} />
            </div>

            {/* --- Mobile/Tablet Fallback View --- */}
            <div className="flex lg:hidden flex-col items-center justify-center min-h-screen text-center p-8 bg-white">
                <BuildingIcon className="w-20 h-20 text-indigo-600 mb-6"/>
                <h1 className="text-3xl font-extrabold text-black mb-2">Desktop Experience Required</h1>
                <p className="text-lg text-gray-700 max-w-md mb-8">
                    AI CV Architect is a powerful tool designed for a larger screen. Please switch to a desktop or laptop to build your CV.
                </p>
                <button
                  onClick={onNavigateBack}
                  className="px-6 py-3 font-bold border-2 border-black bg-indigo-600 text-white flex items-center gap-2 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                    <BackArrowIcon />
                    Back to Hub
                </button>
            </div>
        </div>
    );
};

export default AiCvArchitectPage;
