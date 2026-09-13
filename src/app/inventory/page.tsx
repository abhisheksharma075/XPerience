"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Backpack,
  Box,
  Crown,
  Coins,
  Sparkles,
  Shield,
  Swords,
  ShoppingBag,
  Check,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserInventory,
  consumeInventoryItem,
  InventoryItem,
} from "@/lib/inventory";
import {
  getActiveShopItems,
  purchaseShopItem,
  ShopItem,
} from "@/lib/shop";
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

const equippedSlots = [
  {
    slotName: "Main Hand",
    label: "Weapon",
    icon: Swords,
    description: "Primary offensive armament",
  },
  {
    slotName: "Torso Defense",
    label: "Armor",
    icon: Shield,
    description: "Body armor & protection",
  },
  {
    slotName: "Pouch / Belt",
    label: "Utility",
    icon: Backpack,
    description: "Quick-access potions & scrolls",
  },
  {
    slotName: "Artifact Relic",
    label: "Keystone",
    icon: Crown,
    description: "Legendary passive amplifier",
  },
];

export default function InventoryPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [heroName, setHeroName] = useState("Hero");
  const [pathName, setPathName] = useState("Warrior");
  const [userLevel, setUserLevel] = useState(1);
  const [userGold, setUserGold] = useState(0);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?redirectedFrom=/inventory");
          return;
        }

        setUserId(user.id);

        // Fetch profile, inventory, and shop items concurrently in parallel
        const [
          { data: profile },
          { inventory: dbInventory },
          { items: dbShopItems },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),
          getUserInventory(supabase, user.id),
          getActiveShopItems(supabase),
        ]);

        const onboarding = getOnboardingData();

        if (profile) {
          setHeroName(
            profile.display_name ||
              onboarding.name ||
              user.email?.split("@")[0] ||
              "Hero"
          );
          setUserLevel(profile.level || 1);
          setUserGold(profile.gold || 0);
        }

        if (onboarding.path) {
          setPathName(onboarding.path);
        }

        if (dbInventory) {
          setInventory(dbInventory);
        }

        if (dbShopItems) {
          setShopItems(dbShopItems);
        }
      } catch (err) {
        console.error("Failed loading inventory:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, [router]);

  const handlePurchase = async (item: ShopItem) => {
    if (!userId || actionLoading) return;

    if (userGold < item.price) {
      setActionNotice({
        type: "error",
        text: `Insufficient gold! You need ${item.price} G, but have ${userGold} G. Complete quests to earn more gold.`,
      });
      return;
    }

    setActionLoading(item.id);
    setActionNotice(null);

    const supabase = createClient();
    const { result, error } = await purchaseShopItem(supabase, userId, item.id);

    if (result) {
      setUserGold(result.newGold);
      // Refresh inventory
      const { inventory: updatedInv } = await getUserInventory(supabase, userId);
      if (updatedInv) {
        setInventory(updatedInv);
      }

      setActionNotice({
        type: "success",
        text: `Purchased ${item.name}! Added to your inventory backpack.`,
      });
    } else {
      setActionNotice({
        type: "error",
        text: error || "Purchase transaction failed.",
      });
    }

    setActionLoading(null);
  };

  const handleConsume = async (item: InventoryItem) => {
    if (!userId || actionLoading) return;

    setActionLoading(item.id);
    setActionNotice(null);

    const supabase = createClient();
    const { result, error } = await consumeInventoryItem(supabase, userId, item.item_id, 1);

    if (result) {
      // Refresh inventory
      const { inventory: updatedInv } = await getUserInventory(supabase, userId);
      if (updatedInv) {
        setInventory(updatedInv);
      }

      setActionNotice({
        type: "success",
        text: `Used 1x ${item.item?.name || "item"}! Quantity updated.`,
      });
    } else {
      setActionNotice({
        type: "error",
        text: error || "Failed to use item.",
      });
    }

    setActionLoading(null);
  };

  if (!isLoaded) {
    return <InventoryLoadingState />;
  }

  const selectedPath = pathDetails[pathName] || pathDetails.Warrior;
  const totalItemCount = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-7 pb-8 sm:space-y-8">
      {/* 1. TOP HEADER */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        aria-labelledby="inventory-title"
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
              <Backpack className="h-3.5 w-3.5 text-purple-300" />
              Armory & Inventory
            </div>
            <h1
              id="inventory-title"
              className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl"
            >
              Your Inventory
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Artifacts, equipment, and consumables earned from your real-world
              quests and acquired from the Adventurer&apos;s Shop.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 2. INVENTORY SUMMARY */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        aria-labelledby="inventory-summary-title"
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
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-purple-400/40 bg-purple-500/15 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.25)]">
              <Backpack className="h-8 w-8 text-purple-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="inventory-summary-title"
                  className="text-2xl font-black tracking-tight text-white sm:text-3xl"
                >
                  {heroName}
                </h2>
                <span className="rounded-full border border-rpg-gold/40 bg-rpg-gold/10 px-2.5 py-0.5 text-xs font-bold text-rpg-gold">
                  Level {userLevel}
                </span>
                <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-200">
                  {pathName}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Equipment Vault & Backpack • Live PostgreSQL Storage
              </p>
            </div>
          </div>

          {/* Metrics summary pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-rpg-surface-border bg-rpg-void/60 px-4 py-3 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Treasury Gold
              </span>
              <p className="font-mono text-lg font-black text-amber-400 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-400 inline" />
                {userGold} G
              </p>
            </div>
            <div className="rounded-xl border border-rpg-surface-border bg-rpg-void/60 px-4 py-3 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Owned Items
              </span>
              <p className="font-mono text-lg font-black text-purple-200">
                {totalItemCount}{" "}
                <span className="text-xs font-normal text-slate-500">
                  Total
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Action Notice */}
      {actionNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between ${
            actionNotice.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
              : "border-red-500/40 bg-red-950/40 text-red-300"
          }`}
        >
          <span>{actionNotice.text}</span>
          {actionNotice.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Coins className="h-4 w-4" />
          )}
        </motion.div>
      )}

      {/* 3. ACTIVE LOADOUT / EQUIPPED GEAR */}
      <section aria-labelledby="equipped-gear-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
              Active Loadout
            </p>
            <h2 id="equipped-gear-title" className="mt-1 text-2xl font-black text-white">
              Equipped Slots
            </h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {equippedSlots.map((slot, idx) => {
            const Icon = slot.icon;
            return (
              <motion.div
                key={slot.slotName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.1 + idx * 0.05,
                  ease: "easeOut",
                }}
                className="group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-purple-400/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10 text-purple-200 shadow-md">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/5 bg-black/30 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    SLOT READY
                  </span>
                </div>

                <div className="mt-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    {slot.label}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {slot.slotName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {slot.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. LIVE BACKPACK VAULT */}
      <section aria-labelledby="backpack-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
              Backpack Storage
            </p>
            <h2 id="backpack-title" className="mt-1 text-2xl font-black text-white">
              Owned Items ({inventory.length} unique)
            </h2>
          </div>
        </div>

        {inventory.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/90 p-5 shadow-lg transition-all hover:border-rpg-gold/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rpg-gold/30 bg-rpg-gold/10 text-rpg-gold">
                        <Box className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">
                          {item.item?.name || "Artifact Item"}
                        </h4>
                        <span className="text-[10px] uppercase font-mono text-purple-300">
                          {item.item?.item_type || "item"}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-black/40 border border-rpg-surface-border text-amber-300">
                      x{item.quantity}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    {item.item?.description || "A valuable item in your RPG backpack."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-rpg-surface-border flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Worth ~{item.item?.price || 0} G
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => handleConsume(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-400/30 bg-purple-500/10 text-xs font-bold text-purple-200 hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    Use 1x
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-rpg-surface-border bg-rpg-surface/60 p-8 text-center text-sm text-slate-400">
            <Box className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            Your backpack is currently empty. Visit the Adventurer&apos;s Shop below to purchase gear with your quest gold.
          </div>
        )}
      </section>

      {/* 5. ADVENTURER'S SHOP CATALOG */}
      <section aria-labelledby="shop-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
              Merchant Guild
            </p>
            <h2 id="shop-title" className="mt-1 text-2xl font-black text-white">
              Adventurer&apos;s Shop
            </h2>
          </div>
          <span className="text-xs text-amber-300 font-mono">
            Balance: {userGold} G
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/90 p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {item.name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono text-purple-300">
                      {item.item_type}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-amber-400 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    {item.price} G
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-rpg-surface-border">
                <button
                  type="button"
                  disabled={Boolean(actionLoading) || userGold < item.price}
                  onClick={() => handlePurchase(item)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold px-4 py-2 text-xs font-bold text-rpg-void shadow-gold-glow transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {userGold < item.price
                    ? "Need More Gold"
                    : `Buy for ${item.price} G`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InventoryLoadingState() {
  return (
    <div
      className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md"
      role="status"
    >
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">
        Opening equipment vault and inventory...
      </p>
    </div>
  );
}
