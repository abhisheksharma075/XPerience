"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatDisplay } from "@/components/ui/StatDisplay";
import { QuestCard } from "@/components/ui/QuestCard";
import { Quest } from "@/types/rpg";
import { Sparkles, Sword, Flame, Coins, ShieldCheck } from "lucide-react";

export default function ShowcasePage() {
  const [btnLoading, setBtnLoading] = useState(false);

  // Sample quests for UI testing and verification
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: "q-1",
      title: "Master TypeScript Generics & Mapped Types",
      description: "Dive into advanced type gymnastics to build indestructible frontend state contracts.",
      difficulty: "hard",
      attributeTarget: "intellect",
      xpReward: 350,
      goldReward: 85,
      isCompleted: false,
      dueDate: "Today",
      createdAt: new Date().toISOString(),
    },
    {
      id: "q-2",
      title: "45-Minute Heavy Iron Workout",
      description: "Compound lifts and core stability circuits to bolster physical fortitude.",
      difficulty: "medium",
      attributeTarget: "strength",
      xpReward: 200,
      goldReward: 45,
      isCompleted: false,
      dueDate: "Today",
      createdAt: new Date().toISOString(),
    },
    {
      id: "q-3",
      title: "Hydrate & Drink 2L Elixir of Water",
      description: "Keep vitality and mental clarity peaked throughout the hackathon grind.",
      difficulty: "trivial",
      attributeTarget: "vitality",
      xpReward: 50,
      goldReward: 15,
      isCompleted: true,
      dueDate: "Done",
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleToggleQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, isCompleted: !q.isCompleted } : q))
    );
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner Header */}
      <section className="relative overflow-hidden rounded-2xl border border-rpg-surface-border bg-gradient-to-br from-rpg-surface via-rpg-surface-subtle to-rpg-void p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            UI System & Navigation Foundation
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            XPerience <span className="text-rpg-gold">Design System</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Dark fantasy RPG interface primitives crafted for tactile satisfaction, accessible keyboard navigation, and seamless state-driven frontend workflows.
          </p>
        </div>
      </section>

      {/* Progress & Meter Primitives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
            Progression Bars
          </h2>
        </div>

        <Card className="p-6 space-y-5">
          <ProgressBar
            label="Hero XP Progression (Level 7)"
            value={1450}
            max={2000}
            variant="xp"
            valueUnit="XP"
            size="md"
          />
          <ProgressBar
            label="Health Pool (Fortitude)"
            value={380}
            max={450}
            variant="health"
            valueUnit="HP"
            size="md"
          />
          <ProgressBar
            label="Arcane Mana (Focus)"
            value={180}
            max={220}
            variant="mana"
            valueUnit="MP"
            size="md"
          />
        </Card>
      </section>

      {/* Reusable RPG Button Primitives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sword className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
            Tactile RPG Buttons
          </h2>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" leftIcon={<Sword className="w-4 h-4" />}>
              Accept Quest
            </Button>

            <Button variant="secondary" leftIcon={<Coins className="w-4 h-4 text-amber-400" />}>
              Open Merchant
            </Button>

            <Button variant="mana" leftIcon={<Sparkles className="w-4 h-4" />}>
              Cast Spell
            </Button>

            <Button variant="danger">
              Surrender Task
            </Button>

            <Button variant="outline">
              Inspect Codex
            </Button>

            <Button
              variant="primary"
              isLoading={btnLoading}
              onClick={() => {
                setBtnLoading(true);
                setTimeout(() => setBtnLoading(false), 1500);
              }}
            >
              Test Loading State
            </Button>
          </div>
        </Card>
      </section>

      {/* Rarity & Attribute Badges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
            Rarity & Attribute Badges
          </h2>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <div className="text-xs text-slate-400 mb-2 font-mono uppercase">Item Rarity Tiers</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="common">Common</Badge>
              <Badge variant="uncommon">Uncommon</Badge>
              <Badge variant="rare">Rare</Badge>
              <Badge variant="epic">Epic</Badge>
              <Badge variant="legendary">Legendary</Badge>
              <Badge variant="mythic">Mythic</Badge>
            </div>
          </div>

          <div className="pt-3 border-t border-rpg-surface-border">
            <div className="text-xs text-slate-400 mb-2 font-mono uppercase">Character Attribute Targets</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="strength">+Strength</Badge>
              <Badge variant="intellect">+Intellect</Badge>
              <Badge variant="vitality">+Vitality</Badge>
              <Badge variant="agility">+Agility</Badge>
              <Badge variant="focus">+Focus</Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* Character Stat Displays */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
            Character Attributes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <StatDisplay attribute="strength" value={24} bonus={3} />
          <StatDisplay attribute="intellect" value={32} bonus={5} />
          <StatDisplay attribute="vitality" value={19} />
          <StatDisplay attribute="agility" value={16} bonus={1} />
          <StatDisplay attribute="focus" value={28} bonus={4} />
        </div>
      </section>

      {/* Interactive Quest Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
              Quest Card Primitives (Interactive)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click checkmark to test complete state
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={handleToggleQuest}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
