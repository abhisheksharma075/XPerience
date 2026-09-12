import { SupabaseClient } from '@supabase/supabase-js';
import {
  calculateLevelFromXP,
  calculateXPRequiredForLevel,
  calculateLevelProgress,
  type LevelProgress,
} from './levelSystem';

import {
  calculateStreakProgression,
} from './streaks';
import {
  completeQuestWorkflow,
  type CharacterState,
  type QuestCompletionResult,
} from './questCompletionEngine';

export {
  calculateLevelFromXP,
  calculateXPRequiredForLevel,
  calculateLevelProgress,
  calculateStreakProgression,
  completeQuestWorkflow,
  type LevelProgress,
  type CharacterState,
  type QuestCompletionResult,
};

export interface AddXpResult {
  userId: string;
  previousXp?: number;
  addedXp: number;
  newXp: number;
  level: number;
}

export interface QuestCompletionRewardResult {
  questId: string;
  completionId?: string;
  xpEarned: number;
  goldEarned: number;
  newXp: number;
  newGold: number;
  level: number;
  currentStreak?: number;
  longestStreak?: number;
  streakIncremented?: boolean;
}

/**
 * Validates that an XP increment is a positive integer.
 * Throws an error or returns false on negative or non-integer values.
 */
export function validateXpIncrement(amount: number): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return { valid: false, error: 'XP increment must be a valid number.' };
  }
  if (!Number.isInteger(amount)) {
    return { valid: false, error: 'XP increment must be an integer.' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'XP increment must be greater than zero. Negative XP updates are prevented.' };
  }
  return { valid: true };
}

/**
 * Centralized XP Engine Service:
 * Safely adds XP to a user's character profile.
 * Prevents invalid negative updates and keeps XP calculation separate from level calculation.
 */
export async function addExperience(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<{ result: AddXpResult | null; error: string | null }> {
  // 1. Strict validation against negative or invalid XP updates
  const validation = validateXpIncrement(amount);
  if (!validation.valid) {
    return { result: null, error: validation.error || 'Invalid XP amount' };
  }

  try {
    // 2. Attempt atomic PostgreSQL RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('add_xp', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return {
        result: {
          userId,
          addedXp: amount,
          newXp: rpcData[0].new_xp,
          level: rpcData[0].current_level,
        },
        error: null,
      };
    }

    // 3. Resilient fallback query if stored function is not yet deployed to remote instance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { result: null, error: profileError?.message || 'Profile not found' };
    }

    const newXp = profile.xp + amount;
    const newLevel = calculateLevelFromXP(newXp);

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        xp: newXp,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('xp, level')
      .single();

    if (updateError || !updatedProfile) {
      return { result: null, error: updateError?.message || 'Failed to update XP' };
    }

    return {
      result: {
        userId,
        previousXp: profile.xp,
        addedXp: amount,
        newXp: updatedProfile.xp,
        level: updatedProfile.level,
      },
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Unexpected error in XP Engine',
    };
  }
}

/**
 * Completes a quest, records the completion audit log, and awards the XP/Gold rewards atomically.
 */
export async function completeQuestAndAwardRewards(
  supabase: SupabaseClient,
  userId: string,
  questId: string
): Promise<{ result: QuestCompletionRewardResult | null; error: string | null }> {
  const { result, error } = await completeQuestWorkflow(supabase, userId, questId);

  if (error || !result) {
    return { result: null, error };
  }

  return {
    result: {
      questId: result.questId,
      completionId: result.completionId,
      xpEarned: result.xpEarned,
      goldEarned: result.goldEarned,
      newXp: result.characterState.xp,
      newGold: result.characterState.gold,
      level: result.characterState.level,
      currentStreak: result.characterState.currentStreak,
      longestStreak: result.characterState.longestStreak,
      streakIncremented: result.streakIncremented,
    },
    error: null,
  };
}

/**
 * Level progression calculation interface placeholder.
 * Prepared for STEP 14: Non-linear Level Formulas.
 * Currently keeps level calculations strictly separate from XP updates.
 */
export interface LevelProgressionConfig {
  currentLevel: number;
  currentXp: number;
}

export function getLevelProgressionState(config: LevelProgressionConfig): {
  level: number;
  currentXp: number;
  status: string;
} {
  return {
    level: config.currentLevel,
    currentXp: config.currentXp,
    status: 'Ready for STEP 14 non-linear progression algorithms',
  };
}
