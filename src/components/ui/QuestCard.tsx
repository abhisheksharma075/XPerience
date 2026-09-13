"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quest } from "@/types/rpg";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Check, Coins, Sparkles, Clock } from "lucide-react";

export interface QuestCardProps {
  quest: Quest;
  onComplete?: (questId: string) => void;
  onSelect?: (quest: Quest) => void;
  className?: string;
}

const difficultyGradients: Record<Quest["difficulty"], string> = {
  trivial: "border-slate-800/80 hover:border-slate-600",
  easy: "border-emerald-950/60 hover:border-emerald-500/50",
  medium: "border-sky-950/60 hover:border-sky-500/50",
  hard: "border-purple-950/60 hover:border-purple-500/50",
  legendary: "border-amber-950/60 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
};

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onComplete,
  onSelect,
  className,
}) => {
  const isDone = quest.isCompleted;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: isDone ? 0 : -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative p-4 rounded-xl border bg-rpg-surface/90 backdrop-blur-sm transition-all duration-200",
        difficultyGradients[quest.difficulty],
        isDone ? "opacity-60 bg-rpg-surface-subtle/50" : "hover:bg-rpg-surface-card",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkmark Completion Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.(quest.id);
          }}
          aria-label={isDone ? `Mark quest incomplete: ${quest.title}` : `Complete quest: ${quest.title}`}
          aria-pressed={isDone}
          className={cn(
            "mt-0.5 shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void",
            isDone
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
              : "border-rpg-surface-border bg-rpg-surface-elevated/80 text-transparent hover:border-rpg-gold hover:text-rpg-gold/40"
          )}
        >
          <Check className={cn("w-3.5 h-3.5 stroke-[3]", isDone ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
        </button>

        {/* Quest Details */}
        <div
          className={cn("flex-1 min-w-0", onSelect && "cursor-pointer")}
          onClick={onSelect ? () => onSelect(quest) : undefined}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={
            onSelect
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(quest);
                  }
                }
              : undefined
          }
        >
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4
              className={cn(
                "font-semibold text-sm text-slate-100 transition-colors line-clamp-1",
                isDone && "line-through text-slate-400"
              )}
            >
              {quest.title}
            </h4>
            <Badge variant={quest.difficulty} size="sm">
              {quest.difficulty}
            </Badge>
            <Badge variant={quest.attributeTarget} size="sm">
              +{quest.attributeTarget}
            </Badge>
          </div>

          {quest.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mb-2.5">
              {quest.description}
            </p>
          )}

          {/* Rewards & Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rpg-surface-border/40 text-[11px]">
            <div className="flex items-center gap-3">
              {/* XP Reward */}
              <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-400">
                <Sparkles className="w-3 h-3 text-purple-400" />
                +{quest.xpReward} XP
              </span>
              {/* Gold Reward */}
              <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-400">
                <Coins className="w-3 h-3 text-amber-400" />
                +{quest.goldReward} Gold
              </span>
            </div>

            {quest.dueDate && (
              <span className="inline-flex items-center gap-1 text-slate-500 font-mono">
                <Clock className="w-3 h-3" />
                {quest.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
