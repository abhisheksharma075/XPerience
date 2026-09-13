"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ProgressBarVariant = "xp" | "health" | "mana" | "gold";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
  variant?: ProgressBarVariant;
  label?: string;
  showValueText?: boolean;
  valueUnit?: string;
  size?: "sm" | "md" | "lg";
}

const variantGradients: Record<ProgressBarVariant, string> = {
  xp: "bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]",
  health: "bg-gradient-to-r from-red-700 via-rose-500 to-red-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]",
  mana: "bg-gradient-to-r from-cyan-600 via-sky-400 to-blue-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]",
  gold: "bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]",
};

const trackHeight: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-2",
  md: "h-3.5",
  lg: "h-5",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = "xp",
  label,
  showValueText = true,
  valueUnit,
  size = "md",
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {(label || showValueText) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="font-semibold tracking-wider text-slate-300 uppercase text-[11px]">
              {label}
            </span>
          )}
          {showValueText && (
            <span className="font-mono text-slate-400 text-[11px]">
              {value.toLocaleString()} / {max.toLocaleString()}{" "}
              {valueUnit && <span className="text-slate-500">{valueUnit}</span>}
              <span className="ml-1.5 text-slate-500">({Math.round(percentage)}%)</span>
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${variant} progress`}
        className={cn(
          "w-full rounded-full bg-rpg-surface-elevated border border-rpg-surface-border/80 overflow-hidden relative",
          trackHeight[size]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full transition-all relative", variantGradients[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Subtle animated specular glint */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
};
