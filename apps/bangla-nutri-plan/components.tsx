

import React, { useState, useRef, useEffect } from 'react';
import { Meal, UserProfile, DailyPlan, MealDetailModalProps, ComponentLoaderProps, RecipeGeneratorCardProps, FoodAnalysisCardProps, AiGeneratedRecipe, AiNutritionalInfo, GroceryCategory, DietaryPreferencesCardProps, OnboardingModalProps, NutriProfile, ActivityLevel, Goal, BottomNavBarProps } from './types';
import { RiceBowlIcon, UserIcon, CloseIcon, CameraIcon, SpinnerIcon, BackArrowIcon, ListIcon, CartIcon, SparklesIcon } from '../../components/Icons';

export const Header: React.FC<{ user: UserProfile | null, onBack: () => void }> = ({ user, onBack }) => (
    <header className="sticky top-0 z-20 bg-white border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
             <button
                onClick={onBack}
                className="flex items-center gap-2 bg-white text-black font-bold p-2 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                aria-label="Back to Hub"
                >
                <BackArrowIcon />
            </button>
            <div className="flex items-center gap-2">
                <RiceBowlIcon className="w-8 h-8 p-1 bg-lime-300 border-2 border-black"/>
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-black">BanglaNutriPlan</h1>
                </div>
            </div>
            {user && (
                 <div className="flex items-center gap-2 p-2 border-2 border-black bg-white shadow-[4px_4px_0px_#000]">
                    <UserIcon className="w-8 h-8 p-1.5 bg-gray-200 text-gray-600 hidden sm:block"/>
                    <div>
                        <p className="font-bold text-gray-800 text-sm sm:text-base">{user.name}</p>
                        <p className={`text-xs font-bold px-2 py-0.5 w-fit ${user.bmiStatus === 'Fit' ? 'bg-green-300 border border-green-800 text-green-900' : 'bg-orange-300 border border-orange-800 text-orange-900'}`}>{user.bmiStatus}</p>
                    </div>
                </div>
            )}
        </div>
    </header>
);

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
    const navItems = [
        { id: 'meal-plan', label: 'Plan', icon: <ListIcon /> },
        { id: 'grocery-list', label: 'Grocery', icon: <CartIcon /> },
        { id: 'ai-tools', label: 'AI Tools', icon: <SparklesIcon /> },
    ];
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black flex justify-around h-16 shadow-[0_-4px_8px_rgba(0,0,0,0.1)] z-30">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as any)}
                    className={`flex flex-col items-center justify-center w-full transition-all duration-200 ${activeTab === item.id ? 'text-lime-600' : 'text-gray-500 hover:text-lime-500'}`}
                >
                    <div className={`p-1 rounded-full transition-all ${activeTab === item.id ? 'bg-lime-400' : 'bg-transparent'}`}>
                        {React.cloneElement(item.icon, {className: `w-7 h-7`})}
                    </div>
                    <span className="text-xs font-bold">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};


export const DaySelector: React.FC<{ days: number[]; activeDay: number; onSelectDay: (day: number) => void }> = ({ days, activeDay, onSelectDay }) => (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        {days.map(day => (
            <button
                key={day}
                onClick={() => onSelectDay(day)}
                className={`px-6 py-2 border-2 border-black font-bold transition-all duration-150 text-sm whitespace-nowrap shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${activeDay === day ? 'bg-lime-400 text-black' : 'bg-white text-gray-700 hover:bg-lime-200'}`}
            >
                Day {day}
            </button>
        ))}
    </div>
);

const MealItem: React.FC<{ meal: Meal; onLog: () => void; onSelect: () => void; isLogged: boolean }> = ({ meal, onLog, onSelect, isLogged }) => (
    <div className={`transition-all duration-300 p-4 border-2 border-black ${isLogged ? 'bg-lime-200' : 'bg-white'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={onSelect}>
            <div className="text-4xl p-2 bg-white border-2 border-black">{meal.emoji}</div>
            <div className="flex-grow">
                <p className="font-bold text-gray-800">{meal.name}</p>
                <p className="text-sm text-gray-500">{meal.description}</p>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
            <div className="text-left">
                <p className="font-bold text-gray-700">{meal.calories} kcal</p>
                <p className="text-sm text-gray-500">{meal.weight}g</p>
            </div>
            <button
                onClick={onLog}
                disabled={isLogged}
                className={`px-4 py-2 border-2 border-black font-bold text-sm transition-all w-full sm:w-32 shadow-[2px_2px_0px_#000] active:shadow-none active:translate-y-0.5 ${isLogged ? 'bg-lime-500 text-white cursor-not-allowed shadow-none translate-y-0.5' : 'bg-white text-green-700 hover:bg-lime-200'}`}
            >
                {isLogged ? 'Eaten ✓' : 'Log Meal'}
            </button>
        </div>
    </div>
);

export const DailyMealCard: React.FC<{ dayPlan: DailyPlan; onLogMeal: (mealId: string) => void; onSelectMeal: (meal: Meal) => void; isMealLogged: (mealId: string) => boolean; }> = ({ dayPlan, onLogMeal, onSelectMeal, isMealLogged }) => (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000]">
        <h2 className="text-xl font-bold text-black p-4 border-b-2 border-black bg-lime-300">Day {dayPlan.day} - Meal Schedule</h2>
        <div className="p-4 space-y-2">
            {dayPlan.meals.map(meal => (
                <MealItem
                    key={meal.id}
                    meal={meal}
                    onLog={() => onLogMeal(meal.id)}
                    onSelect={() => onSelectMeal(meal)}
                    isLogged={isMealLogged(meal.id)}
                />
            ))}
        </div>
    </div>
);

export const MealDetailModal: React.FC<MealDetailModalProps> = ({ meal, onClose }) => {
    if (!meal) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-[10px_10px_0px_#000] w-full max-w-md transition-all duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b-4 border-black flex justify-between items-center bg-lime-300">
                    <h3 className="text-2xl font-bold text-black">{meal.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 border-2 border-black"><CloseIcon /></button>
                </div>
                <div className="p-6">
                    <h4 className="font-bold text-black mb-2">Calorie Breakdown</h4>
                    <ul className="space-y-2 mb-4">
                        {meal.breakdown.map((item, index) => (
                            <li key={index} className="flex justify-between text-gray-700 border-b border-dashed border-gray-400 py-1">
                                <span>{item.item}</span>
                                <span className="font-semibold">{item.calories} kcal</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between font-bold text-lg text-black pt-2 mt-2 border-t-2 border-black">
                        <span>Total</span>
                        <span>{meal.calories} kcal / {meal.weight}g</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AiCoachCard: React.FC<{ tip: string; isLoading: boolean }> = ({ tip, isLoading }) => (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
        <h3 className="text-lg font-bold text-black p-4 border-b-2 border-black bg-yellow-300">💡 AI Coach Tip</h3>
        <div className="p-4 min-h-[60px] flex items-center justify-center">
            {isLoading ? <ComponentLoader text="Generating tip..." /> : <p className="text-center font-semibold text-gray-800">{tip}</p>}
        </div>
    </div>
);

const ExclusionTag: React.FC<{ tag: string; onRemove: () => void }> = ({ tag, onRemove }) => (
    <span className="bg-red-300 text-red-900 text-sm font-bold p-2 border-2 border-black flex items-center gap-1.5 capitalize">
        {tag}
        <button onClick={onRemove} className="text-red-700 hover:text-black">
            <CloseIcon className="w-4 h-4" />
        </button>
    </span>
);

export const DietaryPreferencesCard: React.FC<DietaryPreferencesCardProps> = ({ exclusions, onExclusionsChange, onUpdatePlan, onClear, isLoading }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAddExclusion = (e: React.FormEvent) => {
        e.preventDefault();
        const newExclusion = inputValue.trim().toLowerCase();
        if (newExclusion && !exclusions.includes(newExclusion)) {
            onExclusionsChange([...exclusions, newExclusion]);
        }
        setInputValue('');
    };

    const handleRemoveExclusion = (tagToRemove: string) => {
        onExclusionsChange(exclusions.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
            <div className="p-4 border-b-2 border-black bg-orange-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-black">Dietary Preferences</h3>
                    {exclusions.length > 0 && (
                        <button onClick={onClear} disabled={isLoading} className="text-sm font-bold text-gray-700 hover:text-red-500 disabled:text-gray-400">Clear</button>
                    )}
                </div>
                <p className="text-sm text-gray-700 mt-1 font-semibold">Tell me what you don't eat, and I'll adjust your plan.</p>
            </div>
            <div className="p-4 space-y-3">
                {exclusions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border-2 border-dashed border-black">
                        {exclusions.map(tag => (
                            <ExclusionTag key={tag} tag={tag} onRemove={() => handleRemoveExclusion(tag)} />
                        ))}
                    </div>
                )}
                
                <form onSubmit={handleAddExclusion} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder='e.g., beef, shrimp, bitter gourd...'
                        className="flex-grow bg-white border-2 border-black p-3 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={isLoading}
                    />
                </form>
                <button
                    onClick={onUpdatePlan}
                    disabled={isLoading || exclusions.length === 0}
                    className="w-full bg-orange-500 text-white font-bold py-3 px-4 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:shadow-none active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none"
                >
                    {isLoading ? <SpinnerIcon /> : 'Update Plan'}
                </button>
            </div>
        </div>
    );
};


export const RecipeGeneratorCard: React.FC<RecipeGeneratorCardProps> = ({ onGenerateFromText, onGenerateFromImage, recipe, isLoading, error }) => {
    const [mode, setMode] = useState<'text' | 'photo'>('text');
    const [ingredientsText, setIngredientsText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onGenerateFromImage(file);
        }
    };
    
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ingredientsText.trim()) {
            onGenerateFromText(ingredientsText);
        }
    };

    return (
        <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
            <div className="p-4 border-b-2 border-black bg-blue-300">
                <h3 className="text-lg font-bold text-black">Recipe Generator</h3>
                <p className="text-sm text-gray-700 mt-1 font-semibold">Tell me what you have, I'll create a recipe.</p>
            </div>
            
            <div className="p-4">
                <div className="flex border-2 border-black mb-4">
                    <button onClick={() => setMode('text')} className={`flex-1 p-2 text-sm font-bold transition-colors ${mode === 'text' ? 'bg-blue-500 text-white' : 'bg-white text-black hover:bg-blue-100'}`}>Write Ingredients</button>
                    <button onClick={() => setMode('photo')} className={`flex-1 p-2 text-sm font-bold border-l-2 border-black transition-colors ${mode === 'photo' ? 'bg-blue-500 text-white' : 'bg-white text-black hover:bg-blue-100'}`}>Upload Photo</button>
                </div>

                {mode === 'text' ? (
                    <form onSubmit={handleTextSubmit}>
                        <textarea
                            value={ingredientsText}
                            onChange={e => setIngredientsText(e.target.value)}
                            placeholder="e.g., chicken, onion, garlic, potatoes, tomatoes"
                            className="w-full h-24 bg-white border-2 border-black p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !ingredientsText.trim()} className="w-full bg-blue-600 text-white font-bold py-3 px-4 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-blue-700 transition-all active:shadow-none active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none">
                            {isLoading ? <SpinnerIcon className="mx-auto" /> : 'Generate Recipe'}
                        </button>
                    </form>
                ) : (
                    <>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:shadow-none active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none">
                            {isLoading ? <SpinnerIcon /> : <CameraIcon />}
                            {isLoading ? 'Analyzing...' : 'Upload Fridge Photo'}
                        </button>
                    </>
                )}

                <div className="mt-4 min-h-[150px]">
                    {isLoading && !recipe && <ComponentLoader text="Generating recipe..." />}
                    {error && <div className="text-center text-red-500 p-2 font-bold">{error}</div>}
                    {recipe && (
                        <div className="bg-blue-100 p-4 border-2 border-black">
                            <h4 className="font-bold text-xl text-blue-800">{recipe.name}</h4>
                            <p className="text-sm text-blue-700 italic mb-3">{recipe.description}</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="font-semibold text-blue-900 mb-1">Ingredients:</h5>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-blue-900 mb-1">Instructions:</h5>
                                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                                        {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const FoodAnalysisCard: React.FC<FoodAnalysisCardProps> = ({ onAnalyze, nutrients, isLoading, error }) => {
    const [dishName, setDishName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (dishName.trim()) {
            onAnalyze(dishName);
        }
    };

    return (
        <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
             <div className="p-4 border-b-2 border-black bg-green-300">
                <h3 className="text-lg font-bold text-black">Nutritional Analyzer</h3>
                <p className="text-sm text-gray-700 mt-1 font-semibold">Curious about a dish? Type its name below.</p>
            </div>
            <div className="p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={dishName}
                        onChange={e => setDishName(e.target.value)}
                        placeholder='e.g., "Shorshe Ilish"'
                        className="flex-grow bg-white border-2 border-black p-3 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !dishName.trim()}
                        className="bg-green-600 text-white font-bold p-3 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-green-700 transition-all w-32 active:shadow-none active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none"
                    >
                        {isLoading ? <SpinnerIcon className="mx-auto" /> : 'Analyze'}
                    </button>
                </form>
                <div className="mt-4 min-h-[120px]">
                    {error && <div className="text-center text-red-500 p-2 font-bold">{error}</div>}
                    {nutrients && (
                        <div className="bg-green-100 p-4 border-2 border-black">
                            <p className="font-bold text-lg text-green-800">{nutrients.dishName}</p>
                            <p className="text-sm text-green-700 mb-2">{nutrients.summary}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <div className="p-2 bg-white border-2 border-black"><p className="font-bold">{nutrients.calories}</p><p className="text-xs">kcal</p></div>
                                <div className="p-2 bg-white border-2 border-black"><p className="font-bold">{nutrients.protein}g</p><p className="text-xs">Protein</p></div>
                                <div className="p-2 bg-white border-2 border-black"><p className="font-bold">{nutrients.carbs}g</p><p className="text-xs">Carbs</p></div>
                                <div className="p-2 bg-white border-2 border-black"><p className="font-bold">{nutrients.fat}g</p><p className="text-xs">Fat</p></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const GroceryList: React.FC<{ list: GroceryCategory[]; isLoading: boolean }> = ({ list, isLoading }) => (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-black p-4 border-b-2 border-black bg-lime-300">Your 7-Day Grocery List</h2>
        <div className="p-6">
            {isLoading && <ComponentLoader text="Generating your weekly grocery list..." />}
            {!isLoading && list.length > 0 && (
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    {list.map(category => (
                        <div key={category.categoryName}>
                            <h3 className="font-bold text-xl text-black border-b-2 border-black pb-1 mb-2">{category.categoryName}</h3>
                            <ul className="space-y-1 list-disc list-inside text-gray-700 font-semibold">
                                {category.items.map(item => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);


export const ComponentLoader: React.FC<ComponentLoaderProps> = ({ text, className = "text-gray-500" }) => (
    <div className={`flex flex-col items-center justify-center gap-2 py-4 ${className}`}>
        <SpinnerIcon className="w-8 h-8"/>
        <p className="text-sm font-semibold">{text}</p>
    </div>
);


export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onSave, isLoading }) => {
    const [profile, setProfile] = useState<Omit<NutriProfile, 'height_cm'>>({ age: 25, weight_kg: 70, activity_level: 'light', goal: 'maintain', exclusions: [] });
    const [feet, setFeet] = useState(5);
    const [inches, setInches] = useState(9);

    if (!isOpen) return null;

    const handleSave = () => {
        const height_cm = Math.round(((feet || 0) * 12 + (inches || 0)) * 2.54);
        onSave({ ...profile, height_cm });
    };
    
    const setField = (field: keyof Omit<NutriProfile, 'height_cm' | 'id'>, value: any) => {
        setProfile(p => ({ ...p, [field]: value }));
    };

    return (
         <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg border-4 border-black shadow-[10px_10px_0px_#000]">
                <header className="p-4 border-b-4 border-black bg-lime-300">
                    <h2 className="text-2xl font-extrabold text-black">Personalize Your Plan</h2>
                    <p className="font-semibold text-gray-700">Let's get some details to create the perfect plan for you.</p>
                </header>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="font-bold text-black">Age</label>
                            <input type="number" value={profile.age || ''} onChange={e => setField('age', Number(e.target.value))} className="w-full mt-1 p-2 border-2 border-black text-center font-bold"/>
                        </div>
                        <div>
                            <label className="font-bold text-black">Weight (kg)</label>
                            <input type="number" value={profile.weight_kg || ''} onChange={e => setField('weight_kg', Number(e.target.value))} className="w-full mt-1 p-2 border-2 border-black text-center font-bold"/>
                        </div>
                         <div>
                            <label className="font-bold text-black">Height</label>
                            <div className="flex gap-2 mt-1">
                                <input type="number" value={feet} onChange={e => setFeet(Number(e.target.value))} placeholder="ft" className="w-1/2 p-2 border-2 border-black text-center font-bold"/>
                                <input type="number" value={inches} onChange={e => setInches(Number(e.target.value))} placeholder="in" className="w-1/2 p-2 border-2 border-black text-center font-bold"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="font-bold text-black">Activity Level</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {(['sedentary', 'light', 'moderate', 'active'] as ActivityLevel[]).map(level => (
                                <button key={level} onClick={() => setField('activity_level', level)} className={`p-2 border-2 border-black font-bold capitalize ${profile.activity_level === level ? 'bg-orange-400' : 'bg-white text-black'}`}>{level}</button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-bold text-black">Your Goal</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {(['lose', 'maintain', 'gain'] as Goal[]).map(g => (
                                <button key={g} onClick={() => setField('goal', g)} className={`p-2 border-2 border-black font-bold capitalize ${profile.goal === g ? 'bg-orange-400' : 'bg-white text-black'}`}>{g} weight</button>
                            ))}
                        </div>
                    </div>
                </div>
                <footer className="p-4 border-t-4 border-black bg-gray-100 flex justify-end">
                    <button onClick={handleSave} disabled={isLoading} className="bg-lime-400 text-black font-bold py-3 px-6 border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 hover:bg-lime-500 transition-all active:shadow-none active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none">
                        {isLoading ? <SpinnerIcon /> : 'Save & Start'}
                    </button>
                </footer>
            </div>
         </div>
    );
};