import { SupabaseClient } from '@supabase/supabase-js';

export type GoldTransactionType =
  | 'quest_reward'
  | 'bonus'
  | 'shop_purchase'
  | 'adjustment';

export interface GoldTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: GoldTransactionType;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface AwardGoldInput {
  amount: number;
  transactionType?: GoldTransactionType;
  referenceId?: string | null;
  description?: string | null;
}

export interface DeductGoldInput {
  amount: number;
  transactionType?: GoldTransactionType;
  referenceId?: string | null;
  description?: string | null;
}

export interface GoldOperationResult {
  userId: string;
  amount: number;
  previousGold?: number;
  newGold: number;
  transactionId?: string;
}

/**
 * Validates that a gold transaction amount is a positive non-zero integer.
 */
export function validateGoldAmount(amount: unknown): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return { valid: false, error: 'Gold amount must be a valid number.' };
  }
  if (!Number.isInteger(amount)) {
    return { valid: false, error: `Gold amount must be an integer, received (${amount}).` };
  }
  if (amount <= 0) {
    return { valid: false, error: `Gold amount must be greater than zero, received (${amount}).` };
  }
  return { valid: true };
}

/**
 * Retrieves the current gold balance for a user profile.
 */
export async function getGoldBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<{ gold: number; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('gold')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { gold: 0, error: error.message };
    }
    if (!data) {
      return { gold: 0, error: 'Profile not found.' };
    }

    return { gold: data.gold, error: null };
  } catch (err) {
    return {
      gold: 0,
      error: err instanceof Error ? err.message : 'Failed to fetch gold balance',
    };
  }
}

/**
 * Safely awards gold to a user's character profile and logs an immutable audit transaction.
 */
export async function awardGold(
  supabase: SupabaseClient,
  userId: string,
  input: AwardGoldInput
): Promise<{ result: GoldOperationResult | null; error: string | null }> {
  const validation = validateGoldAmount(input.amount);
  if (!validation.valid) {
    return { result: null, error: validation.error || 'Invalid gold amount' };
  }

  const txType = input.transactionType || 'bonus';

  try {
    // 1. Try atomic database stored procedure RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('award_gold', {
      p_user_id: userId,
      p_amount: input.amount,
      p_transaction_type: txType,
      p_reference_id: input.referenceId || null,
      p_description: input.description || 'Awarded gold',
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return {
        result: {
          userId,
          amount: input.amount,
          newGold: rpcData[0].new_gold,
          transactionId: rpcData[0].transaction_id,
        },
        error: null,
      };
    }

    // 2. Application fallback
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('gold')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return { result: null, error: profileErr?.message || 'Profile not found' };
    }

    const newGold = profile.gold + input.amount;

    const { data: updatedProfile, error: updateErr } = await supabase
      .from('profiles')
      .update({
        gold: newGold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('gold')
      .maybeSingle();

    if (updateErr || !updatedProfile) {
      return { result: null, error: updateErr?.message || 'Failed to update gold balance' };
    }

    // Insert transaction log
    const { data: tx, error: txErr } = await supabase
      .from('gold_transactions')
      .insert({
        user_id: userId,
        amount: input.amount,
        balance_after: newGold,
        transaction_type: txType,
        reference_id: input.referenceId || null,
        description: input.description || 'Awarded gold',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (txErr) {
      console.warn('Could not record gold transaction log:', txErr.message);
    }

    return {
      result: {
        userId,
        amount: input.amount,
        previousGold: profile.gold,
        newGold: updatedProfile.gold,
        transactionId: tx?.id,
      },
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Unexpected error awarding gold',
    };
  }
}

/**
 * Safely deducts gold from a user's character profile.
 * Verifies sufficient balance and strictly prevents negative balances.
 * Prepared for Shop purchases in STEP 18.
 */
export async function deductGold(
  supabase: SupabaseClient,
  userId: string,
  input: DeductGoldInput
): Promise<{ result: GoldOperationResult | null; error: string | null }> {
  const validation = validateGoldAmount(input.amount);
  if (!validation.valid) {
    return { result: null, error: validation.error || 'Invalid gold amount' };
  }

  const txType = input.transactionType || 'shop_purchase';

  try {
    // 1. Try atomic database stored procedure RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_gold', {
      p_user_id: userId,
      p_amount: input.amount,
      p_transaction_type: txType,
      p_reference_id: input.referenceId || null,
      p_description: input.description || 'Deducted gold',
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return {
        result: {
          userId,
          amount: input.amount,
          newGold: rpcData[0].new_gold,
          transactionId: rpcData[0].transaction_id,
        },
        error: null,
      };
    }

    if (rpcError && rpcError.message.includes('Insufficient gold')) {
      return { result: null, error: rpcError.message };
    }

    // 2. Application fallback
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('gold')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return { result: null, error: profileErr?.message || 'Profile not found' };
    }

    if (profile.gold < input.amount) {
      return {
        result: null,
        error: `Insufficient gold: current balance is ${profile.gold} G, but required is ${input.amount} G.`,
      };
    }

    const newGold = profile.gold - input.amount;

    const { data: updatedProfile, error: updateErr } = await supabase
      .from('profiles')
      .update({
        gold: newGold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('gold')
      .maybeSingle();

    if (updateErr || !updatedProfile) {
      return { result: null, error: updateErr?.message || 'Failed to deduct gold balance' };
    }

    // Insert transaction log
    const { data: tx, error: txErr } = await supabase
      .from('gold_transactions')
      .insert({
        user_id: userId,
        amount: -input.amount,
        balance_after: newGold,
        transaction_type: txType,
        reference_id: input.referenceId || null,
        description: input.description || 'Deducted gold',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (txErr) {
      console.warn('Could not record gold transaction log:', txErr.message);
    }

    return {
      result: {
        userId,
        amount: input.amount,
        previousGold: profile.gold,
        newGold: updatedProfile.gold,
        transactionId: tx?.id,
      },
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Unexpected error deducting gold',
    };
  }
}

/**
 * Fetches recent gold transaction history for an authenticated user.
 */
export async function getGoldTransactions(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<{ transactions: GoldTransaction[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('gold_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { transactions: [], error: error.message };
    }

    return { transactions: (data as GoldTransaction[]) || [], error: null };
  } catch (err) {
    return {
      transactions: [],
      error: err instanceof Error ? err.message : 'Failed to fetch gold transactions',
    };
  }
}
