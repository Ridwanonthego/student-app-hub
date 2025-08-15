

import { User } from "@supabase/supabase-js";
import React from "react";

export type View = 'meal-plan' | 'grocery-list' | 'ai-tools';

export interface Meal {
    id: string;
    name: string;
    emoji: string;
    description: string;
    calories: number;
    weight: number;
    isRiceMeal: boolean;
    breakdown: { item: string; calories: number }[];
}

export interface DailyPlan {
    day: number;
    meals: Meal[];
}

export type WeeklyPlan = DailyPlan[];

export type LoggedMeals = {
    [mealId: string]: boolean;
};

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface NutriProfile {
    id?: string;
    age?: number;
    weight_kg?: number;
    height_cm?: number;
    activity_level?: ActivityLevel;
    goal?: Goal;
    exclusions?: string[];
}

export interface UserProfile extends NutriProfile {
    name: string;
    bmiStatus: 'Fit' | 'Underweight' | 'Overweight' | 'Unknown';
}

export interface AiGeneratedRecipe {
    name:string;
    description: string;
    ingredients: string[];
    instructions: string[];
}

export interface AiNutritionalInfo {
    dishName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    summary: string;
}

export interface GroceryCategory {
    categoryName: string;
    items: string[];
}

export interface BanglaNutriPlanPageProps {
  onNavigateBack: () => void;
  apiKey: string;
  user: User;
}

export interface MealDetailModalProps {
    meal: Meal | null;
    onClose: () => void;
}

export interface ComponentLoaderProps {
    text: string;
    className?: string;
}

export interface DietaryPreferencesCardProps {
    exclusions: string[];
    onExclusionsChange: (newExclusions: string[]) => void;
    onUpdatePlan: () => void;
    onClear: () => void;
    isLoading: boolean;
}

export interface RecipeGeneratorCardProps {
    onGenerateFromText: (ingredients: string) => void;
    onGenerateFromImage: (file: File) => void;
    recipe: AiGeneratedRecipe | null;
    isLoading: boolean;
    error: string | null;
}

export interface FoodAnalysisCardProps {
    onAnalyze: (dishName: string) => void;
    nutrients: AiNutritionalInfo | null;
    isLoading: boolean;
    error: string | null;
}

export interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: NutriProfile) => void;
    isLoading: boolean;
}

export interface BottomNavBarProps {
    activeTab: View;
    onTabChange: (tab: View) => void;
}