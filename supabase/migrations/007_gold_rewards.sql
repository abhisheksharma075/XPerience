-- ==============================================================================
-- Migration: 007_gold_rewards.sql
-- Description: Centralized Gold and Rewards System for XPerience RPG
-- Features: Negative balance prevention, audit transactions ledger,
--           tamper protection, and shop preparation.
-- ==============================================================================

-- 1. GOLD_TRANSACTIONS TABLE
-- Immutable audit log for all gold earnings and expenditures
CREATE TABLE IF NOT EXISTS public.gold_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('quest_reward', 'bonus', 'shop_purchase', 'adjustment')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_id
  ON public.gold_transactions(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read only their own gold transactions
DROP POLICY IF EXISTS "Users can read own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can read own gold transactions"
  ON public.gold_transactions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2. TRIGGER: Protect profiles.gold from direct client manipulation
CREATE OR REPLACE FUNCTION public.protect_profile_gold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow internal security definer procedures
  IF current_setting('xperience.allow_gold_update', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Block direct user modifications via client REST API
  IF auth.uid() IS NOT NULL THEN
    IF NEW.gold IS DISTINCT FROM OLD.gold THEN
      RAISE EXCEPTION 'Direct modification of gold balance is not permitted. Gold must be updated through authorized game mechanics.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_gold ON public.profiles;
CREATE TRIGGER trg_protect_profile_gold
  BEFORE UPDATE OF gold ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_gold();

-- 3. STORED PROCEDURE: award_gold
-- Safely increments user gold balance and records transaction
CREATE OR REPLACE FUNCTION public.award_gold(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'bonus',
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  new_gold INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_gold INTEGER;
  v_new_gold INTEGER;
  v_tx_id UUID;
BEGIN
  -- Enforce caller isolation
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot modify gold of another player';
  END IF;

  -- Validate positive amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Gold amount to award must be a positive integer, received: %', p_amount;
  END IF;

  IF p_transaction_type NOT IN ('quest_reward', 'bonus', 'shop_purchase', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  -- Lock profile row
  SELECT gold INTO v_current_gold
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', p_user_id;
  END IF;

  v_new_gold := v_current_gold + p_amount;

  -- Authorize gold update for trigger
  PERFORM set_config('xperience.allow_gold_update', 'true', true);

  UPDATE profiles
  SET
    gold = v_new_gold,
    updated_at = now()
  WHERE id = p_user_id;

  -- Record audit transaction
  INSERT INTO gold_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reference_id,
    description,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_gold,
    p_transaction_type,
    p_reference_id,
    COALESCE(p_description, 'Awarded gold'),
    now()
  )
  RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT v_new_gold, v_tx_id;
END;
$$;

-- 4. STORED PROCEDURE: deduct_gold (Shop Preparation)
-- Safely deducts gold verifying sufficient balance, preventing negative balances
CREATE OR REPLACE FUNCTION public.deduct_gold(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'shop_purchase',
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  new_gold INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_gold INTEGER;
  v_new_gold INTEGER;
  v_tx_id UUID;
BEGIN
  -- Enforce caller isolation
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot deduct gold of another player';
  END IF;

  -- Validate positive amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Gold amount to deduct must be a positive integer, received: %', p_amount;
  END IF;

  -- Lock profile row
  SELECT gold INTO v_current_gold
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', p_user_id;
  END IF;

  -- Strict negative balance check
  IF v_current_gold < p_amount THEN
    RAISE EXCEPTION 'Insufficient gold: current balance is %, required is %', v_current_gold, p_amount;
  END IF;

  v_new_gold := v_current_gold - p_amount;

  -- Authorize gold update for trigger
  PERFORM set_config('xperience.allow_gold_update', 'true', true);

  UPDATE profiles
  SET
    gold = v_new_gold,
    updated_at = now()
  WHERE id = p_user_id;

  -- Record audit transaction (negative amount for debit)
  INSERT INTO gold_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reference_id,
    description,
    created_at
  ) VALUES (
    p_user_id,
    -p_amount,
    v_new_gold,
    p_transaction_type,
    p_reference_id,
    COALESCE(p_description, 'Deducted gold'),
    now()
  )
  RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT v_new_gold, v_tx_id;
END;
$$;

-- 5. UPDATE: complete_quest_with_rewards
-- Log gold transaction and authorize gold update during quest completion
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

  -- Authorize updates for protected fields
  PERFORM set_config('xperience.allow_streak_update', 'true', true);
  PERFORM set_config('xperience.allow_gold_update', 'true', true);

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

  -- 6. Record in gold_transactions if gold was earned
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
      v_updated_profile.gold,
      'quest_reward',
      p_quest_id,
      'Quest reward: ' || v_quest.title,
      now()
    );
  END IF;

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
GRANT EXECUTE ON FUNCTION public.award_gold(UUID, INTEGER, TEXT, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_gold(UUID, INTEGER, TEXT, UUID, TEXT) TO authenticated, service_role;
