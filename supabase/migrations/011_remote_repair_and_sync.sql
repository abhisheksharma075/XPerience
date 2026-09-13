-- ==============================================================================
-- Migration: 011_remote_repair_and_sync.sql
-- Description: Master Repair & Synchronization for Remote Supabase Database
--
-- THIS SQL MUST BE APPLIED TO THE REMOTE SUPABASE PROJECT:
-- Project URL: https://cpiwxptybnmesdpapnrc.supabase.co
-- SQL Editor: https://supabase.com/dashboard/project/cpiwxptybnmesdpapnrc/sql
--
-- Fixes:
--   1. Enables RLS and creates proper permissive policies for authenticated users
--      on profiles, quests, quest_completions, inventory, shop_items, and gold_transactions.
--   2. Resolves 'new row violates row-level security policy for table quests'.
--   3. Resolves 'new row violates row-level security policy for table profiles'
--      and 'Character profile not found'.
--   4. Installs the automatic handle_new_user() trigger on auth.users.
--   5. Backfills profiles for all existing auth.users accounts lacking a row.
--   6. Seeds the active shop catalog.
--   7. Deploys complete_quest_engine, purchase_shop_item, get_user_inventory,
--      level calculation, and streak calculation stored procedures.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: TABLES AND MISSING COLUMNS
-- ------------------------------------------------------------------------------

-- Ensure gold_transactions audit table exists
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

CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_id
  ON public.gold_transactions(user_id, created_at DESC);

-- Ensure inventory unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_user_item_unique'
  ) THEN
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_user_item_unique UNIQUE (user_id, item_id);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END;
$$;


-- ------------------------------------------------------------------------------
-- STEP 2: ROW LEVEL SECURITY & PERMISSIVE POLICIES
-- ------------------------------------------------------------------------------

-- 2.1 PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- 2.2 QUESTS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quests" ON public.quests;
DROP POLICY IF EXISTS "Users can create own quests" ON public.quests;
DROP POLICY IF EXISTS "Users can update own quests" ON public.quests;
DROP POLICY IF EXISTS "Users can delete own quests" ON public.quests;
DROP POLICY IF EXISTS "Allow authenticated quest select" ON public.quests;
DROP POLICY IF EXISTS "Allow authenticated quest insert" ON public.quests;

CREATE POLICY "Users can read own quests"
  ON public.quests
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own quests"
  ON public.quests
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own quests"
  ON public.quests
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own quests"
  ON public.quests
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2.3 QUEST_COMPLETIONS
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quest completions" ON public.quest_completions;
DROP POLICY IF EXISTS "Users can create own quest completions" ON public.quest_completions;

CREATE POLICY "Users can read own quest completions"
  ON public.quest_completions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own quest completions"
  ON public.quest_completions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- 2.4 INVENTORY
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;

CREATE POLICY "Users can read own inventory"
  ON public.inventory
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own inventory"
  ON public.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.inventory
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2.5 SHOP_ITEMS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read active shop items" ON public.shop_items;
DROP POLICY IF EXISTS "Anyone can read active shop items" ON public.shop_items;

CREATE POLICY "Anyone can read active shop items"
  ON public.shop_items
  FOR SELECT
  USING (is_active = true);

-- 2.6 GOLD_TRANSACTIONS
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own gold transactions" ON public.gold_transactions;

CREATE POLICY "Users can read own gold transactions"
  ON public.gold_transactions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ------------------------------------------------------------------------------
-- STEP 3: PROFILE AUTO-CREATION TRIGGER ON AUTH.USERS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_username TEXT;
  default_display_name TEXT;
BEGIN
  default_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(COALESCE(NEW.email, 'player'), '@', 1) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6)
  );

  default_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(COALESCE(NEW.email, 'Player'), '@', 1)
  );

  BEGIN
    INSERT INTO public.profiles (
      id,
      username,
      display_name,
      avatar_url,
      xp,
      level,
      gold,
      strength,
      intelligence,
      discipline,
      vitality,
      current_streak,
      longest_streak,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      default_username,
      default_display_name,
      NEW.raw_user_meta_data->>'avatar_url',
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      0,
      0,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN unique_violation THEN
      default_username := default_username || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      INSERT INTO public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        xp,
        level,
        gold,
        strength,
        intelligence,
        discipline,
        vitality,
        current_streak,
        longest_streak,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        default_username,
        default_display_name,
        NEW.raw_user_meta_data->>'avatar_url',
        0,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------------------------
-- STEP 4: RETROACTIVELY BACKFILL MISSING PROFILES FOR EXISTING USERS
-- ------------------------------------------------------------------------------

INSERT INTO public.profiles (
  id,
  username,
  display_name,
  avatar_url,
  xp,
  level,
  gold,
  strength,
  intelligence,
  discipline,
  vitality,
  current_streak,
  longest_streak,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    split_part(COALESCE(u.email, 'player'), '@', 1) || '_' || substr(replace(u.id::text, '-', ''), 1, 6)
  ),
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    split_part(COALESCE(u.email, 'Player'), '@', 1)
  ),
  u.raw_user_meta_data->>'avatar_url',
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  0,
  0,
  now(),
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- STEP 5: SEED ACTIVE SHOP ITEMS CATALOG
-- ------------------------------------------------------------------------------

INSERT INTO public.shop_items (name, description, price, item_type, is_active)
SELECT 'Elixir of Clarity', 'Restores mental clarity and focus for deep work sessions.', 25, 'consumable', true
WHERE NOT EXISTS (SELECT 1 FROM public.shop_items WHERE name = 'Elixir of Clarity');

INSERT INTO public.shop_items (name, description, price, item_type, is_active)
SELECT 'Tome of Ancient Wisdom', 'A mysterious tome filled with insights on accelerated learning.', 75, 'scroll', true
WHERE NOT EXISTS (SELECT 1 FROM public.shop_items WHERE name = 'Tome of Ancient Wisdom');

INSERT INTO public.shop_items (name, description, price, item_type, is_active)
SELECT 'Iron Dumbbell of Might', 'Forged in the fires of discipline; grants steadfast physical determination.', 100, 'equipment', true
WHERE NOT EXISTS (SELECT 1 FROM public.shop_items WHERE name = 'Iron Dumbbell of Might');

INSERT INTO public.shop_items (name, description, price, item_type, is_active)
SELECT 'Ring of Vitality', 'A ruby-crested ring radiating warmth, health, and physical endurance.', 150, 'accessory', true
WHERE NOT EXISTS (SELECT 1 FROM public.shop_items WHERE name = 'Ring of Vitality');

INSERT INTO public.shop_items (name, description, price, item_type, is_active)
SELECT 'Golden Adventurer Cloak', 'A shimmering golden cloak worn by distinguished master questers.', 300, 'vanity', true
WHERE NOT EXISTS (SELECT 1 FROM public.shop_items WHERE name = 'Golden Adventurer Cloak');


-- ------------------------------------------------------------------------------
-- STEP 6: CORE RPG FORMULAS & STORED PROCEDURES
-- ------------------------------------------------------------------------------

-- 6.1 Level Calculation Formula: TotalXP(L) = 50 * (L - 1)^2 + 50 * (L - 1)
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_xp IS NULL OR p_xp < 100 THEN 1
    ELSE 1 + FLOOR((-1.0 + SQRT(1.0 + 0.08 * p_xp)) / 2.0)::INTEGER
  END;
$$;

-- 6.2 XP Increment Procedure
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
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'XP amount to add must be a positive integer, received: %', p_amount;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot add XP to another player profile';
  END IF;

  SELECT xp + p_amount INTO v_new_xp
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', p_user_id;
  END IF;

  v_new_level := public.calculate_level_from_xp(v_new_xp);

  RETURN QUERY
  UPDATE profiles
  SET
    xp = v_new_xp,
    level = v_new_level,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING xp, level;
END;
$$;

-- 6.3 Deterministic Streak Calculation Procedure
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
  v_tz := COALESCE(NULLIF(trim(p_timezone), ''), 'UTC');
  v_today := (p_completed_at AT TIME ZONE v_tz)::date;

  SELECT current_streak, longest_streak
  INTO v_current_streak, v_longest_streak
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    v_current_streak := 0;
    v_longest_streak := 0;
  END IF;

  SELECT (completed_at AT TIME ZONE v_tz)::date
  INTO v_last_completion_date
  FROM quest_completions
  WHERE user_id = p_user_id
    AND (p_exclude_completion_id IS NULL OR id <> p_exclude_completion_id)
    AND completed_at <= p_completed_at
  ORDER BY completed_at DESC
  LIMIT 1;

  IF v_last_completion_date IS NULL THEN
    v_res_current := 1;
    v_res_longest := GREATEST(v_longest_streak, 1);
    v_incremented := TRUE;
  ELSIF v_last_completion_date = v_today THEN
    v_res_current := GREATEST(v_current_streak, 1);
    v_res_longest := GREATEST(v_longest_streak, v_res_current);
    v_incremented := FALSE;
  ELSIF v_last_completion_date = v_today - 1 THEN
    v_res_current := v_current_streak + 1;
    v_res_longest := GREATEST(v_longest_streak, v_res_current);
    v_incremented := TRUE;
  ELSE
    v_res_current := 1;
    v_res_longest := GREATEST(v_longest_streak, 1);
    v_incremented := TRUE;
  END IF;

  RETURN QUERY SELECT v_res_current, v_res_longest, v_incremented;
END;
$$;

-- 6.4 Atomic Quest Completion Engine
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to complete a quest';
  END IF;

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

  IF v_quest.status = 'completed' THEN
    RAISE EXCEPTION 'Quest % is already completed', p_quest_id;
  END IF;

  IF v_quest.status = 'archived' THEN
    RAISE EXCEPTION 'Archived quests cannot be completed';
  END IF;

  IF v_quest.status <> 'active' THEN
    RAISE EXCEPTION 'Quest % is not in an active state (current status: %)', p_quest_id, v_quest.status;
  END IF;

  v_tz := COALESCE(NULLIF(trim(p_timezone), ''), 'UTC');
  v_today := (now() AT TIME ZONE v_tz)::date;

  SELECT id INTO v_existing_completion
  FROM quest_completions
  WHERE quest_id = p_quest_id
    AND (completed_at AT TIME ZONE v_tz)::date = v_today
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Duplicate completion: Quest % has already been completed for today (%)', p_quest_id, v_today;
  END IF;

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

  UPDATE quests
  SET
    status = 'completed',
    updated_at = now()
  WHERE id = p_quest_id;

  SELECT xp + v_quest.xp_reward, gold + v_quest.gold_reward
  INTO v_new_xp, v_new_gold
  FROM profiles
  WHERE id = v_user_id;

  v_new_level := public.calculate_level_from_xp(v_new_xp);

  SELECT * INTO v_streak_result
  FROM public.calculate_new_streak(v_user_id, now(), v_tz, v_completion_id);

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

-- Backwards-compatible wrapper
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

-- 6.5 Shop Purchase Stored Procedure
CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_item_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_item RECORD;
  v_current_gold INTEGER;
  v_total_cost INTEGER;
  v_new_gold INTEGER;
  v_inventory_id UUID;
  v_new_quantity INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to purchase items';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Purchase quantity must be at least 1, received: %', p_quantity;
  END IF;

  SELECT * INTO v_item
  FROM shop_items
  WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or is currently unavailable in the shop';
  END IF;

  v_total_cost := v_item.price * p_quantity;

  SELECT gold INTO v_current_gold
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile for player % not found', v_user_id;
  END IF;

  IF v_current_gold < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient gold: Item costs % gold (quantity %), but player only has % gold',
      v_total_cost, p_quantity, v_current_gold;
  END IF;

  v_new_gold := v_current_gold - v_total_cost;
  UPDATE profiles
  SET gold = v_new_gold, updated_at = now()
  WHERE id = v_user_id;

  INSERT INTO inventory (user_id, item_id, quantity, created_at)
  VALUES (v_user_id, p_item_id, p_quantity, now())
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity
  RETURNING id, quantity INTO v_inventory_id, v_new_quantity;

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
    -v_total_cost,
    v_new_gold,
    'shop_purchase',
    p_item_id,
    'Purchased ' || p_quantity || 'x ' || v_item.name,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'item_name', v_item.name,
    'quantity_purchased', p_quantity,
    'total_quantity_owned', v_new_quantity,
    'cost', v_total_cost,
    'remaining_gold', v_new_gold
  );
END;
$$;

-- 6.6 Inventory Fetch Procedure
CREATE OR REPLACE FUNCTION public.get_user_inventory(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_inventory JSONB;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NOT NULL AND v_caller <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot access inventory of another player';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'user_id', i.user_id,
        'item_id', i.item_id,
        'quantity', i.quantity,
        'created_at', i.created_at,
        'item', jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'description', s.description,
          'price', s.price,
          'item_type', s.item_type,
          'is_active', s.is_active
        )
      )
    ),
    '[]'::jsonb
  ) INTO v_inventory
  FROM inventory i
  JOIN shop_items s ON s.id = i.item_id
  WHERE i.user_id = p_user_id;

  RETURN v_inventory;
END;
$$;


-- ------------------------------------------------------------------------------
-- STEP 7: GRANTS & PERMISSIONS
-- ------------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.calculate_level_from_xp(INTEGER) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.add_xp(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_new_streak(UUID, TIMESTAMPTZ, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_quest_engine(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_quest_with_rewards(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_inventory(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
