"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncOnboardingToProfile, getOnboardingData } from "@/lib/onboarding";
import { Swords, Sword } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onboarding = getOnboardingData();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError("Passphrase must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passphrases do not match.");
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
          data: {
            display_name: onboarding.name || undefined,
            path: onboarding.path || undefined,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Supabase returns an empty identities array if the email is already registered
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError("An adventurer with this email already exists. Please sign in instead.");
        setLoading(false);
        return;
      }

      // If Supabase has an active session (e.g. auto-confirm enabled), sync onboarding and navigate
      if (data.session && data.user) {
        await syncOnboardingToProfile(supabase, data.user.id);
        router.push("/dashboard");
        router.refresh();
      } else {
        // If email confirmation is required, session is null; onboarding remains in localStorage and syncs on first login
        setSuccessMessage(
          "Hero account forged! Please check your email inbox to confirm your address before entering the realm."
        );
        setLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      {/* Fantasy ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute left-10 bottom-10 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
      </div>

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
            Forge Your Hero Account
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {onboarding.name
              ? `Binding your hero "${onboarding.name}" to your PostgreSQL profile.`
              : "Begin your adventure, track real quests, and level up your life."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300">
            {successMessage}
            <div className="mt-3">
              <Link
                href="/login"
                className="font-bold text-emerald-200 underline hover:no-underline"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSignUp} className="mt-6 space-y-4">
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
              Secret Passphrase (min 6 characters)
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Confirm Passphrase
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold py-3 px-4 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 disabled:opacity-50"
          >
            <Sword className="h-4 w-4" />
            {loading ? "Forging Account..." : "Create Account & Enter Realm"}
          </button>
        </form>

        <div className="pt-4 border-t border-rpg-surface-border/60 text-center text-xs text-slate-400">
          Already forged an account?{" "}
          <Link
            href="/login"
            className="font-bold text-rpg-gold hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </main>
  );
}
