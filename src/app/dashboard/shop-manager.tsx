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
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/90 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Adventurer&apos;s Shop</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-semibold">
              Marketplace
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Spend your hard-earned quest gold on mystical items and gear
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-950/40 border border-amber-500/40 px-3.5 py-1.5 rounded-xl">
          <span className="text-xs text-amber-300 font-medium">Your Gold:</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {gold} G
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-950/40 p-3 text-xs text-rose-300 border border-rose-500/40 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {notification && (
        <div className="mt-4 rounded-xl bg-emerald-950/40 p-3 text-xs text-emerald-300 border border-emerald-500/40">
          {notification}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-6 text-center py-8 text-slate-500 text-xs">
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
                className="p-4 rounded-2xl bg-black/30 border border-rpg-surface-border hover:border-rpg-gold/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{icon}</span>
                      <h3 className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-300 uppercase tracking-wider font-semibold shrink-0">
                      {item.item_type}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {item.description || 'A rare adventurer item.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-rpg-surface-border flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {item.price}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Gold
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || purchasingId !== null}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
                      canAfford
                        ? 'bg-rpg-gold text-rpg-void shadow-gold-glow hover:brightness-110 disabled:opacity-50'
                        : 'bg-black/30 border border-rpg-surface-border text-slate-500 opacity-60'
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
