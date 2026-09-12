export default function OnboardingPage() {
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

        <div className="mt-10">
          <input
            type="text"
            placeholder="Enter your hero name..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-5 py-4 text-white outline-none placeholder:text-white/30 focus:border-purple-500"
          />
        </div>

        <button
          className="mt-5 w-full rounded-xl bg-purple-600 px-6 py-4 font-semibold transition hover:bg-purple-500"
        >
          Continue ⚔️
        </button>

      </div>
    </main>
  );
}