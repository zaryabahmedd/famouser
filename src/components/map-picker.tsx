// Native full-screen map picker opened from the "Move on map" button on the
// pickup/drop-off screens. The user pans the map under a fixed center pin to
// place the exact spot; confirming writes the coordinates back into the shared
// draft order. Reverse geocoding is not available from the backend proxy, so the
// previously typed address is preserved while only the coordinates are updated.
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDraftOrder } from '@/hooks/use-draft-order';

const COLORS = {
  surface: '#ffffff',
  onSurface: '#1b1b1e',
  secondary: '#5e5e5e',
  primary: '#6d5e00',
  onPrimary: '#ffffff',
  pickup: '#1f7a3d',
  dropoff: '#ba1a1a',
};

const DEFAULT_REGION: Region = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function toNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function MapPicker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    lat?: string;
    lng?: string;
    address?: string;
  }>();
  const { setPickup, setDropoff } = useDraftOrder();

  const isDropoff = params.mode === 'dropoff';
  const tint = isDropoff ? COLORS.dropoff : COLORS.pickup;
  const presetAddress = typeof params.address === 'string' ? params.address : '';

  const startLat = toNumber(params.lat);
  const startLng = toNumber(params.lng);
  const initialRegion: Region =
    startLat != null && startLng != null
      ? { latitude: startLat, longitude: startLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : DEFAULT_REGION;

  // The map's current center; updated as the user pans the map.
  const centerRef = useRef({ latitude: initialRegion.latitude, longitude: initialRegion.longitude });
  const [center, setCenter] = useState(centerRef.current);

  const handleRegionChange = (region: Region) => {
    centerRef.current = { latitude: region.latitude, longitude: region.longitude };
    setCenter(centerRef.current);
  };

  const handleConfirm = () => {
    const { latitude, longitude } = centerRef.current;
    const address =
      presetAddress.trim().length > 0
        ? presetAddress
        : `Pinned location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
    const place = { address, lat: latitude, lng: longitude };
    if (isDropoff) setDropoff(place);
    else setPickup(place);
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChange}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      />

      {/* Fixed center pin */}
      <View style={styles.centerPin} pointerEvents="none">
        <View style={[styles.pinBadge, { backgroundColor: tint }]}>
          <MaterialIcons name="place" size={20} color="#ffffff" />
        </View>
        <View style={[styles.pinStem, { backgroundColor: tint }]} />
      </View>

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isDropoff ? 'Set drop-off location' : 'Set pickup location'}
        </Text>
        <View style={styles.iconButton} />
      </View>

      {/* Bottom confirm card */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.coords}>
          {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </Text>
        <Text style={styles.helper}>Drag the map to position the pin precisely.</Text>
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
          accessibilityRole="button">
          <Text style={styles.confirmText}>Confirm location</Text>
        </Pressable>
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
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    // Lift the pin so its tip points at the exact map center.
    marginTop: -48,
    alignItems: 'center',
  },
  pinBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  pinStem: {
    width: 3,
    height: 14,
    borderRadius: 999,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  coords: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  helper: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.secondary,
  },
  confirm: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPressed: {
    opacity: 0.9,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
});
