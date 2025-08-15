

import React, { useState, useEffect } from 'react';
import { detectAiContent, humanizeText } from './services';
import { AnalysisResult, ActiveTab } from './types';
import { WelcomePanel, ResultsPanel, HumanizerPanel, Loader } from './components';
import { DocumentIcon, BackArrowIcon } from '../../components/Icons';

interface AiHumanizerPageProps {
  onNavigateBack: () => void;
  apiKey: string;
}

const AiHumanizerPage: React.FC<AiHumanizerPageProps> = ({ onNavigateBack, apiKey }) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [humanizedText, setHumanizedText] = useState<string>('');
  const [newAiScore, setNewAiScore] = useState<number | null>(null);

  // Reset view when input text changes
  useEffect(() => {
    if (inputText) {
      setActiveTab('welcome');
      setError(null);
      setAnalysisResult(null);
      setHumanizedText('');
      setNewAiScore(null);
    }
  }, [inputText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid .txt file.');
    }
  };

  const handleDetect = async () => {
    if (!inputText) return;
    setIsLoading(true);
    setLoaderMessage('Detecting AI patterns...');
    setActiveTab('loading');
    setError(null);
    try {
      const result = await detectAiContent(inputText, apiKey);
      setAnalysisResult(result);
      setActiveTab('detector');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during detection.');
      setActiveTab('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!inputText) return;
    setIsLoading(true);
    setActiveTab('loading');
    setError(null);
    try {
      setLoaderMessage('Humanizing your text...');
      const hText = await humanizeText(inputText, apiKey);
      setHumanizedText(hText);

      setLoaderMessage('Humanization complete! Analyzing new text...');
      const result = await detectAiContent(hText, apiKey);
      setNewAiScore(result.aiScore);

      setActiveTab('humanizer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during humanization.');
      setActiveTab('welcome');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderRightPanel = () => {
    switch (activeTab) {
      case 'loading':
        return <Loader message={loaderMessage} />;
      case 'detector':
        return analysisResult ? <ResultsPanel result={analysisResult} /> : <WelcomePanel />;
      case 'humanizer':
        return <HumanizerPanel text={humanizedText} score={newAiScore} />;
      case 'welcome':
      default:
        return <WelcomePanel />;
    }
  };

  return (
    <div className="bg-[#FDF6E3] min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="relative text-center mb-8">
            <button
              onClick={onNavigateBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-black font-semibold p-3 border-2 border-black bg-white shadow-[4px_4px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all"
              aria-label="Back to Hub"
            >
              <BackArrowIcon />
              <span className="hidden sm:inline">Back to Hub</span>
            </button>
          <div className="inline-block bg-white p-4 border-2 border-black shadow-[8px_8px_0px_#A78BFA]">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tight">
                  Humanize Your Document
              </h1>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel */}
          <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_#F59E0B]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">Your Text</h2>
              <label className="text-blue-600 hover:underline cursor-pointer font-semibold flex items-center gap-1">
                <DocumentIcon />
                Upload a .txt file
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              value={inputText}
              onChange={handleTextChange}
              placeholder="Paste your content here..."
              className="w-full h-80 p-4 border-2 border-black bg-[#E0D8C5] focus:ring-4 focus:ring-yellow-400 focus:outline-none resize-y text-black"
            />
            {error && <p className="text-red-500 font-bold my-2">{error}</p>}
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDetect}
                disabled={isLoading || !inputText}
                className="w-full text-white font-bold py-3 px-6 bg-[#EC4899] border-2 border-black shadow-[4px_4px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Detect AI
              </button>
              <button
                onClick={handleHumanize}
                disabled={isLoading || !inputText}
                className="w-full text-white font-bold py-3 px-6 bg-[#3B82F6] border-2 border-black shadow-[4px_4px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Humanize
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_#EC4899] min-h-[500px]">
            {renderRightPanel()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiHumanizerPage;
