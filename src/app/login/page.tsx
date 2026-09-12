'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(redirectedFrom);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="text-center">
        <Link href="/" className="inline-block text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          XPerience
        </Link>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Continue your real-life RPG adventure
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
            placeholder="player@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account yet?{' '}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 dark:text-zinc-100 underline hover:no-underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 py-12">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
