'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Quest,
  QuestDifficulty,
  QuestStatus,
  createQuest,
  updateQuest,
  deleteQuest,
} from '@/lib/quests';
import { completeQuestWorkflow } from '@/lib/questCompletionEngine';

interface QuestManagerProps {
  initialQuests: Quest[];
  userId: string;
}

export default function QuestManager({ initialQuests, userId }: QuestManagerProps) {
  const router = useRouter();

  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [filterStatus, setFilterStatus] = useState<'all' | QuestStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState<number>(50);
  const [goldReward, setGoldReward] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('easy');
  const [status, setStatus] = useState<QuestStatus>('active');
  const [dueDate, setDueDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardNotification, setRewardNotification] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingQuest(null);
    setTitle('');
    setDescription('');
    setXpReward(50);
    setGoldReward(20);
    setDifficulty('easy');
    setStatus('active');
    setDueDate('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (q: Quest) => {
    setEditingQuest(q);
    setTitle(q.title);
    setDescription(q.description || '');
    setXpReward(q.xp_reward);
    setGoldReward(q.gold_reward);
    setDifficulty(q.difficulty);
    setStatus(q.status);
    setDueDate(q.due_date ? q.due_date.split('T')[0] : '');
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuest(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (editingQuest) {
      // UPDATE QUEST
      const { quest: updated, error: updateErr } = await updateQuest(
        supabase,
        editingQuest.id,
        {
          title,
          description,
          xp_reward: Number(xpReward),
          gold_reward: Number(goldReward),
          difficulty,
          status,
          due_date: dueDate ? dueDate : null,
        }
      );

      if (updateErr) {
        setError(updateErr);
        setLoading(false);
        return;
      }

      if (updated) {
        setQuests((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      }
    } else {
      // CREATE QUEST
      const { quest: created, error: createErr } = await createQuest(
        supabase,
        userId,
        {
          title,
          description,
          xp_reward: Number(xpReward),
          gold_reward: Number(goldReward),
          difficulty,
          status,
          due_date: dueDate ? dueDate : null,
        }
      );

      if (createErr) {
        setError(createErr);
        setLoading(false);
        return;
      }

      if (created) {
        setQuests((prev) => [created, ...prev]);
      }
    }

    setLoading(false);
    closeModal();
    router.refresh();
  };

  const handleDelete = async (questId: string) => {
    if (!confirm('Are you sure you want to delete this quest?')) {
      return;
    }

    const supabase = createClient();
    const { success, error: deleteErr } = await deleteQuest(supabase, questId);

    if (deleteErr) {
      alert(`Error deleting quest: ${deleteErr}`);
      return;
    }

    if (success) {
      setQuests((prev) => prev.filter((q) => q.id !== questId));
      router.refresh();
    }
  };

  const handleToggleStatus = async (quest: Quest) => {
    const supabase = createClient();
    setError(null);
    setRewardNotification(null);

    if (quest.status === 'active') {
      // Complete quest via Unified Server-Side Quest Completion Engine
      const { result, error: completeErr } = await completeQuestWorkflow(
        supabase,
        userId,
        quest.id
      );

      if (completeErr) {
        alert(`Error completing quest: ${completeErr}`);
        return;
      }

      if (result) {
        setQuests((prev) =>
          prev.map((item) =>
            item.id === quest.id ? { ...item, status: 'completed' } : item
          )
        );
        let streakMsg = '';
        if (result.characterState.currentStreak !== undefined) {
          if (result.streakIncremented) {
            streakMsg = ` 🔥 Streak increased to ${result.characterState.currentStreak} day${result.characterState.currentStreak > 1 ? 's' : ''}!`;
          } else {
            streakMsg = ` 🔥 Streak maintained at ${result.characterState.currentStreak} day${result.characterState.currentStreak > 1 ? 's' : ''} (daily goal met).`;
          }
        }
        setRewardNotification(
          `🎉 Quest Completed! Earned +${result.xpEarned} XP and +${result.goldEarned} Gold.${streakMsg}`
        );
        router.refresh();
      }
    } else {
      // Reopen quest
      const { quest: updated, error: toggleErr } = await updateQuest(
        supabase,
        quest.id,
        { status: 'active' }
      );

      if (toggleErr) {
        alert(`Error reopening quest: ${toggleErr}`);
        return;
      }

      if (updated) {
        setQuests((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        router.refresh();
      }
    }
  };

  const filteredQuests =
    filterStatus === 'all'
      ? quests
      : quests.filter((q) => q.status === filterStatus);

  const getDifficultyBadge = (diff: QuestDifficulty) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'hard':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    }
  };

  const getStatusBadge = (st: QuestStatus) => {
    switch (st) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'archived':
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Quest Log
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your personal RPG quests and objectives.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shrink-0"
        >
          + Create New Quest
        </button>
      </div>

      {rewardNotification && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{rewardNotification}</span>
          <button
            onClick={() => setRewardNotification(null)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {(['all', 'active', 'completed', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filterStatus === tab
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tab} ({tab === 'all' ? quests.length : quests.filter((q) => q.status === tab).length})
          </button>
        ))}
      </div>

      {/* Quest List */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No {filterStatus !== 'all' ? filterStatus : ''} quests found.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Add your first quest
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                quest.status === 'completed'
                  ? 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 opacity-75'
                  : 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`font-semibold text-base text-zinc-900 dark:text-zinc-100 truncate ${
                      quest.status === 'completed' ? 'line-through text-zinc-500 dark:text-zinc-500' : ''
                    }`}
                  >
                    {quest.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${getDifficultyBadge(
                      quest.difficulty
                    )}`}
                  >
                    {quest.difficulty}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${getStatusBadge(
                      quest.status
                    )}`}
                  >
                    {quest.status}
                  </span>
                </div>

                {quest.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {quest.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    +{quest.xp_reward} XP
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    +{quest.gold_reward} Gold
                  </span>
                  {quest.due_date && (
                    <>
                      <span>•</span>
                      <span>Due: {new Date(quest.due_date).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleStatus(quest)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    quest.status === 'active'
                      ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {quest.status === 'active' ? 'Mark Done' : 'Reopen'}
                </button>

                <button
                  onClick={() => openEditModal(quest)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(quest.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingQuest ? 'Edit Quest' : 'Create New Quest'}
              </h3>
              <button
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Quest Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Defeat 5 algorithms in LeetCode"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Quest context, steps or notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Gold Reward
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={goldReward}
                    onChange={(e) => setGoldReward(Number(e.target.value))}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuestDifficulty)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuestStatus)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : editingQuest ? 'Save Changes' : 'Create Quest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
