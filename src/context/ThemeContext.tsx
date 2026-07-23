'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  accent: string;
  background: string;
  secondaryBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export type ThemePreset = 'minimal' | 'anime' | 'samurai' | 'vintage' | 'chaos';

interface ThemeContextType {
  preset: ThemePreset;
  colors: ThemeColors;
  setThemePreset: (preset: ThemePreset) => void;
}

const defaultColors: ThemeColors = {
  accent: '#111111',
  background: '#FFFFFF',
  secondaryBg: '#F7F7F7',
  textPrimary: '#111111',
  textSecondary: '#666666',
  border: '#ECECEC',
};

const themePresets: Record<ThemePreset, ThemeColors> = {
  minimal: {
    ...defaultColors,
    accent: '#78716c', // Creamy grey/beige accent
  },
  anime: {
    ...defaultColors,
    accent: '#a855f7', // Purple
  },
  samurai: {
    ...defaultColors,
    accent: '#dc2626', // Red
  },
  vintage: {
    ...defaultColors,
    accent: '#7c2d12', // Brown
  },
  chaos: {
    ...defaultColors,
    accent: '#000000', // Dark black
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preset, setPreset] = useState<ThemePreset>('chaos'); // Defaults to black accent
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    setColors(themePresets[preset] || defaultColors);
  }, [preset]);

  // Inject colors into Document element as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-bg', colors.background);
    root.style.setProperty('--color-bg-secondary', colors.secondaryBg);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ preset, colors, setThemePreset: setPreset }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
