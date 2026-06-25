import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGoBack } from '@/hooks/use-go-back';
import { useDeliveryRider } from '@/hooks/use-delivery-rider';
import { useDeliveryStatus } from '@/hooks/use-delivery-status';

import { Avatar } from './avatar';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
};

export function RiderAssigned() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const params = useLocalSearchParams<{ deliveryId?: string; riderId?: string }>();
  const deliveryId = typeof params.deliveryId === 'string' ? params.deliveryId : null;
  const { delivery } = useDeliveryStatus(deliveryId);
  const { rider } = useDeliveryRider(deliveryId, delivery?.rider_id);

  // Real vehicle details (no hardcoded "Electric Scooter / FAMO-EV-214").
  const vehicleTitle =
    rider?.vehicle_type ||
    [rider?.vehicle_brand, rider?.vehicle_model].filter(Boolean).join(' ') ||
    'Vehicle';
  const vehiclePlate = rider?.vehicle_plate ?? null;

  // React to status changes that mean this rider is no longer assigned.
  useEffect(() => {
    if (!delivery) return;
    if (delivery.status === 'searching') {
      // The assigned rider cancelled; the backend has already re-dispatched the
      // request to the next nearest riders. Return to the searching screen so the
      // user isn't stuck looking at a rider who is no longer coming.
      router.replace({ pathname: '/finding-rider', params: { deliveryId: delivery.id } });
    } else if (delivery.status === 'cancelled') {
      // The delivery was fully cancelled (e.g. by the user). Leave this screen.
      router.replace('/orders');
    }
  }, [delivery, router]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.brandLogo}
          contentFit="contain"
          accessibilityLabel="FAMO"
        />
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profile}>
          <View style={styles.avatarRing}>
            <Avatar uri={rider?.avatar_url} size={128} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{rider?.full_name ?? 'Your rider'}</Text>
        </View>

        {/* Vehicle info card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleLeft}>
            <View style={styles.vehicleIcon}>
              <MaterialIcons name="electric-moped" size={28} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.vehicleTitle}>{vehicleTitle}</Text>
              {vehiclePlate ? (
                <Text style={styles.vehicleSub}>Plate · {vehiclePlate}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Communication actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push({ pathname: '/call', params: { deliveryId: deliveryId ?? '' } })}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Call rider">
            <MaterialIcons name="call" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/chat', params: { deliveryId: deliveryId ?? '' } })}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Message rider">
            <MaterialIcons name="chat-bubble-outline" size={24} color={COLORS.onSurface} />
          </Pressable>
        </View>

        {/* View on map */}
        <Pressable
          onPress={() => router.push({ pathname: '/live-tracking', params })}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.mapBtnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="map" size={22} color={COLORS.onSurface} />
          <Text style={styles.mapBtnText}>View on Map</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.primary,
  },
  brandLogo: {
    width: 84,
    height: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  profile: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 999,
  },
  name: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurfaceVariant,
    marginLeft: 8,
  },
  vehicleCard: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    marginBottom: 32,
  },
  vehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  vehicleSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  etaBadge: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
    transform: [{ scale: 0.9 }],
  },
  mapBtn: {
    width: '100%',
    maxWidth: 400,
    height: 56,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  mapBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
});
