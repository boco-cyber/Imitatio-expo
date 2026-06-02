import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function OrthodoxBorder({ children, style }: Props) {
  const { colors } = useSettings();

  return (
    <View style={[styles.wrapper, { borderColor: colors.cardBorder, backgroundColor: colors.card }, style]}>
      {/* Top ornament row */}
      <View style={styles.topRow}>
        <Text style={[styles.corner, { color: colors.accent }]}>✦</Text>
        <View style={[styles.line, { backgroundColor: colors.accent }]} />
        <Text style={[styles.cross, { color: colors.accent }]}>☩</Text>
        <View style={[styles.line, { backgroundColor: colors.accent }]} />
        <Text style={[styles.corner, { color: colors.accent }]}>✦</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Bottom ornament row */}
      <View style={styles.bottomRow}>
        <Text style={[styles.corner, { color: colors.accent }]}>✦</Text>
        <View style={[styles.line, { backgroundColor: colors.accent }]} />
        <Text style={[styles.fleur, { color: colors.accent }]}>❧</Text>
        <View style={[styles.line, { backgroundColor: colors.accent }]} />
        <Text style={[styles.corner, { color: colors.accent }]}>✦</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  line: {
    flex: 1,
    height: 1,
  },
  corner: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  cross: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  fleur: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
