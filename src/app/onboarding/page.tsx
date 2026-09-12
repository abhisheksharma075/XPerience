"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingData, saveOnboardingData } from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    setName(getOnboardingData().name);
  }, []);

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationMessage("Please name your hero before stepping onto the path.");
      return;
    }

    saveOnboardingData({ name: trimmedName });
    router.push("/onboarding/path");
  };

  return (
    <main className="min-h-screen bg-[#08080d] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">

        <p className="text-sm font-semibold tracking-widest text-purple-400">
          CHAPTER 01
        </p>

        <h1 className="mt-4 text-4xl md:text-6xl font-bold">
          Every Hero Has a Beginning.
        </h1>

        <p className="mt-5 text-white/50 text-lg">
          Before your adventure begins, tell us what we should call you.
        </p>

        <form onSubmit={handleContinue}>
          <div className="mt-10">
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (validationMessage) setValidationMessage("");
              }}
              placeholder="Enter your hero name..."
              aria-invalid={Boolean(validationMessage)}
              aria-describedby={validationMessage ? "hero-name-validation" : undefined}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-5 py-4 text-white outline-none placeholder:text-white/30 focus:border-purple-500"
            />
          </div>

          {validationMessage && (
            <p id="hero-name-validation" role="alert" className="mt-3 text-sm text-red-400">
              {validationMessage}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-purple-600 px-6 py-4 font-semibold transition hover:bg-purple-500"
          >
            Continue ⚔️
          </button>
        </form>

      </div>
    </main>
  );
}
