import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateDelivery } from '@/hooks/use-create-delivery';
import { useDraftOrder } from '@/hooks/use-draft-order';
import { estimateFare, FARE, getRoute, haversineMeters } from '@/lib/geo';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHigh: '#eae7eb',
  surfaceContainerHighest: '#e4e1e6',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  error: '#ba1a1a',
};

const MAP_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuASSAgLsA3InUcyrO8lo07yt2uyk0WTuyQqpoWPZ5jTRdJZpGFNBDaRfVSLKpZ2XgRYJikzq3B0s7A2CzuAC8pNUii655N4Z2L_ypGMIzNxa9d4X_mAagz2eYisRc3OWS2RJXOJL094s5IGV6fRS4QXEtBJlE-OpNbk4pWa7XstyObekWceVHewSiXPVH27pNO97JGmlk2992IKhIObUlKQwI9OZ1n29vJ81J3xYI2uORgRb_oQznAIBjAS3R8rZlyK7-SPFjGWfA';

type FareRow = {
  label: string;
  value: string;
  negative?: boolean;
};

export function QuoteSummary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [promo, setPromo] = useState('');
  const { createDelivery, submitting, error } = useCreateDelivery();
  const { pickup, dropoff, size, weight } = useDraftOrder();

  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(true);

  const hasRoute = !!pickup && !!dropoff;

  // Resolve the real driving distance once both endpoints are known. Falls back
  // to a straight-line estimate if the directions service is unavailable.
  useEffect(() => {
    let cancelled = false;
    if (!pickup || !dropoff) {
      setCalculating(false);
      return;
    }
    setCalculating(true);
    (async () => {
      let meters: number;
      try {
        const route = await getRoute(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: dropoff.lat, lng: dropoff.lng },
        );
        meters = route.distance_meters;
      } catch {
        meters = haversineMeters(pickup, dropoff);
      }
      if (!cancelled) {
        setDistanceMeters(meters);
        setCalculating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff]);

  const km = distanceMeters != null ? distanceMeters / 1000 : null;
  const price = distanceMeters != null ? estimateFare(distanceMeters, weight) : null;

  const fareRows = useMemo<FareRow[]>(() => {
    if (km == null) return [];
    return [
      { label: 'Base fare', value: `Rs ${FARE.base}` },
      {
        label: `Distance (${km.toFixed(1)} km × ${FARE.perKm})`,
        value: `Rs ${Math.round(km * FARE.perKm)}`,
      },
      { label: `Weight (${weight} kg × ${FARE.perKg})`, value: `Rs ${Math.round(weight * FARE.perKg)}` },
    ];
  }, [km, weight]);

  const priceLabel = price != null ? `Rs ${price}` : '—';

  const handleConfirm = async () => {
    if (submitting || !pickup || !dropoff || price == null) return;
    const delivery = await createDelivery({
      pickup_address: pickup.address,
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      dropoff_address: dropoff.address,
      dropoff_lat: dropoff.lat,
      dropoff_lng: dropoff.lng,
      weight,
      price,
    });
    if (delivery) {
      router.push({ pathname: '/finding-rider', params: { deliveryId: delivery.id } });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

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
        <Text style={styles.headerTitle}>Quote summary</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        {/* Map preview */}
        <View style={styles.map}>
          <Image source={{ uri: MAP_URI }} style={styles.mapImage} contentFit="cover" />
          <View style={styles.mapMarkers} pointerEvents="none">
            <View style={[styles.marker, styles.markerStart]} />
            <View style={[styles.marker, styles.markerEnd]} />
          </View>
        </View>

        {/* Detail chips */}
        <View style={styles.chips}>
          <View style={styles.chip}>
            <MaterialIcons name="inventory-2" size={18} color={COLORS.primary} />
            <Text style={styles.chipText}>Package</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{size.toUpperCase()} • {weight}kg</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{km != null ? `${km.toFixed(1)} km` : '—'}</Text>
          </View>
        </View>

        {/* Fare breakdown */}
        {!hasRoute ? (
          <View style={styles.fareCard}>
            <View style={styles.fareAccent} />
            <Text style={styles.fareHeading}>FARE BREAKDOWN</Text>
            <Text style={styles.fareMissing}>
              Pickup and drop-off addresses are required to calculate your fare. Go back and pick
              both from the address search.
            </Text>
          </View>
        ) : calculating ? (
          <View style={styles.fareCard}>
            <View style={styles.fareAccent} />
            <Text style={styles.fareHeading}>FARE BREAKDOWN</Text>
            <View style={styles.fareCalculating}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.fareMissing}>Calculating distance…</Text>
            </View>
          </View>
        ) : (
          <View style={styles.fareCard}>
            <View style={styles.fareAccent} />
            <Text style={styles.fareHeading}>FARE BREAKDOWN</Text>
            <View style={styles.fareRows}>
              {fareRows.map((row) => (
                <View key={row.label} style={styles.fareRow}>
                  <Text style={[styles.fareLabel, row.negative && styles.fareNegative]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.fareValue, row.negative && styles.fareNegative]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.fareTotalRow}>
              <Text style={styles.fareTotalLabel}>Total</Text>
              <Text style={styles.fareTotalValue}>{priceLabel}</Text>
            </View>
          </View>
        )}

        {/* Promo input */}
        <View style={styles.promoRow}>
          <TextInput
            value={promo}
            onChangeText={setPromo}
            placeholder="Promo code"
            placeholderTextColor={COLORS.onSurfaceVariant}
            style={styles.promoInput}
            autoCapitalize="characters"
          />
          <Pressable
            style={({ pressed }) => [styles.promoBtn, pressed && styles.pressed]}
            accessibilityRole="button">
            <Text style={styles.promoBtnText}>Apply</Text>
          </Pressable>
        </View>

        {/* Payment method */}
        <Pressable
          onPress={() => router.push('/payment-methods')}
          style={({ pressed }) => [styles.payment, pressed && styles.paymentPressed]}
          accessibilityRole="button">
          <View style={styles.paymentLeft}>
            <View style={styles.paymentIcon}>
              <MaterialIcons name="credit-card" size={24} color={COLORS.onSurface} />
            </View>
            <Text style={styles.paymentText}>Visa •••• 4242</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.outline} />
        </Pressable>

        {/* Bottom action */}
        {error ? (
          <Text style={{ color: COLORS.error, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
        ) : null}
        <Pressable
          onPress={handleConfirm}
          disabled={submitting || price == null}
          style={({ pressed }) => [
            styles.confirm,
            (pressed || submitting || price == null) && styles.pressed,
          ]}
          accessibilityRole="button">
          <Text style={styles.confirmText}>
            {submitting ? 'Creating request…' : `Confirm & Pay · ${priceLabel}`}
          </Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
    gap: 24,
  },
  map: {
    height: 192,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  mapMarkers: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerStart: {
    top: '25%',
    left: '33%',
    backgroundColor: COLORS.primary,
  },
  markerEnd: {
    bottom: '25%',
    right: '33%',
    backgroundColor: COLORS.onSurface,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  fareCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    padding: 20,
    overflow: 'hidden',
    gap: 16,
  },
  fareAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primaryContainer,
  },
  fareHeading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.onSurfaceVariant,
  },
  fareMissing: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 12,
    lineHeight: 20,
  },
  fareCalculating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  fareRows: {
    gap: 12,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareLabel: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  fareValue: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  fareNegative: {
    color: COLORS.error,
  },
  fareTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  fareTotalLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  fareTotalValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  promoBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  paymentPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  confirm: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
    marginTop: 8,
  },
  confirmText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
