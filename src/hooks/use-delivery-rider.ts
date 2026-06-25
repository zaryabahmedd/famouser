import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Public profile of the rider assigned to a delivery, as returned by the
// `get_delivery_rider` RPC. Only safe, non-sensitive fields are exposed.
export type DeliveryRider = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
};

/**
 * Loads the assigned rider's public profile for a delivery the signed-in user
 * owns. `riders` has RLS with no SELECT policy, so this goes through the
 * SECURITY DEFINER `get_delivery_rider` RPC (owner-scoped on the server).
 *
 * Pass the delivery's `rider_id` as the second argument so the fetch re-runs
 * the moment a rider is assigned (the id transitions from null to a uuid).
 * Returns `{ rider: null }` until a rider exists.
 */
export function useDeliveryRider(
  deliveryId: string | null | undefined,
  riderId?: string | null,
) {
  const [rider, setRider] = useState<DeliveryRider | null>(null);

  useEffect(() => {
    if (!deliveryId) {
      setRider(null);
      return;
    }

    let active = true;
    supabase
      .rpc('get_delivery_rider', { p_delivery_id: deliveryId })
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRider((data as DeliveryRider | null) ?? null);
      });

    return () => {
      active = false;
    };
  }, [deliveryId, riderId]);

  return { rider };
}
