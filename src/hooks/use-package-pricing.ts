// Live per-package-size pricing from the super-admin-managed `package_pricing`
// table. The admin app owns the table + UI; the user app only reads it (with the
// anon key, via a public SELECT RLS policy) and computes the order price.
//
// Each row is one of the four package sizes (5, 10, 15, 20) with its own
// base_price and per_km_price (Naira). The price formula — shared verbatim with
// the admin and rider apps — is:
//
//     price = round(base_price + per_km_price * distance_km)
//
// Prices are never hardcoded: we read the table at order time so the
// super-admin's live changes take effect immediately. Cached briefly so every
// fare calculation doesn't refetch.
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

// The four package sizes, in kg. These are the exact values written to
// `deliveries.package_size` and used as the primary key of `package_pricing`.
export const PACKAGE_SIZE_OPTIONS = [
  { size: 5, label: 'S', limit: '5 kg' },
  { size: 10, label: 'M', limit: '10 kg' },
  { size: 15, label: 'L', limit: '15 kg' },
  { size: 20, label: 'XL', limit: '20 kg' },
] as const;

export type SizePrice = { basePrice: number; perKmPrice: number };
// Keyed by the numeric size (5 | 10 | 15 | 20). A size missing from the map
// means the super-admin hasn't priced it yet.
export type PackagePricing = Record<number, SizePrice>;

type State = {
  // null until the first load resolves; {} when the table is reachable but empty.
  pricing: PackagePricing | null;
  loading: boolean;
  // true when the fetch failed (network/permission) and we have no cached data.
  error: boolean;
};

const CACHE_TTL_MS = 2 * 60 * 1000;
let cache: { pricing: PackagePricing; fetchedAt: number } | null = null;
let inflight: Promise<PackagePricing> | null = null;

async function loadPricing(): Promise<PackagePricing> {
  try {
    const { data, error } = await supabase
      .from('package_pricing')
      .select('size, base_price, per_km_price');
    if (error) throw error;

    const pricing: PackagePricing = {};
    for (const row of data ?? []) {
      if (row.size == null || row.base_price == null || row.per_km_price == null) continue;
      pricing[Number(row.size)] = {
        basePrice: Number(row.base_price),
        perKmPrice: Number(row.per_km_price),
      };
    }
    cache = { pricing, fetchedAt: Date.now() };
    return pricing;
  } finally {
    inflight = null;
  }
}

function fetchPricing(): Promise<PackagePricing> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return Promise.resolve(cache.pricing);
  if (!inflight) inflight = loadPricing();
  return inflight;
}

export function usePackagePricing(): State {
  const [state, setState] = useState<State>(() =>
    cache
      ? { pricing: cache.pricing, loading: false, error: false }
      : { pricing: null, loading: true, error: false },
  );

  useEffect(() => {
    let cancelled = false;
    fetchPricing()
      .then((pricing) => {
        if (!cancelled) setState({ pricing, loading: false, error: false });
      })
      .catch(() => {
        // Keep any stale cache so an established price survives a blip; only the
        // very first load with no cache surfaces as a hard error (blocks checkout).
        if (!cancelled) setState({ pricing: cache?.pricing ?? null, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * Compute a whole-Naira order price for a package size at a given route
 * distance. Must match the admin + rider formula exactly:
 *   price = round(base_price + per_km_price * distance_km)
 * A flat fare is just per_km_price = 0 — no special-casing needed.
 */
export function computePackagePrice(distanceMeters: number, sizePrice: SizePrice): number {
  const km = distanceMeters / 1000;
  return Math.round(sizePrice.basePrice + sizePrice.perKmPrice * km);
}
