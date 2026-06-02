import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { type Quote } from '../services/api';

interface Props {
  quote: Quote;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** When true, navigate to quote detail on tap; otherwise use onPress */
  navigateOnPress?: boolean;
  onPress?: () => void;
}

export function QuoteListItem({
  quote,
  isFavorite,
  onToggleFavorite,
  navigateOnPress = true,
  onPress,
}: Props) {
  const { colors, fontFamily, fontSize } = useSettings();

  const firstLine = quote.body.split('\n')[0] ?? '';
  const preview =
    firstLine.length > 100 ? firstLine.slice(0, 97) + '…' : firstLine;

  const handlePress = () => {
    if (onPress) { onPress(); return; }
    if (navigateOnPress) router.push(`/quote/${quote.id}`);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.body}>
        <Text
          style={[styles.title, { color: colors.primary, fontFamily, fontSize }]}
          numberOfLines={1}
        >
          {quote.title}
        </Text>
        <Text
          style={[styles.preview, { color: colors.text, fontFamily, fontSize: fontSize - 1 }]}
          numberOfLines={2}
        >
          {preview}
        </Text>
        <Text style={[styles.source, { color: colors.accent }]} numberOfLines={1}>
          {quote.source}
        </Text>
      </View>

      {onToggleFavorite && (
        <TouchableOpacity
          onPress={onToggleFavorite}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.primary : colors.accent}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  body: {
    flex: 1,
    marginRight: 8,
    gap: 3,
  },
  title: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  preview: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  source: {
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
