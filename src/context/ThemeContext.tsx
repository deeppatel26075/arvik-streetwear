'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  accent: string;
  onAccent: string; // Text color to use on top of the accent color, so it stays readable even when accent is very light (e.g. Psychology's near-white)
  background: string;
  secondaryBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export type ThemePreset = 'minimal' | 'anime' | 'samurai' | 'vintage' | 'chaos' | 'psychology' | 'onfire';

interface ThemeContextType {
  preset: ThemePreset;
  colors: ThemeColors;
  setThemePreset: (preset: ThemePreset) => void;
}

const defaultColors: ThemeColors = {
  accent: '#111111',
  onAccent: '#FFFFFF',
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
  psychology: {
    accent: '#f5f5f5', // Glowing white wire against the void
    onAccent: '#000000', // Accent is near-white here, so text on it needs to be dark
    background: '#000000', // Pure black
    secondaryBg: '#0a0a0a',
    textPrimary: '#f2f2f2',
    textSecondary: '#8a8a8a',
    border: '#262626',
  },
  onfire: {
    accent: '#1a0303', // Black-crimson
    onAccent: '#f5ecdd',
    background: '#8b0000', // Blood red
    secondaryBg: '#6b0202',
    textPrimary: '#f5ecdd', // Cream, echoing the sclera tone
    textSecondary: '#e8c9b0',
    border: '#2b0505', // Black-crimson border
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
    root.style.setProperty('--color-on-accent', colors.onAccent);
    root.style.setProperty('--color-bg', colors.background);
    root.style.setProperty('--color-bg-secondary', colors.secondaryBg);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);
    // Also drive the site-wide body background/text vars from globals.css
    // so a preset change repaints the whole page, not just components that
    // explicitly opt into the --color-* variables.
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.textPrimary);
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
