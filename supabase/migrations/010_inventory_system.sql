-- ==============================================================================
-- Migration: 010_inventory_system.sql
-- Description: Centralized Inventory Logic for XPerience RPG
-- Features: User inventory retrieval with joined item metadata,
--           atomic quantity consumption, negative quantity prevention,
--           and strict caller ownership verification.
-- ==============================================================================

-- 1. STORED PROCEDURE: get_user_inventory
-- Fetches user inventory joined with shop item details under RLS / caller isolation
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
      ) ORDER BY i.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_inventory
  FROM inventory i
  JOIN shop_items s ON s.id = i.item_id
  WHERE i.user_id = p_user_id;

  RETURN v_inventory;
END;
$$;

-- 2. STORED PROCEDURE: consume_inventory_item
-- Atomically decrements or removes an inventory item, preventing negative quantities
CREATE OR REPLACE FUNCTION public.consume_inventory_item(
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
  v_inv RECORD;
  v_remaining_quantity INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be authenticated to use inventory items';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity to consume must be at least 1, received: %', p_quantity;
  END IF;

  -- Lock inventory row
  SELECT * INTO v_inv
  FROM inventory
  WHERE user_id = v_user_id AND item_id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found in inventory';
  END IF;

  IF v_inv.quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient quantity: You have % in inventory, but tried to use %',
      v_inv.quantity, p_quantity;
  END IF;

  v_remaining_quantity := v_inv.quantity - p_quantity;

  IF v_remaining_quantity > 0 THEN
    UPDATE inventory
    SET quantity = v_remaining_quantity
    WHERE id = v_inv.id;
  ELSE
    DELETE FROM inventory
    WHERE id = v_inv.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'consumed_quantity', p_quantity,
    'remaining_quantity', v_remaining_quantity
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_user_inventory(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_inventory_item(UUID, INTEGER) TO authenticated, service_role;
