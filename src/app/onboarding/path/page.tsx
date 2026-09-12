"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingData, saveOnboardingData } from "@/lib/onboarding";

type Path = {
  name: string;
  icon: string;
  eyebrow: string;
  description: string;
  tags: string[];
  image: string;
};

const paths: Path[] = [
  {
    name: "Warrior",
    icon: "⚔️",
    eyebrow: "DISCIPLINE BUILDS FREEDOM",
    description: "Build discipline and physical strength.",
    tags: ["Fitness", "Discipline", "Health"],
    image: "/images/warrior.webp",
  },
  {
    name: "Sage",
    icon: "🧠",
    eyebrow: "KNOWLEDGE TURNS POSSIBILITIES INTO REALITY",
    description: "Master knowledge, learning and focus.",
    tags: ["Learning", "Focus", "Growth"],
    image: "/images/sage.webp",
  },
  {
    name: "Creator",
    icon: "✦",
    eyebrow: "IDEAS CREATE A BRIGHTER TOMORROW",
    description: "Turn ideas into meaningful creations.",
    tags: ["Creativity", "Productivity", "Impact"],
    image: "/images/creator.webp",
  },
];

export default function PathPage() {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    const savedPath = getOnboardingData().path;

    if (paths.some((path) => path.name === savedPath)) {
      setSelectedPath(savedPath);
    }
  }, []);

  const handlePathClick = (name: string) => {
    setSelectedPath((current) => (current === name ? null : name));
  };

  const handleContinue = () => {
    if (!selectedPath) return;

    saveOnboardingData({ path: selectedPath });
    router.push("/onboarding/goals");
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#06060d] bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: "url('/images/rpg-bg.webp')",
      }}
    >

      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none absolute inset-0">

        <div
          className="absolute left-1/2 top-[35%]
          h-[700px] w-[900px]
          -translate-x-1/2 rounded-full
          bg-purple-700/10 blur-[160px]"
        />

        <div
          className="absolute -left-40 bottom-[-100px]
          h-[500px] w-[500px]
          rounded-full bg-violet-900/20 blur-[130px]"
        />

        <div
          className="absolute -right-40 top-[-100px]
          h-[450px] w-[450px]
          rounded-full bg-purple-900/15 blur-[130px]"
        />

        <div className="absolute left-[18%] top-[18%] h-1 w-1 rounded-full bg-white/60" />
        <div className="absolute left-[32%] top-[12%] h-1 w-1 rounded-full bg-purple-300/70" />
        <div className="absolute right-[28%] top-[20%] h-1 w-1 rounded-full bg-white/40" />
        <div className="absolute right-[12%] top-[40%] h-1 w-1 rounded-full bg-purple-300/50" />
        <div className="absolute left-[8%] top-[50%] h-1 w-1 rounded-full bg-white/30" />

        <div
          className="absolute inset-0
          bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,.72)_100%)]"
        />
      </div>

      {/* ================= HEADER ================= */}

      <header className="relative z-20 border-b border-white/[0.08]">

        <div
          className="mx-auto flex h-[90px] max-w-[1500px]
          items-center justify-between px-6 md:px-12"
        >

          <div>
            <div className="text-[25px] font-black tracking-[-0.04em]">
              <span className="text-purple-400">X</span>PERIENCE
            </div>

            <div className="mt-[-2px] text-[9px] tracking-[0.45em] text-white/40">
              LIFE RPG
            </div>
          </div>

          {/* Progress */}

          <div className="hidden items-center md:flex">

            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center
                rounded-full bg-indigo-400 text-sm font-bold text-black"
              >
                ✓
              </div>

              <span className="text-sm text-white/55">
                Your Name
              </span>
            </div>

            <div className="mx-5 h-px w-24 bg-gradient-to-r from-indigo-400 to-purple-500" />

            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center
                rounded-full border border-purple-300
                bg-purple-500/20
                shadow-[0_0_25px_rgba(168,85,247,.55)]"
              >
                <span className="h-2 w-2 rounded-full bg-purple-300" />
              </div>

              <span className="font-medium text-white">
                Choose Path
              </span>
            </div>

            <div className="mx-5 h-px w-24 bg-white/10" />

            <div className="flex items-center gap-3 text-white/30">
              <div
                className="flex h-7 w-7 items-center justify-center
                rounded-full border border-white/20 text-xs"
              >
                3
              </div>

              <span>Set Goals</span>
            </div>

          </div>

          <div className="hidden text-right lg:block">
            <p className="text-[10px] tracking-[0.35em] text-white/30">
              A BETTER YOU
            </p>

            <p className="mt-1 text-[11px] tracking-[0.25em] text-white/50">
              LEVELS UP THE WORLD
            </p>
          </div>

        </div>
      </header>

      {/* ================= MAIN ================= */}

      <section
        className="relative z-10 mx-auto max-w-[1250px]
        px-5 pb-14 pt-14 md:px-8 md:pt-16"
      >

        {/* Heading */}

        <div className="text-center">

          <p
            className="text-[13px] font-semibold
            tracking-[0.45em] text-purple-400"
          >
            CHAPTER 02
          </p>

          <h1
            className="mt-3 text-5xl font-black
            tracking-[-0.04em] md:text-7xl"
          >
            Choose Your{" "}
            <span
              className="bg-gradient-to-r
              from-violet-300 via-purple-400
              to-fuchsia-500 bg-clip-text text-transparent"
            >
              Path
            </span>
          </h1>

          <p className="mt-4 text-base text-white/50 md:text-lg">
            What kind of hero do you want to become?
          </p>

        </div>

        {/* ================= CARDS ================= */}

        <div className="mt-12 grid gap-5 md:grid-cols-3">

          {paths.map((path) => {

            const isSelected =
              selectedPath === path.name;

            const anotherSelected =
              selectedPath !== null &&
              selectedPath !== path.name;

            return (
              <button
                key={path.name}
                type="button"
                onClick={() => handlePathClick(path.name)}
                className={`group relative h-[430px]
                  overflow-hidden rounded-[26px]
                  border text-left
                  transition-all duration-500
                  ease-out
                  ${
                    isSelected
                      ? `
                        z-20
                        -translate-y-5
                        scale-[1.045]
                        border-purple-200
                        shadow-[0_0_25px_rgba(168,85,247,.65),
                        0_0_90px_rgba(139,92,246,.35)]
                      `
                      : anotherSelected
                        ? `
                          scale-[0.97]
                          opacity-60
                          border-white/10
                        `
                        : `
                          border-white/15
                          bg-white/[0.02]
                          hover:-translate-y-2
                          hover:scale-[1.015]
                          hover:border-purple-400/50
                        `
                  }`}
              >

                {/* ================= ACTUAL IMAGE ================= */}

                <div
                  className="absolute inset-0
                  bg-cover bg-center
                  transition-transform duration-700
                  group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${path.image})`,
                  }}
                />

                {/* Dark cinematic overlay */}

                <div
                  className="absolute inset-0
                  bg-gradient-to-t
                  from-[#040407]
                  via-[#050509]/65
                  to-black/10"
                />

                {/* Selected purple atmosphere */}

                <div
                  className={`absolute inset-0
                    transition-opacity duration-500
                    ${
                      isSelected
                        ? "bg-[radial-gradient(circle_at_center,rgba(168,85,247,.30),transparent_55%)] opacity-100"
                        : "opacity-0"
                    }`}
                />

                {/* Selected check */}

                {isSelected && (
                  <div
                    className="absolute right-5 top-5 z-20
                    flex h-10 w-10 items-center justify-center
                    rounded-full bg-white
                    text-sm font-black text-purple-700
                    shadow-[0_0_30px_rgba(255,255,255,.75)]"
                  >
                    ✓
                  </div>
                )}

                {/* Icon */}

                <div
                  className={`absolute left-7 top-7 z-10
                    flex h-16 w-16 items-center justify-center
                    rounded-full border text-3xl
                    transition-all duration-500
                    ${
                      isSelected
                        ? `
                          scale-110
                          border-purple-200
                          bg-purple-500/25
                          shadow-[0_0_35px_rgba(168,85,247,.65)]
                        `
                        : `
                          border-white/20
                          bg-black/20
                        `
                    }`}
                >
                  {path.icon}
                </div>

                {/* Content */}

                <div className="absolute bottom-7 left-7 right-7 z-10">

                  <p
                    className={`max-w-[200px]
                    text-[10px] font-bold
                    tracking-[0.28em]
                    ${
                      isSelected
                        ? "text-purple-200"
                        : "text-white/60"
                    }`}
                  >
                    {path.eyebrow}
                  </p>

                  <h2
                    className={`mt-3 text-4xl
                    font-black transition-all duration-500
                    ${
                      isSelected
                        ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,.2)]"
                        : ""
                    }`}
                  >
                    {path.name}
                  </h2>

                  <p
                    className="mt-2 max-w-[280px]
                    text-[15px] leading-relaxed text-white/60"
                  >
                    {path.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">

                    {path.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full border
                        px-3 py-1.5 text-[11px]
                        transition-all duration-300
                        ${
                          isSelected
                            ? `
                              border-purple-300/40
                              bg-purple-500/20
                              text-purple-100
                            `
                            : `
                              border-white/10
                              bg-black/20
                              text-white/50
                            `
                        }`}
                      >
                        {tag}
                      </span>
                    ))}

                  </div>

                </div>

              </button>
            );
          })}

        </div>

        {/* ================= CONTINUE ================= */}

        <div className="mx-auto mt-10 max-w-[580px]">

          <button
            type="button"
            onClick={handleContinue}
            className={`group relative w-full overflow-hidden
              rounded-2xl border px-8 py-5
              text-lg font-bold
              transition-all duration-300
              ${
                selectedPath
                  ? `
                    border-purple-300/40
                    bg-gradient-to-r
                    from-violet-600
                    via-purple-600
                    to-fuchsia-600
                    shadow-[0_0_40px_rgba(139,92,246,.45)]
                    hover:scale-[1.02]
                  `
                  : `
                    border-white/10
                    bg-white/[0.05]
                    text-white/50
                    hover:border-purple-400/30
                    hover:text-white
                  `
              }`}
          >

            <span
              className="absolute inset-0
              -translate-x-full
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
              transition-transform duration-700
              group-hover:translate-x-full"
            />

            <span className="relative">

              {selectedPath
                ? `Continue as ${selectedPath}`
                : "Continue Your Journey"}

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

        <div className="mt-12 flex items-center justify-between">

          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="group flex items-center gap-3
            text-white/40 transition hover:text-white"
          >
            <span
              className="flex h-11 w-11 items-center
              justify-center rounded-full
              border border-white/10 text-xl
              transition group-hover:border-purple-400/50"
            >
              ←
            </span>

            <span className="hidden text-left md:block">
              <span className="block text-sm">
                Back
              </span>

              <span className="text-[11px] text-white/25">
                Change Name
              </span>
            </span>
          </button>

          <p
            className="hidden text-center text-[10px]
            tracking-[0.35em] text-white/30 md:block"
          >
            THE JOURNEY OF A THOUSAND LEVELS
            <br />
            BEGINS WITH A SINGLE CHOICE.
          </p>

          <div className="text-right">
            <p className="text-[9px] tracking-[0.25em] text-white/20">
              NEXT CHAPTER
            </p>

            <p className="mt-1 text-xs text-purple-300/60">
              SET YOUR GOALS
            </p>
          </div>

        </div>

      </section>
    </main>
  );
}
