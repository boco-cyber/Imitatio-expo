import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';
import {
  ThemeName,
  FontName,
  TextSizeName,
  FONT_LABEL_MAP,
  TEXT_SIZE_MAP,
} from '../../context/SettingsContext';
import { useEffect, useState } from 'react';
import { fetchQuoteByDay, getDayOfYear, type Quote } from '../../services/api';

const THEMES: { name: ThemeName; label: string; icon: string }[] = [
  { name: 'light', label: 'Light', icon: '☀' },
  { name: 'dark', label: 'Dark', icon: '🌙' },
  { name: 'sepia', label: 'Sepia', icon: '📜' },
];

const FONTS: FontName[] = ['cinzel', 'lora', 'libreBaskerville', 'system'];
const SIZES: TextSizeName[] = ['small', 'medium', 'large', 'xlarge'];
const SIZE_LABELS: Record<TextSizeName, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
  xlarge: 'XL',
};

export default function SettingsScreen() {
  const { colors, settings, updateSettings, fontFamily, fontSize } = useSettings();
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuoteByDay(getDayOfYear()).then(setDailyQuote);
  }, []);

  const [localHour, setLocalHour] = useState(settings.notificationHour);
  const [localMinute, setLocalMinute] = useState(settings.notificationMinute);

  const applyTime = () => {
    updateSettings({ notificationHour: localHour, notificationMinute: localMinute });
  };

  const adjustHour = (delta: number) => {
    const next = (localHour + delta + 24) % 24;
    setLocalHour(next);
  };

  const adjustMinute = (delta: number) => {
    const next = (localMinute + delta + 60) % 60;
    setLocalMinute(next);
  };

  const rawPreview = dailyQuote ? (dailyQuote.body.split('\n')[0] ?? '') : 'Loading…';
  const previewText = rawPreview.length > 80 ? rawPreview.slice(0, 77) + '…' : rawPreview;

  const Section = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.accent, fontFamily }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Page header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.primary, fontFamily }]}>Settings</Text>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        </View>

        {/* ── Theme ── */}
        <Section title="Theme" />
        <View style={styles.row}>
          {THEMES.map((t) => {
            const active = settings.theme === t.name;
            return (
              <TouchableOpacity
                key={t.name}
                style={[
                  styles.themeChip,
                  {
                    borderColor: active ? colors.primary : colors.inputBorder,
                    backgroundColor: active ? colors.primary : colors.card,
                  },
                ]}
                onPress={() => updateSettings({ theme: t.name })}
              >
                <Text style={styles.themeIcon}>{t.icon}</Text>
                <Text style={[styles.chipLabel, { color: active ? '#fff' : colors.text }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Font ── */}
        <Section title="Typeface" />
        {FONTS.map((f) => {
          const active = settings.font === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.fontRow,
                {
                  borderColor: active ? colors.primary : colors.inputBorder,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => updateSettings({ font: f })}
            >
              <Text
                style={[
                  styles.fontSample,
                  {
                    fontFamily: f !== 'system' ? `${f === 'cinzel' ? 'Cinzel' : f === 'lora' ? 'Lora' : 'LibreBaskerville'}_400Regular` : undefined,
                    color: colors.text,
                  },
                ]}
              >
                {FONT_LABEL_MAP[f]}
              </Text>
              {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}

        {/* ── Text Size ── */}
        <Section title="Text Size" />
        <View style={styles.row}>
          {SIZES.map((s) => {
            const active = settings.textSize === s;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sizeChip,
                  {
                    borderColor: active ? colors.primary : colors.inputBorder,
                    backgroundColor: active ? colors.primary : colors.card,
                  },
                ]}
                onPress={() => updateSettings({ textSize: s })}
              >
                <Text style={[styles.sizeLabel, { color: active ? '#fff' : colors.text }]}>
                  {SIZE_LABELS[s]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live preview */}
        <View style={[styles.previewBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.previewLabel, { color: colors.accent }]}>Preview</Text>
          <Text
            style={[
              styles.previewText,
              { color: colors.text, fontFamily, fontSize: TEXT_SIZE_MAP[settings.textSize] },
            ]}
          >
            {previewText}
          </Text>
        </View>

        {/* ── Notifications ── */}
        <Section title="Daily Reminder" />
        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
          <View style={styles.toggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.icon} />
            <Text style={[styles.toggleLabel, { color: colors.text, fontFamily }]}>
              Daily Notification
            </Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
            trackColor={{ false: colors.toggleInactive, true: colors.toggleActive }}
            thumbColor="#fff"
          />
        </View>

        {settings.notificationsEnabled && (
          <>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Reminder time</Text>
            <View style={[styles.timePicker, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
              {/* Hour */}
              <View style={styles.timeUnit}>
                <TouchableOpacity onPress={() => adjustHour(1)} style={styles.timeBtn}>
                  <Ionicons name="chevron-up" size={18} color={colors.accent} />
                </TouchableOpacity>
                <Text style={[styles.timeDigit, { color: colors.text, fontFamily }]}>
                  {localHour.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.timeBtn}>
                  <Ionicons name="chevron-down" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.timeSep, { color: colors.accent }]}>:</Text>

              {/* Minute */}
              <View style={styles.timeUnit}>
                <TouchableOpacity onPress={() => adjustMinute(5)} style={styles.timeBtn}>
                  <Ionicons name="chevron-up" size={18} color={colors.accent} />
                </TouchableOpacity>
                <Text style={[styles.timeDigit, { color: colors.text, fontFamily }]}>
                  {localMinute.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => adjustMinute(-5)} style={styles.timeBtn}>
                  <Ionicons name="chevron-down" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={applyTime}
              >
                <Text style={styles.applyBtnText}>Set</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.notifPreview, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
              <Text style={[styles.notifPreviewLabel, { color: colors.accent }]}>
                Next notification preview
              </Text>
              <Text style={[styles.notifTitle, { color: colors.primary }]}>Daily Reflection ✦</Text>
              <Text style={[styles.notifBody, { color: colors.text }]}>{previewText}</Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 8,
  },
  divider: {
    width: 40,
    height: 1,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    gap: 4,
  },
  themeIcon: { fontSize: 18 },
  chipLabel: { fontSize: 12, letterSpacing: 0.5 },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 3,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  fontSample: { fontSize: 16 },
  sizeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  sizeLabel: { fontSize: 14, fontWeight: '600' },
  previewBox: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  previewText: { lineHeight: 26, fontStyle: 'italic' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: { fontSize: 15 },
  timeLabel: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    gap: 12,
  },
  timeUnit: { alignItems: 'center', gap: 4 },
  timeBtn: { padding: 4 },
  timeDigit: { fontSize: 28, letterSpacing: 2, minWidth: 44, textAlign: 'center' },
  timeSep: { fontSize: 28, marginBottom: 4 },
  applyBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  applyBtnText: { color: '#fff', fontSize: 13, letterSpacing: 1 },
  notifPreview: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  notifPreviewLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  notifTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  notifBody: { fontSize: 13, lineHeight: 20 },
});
