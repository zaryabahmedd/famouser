import { useEffect, useState } from 'react';

import {
    parseRiderPosition,
    RIDER_LOCATION_EVENT,
    trackingChannelName,
    type RiderPosition,
} from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

type TrackingState = {
  position: RiderPosition | null;
  /** True once at least one live broadcast has been received. */
  live: boolean;
};

/**
 * Subscribes to the rider's live position for an active delivery.
 *
 * Primary source: the `delivery-tracking:{delivery_id}` broadcast channel
 * (event `rider_location`), emitted by the rider app ~every 10s.
 *
 * Fallback: when no broadcast has arrived yet, seeds from the persisted
 * `rider_locations` row so the marker has an initial position. Pass the
 * assigned riderId (from the delivery row) to enable the fallback.
 */
export function useRiderTracking(
  deliveryId: string | null | undefined,
  riderId: string | null | undefined,
) {
  const [state, setState] = useState<TrackingState>({ position: null, live: false });

  useEffect(() => {
    if (!deliveryId) {
      setState({ position: null, live: false });
      return;
    }

    let active = true;

    // Seed from the last persisted location until the first broadcast lands.
    if (riderId) {
      supabase
        .from('rider_locations')
        .select('lat, lng')
        .eq('rider_id', riderId)
        .single()
        .then(({ data }) => {
          if (!active || !data) return;
          setState((s) =>
            s.live ? s : { position: { lat: data.lat, lng: data.lng }, live: false },
          );
        });
    }

    const channel = supabase
      .channel(trackingChannelName(deliveryId))
      .on('broadcast', { event: RIDER_LOCATION_EVENT }, ({ payload }) => {
        if (!active) return;
        const pos = parseRiderPosition(payload);
        if (pos) setState({ position: pos, live: true });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [deliveryId, riderId]);

  return state;
}
