'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShopItem, purchaseShopItem } from '@/lib/shop';

interface ShopManagerProps {
  initialItems: ShopItem[];
  userGold: number;
  userId: string;
}

const ITEM_TYPE_ICONS: Record<string, string> = {
  consumable: '🧪',
  scroll: '📜',
  equipment: '⚔️',
  accessory: '💍',
  vanity: '👑',
};

export default function ShopManager({
  initialItems,
  userGold,
  userId,
}: ShopManagerProps) {
  const router = useRouter();
  const [items] = useState<ShopItem[]>(initialItems);
  const [gold, setGold] = useState<number>(userGold);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handlePurchase = async (item: ShopItem) => {
    if (gold < item.price) {
      setError(`Insufficient gold. You need ${item.price} G, but have ${gold} G.`);
      return;
    }

    setPurchasingId(item.id);
    setError(null);
    setNotification(null);

    try {
      const supabase = createClient();
      const { result, error: purchaseError } = await purchaseShopItem(
        supabase,
        userId,
        item.id,
        1
      );

      if (purchaseError || !result) {
        setError(purchaseError || 'Failed to complete purchase.');
        setPurchasingId(null);
        return;
      }

      setGold(result.newGold);
      setNotification(
        `🎉 Purchased 1x ${result.itemName}! Added to inventory. Remaining Gold: ${result.newGold} G.`
      );
      setPurchasingId(null);
      router.refresh();

      setTimeout(() => {
        setNotification((current) => (current ? null : current));
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setPurchasingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Adventurer&apos;s Shop</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
              Marketplace
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Spend your hard-earned quest gold on mystical items and gear
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-3.5 py-1.5 rounded-xl">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Your Gold:</span>
          <span className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
            {gold} G
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

      {items.length === 0 ? (
        <div className="mt-6 text-center py-8 text-zinc-400 dark:text-zinc-500 text-xs">
          No items currently available in the shop. Check back later!
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const icon = ITEM_TYPE_ICONS[item.item_type] || '🎁';
            const canAfford = gold >= item.price;
            const isPurchasing = purchasingId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{icon}</span>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-semibold shrink-0">
                      {item.item_type}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {item.description || 'A rare adventurer item.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {item.price}
                    </span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Gold
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || purchasingId !== null}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed ${
                      canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-60'
                    }`}
                  >
                    {isPurchasing ? (
                      <span>Buying...</span>
                    ) : canAfford ? (
                      <span>Buy Item</span>
                    ) : (
                      <span>Need Gold</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
