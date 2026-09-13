"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOnboardingData, saveOnboardingData, syncOnboardingToProfile } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";

type Goal = {
  name: string;
  icon: string;
  description: string;
  image: string;
  label: string;
};

const goals: Goal[] = [
  {
    name: "Fitness",
    icon: "💪",
    description: "Build strength, energy and a healthier body.",
    image: "/images/fitness.png",
    label: "STRONGER YOU",
  },
  {
    name: "Learning",
    icon: "📚",
    description: "Gain knowledge and develop valuable skills.",
    image: "/images/learning.png",
    label: "WISER YOU",
  },
  {
    name: "Mental Growth",
    icon: "🧠",
    description: "Improve focus, mindset and inner strength.",
    image: "/images/mental-growth.png",
    label: "CALMER YOU",
  },
  {
    name: "Career",
    icon: "💼",
    description: "Level up your career and professional life.",
    image: "/images/career.png",
    label: "BIGGER PURPOSE",
  },
  {
    name: "Creativity",
    icon: "🎨",
    description: "Create, experiment and turn ideas into reality.",
    image: "/images/creativity.png",
    label: "BOLDER YOU",
  },
  {
    name: "Finance",
    icon: "💰",
    description: "Build better financial habits and stability.",
    image: "/images/finance.png",
    label: "FREER YOU",
  },
  {
    name: "Relationships",
    icon: "❤️",
    description: "Strengthen meaningful connections with others.",
    image: "/images/relationships.png",
    label: "CLOSER YOU",
  },
  {
    name: "Personal Growth",
    icon: "🌱",
    description: "Become a better version of yourself every day.",
    image: "/images/personal-growth.png",
    label: "HAPPIER YOU",
  },
];

export default function GoalsPage() {
  const router = useRouter();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    const savedGoals = getOnboardingData().goals;

    setSelectedGoals(
      savedGoals.filter((savedGoal) =>
        goals.some((goal) => goal.name === savedGoal)
      )
    );
  }, []);

  // Select / deselect individual goal
  const toggleGoal = (name: string) => {
    setSelectedGoals((current) => {
      if (current.includes(name)) {
        return current.filter((goal) => goal !== name);
      }

      return [...current, name];
    });
  };

  // Deselect everything
  const deselectAll = () => {
    setSelectedGoals([]);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Save selected goals and continue to dashboard
  const handleContinue = async () => {
    if (selectedGoals.length === 0 || isSyncing) return;

    setIsSyncing(true);
    saveOnboardingData({
      goals: selectedGoals,
    });

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await syncOnboardingToProfile(supabase, user.id, {
          goals: selectedGoals,
        });
        router.push("/dashboard");
      } else {
        router.push("/signup?redirectedFrom=/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden
      bg-[#050514] bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: "url('/images/goals-background.png')",
      }}
    >
      {/* ================= DARK OVERLAY ================= */}

      <div
        className="pointer-events-none absolute inset-0
        bg-[#02020a]/35"
      />

      <div
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,2,12,.75)_100%)]"
      />

      {/* ================= HEADER ================= */}

      <header
        className="relative z-30 border-b border-white/[0.08]
        bg-black/10 backdrop-blur-[2px]"
      >
        <div
          className="mx-auto flex h-[90px] max-w-[1500px]
          items-center justify-between px-6 md:px-12"
        >
          {/* LOGO */}

          <Link href="/" className="cursor-pointer group">
            <div
              className="text-[25px] font-black
              tracking-[-0.04em] transition group-hover:text-white/90"
            >
              <span className="text-purple-400">X</span>PERIENCE
            </div>

            <div
              className="mt-[-2px] text-[9px]
              tracking-[0.45em] text-white/40 group-hover:text-white/60"
            >
              LIFE RPG
            </div>
          </Link>

          {/* PROGRESS */}

          <div className="hidden items-center md:flex">

            {/* NAME */}

            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center
                justify-center rounded-full
                bg-indigo-400 text-sm font-bold text-black
                shadow-[0_0_20px_rgba(129,140,248,.5)]"
              >
                ✓
              </div>

              <span className="text-sm text-white/55">
                Your Name
              </span>
            </div>

            <div
              className="mx-5 h-px w-24
              bg-gradient-to-r from-indigo-400 to-purple-500"
            />

            {/* PATH */}

            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center
                justify-center rounded-full
                bg-indigo-400 text-sm font-bold text-black
                shadow-[0_0_20px_rgba(129,140,248,.5)]"
              >
                ✓
              </div>

              <span className="text-sm text-white/55">
                Choose Path
              </span>
            </div>

            <div
              className="mx-5 h-px w-24
              bg-gradient-to-r from-purple-500 to-fuchsia-500"
            />

            {/* GOALS */}

            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center
                justify-center rounded-full
                border border-purple-300
                bg-purple-500/20
                shadow-[0_0_25px_rgba(168,85,247,.7)]"
              >
                <span
                  className="h-2 w-2 rounded-full
                  bg-purple-300"
                />
              </div>

              <span className="font-medium text-white">
                Set Goals
              </span>
            </div>
          </div>

          {/* RIGHT TEXT */}

          <div className="hidden text-right lg:block">
            <p
              className="text-[10px]
              tracking-[0.35em] text-white/35"
            >
              A BETTER YOU
            </p>

            <p
              className="mt-1 text-[11px]
              tracking-[0.25em] text-white/50"
            >
              LEVELS UP THE WORLD
            </p>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <section
        className="relative z-10 mx-auto max-w-[1350px]
        px-5 pb-16 pt-12 md:px-8 md:pt-14"
      >
        {/* ================= TITLE ================= */}

        <div className="text-center">

          <p
            className="text-[13px] font-semibold
            tracking-[0.5em] text-purple-300
            drop-shadow-[0_0_15px_rgba(168,85,247,.9)]"
          >
            CHAPTER 03
          </p>

          <h1
            className="mt-3 text-5xl font-black
            tracking-[-0.05em] md:text-7xl"
          >
            Set Your{" "}
            <span
              className="bg-gradient-to-r
              from-violet-200 via-purple-400
              to-fuchsia-400 bg-clip-text text-transparent
              drop-shadow-[0_0_25px_rgba(168,85,247,.4)]"
            >
              Goals
            </span>
          </h1>

          <p
            className="mt-4 text-base
            text-white/70 md:text-lg"
          >
            What do you want to level up in your life?
          </p>

          <p className="mt-1 text-sm text-white/40">
            Choose everything that matters to you.
          </p>
        </div>

        {/* ================= GOAL CARDS ================= */}

        <div
          role="group"
          aria-label="Choose your goals"
          className="mt-10 grid gap-5
          sm:grid-cols-2 lg:grid-cols-4"
        >
          {goals.map((goal) => {
            const isSelected =
              selectedGoals.includes(goal.name);

            const anotherSelected =
              selectedGoals.length > 0 && !isSelected;

            return (
              <button
                key={goal.name}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${goal.name}: ${goal.description}`}
                onClick={() => toggleGoal(goal.name)}
                className={`group relative h-[315px]
                  overflow-hidden rounded-[24px]
                  border text-left
                  transition-all duration-500
                  ease-out
                  ${
                    isSelected
                      ? `
                        z-20
                        -translate-y-4
                        scale-[1.04]
                        border-purple-200
                        shadow-[0_0_25px_rgba(168,85,247,.9),
                        0_0_80px_rgba(139,92,246,.45)]
                      `
                      : anotherSelected
                        ? `
                          scale-[0.98]
                          opacity-65
                          border-white/15
                        `
                        : `
                          border-white/20
                          bg-black/20
                          hover:-translate-y-2
                          hover:scale-[1.015]
                          hover:border-purple-400/60
                          hover:shadow-[0_0_30px_rgba(168,85,247,.3)]
                        `
                  }`}
              >
                {/* CARD IMAGE */}

                <div
                  className="absolute inset-0
                  bg-cover bg-center
                  transition-transform duration-700
                  group-hover:scale-105"
                  style={{
                    backgroundImage:
                      `url('${goal.image}')`,
                  }}
                />

                {/* IMAGE OVERLAY */}

                <div
                  className="absolute inset-0
                  bg-gradient-to-t
                  from-[#03030a] via-[#050514]/65
                  to-black/10"
                />

                {/* SELECTED PURPLE GLOW */}

                <div
                  className={`absolute inset-0
                  transition-opacity duration-500
                  ${
                    isSelected
                      ? `
                        opacity-100
                        bg-[radial-gradient(
                          circle_at_center,
                          rgba(168,85,247,.38),
                          transparent_58%
                        )]
                      `
                      : "opacity-0"
                  }`}
                />

                {/* ================= CHECK ================= */}

                <div
                  className={`absolute right-4 top-4 z-20
                  flex h-9 w-9 items-center justify-center
                  rounded-full border
                  transition-all duration-500
                  ${
                    isSelected
                      ? `
                        scale-110
                        border-white
                        bg-white
                        text-purple-700
                        shadow-[0_0_25px_rgba(255,255,255,.85)]
                      `
                      : `
                        border-white/70
                        bg-black/30
                        text-transparent
                      `
                  }`}
                >
                  ✓
                </div>

                {/* ================= ICON ================= */}

                <div
                  className={`absolute left-5 top-5 z-10
                  flex h-12 w-12 items-center justify-center
                  rounded-xl border text-2xl
                  bg-black/35 backdrop-blur-sm
                  transition-all duration-500
                  ${
                    isSelected
                      ? `
                        scale-110
                        border-purple-200
                        bg-purple-500/30
                        shadow-[0_0_30px_rgba(168,85,247,.8)]
                      `
                      : `
                        border-white/25
                      `
                  }`}
                >
                  {goal.icon}
                </div>

                {/* ================= CONTENT ================= */}

                <div
                  className="absolute bottom-5
                  left-5 right-5 z-10"
                >
                  <h2
                    className={`text-2xl font-black
                    transition-all duration-300
                    ${
                      isSelected
                        ? `
                          text-white
                          drop-shadow-[0_0_15px_rgba(255,255,255,.5)]
                        `
                        : ""
                    }`}
                  >
                    {goal.name}
                  </h2>

                  <p
                    className="mt-2 max-w-[280px]
                    text-sm leading-relaxed text-white/75"
                  >
                    {goal.description}
                  </p>

                  <div
                    className="mt-4 flex
                    items-center gap-3"
                  >
                    <span
                      className={`h-px w-8
                      ${
                        isSelected
                          ? "bg-purple-300 shadow-[0_0_8px_rgba(168,85,247,1)]"
                          : "bg-white/30"
                      }`}
                    />

                    <span
                      className={`text-[9px]
                      font-bold tracking-[0.28em]
                      ${
                        isSelected
                          ? "text-purple-200"
                          : "text-white/40"
                      }`}
                    >
                      {goal.label}
                    </span>

                    <span
                      className={`h-px flex-1
                      ${
                        isSelected
                          ? "bg-purple-300/60"
                          : "bg-white/15"
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ================= ACTION BAR ================= */}

        <div
          className="mx-auto mt-8 grid max-w-[1100px]
          gap-4 md:grid-cols-[180px_1fr_280px]"
        >
          {/* DESELECT ALL */}

          <button
            type="button"
            onClick={deselectAll}
            className="group flex items-center
              justify-center gap-3 rounded-2xl
              border border-white/20
              bg-black/30 px-5 py-4
              text-sm font-semibold text-white/70
              backdrop-blur-md
              transition-all duration-300
              hover:border-purple-400/60
              hover:bg-purple-500/10
              hover:text-white"
          >
            <span
              className="flex h-6 w-6 items-center
              justify-center rounded-full
              border border-white/60 text-xs
              transition
              group-hover:border-purple-300"
            >
              ×
            </span>

            Deselect All
          </button>

          {/* SELECTED SUMMARY */}

          <div
            className="flex min-h-[60px]
            items-center justify-center gap-4
            rounded-2xl border border-white/15
            bg-black/30 px-5
            backdrop-blur-md"
          >
            <div className="flex -space-x-2">
              {selectedGoals.slice(0, 4).map((selectedGoal) => {
                const goal = goals.find(
                  (item) => item.name === selectedGoal
                );

                return (
                  <div
                    key={selectedGoal}
                    className="flex h-9 w-9
                    items-center justify-center
                    rounded-full
                    border border-purple-300/50
                    bg-purple-900/80 text-lg
                    shadow-[0_0_15px_rgba(168,85,247,.4)]"
                  >
                    {goal?.icon}
                  </div>
                );
              })}

              {selectedGoals.length === 0 && (
                <div
                  className="flex h-9 w-9
                  items-center justify-center
                  rounded-full border
                  border-white/25 text-white/30"
                >
                  +
                </div>
              )}
            </div>

            <div className="h-7 w-px bg-white/15" />

            <span className="text-sm text-white/70">
              <span className="font-bold text-white">
                {selectedGoals.length}
              </span>{" "}
              {selectedGoals.length === 1
                ? "goal selected"
                : "goals selected"}
            </span>
          </div>

          {/* CONTINUE */}

          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedGoals.length === 0}
            aria-disabled={selectedGoals.length === 0}
            className={`group relative overflow-hidden
              rounded-2xl border px-7 py-4
              text-base font-bold
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-white/15 disabled:hover:text-white/45
              ${
                selectedGoals.length > 0
                  ? `
                    border-purple-300/50
                    bg-gradient-to-r
                    from-violet-600
                    via-purple-600
                    to-fuchsia-600
                    shadow-[0_0_35px_rgba(139,92,246,.6)]
                    hover:scale-[1.025]
                    hover:shadow-[0_0_60px_rgba(139,92,246,.8)]
                  `
                  : `
                    border-white/15
                    bg-black/25
                    text-white/45
                    hover:border-purple-400/40
                    hover:text-white
                  `
              }`}
          >
            <span
              className="absolute inset-0
              -translate-x-full
              bg-gradient-to-r
              from-transparent via-white/20
              to-transparent
              transition-transform duration-700
              group-hover:translate-x-full"
            />

            <span className="relative">
              Continue Your Journey

              <span
                className="ml-3 inline-block
                transition-transform duration-300
                group-hover:translate-x-2"
              >
                →
              </span>
            </span>
          </button>
        </div>

        {/* ================= FOOTER ================= */}

        <div
          className="mt-10 flex
          items-center justify-between"
        >
          {/* BACK */}

          <button
            type="button"
            onClick={() => router.push("/onboarding/path")}
            className="group flex items-center
            gap-3 text-white/45
            transition hover:text-white"
          >
            <span
              className="flex h-11 w-11
              items-center justify-center
              rounded-full border border-white/15
              text-xl transition
              group-hover:border-purple-400/60
              group-hover:bg-purple-500/10"
            >
              ←
            </span>

            <span className="hidden text-left md:block">
              <span className="block text-sm">
                Back
              </span>

              <span className="text-[11px] text-white/25">
                Choose Path
              </span>
            </span>
          </button>

          {/* QUOTE */}

          <p
            className="hidden text-center
            text-[10px] tracking-[0.35em]
            text-white/30 md:block"
          >
            THE JOURNEY OF A THOUSAND LEVELS
            <br />
            BEGINS WITH A SINGLE CHOICE.
          </p>

          {/* NEXT */}

          <div className="text-right">
            <p
              className="text-[9px]
              tracking-[0.25em] text-white/25"
            >
              NEXT CHAPTER
            </p>

            <p
              className="mt-1 text-xs
              text-purple-300/70"
            >
              ENTER YOUR WORLD
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
