import { SupabaseClient } from '@supabase/supabase-js';

export const VALID_ATTRIBUTES = ['strength', 'intelligence', 'discipline', 'vitality'] as const;
export type AttributeKey = (typeof VALID_ATTRIBUTES)[number];

export interface CharacterAttributes {
  strength: number;
  intelligence: number;
  discipline: number;
  vitality: number;
}

export interface UpdateAttributesInput {
  strength?: number;
  intelligence?: number;
  discipline?: number;
  vitality?: number;
}

export interface AttributeValidationResult {
  valid: boolean;
  error?: string;
}

export const ATTRIBUTE_METADATA: Record<
  AttributeKey,
  { label: string; description: string; icon: string }
> = {
  strength: {
    label: 'Strength',
    description: 'Physical power, training perseverance, and task throughput.',
    icon: '⚔️',
  },
  intelligence: {
    label: 'Intelligence',
    description: 'Cognitive acuity, problem solving, study, and creative focus.',
    icon: '🧠',
  },
  discipline: {
    label: 'Discipline',
    description: 'Consistency, daily habit adherence, and willpower resilience.',
    icon: '🛡️',
  },
  vitality: {
    label: 'Vitality',
    description: 'Health, stamina, recovery, and holistic well-being.',
    icon: '❤️',
  },
};

/**
 * Type guard to check if a string is a valid AttributeKey.
 */
export function isAttributeKey(key: string): key is AttributeKey {
  return VALID_ATTRIBUTES.includes(key as AttributeKey);
}

/**
 * Validates an individual attribute value.
 * Attributes must be integers >= 1.
 */
export function validateAttributeValue(
  value: unknown,
  attributeName: string
): AttributeValidationResult {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return {
      valid: false,
      error: `Attribute "${attributeName}" must be a valid number.`,
    };
  }

  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: `Attribute "${attributeName}" must be an integer, received float (${value}).`,
    };
  }

  if (value < 1) {
    return {
      valid: false,
      error: `Attribute "${attributeName}" cannot be less than 1, received (${value}).`,
    };
  }

  return { valid: true };
}

/**
 * Validates an object containing attribute updates.
 */
export function validateAttributes(
  attributes: UpdateAttributesInput
): AttributeValidationResult {
  if (!attributes || typeof attributes !== 'object') {
    return {
      valid: false,
      error: 'Attributes payload must be an object.',
    };
  }

  const keys = Object.keys(attributes) as (keyof UpdateAttributesInput)[];
  if (keys.length === 0) {
    return {
      valid: false,
      error: 'At least one attribute must be provided for update.',
    };
  }

  for (const key of keys) {
    if (!isAttributeKey(key)) {
      return {
        valid: false,
        error: `Invalid attribute "${key}". Valid attributes are: ${VALID_ATTRIBUTES.join(', ')}.`,
      };
    }

    const value = attributes[key];
    if (value !== undefined) {
      const result = validateAttributeValue(value, key);
      if (!result.valid) {
        return result;
      }
    }
  }

  return { valid: true };
}

/**
 * Validates points for incrementing an attribute.
 * Must be a positive integer >= 1.
 */
export function validateIncrementPoints(points: unknown): AttributeValidationResult {
  if (typeof points !== 'number' || Number.isNaN(points) || !Number.isFinite(points)) {
    return {
      valid: false,
      error: 'Increment points must be a valid number.',
    };
  }

  if (!Number.isInteger(points)) {
    return {
      valid: false,
      error: `Increment points must be an integer, received (${points}).`,
    };
  }

  if (points < 1) {
    return {
      valid: false,
      error: `Increment points must be at least 1, received (${points}).`,
    };
  }

  return { valid: true };
}

/**
 * Fetches character attributes for a given user.
 */
export async function getAttributes(
  supabase: SupabaseClient,
  userId: string
): Promise<{ attributes: CharacterAttributes | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('strength, intelligence, discipline, vitality')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { attributes: null, error: error.message };
    }

    if (!data) {
      return { attributes: null, error: 'Character profile not found.' };
    }

    return {
      attributes: {
        strength: data.strength,
        intelligence: data.intelligence,
        discipline: data.discipline,
        vitality: data.vitality,
      },
      error: null,
    };
  } catch (err) {
    return {
      attributes: null,
      error: err instanceof Error ? err.message : 'Failed to fetch attributes',
    };
  }
}

/**
 * Safely updates character attributes for the authenticated user.
 * Validates inputs and enforces RLS / ownership checks.
 */
export async function updateAttributes(
  supabase: SupabaseClient,
  userId: string,
  updates: UpdateAttributesInput
): Promise<{ attributes: CharacterAttributes | null; error: string | null }> {
  // 1. Client-side input validation
  const validation = validateAttributes(updates);
  if (!validation.valid) {
    return { attributes: null, error: validation.error || 'Invalid attribute input' };
  }

  try {
    // 2. Try stored procedure RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'update_character_attributes',
      {
        p_user_id: userId,
        p_strength: updates.strength ?? null,
        p_intelligence: updates.intelligence ?? null,
        p_discipline: updates.discipline ?? null,
        p_vitality: updates.vitality ?? null,
      }
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      const row = rpcData[0];
      return {
        attributes: {
          strength: row.strength,
          intelligence: row.intelligence,
          discipline: row.discipline,
          vitality: row.vitality,
        },
        error: null,
      };
    }

    // 3. Fallback: Direct RLS-protected update if RPC is missing
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.strength !== undefined) payload.strength = updates.strength;
    if (updates.intelligence !== undefined) payload.intelligence = updates.intelligence;
    if (updates.discipline !== undefined) payload.discipline = updates.discipline;
    if (updates.vitality !== undefined) payload.vitality = updates.vitality;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('strength, intelligence, discipline, vitality')
      .maybeSingle();

    if (error) {
      return { attributes: null, error: error.message };
    }

    if (!data) {
      return { attributes: null, error: 'Character profile not found.' };
    }

    return {
      attributes: {
        strength: data.strength,
        intelligence: data.intelligence,
        discipline: data.discipline,
        vitality: data.vitality,
      },
      error: null,
    };
  } catch (err) {
    return {
      attributes: null,
      error: err instanceof Error ? err.message : 'Failed to update attributes',
    };
  }
}

/**
 * Safely increments an individual character attribute by a given number of points.
 */
export async function incrementAttribute(
  supabase: SupabaseClient,
  userId: string,
  attribute: AttributeKey,
  points: number = 1
): Promise<{ attributes: CharacterAttributes | null; error: string | null }> {
  // 1. Validate key and points
  if (!isAttributeKey(attribute)) {
    return {
      attributes: null,
      error: `Invalid attribute "${attribute}". Must be one of: ${VALID_ATTRIBUTES.join(', ')}.`,
    };
  }

  const pointValidation = validateIncrementPoints(points);
  if (!pointValidation.valid) {
    return { attributes: null, error: pointValidation.error || 'Invalid increment points' };
  }

  try {
    // 2. Try stored procedure RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'increment_attribute',
      {
        p_user_id: userId,
        p_attribute: attribute,
        p_points: points,
      }
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      const row = rpcData[0];
      return {
        attributes: {
          strength: row.strength,
          intelligence: row.intelligence,
          discipline: row.discipline,
          vitality: row.vitality,
        },
        error: null,
      };
    }

    // 3. Fallback: Fetch current value, increment, and update with RLS
    const { attributes: current, error: fetchErr } = await getAttributes(supabase, userId);
    if (fetchErr || !current) {
      return { attributes: null, error: fetchErr || 'Could not fetch current attributes' };
    }

    const nextValue = current[attribute] + points;
    return await updateAttributes(supabase, userId, {
      [attribute]: nextValue,
    });
  } catch (err) {
    return {
      attributes: null,
      error: err instanceof Error ? err.message : 'Failed to increment attribute',
    };
  }
}
