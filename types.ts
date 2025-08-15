import React from 'react';
import { Database } from './supabase/database.types';

export type Page = 'hub' | 'watchfinder' | 'ai-humanizer' | 'ai-cv-architect' | 'bangla-nutri-plan' | 'stata-assistant' | 'shikhok' | 'concept-clear' | 'settings' | 'gemini-bangla' | 'todo-list';

export interface AppCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  hue: number;
}

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type AppHubPreferences = Database['public']['Tables']['app_hub_preferences']['Row'];
