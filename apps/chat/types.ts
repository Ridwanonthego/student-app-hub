
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "../../types";

export interface ChatProps {
    user: User;
    profile: Profile;
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
    content: string;
    created_at: string;
    sender?: ChatUser;
}
