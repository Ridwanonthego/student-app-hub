
import React, { useState, useMemo } from 'react';
import { TodoListPageProps, View, Task } from './types';
import { useTasks } from './hooks';
import { TaskInput, TaskList, CancelledTaskList, EmptyState, LoadingState } from './components';
import { parseTaskWithAI } from './gemini-service';
import { BackArrowIcon } from '../../components/Icons';

const TodoListPage: React.FC<TodoListPageProps> = ({ onNavigateBack, apiKey, user }) => {
    const { tasks, addTask, updateTask, deleteTask, loading, error } = useTasks(user);
    const [view, setView] = useState<View>('list');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAddTask = async (rawText: string) => {
        setIsProcessing(true);
        try {
            const parsed = await parseTaskWithAI(rawText, apiKey);
            await addTask(parsed.title, parsed.category, parsed.priority, parsed.dueDate);
        } catch (e) {
            console.error("AI parsing failed, adding as default task:", e);
            await addTask(rawText, 'General', 'Medium', null);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'Cancelled'), [tasks]);
    const cancelledTasks = useMemo(() => tasks.filter(t => t.status === 'Cancelled'), [tasks]);
    const doneTasksCount = useMemo(() => activeTasks.filter(t => t.status === 'Done').length, [activeTasks]);

    const handleClearCompleted = async () => {
        const completedTasks = activeTasks.filter(t => t.status === 'Done');
        for (const task of completedTasks) {
            await deleteTask(task.id, true); // permanent delete
        }
    };

    const renderContent = () => {
        if (loading) return <LoadingState />;
        
        if (view === 'cancelled') {
            return (
                <CancelledTaskList
                    tasks={cancelledTasks}
                    onBack={() => setView('list')}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                />
            );
        }

        const groceryTasks = activeTasks.filter(t => t.category === 'Grocery');
        const regularTasks = activeTasks.filter(t => t.category !== 'Grocery');

        return (
            <>
                {activeTasks.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-8">
                        {groceryTasks.length > 0 && (
                            <TaskList
                                title="Grocery List"
                                tasks={groceryTasks}
                                onUpdate={updateTask}
                                onDelete={deleteTask}
                            />
                        )}
                        {regularTasks.length > 0 && (
                            <TaskList
                                title="Tasks"
                                tasks={regularTasks}
                                onUpdate={updateTask}
                                onDelete={deleteTask}
                            />
                        )}
                    </div>
                )}
                <footer className="mt-8 flex justify-center items-center gap-6">
                    {doneTasksCount > 0 && (
                        <button onClick={handleClearCompleted} className="font-bold text-slate-400 hover:text-white hover:underline">
                            Clear {doneTasksCount} completed task{doneTasksCount > 1 ? 's' : ''}
                        </button>
                    )}
                    {cancelledTasks.length > 0 && (
                        <button onClick={() => setView('cancelled')} className="font-bold text-slate-400 hover:text-white hover:underline">
                            View {cancelledTasks.length} cancelled item{cancelledTasks.length > 1 ? 's' : ''}
                        </button>
                    )}
                </footer>
            </>
        );
    };

    return (
        <div className="bg-[#09191f] min-h-screen font-inter text-[#E2E8F0] p-4 sm:p-8">
             <button
                onClick={onNavigateBack}
                className="absolute top-4 left-4 flex items-center gap-2 text-yellow-300 font-semibold p-2 hover:text-yellow-100"
                aria-label="Back to Hub"
            >
                <BackArrowIcon />
                <span className="hidden sm:inline">Back to Hub</span>
            </button>
            <div className="max-w-2xl mx-auto">
                 <header className="text-center my-8">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter">কাজের List</h1>
                    <p className="text-lg font-bold text-slate-300 mt-2">Your smart to-do assistant.</p>
                </header>
                <main>
                    <TaskInput onAddTask={handleAddTask} isProcessing={isProcessing} />
                    <div className="mt-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TodoListPage;
