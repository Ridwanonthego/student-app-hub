

import React, { useState, useEffect, useCallback } from 'react';
import { BanglaNutriPlanPageProps, View, Meal, UserProfile, AiGeneratedRecipe, AiNutritionalInfo, GroceryCategory, NutriProfile } from './types';
import { useMealPlan } from './hooks';
import { generateGroceryList, getAiCoachTip, generateRecipeFromImage, generateRecipeFromText, getNutritionalInfo, regenerateMealPlan } from './gemini-service';
import { Header, BottomNavBar, DaySelector, DailyMealCard, MealDetailModal, AiCoachCard, DietaryPreferencesCard, RecipeGeneratorCard, FoodAnalysisCard, GroceryList, ComponentLoader, OnboardingModal } from './components';
import { BackArrowIcon } from '../../components/Icons';
import { supabase } from '../../supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../../types';

const BanglaNutriPlanPage: React.FC<BanglaNutriPlanPageProps> = ({ onNavigateBack, apiKey, user }) => {
    // Core state from hook
    const { plan, updatePlan, resetPlan, activeDay, setActiveDay, activeDayPlan, loggedMeals, logMeal, isMealLogged } = useMealPlan(user);
    
    // UI State
    const [activeView, setActiveView] = useState<View>('meal-plan');
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    // AI-related State
    const [groceryList, setGroceryList] = useState<GroceryCategory[]>([]);
    const [aiTip, setAiTip] = useState<string>('');
    const [generatedRecipe, setGeneratedRecipe] = useState<AiGeneratedRecipe | null>(null);
    const [analyzedDish, setAnalyzedDish] = useState<AiNutritionalInfo | null>(null);
    
    // Loading & Error State
    const [loadingStates, setLoadingStates] = useState({
        grocery: false,
        tip: true,
        recipe: false,
        analysis: false,
        planUpdate: false,
        profile: true,
    });
    const [errorStates, setErrorStates] = useState({
        grocery: null,
        recipe: null,
        analysis: null,
    });

    const setLoading = (key: keyof typeof loadingStates, value: boolean) => setLoadingStates(prev => ({ ...prev, [key]: value }));
    const setError = (key: keyof typeof errorStates, value: string | null) => setErrorStates(prev => ({ ...prev, [key]: value }));

    const calculateBmiStatus = (profile: NutriProfile): UserProfile['bmiStatus'] => {
        if (!profile.height_cm || !profile.weight_kg) return 'Unknown';
        const heightM = profile.height_cm / 100;
        const bmi = profile.weight_kg / (heightM * heightM);
        if (bmi < 18.5) return 'Underweight';
        if (bmi > 24.9) return 'Overweight';
        return 'Fit';
    }

    // Fetch all user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            setLoading('profile', true);

            try {
                const { data: mainProfileData, error: mainProfileError } = await (supabase
                    .from('profiles') as any)
                    .select('full_name, username')
                    .eq('id', user.id)
                    .single();
                
                if (mainProfileError) throw mainProfileError;

                const { data: nutriProfileData, error: nutriProfileError } = await (supabase
                    .from('banglanutri_profiles') as any)
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (nutriProfileError && nutriProfileError.code !== 'PGRST116') {
                    throw nutriProfileError;
                }
                
                const typedNutriProfile = nutriProfileData as any;
                const typedMainProfile = mainProfileData as any;

                if (!typedNutriProfile?.age || !typedNutriProfile?.goal) {
                    setShowOnboarding(true);
                }
                
                setUserProfile({
                    ...(typedNutriProfile || {}),
                    name: typedMainProfile.full_name || typedMainProfile.username || 'User',
                    bmiStatus: calculateBmiStatus(typedNutriProfile || {})
                });

            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading('profile', false);
            }
        };
        fetchUserData();
    }, [user]);

    // Fetch AI Coach Tip
    useEffect(() => {
        if (!activeDayPlan || showOnboarding) return;
        setLoading('tip', true);
        getAiCoachTip(activeDayPlan, loggedMeals, apiKey)
            .then(setAiTip)
            .catch(() => setAiTip("Enjoy your meal and stay healthy!"))
            .finally(() => setLoading('tip', false));
    }, [activeDay, loggedMeals, activeDayPlan, apiKey, showOnboarding]);

    // Generate Grocery List
    const handleGenerateGroceryList = useCallback(async () => {
        if (groceryList.length > 0 && activeView === 'grocery-list') return; 
        setLoading('grocery', true);
        setError('grocery', null);
        try {
            const list = await generateGroceryList(plan, apiKey);
            setGroceryList(list);
        } catch (e) {
            setError('grocery', e instanceof Error ? e.message : 'Failed to generate list.');
        } finally {
            setLoading('grocery', false);
        }
    }, [plan, groceryList.length, activeView, apiKey]);

    useEffect(() => {
        if (activeView === 'grocery-list' && !showOnboarding) {
            handleGenerateGroceryList();
        }
    }, [activeView, handleGenerateGroceryList, showOnboarding]);
    
    // AI Tool Handlers
    const handleGenerateRecipeFromImage = async (file: File) => {
        setLoading('recipe', true);
        setError('recipe', null);
        setGeneratedRecipe(null);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = (reader.result as string).split(',')[1];
                const recipe = await generateRecipeFromImage(base64Image, apiKey);
                setGeneratedRecipe(recipe);
            };
            reader.onerror = () => setError('recipe', 'Failed to read the file.');
        } catch (e) {
            setError('recipe', e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading('recipe', false);
        }
    };
    
    const handleGenerateRecipeFromText = async (ingredients: string) => {
        setLoading('recipe', true);
        setError('recipe', null);
        setGeneratedRecipe(null);
        try {
            const recipe = await generateRecipeFromText(ingredients, apiKey);
            setGeneratedRecipe(recipe);
        } catch (e) {
            setError('recipe', e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading('recipe', false);
        }
    };

    const handleAnalyzeDish = async (dishName: string) => {
        setLoading('analysis', true);
        setError('analysis', null);
        setAnalyzedDish(null);
        try {
            const nutrients = await getNutritionalInfo(dishName, apiKey);
            setAnalyzedDish(nutrients);
        } catch (e) {
            setError('analysis', e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading('analysis', false);
        }
    };

    const handleUpdatePlan = async () => {
        if (!userProfile?.id) return;
        setLoading('planUpdate', true);
        setAiTip("Updating your plan based on your preferences...");
        try {
            await (supabase.from('banglanutri_profiles') as any).upsert({ id: userProfile.id, exclusions: userProfile.exclusions });
            const newPlan = await regenerateMealPlan(userProfile, apiKey);
            updatePlan(newPlan);
            setAiTip('Your meal plan has been updated!');
        } catch (e) {
             setAiTip(e instanceof Error ? e.message : 'Sorry, I could not update your plan right now.');
        } finally {
            setLoading('planUpdate', false);
        }
    };

    const handleSaveOnboarding = async (profile: NutriProfile) => {
        if (!user) return;
        setLoading('planUpdate', true); // Reuse loading state
        try {
            const updatedProfile = { ...profile, id: user.id };
            await (supabase.from('banglanutri_profiles') as any).upsert(updatedProfile);
            setUserProfile(prev => ({
                ...prev!,
                ...updatedProfile,
                bmiStatus: calculateBmiStatus(updatedProfile)
            }));
            const newPlan = await regenerateMealPlan(updatedProfile, apiKey);
            updatePlan(newPlan);
            setShowOnboarding(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading('planUpdate', false);
        }
    }

    const handleClearPreferences = async () => {
        if (!userProfile?.id) return;
        const newExclusions: string[] = [];
        setUserProfile(p => p ? {...p, exclusions: newExclusions} : null);
        await (supabase.from('banglanutri_profiles') as any).upsert({ id: userProfile.id, exclusions: newExclusions });
        resetPlan();
        setAiTip("Your preferences have been cleared and the plan has been reset.");
    };

    if (loadingStates.profile) {
        return <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center"><ComponentLoader text="Loading Your Profile..." /></div>
    }

    const renderMealPlanView = () => (
        <div className="space-y-6">
            <AiCoachCard tip={aiTip} isLoading={loadingStates.tip} />
            <DaySelector days={plan.map(p => p.day)} activeDay={activeDay} onSelectDay={setActiveDay} />
            {activeDayPlan ? (
                <DailyMealCard 
                    dayPlan={activeDayPlan}
                    onLogMeal={logMeal}
                    onSelectMeal={setSelectedMeal}
                    isMealLogged={isMealLogged}
                />
            ) : (
                <ComponentLoader text="Loading plan..." />
            )}
        </div>
    );
    
    const renderGroceryListView = () => (
        <div>
            <GroceryList list={groceryList} isLoading={loadingStates.grocery} />
             {errorStates.grocery && <p className="text-center text-red-500 mt-4 font-bold">{errorStates.grocery}</p>}
        </div>
    );

    const renderAiToolsView = () => (
        <div className="space-y-6">
             <DietaryPreferencesCard 
                exclusions={userProfile?.exclusions || []}
                onExclusionsChange={(newExcs) => setUserProfile(p => p ? {...p, exclusions: newExcs} : null)}
                onUpdatePlan={handleUpdatePlan}
                onClear={handleClearPreferences}
                isLoading={loadingStates.planUpdate}
            />
            <RecipeGeneratorCard
                onGenerateFromImage={handleGenerateRecipeFromImage}
                onGenerateFromText={handleGenerateRecipeFromText}
                recipe={generatedRecipe}
                isLoading={loadingStates.recipe}
                error={errorStates.recipe}
            />
            <FoodAnalysisCard
                onAnalyze={handleAnalyzeDish}
                nutrients={analyzedDish}
                isLoading={loadingStates.analysis}
                error={errorStates.analysis}
            />
        </div>
    );
    
    const renderContent = () => {
        switch(activeView) {
            case 'meal-plan': return renderMealPlanView();
            case 'grocery-list': return renderGroceryListView();
            case 'ai-tools': return renderAiToolsView();
            default: return renderMealPlanView();
        }
    }

    return (
        <div className="font-poppins bg-[#F4F1DE] min-h-screen pb-24">
             <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => {}} // Disallow closing
                onSave={handleSaveOnboarding}
                isLoading={loadingStates.planUpdate}
            />
            <Header user={userProfile} onBack={onNavigateBack} />
            <main className="max-w-7xl mx-auto p-4 sm:p-6">
                {renderContent()}
            </main>
            <MealDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
            <BottomNavBar activeTab={activeView} onTabChange={setActiveView} />
        </div>
    );
};

export default BanglaNutriPlanPage;