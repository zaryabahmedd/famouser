import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';

const ROUTE_KEY = 'famo.lastRoute';

// In-progress delivery statuses. A delivery in one of these is "live" and the
// user should be returned to its tracking flow on cold start.
const ACTIVE_STATUSES = ['searching', 'accepted', 'picked_up'];

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

/**
 * Authoritative cold-start resume target.
 *
 * The DB — not the last screen the user happened to be on — is the source of
 * truth for where an in-progress delivery should land. If the signed-in user has
 * a live delivery we route straight to its status screen:
 *   - `searching`            -> Finding-rider (which auto-advances to tracking
 *                               the moment a rider accepts)
 *   - `accepted`/`picked_up` -> Live tracking
 * This guarantees that if a rider accepts while the app is closed, reopening the
 * app shows the tracking screen rather than a stale "Finding your rider" view.
 * Falls back to the last saved route when there is no active delivery.
 */
export async function getResumeRoute(): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const { data } = await supabase
        .from('deliveries')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1);
      const active = data?.[0];
      if (active?.id) {
        const path = active.status === 'searching' ? '/finding-rider' : '/live-tracking';
        return `${path}?deliveryId=${encodeURIComponent(active.id)}`;
      }
    }
  } catch {
    // Network/auth hiccup — fall back to the last saved route below.
  }
  return getSavedRoute();
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
