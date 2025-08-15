
import { User } from "@supabase/supabase-js";

export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Pending' | 'InProgress' | 'Done' | 'Cancelled';
export type View = 'list' | 'cancelled';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: string;
  priority: Priority;
  status: Status;
  due_date: string | null;
  created_at: string;
}

export interface AITaskParseResult {
  title: string;
  category: string;
  dueDate: string | null; // ISO 8601 format
  priority: Priority;
}

export interface TodoListPageProps {
  onNavigateBack: () => void;
  apiKey: string;
  user: User;
}
