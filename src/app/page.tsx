"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Gamepad2,
  Sparkles,
  Sword,
  Trophy,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-rpg-void text-white">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute right-[-100px] top-[35%] h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-100px] h-[300px] w-[300px] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-5 py-20 sm:px-8">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-7"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              <Sparkles className="h-4 w-4" />
              Your Real Life. Your RPG.
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Turn Your Life
                <span className="block text-rpg-gold">
                  Into an RPG.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                XPerience transforms your real-world goals, habits and
                achievements into quests. Earn XP, build your character and
                level up your life — one quest at a time.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="group inline-flex items-center justify-center gap-2 rounded-xl bg-rpg-gold px-6 py-3.5 font-bold text-black shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:brightness-110">
                <Sword className="h-5 w-5" />
                Begin Your XPerience
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>

              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-rpg-surface-border bg-rpg-surface/60 px-6 py-3.5 font-semibold text-slate-200 transition hover:border-purple-400/40 hover:bg-rpg-surface">
                <Gamepad2 className="h-5 w-5 text-purple-400" />
                Explore the Journey
              </button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-5 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Real-world quests
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                XP & progression
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Personal growth
              </span>
            </div>
          </motion.div>

          {/* RIGHT SIDE - RPG CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute inset-8 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-rpg-surface-border bg-rpg-surface/80 p-6 shadow-2xl backdrop-blur-xl">
              
              {/* PLAYER HEADER */}
              <div className="flex items-center justify-between border-b border-rpg-surface-border pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10">
                    <Sword className="h-6 w-6 text-amber-300" />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Current Hero
                    </p>

                    <h2 className="font-bold">
                      The Beginner
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    LEVEL
                  </p>

                  <p className="text-2xl font-black text-rpg-gold">
                    07
                  </p>
                </div>
              </div>

              {/* XP BAR */}
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    EXPERIENCE
                  </span>

                  <span className="text-amber-300">
                    1,450 / 2,000 XP
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "72.5%" }}
                    transition={{
                      duration: 1.2,
                      delay: 0.5,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300"
                  />
                </div>
              </div>

              {/* STATS */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <Stat
                  icon={<Zap />}
                  label="STRENGTH"
                  value="24"
                />

                <Stat
                  icon={<Sparkles />}
                  label="FOCUS"
                  value="28"
                />

                <Stat
                  icon={<Flame />}
                  label="STREAK"
                  value="12d"
                />
              </div>

              {/* ACTIVE QUEST */}
              <div className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-400/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-300">
                  <Trophy className="h-4 w-4" />
                  Active Quest
                </div>

                <h3 className="mt-3 font-bold">
                  Complete Your Morning Routine
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Start the day by completing your personal routine.
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-300">
                    +100 XP
                  </span>

                  <span className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                    READY
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative border-t border-rpg-surface-border px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              Your Journey Begins Here
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Life becomes the game.
            </h2>

            <p className="mt-4 text-slate-400">
              Every small action counts. XPerience turns progress into
              something you can see, feel and celebrate.
            </p>
          </div>

          {/* THREE CARDS */}
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            
            <Feature
              number="01"
              icon={<Sword />}
              title="Choose Your Quests"
              description="Turn your goals and daily habits into meaningful real-world missions."
            />

            <Feature
              number="02"
              icon={<Zap />}
              title="Earn XP"
              description="Complete quests, build streaks and earn experience for every step forward."
            />

            <Feature
              number="03"
              icon={<Trophy />}
              title="Level Up"
              description="Watch your character grow as you grow. Unlock milestones and become your next version."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-5 py-24 text-center sm:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-400/10 to-transparent p-10 sm:p-16">
          
          <Sparkles className="mx-auto h-8 w-8 text-amber-300" />

          <h2 className="mt-5 text-3xl font-black sm:text-5xl">
            Become the hero of
            <span className="block text-rpg-gold">
              your own story.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-slate-400">
            You don't need a new life. You just need a new way to experience
            the one you're already living.
          </p>

          <button className="mt-8 inline-flex items-center gap-2 rounded-xl bg-rpg-gold px-7 py-3.5 font-bold text-black transition hover:brightness-110">
            Start Your Journey
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </main>
  );
}

/* STAT COMPONENT */

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-rpg-surface-border bg-black/20 p-3 text-center">
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center text-cyan-300">
        {icon}
      </div>

      <p className="text-[9px] font-bold tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

/* FEATURE CARD */

function Feature({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="rounded-2xl border border-rpg-surface-border bg-rpg-surface/60 p-6 transition hover:border-amber-400/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
          {icon}
        </div>

        <span className="font-mono text-sm text-slate-600">
          {number}
        </span>
      </div>

      <h3 className="mt-6 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </motion.div>
  );
}