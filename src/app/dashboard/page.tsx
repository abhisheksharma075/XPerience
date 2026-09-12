"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronRight,
  Crown,
  Crosshair,
  Dumbbell,
  Sparkles,
  Star,
  Swords,
  Target,
  WandSparkles,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getOnboardingData, type OnboardingData } from "@/lib/onboarding";

type PathDetails = {
  name: string;
  image: string;
  description: string;
};

const pathDetails: Record<string, PathDetails> = {
  Warrior: {
    name: "Warrior",
    image: "/images/warrior.webp",
    description: "Discipline builds freedom.",
  },
  Sage: {
    name: "Sage",
    image: "/images/sage.webp",
    description: "Knowledge turns possibilities into reality.",
  },
  Creator: {
    name: "Creator",
    image: "/images/creator.webp",
    description: "Ideas create a brighter tomorrow.",
  },
};

const startingStats = [
  { name: "Strength", value: 24, icon: Dumbbell, color: "text-rose-300" },
  { name: "Focus", value: 31, icon: Crosshair, color: "text-cyan-300" },
  { name: "Creativity", value: 28, icon: WandSparkles, color: "text-fuchsia-300" },
  { name: "Discipline", value: 35, icon: Target, color: "text-amber-300" },
];

export default function DashboardPage() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <DashboardLoadingState />;
  }

  const name = typeof onboardingData?.name === "string" ? onboardingData.name.trim() : "";
  const path = typeof onboardingData?.path === "string" ? onboardingData.path : "";
  const goals = Array.isArray(onboardingData?.goals)
    ? onboardingData.goals.filter((goal): goal is string => typeof goal === "string")
    : [];
  const selectedPath = pathDetails[path];
  const hasOnboardingData = Boolean(name || path || goals.length);

  if (!hasOnboardingData) {
    return <OnboardingRequiredState />;
  }

  const heroName = name || "Adventurer";
  const pathName = selectedPath?.name || path || "Unchosen Path";
  const journeySteps = [
    { label: "Chapter 01", detail: "Identity", complete: Boolean(name) },
    { label: "Chapter 02", detail: "Path", complete: Boolean(path) },
    { label: "Chapter 03", detail: "Goals", complete: goals.length > 0 },
  ];

  return (
    <div className="space-y-7 pb-8 sm:space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        aria-labelledby="dashboard-title"
        className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-rpg-surface/80 px-5 py-7 shadow-[0_25px_80px_rgba(76,29,149,0.2)] backdrop-blur-xl sm:px-8 sm:py-9"
      >
        {selectedPath && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-cover bg-center opacity-30 md:block"
            style={{ backgroundImage: `url('${selectedPath.image}')` }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,.28),transparent_38%),radial-gradient(circle_at_85%_100%,rgba(79,70,229,.2),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-[35%] hidden w-40 bg-gradient-to-r from-rpg-surface via-rpg-surface/70 to-transparent md:block" />

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            Your adventure has begun
          </div>
          <h1 id="dashboard-title" className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Welcome back, <span className="text-rpg-gold">{heroName}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Your world is ready. Choose a small quest, take the first step, and let every action shape the hero you are becoming.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-300/30 bg-purple-500/15 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,.2)]">
              <Swords className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Chosen path</p>
              <p className="text-sm font-bold text-white">{pathName}</p>
            </div>
            {selectedPath && <span className="hidden text-xs text-purple-200/75 sm:inline">— {selectedPath.description}</span>}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
          aria-labelledby="player-card-title"
          className="relative overflow-hidden rounded-3xl border border-rpg-surface-border bg-gradient-to-br from-rpg-surface-card via-rpg-surface to-[#101022] p-5 shadow-2xl sm:p-6"
        >
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-purple-300/30 bg-gradient-to-br from-purple-500/30 to-indigo-950 shadow-[0_0_32px_rgba(139,92,246,.3)]">
              {selectedPath && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{ backgroundImage: `url('${selectedPath.image}')` }}
                />
              )}
              <Crown className="relative h-9 w-9 text-rpg-gold drop-shadow-[0_0_12px_rgba(212,175,55,.5)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Player card</p>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  New Adventurer
                </span>
              </div>
              <h2 id="player-card-title" className="mt-2 truncate text-2xl font-black text-white sm:text-3xl">{heroName}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <Swords className="h-4 w-4 text-purple-300" />
                {pathName}
              </p>
            </div>
            <div className="rounded-2xl border border-rpg-gold/20 bg-rpg-gold/5 px-4 py-3 text-left sm:text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200/65">Level</p>
              <p className="mt-1 font-mono text-3xl font-black text-rpg-gold">01</p>
            </div>
          </div>
          <div className="relative mt-6 border-t border-rpg-surface-border/70 pt-5">
            <ProgressBar label="Starting experience" value={0} max={100} valueUnit="XP" variant="xp" />
            <p className="mt-2 text-xs text-slate-500">Progress will begin when you complete your first real-life quest.</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: "easeOut" }}
          aria-labelledby="stats-title"
          className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-5 shadow-xl backdrop-blur-md sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Character foundation</p>
              <h2 id="stats-title" className="mt-1 text-xl font-black text-white">Starting stats</h2>
            </div>
            <Star className="h-5 w-5 text-rpg-gold" />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            {startingStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.name} className="rounded-2xl border border-white/8 bg-black/15 p-3.5">
                  <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    {stat.name}
                  </dt>
                  <dd className={`mt-2 font-mono text-2xl font-black ${stat.color}`}>{stat.value}</dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-500">Presentational starting values — your growth system will take shape as you play.</p>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
        aria-labelledby="quests-title"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Your chosen domains</p>
            <h2 id="quests-title" className="mt-1 text-2xl font-black text-white">Active goals</h2>
          </div>
          <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200">
            {goals.length} {goals.length === 1 ? "new quest" : "new quests"}
          </span>
        </div>
        {goals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal, index) => (
              <motion.article
                key={goal}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.24 + index * 0.05, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/85 p-5 shadow-lg transition-colors hover:border-purple-400/40"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.14),transparent_42%)] opacity-70 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">New Quest</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{goal}</h3>
                  <p className="mt-1 text-sm text-slate-400">Your first chapter in {goal.toLowerCase()} is waiting to be defined.</p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <span className="font-mono text-xs text-slate-400">0% progress</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rpg-gold">
                      <Sparkles className="h-3.5 w-3.5" />
                      +50 XP preview
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-rpg-surface-border bg-rpg-surface/60 p-6 text-center text-sm text-slate-400">
            Your path is chosen. Select your goals during onboarding to populate your first quests.
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28, ease: "easeOut" }}
        aria-labelledby="journey-title"
        className="rounded-3xl border border-rpg-surface-border bg-gradient-to-r from-rpg-surface-card via-rpg-surface to-rpg-surface-card p-5 shadow-xl sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Journey progress</p>
            <h2 id="journey-title" className="mt-1 text-2xl font-black text-white">Your journey begins here.</h2>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center lg:gap-2" aria-label="Onboarding progress">
            {journeySteps.map((step, index) => (
              <li key={step.label} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${step.complete ? "border-indigo-300/50 bg-indigo-400 text-rpg-void shadow-[0_0_16px_rgba(129,140,248,.35)]" : "border-white/15 bg-black/20 text-slate-500"}`}>
                  {step.complete ? <Check className="h-4 w-4 stroke-[3]" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-300">
                  <span className="font-bold text-white">{step.label}</span> — {step.detail}
                </span>
                {index < journeySteps.length - 1 && <ChevronRight className="ml-1 hidden h-4 w-4 text-slate-600 lg:block" />}
              </li>
            ))}
            <li className="flex items-center gap-2 sm:col-span-2 lg:ml-2 lg:pl-3 lg:border-l lg:border-rpg-surface-border">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-300">
                <ChevronRight className="h-4 w-4" />
              </div>
              <span className="whitespace-nowrap text-xs font-semibold text-purple-200">Next — Complete your first quest</span>
            </li>
          </ol>
        </div>
      </motion.section>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md" role="status">
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">Preparing your adventure...</p>
    </div>
  );
}

function OnboardingRequiredState() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-rpg-surface-border bg-rpg-surface/85 px-6 py-14 text-center shadow-2xl backdrop-blur-md sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.2),transparent_52%)]" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/10 text-purple-200 shadow-[0_0_30px_rgba(139,92,246,.2)]">
          <Swords className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-3xl font-black text-white">Your adventure awaits</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Complete onboarding to choose your path and set the goals that will become your first real-life quests.
        </p>
        <Link href="/onboarding" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rpg-gold px-5 py-3 text-sm font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110">
          Begin onboarding
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
