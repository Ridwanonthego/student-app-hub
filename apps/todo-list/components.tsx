
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, Status } from './types';
import { PlusIcon, SpinnerIcon, CartIcon, ListIcon, InProgressIcon, CheckIcon, CancelIcon, TrashIcon, RestoreIcon } from '../../components/Icons';

// --- Task Input ---
interface TaskInputProps {
    onAddTask: (rawText: string) => void;
    isProcessing: boolean;
}
export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, isProcessing }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isProcessing) {
            onAddTask(input);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Buy groceries tomorrow"
                className="flex-grow bg-[#1A2B34] border-2 border-[#475569] p-4 text-white placeholder-slate-400 font-bold focus:outline-none focus:border-amber-400 transition-colors disabled:bg-slate-700"
                disabled={isProcessing}
            />
            <button
                type="submit"
                className="w-14 h-14 bg-amber-400 text-black flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#F59E0B] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:bg-slate-600 disabled:shadow-none disabled:cursor-not-allowed"
                disabled={isProcessing || !input.trim()}
                aria-label="Add task"
            >
                {isProcessing ? <SpinnerIcon /> : <PlusIcon />}
            </button>
        </form>
    );
};

// --- Task Item & Components ---
const priorityStyles: Record<Priority, { border: string, shadow: string, bg: string }> = {
    High: { border: 'border-pink-500', shadow: 'shadow-[4px_4px_0px_#EC4899]', bg: 'bg-pink-500' },
    Medium: { border: 'border-blue-500', shadow: 'shadow-[4px_4px_0px_#3B82F6]', bg: 'bg-blue-500' },
    Low: { border: 'border-green-500', shadow: 'shadow-[4px_4px_0px_#22C55E]', bg: 'bg-green-500' },
};

const PriorityBadge: React.FC<{ priority: Priority; onClick: () => void }> = ({ priority, onClick }) => (
    <button onClick={onClick} className={`px-2 py-0.5 text-xs font-bold text-white ${priorityStyles[priority].bg}`}>
        {priority}
    </button>
);

const StatusButton: React.FC<{ status: Status; onClick: () => void }> = ({ status, onClick }) => {
    const statusClasses: Record<Status, string> = {
        Pending: 'border-slate-500',
        InProgress: 'bg-blue-500 text-white border-blue-500',
        Done: 'bg-green-500 text-white border-green-500',
        Cancelled: '',
    };
    return (
        <button onClick={onClick} className={`w-6 h-6 border-2 flex-shrink-0 flex items-center justify-center ${statusClasses[status]}`}>
            {status === 'InProgress' && <InProgressIcon />}
            {status === 'Done' && <CheckIcon />}
        </button>
    );
};

interface TaskItemProps {
    task: Task;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string, permanent?: boolean) => void;
}
const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete }) => {
    const [showPrio, setShowPrio] = useState(false);
    const prioRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (prioRef.current && !prioRef.current.contains(event.target as Node)) {
                setShowPrio(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleStatusChange = () => {
        const newStatus: Record<Status, Status> = {
            Pending: 'InProgress',
            InProgress: 'Done',
            Done: 'Pending',
            Cancelled: 'Pending'
        };
        onUpdate(task.id, { status: newStatus[task.status] });
    };

    const handlePriorityChange = (newPriority: Priority) => {
        onUpdate(task.id, { priority: newPriority });
        setShowPrio(false);
    };

    const formatDueDate = (dateString: string | null): { text: string, isOverdue: boolean } => {
        if (!dateString) return { text: '', isOverdue: false };
        const dueDate = new Date(dateString);
        const now = new Date();
        const isOverdue = dueDate < now && task.status !== 'Done';
        
        return { text: dueDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), isOverdue };
    };
    
    const { text: formattedDate, isOverdue } = formatDueDate(task.due_date);

    return (
        <div className={`group bg-[#1A2B34] p-3 flex items-center gap-3 border-2 border-l-4 ${priorityStyles[task.priority].border} ${priorityStyles[task.priority].shadow}`}>
            <StatusButton status={task.status} onClick={handleStatusChange} />
            <div className="flex-grow">
                <p className={`font-bold text-lg ${task.status === 'Done' ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
                <div className="flex items-center gap-3 text-xs mt-1">
                    <div className="relative" ref={prioRef}>
                        <PriorityBadge priority={task.priority} onClick={() => setShowPrio(!showPrio)} />
                        {showPrio && (
                            <div className="absolute top-full mt-1 bg-[#1A2B34] border-2 border-slate-600 z-10">
                                {(['High', 'Medium', 'Low'] as Priority[]).map(p => (
                                    <button key={p} onClick={() => handlePriorityChange(p)} className="block w-full text-left px-2 py-1 hover:bg-slate-700">{p}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-600 text-slate-300 font-semibold">{task.category}</span>
                    {formattedDate && <span className={`font-bold ${isOverdue ? 'text-pink-500' : 'text-slate-400'}`}>{formattedDate}</span>}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-white" aria-label="Cancel Task"><CancelIcon /></button>
                <button onClick={() => onDelete(task.id, true)} className="p-1 text-slate-400 hover:text-red-500" aria-label="Delete Permanently"><TrashIcon /></button>
            </div>
        </div>
    );
};

// --- Task Lists & States ---
interface TaskListProps {
    title: string;
    tasks: Task[];
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string, permanent?: boolean) => void;
}
export const TaskList: React.FC<TaskListProps> = ({ title, tasks, onUpdate, onDelete }) => {
    const sortedTasks = [...tasks].sort((a, b) => (a.status === 'Done' ? 1 : -1) - (b.status === 'Done' ? 1 : -1) || 0);

    return (
        <section>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                {title === 'Grocery List' ? <CartIcon /> : <ListIcon />}
                {title}
            </h2>
            <div className="space-y-4">
                {sortedTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />)}
            </div>
        </section>
    );
};

interface CancelledTaskListProps {
    tasks: Task[];
    onBack: () => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string, permanent?: boolean) => void;
}
export const CancelledTaskList: React.FC<CancelledTaskListProps> = ({ tasks, onBack, onUpdate, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black">Cancelled Items</h2>
            <button onClick={onBack} className="font-bold text-slate-400 hover:text-white hover:underline">← Back to list</button>
        </div>
        <div className="space-y-3">
            {tasks.length === 0 ? <p className="text-slate-500 text-center py-8">No cancelled items.</p> :
                tasks.map(task => (
                    <div key={task.id} className="bg-[#1A2B34] p-3 flex items-center gap-3 border-2 border-slate-700">
                        <p className="flex-grow line-through text-slate-500">{task.title}</p>
                        <button onClick={() => onUpdate(task.id, { status: 'Pending' })} className="p-1 text-slate-400 hover:text-green-500" aria-label="Restore Task"><RestoreIcon /></button>
                        <button onClick={() => onDelete(task.id, true)} className="p-1 text-slate-400 hover:text-red-500" aria-label="Delete Permanently"><TrashIcon /></button>
                    </div>
                ))
            }
        </div>
    </div>
);

export const EmptyState: React.FC = () => (
    <div className="text-center py-16 px-4 bg-[#1A2B34] border-2 border-dashed border-[#475569]">
        <h3 className="text-xl font-bold text-white">Your list is clear!</h3>
        <p className="text-slate-400 mt-1">Add a task above to get started.</p>
    </div>
);

export const LoadingState: React.FC = () => (
     <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <SpinnerIcon className="w-8 h-8"/>
        <p className="text-lg font-semibold">Loading your tasks...</p>
    </div>
);
