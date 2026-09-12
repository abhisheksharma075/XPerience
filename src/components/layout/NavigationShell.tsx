"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export interface NavigationShellProps {
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({ children }) => {
  const pathname = usePathname();
  const isOnboardingChapter = pathname === "/onboarding/path" || pathname === "/onboarding/goals";

  return (
    <div className="relative min-h-screen flex flex-col bg-rpg-void text-slate-200 overflow-x-hidden selection:bg-rpg-gold selection:text-rpg-void">
      {/* Ambient Fantasy Vignette & Radial Light Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/10 via-purple-600/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[450px] h-[450px] bg-cyan-600/5 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[500px] h-[500px] bg-purple-700/5 blur-3xl rounded-full" />
      </div>

      {/* Top RPG Navigation Bar - omitted on dedicated onboarding wizard chapters */}
      {!isOnboardingChapter && <Navbar />}

      {/* Accessible App Content Container - exactly one semantic main is defined inside each page */}
      <div
        id="main-content"
        className={
          isOnboardingChapter
            ? "relative z-10 flex-1 w-full"
            : "relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        }
      >
        {children}
      </div>

      {/* Minimal RPG Footer */}
      {!isOnboardingChapter && (
        <footer className="relative z-10 border-t border-rpg-surface-border/60 bg-rpg-surface/40 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-400">XPerience</span>
              <span>—</span>
              <span>Turn Your Real Life into an RPG Adventure</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-rpg-surface-elevated border border-rpg-surface-border text-slate-400 text-[10px]">Tab</kbd>
                to navigate
              </span>
              <span>•</span>
              <span>Frontend Ready for Hackathon</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
