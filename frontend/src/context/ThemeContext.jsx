"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('cyber');

  useEffect(() => {
    const saved = localStorage.getItem('hexa_theme_mode');
    if (saved) setThemeMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('hexa_theme_mode', themeMode);
    
    // Apply class to root for CSS selectors
    const root = document.documentElement;
    // Remove any existing theme-mode classes
    const classesToRemove = Array.from(root.classList).filter(c => c.endsWith('-mode'));
    classesToRemove.forEach(c => root.classList.remove(c));
    
    if (themeMode !== 'cyber') {
      root.classList.add(`${themeMode}-mode`);
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      <div className={themeMode !== 'cyber' ? `${themeMode}-mode` : ''} style={{ height: '100%' }}>
        {children}
      </div>
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
