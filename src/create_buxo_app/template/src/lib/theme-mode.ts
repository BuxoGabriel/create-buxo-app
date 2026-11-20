// Light/dark preference. The default follows the system; a choice made with <ThemeToggle> is stored
// here and applied as data-theme on <html>, which theme.css and the `dark:` variant both honor.
export const THEME_STORAGE_KEY = 'theme';
export type ThemeMode = 'light' | 'dark';

// Runs in <head> before first paint so a stored choice never flashes the other theme.
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
