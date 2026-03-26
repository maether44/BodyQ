-- ─────────────────────────────────────────────────────────────────────────────
-- BodyQ — Workout Metrics Migration
-- Run this once in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add calories_workout to daily_activity
--    (automatically filled by the trigger below after every workout save)
ALTER TABLE daily_activity
  ADD COLUMN IF NOT EXISTS calories_workout integer DEFAULT 0;

-- 2. Create muscle_fatigue table
CREATE TABLE IF NOT EXISTS muscle_fatigue (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  muscle_name  text        NOT NULL,
  fatigue_pct  integer     DEFAULT 0 CHECK (fatigue_pct BETWEEN 0 AND 100),
  last_updated timestamptz DEFAULT now(),
  UNIQUE (user_id, muscle_name)
);

ALTER TABLE muscle_fatigue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own muscle fatigue"
  ON muscle_fatigue FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Trigger function: when a row is inserted into workout_sessions,
--    accumulate calories_workout into daily_activity for that user/date.
CREATE OR REPLACE FUNCTION fn_workout_update_daily()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO daily_activity (user_id, date, calories_workout)
  VALUES (NEW.user_id, CURRENT_DATE, COALESCE(NEW.calories_burned, 0))
  ON CONFLICT (user_id, date) DO UPDATE
    SET calories_workout =
          daily_activity.calories_workout + COALESCE(NEW.calories_burned, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workout_daily ON workout_sessions;
CREATE TRIGGER trg_workout_daily
  AFTER INSERT ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_workout_update_daily();
