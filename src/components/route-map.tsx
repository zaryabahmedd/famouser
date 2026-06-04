// Native (iOS/Android) route preview shown on the Quote Summary screen. Renders
// a Google map with pickup + drop-off markers and the driving route polyline
// between them. The map is non-interactive (a static preview) and auto-fits to
// frame the whole route.
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, {
    Marker,
    Polyline,
    PROVIDER_GOOGLE,
    type LatLng,
    type Region,
} from 'react-native-maps';

export type RouteMapProps = {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  // Decoded polyline points for the driving route. When empty, a straight line
  // between the two endpoints is drawn instead.
  route?: { latitude: number; longitude: number }[];
};

const EDGE_PADDING = { top: 60, right: 60, bottom: 60, left: 60 };

function regionForPoints(points: LatLng[]): Region {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
  };
}

export function RouteMap({ pickup, dropoff, route }: RouteMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const pickupPoint: LatLng = { latitude: pickup.lat, longitude: pickup.lng };
  const dropoffPoint: LatLng = { latitude: dropoff.lat, longitude: dropoff.lng };

  // Use the decoded route when available; otherwise draw a straight line.
  const line = useMemo<LatLng[]>(() => {
    if (route && route.length > 1) return route;
    return [pickupPoint, dropoffPoint];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  const initialRegion = useMemo(
    () => regionForPoints([pickupPoint, dropoffPoint]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng],
  );

  // Fit the map to the full route once it (or the endpoints) is known.
  useEffect(() => {
    const id = setTimeout(() => {
      mapRef.current?.fitToCoordinates(line, {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
    }, 300);
    return () => clearTimeout(id);
  }, [line]);

  return (
    <View style={styles.map}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsMyLocationButton={false}>
        <Polyline
          coordinates={line}
          strokeColor="#fde047"
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
        <Marker coordinate={pickupPoint} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.dot, styles.dotStart]} />
        </Marker>
        <Marker coordinate={dropoffPoint} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.dot, styles.dotEnd]} />
        </Marker>
      </MapView>
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
  dot: {
    width: 18,
    height: 18,
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
});
