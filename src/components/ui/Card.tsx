import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "gold" | "mana" | "xp" | "health";
  variant?: "default" | "elevated" | "subtle";
}

const glowStyles: Record<NonNullable<CardProps["glow"]>, string> = {
  none: "",
  gold: "border-amber-500/40 shadow-gold-glow",
  mana: "border-cyan-500/40 shadow-mana-glow",
  xp: "border-purple-500/40 shadow-xp-glow",
  health: "border-rose-500/40 shadow-health-glow",
};

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-rpg-surface/95 border-rpg-surface-border",
  elevated: "bg-rpg-surface-card/95 border-rpg-surface-border shadow-xl",
  subtle: "bg-rpg-surface-subtle/80 border-rpg-surface-border/60",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = "none", variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border backdrop-blur-md transition-all duration-200 overflow-hidden",
          variantStyles[variant],
          glowStyles[glow],
          className
        )}
        {...props}
      >
        {/* Subtle decorative gold corner highlight */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400/40 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400/40 rounded-tr-sm pointer-events-none" />
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-bold text-lg text-slate-100 tracking-tight leading-none",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-slate-400 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-4 pt-3 border-t border-rpg-surface-border/70 bg-rpg-surface-subtle/50",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
