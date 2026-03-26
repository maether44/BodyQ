import { supabase } from '../lib/supabase';

// ── Exercise key (HTML camelCase) → muscles worked ────────────
const EXERCISE_MUSCLES: Record<string, string[]> = {
  squat:         ['Quads', 'Glutes', 'Hamstrings'],
  pushup:        ['Chest', 'Triceps', 'Shoulders'],
  bicepCurl:     ['Biceps', 'Forearms'],
  shoulderPress: ['Shoulders', 'Triceps'],
  deadlift:      ['Back', 'Hamstrings', 'Glutes'],
  lunge:         ['Quads', 'Glutes'],
  plank:         ['Core', 'Shoulders'],
};

// ── High-fatigue muscle → recovery focus suggestion ───────────
export const RECOVERY_MAP: Record<string, string> = {
  Chest:      'Legs or Back',
  Triceps:    'Back or Biceps',
  Shoulders:  'Legs or Core',
  Quads:      'Upper Body',
  Glutes:     'Upper Body',
  Hamstrings: 'Upper Body',
  Biceps:     'Chest or Back',
  Forearms:   'Legs or Core',
  Back:       'Chest or Legs',
  Core:       'Legs or Upper Body',
};

const FATIGUE_PER_SESSION = 20; // % added per workout

// ── Save session + update muscle fatigue ──────────────────────
export const saveWorkoutSession = async ({
  userId,
  exerciseKey,
  exerciseName,
  reps,
  postureScore,
  caloriesBurned,
}: {
  userId:          string;
  exerciseKey:     string;
  exerciseName:    string;
  reps:            number;
  postureScore:    number;
  caloriesBurned:  number;
}): Promise<string | null> => {
  // 1. Insert workout_sessions row (trigger handles daily_activity update)
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id:         userId,
      exercise_name:   exerciseName,
      reps,
      posture_score:   postureScore,
      calories_burned: caloriesBurned,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[BodyQ] workout_sessions insert:', error.message);
    return null;
  }

  // 2. Increase fatigue for every muscle targeted by this exercise
  const muscles = EXERCISE_MUSCLES[exerciseKey] ?? [];
  if (muscles.length && userId) {
    await Promise.allSettled(
      muscles.map(async (muscle) => {
        // Read current fatigue (upsert needs the current value to cap at 100)
        const { data: row } = await supabase
          .from('muscle_fatigue')
          .select('fatigue_pct')
          .eq('user_id', userId)
          .eq('muscle_name', muscle)
          .maybeSingle();

        const newPct = Math.min(100, (row?.fatigue_pct ?? 0) + FATIGUE_PER_SESSION);

        await supabase
          .from('muscle_fatigue')
          .upsert(
            { user_id: userId, muscle_name: muscle, fatigue_pct: newPct, last_updated: new Date().toISOString() },
            { onConflict: 'user_id,muscle_name' }
          );
      })
    );
  }

  return data?.id ?? null;
};

// ── Fetch all muscle fatigue for a user ───────────────────────
export const getMuscleFatigue = async (userId: string) => {
  const { data, error } = await supabase
    .from('muscle_fatigue')
    .select('muscle_name, fatigue_pct')
    .eq('user_id', userId)
    .order('fatigue_pct', { ascending: false });

  if (error) {
    console.warn('[BodyQ] muscle_fatigue fetch:', error.message);
    return [];
  }
  return (data ?? []) as { muscle_name: string; fatigue_pct: number }[];
};
