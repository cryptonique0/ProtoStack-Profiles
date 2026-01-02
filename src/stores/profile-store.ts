import type { ProfileFormData, ProfileStats } from '@/types';
import type { Profile } from '@/types/database.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  // Current user's profile
  profile: Profile | null;
  stats: ProfileStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setStats: (stats: ProfileStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProfile: (updates: Partial<ProfileFormData>) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  stats: null,
  isLoading: false,
  error: null,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => set({ profile, error: null }),

      setStats: (stats) => set({ stats }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                ...Object.fromEntries(
                  Object.entries(updates).map(([key, value]) => [
                    // Convert camelCase to snake_case
                    key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
                    value,
                  ])
                ),
                updated_at: new Date().toISOString(),
              }
            : null,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'protovm-profile',
      partialize: (state) => ({
        profile: state.profile,
        stats: state.stats,
      }),
    }
  )
);
