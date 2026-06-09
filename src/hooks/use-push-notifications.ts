import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const SAVED_TOKEN_KEY = 'famo.pushToken';
const ANDROID_CHANNEL = 'delivery-updates';

// Show a banner + play sound even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type NotificationData = {
  type?: string;
  delivery_id?: string;
  rider_id?: string;
};

/**
 * Registers the device for push notifications and routes notification taps.
 *
 * - Requests permission and registers the Expo push token, saving it to the
 *   signed-in user's row only when it actually changes.
 * - Handles taps both on cold start (getLastNotificationResponseAsync) and
 *   while running (addNotificationResponseReceivedListener), routing
 *   `rider_accepted` notifications to the live-tracking screen.
 *
 * Mount once near the app root, inside the router + auth providers.
 */
export function usePushNotifications() {
  const router = useRouter();
  const handledResponseIds = useRef<Set<string>>(new Set());

  // Route a tapped notification to the right screen.
  const handleResponse = useRef((response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handledResponseIds.current.has(id)) return;
    handledResponseIds.current.add(id);

    const data = response.notification.request.content.data as NotificationData;
    if (data?.type === 'rider_accepted' && data.delivery_id) {
      router.push({
        pathname: '/live-tracking',
        params: { deliveryId: data.delivery_id, riderId: data.rider_id ?? '' },
      });
    } else if (data?.type === 'no_riders_available') {
      // Delivery was auto-cancelled — show the user their orders so they can retry.
      router.push('/orders');
    }
  });

  // Register the push token for the current user, on mount and after sign-in.
  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!Device.isDevice) return; // Push tokens aren't available on simulators.

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
          name: 'Delivery updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FCD34D',
        });
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId || cancelled) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (status !== 'granted') {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== 'granted' || cancelled) return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      if (!projectId) return;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (cancelled || !token) return;

      // Skip the write when this user already has this exact token saved.
      const cacheValue = `${userId}|${token}`;
      const saved = await AsyncStorage.getItem(SAVED_TOKEN_KEY);
      if (saved === cacheValue) return;

      const { error } = await supabase
        .from('users')
        .update({ expo_push_token: token, push_token_updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (!error) await AsyncStorage.setItem(SAVED_TOKEN_KEY, cacheValue);
    }

    register().catch(() => {});

    // Re-register when the user signs in (token rows are per-user).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') register().catch(() => {});
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Handle taps: cold start once, then live while the app runs.
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) =>
      handleResponse.current(response),
    );

    const sub = Notifications.addNotificationResponseReceivedListener((response) =>
      handleResponse.current(response),
    );
    return () => sub.remove();
  }, []);
}
