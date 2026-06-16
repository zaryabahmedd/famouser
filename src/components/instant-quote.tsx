import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { useGoBack } from '@/hooks/use-go-back';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { usePricing } from '@/hooks/use-pricing';
import { getRoute, haversineMeters, type PlaceLocation, type PlacePrediction } from '@/lib/geo';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainer: '#f0edf1',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
};

type Size = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  desc: string;
};

const SIZES: Size[] = [
  { key: 'S', icon: 'inbox',       label: 'Small',       desc: 'Envelope / bag' },
  { key: 'M', icon: 'inventory',   label: 'Medium',      desc: 'Shoebox size'   },
  { key: 'L', icon: 'inventory-2', label: 'Large',       desc: 'Moving box'     },
  { key: 'XL', icon: 'widgets',   label: 'Extra Large', desc: 'Bulk / bulky'   },
];

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString('en-NG');
}

export function InstantQuote() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const [size, setSize] = useState('M');
  const { perKmPrice } = usePricing();

  // Real Google Places autocomplete for the two location fields.
  const pickupSearch = usePlaceSearch();
  const dropoffSearch = usePlaceSearch();
  const [pickupLoc, setPickupLoc] = useState<PlaceLocation | null>(null);
  const [dropoffLoc, setDropoffLoc] = useState<PlaceLocation | null>(null);

  // Resolved route + fare estimate (₦180 per km).
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  // Only reveal the estimate after the user taps "Get estimated price".
  const [showEstimate, setShowEstimate] = useState(false);

  const handlePickupSelect = async (prediction: PlacePrediction) => {
    const place = await pickupSearch.select(prediction);
    if (place) {
      setPickupLoc(place);
      setShowEstimate(false);
    }
  };

  const handleDropoffSelect = async (prediction: PlacePrediction) => {
    const place = await dropoffSearch.select(prediction);
    if (place) {
      setDropoffLoc(place);
      setShowEstimate(false);
    }
  };

  const canEstimate = pickupLoc != null && dropoffLoc != null;

  // Fetch the driving route to derive the distance (falling back to a
  // straight-line distance if the route service is offline), then reveal the
  // estimate card. Triggered by the "Get estimated price" button.
  const handleEstimate = () => {
    if (!pickupLoc || !dropoffLoc) return;
    setShowEstimate(true);
    setRouteLoading(true);
    getRoute(
      { lat: pickupLoc.lat, lng: pickupLoc.lng },
      { lat: dropoffLoc.lat, lng: dropoffLoc.lng },
    )
      .then((route) => {
        setDistanceMeters(route.distance_meters);
        setDurationSeconds(route.duration_seconds);
      })
      .catch(() => {
        const meters = haversineMeters(
          { lat: pickupLoc.lat, lng: pickupLoc.lng },
          { lat: dropoffLoc.lat, lng: dropoffLoc.lng },
        );
        setDistanceMeters(meters);
        setDurationSeconds(null);
      })
      .finally(() => {
        setRouteLoading(false);
      });
  };

  const km = distanceMeters != null ? distanceMeters / 1000 : null;
  // Estimated total billed at the live per-kilometre rate from pricing_settings.
  const total = km != null ? Math.round(km * perKmPrice) : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => goBack()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Get instant quote</Text>
        </View>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.brandLogo}
          contentFit="contain"
          accessibilityLabel="FAMO"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Pickup */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>PICKUP</Text>
          <View style={styles.input}>
            <MaterialIcons name="location-on" size={20} color={COLORS.outline} />
            <TextInput
              value={pickupSearch.query}
              onChangeText={pickupSearch.onChangeText}
              placeholder="Search pickup location"
              placeholderTextColor={COLORS.outline}
              style={styles.inputValue}
            />
            {pickupSearch.loading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
          {pickupSearch.predictions.length > 0 && (
            <View style={styles.suggestions}>
              {pickupSearch.predictions.map((p) => (
                <Pressable
                  key={p.place_id}
                  onPress={() => handlePickupSelect(p)}
                  style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionPressed]}
                  accessibilityRole="button">
                  <MaterialIcons name="place" size={18} color={COLORS.outline} />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{p.main_text}</Text>
                    {!!p.secondary_text && (
                      <Text style={styles.suggestionSub} numberOfLines={1}>{p.secondary_text}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Drop-off */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DROP-OFF</Text>
          <View style={styles.input}>
            <MaterialIcons name="location-on" size={20} color={COLORS.outline} />
            <TextInput
              value={dropoffSearch.query}
              onChangeText={dropoffSearch.onChangeText}
              placeholder="Search drop-off location"
              placeholderTextColor={COLORS.outline}
              style={styles.inputValue}
            />
            {dropoffSearch.loading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
          {dropoffSearch.predictions.length > 0 && (
            <View style={styles.suggestions}>
              {dropoffSearch.predictions.map((p) => (
                <Pressable
                  key={p.place_id}
                  onPress={() => handleDropoffSelect(p)}
                  style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionPressed]}
                  accessibilityRole="button">
                  <MaterialIcons name="place" size={18} color={COLORS.outline} />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{p.main_text}</Text>
                    {!!p.secondary_text && (
                      <Text style={styles.suggestionSub} numberOfLines={1}>{p.secondary_text}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Package size */}
        <Text style={styles.sectionTitle}>PACKAGE SIZE</Text>
        <View style={styles.sizeGrid}>
          {SIZES.map((s) => {
            const isSelected = size === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSize(s.key)}
                style={({ pressed }) => [
                  styles.sizeCard,
                  isSelected && styles.sizeCardSelected,
                  pressed && styles.sizeCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <View style={styles.sizeIcon}>
                  <MaterialIcons
                    name={s.icon}
                    size={36}
                    color={isSelected ? COLORS.onPrimaryContainer : COLORS.onSurface}
                  />
                </View>
                <Text style={[styles.sizeLabel, isSelected && styles.sizeLabelSelected]}>
                  {s.label}
                </Text>
                <Text style={styles.sizeDesc}>{s.desc}</Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <MaterialIcons name="check" size={13} color={COLORS.onPrimaryContainer} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Pricing card */}
        {showEstimate && (
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>ESTIMATED TOTAL</Text>
            {routeLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : total != null ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>₦</Text>
                <Text style={styles.priceValue}>{formatPrice(total)}</Text>
              </View>
            ) : (
              <Text style={styles.priceHint}>
                Add pickup and drop-off to see your price
              </Text>
            )}
            {km != null && (
              <View style={styles.priceMeta}>
                <View style={styles.priceMetaItem}>
                  <MaterialIcons name="straighten" size={16} color={COLORS.onSurfaceVariant} />
                  <Text style={styles.priceMetaText}>{km.toFixed(1)} km</Text>
                </View>
                {durationSeconds != null && (
                  <>
                    <View style={styles.priceDot} />
                    <View style={styles.priceMetaItem}>
                      <MaterialIcons name="schedule" size={16} color={COLORS.onSurfaceVariant} />
                      <Text style={styles.priceMetaText}>~{Math.round(durationSeconds / 60)} min</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={handleEstimate}
          disabled={!canEstimate}
          style={({ pressed }) => [
            styles.cta,
            !canEstimate && styles.ctaDisabled,
            pressed && canEstimate && styles.ctaPressed,
          ]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Get estimated price</Text>
          <MaterialIcons name="calculate" size={24} color={COLORS.onPrimaryContainer} />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  brandLogo: {
    width: 84,
    height: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 512,
    width: '100%',
    alignSelf: 'center',
  },
  field: {
    gap: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.secondary,
    paddingHorizontal: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.5)',
    backgroundColor: COLORS.surfaceLowest,
  },
  inputValue: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  suggestions: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.5)',
    backgroundColor: COLORS.surfaceLowest,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  suggestionPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  suggestionSub: {
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.onSurface,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  sizeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  sizeCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  sizeCardPressed: {
    backgroundColor: '#fffdf2',
  },
  sizeIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  sizeLabelSelected: {
    color: COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
  sizeDesc: {
    fontSize: 11,
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primary,
  },
  priceCard: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.3)',
    backgroundColor: 'rgba(246, 242, 247, 0.5)',
    alignItems: 'center',
    gap: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.secondary,
  },
  priceHint: {
    fontSize: 14,
    color: COLORS.outline,
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceCurrency: {
    fontSize: 30,
    fontWeight: '500',
    color: COLORS.secondary,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.onSurface,
  },
  priceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  priceDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.outlineVariant,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.2)',
    backgroundColor: COLORS.surfaceLowest,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  cta: {
    marginTop: 32,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
});
