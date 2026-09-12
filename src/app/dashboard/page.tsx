import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { getQuests } from "@/lib/quests";
import { calculateLevelProgress } from "@/lib/levelSystem";
import SignOutButton from "./sign-out-button";
import ProfileForm from "./profile-form";
import QuestManager from "./quest-manager";
import AttributeManager from "./attribute-manager";
import ShopManager from "./shop-manager";
import InventoryManager from "./inventory-manager";
import { getStreakStatus } from "@/lib/streaks";
import { getGoldTransactions } from "@/lib/goldEngine";
import { getActiveShopItems } from "@/lib/shop";
import { getUserInventory } from "@/lib/inventory";
import {
  Sparkles,
  Crown,
  Flame,
  Coins,
  Scroll,
  BarChart3,
  Backpack,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Character Dashboard & Hub — XPerience",
  description: "View character profile, stats, and manage RPG quests, shop, and inventory",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch or initialize character profile
  const { profile } = await ensureProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  });

  // Fetch user's quests
  const { quests } = await getQuests(supabase, user.id);

  const activeProfile = profile || {
    id: user.id,
    username: user.email?.split("@")[0] || "player",
    display_name: user.email?.split("@")[0] || "Player",
    avatar_url: null,
    xp: 0,
    level: 1,
    gold: 0,
    strength: 1,
    intelligence: 1,
    discipline: 1,
    vitality: 1,
    current_streak: 0,
    longest_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Derive level and bracket progression deterministically from total XP
  const progress = calculateLevelProgress(activeProfile.xp);
  activeProfile.level = progress.currentLevel;

  // Fetch latest quest completion for streak status
  const { data: latestCompletion } = await supabase
    .from("quest_completions")
    .select("completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const streakStatus = getStreakStatus(
    latestCompletion?.completed_at || null,
    activeProfile.current_streak,
    activeProfile.longest_streak
  );

  // Fetch recent gold transactions for audit awareness
  const { transactions: recentGold } = await getGoldTransactions(supabase, user.id, 3);

  // Fetch active shop items
  const { items: shopItems } = await getActiveShopItems(supabase);

  // Fetch user inventory
  const { inventory } = await getUserInventory(supabase, user.id);

  const heroName = activeProfile.display_name || user.email?.split("@")[0] || "Adventurer";

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Hero Banner */}
      <section
        aria-labelledby="dashboard-title"
        className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-rpg-surface/80 px-6 py-8 shadow-[0_25px_80px_rgba(76,29,149,0.2)] backdrop-blur-xl sm:px-8 sm:py-9"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,.28),transparent_38%),radial-gradient(circle_at_85%_100%,rgba(79,70,229,.2),transparent_35%)]" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              Your adventure is underway
            </div>

            <h1 id="dashboard-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Welcome back, <span className="text-rpg-gold">{heroName}</span>
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Conquer real-life quests, level up your character attributes, earn gold, and forge your heroic journey.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/quests"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-400/30 bg-purple-500/10 text-xs font-semibold text-purple-200 hover:bg-purple-500/20 transition-colors"
              >
                <Scroll className="h-3.5 w-3.5" />
                <span>Quest Journal</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/stats"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Character Stats</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/inventory"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
              >
                <Backpack className="h-3.5 w-3.5" />
                <span>Hero Armory</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Signed in as {user.email}</span>
              <SignOutButton />
            </div>
            <div className="rounded-2xl border border-rpg-gold/30 bg-rpg-gold/10 px-4 py-2.5 text-right shadow-gold-glow">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Level</p>
              <p className="font-mono text-2xl font-black text-rpg-gold">{activeProfile.level}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Character Profile & Level Progress */}
      <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-purple-300/30 bg-gradient-to-br from-purple-500/30 to-indigo-950 text-2xl font-bold text-white shadow-[0_0_24px_rgba(139,92,246,.25)]">
            {activeProfile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeProfile.avatar_url}
                alt={heroName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Crown className="h-9 w-9 text-rpg-gold" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-white truncate">
                {heroName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-300 font-mono">
                @{activeProfile.username || "hero"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-mono truncate">
              Hero ID: {user.id}
            </p>
          </div>
        </div>

        {/* Primary Progression Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-black/30 border border-rpg-surface-border text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Level
            </span>
            <p className="mt-1 text-2xl font-black text-rpg-gold">
              {activeProfile.level}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-rpg-surface-border text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Experience
            </span>
            <p className="mt-1 text-2xl font-black text-purple-400">
              {activeProfile.xp} XP
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-rpg-surface-border text-center flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Gold
            </span>
            <p className="mt-1 text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
              <Coins className="h-5 w-5 text-amber-400 inline" />
              {activeProfile.gold} G
            </p>
            {recentGold && recentGold.length > 0 ? (
              <span className="text-[10px] text-emerald-400 font-medium block mt-0.5 truncate">
                +{recentGold[0].amount} G latest reward
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Shop ready
              </span>
            )}
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Level {progress.currentLevel} Progress ({progress.progressPercentage}%)</span>
            <span className="text-amber-300 font-mono">{progress.currentLevelXp} / {progress.xpForNextLevel} XP</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-900 border border-rpg-surface-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>
          <div className="text-right text-[11px] text-slate-400">
            {progress.xpToNextLevel} XP needed to reach Level {progress.currentLevel + 1}
          </div>
        </div>
      </div>

      {/* Character Attributes Manager */}
      <AttributeManager
        userId={user.id}
        initialAttributes={{
          strength: activeProfile.strength,
          intelligence: activeProfile.intelligence,
          discipline: activeProfile.discipline,
          vitality: activeProfile.vitality,
        }}
      />

      {/* Adventure Streaks */}
      <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-500" />
              <span>Adventure Streaks</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 font-semibold">
                Daily Habit
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete at least one quest every day to maintain and build your streak
            </p>
          </div>
          {streakStatus.completedToday ? (
            <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium flex items-center gap-1.5">
              <span>🔥</span>
              <span>Completed Today</span>
            </span>
          ) : streakStatus.activeStreak > 0 ? (
            <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-1.5">
              <span>⚡</span>
              <span>Active Streak</span>
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-black/30 border border-rpg-surface-border">
            <span className="text-xs font-medium text-slate-400">Current Streak</span>
            <p className="mt-1 text-2xl font-black text-rose-400">
              {activeProfile.current_streak} days
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-rpg-surface-border">
            <span className="text-xs font-medium text-slate-400">Longest Streak</span>
            <p className="mt-1 text-2xl font-black text-amber-400">
              {activeProfile.longest_streak} days
            </p>
          </div>
        </div>
      </div>

      {/* Quest Management System */}
      <QuestManager initialQuests={quests || []} userId={user.id} />

      {/* Adventurer's Shop */}
      <ShopManager
        initialItems={shopItems || []}
        userGold={activeProfile.gold}
        userId={user.id}
      />

      {/* Adventurer's Inventory */}
      <InventoryManager
        initialInventory={inventory || []}
        userId={user.id}
      />

      {/* Profile Edit Form */}
      <ProfileForm initialProfile={activeProfile} />
    </div>
  );
}
