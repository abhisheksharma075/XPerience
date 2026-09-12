"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Swords,
  Scroll,
  BarChart3,
  Backpack,
  User,
  Menu,
  X,
  Flame,
  Coins,
  ShieldAlert,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Hub", href: "/dashboard", icon: Swords },
  { name: "Quests", href: "/quests", icon: Scroll },
  { name: "Stats", href: "/stats", icon: BarChart3 },
  { name: "Inventory", href: "/inventory", icon: Backpack },
  { name: "Hero", href: "/hero", icon: User },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes or user hits Escape
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rpg-surface-border bg-rpg-void/90 backdrop-blur-md">
      {/* Skip to Content for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-rpg-gold focus:text-rpg-void focus:font-bold focus:rounded-md"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Crest & Logo */}
          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void rounded-lg"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 p-0.5 shadow-gold-glow flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-rpg-void rounded-[7px] flex items-center justify-center">
                  <Swords className="w-4 h-4 text-rpg-gold" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white tracking-wider font-mono">
                  XP<span className="text-rpg-gold">ERIENCE</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                  Life RPG
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "relative px-2.5 lg:px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 lg:gap-2 transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold focus-visible:ring-offset-2 focus-visible:ring-offset-rpg-void",
                      isActive
                        ? "text-rpg-gold bg-rpg-surface-elevated/80 shadow-[inset_0_1px_0_rgba(212,175,55,0.4)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-rpg-surface-subtle"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-rpg-gold" : "text-slate-400")} />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Character Quick HUD (Level, Gold, Streak) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Level Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <span className="text-[10px] text-purple-400 font-sans uppercase">LVL</span>
              <span>1</span>
            </div>

            {/* Gold Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>0</span>
            </div>

            {/* Streak Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>0d</span>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile streak indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>0</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-rpg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rpg-gold"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-rpg-surface-border bg-rpg-surface/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2"
          >
            {/* Character Quick Info in Mobile Menu */}
            <div className="flex items-center justify-between p-3 mb-2 rounded-lg bg-rpg-surface-subtle border border-rpg-surface-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-purple-200 font-mono text-xs font-bold">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-white">New Adventurer</div>
                  <div className="text-[10px] text-slate-400">Level 1 Hero</div>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="flex items-center gap-1 text-amber-300">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> 0
                </span>
                <span className="flex items-center gap-1 text-rose-300">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> 0d
                </span>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wider transition-colors",
                    isActive
                      ? "text-rpg-gold bg-rpg-surface-elevated border border-rpg-gold/40 shadow-gold-glow"
                      : "text-slate-300 hover:text-white hover:bg-rpg-surface-subtle"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-rpg-gold" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
