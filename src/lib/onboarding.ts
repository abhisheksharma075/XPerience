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

  const saved = sessionStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      name: "",
      path: "",
      goals: [],
    };
  }

  try {
    return JSON.parse(saved);
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

  const updated = {
    ...current,
    ...data,
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