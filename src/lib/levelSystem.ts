/**
 * Centralized Non-Linear Level Calculation System for XPerience RPG
 *
 * Formula:
 * Cumulative XP required to reach Level L (for L >= 2):
 *   TotalXP(L) = 50 * (L - 1)^2 + 50 * (L - 1)
 *
 * Progression Table Examples:
 *   Level 1: 0 XP
 *   Level 2: 100 XP (+100)
 *   Level 3: 300 XP (+200)
 *   Level 4: 600 XP (+300)
 *   Level 5: 1000 XP (+400)
 *   Level 10: 4500 XP
 *   Level 20: 19000 XP
 *   Level 50: 122500 XP
 *   Level 100: 495000 XP
 *
 * Inverse Formula (derived analytically):
 *   L = 1 + floor((-1 + sqrt(1 + 0.08 * TotalXP)) / 2)
 */

export interface LevelProgress {
  currentLevel: number;
  totalXp: number;
  currentLevelXp: number;     // XP earned within the current level bracket
  xpForNextLevel: number;     // Total XP needed to span current level -> next level
  xpToNextLevel: number;      // Remaining XP needed to reach next level
  progressPercentage: number; // 0 to 100 progress percentage within current level
  levelStartXP: number;       // Cumulative XP at which current level begins
  nextLevelXP: number;        // Cumulative XP required to reach next level
}

/**
 * Calculates the player's level deterministically from their total cumulative XP.
 * Progressively harder non-linear curve.
 *
 * @param totalXp Cumulative total XP (handles negative/zero/large numbers safely)
 * @returns Integer level (minimum 1)
 */
export function calculateLevelFromXP(totalXp: number): number {
  if (typeof totalXp !== 'number' || Number.isNaN(totalXp) || totalXp < 100) {
    return 1;
  }

  // Analytical root of quadratic equation 50x^2 + 50x - totalXp = 0
  const x = (-1 + Math.sqrt(1 + 0.08 * totalXp)) / 2;
  const level = 1 + Math.floor(x);

  return Math.max(1, level);
}

/**
 * Calculates the total cumulative XP required to reach a given level.
 *
 * @param level Target level (integer >= 1)
 * @returns Total cumulative XP required
 */
export function calculateXPRequiredForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level || 1));
  if (normalizedLevel <= 1) {
    return 0;
  }

  const step = normalizedLevel - 1;
  return 50 * step * step + 50 * step;
}

/**
 * Computes detailed level progression metrics for UI and game state.
 *
 * @param totalXp Total cumulative XP
 * @returns LevelProgress object containing bracket boundaries and percentages
 */
export function calculateLevelProgress(totalXp: number): LevelProgress {
  const safeTotalXp = Math.max(0, Math.floor(totalXp || 0));
  const currentLevel = calculateLevelFromXP(safeTotalXp);

  const levelStartXP = calculateXPRequiredForLevel(currentLevel);
  const nextLevelXP = calculateXPRequiredForLevel(currentLevel + 1);

  const xpForNextLevel = nextLevelXP - levelStartXP;
  const currentLevelXp = safeTotalXp - levelStartXP;
  const xpToNextLevel = Math.max(0, nextLevelXP - safeTotalXp);

  let progressPercentage = 0;
  if (xpForNextLevel > 0) {
    const rawPct = (currentLevelXp / xpForNextLevel) * 100;
    progressPercentage = Math.min(100, Math.max(0, Math.round(rawPct * 10) / 10));
  }

  return {
    currentLevel,
    totalXp: safeTotalXp,
    currentLevelXp,
    xpForNextLevel,
    xpToNextLevel,
    progressPercentage,
    levelStartXP,
    nextLevelXP,
  };
}
