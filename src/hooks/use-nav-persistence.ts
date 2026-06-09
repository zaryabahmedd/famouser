import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

const ROUTE_KEY = 'famo.lastRoute';

// Never restore these on cold start — auth flows, one-time modals, destructive screens
const SKIP = new Set([
  '/login',
  '/sign-up',
  '/otp-verification',
  '/forgot-password',
  '/reset-password',
  '/cancel-delivery',
  '/delete-account',
  '/add-card',
]);

/** Call inside any rendered component that sits inside the router context. */
export function useSaveRoute() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<Record<string, string | string[]>>();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't save auth/modal screens — restoring them on cold start would be confusing.
    if (SKIP.has(pathname)) return;

    const qs = Object.entries(params)
      .flatMap(([k, v]) => {
        const values = Array.isArray(v) ? v : [v];
        return values
          .filter((s) => typeof s === 'string' && s.length > 0)
          .map((s) => `${encodeURIComponent(k)}=${encodeURIComponent(s)}`);
      })
      .join('&');
    const route = qs ? `${pathname}?${qs}` : pathname;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(ROUTE_KEY, route).catch(() => {});
    }, 400);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname, params]);
}

export async function getSavedRoute(): Promise<string | null> {
  try {
    const route = await AsyncStorage.getItem(ROUTE_KEY);
    // Treat home as "no saved route" — nothing to restore.
    return route && route !== '/' ? route : null;
  } catch {
    return null;
  }
}

export async function clearSavedRoute(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ROUTE_KEY);
  } catch {
    // ignore
  }
}
