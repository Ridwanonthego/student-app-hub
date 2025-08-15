

import { useState, useMemo, useEffect } from 'react';
import { WeeklyPlan, DailyPlan, LoggedMeals, Meal } from './types';
import { weeklyPlanData } from './data';
import { supabase } from '../../supabase/client';
import { User } from '@supabase/supabase-js';

const CUSTOM_PLAN_KEY = 'banglaNutriCustomPlan';

export const useMealPlan = (user: User | null) => {
    const [plan, setPlan] = useState<WeeklyPlan>(() => {
        const savedPlan = localStorage.getItem(CUSTOM_PLAN_KEY);
        return savedPlan ? JSON.parse(savedPlan) : weeklyPlanData;
    });
    const [activeDay, setActiveDay] = useState<number>(1);
    const [loggedMeals, setLoggedMeals] = useState<LoggedMeals>({});

    useEffect(() => {
        if (!user) return;
        const fetchLoggedMeals = async () => {
            const today = new Date().toISOString().slice(0, 10);
            const { data, error } = await (supabase
                .from('banglanutri_logged_meals') as any)
                .select('meal_id')
                .eq('user_id', user.id)
                .gte('logged_date', today); // Fetch for today and future if needed, keeps it clean
            
            if (error) {
                console.error("Error fetching logged meals:", error);
            } else if (data) {
                const mealMap = (data as any[]).reduce((acc, meal) => {
                    acc[meal.meal_id] = true;
                    return acc;
                }, {} as LoggedMeals);
                setLoggedMeals(mealMap);
            }
        };
        fetchLoggedMeals();
    }, [user]);

    const activeDayPlan: DailyPlan | undefined = useMemo(() => {
        return plan.find(d => d.day === activeDay);
    }, [activeDay, plan]);

    const logMeal = async (mealId: string) => {
        if (!user || loggedMeals[mealId]) return;
        
        const today = new Date().toISOString().slice(0, 10);
        const { error } = await (supabase.from('banglanutri_logged_meals') as any)
            .insert([{
                user_id: user.id,
                meal_id: mealId,
                logged_date: today
            }]);

        if (!error) {
            setLoggedMeals(prev => ({ ...prev, [mealId]: true }));
        }
    };
    
    const isMealLogged = (mealId: string) => !!loggedMeals[mealId];

    const updatePlan = (newPlan: WeeklyPlan) => {
        setPlan(newPlan);
        localStorage.setItem(CUSTOM_PLAN_KEY, JSON.stringify(newPlan));
    };

    const resetPlan = () => {
        setPlan(weeklyPlanData);
        localStorage.removeItem(CUSTOM_PLAN_KEY);
    };

    return {
        plan,
        activeDay,
        setActiveDay,
        activeDayPlan,
        loggedMeals,
        logMeal,
        isMealLogged,
        updatePlan,
        resetPlan,
    };
};