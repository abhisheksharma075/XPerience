"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Crosshair,
  Crown,
  Dumbbell,
  Flame,
  Heart,
  Sparkles,
  Target,
  WandSparkles,
  Wind,
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

const coreStats = [
  {
    name: "Strength",
    value: 24,
    icon: Dumbbell,
    colorClass: "text-rose-400",
    borderClass: "border-rose-500/30 group-hover:border-rose-400/60",
    bgClass: "bg-rose-500/10",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]",
    progressVariant: "health" as const,
    description: "Governs physical power, athletic stamina, and body resilience.",
  },
  {
    name: "Focus",
    value: 31,
    icon: Crosshair,
    colorClass: "text-cyan-400",
    borderClass: "border-cyan-500/30 group-hover:border-cyan-400/60",
    bgClass: "bg-cyan-500/10",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(56,189,248,0.2)]",
    progressVariant: "mana" as const,
    description: "Enhances mental clarity, deep work concentration, and attention control.",
  },
  {
    name: "Creativity",
    value: 28,
    icon: WandSparkles,
    colorClass: "text-fuchsia-400",
    borderClass: "border-fuchsia-500/30 group-hover:border-fuchsia-400/60",
    bgClass: "bg-fuchsia-500/10",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(217,70,239,0.2)]",
    progressVariant: "xp" as const,
    description: "Drives lateral problem-solving, artistic ideation, and expressive output.",
  },
  {
    name: "Discipline",
    value: 35,
    icon: Target,
    colorClass: "text-amber-400",
    borderClass: "border-amber-500/30 group-hover:border-amber-400/60",
    bgClass: "bg-amber-500/10",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(251,191,36,0.2)]",
    progressVariant: "gold" as const,
    description: "Sustains habit continuity, impulse mastery, and perseverance.",
  },
];

const attributes = [
  {
    name: "Vitality",
    value: 22,
    max: 40,
    icon: Heart,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    detail: "Stamina recovery & streak resilience",
  },
  {
    name: "Wisdom",
    value: 26,
    max: 40,
    icon: Brain,
    color: "text-sky-400",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    detail: "Insight synthesis & skill retention",
  },
  {
    name: "Agility",
    value: 19,
    max: 40,
    icon: Wind,
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    detail: "Context switching & task velocity",
  },
  {
    name: "Willpower",
    value: 30,
    max: 40,
    icon: Flame,
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    detail: "Stress resistance & quest resolve",
  },
];

export default function StatsPage() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <StatsLoadingState />;
  }

  const name = typeof onboardingData?.name === "string" ? onboardingData.name.trim() : "";
  const path = typeof onboardingData?.path === "string" ? onboardingData.path : "";
  const goals = Array.isArray(onboardingData?.goals)
    ? onboardingData.goals.filter((goal): goal is string => typeof goal === "string")
    : [];

  const heroName = name || "New Adventurer";
  const selectedPath = path ? pathDetails[path] : undefined;
  const pathName = selectedPath?.name || path || "Unchosen Path";

  return (
    <div className="space-y-7 pb-8 sm:space-y-8">
      {/* 1. TOP HEADER */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        aria-labelledby="stats-title"
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
              <BarChart3 className="h-3.5 w-3.5 text-purple-300" />
              Character Profile
            </div>
            <h1 id="stats-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Your Stats</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              These stats represent the life disciplines and domains you are cultivating through daily deliberate actions.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 2. HERO SUMMARY CARD */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        aria-labelledby="hero-summary-title"
        className="relative overflow-hidden rounded-2xl border border-purple-400/25 bg-rpg-surface/85 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        {selectedPath?.image && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 hidden h-56 w-56 rounded-full bg-cover bg-center opacity-15 md:block"
            style={{ backgroundImage: `url('${selectedPath.image}')` }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rpg-surface via-rpg-surface/95 to-transparent" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-rpg-gold/40 bg-rpg-gold/10 text-rpg-gold shadow-[0_0_25px_rgba(212,175,55,0.25)]">
              <Crown className="h-8 w-8 text-rpg-gold" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="hero-summary-title" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {heroName}
                </h2>
                <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-200">
                  {pathName}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {selectedPath?.description || "Forging character and leveling life domains through consistent execution."}
              </p>
            </div>
          </div>

          {/* Presentational Level 2 Baseline Box */}
          <div className="w-full md:max-w-xs rounded-xl border border-rpg-surface-border bg-rpg-void/60 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                <Sparkles className="h-3.5 w-3.5 text-rpg-gold" />
                Level 02
              </div>
              <div className="font-mono text-xs font-bold text-rpg-gold">
                0 <span className="text-slate-500">/</span> <span className="text-slate-400">100 XP</span>
              </div>
            </div>
            <div className="mt-2.5">
              <ProgressBar
                label="Level Progress"
                value={0}
                max={100}
                showValueText={false}
                size="sm"
                variant="xp"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Tier 1 baseline • Complete quests to gain experience</p>
          </div>
        </div>
      </motion.section>

      {/* 3. CORE STATS */}
      <section aria-labelledby="core-stats-title">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Pillars of Mastery</p>
          <h2 id="core-stats-title" className="mt-1 text-2xl font-black text-white">Core Stats</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coreStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + idx * 0.05, ease: "easeOut" }}
                className={`group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/85 p-5 shadow-lg transition-all duration-300 ${stat.borderClass} ${stat.glowClass}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${stat.borderClass} ${stat.bgClass} ${stat.colorClass} shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-3xl font-black tracking-tight text-white">{stat.value}</span>
                    <span className="ml-1 text-[11px] font-bold text-slate-500">/ 100</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{stat.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400 min-h-[40px]">{stat.description}</p>
                </div>

                <div className="mt-4 border-t border-white/5 pt-3">
                  <ProgressBar
                    label={`${stat.name} progress`}
                    value={stat.value}
                    max={100}
                    showValueText={false}
                    size="sm"
                    variant={stat.progressVariant}
                  />
                  <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Baseline Score</span>
                    <span className="text-slate-400">{stat.value}% Mastery</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. LIFE DOMAIN PROGRESS */}
      <section aria-labelledby="life-domains-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Active Disciplines</p>
            <h2 id="life-domains-title" className="mt-1 text-2xl font-black text-white">Life Domain Progress</h2>
          </div>
          {goals.length > 0 && (
            <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
              {goals.length} {goals.length === 1 ? "Domain" : "Domains"} Selected
            </span>
          )}
        </div>

        {goals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal, idx) => {
              // Presentational progress values for aesthetic realism
              const domainProgressValues = [65, 50, 75, 45, 80, 60];
              const progress = domainProgressValues[idx % domainProgressValues.length];

              return (
                <motion.article
                  key={goal}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: "easeOut" }}
                  className="group relative min-h-[220px] overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/85 p-5 shadow-lg transition-all duration-300 hover:border-purple-400/40"
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
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-300/25 bg-purple-500/10 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-200">
                        Tier 1
                      </span>
                    </div>

                    <div className="mt-auto pt-6">
                      <h3 className="text-lg font-black text-white">{goal}</h3>
                      <p className="mt-1 text-xs text-slate-400">Active questing domain leveling up your hero archetype.</p>

                      <div className="mt-4 border-t border-white/10 pt-3">
                        <ProgressBar
                          label={`${goal} Mastery`}
                          value={progress}
                          max={100}
                          showValueText={false}
                          size="sm"
                          variant="xp"
                        />
                        <div className="mt-2.5 flex items-center justify-between text-xs">
                          <span className="font-mono text-xs text-purple-300">{progress}% mastery</span>
                          <span className="inline-flex items-center gap-1 font-bold text-rpg-gold text-xs">
                            <Sparkles className="h-3 w-3" />
                            +100 XP Earned
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/60 p-8 text-center backdrop-blur-md">
            <BookOpen className="mx-auto h-8 w-8 text-purple-300" />
            <h3 className="mt-3 text-lg font-bold text-white">No Life Domains Selected</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400">
              Choose the life goals you want to level up during onboarding to track your domain mastery here.
            </p>
            <div className="mt-5">
              <Link
                href="/onboarding/goals"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600/20 border border-purple-400/30 px-4 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-600/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Choose Goals
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. RPG ATTRIBUTE PANEL */}
      <section aria-labelledby="attributes-title">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">RPG Traits</p>
          <h2 id="attributes-title" className="mt-1 text-2xl font-black text-white">Character Attributes</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {attributes.map((attr, idx) => {
            const Icon = attr.icon;
            const percentage = Math.round((attr.value / attr.max) * 100);
            return (
              <motion.div
                key={attr.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + idx * 0.05, ease: "easeOut" }}
                className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/75 p-4 backdrop-blur-md transition hover:border-purple-400/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${attr.border} ${attr.bg} ${attr.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{attr.name}</h4>
                      <p className="text-[10px] text-slate-400">{attr.detail}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-lg font-black text-white">{attr.value}</span>
                    <span className="text-[10px] text-slate-500">/{attr.max}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-rpg-surface-elevated">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 6. FOOTER NOTE */}
      <div className="pt-2 text-center">
        <p className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Dynamic attribute scaling, stat multipliers, and database persistence will be connected in a future backend stage.
        </p>
      </div>
    </div>
  );
}

function StatsLoadingState() {
  return (
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md" role="status">
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">Loading character stats...</p>
    </div>
  );
}
