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

      // Use the locally cached session (instant) rather than getUser(), which
      // makes a network round-trip to the auth server and was the main source of
      // the "Confirm & Pay" delay.
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user?.id;
      if (!userId) {
        setState({ submitting: false, error: 'You must be signed in to send a delivery.' });
        return null;
      }

      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          user_id: userId,
          // Defaults to immediate dispatch; a scheduled order passes
          // status: 'scheduled' so the trigger leaves it alone until its time.
          status: input.status ?? 'searching',
          scheduled_at: input.scheduled_at ?? null,
          pickup_address: input.pickup_address ?? null,
          pickup_lat: input.pickup_lat,
          pickup_lng: input.pickup_lng,
          dropoff_address: input.dropoff_address ?? null,
          dropoff_lat: input.dropoff_lat,
          dropoff_lng: input.dropoff_lng,
          weight: input.weight ?? null,
          price: input.price ?? null,
          package_category: input.package_category ?? null,
          package_description: input.package_description ?? null,
          package_size: input.package_size ?? null,
          sender_name: input.sender_name ?? null,
          sender_phone: input.sender_phone ?? null,
          recipient_name: input.recipient_name ?? null,
          recipient_phone: input.recipient_phone ?? null,
          pickup_notes: input.pickup_notes ?? null,
          dropoff_notes: input.dropoff_notes ?? null,
          special_instructions: input.special_instructions ?? null,
          payment_method: input.payment_method ?? null,
          payment_screenshot_url: input.payment_screenshot_url ?? null,
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
