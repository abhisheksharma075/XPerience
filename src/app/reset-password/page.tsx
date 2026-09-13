"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  KeyRound,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError = searchParams.get("error_description") || searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [success, setSuccess] = useState(false);

  // Session verification state
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
      setCheckingSession(false);
      return;
    }

    const supabase = createClient();

    // Check existing session
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      if (res.data?.session) {
        setHasValidSession(true);
        setCheckingSession(false);
      } else {
        // Allow brief window for auth state change or hash parsing
        const timer = setTimeout(() => {
          setCheckingSession(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    });

    // Listen for PASSWORD_RECOVERY or SIGNED_IN event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "SIGNED_IN" && session)
      ) {
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [urlError]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Passphrase must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passphrases do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Sign out the temporary recovery session so the user can sign in fresh
      await supabase.auth.signOut();

      // Redirect to login after 1.5s
      setTimeout(() => {
        router.push(
          "/login?message=" +
            encodeURIComponent(
              "Your secret passphrase has been updated successfully! Please sign in with your new credentials."
            )
        );
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update passphrase."
      );
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-8 text-center shadow-2xl backdrop-blur-xl space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rpg-gold/15 border border-rpg-gold/40 flex items-center justify-center text-rpg-gold shadow-gold-glow animate-pulse">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">
          Verifying Recovery Seal...
        </h3>
        <p className="text-xs text-slate-400">
          Validating your magical recovery token with the authentication realm.
        </p>
      </div>
    );
  }

  if (!hasValidSession && !success) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-8 shadow-2xl backdrop-blur-xl space-y-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">
            Recovery Link Expired or Invalid
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error ||
              "We could not establish a valid password recovery session. The recovery link may have expired, already been used, or opened in an incompatible browser window."}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold py-3 px-4 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110"
          >
            <RefreshCw className="h-4 w-4" />
            Request New Recovery Scroll
          </Link>
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rpg-gold/15 border border-rpg-gold/40 flex items-center justify-center text-rpg-gold shadow-gold-glow">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Set New Passphrase
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Enter a new secret passphrase to secure your adventurer profile and character progress.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4 text-center">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 text-left space-y-2">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Passphrase Updated!
            </h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Your secret passphrase has been successfully reforged. You are being escorted to the realm gates...
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-rpg-gold hover:underline"
            >
              Sign in with new credentials <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              New Secret Passphrase
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Must be at least 6 characters in length.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Confirm New Passphrase
            </label>
            <div className="relative mt-1.5">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold py-3 px-4 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? "Forging New Passphrase..." : "Update Passphrase"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
            Loading sanctuary seal...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
