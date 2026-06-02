import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { THEMES, ThemeColors, ThemeName } from '../constants/colors';
import { getDayOfYear, getCachedAllQuotes } from '../services/api';

export type { ThemeName };

const STORAGE_KEY = 'imitatio_settings';

export type FontName = 'cinzel' | 'lora' | 'libreBaskerville' | 'system';
export type TextSizeName = 'small' | 'medium' | 'large' | 'xlarge';

export interface Settings {
  theme: ThemeName;
  font: FontName;
  textSize: TextSizeName;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  font: 'cinzel',
  textSize: 'medium',
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
};

export const FONT_FAMILY_MAP: Record<FontName, string | undefined> = {
  cinzel: 'Cinzel_400Regular',
  lora: 'Lora_400Regular',
  libreBaskerville: 'LibreBaskerville_400Regular',
  system: undefined,
};

export const FONT_LABEL_MAP: Record<FontName, string> = {
  cinzel: 'Cinzel',
  lora: 'Lora',
  libreBaskerville: 'Libre Baskerville',
  system: 'System Default',
};

export const TEXT_SIZE_MAP: Record<TextSizeName, number> = {
  small: 14,
  medium: 16,
  large: 19,
  xlarge: 22,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  colors: ThemeColors;
  fontFamily: string | undefined;
  fontSize: number;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

async function scheduleDailyNotification(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-quote', {
      name: 'Daily Quote',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Use cached today's quote if available, otherwise a generic prompt
  const day = getDayOfYear();
  const allQuotes = getCachedAllQuotes();
  const todayQuote = allQuotes?.find((q) => q.day === day);
  const body = todayQuote
    ? todayQuote.title
    : "Open the app to read today's reflection from The Imitation of Christ.";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Reflection ✦',
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'daily-quote',
    },
  });
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          // ignore
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      const next = { ...settings, ...updates };
      setSettings(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      const notifChanged =
        'notificationsEnabled' in updates ||
        'notificationHour' in updates ||
        'notificationMinute' in updates;

      if (notifChanged) {
        if (next.notificationsEnabled) {
          const { status } = await Notifications.getPermissionsAsync();
          const granted =
            status === 'granted' ||
            (await Notifications.requestPermissionsAsync()).status === 'granted';
          if (granted) {
            await scheduleDailyNotification(
              next.notificationHour,
              next.notificationMinute,
            );
          }
        } else {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      }
    },
    [settings],
  );

  const colors = THEMES[settings.theme];
  const fontFamily = FONT_FAMILY_MAP[settings.font];
  const fontSize = TEXT_SIZE_MAP[settings.textSize];

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, colors, fontFamily, fontSize, isLoaded }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
