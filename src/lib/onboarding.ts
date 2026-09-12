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

export function saveOnboardingData(
  data: Partial<OnboardingData>
) {
  if (typeof window === "undefined") return;

  const current = getOnboardingData();

  const updated: OnboardingData = {
    name: typeof data.name === "string" ? data.name : current.name,
    path: typeof data.path === "string" ? data.path : current.path,
    goals: Array.isArray(data.goals)
      ? data.goals.filter((g): g is string => typeof g === "string")
      : current.goals,
  };

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
}

export function clearOnboardingData() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(STORAGE_KEY);
}