// Web fallback for TrackingMap. react-native-maps is native-only, so on web we
// show a styled placeholder that surfaces the rider's last reported coordinates.
import { StyleSheet, Text, View } from 'react-native';

import type { TrackingMapProps } from './tracking-map';

export function TrackingMap({ rider }: TrackingMapProps) {
  return (
    <View style={styles.map}>
      <View style={styles.grid} />
      <Text style={styles.title}>Live map is available on the mobile app</Text>
      <Text style={styles.coords}>
        {rider
          ? `Rider · ${rider.lat.toFixed(5)}, ${rider.lng.toFixed(5)}`
          : 'Locating rider…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EBF2FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f6f2f7',
    opacity: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1b1e',
  },
  coords: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b4734',
  },
});
