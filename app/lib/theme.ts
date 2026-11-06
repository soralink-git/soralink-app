export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'soralink-theme';
export const DEFAULT_THEME: Theme = 'dark';

// Kept as a plain string: the inline theme script must never be produced by
// stringifying a bundled function. Cloudflare's Worker bundler adds esbuild
// `__name` helpers to function bodies, which are not available in the browser.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=='light'&&t!=='dark')t=${JSON.stringify(
  DEFAULT_THEME,
)};var d=document.documentElement;d.setAttribute('data-theme',t);d.style.colorScheme=t;}catch(e){}})();`;
