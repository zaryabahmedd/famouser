// Holds the in-progress delivery being assembled across the booking screens
// (pickup -> dropoff -> size/weight -> quote summary). A single provider mounted
// in the root layout lets each screen read and update the shared draft without
// threading params through every route.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { PlaceLocation } from '@/lib/geo';

export type DraftEndpoint = {
  // Set once the user picks a place from autocomplete (has real coordinates).
  address: string;
  lat: number;
  lng: number;
  detail?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
};

type DraftOrder = {
  pickup: DraftEndpoint | null;
  dropoff: DraftEndpoint | null;
  size: string;
  weight: number;
};

type DraftOrderContextValue = DraftOrder & {
  setPickup: (place: PlaceLocation, extra?: Partial<DraftEndpoint>) => void;
  setDropoff: (place: PlaceLocation, extra?: Partial<DraftEndpoint>) => void;
  updatePickup: (patch: Partial<DraftEndpoint>) => void;
  updateDropoff: (patch: Partial<DraftEndpoint>) => void;
  setPackage: (size: string, weight: number) => void;
  reset: () => void;
};

const DEFAULT: DraftOrder = {
  pickup: null,
  dropoff: null,
  size: 'm',
  weight: 5.5,
};

const DraftOrderContext = createContext<DraftOrderContextValue | null>(null);

export function DraftOrderProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<DraftOrder>(DEFAULT);

  const setPickup = useCallback((place: PlaceLocation, extra?: Partial<DraftEndpoint>) => {
    // Keep any contact/notes the user already entered; replace address + coords.
    setDraft((d) => ({ ...d, pickup: { ...d.pickup, ...place, ...extra } }));
  }, []);

  const setDropoff = useCallback((place: PlaceLocation, extra?: Partial<DraftEndpoint>) => {
    setDraft((d) => ({ ...d, dropoff: { ...d.dropoff, ...place, ...extra } }));
  }, []);

  const updatePickup = useCallback((patch: Partial<DraftEndpoint>) => {
    setDraft((d) => (d.pickup ? { ...d, pickup: { ...d.pickup, ...patch } } : d));
  }, []);

  const updateDropoff = useCallback((patch: Partial<DraftEndpoint>) => {
    setDraft((d) => (d.dropoff ? { ...d, dropoff: { ...d.dropoff, ...patch } } : d));
  }, []);

  const setPackage = useCallback((size: string, weight: number) => {
    setDraft((d) => ({ ...d, size, weight }));
  }, []);

  const reset = useCallback(() => setDraft(DEFAULT), []);

  const value = useMemo<DraftOrderContextValue>(
    () => ({ ...draft, setPickup, setDropoff, updatePickup, updateDropoff, setPackage, reset }),
    [draft, setPickup, setDropoff, updatePickup, updateDropoff, setPackage, reset],
  );

  return <DraftOrderContext.Provider value={value}>{children}</DraftOrderContext.Provider>;
}

export function useDraftOrder(): DraftOrderContextValue {
  const ctx = useContext(DraftOrderContext);
  if (!ctx) {
    throw new Error('useDraftOrder must be used within a DraftOrderProvider');
  }
  return ctx;
}
