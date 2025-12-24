// src/theme/ThemeContext.js
import React, { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const ThemeContext = createContext(null);

const lightPalette = {
  background: '#F3F4F6',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  text: '#111827',
  mutedText: '#6B7280',
  subtleText: '#9CA3AF',
  divider: '#E5E7EB',

  accent: '#2563EB',
  accentSoft: 'rgba(37, 99, 235, 0.10)',

  success: '#16A34A',
  successSoft: 'rgba(22, 163, 74, 0.12)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.14)',

  chipBg: '#F1F5F9',
  chipBorder: '#E2E8F0',
  chipText: '#334155',

  bannerBg: '#FFEDD5',
  bannerText: '#9A3412',

  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabBarInactive: '#64748B',
};

const darkPalette = {
  background: '#0B1220',
  card: '#111A2E',
  cardBorder: '#23304A',
  text: '#E5E7EB',
  mutedText: '#AAB4C5',
  subtleText: '#7B879E',
  divider: '#23304A',

  accent: '#60A5FA',
  accentSoft: 'rgba(96, 165, 250, 0.20)',

  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.18)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.18)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.18)',

  chipBg: 'rgba(148, 163, 184, 0.12)',
  chipBorder: 'rgba(148, 163, 184, 0.22)',
  chipText: '#CBD5E1',

  bannerBg: 'rgba(251, 191, 36, 0.20)',
  bannerText: '#FDE68A',

  tabBarBg: '#0B1220',
  tabBarBorder: '#23304A',
  tabBarInactive: '#94A3B8',
};

function buildNavTheme(isDark, palette) {
  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: palette.accent,
      background: palette.background,
      card: palette.tabBarBg,
      text: palette.text,
      border: palette.tabBarBorder,
      notification: palette.danger,
    },
    // ✅ 修 BottomTabItem 會讀 fonts.medium 的問題
    fonts: {
      regular: { fontFamily: undefined, fontWeight: '400' },
      medium: { fontFamily: undefined, fontWeight: '500' },
      bold: { fontFamily: undefined, fontWeight: '700' },
      heavy: { fontFamily: undefined, fontWeight: '800' },
    },
  };
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';

  const palette = useMemo(() => (isDark ? darkPalette : lightPalette), [isDark]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const navTheme = useMemo(() => buildNavTheme(isDark, palette), [isDark, palette]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,

      // ✅ 統一：新/舊命名都給
      navTheme,
      navigationTheme: navTheme,

      palette,
      ...palette, // 讓頁面可直接用 theme.text / theme.card...

      // ✅ 舊版 App.js 可能用到 theme.tabBar
      tabBar: palette.tabBarBg,
    }),
    [theme, isDark, toggleTheme, navTheme, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeColors must be used within ThemeProvider');
  return ctx;
}
