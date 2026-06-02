import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrthodoxBorder } from './OrthodoxBorder';
import { useSettings } from '../context/SettingsContext';
import { type Quote, parseSource } from '../services/api';

interface Props {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function QuoteCard({ quote, isFavorite, onToggleFavorite }: Props) {
  const { colors, fontFamily, fontSize } = useSettings();
  const [prayerExpanded, setPrayerExpanded] = useState(false);

  const parsed = parseSource(quote.source);

  const handleShare = async () => {
    await Share.share({
      message: `${quote.title}\n\n${quote.body}\n\n— ${quote.source}\n(The Imitation of Christ, Thomas à Kempis)`,
    });
  };

  const paragraphs = quote.body.split('\n').filter((p) => p.trim().length > 0);

  return (
    <OrthodoxBorder>
      {/* Source & title header */}
      <View style={styles.header}>
        {parsed.chapterNumber !== null && (
          <Text style={[styles.sourceLabel, { color: colors.accent, fontFamily }]}>
            Book {parsed.bookNumber} · Chapter {parsed.chapterNumber}
          </Text>
        )}
        <Text style={[styles.chapterTitle, { color: colors.textSecondary, fontFamily }]}>
          {parsed.chapterTitle}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* Quote title */}
      <Text style={[styles.quoteTitle, { color: colors.primary, fontFamily, fontSize: fontSize + 2 }]}>
        {quote.title}
      </Text>

      {/* Body paragraphs */}
      <View style={styles.bodyContainer}>
        {paragraphs.map((para, idx) => (
          <Text
            key={idx}
            style={[styles.bodyPara, { color: colors.text, fontFamily, fontSize }]}
          >
            {para}
          </Text>
        ))}
      </View>

      {/* Prayer toggle */}
      {quote.prayer ? (
        <>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Pressable
            onPress={() => setPrayerExpanded((v) => !v)}
            style={styles.prayerRow}
          >
            <Text style={[styles.prayerLabel, { color: colors.accent, fontFamily }]}>
              ☩ Prayer
            </Text>
            <Ionicons
              name={prayerExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.accent}
            />
          </Pressable>
          {prayerExpanded && (
            <Text
              style={[
                styles.prayerText,
                { color: colors.textSecondary, fontFamily, fontSize: fontSize - 1 },
              ]}
            >
              {quote.prayer}
            </Text>
          )}
        </>
      ) : null}

      {/* Actions */}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          accessibilityLabel="Share"
        >
          <Ionicons name="share-outline" size={20} color={colors.accent} />
          <Text style={[styles.actionLabel, { color: colors.textSecondary, fontFamily }]}>
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onToggleFavorite}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.primary : colors.accent}
          />
          <Text style={[styles.actionLabel, { color: colors.textSecondary, fontFamily }]}>
            {isFavorite ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </OrthodoxBorder>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 6,
  },
  sourceLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  quoteTitle: {
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    lineHeight: 28,
  },
  bodyContainer: {
    gap: 12,
    marginBottom: 4,
  },
  bodyPara: {
    lineHeight: 26,
    textAlign: 'left',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prayerLabel: {
    fontSize: 12,
    letterSpacing: 1,
  },
  prayerText: {
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingTop: 4,
    paddingBottom: 2,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
