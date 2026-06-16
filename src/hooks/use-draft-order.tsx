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

export type PaymentMethod = 'cod' | 'bank';

// A bank-transfer receipt picked on the Payment method screen, kept here (not
// local component state) so it survives the navigation back to Quote Summary,
// where it gets uploaded to Supabase Storage on order creation.
export type PaymentReceipt = {
  uri: string;
  base64: string;
  mimeType: string;
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
  // Chosen on the "Payment method" screen, reflected back on Quote Summary.
  paymentMethod: PaymentMethod | null;
  // Set when the user picks a receipt photo for a bank transfer; cleared when
  // they switch back to COD.
  paymentReceipt: PaymentReceipt | null;
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
  setPaymentMethod: (method: PaymentMethod) => void;
  setPaymentReceipt: (receipt: PaymentReceipt | null) => void;
  setScheduledAt: (iso: string | null) => void;
  reset: () => void;
};

const DEFAULT: DraftOrder = {
  pickup: null,
  dropoff: null,
  category: '',
  categoryDescription: '',
  size: 'm',
  weight: 5.5,
  specialInstructions: '',
  paymentMethod: null,
  paymentReceipt: null,
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

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setDraft((d) => ({ ...d, paymentMethod: method }));
  }, []);

  const setPaymentReceipt = useCallback((receipt: PaymentReceipt | null) => {
    setDraft((d) => ({ ...d, paymentReceipt: receipt }));
  }, []);

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
      setPaymentMethod,
      setPaymentReceipt,
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
      setPaymentMethod,
      setPaymentReceipt,
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
