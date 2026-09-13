import { SupabaseClient } from '@supabase/supabase-js';
import { calculateLevelFromXP } from './levelSystem';
import { calculateStreakProgression, getCalendarDay } from './streaks';

export interface CharacterState {
  id: string;
  xp: number;
  level: number;
  gold: number;
  currentStreak: number;
  longestStreak: number;
  strength: number;
  intelligence: number;
  discipline: number;
  vitality: number;
}

export interface QuestCompletionResult {
  success: boolean;
  questId: string;
  completionId: string;
  xpEarned: number;
  goldEarned: number;
  streakIncremented: boolean;
  completedAt: string;
  characterState: CharacterState;
}

export interface CompleteQuestOptions {
  timezone?: string;
}

/**
 * Validates a UUID string format.
 */
function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Unified Server-Side Quest Completion Engine
 *
 * Executes the complete 10-step atomic workflow:
 *  1. Verify the authenticated user
 *  2. Verify the quest belongs to that user
 *  3. Verify the quest is completable (status = 'active')
 *  4. Prevent duplicate completion for the same intended completion period
 *  5. Create quest completion record
 *  6. Award XP safely
 *  7. Recalculate level
 *  8. Award gold & record transaction
 *  9. Update streak
 * 10. Return the complete updated character state
 */
export async function completeQuestWorkflow(
  supabase: SupabaseClient,
  userId: string,
  questId: string,
  options?: CompleteQuestOptions
): Promise<{ result: QuestCompletionResult | null; error: string | null }> {
  // Input validation
  if (!userId || !isValidUUID(userId)) {
    return { result: null, error: 'Invalid user ID.' };
  }
  if (!questId || !isValidUUID(questId)) {
    return { result: null, error: 'Invalid quest ID.' };
  }

  const timezone = options?.timezone || 'UTC';

  try {
    // 1. Primary path: Attempt atomic database stored procedure RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'complete_quest_engine',
      {
        p_quest_id: questId,
        p_timezone: timezone,
      }
    );

    if (!rpcError && rpcData && rpcData.success) {
      const state = rpcData.character_state;
      return {
        result: {
          success: true,
          questId: rpcData.quest_id,
          completionId: rpcData.completion_id,
          xpEarned: rpcData.xp_earned,
          goldEarned: rpcData.gold_earned,
          streakIncremented: rpcData.streak_incremented,
          completedAt: rpcData.completed_at,
          characterState: {
            id: state.id,
            xp: state.xp,
            level: state.level,
            gold: state.gold,
            currentStreak: state.current_streak,
            longestStreak: state.longest_streak,
            strength: state.strength,
            intelligence: state.intelligence,
            discipline: state.discipline,
            vitality: state.vitality,
          },
        },
        error: null,
      };
    }

    // If the RPC returned a genuine logic/validation error (e.g. unauthorized, duplicate, not active)
    if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
      return { result: null, error: rpcError.message };
    }

    // 2. Resilient application fallback (if stored function is not yet deployed)
    // Step 1 & 2: Verify quest existence and ownership
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .maybeSingle();

    if (questError || !quest) {
      return { result: null, error: 'Quest not found.' };
    }

    if (quest.user_id !== userId) {
      return { result: null, error: 'Access denied: Quest does not belong to user.' };
    }

    // Step 3: Verify quest is completable
    if (quest.status === 'completed') {
      return { result: null, error: 'Quest is already completed.' };
    }
    if (quest.status === 'archived') {
      return { result: null, error: 'Archived quests cannot be completed.' };
    }
    if (quest.status !== 'active') {
      return { result: null, error: `Quest cannot be completed: status is "${quest.status}".` };
    }

    // Step 4: Prevent duplicate completion for the same intended completion period
    const now = new Date();
    const today = getCalendarDay(now, timezone);

    const { data: existingCompletions } = await supabase
      .from('quest_completions')
      .select('id, completed_at')
      .eq('quest_id', questId);

    const alreadyCompletedToday = (existingCompletions || []).some(
      (c) => getCalendarDay(c.completed_at, timezone) === today
    );

    if (alreadyCompletedToday) {
      return {
        result: null,
        error: `Duplicate completion: Quest has already been completed for today (${today}).`,
      };
    }

    // Fetch player profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return { result: null, error: 'Character profile not found.' };
    }

    // Step 5: Mark quest completed & create audit record
    const { error: markError } = await supabase
      .from('quests')
      .update({
        status: 'completed',
        updated_at: now.toISOString(),
      })
      .eq('id', questId);

    if (markError) {
      return { result: null, error: markError.message };
    }

    const { data: completion, error: completionError } = await supabase
      .from('quest_completions')
      .insert({
        quest_id: questId,
        user_id: userId,
        xp_earned: quest.xp_reward,
        gold_earned: quest.gold_reward,
        completed_at: now.toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (completionError || !completion) {
      return { result: null, error: completionError?.message || 'Failed to record completion.' };
    }

    // Step 6 & 7: Award XP & Recalculate level
    const newXp = profile.xp + quest.xp_reward;
    const newLevel = calculateLevelFromXP(newXp);

    // Step 8: Award Gold
    const newGold = profile.gold + quest.gold_reward;

    // Step 9: Update streak
    const { data: priorCompletions } = await supabase
      .from('quest_completions')
      .select('completed_at')
      .eq('user_id', userId)
      .neq('id', completion.id)
      .order('completed_at', { ascending: false })
      .limit(1);

    const lastCompletionTimestamp =
      priorCompletions && priorCompletions.length > 0
        ? priorCompletions[0].completed_at
        : null;

    const streakProgression = calculateStreakProgression({
      lastCompletionDate: lastCompletionTimestamp,
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      newCompletionDate: now,
      timezone,
    });

    // Update profile atomically
    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        xp: newXp,
        level: newLevel,
        gold: newGold,
        current_streak: streakProgression.newCurrentStreak,
        longest_streak: streakProgression.newLongestStreak,
        updated_at: now.toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (profileUpdateError || !updatedProfile) {
      return {
        result: null,
        error: profileUpdateError?.message || 'Failed to update character profile.',
      };
    }

    // Record in gold_transactions if gold was earned
    if (quest.gold_reward > 0) {
      await supabase.from('gold_transactions').insert({
        user_id: userId,
        amount: quest.gold_reward,
        balance_after: newGold,
        transaction_type: 'quest_reward',
        reference_id: questId,
        description: `Completed quest: ${quest.title}`,
        created_at: now.toISOString(),
      });
    }

    // Step 10: Return complete updated character state
    return {
      result: {
        success: true,
        questId,
        completionId: completion.id,
        xpEarned: quest.xp_reward,
        goldEarned: quest.gold_reward,
        streakIncremented: streakProgression.streakIncremented,
        completedAt: now.toISOString(),
        characterState: {
          id: updatedProfile.id,
          xp: updatedProfile.xp,
          level: updatedProfile.level,
          gold: updatedProfile.gold,
          currentStreak: updatedProfile.current_streak,
          longestStreak: updatedProfile.longest_streak,
          strength: updatedProfile.strength,
          intelligence: updatedProfile.intelligence,
          discipline: updatedProfile.discipline,
          vitality: updatedProfile.vitality,
        },
      },
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Unexpected error during quest completion workflow',
    };
  }
}
