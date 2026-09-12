import React from "react";
import { cn } from "@/lib/utils";
import { CharacterAttributeType } from "@/types/rpg";
import { Shield, Brain, Heart, Wind, Crosshair, Sparkles } from "lucide-react";

export interface StatDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  attribute: CharacterAttributeType;
  value: number;
  bonus?: number;
  label?: string;
  description?: string;
}

const attributeMeta: Record<
  CharacterAttributeType,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    accentText: string;
    accentBorder: string;
    accentBg: string;
    defaultDescription: string;
  }
> = {
  strength: {
    name: "Strength",
    icon: Shield,
    accentText: "text-red-400",
    accentBorder: "border-red-500/30 hover:border-red-500/60",
    accentBg: "bg-red-950/20",
    defaultDescription: "Increases physical fortitude and health",
  },
  intellect: {
    name: "Intellect",
    icon: Brain,
    accentText: "text-cyan-400",
    accentBorder: "border-cyan-500/30 hover:border-cyan-500/60",
    accentBg: "bg-cyan-950/20",
    defaultDescription: "Boosts focus, learning speed and mana pool",
  },
  vitality: {
    name: "Vitality",
    icon: Heart,
    accentText: "text-emerald-400",
    accentBorder: "border-emerald-500/30 hover:border-emerald-500/60",
    accentBg: "bg-emerald-950/20",
    defaultDescription: "Governs stamina recovery and streak resilience",
  },
  agility: {
    name: "Agility",
    icon: Wind,
    accentText: "text-amber-400",
    accentBorder: "border-amber-500/30 hover:border-amber-500/60",
    accentBg: "bg-amber-950/20",
    defaultDescription: "Improves task velocity and quest cooldowns",
  },
  focus: {
    name: "Focus",
    icon: Crosshair,
    accentText: "text-purple-400",
    accentBorder: "border-purple-500/30 hover:border-purple-500/60",
    accentBg: "bg-purple-950/20",
    defaultDescription: "Increases critical XP multiplier and deep work",
  },
};

export const StatDisplay: React.FC<StatDisplayProps> = ({
  attribute,
  value,
  bonus,
  label,
  description,
  className,
  ...props
}) => {
  const meta = attributeMeta[attribute] || {
    name: attribute,
    icon: Sparkles,
    accentText: "text-slate-300",
    accentBorder: "border-slate-700",
    accentBg: "bg-slate-900/30",
    defaultDescription: "",
  };
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "group relative p-4 rounded-xl border bg-rpg-surface/80 backdrop-blur-sm transition-all duration-200",
        meta.accentBorder,
        meta.accentBg,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "p-2 rounded-lg bg-rpg-surface-elevated/90 border border-rpg-surface-border",
              meta.accentText
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {label || meta.name}
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-1">
              {description || meta.defaultDescription}
            </div>
          </div>
        </div>

        {/* Numeric Stat Value */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span className={cn("text-2xl font-black font-mono", meta.accentText)}>
              {value}
            </span>
            {bonus !== undefined && bonus > 0 && (
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                +{bonus}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
