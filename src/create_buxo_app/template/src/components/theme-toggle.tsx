'use client';

import { useSyncExternalStore } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { THEME_STORAGE_KEY, type ThemeMode } from '@/lib/theme-mode';
import IconButton from './icon-button';

const THEME_EVENT = 'themechange';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  window.addEventListener(THEME_EVENT, onChange);
  media.addEventListener('change', onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    media.removeEventListener('change', onChange);
  };
}

function getSnapshot(): ThemeMode {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

// The server can't know the theme; React re-reads the real value on hydration.
const getServerSnapshot = (): ThemeMode => 'light';

export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts for this page view only.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <IconButton label={`Switch to ${next} theme`} onClick={toggle} className={className}>
      {theme === 'dark' ? <MdLightMode aria-hidden="true" /> : <MdDarkMode aria-hidden="true" />}
    </IconButton>
  );
}
