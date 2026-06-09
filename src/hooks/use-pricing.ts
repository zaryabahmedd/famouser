// Live fare pricing from the admin-managed `pricing_settings` table (single
// row, id = 1). Cached briefly across the app so every fare calculation
// doesn't refetch — the admin panel writes to the same row, so the next read
// after the cache expires picks up the new price automatically.
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Pricing = {
  basePrice: number;
  perKmPrice: number;
};

// Used while the live settings are loading for the first time, or if the fetch fails.
const FALLBACK_PRICING: Pricing = { basePrice: 150, perKmPrice: 180 };

const CACHE_TTL_MS = 2 * 60 * 1000;
let cache: { pricing: Pricing; fetchedAt: number } | null = null;
let inflight: Promise<Pricing> | null = null;

async function loadPricing(): Promise<Pricing> {
  try {
    const { data } = await supabase
      .from('pricing_settings')
      .select('base_price, per_km_price')
      .eq('id', 1)
      .single();

    const pricing: Pricing =
      data && data.base_price != null && data.per_km_price != null
        ? { basePrice: Number(data.base_price), perKmPrice: Number(data.per_km_price) }
        : FALLBACK_PRICING;
    cache = { pricing, fetchedAt: Date.now() };
    return pricing;
  } catch {
    return cache?.pricing ?? FALLBACK_PRICING;
  } finally {
    inflight = null;
  }
}

function fetchPricing(): Promise<Pricing> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return Promise.resolve(cache.pricing);
  if (!inflight) inflight = loadPricing();
  return inflight;
}

export function usePricing(): Pricing {
  const [pricing, setPricing] = useState<Pricing>(cache?.pricing ?? FALLBACK_PRICING);

  useEffect(() => {
    let cancelled = false;
    fetchPricing().then((p) => {
      if (!cancelled) setPricing(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return pricing;
}
