"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Compass, Sparkles, Target } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getOnboardingData, type OnboardingData } from "@/lib/onboarding";

const goalImages: Record<string, string> = {
  Fitness: "/images/fitness.png",
  Learning: "/images/learning.png",
  "Mental Growth": "/images/mental-growth.png",
  Career: "/images/career.png",
  Creativity: "/images/creativity.png",
  Finance: "/images/finance.png",
  Relationships: "/images/relationships.png",
  "Personal Growth": "/images/personal-growth.png",
};

export default function QuestsPage() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <LoadingState />;
  }

  const goals = Array.isArray(onboardingData?.goals)
    ? onboardingData.goals.filter((goal): goal is string => typeof goal === "string")
    : [];

  return (
    <div className="space-y-7 pb-8 sm:space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        aria-labelledby="quests-title"
        className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-rpg-surface/80 px-5 py-7 shadow-[0_25px_80px_rgba(76,29,149,.2)] backdrop-blur-xl sm:px-8 sm:py-9"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,.26),transparent_36%),radial-gradient(circle_at_90%_100%,rgba(79,70,229,.18),transparent_34%)]" />
        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
              <Compass className="h-3.5 w-3.5 text-purple-300" />
              Quest log
            </div>
            <h1 id="quests-title" className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">Your Quests</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              These are the life domains you chose to level up. Every quest begins with one deliberate step.
            </p>
          </div>
        </div>
      </motion.section>

      {goals.length > 0 ? (
        <section aria-labelledby="active-quests-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">First campaign</p>
              <h2 id="active-quests-title" className="mt-1 text-2xl font-black text-white">Active quests</h2>
            </div>
            <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200">
              {goals.length} {goals.length === 1 ? "quest" : "quests"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal, index) => (
              <motion.article
                key={goal}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
                className="group relative min-h-[265px] overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/90 p-5 shadow-xl transition-colors hover:border-purple-400/45"
              >
                {goalImages[goal] && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                    style={{ backgroundImage: `url('${goalImages[goal]}')` }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rpg-surface via-rpg-surface/90 to-rpg-surface/40" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-300/25 bg-purple-500/10 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,.16)]">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-300">New Quest</span>
                  </div>

                  <div className="mt-auto pt-10">
                    <h3 className="text-xl font-black text-white">{goal}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Your first chapter in {goal.toLowerCase()} is ready when you are.</p>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <ProgressBar label="Quest progress" value={0} max={100} showValueText={false} size="sm" variant="xp" />
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400">0% progress</span>
                        <span className="inline-flex items-center gap-1 font-bold text-rpg-gold">
                          <Sparkles className="h-3.5 w-3.5" />
                          +50 XP preview
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <Target className="h-3.5 w-3.5 text-purple-300" />
            Quest completion, XP, streaks, and persistence will be introduced in a future stage.
          </p>
        </section>
      ) : (
        <EmptyQuestState />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md" role="status">
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">Opening your quest log...</p>
    </div>
  );
}

function EmptyQuestState() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-rpg-surface-border bg-rpg-surface/85 px-6 py-14 text-center shadow-2xl backdrop-blur-md sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.18),transparent_52%)]" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/10 text-purple-200 shadow-[0_0_30px_rgba(139,92,246,.2)]">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-white">Your quest log is waiting</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Choose the goals you want to level up during onboarding, and they will become your first quests here.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-rpg-surface-border bg-rpg-surface-elevated px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-purple-400/40 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/onboarding" className="inline-flex items-center gap-2 rounded-xl bg-rpg-gold px-4 py-2.5 text-sm font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110">
            Choose goals
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
