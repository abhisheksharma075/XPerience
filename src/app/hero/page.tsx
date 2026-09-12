"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Crosshair,
  Crown,
  Dumbbell,
  Flame,
  Scroll,
  Shield,
  Sparkles,
  Swords,
  Target,
  User,
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

const pathStories: Record<string, string> = {
  Warrior:
    "You chose the path of strength, discipline, and resilience. Every challenge is another chance to become stronger.",
  Sage:
    "You chose the path of knowledge, focus, and growth. Every lesson sharpens the mind and expands what you can become.",
  Creator:
    "You chose the path of creativity, productivity, and impact. Every idea is a chance to turn imagination into something real.",
};

const defaultStory =
  "Your hero's story is waiting to be written. Choose your path and embark upon your daily quests to discover the legend you are becoming.";

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

const heroAttributes = [
  {
    name: "Strength",
    value: 24,
    icon: Dumbbell,
    colorClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-500/10",
    progressVariant: "health" as const,
  },
  {
    name: "Focus",
    value: 31,
    icon: Crosshair,
    colorClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    bgClass: "bg-cyan-500/10",
    progressVariant: "mana" as const,
  },
  {
    name: "Creativity",
    value: 28,
    icon: WandSparkles,
    colorClass: "text-fuchsia-400",
    borderClass: "border-fuchsia-500/30",
    bgClass: "bg-fuchsia-500/10",
    progressVariant: "xp" as const,
  },
  {
    name: "Discipline",
    value: 35,
    icon: Target,
    colorClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/10",
    progressVariant: "gold" as const,
  },
];

const loadoutSlots = [
  {
    type: "Weapon",
    label: "Main Hand",
    icon: Swords,
    status: "Slot Empty",
    description: "Primary offensive armament",
  },
  {
    type: "Armor",
    label: "Torso Defense",
    icon: Shield,
    status: "Slot Empty",
    description: "Body armor & protection",
  },
  {
    type: "Accessory",
    label: "Talisman",
    icon: Sparkles,
    status: "Slot Empty",
    description: "Amulet or stat enhancer",
  },
  {
    type: "Relic",
    label: "Ancient Keystone",
    icon: Flame,
    status: "Slot Empty",
    description: "Legendary passive amplifier",
  },
];

export default function HeroPage() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <HeroLoadingState />;
  }

  const name = typeof onboardingData?.name === "string" ? onboardingData.name.trim() : "";
  const path = typeof onboardingData?.path === "string" ? onboardingData.path : "";
  const goals = Array.isArray(onboardingData?.goals)
    ? onboardingData.goals.filter((goal): goal is string => typeof goal === "string")
    : [];

  const heroName = name || "New Adventurer";
  const selectedPath = path ? pathDetails[path] : undefined;
  const pathName = selectedPath?.name || path || "Unchosen Path";
  const pathDescription = selectedPath?.description || "Forging destiny through daily discipline.";
  const storyText = selectedPath ? pathStories[selectedPath.name] || defaultStory : defaultStory;

  return (
    <div className="space-y-7 pb-8 sm:space-y-8">
      {/* 1. TOP HEADER */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        aria-labelledby="hero-title"
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
              <User className="h-3.5 w-3.5 text-purple-300" />
              Hero Profile
            </div>
            <h1 id="hero-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Your Hero</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              This is the character you are becoming through the choices you make every day.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 2. HERO IDENTITY / CINEMATIC CHARACTER CARD */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        aria-labelledby="hero-card-title"
        className="relative overflow-hidden rounded-3xl border border-purple-400/25 bg-rpg-surface/85 shadow-2xl backdrop-blur-xl"
      >
        {/* Cinematic Path Artwork Overlay */}
        {selectedPath?.image && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-30 md:block lg:w-2/5"
            style={{ backgroundImage: `url('${selectedPath.image}')` }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rpg-surface via-rpg-surface/95 to-rpg-surface/40 md:to-transparent" />

        <div className="relative p-6 sm:p-9 lg:p-10">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-rpg-gold/40 bg-rpg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rpg-gold">
                Rank: Rising Hero
              </span>
              <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
                Archetype: {pathName}
              </span>
            </div>

            <h2 id="hero-card-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {heroName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-purple-200/90 sm:text-base">
              {pathDescription}
            </p>

            {/* Level & XP Progression Bar */}
            <div className="mt-8 rounded-2xl border border-purple-400/25 bg-rpg-void/70 p-5 shadow-inner backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-rpg-gold/40 bg-rpg-gold/15 text-rpg-gold shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                    <Crown className="h-4 w-4 text-rpg-gold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hero Rank</span>
                    <p className="font-mono text-xs font-black uppercase text-white">Level 01</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
                  <p className="font-mono text-xs font-bold text-rpg-gold">
                    0 <span className="text-slate-500">/</span> <span className="text-slate-400">100 XP</span>
                  </p>
                </div>
              </div>

              <div className="mt-3.5">
                <ProgressBar
                  label="Hero Level Progress"
                  value={0}
                  max={100}
                  showValueText={false}
                  size="sm"
                  variant="xp"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                <span>Tier 1 Baseline</span>
                <span>Next Milestone: Level 2</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. HERO STATUS RIBBON */}
      <section aria-labelledby="hero-status-title">
        <h2 id="hero-status-title" className="sr-only">Hero Status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level</span>
            <p className="mt-1 font-mono text-2xl font-black text-white">01</p>
            <span className="text-[10px] text-purple-300">Active Tier</span>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hero Rank</span>
            <p className="mt-1 text-sm font-black text-rpg-gold truncate">Rising Hero</p>
            <span className="text-[10px] text-slate-500">Novice Adventurer</span>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Session XP</span>
            <p className="mt-1 font-mono text-2xl font-black text-rpg-gold">0<span className="text-sm font-normal text-slate-500">/100</span></p>
            <span className="text-[10px] text-slate-500">Level Baseline</span>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Quests</span>
            <p className="mt-1 font-mono text-2xl font-black text-purple-200">2</p>
            <span className="text-[10px] text-slate-500">In Progress</span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <p className="mt-1 font-mono text-2xl font-black text-emerald-400">2</p>
            <span className="text-[10px] text-slate-500">Quests Mastered</span>
          </div>
        </div>
      </section>

      {/* 4. CHARACTER STORY */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        aria-labelledby="journey-title"
        className="relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-6 shadow-lg backdrop-blur-md sm:p-7"
      >
        <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/15 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Scroll className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Narrative Lore</p>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{pathName}</span>
            </div>
            <h2 id="journey-title" className="mt-1 text-xl font-black text-white sm:text-2xl">Your Journey</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {storyText}
            </p>
          </div>
        </div>
      </motion.section>

      {/* 5. SELECTED LIFE DOMAINS */}
      <section aria-labelledby="domains-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Domains of Growth</p>
            <h2 id="domains-title" className="mt-1 text-2xl font-black text-white">Selected Life Domains</h2>
          </div>
          {goals.length > 0 && (
            <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
              {goals.length} Active {goals.length === 1 ? "Domain" : "Domains"}
            </span>
          )}
        </div>

        {goals.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal, idx) => {
              const domainProgressValues = [65, 50, 75, 45, 80, 60];
              const progress = domainProgressValues[idx % domainProgressValues.length];

              return (
                <motion.div
                  key={goal}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: "easeOut" }}
                  className="group relative min-h-[190px] overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/85 p-5 shadow-lg transition-all duration-300 hover:border-purple-400/40"
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-200">
                        Active Domain
                      </span>
                    </div>

                    <div className="mt-auto pt-5">
                      <h3 className="text-base font-black text-white">{goal}</h3>
                      <div className="mt-3 border-t border-white/10 pt-2.5">
                        <ProgressBar
                          label={`${goal} Progress`}
                          value={progress}
                          max={100}
                          showValueText={false}
                          size="sm"
                          variant="xp"
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-purple-300">{progress}% mastery</span>
                          <span className="font-bold text-rpg-gold">+100 XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/60 p-8 text-center backdrop-blur-md">
            <BookOpen className="mx-auto h-8 w-8 text-purple-300" />
            <h3 className="mt-3 text-lg font-bold text-white">No Life Domains Selected</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400">
              Select your initial life focus areas in onboarding to establish your hero's quest domains.
            </p>
            <div className="mt-5">
              <Link
                href="/onboarding/goals"
                className="inline-flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-600/20 px-4 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-600/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Choose Goals
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 6. HERO ATTRIBUTES */}
      <section aria-labelledby="attributes-title">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Baseline Ratings</p>
          <h2 id="attributes-title" className="mt-1 text-2xl font-black text-white">Hero Attributes</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroAttributes.map((attr, idx) => {
            const Icon = attr.icon;
            return (
              <motion.div
                key={attr.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + idx * 0.05, ease: "easeOut" }}
                className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/85 p-5 backdrop-blur-md transition hover:border-purple-400/35"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${attr.borderClass} ${attr.bgClass} ${attr.colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-2xl font-black text-white">{attr.value}</span>
                    <span className="text-xs font-bold text-slate-500"> / 100</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">{attr.name}</h3>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    label={`${attr.name} scale`}
                    value={attr.value}
                    max={100}
                    showValueText={false}
                    size="sm"
                    variant={attr.progressVariant}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 7. HERO EQUIPMENT / LOADOUT PREVIEW */}
      <section aria-labelledby="loadout-title">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Inventory Readiness</p>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Stage 7 Preview
            </span>
          </div>
          <h2 id="loadout-title" className="mt-1 text-2xl font-black text-white">Current Loadout</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loadoutSlots.map((slot, idx) => {
            const Icon = slot.icon;
            return (
              <motion.div
                key={slot.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 + idx * 0.05, ease: "easeOut" }}
                className="group relative rounded-2xl border border-dashed border-rpg-surface-border bg-rpg-surface/60 p-5 backdrop-blur-md transition-all duration-200 hover:border-purple-400/40 hover:bg-rpg-surface/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{slot.label}</span>
                  <span className="rounded-full border border-white/5 bg-black/20 px-2 py-0.5 text-[9px] font-mono text-slate-500">
                    {slot.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-col items-center justify-center py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-rpg-surface-elevated/80 text-slate-500 transition-colors group-hover:border-purple-400/30 group-hover:text-purple-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-300">{slot.type}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">{slot.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 8. FOOTER NOTE */}
      <div className="pt-2 text-center">
        <p className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Your hero evolves as your real-life actions become quests, progress becomes XP, and consistency becomes strength.
        </p>
      </div>
    </div>
  );
}

function HeroLoadingState() {
  return (
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md" role="status">
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">Summoning your hero profile...</p>
    </div>
  );
}
