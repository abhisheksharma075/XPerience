'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateLevelProgress } from '@/lib/levelSystem';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface PlayerStats {
  id: string | null;
  email: string | null;
  displayName: string;
  level: number;
  xp: number;
  gold: number;
  currentStreak: number;
  longestStreak: number;
  isLoading: boolean;
}

const defaultStats: PlayerStats = {
  id: null,
  email: null,
  displayName: 'Adventurer',
  level: 1,
  xp: 0,
  gold: 0,
  currentStreak: 0,
  longestStreak: 0,
  isLoading: true,
};

interface PlayerContextType {
  stats: PlayerStats;
  updateStats: (updates: Partial<PlayerStats>) => void;
  refreshStats: (force?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType>({
  stats: defaultStats,
  updateStats: () => {},
  refreshStats: async () => {},
  signOut: async () => {},
});

export const RPG_SYNC_EVENT = 'xperience:rpg-sync';

/**
 * Dispatches a global browser event to immediately sync PlayerStats across
 * all components (Navbar, Hub, Quests, Hero, Inventory, Stats).
 */
export function broadcastRpgSync(updates?: Partial<PlayerStats>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(RPG_SYNC_EVENT, {
        detail: updates,
      })
    );
  }
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stats, setStats] = useState<PlayerStats>(defaultStats);
  const pathname = usePathname();
  const lastFetchTime = useRef<number>(0);
  const activeUserIdRef = useRef<string | null>(null);

  const supabase = createClient();

  // Updates in-memory stats immediately (0ms UI latency)
  const updateStats = useCallback((updates: Partial<PlayerStats>) => {
    setStats((prev) => {
      let resolvedLevel = updates.level ?? prev.level;
      if (updates.xp !== undefined && updates.level === undefined) {
        resolvedLevel = calculateLevelProgress(updates.xp).currentLevel;
      }

      return {
        ...prev,
        ...updates,
        level: resolvedLevel,
        isLoading: false,
      };
    });
  }, []);

  // Authoritative fetch from Supabase
  const refreshStats = useCallback(
    async (force = false) => {
      const now = Date.now();
      // Throttle rapid calls unless forced
      if (!force && now - lastFetchTime.current < 2000) {
        return;
      }
      lastFetchTime.current = now;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          activeUserIdRef.current = null;
          setStats({ ...defaultStats, isLoading: false });
          return;
        }

        const user = session.user;
        activeUserIdRef.current = user.id;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, display_name, username, xp, level, gold, current_streak, longest_streak')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('PlayerProvider: error fetching profile', error);
          return;
        }

        if (profile) {
          const progress = calculateLevelProgress(profile.xp || 0);
          const computedLevel = Math.max(profile.level || 1, progress.currentLevel);
          const resolvedDisplayName =
            profile.display_name ||
            profile.username ||
            user.email?.split('@')[0] ||
            'Hero';

          setStats({
            id: user.id,
            email: user.email || null,
            displayName: resolvedDisplayName,
            level: computedLevel,
            xp: profile.xp || 0,
            gold: profile.gold || 0,
            currentStreak: profile.current_streak || 0,
            longestStreak: profile.longest_streak || 0,
            isLoading: false,
          });
        } else {
          setStats({
            id: user.id,
            email: user.email || null,
            displayName: user.email?.split('@')[0] || 'Hero',
            level: 1,
            xp: 0,
            gold: 0,
            currentStreak: 0,
            longestStreak: 0,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error('PlayerProvider: unexpected error in refreshStats', err);
      }
    },
    [supabase]
  );

  // Initial load and auth state listener
  useEffect(() => {
    let isMounted = true;

    refreshStats(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        if (session?.user) {
          if (activeUserIdRef.current !== session.user.id) {
            refreshStats(true);
          }
        } else {
          activeUserIdRef.current = null;
          setStats({ ...defaultStats, isLoading: false });
        }
      }
    );

    // Global event listener for instant local sync
    const handleSyncEvent = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<PlayerStats> | undefined>;
      if (customEvent.detail) {
        updateStats(customEvent.detail);
      } else {
        refreshStats(true);
      }
    };

    window.addEventListener(RPG_SYNC_EVENT, handleSyncEvent);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener(RPG_SYNC_EVENT, handleSyncEvent);
    };
  }, [supabase, refreshStats, updateStats]);

  // Route change synchronization (ensures page navigation refreshes state if needed)
  useEffect(() => {
    if (activeUserIdRef.current) {
      refreshStats(false);
    }
  }, [pathname, refreshStats]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    activeUserIdRef.current = null;
    setStats({ ...defaultStats, isLoading: false });
  }, [supabase]);

  return (
    <PlayerContext.Provider
      value={{
        stats,
        updateStats,
        refreshStats,
        signOut,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayerStats() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerStats must be used within a PlayerProvider');
  }
  return context;
}
