"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Backpack,
  Box,
  Crown,
  Flame,
  Info,
  Lock,
  Scroll,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { getOnboardingData, type OnboardingData } from "@/lib/onboarding";

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
    slotName: "Talisman",
    label: "Accessory",
    icon: Sparkles,
    description: "Amulet or stat enhancer",
  },
  {
    slotName: "Ancient Keystone",
    label: "Relic",
    icon: Flame,
    description: "Legendary passive amplifier",
  },
];

const rarityLegend = [
  {
    name: "Common",
    color: "text-slate-400",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
    dot: "bg-slate-400",
    detail: "Standard utility items",
  },
  {
    name: "Uncommon",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
    detail: "Refined quality gear",
  },
  {
    name: "Rare",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    dot: "bg-cyan-400",
    detail: "Specialized focus items",
  },
  {
    name: "Epic",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    dot: "bg-purple-400",
    detail: "Heroic resonance equipment",
  },
  {
    name: "Legendary",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    dot: "bg-amber-400",
    detail: "Mythic milestone artifacts",
  },
];

const futureRewards = [
  {
    title: "Quest Cache",
    category: "Quest Reward",
    icon: Scroll,
    description: "Awarded upon milestone quest completions in your active life domains.",
    status: "LOCKED",
  },
  {
    title: "Level 5 Arsenal",
    category: "Level Reward",
    icon: Crown,
    description: "Unlocked automatically upon advancing your hero to Level 05.",
    status: "LOCKED",
  },
  {
    title: "Mastery Trophy",
    category: "Achievement Reward",
    icon: Trophy,
    description: "Earned from completing multi-day life habit and discipline streaks.",
    status: "LOCKED",
  },
  {
    title: "Ascension Relic",
    category: "Milestone Reward",
    icon: Zap,
    description: "Forged after completing your first full campaign chapter.",
    status: "LOCKED",
  },
];

// 16 empty inventory slots
const storageSlots = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  slotNumber: `#${String(i + 1).padStart(2, "0")}`,
}));

export default function InventoryPage() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <InventoryLoadingState />;
  }

  const name = typeof onboardingData?.name === "string" ? onboardingData.name.trim() : "";
  const path = typeof onboardingData?.path === "string" ? onboardingData.path : "";

  const heroName = name || "New Adventurer";
  const selectedPath = path ? pathDetails[path] : undefined;
  const pathName = selectedPath?.name || path || "Unchosen Path";

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
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200">
              <Backpack className="h-3.5 w-3.5 text-purple-300" />
              Inventory
            </div>
            <h1 id="inventory-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Your Inventory</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Every item you earn becomes part of the story you are building.
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
                <h2 id="inventory-summary-title" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {heroName}
                </h2>
                <span className="rounded-full border border-rpg-gold/40 bg-rpg-gold/10 px-2.5 py-0.5 text-xs font-bold text-rpg-gold">
                  Rising Hero
                </span>
                <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-200">
                  {pathName}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Tier 1 equipment vault • Manage loadouts, artifacts, and quest rewards.
              </p>
            </div>
          </div>

          {/* Metrics summary pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-rpg-surface-border bg-rpg-void/60 px-4 py-3 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hero Level</span>
              <p className="font-mono text-lg font-black text-white">Level 01</p>
            </div>
            <div className="rounded-xl border border-rpg-surface-border bg-rpg-void/60 px-4 py-3 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacity</span>
              <p className="font-mono text-lg font-black text-purple-200">
                0 / 24 <span className="text-xs font-normal text-slate-500">Slots</span>
              </p>
            </div>
            <div className="rounded-xl border border-rpg-surface-border bg-rpg-void/60 px-4 py-3 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Equipped</span>
              <p className="font-mono text-lg font-black text-rpg-gold">
                0 / 4 <span className="text-xs font-normal text-slate-500">Gear</span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. EQUIPMENT / LOADOUT */}
      <section aria-labelledby="equipped-gear-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Active Loadout</p>
            <h2 id="equipped-gear-title" className="mt-1 text-2xl font-black text-white">Equipped Gear</h2>
          </div>
          <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
            0 / 4 Equipped
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {equippedSlots.map((slot, idx) => {
            const Icon = slot.icon;
            return (
              <motion.div
                key={slot.slotName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + idx * 0.05, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10 text-purple-200 shadow-md transition-colors group-hover:border-purple-400/60 group-hover:bg-purple-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/5 bg-black/30 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    SLOT EMPTY
                  </span>
                </div>

                <div className="mt-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">{slot.label}</span>
                  <h3 className="text-base font-black text-white">{slot.slotName}</h3>
                  <p className="mt-1 text-xs text-slate-400">{slot.description}</p>
                </div>

                <div className="mt-4 border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>No item equipped</span>
                    <span className="text-purple-300/70">Equip in Stage 8</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. INVENTORY GRID */}
      <section aria-labelledby="item-storage-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Backpack Vault</p>
            <h2 id="item-storage-title" className="mt-1 text-2xl font-black text-white">Item Storage</h2>
          </div>
          <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
            16 Standard Slots
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
          {storageSlots.map((slot) => (
            <div
              key={slot.id}
              className="group relative flex min-h-[96px] flex-col justify-between rounded-xl border border-dashed border-rpg-surface-border bg-rpg-surface/60 p-3 transition-all duration-200 hover:border-purple-400/40 hover:bg-rpg-surface/85 hover:shadow-[0_0_15px_rgba(168,85,247,0.12)]"
            >
              <div className="flex items-center justify-between">
                <Box className="h-3.5 w-3.5 text-slate-600 transition-colors group-hover:text-purple-300" />
                <span className="font-mono text-[9px] text-slate-600 group-hover:text-slate-400">
                  {slot.slotNumber}
                </span>
              </div>

              <div className="my-auto flex flex-col items-center justify-center py-2 text-center">
                <span className="text-[10px] font-bold text-slate-500 transition-colors group-hover:text-slate-300">
                  Empty
                </span>
              </div>

              <div className="h-0.5 w-full rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </section>

      {/* 5. ITEM RARITY LEGEND */}
      <section aria-labelledby="rarity-legend-title">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Item Quality Tiers</p>
          <h2 id="rarity-legend-title" className="mt-1 text-2xl font-black text-white">Rarity Tiers</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {rarityLegend.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border ${tier.border} ${tier.bg} p-3.5 backdrop-blur-sm transition hover:brightness-110`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${tier.dot} shadow-sm`} />
                <span className={`text-xs font-black uppercase tracking-wider ${tier.color}`}>
                  {tier.name}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{tier.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FUTURE REWARDS PREVIEW */}
      <section aria-labelledby="future-rewards-title">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Upcoming Unlocks</p>
          <h2 id="future-rewards-title" className="mt-1 text-2xl font-black text-white">Future Rewards</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {futureRewards.map((reward, idx) => {
            const Icon = reward.icon;
            return (
              <motion.div
                key={reward.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + idx * 0.05, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-rpg-surface/75 p-5 backdrop-blur-md transition-all duration-300 hover:border-purple-400/35 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-500/10 text-purple-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                    <Lock className="h-3 w-3" />
                    {reward.status}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{reward.category}</span>
                  <h3 className="text-base font-black text-white">{reward.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{reward.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 7. INVENTORY INFORMATION PANEL */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        aria-labelledby="info-panel-title"
        className="relative overflow-hidden rounded-2xl border border-purple-400/20 bg-rpg-surface/80 p-6 shadow-lg backdrop-blur-md sm:p-7"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/15 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h2 id="info-panel-title" className="text-base font-black text-white sm:text-lg">
              About Your Inventory
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Future quests, personal achievements, and life milestones will unlock tangible RPG artifacts and equipment that can be equipped here. Every conquered challenge equips you with greater capability in the real world.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 8. FOOTER NOTE */}
      <div className="pt-2 text-center">
        <p className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Your inventory will grow as your journey does.
        </p>
      </div>
    </div>
  );
}

function InventoryLoadingState() {
  return (
    <div className="rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-8 text-center shadow-xl backdrop-blur-md" role="status">
      <Sparkles className="mx-auto h-6 w-6 animate-pulse text-purple-300" />
      <p className="mt-3 text-sm text-slate-400">Loading your inventory...</p>
    </div>
  );
}
