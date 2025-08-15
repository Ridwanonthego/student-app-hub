import { User } from "@supabase/supabase-js";

export interface GeminiBanglaPageProps {
  onNavigateBack: () => void;
  apiKey: string;
  user: User;
}

export interface TextPart { text: string; }
export interface ImagePart { inlineData: { mimeType: string; data: string; }; }
export type ChatPart = TextPart | ImagePart;

export interface ChatMessage {
    role: 'user' | 'model';
    parts: ChatPart[];
}