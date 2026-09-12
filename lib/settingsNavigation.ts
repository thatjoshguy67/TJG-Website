import { sessionPreferences } from './browserStorage';

const RETURN_PATH_KEY = 'settings-return-path';

function returnPath(value: string | null): string | null {
  if (!value || typeof window === 'undefined') return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin ||
      /^\/(settings|playground)(\/|$)/.test(url.pathname)) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/** Keep the page outside Settings while visiting About or developer tools. */
export function rememberSettingsReturnPath(value: string) {
  const path = returnPath(value);
  if (path) sessionPreferences.setItem(RETURN_PATH_KEY, path);
}

export function getSettingsReturnPath(from: string | null) {
  return returnPath(from) ?? returnPath(sessionPreferences.getItem(RETURN_PATH_KEY)) ?? '/';
}
