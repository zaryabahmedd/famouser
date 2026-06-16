import { useEffect, useRef, useState } from 'react';

import type { Delivery } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

type DeliveryState = {
  delivery: Delivery | null;
  loading: boolean;
  error: string | null;
};

/**
 * Tracks a single delivery row in real time. Fetches the current row, then
 * subscribes to Postgres Changes so status transitions (searching -> accepted
 * -> picked_up -> delivered/cancelled) and the assigned rider_id arrive live.
 *
 * RLS requires the signed-in user to own the row (auth.uid() = user_id).
 */
export function useDeliveryStatus(deliveryId: string | null | undefined) {
  const [state, setState] = useState<DeliveryState>({
    delivery: null,
    loading: Boolean(deliveryId),
    error: null,
  });

  // Keep the latest id available to the async fetch without re-subscribing.
  const idRef = useRef(deliveryId);
  idRef.current = deliveryId;

  useEffect(() => {
    if (!deliveryId) {
      setState({ delivery: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    supabase
      .from('deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState({ delivery: null, loading: false, error: error.message });
          return;
        }
        setState({ delivery: data as Delivery, loading: false, error: null });
      });

    const channel = supabase
      .channel(`delivery-status:${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          if (!active) return;
          setState({ delivery: payload.new as Delivery, loading: false, error: null });
        },
      )
      .subscribe();

    // Polling fallback: realtime can drop events (RLS filtering, a backgrounded
    // socket, flaky networks). Re-fetch the row every few seconds so a status
    // change like searching -> accepted is always picked up and the user is
    // never left stranded on "Finding your rider" after a rider accepts.
    const poll = setInterval(() => {
      supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single()
        .then(({ data, error }) => {
          if (!active || error || !data) return;
          setState({ delivery: data as Delivery, loading: false, error: null });
        });
    }, 4000);

    return () => {
      active = false;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  return state;
}
