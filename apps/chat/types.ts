

import { Session, User } from "@supabase/supabase-js";
import { Profile } from "../../types";
import { Json } from "../../supabase/database.types";

export interface ChatProps {
    user: User;
    profile: Profile;
    initiateCall: (peer: ChatUser) => void;
}

export interface ChatUser {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_online?: boolean;
}

export interface ChatMessage {
    id: number;
    sender_id: string;
    receiver_id: string;
    content: string | null;
    message_type: 'text' | 'watch-invite' | 'watch-accept';
    payload: Json | null;
    created_at: string;
    sender?: ChatUser;
}