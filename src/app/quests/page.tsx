"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Plus,
  Coins,
  Flame,
  X,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import {
  Quest as DbQuest,
  getQuests,
  createQuest,
  updateQuest,
} from "@/lib/quests";
import { completeQuestWorkflow } from "@/lib/questCompletionEngine";
import { calculateLevelProgress } from "@/lib/levelSystem";

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
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [quests, setQuests] = useState<DbQuest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Player RPG stats
  const [currentXp, setCurrentXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [gold, setGold] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  // Rewards and Modals
  const [levelUpEvent, setLevelUpEvent] = useState<{
    show: boolean;
    newLevel: number;
  } | null>(null);
  const [justAwardedQuestId, setJustAwardedQuestId] = useState<string | null>(
    null
  );
  const [rewardToast, setRewardToast] = useState<{
    xp: number;
    gold: number;
  } | null>(null);

  // New Quest Creation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [newXpReward, setNewXpReward] = useState<number>(50);
  const [newGoldReward, setNewGoldReward] = useState<number>(20);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch real user, profile, and quests from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?redirectedFrom=/quests");
          return;
        }

        setUserId(user.id);

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const progress = calculateLevelProgress(profile.xp || 0);
          setLevel(progress.currentLevel);
          setCurrentXp(progress.currentLevelXp);
          setGold(profile.gold || 0);
          setStreak(profile.current_streak || 0);
        }

        // Fetch user quests
        const { quests: dbQuests } = await getQuests(supabase, user.id);
        if (dbQuests) {
          setQuests(dbQuests);
        }
      } catch (err) {
        console.error("Failed loading quests:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, [router]);

  const handleStartQuest = async (questId: string) => {
    const supabase = createClient();
    const { quest: updated } = await updateQuest(supabase, questId, {
      status: "active",
    });

    if (updated) {
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, status: "active" } : q))
      );
    }
  };

  const handleCompleteQuest = async (quest: DbQuest) => {
    if (quest.status === "completed" || !userId) return;

    try {
      const supabase = createClient();
      const { result, error } = await completeQuestWorkflow(supabase, userId, quest.id);

      if (error || !result) {
        console.error("Failed to complete quest:", error);
        return;
      }

      // Optimistically update quest list
      setQuests((prev) =>
        prev.map((q) =>
          q.id === quest.id ? { ...q, status: "completed" as const } : q
        )
      );

      // Trigger reward notification
      setJustAwardedQuestId(quest.id);
      setRewardToast({
        xp: result.xpEarned || quest.xp_reward,
        gold: result.goldEarned || quest.gold_reward,
      });

      setTimeout(() => {
        setJustAwardedQuestId(null);
        setRewardToast(null);
      }, 3500);

      // Update character status
      if (result.characterState) {
        const progress = calculateLevelProgress(result.characterState.xp);
        const oldLevel = level;
        setLevel(progress.currentLevel);
        setCurrentXp(progress.currentLevelXp);
        setGold(result.characterState.gold);
        setStreak(result.characterState.currentStreak);

        // Trigger Level-up modal if level increased
        if (result.characterState.level > oldLevel) {
          setLevelUpEvent({
            show: true,
            newLevel: result.characterState.level,
          });
        }
      }
    } catch (err) {
      console.error("Error completing quest workflow:", err);
    }
  };

  const handleDismissLevelUp = () => {
    setLevelUpEvent(null);
  };

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !userId) return;

    setCreateError(null);
    const supabase = createClient();

    const { quest, error } = await createQuest(supabase, userId, {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      difficulty: newDifficulty,
      xp_reward: Number(newXpReward),
      gold_reward: Number(newGoldReward),
      status: "active",
    });

    if (error) {
      setCreateError(error);
      return;
    }

    if (quest) {
      setQuests((prev) => [quest, ...prev]);
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewDifficulty("easy");
      setNewXpReward(50);
      setNewGoldReward(20);
    }
  };

  if (!isLoaded) {
    return <LoadingState />;
  }

  const activeQuests = quests.filter((q) => q.status !== "archived");
  const completedCount = activeQuests.filter(
    (q) => q.status === "completed"
  ).length;

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
                <h2 className="text-3xl font-black text-white sm:text-4xl">
                  Level {levelUpEvent.newLevel}
                </h2>
                <p className="text-sm leading-6 text-slate-300">
                  Your real-life dedication has yielded heroic power. You
                  advanced to Level{" "}
                  {String(levelUpEvent.newLevel).padStart(2, "0")}!
                </p>
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={handleDismissLevelUp}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rpg-gold px-5 py-3 text-sm font-black text-rpg-void shadow-gold-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold"
                >
                  Continue Journey
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Quest Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border border-rpg-surface-border bg-rpg-surface/98 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-rpg-surface-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-rpg-gold" />
                  <h3 className="text-xl font-bold text-white">
                    Create New Real-Life Quest
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuest} className="mt-5 space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Quest Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Read 20 pages of non-fiction"
                    className="mt-1.5 w-full rounded-xl border border-rpg-surface-border bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rpg-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Description & Rules
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Details about what counts as completing this quest..."
                    className="mt-1.5 w-full rounded-xl border border-rpg-surface-border bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-rpg-gold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Difficulty
                    </label>
                    <select
                      value={newDifficulty}
                      onChange={(e) =>
                        setNewDifficulty(
                          e.target.value as "easy" | "medium" | "hard"
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-rpg-surface-border bg-black/30 px-3 py-2 text-sm text-white focus:border-rpg-gold focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      XP Reward
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={newXpReward}
                      onChange={(e) => setNewXpReward(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-rpg-surface-border bg-black/30 px-3 py-2 text-sm text-white focus:border-rpg-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Gold Reward
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={newGoldReward}
                      onChange={(e) =>
                        setNewGoldReward(Number(e.target.value))
                      }
                      className="mt-1.5 w-full rounded-xl border border-rpg-surface-border bg-black/30 px-3 py-2 text-sm text-white focus:border-rpg-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-rpg-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-rpg-gold px-5 py-2.5 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110"
                  >
                    <Plus className="h-4 w-4" />
                    Forge Quest
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
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
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard Hub
          </Link>

          <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
                <Compass className="h-3.5 w-3.5 text-purple-300" />
                Live Quest Journal
              </div>
              <h1
                id="quests-title"
                className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl"
              >
                Your Quests
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                Real-world missions backed by your PostgreSQL RPG engine. Complete
                quests to gain XP, level up, earn gold, and maintain your daily
                habit streaks.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rpg-gold px-4 py-2 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Create Quest
                </button>
              </div>
            </div>

            {/* Live Session XP & Level Widget */}
            <div className="w-full max-w-sm rounded-2xl border border-purple-400/25 bg-rpg-void/70 p-4 shadow-[0_0_20px_rgba(76,29,149,0.25)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                    <Crown className="h-4 w-4 text-rpg-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Character Rank
                    </p>
                    <p className="font-mono text-xs font-black uppercase tracking-wider text-white">
                      LEVEL {String(level).padStart(2, "0")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Gold
                    </p>
                    <p className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="h-3 w-3 text-amber-400" />
                      {gold} G
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Streak
                    </p>
                    <p className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-rose-400" />
                      {streak}d
                    </p>
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
                  variant="xp"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Floating Reward Toast */}
      <AnimatePresence>
        {rewardToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-40 flex items-center gap-3 rounded-2xl border border-rpg-gold/60 bg-rpg-surface-elevated/95 px-5 py-3 shadow-[0_0_30px_rgba(212,175,55,0.4)] backdrop-blur-md"
          >
            <Sparkles className="h-5 w-5 text-rpg-gold animate-bounce" />
            <div>
              <p className="text-xs font-bold text-white">Quest Completed!</p>
              <p className="text-[11px] font-mono text-amber-300">
                +{rewardToast.xp} XP • +{rewardToast.gold} Gold Awarded
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeQuests.length > 0 ? (
        <section aria-labelledby="active-quests-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
                Active Campaign
              </p>
              <h2
                id="active-quests-title"
                className="mt-1 text-2xl font-black text-white"
              >
                Quests ({completedCount} / {activeQuests.length} completed)
              </h2>
            </div>
            <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200">
              {activeQuests.length}{" "}
              {activeQuests.length === 1 ? "quest" : "quests"} in database
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeQuests.map((quest, index) => {
              const isActive = quest.status === "active";
              const isCompleted = quest.status === "completed";
              const isNew = quest.status !== "active" && !isCompleted;

              const progressValue = isCompleted ? 100 : isActive ? 50 : 0;
              const matchingImg = Object.keys(goalImages).find((key) =>
                quest.title.toLowerCase().includes(key.toLowerCase())
              );
              const bgImg = matchingImg ? goalImages[matchingImg] : null;

              return (
                <motion.article
                  key={quest.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className={`group relative min-h-[285px] overflow-hidden rounded-2xl border bg-rpg-surface/90 p-5 shadow-xl transition-all duration-300 ${
                    isActive
                      ? "border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/30"
                      : isCompleted
                      ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "border-rpg-surface-border hover:border-purple-400/45"
                  }`}
                >
                  {bgImg && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                      style={{ backgroundImage: `url('${bgImg}')` }}
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
                    {justAwardedQuestId === quest.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -4, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.9 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-rpg-gold/50 bg-rpg-surface-elevated/95 px-3 py-1 text-xs font-bold text-rpg-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] backdrop-blur-md"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        +{quest.xp_reward} XP!
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
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {quest.difficulty}
                        </span>
                        {isActive && (
                          <span className="rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                            In Progress
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      <h3 className="text-lg font-black text-white line-clamp-2">
                        {quest.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-400 line-clamp-2">
                        {quest.description ||
                          "Complete this mission in your real day to advance character level."}
                      </p>

                      <div className="mt-4 border-t border-white/10 pt-3">
                        <ProgressBar
                          label="Quest progress"
                          value={progressValue}
                          max={100}
                          showValueText={false}
                          size="sm"
                          variant={isCompleted ? "gold" : "xp"}
                        />
                        <div className="mt-2.5 flex items-center justify-between text-xs">
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
                          <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                            <span className="text-purple-300">
                              +{quest.xp_reward} XP
                            </span>
                            <span className="text-amber-400">
                              +{quest.gold_reward} G
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4">
                        {isNew && (
                          <button
                            type="button"
                            onClick={() => handleStartQuest(quest.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/15 px-4 py-2.5 text-xs font-bold text-purple-200 transition hover:border-purple-400/60 hover:bg-purple-500/25 hover:text-white"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Start Quest
                          </button>
                        )}
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleCompleteQuest(quest)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rpg-gold px-4 py-2.5 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            Complete Quest
                          </button>
                        )}
                        {isCompleted && (
                          <div
                            role="status"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
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
        </section>
      ) : (
        <EmptyQuestState onOpenCreate={() => setIsCreateOpen(true)} />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md"
      role="status"
    >
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">
        Loading live quest records from database...
      </p>
    </div>
  );
}

function EmptyQuestState({ onOpenCreate }: { onOpenCreate: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-rpg-surface-border bg-rpg-surface/85 px-6 py-14 text-center shadow-2xl backdrop-blur-md sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.18),transparent_52%)]" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/10 text-purple-200 shadow-[0_0_30px_rgba(139,92,246,.2)]">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-white">
          No quests in your journal yet
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Begin your journey by creating your first real-life quest or
          generating them through the onboarding path.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-rpg-gold px-4 py-2.5 text-sm font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Create First Quest
          </button>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl border border-rpg-surface-border bg-rpg-surface-elevated px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-purple-400/40 hover:text-white"
          >
            <Sparkles className="h-4 w-4" />
            Choose Goals
          </Link>
        </div>
      </div>
    </section>
  );
}
