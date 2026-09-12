"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Crown,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  Brain,
  Heart,
  Plus,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import { calculateLevelProgress } from "@/lib/levelSystem";
import { updateAttributes } from "@/lib/attributes";
import { getStreakStatus } from "@/lib/streaks";
import { getOnboardingData } from "@/lib/onboarding";

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

export default function StatsPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [heroName, setHeroName] = useState("Adventurer");
  const [pathName, setPathName] = useState("Warrior");
  const [strength, setStrength] = useState(1);
  const [intelligence, setIntelligence] = useState(1);
  const [discipline, setDiscipline] = useState(1);
  const [vitality, setVitality] = useState(1);

  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [gold, setGold] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);

  const [isAllocating, setIsAllocating] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?redirectedFrom=/stats");
          return;
        }

        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const onboarding = getOnboardingData();

        if (profile) {
          setHeroName(
            profile.display_name ||
              onboarding.name ||
              user.email?.split("@")[0] ||
              "Hero"
          );
          setStrength(profile.strength || 1);
          setIntelligence(profile.intelligence || 1);
          setDiscipline(profile.discipline || 1);
          setVitality(profile.vitality || 1);
          setXp(profile.xp || 0);
          setGold(profile.gold || 0);
          setCurrentStreak(profile.current_streak || 0);
          setLongestStreak(profile.longest_streak || 0);

          const progress = calculateLevelProgress(profile.xp || 0);
          setLevel(progress.currentLevel);

          // Check streak completion
          const { data: latestComp } = await supabase
            .from("quest_completions")
            .select("completed_at")
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const streakData = getStreakStatus(
            latestComp?.completed_at || null,
            profile.current_streak || 0,
            profile.longest_streak || 0
          );
          setCompletedToday(streakData.completedToday);
        }

        if (onboarding.path) {
          setPathName(onboarding.path);
        }
      } catch (err) {
        console.error("Failed loading stats:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadStats();
  }, [router]);

  const handleTrainAttribute = async (attr: "strength" | "intelligence" | "discipline" | "vitality") => {
    if (!userId || isAllocating) return;

    setIsAllocating(attr);
    setFeedbackMessage(null);

    const supabase = createClient();
    const newValues = {
      strength: attr === "strength" ? strength + 1 : strength,
      intelligence: attr === "intelligence" ? intelligence + 1 : intelligence,
      discipline: attr === "discipline" ? discipline + 1 : discipline,
      vitality: attr === "vitality" ? vitality + 1 : vitality,
    };

    const result = await updateAttributes(supabase, userId, newValues);

    if (result.attributes) {
      if (attr === "strength") setStrength((v) => v + 1);
      if (attr === "intelligence") setIntelligence((v) => v + 1);
      if (attr === "discipline") setDiscipline((v) => v + 1);
      if (attr === "vitality") setVitality((v) => v + 1);
      setFeedbackMessage(`+1 ${attr.toUpperCase()} forged through deliberate focus!`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      setFeedbackMessage(result.error || "Failed to upgrade attribute");
    }

    setIsAllocating(null);
  };

  if (!isLoaded) {
    return <StatsLoadingState />;
  }

  const selectedPath = pathDetails[pathName] || pathDetails.Warrior;
  const progress = calculateLevelProgress(xp);

  const coreAttributes = [
    {
      key: "strength" as const,
      name: "Strength",
      value: strength,
      icon: Dumbbell,
      colorClass: "text-rose-400",
      borderClass: "border-rose-500/30",
      bgClass: "bg-rose-500/10",
      glowClass: "hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]",
      progressVariant: "health" as const,
      description: "Governs physical power, athletic stamina, and body resilience.",
    },
    {
      key: "intelligence" as const,
      name: "Intelligence",
      value: intelligence,
      icon: Brain,
      colorClass: "text-cyan-400",
      borderClass: "border-cyan-500/30",
      bgClass: "bg-cyan-500/10",
      glowClass: "hover:shadow-[0_0_25px_rgba(56,189,248,0.2)]",
      progressVariant: "mana" as const,
      description: "Enhances mental clarity, deep work concentration, and problem solving.",
    },
    {
      key: "discipline" as const,
      name: "Discipline",
      value: discipline,
      icon: Target,
      colorClass: "text-amber-400",
      borderClass: "border-amber-500/30",
      bgClass: "bg-amber-500/10",
      glowClass: "hover:shadow-[0_0_25px_rgba(251,191,36,0.2)]",
      progressVariant: "gold" as const,
      description: "Sustains habit continuity, impulse mastery, and perseverance.",
    },
    {
      key: "vitality" as const,
      name: "Vitality",
      value: vitality,
      icon: Heart,
      colorClass: "text-emerald-400",
      borderClass: "border-emerald-500/30",
      bgClass: "bg-emerald-500/10",
      glowClass: "hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
      progressVariant: "xp" as const,
      description: "Stress resistance, stamina recovery, and habit momentum.",
    },
  ];

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
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard Hub
          </Link>

          <div className="mt-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
              <BarChart3 className="h-3.5 w-3.5 text-purple-300" />
              Character Sheet & Attributes
            </div>
            <h1
              id="stats-title"
              className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl"
            >
              Your Stats
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              These attributes represent your real-life mastery. Every quest you
              conquer and attribute you train directly shapes your PostgreSQL
              character sheet.
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
                <h2
                  id="hero-summary-title"
                  className="text-2xl font-black tracking-tight text-white sm:text-3xl"
                >
                  {heroName}
                </h2>
                <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-200">
                  {pathName} Archetype
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {selectedPath.description} • {gold} Gold in Treasury
              </p>
            </div>
          </div>

          {/* Level Progress Box */}
          <div className="w-full md:max-w-xs rounded-xl border border-rpg-surface-border bg-rpg-void/60 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                <Sparkles className="h-3.5 w-3.5 text-rpg-gold" />
                Level {String(level).padStart(2, "0")}
              </div>
              <div className="font-mono text-xs font-bold text-rpg-gold">
                {progress.currentLevelXp}{" "}
                <span className="text-slate-500">/</span>{" "}
                <span className="text-slate-400">
                  {progress.xpForNextLevel} XP
                </span>
              </div>
            </div>
            <div className="mt-2.5">
              <ProgressBar
                label="Level Progress"
                value={progress.currentLevelXp}
                max={progress.xpForNextLevel}
                showValueText={false}
                size="sm"
                variant="xp"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {progress.xpToNextLevel} XP needed to reach Level {level + 1}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-rpg-gold/40 bg-rpg-surface-elevated p-4 text-xs font-semibold text-amber-300 shadow-gold-glow flex items-center justify-between"
        >
          <span>{feedbackMessage}</span>
          <Sparkles className="h-4 w-4 text-rpg-gold animate-pulse" />
        </motion.div>
      )}

      {/* 3. CORE ATTRIBUTES */}
      <section aria-labelledby="core-stats-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
              Pillars of Mastery
            </p>
            <h2 id="core-stats-title" className="mt-1 text-2xl font-black text-white">
              Character Attributes
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click + to train an attribute
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coreAttributes.map((stat, idx) => {
            const Icon = stat.icon;
            const isThisAllocating = isAllocating === stat.key;

            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.1 + idx * 0.05,
                  ease: "easeOut",
                }}
                className={`group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/85 p-5 shadow-lg transition-all duration-300 ${stat.borderClass} ${stat.glowClass}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${stat.borderClass} ${stat.bgClass} ${stat.colorClass} shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-3xl font-black tracking-tight text-white">
                      {stat.value}
                    </span>
                    <button
                      type="button"
                      disabled={Boolean(isAllocating)}
                      onClick={() => handleTrainAttribute(stat.key)}
                      title={`Train ${stat.name}`}
                      className="p-1.5 rounded-lg border border-rpg-surface-border bg-black/40 text-slate-300 hover:border-rpg-gold hover:text-rpg-gold disabled:opacity-50 transition-colors"
                    >
                      {isThisAllocating ? (
                        <Sparkles className="h-3.5 w-3.5 animate-spin text-rpg-gold" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    {stat.name}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400 min-h-[40px]">
                    {stat.description}
                  </p>
                </div>

                <div className="mt-4 border-t border-white/5 pt-3">
                  <ProgressBar
                    label={`${stat.name} Mastery`}
                    value={stat.value}
                    max={50}
                    showValueText={false}
                    size="sm"
                    variant={stat.progressVariant}
                  />
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Rank: Novice</span>
                    <span>{stat.value} / 50 pts</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. HABIT STREAK MOMENTUM */}
      <section
        aria-labelledby="streaks-title"
        className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/85 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              Habit Streaks & Discipline Momentum
            </div>
            <h2 id="streaks-title" className="mt-2 text-2xl font-black text-white">
              Daily Quest Consistency
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Streaks are preserved and calculated server-side in UTC every time you
              complete a quest.
            </p>
          </div>

          {completedToday ? (
            <span className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5">
              <span>🔥</span>
              <span>Completed Today</span>
            </span>
          ) : (
            <span className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5">
              <span>⚡</span>
              <span>Quest Pending Today</span>
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-rpg-surface-border bg-black/30 p-5">
            <span className="text-xs font-semibold text-slate-400">
              Current Streak
            </span>
            <p className="mt-2 text-3xl font-black text-rose-400">
              {currentStreak} Days
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Complete at least one quest before midnight UTC to advance
            </p>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-black/30 p-5">
            <span className="text-xs font-semibold text-slate-400">
              Longest Historic Streak
            </span>
            <p className="mt-2 text-3xl font-black text-amber-400">
              {longestStreak} Days
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Your highest unbroken discipline chain
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatsLoadingState() {
  return (
    <div
      className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md"
      role="status"
    >
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">
        Loading character sheet from database...
      </p>
    </div>
  );
}
