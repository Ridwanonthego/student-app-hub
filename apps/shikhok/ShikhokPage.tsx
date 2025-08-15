

import React from 'react';
import { useShikhokState } from './hooks';
import { ShikhokPageProps, SourceDocument } from './types';
import {
  TopBar,
  LeftPanel,
  MainContent,
  ErrorBanner,
  ProgressBar,
  AddSourceModal,
  SourceSelectionModal,
  BriefingView,
  MindMapView,
  PodcastView,
  NotesView
} from './components';
import {
  researchTopic,
  generateInitialGuide,
  answerQuestion,
  generateBriefing,
  generateMindMap,
  generatePodcastScript,
} from './gemini-service';
import { BackArrowIcon } from '../../components/Icons';
import * as I from './icons';

const ShikhokPage: React.FC<ShikhokPageProps> = ({ onNavigateBack, apiKey }) => {
  const { state, dispatch } = useShikhokState();

  const handleSetLanguage = (lang: 'en' | 'bn') => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
    // Re-generate guide if sources exist
    if (state.sources.length > 0) {
      handleGenerateGuide(state.sources, lang);
    }
  };

  const handleGenerateGuide = async (sources: SourceDocument[], lang: 'en' | 'bn') => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'guide', value: true } });
    dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Generating notebook guide...' });
    try {
      const guide = await generateInitialGuide(sources, lang, apiKey);
      dispatch({ type: 'SET_NOTEBOOK_GUIDE', payload: guide });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Failed to generate guide.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'guide', value: false } });
    }
  };

  const handleAddSources = (newSources: SourceDocument[]) => {
    dispatch({ type: 'ADD_SOURCES', payload: newSources });
    handleGenerateGuide([...state.sources, ...newSources], state.language);
  };

  const handleAskQuestion = async (question: string) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { id: Date.now().toString(), role: 'user', content: question } });
    dispatch({ type: 'SET_LOADING', payload: { key: 'chat', value: true } });
    try {
      const answer = await answerQuestion(question, state.sources, state.chatHistory, state.language, apiKey);
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: answer });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to get answer.';
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { id: Date.now().toString(), role: 'ai', content: `Error: ${errorMsg}` } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'chat', value: false } });
    }
  };
  
  const handleGenerateOutput = async (type: 'briefing' | 'mindmap' | 'podcast') => {
      dispatch({ type: 'SET_OVERLAY_VIEW', payload: type });
      dispatch({ type: 'SET_GENERATED_OUTPUT', payload: null });
      dispatch({ type: 'SET_LOADING', payload: { key: 'output', value: true }});
      dispatch({ type: 'SET_LOADING_MESSAGE', payload: `Generating ${type}...` });
      try {
          let output;
          if (type === 'briefing') output = await generateBriefing(state.sources, state.language, apiKey);
          if (type === 'mindmap') output = await generateMindMap(state.sources, state.language, apiKey);
          if (type === 'podcast') output = await generatePodcastScript(state.sources, state.language, apiKey);
          dispatch({ type: 'SET_GENERATED_OUTPUT', payload: output || "Could not generate content."});
      } catch (e) {
          dispatch({ type: 'SET_GENERATED_OUTPUT', payload: `Error: ${e instanceof Error ? e.message : 'Unknown error'}` });
      } finally {
          dispatch({ type: 'SET_LOADING', payload: { key: 'output', value: false }});
      }
  };

  const renderOverlay = () => {
    switch (state.overlayView) {
      case 'briefing':
        return <BriefingView content={state.generatedOutput} isLoading={state.loading.output} onClose={() => dispatch({ type: 'SET_OVERLAY_VIEW', payload: null })} onDownload={() => {}} />;
      case 'mindmap':
        return <MindMapView content={state.generatedOutput} isLoading={state.loading.output} onClose={() => dispatch({ type: 'SET_OVERLAY_VIEW', payload: null })} />;
      case 'podcast':
          return <PodcastView content={state.generatedOutput} isLoading={state.loading.output} onClose={() => dispatch({ type: 'SET_OVERLAY_VIEW', payload: null })} />;
      case 'notes':
          return <NotesView notes={state.userNotes} setNotes={(notes) => dispatch({ type: 'SET_USER_NOTES', payload: notes})} onClose={() => dispatch({ type: 'SET_OVERLAY_VIEW', payload: null })} />;
      default:
        return null;
    }
  };

  return (
    <div className="font-inter bg-slate-50 text-slate-800 min-h-screen">
      {/* Desktop View */}
      <div className="hidden lg:flex lg:flex-col h-screen">
        <TopBar
          onBack={onNavigateBack}
          language={state.language}
          setLanguage={handleSetLanguage}
          isApiKeySet={!!apiKey}
        />
        <div className="flex-grow flex overflow-hidden">
          <LeftPanel
            sources={state.sources}
            onAddSource={() => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'addSource', value: true } })}
          />
          <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
            {!state.overlayView ? (
              <MainContent
                mainView={state.mainView}
                setMainView={(view) => dispatch({ type: 'SET_MAIN_VIEW', payload: view })}
                notebookGuide={state.notebookGuide}
                chatHistory={state.chatHistory}
                isLoadingGuide={state.loading.guide}
                isLoadingChat={state.loading.chat}
                onAskQuestion={handleAskQuestion}
                onActionClick={(actionId) => {
                  if(actionId === 'notes') {
                    dispatch({ type: 'SET_OVERLAY_VIEW', payload: 'notes' })
                  } else {
                    handleGenerateOutput(actionId as 'briefing' | 'mindmap' | 'podcast')
                  }
                }}
                sources={state.sources}
                language={state.language}
              />
            ) : (
              renderOverlay()
            )}
          </main>
        </div>
        <ErrorBanner error={state.error} onClose={() => dispatch({ type: 'SET_ERROR', payload: null })} />
        <ProgressBar isLoading={Object.values(state.loading).some(v => v)} message={state.loadingMessage} />
        
        <AddSourceModal
          isOpen={state.modals.addSource}
          onClose={() => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'addSource', value: false } })}
          onAddSources={handleAddSources}
          onResearch={async (topic) => {
              dispatch({ type: 'SET_LOADING', payload: { key: 'research', value: true } });
              dispatch({ type: 'SET_LOADING_MESSAGE', payload: `Researching "${topic}"...` });
              try {
                  const results = await researchTopic(topic, state.language, apiKey);
                  dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
                  dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'addSource', value: false } });
                  dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'selectSources', value: true } });
              } catch (e) {
                  dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Research failed.' });
              } finally {
                  dispatch({ type: 'SET_LOADING', payload: { key: 'research', value: false } });
              }
          }}
          isLoadingResearch={state.loading.research}
        />
        
        <SourceSelectionModal
          isOpen={state.modals.selectSources}
          onClose={() => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'selectSources', value: false } })}
          results={state.searchResults}
          onAddSelectedSources={(sources) => {
              handleAddSources(sources);
              dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'selectSources', value: false } });
          }}
        />
      </div>

      {/* Mobile Fallback View */}
      <div className="flex lg:hidden flex-col items-center justify-center min-h-screen text-center p-8 bg-white">
          <I.BookOpenIcon className="w-20 h-20 text-slate-800 mb-6" />
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Desktop Experience Required</h1>
          <p className="text-lg text-slate-600 max-w-md mb-8">
              Shikhok is a powerful research tool designed for a larger screen. Please switch to a desktop or laptop for the best experience.
          </p>
          <button
            onClick={onNavigateBack}
            className="px-6 py-3 font-bold border-2 border-slate-800 bg-amber-300 text-slate-900 flex items-center gap-2 shadow-[4px_4px_0px_#000] hover:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
              <BackArrowIcon />
              Back to Hub
          </button>
      </div>
    </div>
  );
};

export default ShikhokPage;
