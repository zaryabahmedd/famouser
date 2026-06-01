import { useCallback, useState } from 'react';

import type { Delivery, NewDeliveryInput } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

type CreateState = {
  submitting: boolean;
  error: string | null;
};

/**
 * Creates a delivery request for the signed-in user. The database trigger then
 * automatically offers it to the nearest available rider. Returns the created
 * delivery row (with its id) so the caller can start tracking.
 */
export function useCreateDelivery() {
  const [state, setState] = useState<CreateState>({ submitting: false, error: null });

  const createDelivery = useCallback(
    async (input: NewDeliveryInput): Promise<Delivery | null> => {
      setState({ submitting: true, error: null });

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setState({ submitting: false, error: 'You must be signed in to send a delivery.' });
        return null;
      }

      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          user_id: userId,
          pickup_address: input.pickup_address ?? null,
          pickup_lat: input.pickup_lat,
          pickup_lng: input.pickup_lng,
          dropoff_address: input.dropoff_address ?? null,
          dropoff_lat: input.dropoff_lat,
          dropoff_lng: input.dropoff_lng,
          weight: input.weight ?? null,
          price: input.price ?? null,
        })
        .select()
        .single();

      if (error) {
        setState({ submitting: false, error: error.message });
        return null;
      }

      setState({ submitting: false, error: null });
      return data as Delivery;
    },
    [],
  );

  return { createDelivery, ...state };
}
