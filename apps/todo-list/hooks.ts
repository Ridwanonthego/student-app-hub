
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/client';
import { Task, Priority, Status } from './types';
import { User } from '@supabase/supabase-js';

export const useTasks = (user: User) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('todo_tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks((data as any[]) || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const addTask = async (title: string, category: string, priority: Priority, due_date: string | null) => {
        try {
            const { data, error } = await (supabase
                .from('todo_tasks') as any)
                .insert([{ title, category, priority, due_date, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            if (data) setTasks(prev => [data as Task, ...prev]);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const { data, error } = await (supabase
                .from('todo_tasks') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            if (data) {
                setTasks(prev => prev.map(task => (task.id === id ? (data as Task) : task)));
            }
        } catch (e: any) {
            setError(e.message);
        }
    };

    const deleteTask = async (id: string, permanent: boolean = false) => {
        if (permanent) {
             try {
                const { error } = await supabase.from('todo_tasks').delete().eq('id', id);
                if (error) throw error;
                setTasks(prev => prev.filter(task => task.id !== id));
            } catch (e: any) {
                setError(e.message);
            }
        } else {
            await updateTask(id, { status: 'Cancelled' });
        }
    };

    return { tasks, addTask, updateTask, deleteTask, loading, error };
};
