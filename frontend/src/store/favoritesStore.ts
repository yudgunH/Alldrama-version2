import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Favorite } from '@/types';

interface FavoritesState {
  favorites: Favorite[];
  isLoading: boolean;
  error: Error | null;
  lastFetched: number | null; // Timestamp of last fetch
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (movieId: string | number) => void;
  clearFavorites: () => void;
  isFavorite: (movieId: string | number) => boolean;
  setLoading: (loading: boolean) => void;
  shouldRefetch: () => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      
      setFavorites: (favorites) => set({ 
        favorites, 
        lastFetched: Date.now(),
        isLoading: false 
      }),
      
      addFavorite: (favorite) => set((state) => ({
        favorites: [...state.favorites, favorite]
      })),
      
      removeFavorite: (movieId) => set((state) => ({
        favorites: state.favorites.filter(f => String(f.movieId) !== String(movieId))
      })),
      
      clearFavorites: () => set({ 
        favorites: [], 
        lastFetched: null,
        isLoading: false 
      }),
      
      isFavorite: (movieId) => {
        const state = get();
        return state.favorites.some(f => String(f.movieId) === String(movieId));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      // Check if we should refetch (cache for 5 minutes)
      shouldRefetch: () => {
        const state = get();
        if (!state.lastFetched) return true;
        const fiveMinutes = 5 * 60 * 1000;
        return Date.now() - state.lastFetched > fiveMinutes;
      }
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        favorites: state.favorites,
        lastFetched: state.lastFetched
      }),
    }
  )
); 