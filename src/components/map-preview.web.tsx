// Web fallback for MapPreview. react-native-maps has no web implementation, so
// on web we render a styled placeholder that mirrors the native layout. The
// "Move on map" button is still wired so behavior is consistent.
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MapPreviewProps } from './map-preview';

// react-native-maps is native-only, so the web preview stays a static placeholder
// and ignores `onCoordinateChange`.
export function MapPreview({
  lat,
  lng,
  tint,
  kind,
  onMovePress,
  showMoveButton = true,
  onLocatePress,
  locating = false,
}: MapPreviewProps) {
  const hasLocation = typeof lat === 'number' && typeof lng === 'number';

  return (
    <View style={styles.map}>
      <View style={styles.grid} />
      <View style={styles.pin}>
        <View style={[styles.pinBadge, { backgroundColor: tint }]}>
          <MaterialIcons
            name={kind === 'pickup' ? 'trip-origin' : 'place'}
            size={18}
            color="#ffffff"
          />
        </View>
        <View style={[styles.pinStem, { backgroundColor: tint }]} />
      </View>

      <Text style={styles.note}>
        {hasLocation
          ? `${(lat as number).toFixed(4)}, ${(lng as number).toFixed(4)}`
          : 'Map preview is available on the mobile app'}
      </Text>

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
          <MaterialIcons name="gps-fixed" size={18} color="#1b1b1e" />
          <Text style={styles.mapBtnText}>{locating ? 'Locating…' : 'Current location'}</Text>
        </Pressable>
      ) : null}

      {showMoveButton ? (
        <Pressable
          onPress={onMovePress}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.mapBtnPressed]}
          accessibilityRole="button">
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f6f2f7',
    opacity: 0.6,
  },
  pin: {
    alignItems: 'center',
    marginBottom: 12,
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
  note: {
    position: 'absolute',
    top: 12,
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
