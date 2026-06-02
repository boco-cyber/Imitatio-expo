import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../hooks/useFavorites';
import { fetchQuoteById, type Quote } from '../../services/api';
import { QuoteListItem } from '../../components/QuoteListItem';
import { useSettings } from '../../context/SettingsContext';

function SwipeableItem({
  quote,
  isFavorite,
  onToggleFavorite,
  onRemove,
}: {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRemove: () => void;
}) {
  const { colors } = useSettings();
  const swipeRef = useRef<SwipeableMethods>(null);

  const renderRightActions = (
    _p: SharedValue<number>,
    _t: SharedValue<number>,
    swipeable: SwipeableMethods,
  ) => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: colors.deleteButton }]}
      onPress={() => {
        swipeable.close();
        onRemove();
      }}
    >
      <Ionicons name="trash-outline" size={22} color="#fff" />
      <Text style={styles.deleteLabel}>Remove</Text>
    </TouchableOpacity>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={60}
    >
      <QuoteListItem
        quote={quote}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    </ReanimatedSwipeable>
  );
}

export default function FavoritesScreen() {
  const { colors, fontFamily } = useSettings();
  const { favoriteIds, isFavorite, toggleFavorite, removeFavorite, isLoaded } =
    useFavorites();

  const [resolvedQuotes, setResolvedQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch quote objects for each saved ID
  useEffect(() => {
    if (!isLoaded || favoriteIds.length === 0) {
      setResolvedQuotes([]);
      return;
    }
    setLoading(true);
    Promise.all(favoriteIds.map((id) => fetchQuoteById(id)))
      .then((results) =>
        setResolvedQuotes(results.filter((q): q is Quote => q !== null)),
      )
      .finally(() => setLoading(false));
  }, [isLoaded, favoriteIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.primary, fontFamily }]}>Favorites</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (resolvedQuotes.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.primary, fontFamily }]}>Favorites</Text>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={48} color={colors.accent} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily }]}>No Favorites Yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Tap the heart on any reflection to save it here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.primary, fontFamily }]}>Favorites</Text>
          <Text style={[styles.subtitle, { color: colors.accent }]}>
            {resolvedQuotes.length} saved · swipe left to remove
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        </View>

        <FlatList
          data={resolvedQuotes}
          keyExtractor={(q) => `fav-${q.id}`}
          renderItem={({ item }) => (
            <SwipeableItem
              quote={item}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item)}
              onRemove={() => removeFavorite(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 28, letterSpacing: 4, marginBottom: 4 },
  subtitle: { fontSize: 12, letterSpacing: 1, marginBottom: 12 },
  divider: { width: 40, height: 1 },
  list: { paddingBottom: 32 },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 5,
    marginRight: 16,
    borderRadius: 8,
    gap: 4,
  },
  deleteLabel: { color: '#fff', fontSize: 11 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 20, letterSpacing: 2, marginTop: 8 },
  emptyBody: { textAlign: 'center', fontSize: 14, lineHeight: 22, paddingHorizontal: 40 },
});
