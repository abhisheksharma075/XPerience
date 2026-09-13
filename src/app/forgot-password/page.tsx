"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, Sparkles, Mail, ArrowLeft, ShieldAlert } from "lucide-react";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Dynamically resolve the site origin so redirect works on any port or domain
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const redirectTo = `${origin}/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send recovery scroll."
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rpg-gold/15 border border-rpg-gold/40 flex items-center justify-center text-rpg-gold shadow-gold-glow">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Recover Secret Passphrase
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Enter your adventurer email address. We will dispatch a magical recovery scroll to reset your passphrase.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 text-left space-y-2">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              Recovery Scroll Dispatched!
            </h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              If an account exists for <span className="font-semibold text-white">{email}</span>, a password reset link has been sent to your inbox.
            </p>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-emerald-500/20">
              Click the link in your email to choose a new passphrase. The link expires shortly.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-rpg-gold hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Realm Gates (Sign In)
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Hero Email Address
            </label>
            <div className="relative mt-1.5">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-rpg-surface-border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rpg-gold focus:outline-none"
                placeholder="hero@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold py-3 px-4 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {loading ? "Dispatching Scroll..." : "Send Recovery Scroll"}
          </button>

          <div className="pt-4 border-t border-rpg-surface-border/60 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rpg-gold transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Remember your passphrase? Sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
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
            Opening recovery portal...
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
