'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, consumeInventoryItem } from '@/lib/inventory';

interface InventoryManagerProps {
  initialInventory: InventoryItem[];
  userId: string;
}

const ITEM_TYPE_ICONS: Record<string, string> = {
  consumable: '🧪',
  scroll: '📜',
  equipment: '⚔️',
  accessory: '💍',
  vanity: '👑',
};

export default function InventoryManager({
  initialInventory,
  userId,
}: InventoryManagerProps) {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [usingItemId, setUsingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const totalItemCount = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const handleUseItem = async (item: InventoryItem) => {
    setUsingItemId(item.item_id);
    setError(null);
    setNotification(null);

    try {
      const supabase = createClient();
      const { result, error: useError } = await consumeInventoryItem(
        supabase,
        userId,
        item.item_id,
        1
      );

      if (useError || !result) {
        setError(useError || 'Failed to use item.');
        setUsingItemId(null);
        return;
      }

      // Optimistically update local inventory
      if (result.remainingQuantity > 0) {
        setInventory((prev) =>
          prev.map((i) =>
            i.item_id === item.item_id
              ? { ...i, quantity: result.remainingQuantity }
              : i
          )
        );
      } else {
        // Removed item completely
        setInventory((prev) => prev.filter((i) => i.item_id !== item.item_id));
      }

      setNotification(`✨ Used 1x ${item.item.name}! (${result.remainingQuantity} remaining)`);
      setUsingItemId(null);
      router.refresh();

      setTimeout(() => {
        setNotification((current) => (current ? null : current));
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setUsingItemId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Adventurer&apos;s Backpack</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
              Inventory
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Your collection of acquired items, equipment, and consumables
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          <span>Total Items:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {totalItemCount}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {notification && (
        <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
          {notification}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="mt-6 text-center py-10 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <span className="text-3xl block mb-2">🎒</span>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Your backpack is currently empty.
          </p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
            Complete quests to earn gold and purchase powerful gear or potions in the Shop above!
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((invItem) => {
            const icon = ITEM_TYPE_ICONS[invItem.item.item_type] || '🎁';
            const isUsing = usingItemId === invItem.item_id;
            const canUse = invItem.item.item_type === 'consumable' || invItem.item.item_type === 'scroll';

            return (
              <div
                key={invItem.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{icon}</span>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {invItem.item.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono shrink-0">
                      x{invItem.quantity}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {invItem.item.description || 'Acquired adventurer item.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    {invItem.item.item_type}
                  </span>

                  {canUse ? (
                    <button
                      type="button"
                      onClick={() => handleUseItem(invItem)}
                      disabled={usingItemId !== null}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUsing ? 'Using...' : 'Use 1x'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                      Equipped / Owned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
