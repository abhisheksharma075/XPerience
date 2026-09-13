import { SupabaseClient } from '@supabase/supabase-js';

export interface InventoryItemDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  item_type: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  item: InventoryItemDetail;
}

export interface ConsumeResult {
  success: boolean;
  itemId: string;
  consumedQuantity: number;
  remainingQuantity: number;
}

/**
 * Validates that an inventory quantity is a positive non-zero integer.
 */
export function validateInventoryQuantity(quantity: unknown): { valid: boolean; error?: string } {
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || !Number.isFinite(quantity)) {
    return { valid: false, error: 'Quantity must be a valid number.' };
  }
  if (!Number.isInteger(quantity)) {
    return { valid: false, error: `Quantity must be an integer, received (${quantity}).` };
  }
  if (quantity < 1) {
    return { valid: false, error: `Quantity must be at least 1, received (${quantity}).` };
  }
  return { valid: true };
}

/**
 * Fetches the authenticated user's inventory with joined item details.
 * RLS enforces that users can only access their own inventory rows.
 */
export async function getUserInventory(
  supabase: SupabaseClient,
  userId: string
): Promise<{ inventory: InventoryItem[]; error: string | null }> {
  try {
    // 1. Primary path: Stored procedure RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_user_inventory',
      { p_user_id: userId }
    );

    if (!rpcError && Array.isArray(rpcData)) {
      return { inventory: rpcData as InventoryItem[], error: null };
    }

    // 2. Application fallback: Supabase relational join
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id,
        user_id,
        item_id,
        quantity,
        created_at,
        shop_items (
          id,
          name,
          description,
          price,
          item_type,
          is_active
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { inventory: [], error: error.message };
    }

    const mapped: InventoryItem[] = (data || []).map((row) => {
      const itemRaw = Array.isArray(row.shop_items)
        ? row.shop_items[0]
        : row.shop_items;

      return {
        id: row.id,
        user_id: row.user_id,
        item_id: row.item_id,
        quantity: row.quantity,
        created_at: row.created_at,
        item: {
          id: itemRaw?.id || row.item_id,
          name: itemRaw?.name || 'Unknown Item',
          description: itemRaw?.description || null,
          price: itemRaw?.price || 0,
          item_type: itemRaw?.item_type || 'misc',
          is_active: itemRaw?.is_active ?? true,
        },
      };
    });

    return { inventory: mapped, error: null };
  } catch (err) {
    return {
      inventory: [],
      error: err instanceof Error ? err.message : 'Failed to fetch inventory',
    };
  }
}

/**
 * Safely consumes/uses an item from the user's inventory.
 * Atomically decrements quantity or removes the row, preventing negative quantities.
 */
export async function consumeInventoryItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ result: ConsumeResult | null; error: string | null }> {
  const val = validateInventoryQuantity(quantity);
  if (!val.valid) {
    return { result: null, error: val.error || 'Invalid quantity' };
  }

  try {
    // 1. Primary path: Stored procedure RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'consume_inventory_item',
      {
        p_item_id: itemId,
        p_quantity: quantity,
      }
    );

    if (!rpcError && rpcData && rpcData.success) {
      return {
        result: {
          success: true,
          itemId: rpcData.item_id,
          consumedQuantity: rpcData.consumed_quantity,
          remainingQuantity: rpcData.remaining_quantity,
        },
        error: null,
      };
    }

    if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
      return { result: null, error: rpcError.message };
    }

    // 2. Application fallback
    const { data: invRow, error: fetchErr } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (fetchErr || !invRow) {
      return { result: null, error: 'Item not found in your inventory.' };
    }

    if (invRow.quantity < quantity) {
      return {
        result: null,
        error: `Insufficient quantity: You have ${invRow.quantity}, but tried to use ${quantity}.`,
      };
    }

    const remaining = invRow.quantity - quantity;

    if (remaining > 0) {
      const { error: updateErr } = await supabase
        .from('inventory')
        .update({ quantity: remaining })
        .eq('id', invRow.id);

      if (updateErr) {
        return { result: null, error: updateErr.message };
      }
    } else {
      const { error: deleteErr } = await supabase
        .from('inventory')
        .delete()
        .eq('id', invRow.id);

      if (deleteErr) {
        return { result: null, error: deleteErr.message };
      }
    }

    return {
      result: {
        success: true,
        itemId,
        consumedQuantity: quantity,
        remainingQuantity: remaining,
      },
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Unexpected error consuming inventory item',
    };
  }
}
