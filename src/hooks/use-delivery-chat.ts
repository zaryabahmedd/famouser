import { useCallback, useEffect, useState } from 'react';

import { chatChannelName, type ChatMessage } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};

/**
 * Live chat for a single delivery. Loads persisted history, then subscribes
 * to Postgres Changes so messages from either side (including our own, echoed
 * back) arrive in order without needing optimistic local appends.
 *
 * RLS requires the signed-in user to own the delivery (auth.uid() = user_id).
 */
export function useDeliveryChat(deliveryId: string | null | undefined) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: Boolean(deliveryId),
    error: null,
  });

  useEffect(() => {
    if (!deliveryId) {
      setState({ messages: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    supabase
      .from('messages')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState({ messages: [], loading: false, error: error.message });
          return;
        }
        setState({ messages: (data ?? []) as ChatMessage[], loading: false, error: null });
      });

    const channel = supabase
      .channel(chatChannelName(deliveryId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `delivery_id=eq.${deliveryId}`,
        },
        (payload) => {
          if (!active) return;
          const message = payload.new as ChatMessage;
          setState((s) =>
            s.messages.some((m) => m.id === message.id)
              ? s
              : { ...s, messages: [...s.messages, message] },
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  const sendMessage = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text || !deliveryId) return;

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;

      await supabase.from('messages').insert({
        delivery_id: deliveryId,
        sender_id: userId,
        sender_role: 'user',
        body: text,
      });
    },
    [deliveryId],
  );

  return { ...state, sendMessage };
}
