'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If Supabase has email confirmation enabled, session will be null
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMessage(
          'Account created successfully! Please check your email inbox to confirm your email before signing in.'
        );
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="text-center">
          <Link href="/" className="inline-block text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            XPerience
          </Link>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Begin your journey and level up your life
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
            {successMessage}
            <div className="mt-3">
              <Link
                href="/login"
                className="font-semibold underline hover:no-underline"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSignUp} className="mt-8 space-y-5">
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:border-zinc-400 text-sm"
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-zinc-900 dark:text-zinc-100 underline hover:no-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
