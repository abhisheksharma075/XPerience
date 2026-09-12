-- ==============================================================================
-- Migration: 006_streak_system.sql
-- Description: Centralized Quest Completion Streak System for XPerience RPG
-- Features: Consistent UTC calendar day evaluation, duplicate completion prevention,
--           missed day reset, longest_streak preservation, and tamper protection.
-- ==============================================================================

-- 1. Index on quest_completions for fast retrieval of user completion history
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_completed
  ON public.quest_completions(user_id, completed_at DESC);

-- 2. Pure helper function: calculate_new_streak
-- Computes the updated current_streak and longest_streak for a completion event
CREATE OR REPLACE FUNCTION public.calculate_new_streak(
  p_user_id UUID,
  p_completed_at TIMESTAMPTZ DEFAULT now(),
  p_timezone TEXT DEFAULT 'UTC',
  p_exclude_completion_id UUID DEFAULT NULL
)
RETURNS TABLE (
  new_current_streak INTEGER,
  new_longest_streak INTEGER,
  streak_incremented BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz TEXT;
  v_today DATE;
  v_last_completion_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_res_current INTEGER;
  v_res_longest INTEGER;
  v_incremented BOOLEAN;
BEGIN
  -- Normalize timezone fallback
  v_tz := COALESCE(NULLIF(trim(p_timezone), ''), 'UTC');
  v_today := (p_completed_at AT TIME ZONE v_tz)::date;

  -- Retrieve current profile streaks
  SELECT current_streak, longest_streak
  INTO v_current_streak, v_longest_streak
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    v_current_streak := 0;
    v_longest_streak := 0;
  END IF;

  -- Find the most recent quest completion date prior to this completion
  SELECT (completed_at AT TIME ZONE v_tz)::date
  INTO v_last_completion_date
  FROM quest_completions
  WHERE user_id = p_user_id
    AND (p_exclude_completion_id IS NULL OR id <> p_exclude_completion_id)
    AND completed_at <= p_completed_at
  ORDER BY completed_at DESC
  LIMIT 1;

  IF v_last_completion_date IS NULL THEN
    -- First completion ever
    v_res_current := 1;
    v_res_longest := GREATEST(v_longest_streak, 1);
    v_incremented := TRUE;
  ELSIF v_last_completion_date = v_today THEN
    -- Duplicate completion on the same calendar day: preserve streak without incrementing
    v_res_current := GREATEST(v_current_streak, 1);
    v_res_longest := GREATEST(v_longest_streak, v_res_current);
    v_incremented := FALSE;
  ELSIF v_last_completion_date = v_today - 1 THEN
    -- Consecutive calendar day: increment streak
    v_res_current := v_current_streak + 1;
    v_res_longest := GREATEST(v_longest_streak, v_res_current);
    v_incremented := TRUE;
  ELSE
    -- Missed at least one calendar day: reset streak to 1, preserve longest_streak
    v_res_current := 1;
    v_res_longest := GREATEST(v_longest_streak, 1);
    v_incremented := TRUE;
  END IF;

  RETURN QUERY SELECT v_res_current, v_res_longest, v_incremented;
END;
$$;

-- 3. Trigger to prevent direct arbitrary modification of current_streak or longest_streak
CREATE OR REPLACE FUNCTION public.protect_profile_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow updates originating from authorized internal procedures
  IF current_setting('xperience.allow_streak_update', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Block direct user modifications via client REST API
  IF auth.uid() IS NOT NULL THEN
    IF NEW.current_streak IS DISTINCT FROM OLD.current_streak THEN
      RAISE EXCEPTION 'Direct modification of current_streak is not permitted. Streaks can only be updated via quest completion.';
    END IF;
    IF NEW.longest_streak IS DISTINCT FROM OLD.longest_streak THEN
      RAISE EXCEPTION 'Direct modification of longest_streak is not permitted. Streaks can only be updated via quest completion.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_streaks ON profiles;
CREATE TRIGGER trg_protect_profile_streaks
  BEFORE UPDATE OF current_streak, longest_streak ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_streaks();

-- 4. Update complete_quest_with_rewards to atomically update streaks
CREATE OR REPLACE FUNCTION public.complete_quest_with_rewards(
  p_quest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_user_id UUID;
  v_completion_id UUID;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_updated_profile RECORD;
  v_streak_result RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to complete a quest';
  END IF;

  -- Lock and fetch the quest ensuring user ownership
  SELECT * INTO v_quest
  FROM quests
  WHERE id = p_quest_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found or does not belong to the active user';
  END IF;

  IF v_quest.status = 'completed' THEN
    RAISE EXCEPTION 'Quest is already completed';
  END IF;

  IF v_quest.status = 'archived' THEN
    RAISE EXCEPTION 'Archived quests cannot be completed';
  END IF;

  -- 1. Mark quest as completed
  UPDATE quests
  SET
    status = 'completed',
    updated_at = now()
  WHERE id = p_quest_id;

  -- 2. Record quest completion audit log
  INSERT INTO quest_completions (
    quest_id,
    user_id,
    xp_earned,
    gold_earned,
    completed_at
  ) VALUES (
    p_quest_id,
    v_user_id,
    v_quest.xp_reward,
    v_quest.gold_reward,
    now()
  )
  RETURNING id INTO v_completion_id;

  -- 3. Calculate new total XP and derived level
  SELECT xp + v_quest.xp_reward INTO v_new_xp
  FROM profiles
  WHERE id = v_user_id;

  v_new_level := public.calculate_level_from_xp(v_new_xp);

  -- 4. Calculate Streak Progression atomically
  SELECT * INTO v_streak_result
  FROM public.calculate_new_streak(v_user_id, now(), 'UTC', v_completion_id);

  -- Authorize streak update for trigger
  PERFORM set_config('xperience.allow_streak_update', 'true', true);

  -- 5. Atomically update profile with rewards, level, and streaks
  UPDATE profiles
  SET
    xp = v_new_xp,
    level = v_new_level,
    gold = gold + v_quest.gold_reward,
    current_streak = v_streak_result.new_current_streak,
    longest_streak = v_streak_result.new_longest_streak,
    updated_at = now()
  WHERE id = v_user_id
  RETURNING xp, level, gold, current_streak, longest_streak INTO v_updated_profile;

  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'quest_id', p_quest_id,
    'xp_earned', v_quest.xp_reward,
    'gold_earned', v_quest.gold_reward,
    'new_xp', v_updated_profile.xp,
    'new_gold', v_updated_profile.gold,
    'level', v_updated_profile.level,
    'current_streak', v_updated_profile.current_streak,
    'longest_streak', v_updated_profile.longest_streak,
    'streak_incremented', v_streak_result.streak_incremented
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.calculate_new_streak(UUID, TIMESTAMPTZ, TEXT, UUID) TO authenticated, service_role;
