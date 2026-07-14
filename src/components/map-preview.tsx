// Native (iOS/Android) map preview shown on the pickup/drop-off screens. Renders
// a small, interactive Google map with a fixed center pin. Typing/selecting an
// address recenters the map; dragging the map under the pin refines the exact
// coordinates and reports them back so the draft order stays in sync. A "Move on
// map" button opens the full-screen picker for finer control.
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';

export type MapPreviewProps = {
  lat?: number | null;
  lng?: number | null;
  tint: string;
  kind: 'pickup' | 'dropoff';
  onMovePress: () => void;
  // Called when the user drags the map to refine the pinned location.
  onCoordinateChange?: (lat: number, lng: number) => void;
  // Hide the "Move on map" fine-tune option until a location is resolved.
  showMoveButton?: boolean;
  // When provided, shows a "Current location" button at the bottom of the map
  // that lets the user jump to their GPS position.
  onLocatePress?: () => void;
  // True while the GPS fix is being acquired; disables the locate button.
  locating?: boolean;
  // Zoom span (latitude/longitude delta); smaller = closer. Defaults to a
  // street-level view; pass a larger value for a city-level view.
  spanDelta?: number;
};

// Fallback center (Lahore) used until the user selects a location.
const DEFAULT_REGION: Region = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// Coordinates within this delta are treated as "the same spot" so an external
// address update doesn't fight a drag the user just performed.
const EPSILON = 1e-5;

export function MapPreview({
  lat,
  lng,
  tint,
  kind,
  onMovePress,
  onCoordinateChange,
  showMoveButton = true,
  onLocatePress,
  locating = false,
  spanDelta = 0.01,
}: MapPreviewProps) {
  const hasLocation = typeof lat === 'number' && typeof lng === 'number';
  const mapRef = useRef<MapView | null>(null);
  // The center we last synced to, used to break the recenter/report feedback loop.
  const centerRef = useRef({
    lat: hasLocation ? (lat as number) : DEFAULT_REGION.latitude,
    lng: hasLocation ? (lng as number) : DEFAULT_REGION.longitude,
  });
  // Only report coordinates back once the user has actually dragged the map, so
  // the initial mount / programmatic recenters don't overwrite the draft.
  const userDraggedRef = useRef(false);

  // Recenter the map when the address-driven coordinates change from outside.
  useEffect(() => {
    if (!hasLocation) return;
    const dLat = Math.abs((lat as number) - centerRef.current.lat);
    const dLng = Math.abs((lng as number) - centerRef.current.lng);
    if (dLat < EPSILON && dLng < EPSILON) return;
    centerRef.current = { lat: lat as number, lng: lng as number };
    mapRef.current?.animateToRegion(
      {
        latitude: lat as number,
        longitude: lng as number,
        latitudeDelta: spanDelta,
        longitudeDelta: spanDelta,
      },
      350,
    );
  }, [lat, lng, hasLocation, spanDelta]);

  const handleRegionChangeComplete = (region: Region) => {
    centerRef.current = { lat: region.latitude, lng: region.longitude };
    if (userDraggedRef.current) {
      onCoordinateChange?.(region.latitude, region.longitude);
    }
  };

  const initialRegion: Region = hasLocation
    ? {
        latitude: lat as number,
        longitude: lng as number,
        latitudeDelta: spanDelta,
        longitudeDelta: spanDelta,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.map}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onPanDrag={() => {
          userDraggedRef.current = true;
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      />

      {/* Fixed center pin: the map moves under it to set the exact spot. */}
      <View style={styles.centerPin} pointerEvents="none">
        <View style={[styles.pinBadge, { backgroundColor: tint }]}>
          <MaterialIcons name="place" size={20} color="#ffffff" />
        </View>
        <View style={[styles.pinStem, { backgroundColor: tint }]} />
      </View>

      {!hasLocation ? (
        <View style={styles.hintOverlay} pointerEvents="none">
          <MaterialIcons name="place" size={18} color={tint} />
          <Text style={styles.hintText}>
            {kind === 'pickup'
              ? 'Enter an address or drag the map to set pickup'
              : 'Enter an address or drag the map to set drop-off'}
          </Text>
        </View>
      ) : null}

      {onLocatePress ? (
        <Pressable
          onPress={onLocatePress}
          disabled={locating}
          style={({ pressed }) => [
            styles.mapBtn,
            styles.locateBtn,
            (pressed || locating) && styles.mapBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Use current location">
          {locating ? (
            <ActivityIndicator size={18} color="#1b1b1e" />
          ) : (
            <MaterialIcons name="gps-fixed" size={18} color="#1b1b1e" />
          )}
          <Text style={styles.mapBtnText}>{locating ? 'Locating…' : 'Current location'}</Text>
        </Pressable>
      ) : null}

      {showMoveButton ? (
        <Pressable
          onPress={onMovePress}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.mapBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Move on map">
          <MaterialIcons name="my-location" size={18} color="#1b1b1e" />
          <Text style={styles.mapBtnText}>Move on map</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 180,
    borderRadius: 20,
    backgroundColor: '#eae7eb',
    overflow: 'hidden',
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
  hintOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#4b4734',
  },
  mapBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  locateBtn: {
    right: undefined,
    left: 12,
  },
  mapBtnPressed: {
    opacity: 0.85,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b1b1e',
  },
});
