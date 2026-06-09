import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { chatChannelName, type ChatMessage } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

const readKey = (deliveryId: string) => `chat-last-read:${deliveryId}`;

/** Mark the conversation read up to now, clearing the unread badge. */
export async function markChatRead(deliveryId: string) {
  await AsyncStorage.setItem(readKey(deliveryId), String(Date.now()));
}

/**
 * Number of rider messages received since the user last opened this chat.
 * Tracks the "last read" timestamp in AsyncStorage (set by markChatRead) so
 * the badge persists across screen remounts and clears on return from chat.
 *
 * Uses its own channel topic (`:badge`) so it can run alongside the full chat
 * subscription on the same client without colliding.
 */
export function useChatUnread(deliveryId: string | null | undefined): number {
  const [riderTimestamps, setRiderTimestamps] = useState<number[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(0);
  const seenIds = useRef<Set<string>>(new Set());

  // Load history + subscribe to new rider messages.
  useEffect(() => {
    if (!deliveryId) {
      setRiderTimestamps([]);
      seenIds.current = new Set();
      return;
    }

    let active = true;
    seenIds.current = new Set();

    const addRider = (m: ChatMessage) => {
      if (m.sender_role !== 'rider' || seenIds.current.has(m.id)) return;
      seenIds.current.add(m.id);
      setRiderTimestamps((prev) => [...prev, new Date(m.created_at).getTime()]);
    };

    supabase
      .from('messages')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!active || !data) return;
        (data as ChatMessage[]).forEach(addRider);
      });

    const channel = supabase
      .channel(`${chatChannelName(deliveryId)}:badge`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `delivery_id=eq.${deliveryId}`,
        },
        (payload) => {
          if (active) addRider(payload.new as ChatMessage);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  // Re-read the marker whenever the screen regains focus (e.g. returning from chat).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!deliveryId) {
        setLastReadAt(0);
        return;
      }
      AsyncStorage.getItem(readKey(deliveryId)).then((v) => {
        if (active) setLastReadAt(v ? Number(v) : 0);
      });
      return () => {
        active = false;
      };
    }, [deliveryId]),
  );

  return riderTimestamps.filter((t) => t > lastReadAt).length;
}
