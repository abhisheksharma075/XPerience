-- ==============================================================================
-- Migration: 002_enable_rls.sql
-- Description: Row Level Security (RLS) policies for XPerience RPG application
-- Tables: profiles, quests, quest_completions, inventory, shop_items
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES RLS
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Authenticated users can read their own profile; cannot access other profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Authenticated users can update their own profile; cannot modify other profiles
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);


-- ------------------------------------------------------------------------------
-- 2. QUESTS RLS
-- ------------------------------------------------------------------------------
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own quests" ON quests;
DROP POLICY IF EXISTS "Users can create own quests" ON quests;
DROP POLICY IF EXISTS "Users can update own quests" ON quests;
DROP POLICY IF EXISTS "Users can delete own quests" ON quests;

-- Users can read only their own quests
CREATE POLICY "Users can read own quests"
  ON quests
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users can create quests only for themselves
CREATE POLICY "Users can create own quests"
  ON quests
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can update only their own quests
CREATE POLICY "Users can update own quests"
  ON quests
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can delete only their own quests
CREATE POLICY "Users can delete own quests"
  ON quests
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ------------------------------------------------------------------------------
-- 3. QUEST_COMPLETIONS RLS
-- ------------------------------------------------------------------------------
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own quest completions" ON quest_completions;
DROP POLICY IF EXISTS "Users can create own quest completions" ON quest_completions;

-- Users can read only their own completion history
CREATE POLICY "Users can read own quest completions"
  ON quest_completions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users can create completion records only for themselves and their own quests
CREATE POLICY "Users can create own quest completions"
  ON quest_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM quests
      WHERE quests.id = quest_completions.quest_id
        AND quests.user_id = (select auth.uid())
    )
  );


-- ------------------------------------------------------------------------------
-- 4. INVENTORY RLS
-- ------------------------------------------------------------------------------
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory;

-- Users can read only their own inventory items
CREATE POLICY "Users can read own inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users can insert items only into their own inventory
CREATE POLICY "Users can insert own inventory"
  ON inventory
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can update only their own inventory
CREATE POLICY "Users can update own inventory"
  ON inventory
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can delete only from their own inventory
CREATE POLICY "Users can delete own inventory"
  ON inventory
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ------------------------------------------------------------------------------
-- 5. SHOP_ITEMS RLS
-- ------------------------------------------------------------------------------
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can read active shop items" ON shop_items;

-- Authenticated users can read active shop items
CREATE POLICY "Authenticated users can read active shop items"
  ON shop_items
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Note: No INSERT, UPDATE, or DELETE policies are granted to authenticated or anon roles.
-- This ensures normal users cannot arbitrarily create, modify, or delete shop items.
