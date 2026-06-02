import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Quote } from '../services/api';

const FAVORITES_KEY = 'imitatio_favorites';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((raw) => {
      if (raw) {
        try { setFavoriteIds(JSON.parse(raw)); } catch { /* ignore */ }
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = (ids: number[]) =>
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));

  const isFavorite = useCallback(
    (id: number) => favoriteIds.includes(id),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (quote: Quote) => {
      const next = favoriteIds.includes(quote.id)
        ? favoriteIds.filter((i) => i !== quote.id)
        : [...favoriteIds, quote.id];
      setFavoriteIds(next);
      await persist(next);
    },
    [favoriteIds],
  );

  const removeFavorite = useCallback(
    async (id: number) => {
      const next = favoriteIds.filter((i) => i !== id);
      setFavoriteIds(next);
      await persist(next);
    },
    [favoriteIds],
  );

  return { favoriteIds, isFavorite, toggleFavorite, removeFavorite, isLoaded };
}
