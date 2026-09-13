-- ==============================================================================
-- Migration: 008_quest_completion_engine.sql
-- Description: Unified Server-Side Quest Completion Engine for XPerience RPG
-- Workflow Steps:
--   1. Verify authenticated user
--   2. Verify quest ownership (with FOR UPDATE lock)
--   3. Verify quest is completable (status = 'active')
--   4. Prevent duplicate completion for same intended completion period
--   5. Create quest completion record
--   6. Award XP safely
--   7. Recalculate level non-linearly
--   8. Award gold & log to ledger
--   9. Update streak deterministically
--  10. Return complete updated character state
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.complete_quest_engine(
  p_quest_id UUID,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_quest RECORD;
  v_tz TEXT;
  v_today DATE;
  v_existing_completion RECORD;
  v_completion_id UUID;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_new_gold INTEGER;
  v_streak_result RECORD;
  v_updated_profile RECORD;
BEGIN
  -- 1. Verify the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to complete a quest';
  END IF;

  -- 2. Verify the quest belongs to that user (with row-level lock)
  SELECT * INTO v_quest
  FROM quests
  WHERE id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest with ID % not found', p_quest_id;
  END IF;

  IF v_quest.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Access denied: Quest % does not belong to the authenticated user', p_quest_id;
  END IF;

  -- 3. Verify the quest is completable
  IF v_quest.status = 'completed' THEN
    RAISE EXCEPTION 'Quest % is already completed', p_quest_id;
  END IF;

  IF v_quest.status = 'archived' THEN
    RAISE EXCEPTION 'Archived quests cannot be completed';
  END IF;

  IF v_quest.status <> 'active' THEN
    RAISE EXCEPTION 'Quest % is not in an active state (current status: %)', p_quest_id, v_quest.status;
  END IF;

  -- Timezone resolution
  v_tz := COALESCE(NULLIF(trim(p_timezone), ''), 'UTC');
  v_today := (now() AT TIME ZONE v_tz)::date;

  -- 4. Prevent duplicate completion for the same intended completion period
  SELECT id INTO v_existing_completion
  FROM quest_completions
  WHERE quest_id = p_quest_id
    AND (completed_at AT TIME ZONE v_tz)::date = v_today
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Duplicate completion: Quest % has already been completed for today (%)', p_quest_id, v_today;
  END IF;

  -- 5. Create quest completion record using database-stored rewards
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

  -- Mark quest as completed
  UPDATE quests
  SET
    status = 'completed',
    updated_at = now()
  WHERE id = p_quest_id;

  -- 6. Award XP & 8. Award Gold (compute values)
  SELECT xp + v_quest.xp_reward, gold + v_quest.gold_reward
  INTO v_new_xp, v_new_gold
  FROM profiles
  WHERE id = v_user_id;

  -- 7. Recalculate level non-linearly
  v_new_level := public.calculate_level_from_xp(v_new_xp);

  -- 9. Update streak deterministically
  SELECT * INTO v_streak_result
  FROM public.calculate_new_streak(v_user_id, now(), v_tz, v_completion_id);

  -- Authorize system updates for protected profile fields
  PERFORM set_config('xperience.allow_streak_update', 'true', true);
  PERFORM set_config('xperience.allow_gold_update', 'true', true);

  UPDATE profiles
  SET
    xp = v_new_xp,
    level = v_new_level,
    gold = v_new_gold,
    current_streak = v_streak_result.new_current_streak,
    longest_streak = v_streak_result.new_longest_streak,
    updated_at = now()
  WHERE id = v_user_id
  RETURNING
    id, xp, level, gold, current_streak, longest_streak,
    strength, intelligence, discipline, vitality
  INTO v_updated_profile;

  -- Log gold transaction if gold was earned
  IF v_quest.gold_reward > 0 THEN
    INSERT INTO gold_transactions (
      user_id,
      amount,
      balance_after,
      transaction_type,
      reference_id,
      description,
      created_at
    ) VALUES (
      v_user_id,
      v_quest.gold_reward,
      v_new_gold,
      'quest_reward',
      p_quest_id,
      'Completed quest: ' || v_quest.title,
      now()
    );
  END IF;

  -- 10. Return the complete updated character state
  RETURN jsonb_build_object(
    'success', true,
    'quest_id', p_quest_id,
    'completion_id', v_completion_id,
    'xp_earned', v_quest.xp_reward,
    'gold_earned', v_quest.gold_reward,
    'streak_incremented', v_streak_result.streak_incremented,
    'completed_at', now(),
    'character_state', jsonb_build_object(
      'id', v_updated_profile.id,
      'xp', v_updated_profile.xp,
      'level', v_updated_profile.level,
      'gold', v_updated_profile.gold,
      'current_streak', v_updated_profile.current_streak,
      'longest_streak', v_updated_profile.longest_streak,
      'strength', v_updated_profile.strength,
      'intelligence', v_updated_profile.intelligence,
      'discipline', v_updated_profile.discipline,
      'vitality', v_updated_profile.vitality
    )
  );
END;
$$;

-- Backwards-compatible wrapper for complete_quest_with_rewards
CREATE OR REPLACE FUNCTION public.complete_quest_with_rewards(
  p_quest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res JSONB;
BEGIN
  v_res := public.complete_quest_engine(p_quest_id, 'UTC');

  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_res->>'completion_id',
    'quest_id', p_quest_id,
    'xp_earned', (v_res->>'xp_earned')::INTEGER,
    'gold_earned', (v_res->>'gold_earned')::INTEGER,
    'new_xp', (v_res->'character_state'->>'xp')::INTEGER,
    'new_gold', (v_res->'character_state'->>'gold')::INTEGER,
    'level', (v_res->'character_state'->>'level')::INTEGER,
    'current_streak', (v_res->'character_state'->>'current_streak')::INTEGER,
    'longest_streak', (v_res->'character_state'->>'longest_streak')::INTEGER,
    'streak_incremented', (v_res->>'streak_incremented')::BOOLEAN,
    'character_state', v_res->'character_state'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_quest_engine(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_quest_with_rewards(UUID) TO authenticated, service_role;
