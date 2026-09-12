import { SupabaseClient } from '@supabase/supabase-js';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'active' | 'completed' | 'archived';

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  gold_reward: number;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestInput {
  title: string;
  description?: string | null;
  xp_reward?: number;
  gold_reward?: number;
  difficulty?: QuestDifficulty;
  status?: QuestStatus;
  due_date?: string | null;
}

export interface UpdateQuestInput {
  title?: string;
  description?: string | null;
  xp_reward?: number;
  gold_reward?: number;
  difficulty?: QuestDifficulty;
  status?: QuestStatus;
  due_date?: string | null;
}

export interface QuestFilterOptions {
  status?: QuestStatus;
  difficulty?: QuestDifficulty;
}

/**
 * Retrieves all quests belonging to the authenticated user.
 * RLS automatically ensures players only receive their own rows.
 */
export async function getQuests(
  supabase: SupabaseClient,
  userId?: string,
  options?: QuestFilterOptions
): Promise<{ quests: Quest[]; error: string | null }> {
  try {
    let query = supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }

    const { data, error } = await query;

    if (error) {
      return { quests: [], error: error.message };
    }

    return { quests: (data as Quest[]) || [], error: null };
  } catch (err) {
    return {
      quests: [],
      error: err instanceof Error ? err.message : 'Failed to fetch quests',
    };
  }
}

/**
 * Retrieves a single quest by ID.
 */
export async function getQuestById(
  supabase: SupabaseClient,
  questId: string
): Promise<{ quest: Quest | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .maybeSingle();

    if (error) {
      return { quest: null, error: error.message };
    }

    return { quest: data as Quest | null, error: null };
  } catch (err) {
    return {
      quest: null,
      error: err instanceof Error ? err.message : 'Failed to retrieve quest',
    };
  }
}

/**
 * Creates a new quest linked to the specified user.
 */
export async function createQuest(
  supabase: SupabaseClient,
  userId: string,
  input: CreateQuestInput
): Promise<{ quest: Quest | null; error: string | null }> {
  try {
    const trimmedTitle = input.title?.trim();
    if (!trimmedTitle) {
      return { quest: null, error: 'Quest title is required.' };
    }

    const payload = {
      user_id: userId,
      title: trimmedTitle,
      description: input.description?.trim() || null,
      xp_reward: Math.max(0, input.xp_reward ?? 0),
      gold_reward: Math.max(0, input.gold_reward ?? 0),
      difficulty: input.difficulty || 'easy',
      status: input.status || 'active',
      due_date: input.due_date ? new Date(input.due_date).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('quests')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return { quest: null, error: error.message };
    }

    return { quest: data as Quest, error: null };
  } catch (err) {
    return {
      quest: null,
      error: err instanceof Error ? err.message : 'Failed to create quest',
    };
  }
}

/**
 * Updates an existing quest by ID.
 */
export async function updateQuest(
  supabase: SupabaseClient,
  questId: string,
  input: UpdateQuestInput
): Promise<{ quest: Quest | null; error: string | null }> {
  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) {
      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) {
        return { quest: null, error: 'Quest title cannot be empty.' };
      }
      updatePayload.title = trimmedTitle;
    }
    if (input.description !== undefined) {
      updatePayload.description = input.description ? input.description.trim() : null;
    }
    if (input.xp_reward !== undefined) {
      updatePayload.xp_reward = Math.max(0, input.xp_reward);
    }
    if (input.gold_reward !== undefined) {
      updatePayload.gold_reward = Math.max(0, input.gold_reward);
    }
    if (input.difficulty !== undefined) {
      updatePayload.difficulty = input.difficulty;
    }
    if (input.status !== undefined) {
      updatePayload.status = input.status;
    }
    if (input.due_date !== undefined) {
      updatePayload.due_date = input.due_date
        ? new Date(input.due_date).toISOString()
        : null;
    }

    const { data, error } = await supabase
      .from('quests')
      .update(updatePayload)
      .eq('id', questId)
      .select('*')
      .single();

    if (error) {
      return { quest: null, error: error.message };
    }

    return { quest: data as Quest, error: null };
  } catch (err) {
    return {
      quest: null,
      error: err instanceof Error ? err.message : 'Failed to update quest',
    };
  }
}

/**
 * Deletes a quest by ID.
 */
export async function deleteQuest(
  supabase: SupabaseClient,
  questId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete quest',
    };
  }
}
