'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, updateProfile } from '@/lib/profile';

interface ProfileFormProps {
  initialProfile: Profile;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initialProfile.display_name || '');
  const [username, setUsername] = useState(initialProfile.username || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await updateProfile(
        supabase,
        initialProfile.id,
        {
          display_name: displayName,
          username: username,
          avatar_url: avatarUrl,
        }
      );

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      setSuccess('Profile updated successfully!');
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Edit Character Profile
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Update your character identity and public avatar.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3.5 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3.5 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
            placeholder="e.g. Shadow Knight"
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
            placeholder="e.g. shadow_knight"
          />
        </div>

        <div>
          <label
            htmlFor="avatarUrl"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-lg py-2.5 px-5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving Changes...' : 'Save Character Profile'}
        </button>
      </form>
    </div>
  );
}
