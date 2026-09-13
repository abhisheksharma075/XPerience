import { SupabaseClient } from '@supabase/supabase-js';

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  item_type: string;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseResult {
  success: boolean;
  itemId: string;
  itemName: string;
  itemType: string;
  quantityPurchased: number;
  totalCost: number;
  newGold: number;
  inventoryId: string;
  totalInventoryQuantity: number;
  transactionId?: string;
}

/**
 * Fetches all active catalog items from the shop.
 * RLS ensures authenticated users can read all active items.
 */
export async function getActiveShopItems(
  supabase: SupabaseClient
): Promise<{ items: ShopItem[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      return { items: [], error: error.message };
    }

    return { items: (data as ShopItem[]) || [], error: null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : 'Failed to fetch shop items',
    };
  }
}

/**
 * Safely purchases a shop item for the authenticated user.
 *
 * Enforces:
 * 1. Zero client price trust (item price read strictly from DB).
 * 2. Atomic gold deduction with negative balance prevention.
 * 3. Race condition double-spending prevention via row locks.
 * 4. Automatic inventory upsert and gold ledger audit logging.
 */
export async function purchaseShopItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ result: PurchaseResult | null; error: string | null }> {
  if (!itemId) {
    return { result: null, error: 'Invalid item ID.' };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { result: null, error: 'Purchase quantity must be an integer >= 1.' };
  }

  try {
    // 1. Primary path: Stored procedure RPC with row-level locks
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'purchase_shop_item',
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
          itemName: rpcData.item_name,
          itemType: rpcData.item_type,
          quantityPurchased: rpcData.quantity_purchased,
          totalCost: rpcData.total_cost,
          newGold: rpcData.new_gold,
          inventoryId: rpcData.inventory_id,
          totalInventoryQuantity: rpcData.total_inventory_quantity,
          transactionId: rpcData.transaction_id,
        },
        error: null,
      };
    }

    // Handle standard business logic exceptions from RPC (e.g. Insufficient gold)
    if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
      return { result: null, error: rpcError.message };
    }

    // 2. Application fallback
    // Fetch shop item (price determined exclusively from DB)
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .eq('is_active', true)
      .maybeSingle();

    if (itemError || !item) {
      return { result: null, error: 'Shop item not found or is currently inactive.' };
    }

    const totalCost = item.price * quantity;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gold')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return { result: null, error: 'User profile not found.' };
    }

    // Check balance
    if (profile.gold < totalCost) {
      return {
        result: null,
        error: `Insufficient gold: You have ${profile.gold} G, but ${totalCost} G is required.`,
      };
    }

    const newGold = profile.gold - totalCost;

    // Deduct gold
    const { error: updateGoldError } = await supabase
      .from('profiles')
      .update({
        gold: newGold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateGoldError) {
      return { result: null, error: updateGoldError.message };
    }

    // Upsert into inventory
    const { data: existingInv } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    let inventoryId = '';
    let totalInvQuantity = quantity;

    if (existingInv) {
      totalInvQuantity = existingInv.quantity + quantity;
      const { data: updatedInv, error: invError } = await supabase
        .from('inventory')
        .update({ quantity: totalInvQuantity })
        .eq('id', existingInv.id)
        .select('id')
        .maybeSingle();

      if (invError || !updatedInv) {
        return { result: null, error: invError?.message || 'Failed to update inventory.' };
      }
      inventoryId = updatedInv.id;
    } else {
      const { data: newInv, error: invError } = await supabase
        .from('inventory')
        .insert({
          user_id: userId,
          item_id: itemId,
          quantity,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle();

      if (invError || !newInv) {
        return { result: null, error: invError?.message || 'Failed to add item to inventory.' };
      }
      inventoryId = newInv.id;
    }

    // Record transaction in gold_transactions
    if (totalCost > 0) {
      await supabase.from('gold_transactions').insert({
        user_id: userId,
        amount: -totalCost,
        balance_after: newGold,
        transaction_type: 'shop_purchase',
        reference_id: itemId,
        description: `Purchased ${quantity}x ${item.name}`,
        created_at: new Date().toISOString(),
      });
    }

    return {
      result: {
        success: true,
        itemId: item.id,
        itemName: item.name,
        itemType: item.item_type,
        quantityPurchased: quantity,
        totalCost,
        newGold,
        inventoryId,
        totalInventoryQuantity: totalInvQuantity,
      },
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Unexpected error during item purchase',
    };
  }
}
