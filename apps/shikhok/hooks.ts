

import { useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShikhokState, SourceDocument, ChatMessage, NotebookGuide, MainView, OverlayView, WebSearchResult, Language } from './types';

type Action =
  | { type: 'SET_API_KEY_STATUS'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'ADD_SOURCES'; payload: SourceDocument[] }
  | { type: 'SET_MAIN_VIEW'; payload: MainView }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_NOTEBOOK_GUIDE'; payload: NotebookGuide | null }
  | { type: 'SET_OVERLAY_VIEW'; payload: OverlayView }
  | { type: 'SET_GENERATED_OUTPUT'; payload: string | null }
  | { type: 'SET_USER_NOTES'; payload: string }
  | { type: 'SET_MODAL_OPEN'; payload: { modal: keyof ShikhokState['modals']; value: boolean } }
  | { type: 'SET_LOADING'; payload: { key: keyof ShikhokState['loading']; value: boolean } }
  | { type: 'SET_LOADING_MESSAGE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: WebSearchResult[] };
  
const initialState: ShikhokState = {
  isApiKeySet: true, // Assume key is provided from parent
  language: 'en',
  sources: [],
  mainView: 'welcome',
  chatHistory: [],
  notebookGuide: null,
  overlayView: null,
  generatedOutput: null,
  userNotes: '',
  modals: {
    addSource: false,
    selectSources: false,
  },
  loading: {
    guide: false,
    chat: false,
    research: false,
    output: false,
  },
  loadingMessage: '',
  error: null,
  searchResults: [],
};

function shikhokReducer(state: ShikhokState, action: Action): ShikhokState {
  switch (action.type) {
    case 'SET_API_KEY_STATUS':
      return { ...state, isApiKeySet: action.payload };
    case 'SET_LANGUAGE':
        return { ...state, language: action.payload, notebookGuide: null, chatHistory: [] };
    case 'ADD_SOURCES':
      const newSources = [...state.sources, ...action.payload];
      return { ...state, sources: newSources, mainView: 'guide' };
    case 'SET_MAIN_VIEW':
      return { ...state, mainView: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'SET_NOTEBOOK_GUIDE':
      return { ...state, notebookGuide: action.payload };
    case 'SET_OVERLAY_VIEW':
      return { ...state, overlayView: action.payload };
    case 'SET_GENERATED_OUTPUT':
        return { ...state, generatedOutput: action.payload };
    case 'SET_USER_NOTES':
        return { ...state, userNotes: action.payload };
    case 'SET_MODAL_OPEN':
      return { ...state, modals: { ...state.modals, [action.payload.modal]: action.payload.value } };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value } };
    case 'SET_LOADING_MESSAGE':
        return { ...state, loadingMessage: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SEARCH_RESULTS':
        return { ...state, searchResults: action.payload };
    default:
      return state;
  }
}

export const useShikhokState = () => {
  const [state, dispatch] = useReducer(shikhokReducer, initialState);

  // Clear error after a delay
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  return { state, dispatch };
};
