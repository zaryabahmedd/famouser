// Web fallback for RouteMap. react-native-maps is native-only, so on web we keep
// the styled placeholder that mirrors the native layout.
import { StyleSheet, Text, View } from 'react-native';

import type { RouteMapProps } from './route-map';

export function RouteMap(_props: RouteMapProps) {
  return (
    <View style={styles.map}>
      <View style={styles.grid} />
      <View style={styles.markers}>
        <View style={[styles.dot, styles.dotStart]} />
        <View style={styles.line} />
        <View style={[styles.dot, styles.dotEnd]} />
      </View>
      <Text style={styles.note}>Route preview is available on the mobile app</Text>
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
  markers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  dotStart: {
    backgroundColor: '#1b1b1e',
  },
  dotEnd: {
    backgroundColor: '#fde047',
  },
  line: {
    width: 60,
    height: 3,
    backgroundColor: '#fde047',
  },
  note: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b4734',
  },
});
