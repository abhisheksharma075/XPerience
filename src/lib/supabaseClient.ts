import { createClient } from './supabase/client';

export * from './supabase/client';
export { createClient as createSupabaseClient };

/**
 * Shared Supabase SSR client proxy for backward compatibility.
 * Dynamically resolves to the modern @supabase/ssr singleton client.
 */
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = createClient();
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});

export default supabase;
