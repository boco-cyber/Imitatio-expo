import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchQuoteById, parseSource, type Quote } from '../../services/api';
import { useFavorites } from '../../hooks/useFavorites';
import { QuoteCard } from '../../components/QuoteCard';
import { useSettings } from '../../context/SettingsContext';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, fontFamily } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    const numId = Number(id);
    if (!numId) { setQuote(null); return; }
    fetchQuoteById(numId).then(setQuote);
  }, [id]);

  if (quote === undefined) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (quote === null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={[styles.notFoundText, { color: colors.text, fontFamily }]}>
            Reflection not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const parsed = parseSource(quote.source);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Nav bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.primary, fontFamily }]} numberOfLines={1}>
          {parsed.chapterNumber !== null
            ? `Book ${parsed.bookNumber} · Ch. ${parsed.chapterNumber}`
            : `Book ${parsed.bookNumber}`}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <QuoteCard
          quote={quote}
          isFavorite={isFavorite(quote.id)}
          onToggleFavorite={() => toggleFavorite(quote)}
        />

        <Text style={[styles.attribution, { color: colors.textSecondary }]}>
          Thomas à Kempis · c. 1418–1427
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 36 },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    letterSpacing: 1,
    marginHorizontal: 4,
  },
  scroll: { padding: 16, paddingBottom: 40 },
  attribution: { textAlign: 'center', fontSize: 12, letterSpacing: 1, marginTop: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16 },
});
