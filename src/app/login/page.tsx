"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncOnboardingToProfile } from "@/lib/onboarding";
import { Swords, Sparkles, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Sync any pending onboarding data
        await syncOnboardingToProfile(supabase, data.user.id);
      }

      router.push(redirectedFrom);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-mono font-black text-xl text-white tracking-wider"
        >
          <div className="w-9 h-9 rounded-xl bg-rpg-gold/15 border border-rpg-gold/40 flex items-center justify-center text-rpg-gold shadow-gold-glow">
            <Swords className="w-5 h-5" />
          </div>
          <span>
            XP<span className="text-rpg-gold">ERIENCE</span>
          </span>
        </Link>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Welcome Back, Hero
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Sign in to resume your real-life quests, streaks, and RPG progression.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
            placeholder="hero@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Secret Passphrase
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold py-3 px-4 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Verifying Credentials..." : "Enter Realm (Sign In)"}
        </button>
      </form>

      <div className="pt-4 border-t border-rpg-surface-border/60 text-center text-xs text-slate-400">
        New to XPerience?{" "}
        <Link
          href="/signup"
          className="font-bold text-rpg-gold hover:underline"
        >
          Create your hero account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      {/* Fantasy ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute right-10 bottom-10 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
      </div>

      <Suspense
        fallback={
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-spin text-purple-400" />
            Loading authentication portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
