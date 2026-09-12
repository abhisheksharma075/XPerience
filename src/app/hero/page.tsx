"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  Flame,
  Scroll,
  Shield,
  Sparkles,
  Swords,
  User,
  Zap,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import { calculateLevelProgress } from "@/lib/levelSystem";
import { getQuests } from "@/lib/quests";
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

const pathStories: Record<string, string> = {
  Warrior:
    "You chose the Path of the Warrior. You understand that motivation is fleeting, but discipline is unbreakable. Every day is a battleground of choices, and you choose to show up, train your mind and body, and conquer resistance.",
  Sage:
    "You chose the Path of the Sage. You perceive that true power is born from understanding. You seek truth, cultivate mental clarity, and transform scattered thoughts into profound wisdom that illuminates your way.",
  Creator:
    "You chose the Path of the Creator. You recognize that the future belongs to those who build. You translate raw inspiration into tangible reality, shipping projects and turning dreams into monuments of purpose.",
};

const defaultStory =
  "Your hero journey has begun. Every quest you conquer and habit you forge will write the next chapter of your legend.";

const heroLoadout = [
  {
    type: "Weapon",
    label: "Iron Willblade",
    icon: Swords,
    status: "Equipped",
    description: "Primary offensive armament",
  },
  {
    type: "Armor",
    label: "Aegis of Habit",
    icon: Shield,
    status: "Equipped",
    description: "Protective cuirass of daily consistency",
  },
  {
    type: "Focus Trinket",
    label: "Prism of Clarity",
    icon: Zap,
    status: "Equipped",
    description: "Amulet for mental focus",
  },
  {
    type: "Relic",
    label: "Ancient Keystone",
    icon: Flame,
    status: "Slot Ready",
    description: "Legendary passive amplifier",
  },
];

export default function HeroPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  const [heroName, setHeroName] = useState("Hero");
  const [pathName, setPathName] = useState("Warrior");
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(0);
  const [activeQuestsCount, setActiveQuestsCount] = useState(0);
  const [completedQuestsCount, setCompletedQuestsCount] = useState(0);

  useEffect(() => {
    async function loadHeroData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?redirectedFrom=/hero");
          return;
        }

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
          setXp(profile.xp || 0);
          setGold(profile.gold || 0);

          const progress = calculateLevelProgress(profile.xp || 0);
          setLevel(progress.currentLevel);
        }

        if (onboarding.path) {
          setPathName(onboarding.path);
        }

        // Fetch quest counts
        const { quests } = await getQuests(supabase, user.id);
        if (quests) {
          setActiveQuestsCount(
            quests.filter((q) => q.status === "active").length
          );
          setCompletedQuestsCount(
            quests.filter((q) => q.status === "completed").length
          );
        }
      } catch (err) {
        console.error("Failed loading hero page:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadHeroData();
  }, [router]);

  if (!isLoaded) {
    return <HeroLoadingState />;
  }

  const selectedPath = pathDetails[pathName] || pathDetails.Warrior;
  const pathDescription =
    selectedPath.description || "Forging destiny through daily discipline.";
  const storyText = pathStories[pathName] || defaultStory;
  const progress = calculateLevelProgress(xp);

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
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard Hub
          </Link>

          <div className="mt-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
              <User className="h-3.5 w-3.5 text-purple-300" />
              Hero Chronicle
            </div>
            <h1
              id="hero-title"
              className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl"
            >
              Your Hero
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              The character you are actively becoming through your choices and
              actions every single day.
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

            <h2
              id="hero-card-title"
              className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl"
            >
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Hero Rank
                    </span>
                    <p className="font-mono text-xs font-black uppercase text-white">
                      Level {String(level).padStart(2, "0")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Progress
                  </span>
                  <p className="font-mono text-xs font-bold text-rpg-gold">
                    {progress.currentLevelXp}{" "}
                    <span className="text-slate-500">/</span>{" "}
                    <span className="text-slate-400">
                      {progress.xpForNextLevel} XP
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-3.5">
                <ProgressBar
                  label="Hero Level Progress"
                  value={progress.currentLevelXp}
                  max={progress.xpForNextLevel}
                  showValueText={false}
                  size="sm"
                  variant="xp"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>Tier {level} Progression</span>
                <span>
                  {progress.xpToNextLevel} XP to Level {level + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. HERO STATUS RIBBON */}
      <section aria-labelledby="hero-status-title">
        <h2 id="hero-status-title" className="sr-only">
          Hero Status
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Level
            </span>
            <p className="mt-1 font-mono text-2xl font-black text-white">
              {String(level).padStart(2, "0")}
            </p>
            <span className="text-[10px] text-purple-300">Active Tier</span>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Treasury
            </span>
            <p className="mt-1 font-mono text-2xl font-black text-amber-400">
              {gold} G
            </p>
            <span className="text-[10px] text-slate-500">Gold Balance</span>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total XP
            </span>
            <p className="mt-1 font-mono text-2xl font-black text-rpg-gold">
              {xp}
            </p>
            <span className="text-[10px] text-slate-500">Lifetime Earned</span>
          </div>

          <div className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Quests
            </span>
            <p className="mt-1 font-mono text-2xl font-black text-purple-200">
              {activeQuestsCount}
            </p>
            <span className="text-[10px] text-slate-500">In Progress</span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-4 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed
            </span>
            <p className="mt-1 font-mono text-2xl font-black text-emerald-400">
              {completedQuestsCount}
            </p>
            <span className="text-[10px] text-slate-500">Quests Mastered</span>
          </div>
        </div>
      </section>

      {/* 4. CHARACTER STORY & LORE */}
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
            <h2
              id="journey-title"
              className="text-base font-black text-white sm:text-lg"
            >
              The Path of {pathName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {storyText}
            </p>
          </div>
        </div>
      </motion.section>

      {/* 5. HERO LOADOUT */}
      <section aria-labelledby="gear-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
              Equipped Armament
            </p>
            <h2 id="gear-title" className="mt-1 text-2xl font-black text-white">
              Hero Loadout
            </h2>
          </div>
          <Link
            href="/inventory"
            className="text-xs text-purple-300 hover:text-white"
          >
            Manage in Inventory →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroLoadout.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.15 + idx * 0.05,
                  ease: "easeOut",
                }}
                className="group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-purple-400/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10 text-purple-200 shadow-md">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-300">
                    {item.status}
                  </span>
                </div>

                <div className="mt-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.type}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function HeroLoadingState() {
  return (
    <div
      className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md"
      role="status"
    >
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">Loading hero chronicle...</p>
    </div>
  );
}
