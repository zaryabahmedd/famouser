// Native (iOS/Android) live-tracking map. Renders a Google map that follows the
// rider's live position (from the `delivery-tracking:{id}` broadcast channel)
// while showing the pickup + drop-off markers and the driving route between the
// rider and the active target (pickup before collection, drop-off afterwards).
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, {
    Marker,
    PROVIDER_GOOGLE,
    type LatLng,
    type Region,
} from 'react-native-maps';

export type TrackingMapProps = {
  rider: { lat: number; lng: number; heading?: number } | null;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  // Once the parcel is picked up the active target becomes the drop-off.
  pickedUp?: boolean;
};

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
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.01),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.01),
  };
}

export function TrackingMap({ rider, pickup, dropoff, pickedUp }: TrackingMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const pickupPoint: LatLng = { latitude: pickup.lat, longitude: pickup.lng };
  const dropoffPoint: LatLng = { latitude: dropoff.lat, longitude: dropoff.lng };
  const riderPoint: LatLng | null = rider
    ? { latitude: rider.lat, longitude: rider.lng }
    : null;

  const initialRegion = useMemo(
    () => regionForPoints([pickupPoint, dropoffPoint, ...(riderPoint ? [riderPoint] : [])]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng],
  );

  // Keep the camera centred on the rider as they move.
  useEffect(() => {
    if (!riderPoint) return;
    mapRef.current?.animateCamera({ center: riderPoint }, { duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.lat, rider?.lng]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        toolbarEnabled={false}>
        <Marker coordinate={pickupPoint} anchor={{ x: 0.5, y: 0.5 }} title="Pickup">
          <View style={[styles.dot, styles.dotStart]} />
        </Marker>
        <Marker coordinate={dropoffPoint} anchor={{ x: 0.5, y: 0.5 }} title="Drop-off">
          <View style={[styles.dot, styles.dotEnd]} />
        </Marker>

        {riderPoint ? (
          <Marker
            coordinate={riderPoint}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            title="Rider">
            <View style={styles.riderHalo}>
              <View style={styles.riderDot} />
            </View>
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Google Maps-style live location dot: a solid blue dot inside a soft halo,
  // ringed in white so it stays visible over any map tile.
  riderHalo: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(66,133,244,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#ffffff',
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
