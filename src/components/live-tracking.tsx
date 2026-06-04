import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeliveryStatus } from '@/hooks/use-delivery-status';
import { useRiderTracking } from '@/hooks/use-rider-tracking';

import { TrackingMap } from './tracking-map';

const COLORS = {
  surface: '#ffffff',
  famoYellow: '#FCD34D',
  famoText: '#1F2937',
  famoGray: '#F3F4F6',
  mapBg: '#EBF2FA',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  green: '#22C55E',
  border: '#F3F4F6',
};

const AVATAR_URI = 'https://randomuser.me/api/portraits/men/75.jpg';

const TAGS = ['Electronics', 'M · 5.5kg', '₦566'];

const STATUS_LABEL: Record<string, string> = {
  searching: 'Finding rider',
  accepted: 'Rider on the way',
  picked_up: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function LiveTracking() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ deliveryId?: string; riderId?: string }>();
  const deliveryId = typeof params.deliveryId === 'string' ? params.deliveryId : null;
  const paramRiderId =
    typeof params.riderId === 'string' && params.riderId ? params.riderId : null;
  const { delivery } = useDeliveryStatus(deliveryId);
  const { position, live } = useRiderTracking(
    deliveryId,
    paramRiderId ?? delivery?.rider_id ?? null,
  );

  // React to status changes that mean the current rider is no longer assigned.
  useEffect(() => {
    if (!delivery) return;
    if (delivery.status === 'searching') {
      // The assigned rider cancelled; the backend has already re-dispatched the
      // request to the next nearest riders. Return to the searching screen.
      router.replace({ pathname: '/finding-rider', params: { deliveryId: delivery.id } });
    } else if (delivery.status === 'cancelled') {
      router.replace('/orders');
    } else if (delivery.status === 'delivered') {
      // The rider confirmed drop-off (with proof photo); the delivery is done.
      // Send the user to the success screen, which returns them home.
      router.replace({ pathname: '/delivery-success', params: { deliveryId: delivery.id } });
    }
  }, [delivery, router]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Live Google map: follows the rider and frames pickup + drop-off. */}
      <View style={styles.map}>
        {delivery ? (
          <TrackingMap
            rider={position}
            pickup={{ lat: delivery.pickup_lat, lng: delivery.pickup_lng }}
            dropoff={{ lat: delivery.dropoff_lat, lng: delivery.dropoff_lng }}
            pickedUp={delivery.status === 'picked_up'}
          />
        ) : null}
      </View>

      {/* Top navigation & status */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.topButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.famoText} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/delivery-success')}
          style={styles.statusPill}
          accessibilityRole="button"
          accessibilityLabel="Delivery status">
          <Text style={styles.statusTitle}>
            {delivery ? STATUS_LABEL[delivery.status] ?? 'In transit' : 'In transit'}
          </Text>
          <Text style={styles.statusSub}>
            {position
              ? `${live ? 'Live' : 'Last'} · ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
              : 'Locating rider…'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert('Trip options', undefined, [
              {
                text: 'Share trip',
                onPress: () =>
                  Share.share({ message: 'Track my FAMO delivery in real time.' }),
              },
              { text: 'Get help', onPress: () => router.push('/help-support') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          style={styles.topButton}
          accessibilityRole="button"
          accessibilityLabel="Options">
          <MaterialIcons name="menu" size={24} color={COLORS.famoText} />
        </Pressable>
      </View>

      {/* Pull-up card */}
      <View style={[styles.card, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        {/* Rider profile */}
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.riderName}>Rashid Ahmed</Text>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={16} color={COLORS.famoYellow} />
                <Text style={styles.ratingValue}>4.9</Text>
                <Text style={styles.ratingTrips}>• 1,284 trips</Text>
              </View>
            </View>
          </View>
          <View style={styles.commActions}>
            <Pressable
              onPress={() => router.push('/call')}
              style={({ pressed }) => [styles.commBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Call rider">
              <MaterialIcons name="call" size={20} color={COLORS.famoText} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/chat')}
              style={({ pressed }) => [styles.commBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Message rider">
              <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.famoText} />
            </Pressable>
          </View>
        </View>

        {/* Shipment tags */}
        <View style={styles.tags}>
          {TAGS.map((tag, i) => (
            <View key={tag} style={styles.tag}>
              {i === 0 ? (
                <MaterialIcons name="devices" size={16} color={COLORS.textMuted} />
              ) : null}
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          <Pressable
            onPress={() =>
              Share.share({ message: 'Track my FAMO delivery in real time.' })
            }
            style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
            accessibilityRole="button">
            <MaterialIcons name="share" size={20} color={COLORS.famoText} />
            <Text style={styles.footerBtnText}>Share trip</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/cancel-delivery', params: { deliveryId: deliveryId ?? '' } })
            }
            style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
            accessibilityRole="button">
            <Text style={styles.footerBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
    backgroundColor: COLORS.surface,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.mapBg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  topButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statusPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.famoText,
  },
  statusSub: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  card: {
    marginTop: 'auto',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  riderName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.famoText,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.famoText,
  },
  ratingTrips: {
    fontSize: 12,
    color: COLORS.textFaint,
    marginLeft: 4,
  },
  commActions: {
    flexDirection: 'row',
    gap: 12,
  },
  commBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.famoGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.famoGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.famoText,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: COLORS.famoGray,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.famoText,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
