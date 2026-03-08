// src/services/authService.js
// Auth + profile creation service — matches DB schema exactly
import { supabase } from '../config/supabase';

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Create or update profile row (profiles.id = auth.users.id)
export async function upsertProfile(userId, profileData) {
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: profileData.fullName ?? null,
            gender: profileData.gender ?? null,
            date_of_birth: profileData.dateOfBirth ?? null,
            height_cm: profileData.height ?? null,
            weight_kg: profileData.weight ?? null,
            goal: profileData.goal ?? null,
            activity_level: profileData.activityLevel ?? null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Save calorie targets after onboarding
export async function saveCalorieTargets(userId, { daily_calories, protein_target, carbs_target, fat_target }) {
    const { data, error } = await supabase
        .from('calorie_targets')
        .insert({ user_id: userId, daily_calories, protein_target, carbs_target, fat_target })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}