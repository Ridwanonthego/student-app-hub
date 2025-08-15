

import React from 'react';

export type Page = 'hub' | 'watchfinder' | 'ai-humanizer' | 'ai-cv-architect' | 'bangla-nutri-plan' | 'stata-assistant' | 'shikhok' | 'concept-clear' | 'settings' | 'gemini-bangla' | 'todo-list';

export interface AppCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  hue: number;
}

export interface Profile {
  id?: string;
  full_name?: string | null;
  username?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  gemini_api_key?: string | null;
  hugging_face_key?: string | null;
}

export interface AppHubPreferences {
    wallpaper?: string | null;
    app_order?: string[] | null;
    recently_used?: string[] | null;
}
