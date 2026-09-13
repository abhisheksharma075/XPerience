'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, updateProfile } from '@/lib/profile';
import { broadcastRpgSync } from '@/context/PlayerContext';

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
      broadcastRpgSync({ displayName });
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div id="edit-character" className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-6 md:p-8 shadow-xl backdrop-blur-md scroll-mt-24">
      <h2 className="text-xl font-bold tracking-tight text-white">
        Edit Character Profile
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Update your hero identity and public avatar seal.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="displayName"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
            placeholder="e.g. Shadow Knight"
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Hero Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
            placeholder="e.g. shadow_knight"
          />
        </div>

        <div>
          <label
            htmlFor="avatarUrl"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-xl bg-rpg-gold py-2.5 px-5 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Saving Changes...' : 'Save Character Profile'}
        </button>
      </form>
    </div>
  );
}
