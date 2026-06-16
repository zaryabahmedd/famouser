// Safe replacement for `router.back()`. When the screen was opened directly
// (deep link, refresh, or as the first route) there's no history to pop, and
// calling `router.back()` throws the "GO_BACK was not handled" navigation error.
// This guards with `canGoBack()` and falls back to a real route instead.
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

export function useGoBack(fallback: Href = '/') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
