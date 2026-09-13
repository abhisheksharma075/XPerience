import { SupabaseClient } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  gold: number;
  strength: number;
  intelligence: number;
  discipline: number;
  vitality: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  display_name?: string;
  username?: string;
  avatar_url?: string | null;
}

/**
 * Fetches a user's character profile by user ID.
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as Profile | null, error: null };
  } catch (err) {
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to fetch profile',
    };
  }
}

/**
 * Ensures a profile exists for an authenticated user.
 * If the database trigger hasn't fired or the row doesn't exist yet, creates it.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      username?: string;
      display_name?: string;
      avatar_url?: string;
    };
  }
): Promise<{ profile: Profile | null; error: string | null }> {
  // First, attempt to retrieve the existing profile
  const { profile: existingProfile } = await getProfile(
    supabase,
    user.id
  );

  if (existingProfile) {
    return { profile: existingProfile, error: null };
  }

  // If not found or error, create the initial character profile row
  const defaultUsername =
    user.user_metadata?.username ||
    (user.email
      ? `${user.email.split('@')[0]}_${user.id.slice(0, 4)}`
      : `player_${user.id.slice(0, 6)}`);

  const defaultDisplayName =
    user.user_metadata?.display_name ||
    (user.email ? user.email.split('@')[0] : 'Player');

  const newProfile = {
    id: user.id,
    username: defaultUsername,
    display_name: defaultDisplayName,
    avatar_url: user.user_metadata?.avatar_url || null,
    xp: 0,
    level: 1,
    gold: 0,
    strength: 1,
    intelligence: 1,
    discipline: 1,
    vitality: 1,
    current_streak: 0,
    longest_streak: 0,
  };

  try {
    const { data, error: insertError } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (insertError || !data) {
      // In case another process created it simultaneously or upsert returned empty, try fetching once more
      const retry = await getProfile(supabase, user.id);
      if (retry.profile) {
        return retry;
      }
      return { profile: null, error: insertError?.message || 'Profile not found after upsert' };
    }

    return { profile: data as Profile, error: null };
  } catch (err) {
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to ensure profile',
    };
  }
}

/**
 * Updates a user's editable profile fields (display_name, username, avatar_url).
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: ProfileUpdateInput
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.display_name !== undefined) {
      updatePayload.display_name = updates.display_name.trim();
    }
    if (updates.username !== undefined) {
      updatePayload.username = updates.username.trim().toLowerCase();
    }
    if (updates.avatar_url !== undefined) {
      updatePayload.avatar_url = updates.avatar_url ? updates.avatar_url.trim() : null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return { profile: null, error: 'Username is already taken.' };
      }
      return { profile: null, error: error.message };
    }

    if (!data) {
      // Profile row may not exist yet if the user signed up prior to triggers/seed.
      // Auto-ensure profile row and retry update to prevent 404/PGRST116 errors.
      const { data: authData } = await supabase.auth.getUser();
      const userToEnsure =
        authData?.user && authData.user.id === userId ? authData.user : { id: userId };
      const ensured = await ensureProfile(supabase, userToEnsure);
      if (ensured.profile) {
        const retry = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select('*')
          .maybeSingle();

        if (retry.data) {
          return { profile: retry.data as Profile, error: null };
        }
        if (retry.error) {
          return { profile: null, error: retry.error.message };
        }
      }
      return { profile: null, error: ensured.error || 'Character profile not found.' };
    }

    return { profile: data as Profile, error: null };
  } catch (err) {
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    };
  }
}
