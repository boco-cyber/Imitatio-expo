import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchQuoteByDay,
  getDayOfYear,
  type Quote,
} from '../../services/api';
import { useFavorites } from '../../hooks/useFavorites';
import { QuoteCard } from '../../components/QuoteCard';
import { useSettings } from '../../context/SettingsContext';

const { width: W, height: H } = Dimensions.get('window');
const ALL_DAYS = Array.from({ length: 365 }, (_, i) => i + 1);
const TODAY = getDayOfYear();
// Clamp today to valid range 1–365
const TODAY_IDX = Math.max(0, Math.min(TODAY - 1, 364));

// ─── Per-page component ────────────────────────────────────────────────────────

const quoteCache = new Map<number, Quote | null | 'loading'>();

function DayPage({
  day,
  isVisible,
  isFavorite,
  onToggleFavorite,
  colors,
  fontFamily,
}: {
  day: number;
  isVisible: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  colors: ReturnType<typeof useSettings>['colors'];
  fontFamily: string | undefined;
}) {
  const [quote, setQuote] = useState<Quote | null | undefined>(() => {
    const cached = quoteCache.get(day);
    if (cached === 'loading' || cached === undefined) return undefined;
    return cached;
  });

  useEffect(() => {
    if (!isVisible) return;
    if (quoteCache.has(day) && quoteCache.get(day) !== 'loading') {
      const v = quoteCache.get(day);
      setQuote(v === 'loading' ? undefined : v ?? null);
      return;
    }
    quoteCache.set(day, 'loading');
    fetchQuoteByDay(day).then((q) => {
      quoteCache.set(day, q);
      setQuote(q);
    });
  }, [day, isVisible]);

  if (quote === undefined) {
    return (
      <View style={[pageStyles.loadingBox, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (quote === null) {
    return (
      <View style={[pageStyles.loadingBox, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.textSecondary} />
        <Text style={[pageStyles.noQuoteText, { color: colors.textSecondary, fontFamily }]}>
          No reflection for this day
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[pageStyles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={pageStyles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <QuoteCard
        quote={quote}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    </ScrollView>
  );
}

const pageStyles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noQuoteText: { fontSize: 14, letterSpacing: 0.5 },
});

// ─── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, fontFamily } = useSettings();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const flatListRef = useRef<FlatList<number>>(null);
  const [currentDay, setCurrentDay] = useState(TODAY);
  const [visibleDays, setVisibleDays] = useState<Set<number>>(
    new Set([TODAY - 1, TODAY, TODAY + 1].filter((d) => d >= 1 && d <= 365)),
  );

  // Scroll to today on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: TODAY_IDX, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;
      const day = viewableItems[0].item as number;
      setCurrentDay(day);
      // Expand visible window + prefetch neighbours
      setVisibleDays((prev) => {
        const next = new Set(prev);
        for (let d = day - 2; d <= day + 3; d++) {
          if (d >= 1 && d <= 365) next.add(d);
        }
        return next;
      });
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  const goTo = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item: day }: { item: number }) => {
      const quoteId = (quoteCache.get(day) as Quote | null)?.id ?? -day;
      return (
        <View style={{ width: W, height: H - 160 }}>
          <DayPage
            day={day}
            isVisible={visibleDays.has(day)}
            isFavorite={isFavorite(quoteId)}
            onToggleFavorite={() => {
              const q = quoteCache.get(day);
              if (q && q !== 'loading') toggleFavorite(q as Quote);
            }}
            colors={colors}
            fontFamily={fontFamily}
          />
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleDays, favoriteIds, colors, fontFamily],
  );

  const isToday = currentDay === TODAY;
  const dateStr = (() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), 0, currentDay);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.headerBg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View>
          <Text style={[styles.appName, { color: colors.headerText, fontFamily }]}>
            Imitatio
          </Text>
          <Text style={[styles.subtitle, { color: colors.accent }]}>
            The Imitation of Christ
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!isToday && (
            <TouchableOpacity
              onPress={() => goTo(TODAY_IDX)}
              style={[styles.todayBtn, { borderColor: colors.accent }]}
            >
              <Text style={[styles.todayBtnText, { color: colors.accent, fontFamily }]}>
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Day strip ── */}
      <View style={[styles.dayStrip, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity
          onPress={() => currentDay > 1 && goTo(currentDay - 2)}
          disabled={currentDay <= 1}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentDay > 1 ? colors.accent : 'transparent'}
          />
        </TouchableOpacity>

        <View style={styles.dayInfo}>
          {isToday && (
            <Text style={[styles.todayLabel, { color: colors.accent, fontFamily }]}>
              Today's Reflection
            </Text>
          )}
          <Text style={[styles.dateText, { color: colors.headerText, fontFamily }]}>
            {dateStr}
          </Text>
          <Text style={[styles.dayCount, { color: colors.accent }]}>
            Day {currentDay} of 365
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => currentDay < 365 && goTo(currentDay)}
          disabled={currentDay >= 365}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={currentDay < 365 ? colors.accent : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Paged quote list ── */}
      <FlatList
        ref={flatListRef}
        data={ALL_DAYS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(day) => `day-${day}`}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
        initialScrollIndex={TODAY_IDX}
        windowSize={5}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={renderItem}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: false });
          }, 200);
        }}
        style={{ flex: 1, backgroundColor: colors.background }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 26,
    letterSpacing: 5,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  todayBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  todayBtnText: { fontSize: 12, letterSpacing: 0.5 },
  dayStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dayInfo: { alignItems: 'center' },
  todayLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 2 },
  dateText: { fontSize: 16, letterSpacing: 1 },
  dayCount: { fontSize: 10, letterSpacing: 0.5, marginTop: 2 },
});
