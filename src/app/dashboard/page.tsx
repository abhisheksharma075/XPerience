import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/profile';
import { getQuests } from '@/lib/quests';
import { calculateLevelProgress } from '@/lib/levelSystem';
import SignOutButton from './sign-out-button';
import ProfileForm from './profile-form';
import QuestManager from './quest-manager';
import AttributeManager from './attribute-manager';
import ShopManager from './shop-manager';
import InventoryManager from './inventory-manager';
import { getStreakStatus } from '@/lib/streaks';
import { getGoldTransactions } from '@/lib/goldEngine';
import { getActiveShopItems } from '@/lib/shop';
import { getUserInventory } from '@/lib/inventory';

export const metadata = {
  title: 'Character Dashboard & Quests — XPerience',
  description: 'View character profile, stats, and manage RPG quests',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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
    username: user.email?.split('@')[0] || 'player',
    display_name: user.email?.split('@')[0] || 'Player',
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
    .from('quest_completions')
    .select('completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
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

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black font-sans">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              XPerience
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
              Level {activeProfile.level}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">
              {activeProfile.display_name || user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Character Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-3xl font-bold text-zinc-700 dark:text-zinc-300 overflow-hidden shrink-0">
              {activeProfile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeProfile.avatar_url}
                  alt={activeProfile.display_name || 'Character Avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                (activeProfile.display_name || 'P').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  {activeProfile.display_name || 'Adventurer'}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                  @{activeProfile.username || 'hero'}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate">
                User ID: {user.id}
              </p>
            </div>
          </div>

          {/* Primary Progression Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Level
              </span>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeProfile.level}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Experience
              </span>
              <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {activeProfile.xp} XP
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Gold
              </span>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {activeProfile.gold} G
              </p>
              {recentGold && recentGold.length > 0 ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5 truncate">
                  +{recentGold[0].amount} G latest reward
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                  Shop ready
                </span>
              )}
            </div>
          </div>

          {/* XP Level Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <span>Level {progress.currentLevel} Progress ({progress.progressPercentage}%)</span>
              <span>{progress.currentLevelXp} / {progress.xpForNextLevel} XP</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
            <div className="text-right text-[11px] text-zinc-400 dark:text-zinc-500">
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
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Adventure Streaks</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold">
                  Daily Habit
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Complete at least one quest every day to maintain and build your streak
              </p>
            </div>
            {streakStatus.completedToday ? (
              <span className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1">
                <span>🔥</span>
                <span>Completed Today</span>
              </span>
            ) : streakStatus.activeStreak > 0 ? (
              <span className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                <span>⚡</span>
                <span>Active Streak</span>
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Streak</span>
              <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
                {activeProfile.current_streak} days
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Longest Streak</span>
              <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
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
      </main>
    </div>
  );
}
