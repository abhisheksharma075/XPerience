import React from "react";
import { cn } from "@/lib/utils";
import { RarityTier, CharacterAttributeType, QuestDifficulty } from "@/types/rpg";

export type BadgeVariant =
  | "gold"
  | "mana"
  | "health"
  | "xp"
  | "neutral"
  | RarityTier
  | CharacterAttributeType
  | QuestDifficulty;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  glow?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  // General RPG theme
  gold: "bg-amber-950/40 text-amber-300 border-amber-500/40",
  mana: "bg-cyan-950/40 text-cyan-300 border-cyan-500/40",
  health: "bg-red-950/40 text-red-300 border-red-500/40",
  xp: "bg-purple-950/40 text-purple-300 border-purple-500/40",
  neutral: "bg-slate-900/60 text-slate-300 border-slate-700/60",

  // Quest Difficulties
  trivial: "bg-slate-900/70 text-slate-400 border-slate-700/60",
  easy: "bg-emerald-950/50 text-emerald-300 border-emerald-500/50",
  medium: "bg-sky-950/50 text-sky-300 border-sky-500/50",
  hard: "bg-purple-950/50 text-purple-300 border-purple-500/50",

  // Rarity Tiers
  common: "bg-slate-900/70 text-slate-300 border-slate-600/50",
  uncommon: "bg-emerald-950/50 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
  rare: "bg-sky-950/50 text-sky-300 border-sky-500/50 shadow-[0_0_8px_rgba(14,165,233,0.2)]",
  epic: "bg-purple-950/50 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.25)]",
  legendary: "bg-amber-950/50 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
  mythic: "bg-rose-950/60 text-rose-300 border-rose-500/60 shadow-[0_0_14px_rgba(244,63,94,0.35)]",

  // Character Attributes
  strength: "bg-red-950/40 text-red-300 border-red-500/40",
  intellect: "bg-cyan-950/40 text-cyan-300 border-cyan-500/40",
  vitality: "bg-emerald-950/40 text-emerald-300 border-emerald-500/40",
  agility: "bg-amber-950/40 text-amber-300 border-amber-500/40",
  focus: "bg-purple-950/40 text-purple-300 border-purple-500/40",
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "sm",
  glow = false,
  icon,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium tracking-wide uppercase border rounded-md transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-2.5 py-1 text-xs gap-1.5",
        variantClasses[variant] || variantClasses.neutral,
        glow && "animate-pulse",
        className
      )}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
