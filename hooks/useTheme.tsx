import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    card: string;
  };
};

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_DARK_MODE = true;

// Define theme colors outside component to prevent recreation on each render
const DARK_COLORS = {
  background: '#2c2c3e',
  surface: '#3e3e50',
  text: '#ffffff',
  textSecondary: '#666',
  border: '#ffffff',
  primary: '#4a90e2',
  card: '#e0e0e0',
};

const LIGHT_COLORS = {
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  textSecondary: '#666',
  border: '#e0e0e0',
  primary: '#007AFF',
  card: '#e0e0e0',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(DEFAULT_DARK_MODE);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load theme preference only once at startup
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(savedTheme => {
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
        setIsThemeLoaded(true);
      })
      .catch(error => {
        console.error('Error loading theme:', error);
        setIsThemeLoaded(true);
      });
  }, []);

  // Memoize the toggle function to prevent recreating on each render
  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [isDarkMode]);

  // Memoize colors to prevent recreating the object on each render
  const colors = useMemo(() => 
    isDarkMode ? DARK_COLORS : LIGHT_COLORS,
    [isDarkMode]
  );

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    isDarkMode,
    toggleTheme,
    colors
  }), [isDarkMode, toggleTheme, colors]);

  // Only render children once the theme is loaded
  if (!isThemeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 