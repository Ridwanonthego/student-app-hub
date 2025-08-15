
import React from 'react';
import { Session, User } from '@supabase/supabase-js';

export type CvStyle = 'Modern' | 'Classic' | 'Creative';
export type ColorTheme = 'Slate' | 'Ocean' | 'Forest' | 'Ruby' | 'Gold';

export interface CvData {
  personName: string;
  cvHtml: string;
}

export type CvCollection = {
    [key in CvStyle]?: CvData;
};

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface CvRating {
    score: number;
    feedback: string;
    pros: string[];
    cons: string[];
}

export interface AiCvArchitectPageProps {
  onNavigateBack: () => void;
  apiKey: string;
  user: User;
}

export interface BestPracticesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CvRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: CvRating | null;
  isRating: boolean;
}

export interface LogPanelProps {
    logs: LogEntry[];
}

export interface ColorThemePickerProps {
  selectedTheme: ColorTheme;
  onChange: (theme: ColorTheme) => void;
  disabled?: boolean;
}

export interface CvDisplayPanelProps {
  cvs: CvCollection | null;
  activeStyle: CvStyle;
  onStyleChange: (style: CvStyle) => void;
  isLoading: boolean;
  error: string | null;
  onRefine: (prompt: string) => Promise<void>;
  isRefining: boolean;
  onUpdateCvHtml: (newHtml: string, style: CvStyle) => void;
  onDownload: () => void;
  onRate: () => void;
  isRating: boolean;
}

export interface ControlButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}
