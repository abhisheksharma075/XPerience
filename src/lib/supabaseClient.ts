import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Factory function to create a new Supabase client instance.
 * Validates that the required environment variables are set in .env.local.
 */
export function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined in .env.local.'
    );
  }
  return createClient(supabaseUrl, supabasePublishableKey);
}

/**
 * Shared Supabase client instance for application usage.
 * Automatically wraps client instantiation so build/compile checks pass
 * while alerting developers at runtime if credentials are not configured.
 */
export const supabase: SupabaseClient =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : (new Proxy({} as SupabaseClient, {
        get(_target, prop) {
          if (!supabaseUrl || !supabasePublishableKey) {
            throw new Error(
              'Supabase client accessed without configuration. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.'
            );
          }
          const client = createClient(supabaseUrl, supabasePublishableKey);
          return (client as unknown as Record<string, unknown>)[prop as string];
        },
      }));

export default supabase;
