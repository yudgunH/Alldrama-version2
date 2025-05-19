import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Favorite } from '@/types';

interface FavoritesState {
  favorites: Favorite[];
  isLoading: boolean;
  error: Error | null;
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (movieId: string | number) => void;
  clearFavorites: () => void;
  isFavorite: (movieId: string | number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,
      
      setFavorites: (favorites) => set({ favorites }),
      
      addFavorite: (favorite) => set((state) => ({
        favorites: [...state.favorites, favorite]
      })),
      
      removeFavorite: (movieId) => set((state) => ({
        favorites: state.favorites.filter(f => String(f.movieId) !== String(movieId))
      })),
      
      clearFavorites: () => set({ favorites: [] }),
      
      isFavorite: (movieId) => {
        const state = get();
        return state.favorites.some(f => String(f.movieId) === String(movieId));
      }
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        favorites: state.favorites 
      }),
    }
  )
); 