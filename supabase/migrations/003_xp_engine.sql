-- ==============================================================================
-- Migration: 003_xp_engine.sql
-- Description: Centralized XP Engine functions for XPerience RPG
-- ==============================================================================

-- 1. Function: add_xp
-- Atomically increments a user's XP without client-side calculation
CREATE OR REPLACE FUNCTION public.add_xp(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE (
  new_xp INTEGER,
  current_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent invalid non-positive or negative XP updates
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'XP amount to add must be a positive integer, received: %', p_amount;
  END IF;

  -- Ensure caller is modifying their own profile unless executing in service context
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot add XP to another player profile';
  END IF;

  RETURN QUERY
  UPDATE profiles
  SET
    xp = xp + p_amount,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING xp, level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', p_user_id;
  END IF;
END;
$$;

-- 2. Function: complete_quest_with_rewards
-- Completes an active quest, logs quest_completions, and awards XP & Gold atomically
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
  v_updated_profile RECORD;
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

  -- 3. Atomically award XP and Gold to user profile
  UPDATE profiles
  SET
    xp = xp + v_quest.xp_reward,
    gold = gold + v_quest.gold_reward,
    updated_at = now()
  WHERE id = v_user_id
  RETURNING xp, level, gold INTO v_updated_profile;

  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'quest_id', p_quest_id,
    'xp_earned', v_quest.xp_reward,
    'gold_earned', v_quest.gold_reward,
    'new_xp', v_updated_profile.xp,
    'new_gold', v_updated_profile.gold,
    'level', v_updated_profile.level
  );
END;
$$;
