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
  // What the user is sending (from the "What are you sending?" screen).
  category: string;
  categoryDescription: string;
  size: string;
  weight: number;
  specialInstructions: string;
  // ISO timestamp the customer booked on the Pickup Time screen when choosing
  // "Schedule for Later". null means "Deliver Now" (immediate dispatch).
  scheduledAt: string | null;
};

type DraftOrderContextValue = DraftOrder & {
  setPickup: (place: PlaceLocation, extra?: Partial<DraftEndpoint>) => void;
  setDropoff: (place: PlaceLocation, extra?: Partial<DraftEndpoint>) => void;
  updatePickup: (patch: Partial<DraftEndpoint>) => void;
  updateDropoff: (patch: Partial<DraftEndpoint>) => void;
  setCategory: (category: string, description?: string) => void;
  setPackage: (size: string, weight: number, specialInstructions?: string) => void;
  setScheduledAt: (iso: string | null) => void;
  reset: () => void;
};

const DEFAULT: DraftOrder = {
  pickup: null,
  dropoff: null,
  category: '',
  categoryDescription: '',
  // One of the four package sizes (5/10/15/20 kg) — see PACKAGE_SIZE_OPTIONS.
  size: '10',
  weight: 5.5,
  specialInstructions: '',
  scheduledAt: null,
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

  const setCategory = useCallback((category: string, description = '') => {
    setDraft((d) => ({ ...d, category, categoryDescription: description }));
  }, []);

  const setPackage = useCallback(
    (size: string, weight: number, specialInstructions = '') => {
      setDraft((d) => ({ ...d, size, weight, specialInstructions }));
    },
    [],
  );

  const setScheduledAt = useCallback((iso: string | null) => {
    setDraft((d) => ({ ...d, scheduledAt: iso }));
  }, []);

  const reset = useCallback(() => setDraft(DEFAULT), []);

  const value = useMemo<DraftOrderContextValue>(
    () => ({
      ...draft,
      setPickup,
      setDropoff,
      updatePickup,
      updateDropoff,
      setCategory,
      setPackage,
      setScheduledAt,
      reset,
    }),
    [
      draft,
      setPickup,
      setDropoff,
      updatePickup,
      updateDropoff,
      setCategory,
      setPackage,
      setScheduledAt,
      reset,
    ],
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
