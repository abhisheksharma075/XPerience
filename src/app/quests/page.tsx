"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getOnboardingData, type OnboardingData } from "@/lib/onboarding";

type QuestStatus = "new" | "active" | "completed";

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
  const [questStatuses, setQuestStatuses] = useState<Record<string, QuestStatus>>({});
  const [awardedQuests, setAwardedQuests] = useState<Record<string, boolean>>({});
  const [currentXp, setCurrentXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [levelUpEvent, setLevelUpEvent] = useState<{ show: boolean; newLevel: number } | null>(null);
  const [justAwardedGoal, setJustAwardedGoal] = useState<string | null>(null);

  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setIsLoaded(true);
  }, []);

  const handleStartQuest = (goal: string) => {
    setQuestStatuses((prev) => ({
      ...prev,
      [goal]: "active",
    }));
  };

  const handleDismissLevelUp = () => {
    setLevelUpEvent(null);
    setLevel(2);
    setCurrentXp(0);
  };

  useEffect(() => {
    if (levelUpEvent?.show) {
      const timer = setTimeout(() => {
        handleDismissLevelUp();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [levelUpEvent]);

  const handleCompleteQuest = (goal: string) => {
    if (questStatuses[goal] === "completed" || awardedQuests[goal]) {
      return;
    }

    setQuestStatuses((prev) => ({
      ...prev,
      [goal]: "completed",
    }));

    setAwardedQuests((prev) => ({
      ...prev,
      [goal]: true,
    }));

    setJustAwardedGoal(goal);
    setTimeout(() => {
      setJustAwardedGoal((curr) => (curr === goal ? null : curr));
    }, 2500);

    setCurrentXp((prevXp) => {
      const nextXp = prevXp + 50;
      if (level === 1 && nextXp >= 100) {
        setTimeout(() => {
          setLevelUpEvent({ show: true, newLevel: 2 });
        }, 700);
        return 100;
      }
      return nextXp;
    });
  };

  if (!isLoaded) {
    return <LoadingState />;
  }

  const goals = Array.isArray(onboardingData?.goals)
    ? onboardingData.goals.filter((goal): goal is string => typeof goal === "string")
    : [];

  return (
    <div className="space-y-7 pb-8 sm:space-y-8">
      {/* Level Up Celebration Modal */}
      <AnimatePresence>
        {levelUpEvent?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rpg-gold/50 bg-rpg-surface/95 p-8 text-center shadow-[0_0_60px_rgba(212,175,55,0.35)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18),transparent_70%)]" />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-rpg-gold/60 bg-rpg-gold/15 text-rpg-gold shadow-[0_0_35px_rgba(212,175,55,0.4)]"
              >
                <Crown className="h-10 w-10 text-rpg-gold animate-pulse" />
              </motion.div>

              <div className="mt-5 space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Level Up!
                </div>
                <h2 className="text-3xl font-black text-white sm:text-4xl">Level {levelUpEvent.newLevel}</h2>
                <p className="text-sm leading-6 text-slate-300">
                  Your dedication has yielded power. You advanced to Level {String(levelUpEvent.newLevel).padStart(2, "0")}!
                </p>
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={handleDismissLevelUp}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rpg-gold px-5 py-3 text-sm font-black text-rpg-void shadow-gold-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void"
                >
                  Continue Journey
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

          <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
                <Compass className="h-3.5 w-3.5 text-purple-300" />
                Quest log
              </div>
              <h1 id="quests-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Your Quests</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                These are the life domains you chose to level up. Every quest begins with one deliberate step.
              </p>
            </div>

            {/* Session XP & Level Widget */}
            <div className="w-full max-w-sm rounded-2xl border border-purple-400/25 bg-rpg-void/70 p-4 shadow-[0_0_20px_rgba(76,29,149,0.25)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                    <Crown className="h-4 w-4 text-rpg-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hero Rank</p>
                    <p className="font-mono text-xs font-black uppercase tracking-wider text-white">
                      LEVEL {String(level).padStart(2, "0")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                  <div className="flex items-center justify-end gap-1 font-mono text-xs font-bold text-rpg-gold">
                    <motion.span
                      key={currentXp}
                      initial={{ scale: 1.3, color: "#f9e076" }}
                      animate={{ scale: 1, color: "#d4af37" }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentXp}
                    </motion.span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">100 XP</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <ProgressBar
                  label="Level Progress"
                  value={currentXp}
                  max={100}
                  showValueText={false}
                  size="sm"
                  variant={currentXp >= 100 ? "gold" : "xp"}
                />
              </div>
            </div>
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
            {goals.map((goal, index) => {
              const status: QuestStatus = questStatuses[goal] ?? "new";
              const isNew = status === "new";
              const isActive = status === "active";
              const isCompleted = status === "completed";

              const progressValue = isCompleted ? 100 : isActive ? 50 : 0;

              return (
                <motion.article
                  key={goal}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
                  className={`group relative min-h-[285px] overflow-hidden rounded-2xl border bg-rpg-surface/90 p-5 shadow-xl transition-all duration-300 ${
                    isActive
                      ? "border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/30"
                      : isCompleted
                      ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "border-rpg-surface-border hover:border-purple-400/45"
                  }`}
                >
                  {goalImages[goal] && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                      style={{ backgroundImage: `url('${goalImages[goal]}')` }}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rpg-surface via-rpg-surface/90 to-rpg-surface/40" />

                  {/* Subtle active glowing gradient overlay */}
                  {isActive && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.18),transparent_65%)]"
                    />
                  )}

                  {/* Temporary Floating XP Award Badge */}
                  <AnimatePresence>
                    {justAwardedGoal === goal && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -4, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.9 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-rpg-gold/50 bg-rpg-surface-elevated/95 px-3 py-1 text-xs font-bold text-rpg-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] backdrop-blur-md"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        +50 XP!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                          isCompleted
                            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)]"
                            : isActive
                            ? "border-purple-400/50 bg-purple-500/25 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                            : "border-purple-300/25 bg-purple-500/10 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.16)]"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>

                      {/* Quest Status Badge */}
                      {isNew && (
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                          New Quest
                        </span>
                      )}
                      {isActive && (
                        <span className="rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-8">
                      <h3 className="text-xl font-black text-white">{goal}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {isCompleted
                          ? `Completed! You proved your dedication to ${goal.toLowerCase()}.`
                          : isActive
                          ? `Quest active. Take action today to level up ${goal.toLowerCase()}.`
                          : `Your first chapter in ${goal.toLowerCase()} is ready when you are.`}
                      </p>

                      <div className="mt-5 border-t border-white/10 pt-4">
                        <ProgressBar
                          label="Quest progress"
                          value={progressValue}
                          max={100}
                          showValueText={false}
                          size="sm"
                          variant={isCompleted ? "gold" : "xp"}
                        />
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span
                            className={`font-mono ${
                              isCompleted
                                ? "font-bold text-emerald-400"
                                : isActive
                                ? "font-bold text-purple-300"
                                : "text-slate-400"
                            }`}
                          >
                            {progressValue}% progress
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              +50 XP awarded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-rpg-gold">
                              <Sparkles className="h-3.5 w-3.5" />
                              +50 XP preview
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button / Completed State */}
                      <div className="mt-4">
                        {isNew && (
                          <button
                            type="button"
                            onClick={() => handleStartQuest(goal)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/15 px-4 py-2.5 text-xs font-bold text-purple-200 transition hover:border-purple-400/60 hover:bg-purple-500/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Start Quest
                          </button>
                        )}
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleCompleteQuest(goal)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rpg-gold px-4 py-2.5 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            Complete Quest
                          </button>
                        )}
                        {isCompleted && (
                          <div
                            role="status"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Quest Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
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
