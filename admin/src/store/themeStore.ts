import { useState, useEffect } from 'react';
import { LS } from '../utils/storage';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return LS.g<'dark' | 'light'>('theme', 'dark');
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    LS.s('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}

