/**
 * Centralized Quest Completion Streak System
 * Features: Consistent UTC calendar day evaluation, duplicate completion prevention,
 *           missed-day handling, longest_streak preservation, and history reconciliation.
 */

export interface StreakProgressionInput {
  lastCompletionDate: string | null;
  currentStreak: number;
  longestStreak: number;
  newCompletionDate?: string | Date;
  timezone?: string;
}

export interface StreakProgressionResult {
  newCurrentStreak: number;
  newLongestStreak: number;
  streakIncremented: boolean;
  isSameDay: boolean;
  isConsecutive: boolean;
  isMissedDay: boolean;
}

export interface StreakStatusResult {
  activeStreak: number;
  longestStreak: number;
  completedToday: boolean;
  canExtendToday: boolean;
  isLapsed: boolean;
}

/**
 * Returns the calendar day string in 'YYYY-MM-DD' format for a given date in the specified timezone.
 * Defaults to 'UTC' for consistent global evaluation.
 */
export function getCalendarDay(
  date: Date | string | number,
  timezone: string = 'UTC'
): string {
  const d = typeof date === 'object' ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date provided to getCalendarDay: ${date}`);
  }

  // Format YYYY-MM-DD in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(d);
}

/**
 * Computes the signed difference in calendar days between two 'YYYY-MM-DD' strings (dayA - dayB).
 */
export function diffCalendarDays(dayA: string, dayB: string): number {
  const [yA, mA, dA] = dayA.split('-').map(Number);
  const [yB, mB, dB] = dayB.split('-').map(Number);

  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utcA - utcB) / msPerDay);
}

/**
 * Pure function: Calculates updated current_streak and longest_streak for a new quest completion.
 *
 * Rules:
 * 1. First completion ever: current_streak = 1, longest_streak = max(longest, 1).
 * 2. Same day duplicate: streak is preserved, streak_incremented = false.
 * 3. Consecutive day (yesterday): current_streak += 1, longest_streak = max(longest, current).
 * 4. Missed day (> 1 day ago): current_streak = 1, longest_streak preserved.
 */
export function calculateStreakProgression(
  input: StreakProgressionInput
): StreakProgressionResult {
  const tz = input.timezone || 'UTC';
  const today = getCalendarDay(input.newCompletionDate || new Date(), tz);
  const currentStreak = Math.max(0, input.currentStreak || 0);
  const longestStreak = Math.max(0, input.longestStreak || 0);

  if (!input.lastCompletionDate) {
    const newCurrent = 1;
    const newLongest = Math.max(longestStreak, newCurrent);
    return {
      newCurrentStreak: newCurrent,
      newLongestStreak: newLongest,
      streakIncremented: true,
      isSameDay: false,
      isConsecutive: false,
      isMissedDay: false,
    };
  }

  const lastDay = getCalendarDay(input.lastCompletionDate, tz);
  const diff = diffCalendarDays(today, lastDay);

  if (diff <= 0) {
    // Already completed a quest today (or earlier in the same calendar day)
    const newCurrent = Math.max(1, currentStreak);
    const newLongest = Math.max(longestStreak, newCurrent);
    return {
      newCurrentStreak: newCurrent,
      newLongestStreak: newLongest,
      streakIncremented: false,
      isSameDay: true,
      isConsecutive: false,
      isMissedDay: false,
    };
  }

  if (diff === 1) {
    // Completed yesterday: streak extends!
    const newCurrent = currentStreak + 1;
    const newLongest = Math.max(longestStreak, newCurrent);
    return {
      newCurrentStreak: newCurrent,
      newLongestStreak: newLongest,
      streakIncremented: true,
      isSameDay: false,
      isConsecutive: true,
      isMissedDay: false,
    };
  }

  // Missed one or more days: reset to 1, preserve longest_streak
  const newCurrent = 1;
  const newLongest = Math.max(longestStreak, 1);
  return {
    newCurrentStreak: newCurrent,
    newLongestStreak: newLongest,
    streakIncremented: true,
    isSameDay: false,
    isConsecutive: false,
    isMissedDay: true,
  };
}

/**
 * Determines current active streak status for dashboard display.
 */
export function getStreakStatus(
  lastCompletionDate: string | null,
  currentStreak: number,
  longestStreak: number,
  referenceDate: Date = new Date(),
  timezone: string = 'UTC'
): StreakStatusResult {
  const safeCurrent = Math.max(0, currentStreak || 0);
  const safeLongest = Math.max(0, longestStreak || 0);

  if (!lastCompletionDate || safeCurrent === 0) {
    return {
      activeStreak: 0,
      longestStreak: safeLongest,
      completedToday: false,
      canExtendToday: true,
      isLapsed: false,
    };
  }

  const today = getCalendarDay(referenceDate, timezone);
  const lastDay = getCalendarDay(lastCompletionDate, timezone);
  const diff = diffCalendarDays(today, lastDay);

  if (diff === 0) {
    return {
      activeStreak: safeCurrent,
      longestStreak: safeLongest,
      completedToday: true,
      canExtendToday: false,
      isLapsed: false,
    };
  }

  if (diff === 1) {
    return {
      activeStreak: safeCurrent,
      longestStreak: safeLongest,
      completedToday: false,
      canExtendToday: true,
      isLapsed: false,
    };
  }

  // More than 1 day has passed without quest completion: streak lapsed
  return {
    activeStreak: 0,
    longestStreak: safeLongest,
    completedToday: false,
    canExtendToday: true,
    isLapsed: true,
  };
}

/**
 * Reconciles and deterministically recalculates streaks from an entire audit log of completion dates.
 */
export function reconcileStreakFromCompletions(
  completionDates: (string | Date)[],
  referenceDate: Date = new Date(),
  timezone: string = 'UTC'
): { currentStreak: number; longestStreak: number; completedToday: boolean } {
  if (!completionDates || completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completedToday: false };
  }

  // Deduplicate and sort distinct calendar days in ascending order
  const uniqueDays = Array.from(
    new Set(completionDates.map((d) => getCalendarDay(d, timezone)))
  ).sort();

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completedToday: false };
  }

  let longest = 0;
  let currentRun = 0;
  let prevDay: string | null = null;

  for (const day of uniqueDays) {
    if (!prevDay) {
      currentRun = 1;
    } else {
      const diff = diffCalendarDays(day, prevDay);
      if (diff === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longest) {
      longest = currentRun;
    }
    prevDay = day;
  }

  const today = getCalendarDay(referenceDate, timezone);
  const mostRecentDay = uniqueDays[uniqueDays.length - 1];
  const diffFromToday = diffCalendarDays(today, mostRecentDay);

  let activeCurrent = 0;
  let completedToday = false;

  if (diffFromToday === 0) {
    activeCurrent = currentRun;
    completedToday = true;
  } else if (diffFromToday === 1) {
    activeCurrent = currentRun;
    completedToday = false;
  } else {
    activeCurrent = 0;
    completedToday = false;
  }

  return {
    currentStreak: activeCurrent,
    longestStreak: longest,
    completedToday,
  };
}
