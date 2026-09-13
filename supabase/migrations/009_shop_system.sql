-- ==============================================================================
-- Migration: 009_shop_system.sql
-- Description: Centralized Shop Purchase Engine for XPerience RPG
-- Features: Active item catalog, atomic purchases with row-level locking,
--           zero client price trust, negative gold prevention, inventory upsert,
--           and transaction ledger recording.
-- ==============================================================================

-- 1. SEED INITIAL ACTIVE SHOP ITEMS
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


-- 2. STORED PROCEDURE: purchase_shop_item
-- Atomically executes item purchase preventing race conditions and negative balances
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
  v_tx_id UUID;
BEGIN
  -- 1. Verify authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to purchase items';
  END IF;

  -- 2. Validate purchase quantity
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Purchase quantity must be at least 1, received: %', p_quantity;
  END IF;

  -- 3. Lock and verify shop item (active only, zero client price trust)
  SELECT * INTO v_item
  FROM shop_items
  WHERE id = p_item_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop item with ID % not found or is currently inactive', p_item_id;
  END IF;

  v_total_cost := v_item.price * p_quantity;

  -- 4. Lock user profile row to prevent race condition double-spending
  SELECT gold INTO v_current_gold
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile for user % not found', v_user_id;
  END IF;

  -- 5. Verify sufficient gold (strict negative balance prevention)
  IF v_current_gold < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient gold: You have % G, but % G is required for %x %',
      v_current_gold, v_total_cost, p_quantity, v_item.name;
  END IF;

  v_new_gold := v_current_gold - v_total_cost;

  -- 6. Authorize gold update and deduct balance atomically
  PERFORM set_config('xperience.allow_gold_update', 'true', true);

  UPDATE profiles
  SET
    gold = v_new_gold,
    updated_at = now()
  WHERE id = v_user_id;

  -- 7. Add purchased item to user's inventory (upsert)
  INSERT INTO inventory (user_id, item_id, quantity, created_at)
  VALUES (v_user_id, p_item_id, p_quantity, now())
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = inventory.quantity + p_quantity
  RETURNING id, quantity INTO v_inventory_id, v_new_quantity;

  -- 8. Record transaction in gold_transactions ledger
  IF v_total_cost > 0 THEN
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
    )
    RETURNING id INTO v_tx_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item.id,
    'item_name', v_item.name,
    'item_type', v_item.item_type,
    'quantity_purchased', p_quantity,
    'total_cost', v_total_cost,
    'new_gold', v_new_gold,
    'inventory_id', v_inventory_id,
    'total_inventory_quantity', v_new_quantity,
    'transaction_id', v_tx_id
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(UUID, INTEGER) TO authenticated, service_role;
