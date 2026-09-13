import { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingData = {
  name: string;
  path: string;
  goals: string[];
};

const STORAGE_KEY = "xperience-onboarding";

export function getOnboardingData(): OnboardingData {
  if (typeof window === "undefined") {
    return {
      name: "",
      path: "",
      goals: [],
    };
  }

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        name: "",
        path: "",
        goals: [],
      };
    }

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        name: "",
        path: "",
        goals: [],
      };
    }

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      path: typeof parsed.path === "string" ? parsed.path : "",
      goals: Array.isArray(parsed.goals)
        ? parsed.goals.filter((g: unknown): g is string => typeof g === "string")
        : [],
    };
  } catch {
    return {
      name: "",
      path: "",
      goals: [],
    };
  }
}

export function saveOnboardingData(data: Partial<OnboardingData>) {
  if (typeof window === "undefined") return;

  const current = getOnboardingData();

  const updated: OnboardingData = {
    name: typeof data.name === "string" ? data.name : current.name,
    path: typeof data.path === "string" ? data.path : current.path,
    goals: Array.isArray(data.goals)
      ? data.goals.filter((g): g is string => typeof g === "string")
      : current.goals,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearOnboardingData() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(STORAGE_KEY);
}

export const goalQuestTemplates: Record<
  string,
  {
    title: string;
    description: string;
    xpReward: number;
    goldReward: number;
    difficulty: "easy" | "medium" | "hard";
  }
> = {
  Fitness: {
    title: "Daily Movement & Physical Training",
    description:
      "Complete 30 minutes of physical exercise or strength training to forge your vitality.",
    xpReward: 100,
    goldReward: 25,
    difficulty: "easy",
  },
  Learning: {
    title: "Intellectual Growth & Study",
    description:
      "Read or study a new topic for at least 25 minutes to expand your knowledge.",
    xpReward: 100,
    goldReward: 25,
    difficulty: "easy",
  },
  "Mental Growth": {
    title: "Mindfulness & Mental Fortitude",
    description:
      "Practice 15 minutes of meditation, deep focus, or journaling for mental clarity.",
    xpReward: 75,
    goldReward: 20,
    difficulty: "easy",
  },
  Career: {
    title: "Professional Deep Work Sprint",
    description:
      "Execute one focused work sprint with zero distractions to advance your career goals.",
    xpReward: 120,
    goldReward: 30,
    difficulty: "medium",
  },
  Creativity: {
    title: "Creative Crafting Session",
    description:
      "Create, write, design, or build something new for 30 minutes.",
    xpReward: 100,
    goldReward: 25,
    difficulty: "easy",
  },
  Finance: {
    title: "Financial Health & Budget Review",
    description:
      "Track daily expenses and align your spending with your long-term stability.",
    xpReward: 80,
    goldReward: 20,
    difficulty: "easy",
  },
  Relationships: {
    title: "Meaningful Connection & Check-in",
    description:
      "Reach out to a friend, family member, or colleague to nurture a real relationship.",
    xpReward: 75,
    goldReward: 20,
    difficulty: "easy",
  },
  "Personal Growth": {
    title: "Evening Reflection & Daily Debrief",
    description:
      "Reflect on wins, lessons, and tomorrow priorities to level up every single day.",
    xpReward: 90,
    goldReward: 25,
    difficulty: "easy",
  },
};

/**
 * Synchronizes onboarding selections (hero name, path archetype, and goals)
 * to the authenticated Supabase user's profile and quests table.
 */
export async function syncOnboardingToProfile(
  supabase: SupabaseClient,
  userId: string,
  data?: Partial<OnboardingData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify authenticated user from session or getUser
    let user: { id: string; email?: string } | null = null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      user = sessionData.session.user;
    } else {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (!authError && userData?.user) {
        user = userData.user;
      }
    }

    if (!user || user.id !== userId) {
      // Defer sync until an authenticated session is established
      return { success: false, error: "User is not authenticated" };
    }

    const onboarding = data
      ? { ...getOnboardingData(), ...data }
      : getOnboardingData();

    // Determine path attributes
    let strength = 1;
    let intelligence = 1;
    let discipline = 1;
    let vitality = 1;

    if (onboarding.path === "Warrior") {
      strength = 4;
      vitality = 3;
      discipline = 2;
      intelligence = 1;
    } else if (onboarding.path === "Sage") {
      intelligence = 4;
      discipline = 3;
      vitality = 2;
      strength = 1;
    } else if (onboarding.path === "Creator") {
      discipline = 3;
      intelligence = 3;
      vitality = 2;
      strength = 2;
    }

    // Check existing profile in a single fast query
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const defaultUsername = user.email
      ? `${user.email.split("@")[0]}_${user.id.slice(0, 4)}`
      : `player_${user.id.slice(0, 6)}`;
    const displayName = onboarding.name?.trim() || user.email?.split("@")[0] || "Player";

    if (!existingProfile) {
      // Single consolidated upsert
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          username: defaultUsername,
          display_name: displayName,
          xp: 0,
          level: 1,
          gold: 0,
          strength,
          intelligence,
          discipline,
          vitality,
        },
        { onConflict: "id" }
      );
    } else {
      // Update display name and archetype stats if custom
      const updates: Record<string, unknown> = {};
      if (onboarding.name && onboarding.name.trim()) {
        updates.display_name = onboarding.name.trim();
      }
      if (onboarding.path) {
        updates.strength = strength;
        updates.intelligence = intelligence;
        updates.discipline = discipline;
        updates.vitality = vitality;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", user.id);
      }
    }

    // 2. Check existing quests and seed quests from chosen goals if empty
    if (onboarding.goals && onboarding.goals.length > 0) {
      const { data: existingQuests } = await supabase
        .from("quests")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!existingQuests || existingQuests.length === 0) {
        const questsToInsert = onboarding.goals.map((goal) => {
          const template = goalQuestTemplates[goal] || {
            title: `Quest: ${goal}`,
            description: `Work toward your personal goal in ${goal}.`,
            xpReward: 100,
            goldReward: 25,
            difficulty: "easy" as const,
          };

          return {
            user_id: user.id,
            title: template.title,
            description: template.description,
            xp_reward: template.xpReward,
            gold_reward: template.goldReward,
            difficulty: template.difficulty,
            status: "active",
          };
        });

        const { error: questInsertError } = await supabase
          .from("quests")
          .insert(questsToInsert);

        if (questInsertError) {
          console.warn("Could not insert starter quests during sync:", questInsertError.message);
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to sync onboarding to Supabase:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown sync error",
    };
  }
}