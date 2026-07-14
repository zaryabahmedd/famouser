import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapPreview } from '@/components/map-preview';
import { useDraftOrder } from '@/hooks/use-draft-order';
import { useKeyboardScroll } from '@/hooks/use-keyboard-scroll';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { geocodeAddress } from '@/lib/geo';
import { sanitizeName, sanitizePhone } from '@/lib/input-sanitize';

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
  onPrimaryFixed: '#211b00',
  dropoff: '#ba1a1a',
};

export function DropoffAddress() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scrollRef, onScroll, registerField, focusField, keyboardPadding } = useKeyboardScroll();
  const { dropoff, setDropoff, updateDropoff } = useDraftOrder();
  // A single address field: the city autocomplete pans the map and sets the
  // drop-off location. The user fine-tunes the exact spot with the map pin.
  const citySearch = usePlaceSearch(dropoff?.address ?? '');
  const [detail, setDetail] = useState(dropoff?.detail ?? '');
  const [name, setName] = useState(dropoff?.contactName ?? '');
  const [phone, setPhone] = useState(dropoff?.contactPhone ?? '');
  const [notes, setNotes] = useState(dropoff?.notes ?? '');

  // What the map is currently centered on, and how tightly it is zoomed.
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(
    dropoff ? { lat: dropoff.lat, lng: dropoff.lng } : null,
  );
  const [mapSpan, setMapSpan] = useState(dropoff ? 0.01 : 0.08);
  // True once a precise address has been geocoded; gates the pin / "Move on map"
  // option so it only appears after the map has navigated to the address.
  const [addressResolved, setAddressResolved] = useState(!!dropoff);

  // Address, recipient name, and a real phone number are required so incomplete
  // or bogus orders can't be submitted. Delivery instructions are optional.
  const phoneValid = phone.replace(/\D/g, '').length >= 10;
  const isComplete =
    citySearch.query.trim().length > 0 && name.trim().length > 0 && phoneValid;
  const [resolving, setResolving] = useState(false);

  const openMapPicker = () => {
    router.push({
      pathname: '/map-picker',
      params: {
        mode: 'dropoff',
        ...(dropoff ? { lat: String(dropoff.lat), lng: String(dropoff.lng) } : {}),
        address: citySearch.query || dropoff?.address || '',
      },
    });
  };

  // City selected -> set it as the drop-off location and move the map there. The
  // user can fine-tune the exact spot with the map pin ("Move on map").
  const handleCitySelect = async (placeId: string, description: string) => {
    const place = await citySearch.select({
      place_id: placeId,
      description,
      main_text: description,
      secondary_text: '',
    });
    if (place) {
      setDropoff(place);
      setMapCenter({ lat: place.lat, lng: place.lng });
      setMapSpan(0.05);
      setAddressResolved(true);
    }
  };

  const handlePinMove = (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    if (dropoff) {
      updateDropoff({ lat, lng });
    } else {
      const address =
        citySearch.query.trim().length > 0
          ? citySearch.query
          : `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      setDropoff({ address, lat, lng });
    }
    setAddressResolved(true);
  };

  // Auto-geocode the typed city so the map and the draft drop-off location stay
  // in sync even if the user types without tapping a suggestion.
  const lastCityGeocode = useRef('');
  useEffect(() => {
    const q = citySearch.query.trim();
    if (q.length < 3 || q === lastCityGeocode.current) return;
    const t = setTimeout(() => {
      lastCityGeocode.current = q;
      geocodeAddress(q)
        .then((place) => {
          if (place?.lat != null) {
            setDropoff({ address: place.address || q, lat: place.lat, lng: place.lng });
            setMapCenter({ lat: place.lat, lng: place.lng });
            setMapSpan(0.05);
            setAddressResolved(true);
          }
        })
        .catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [citySearch.query]);

  const handleContinue = async () => {
    if (!isComplete) {
      Alert.alert(
        'Missing information',
        phone.trim().length > 0 && !phoneValid
          ? 'Enter a valid phone number (at least 10 digits).'
          : 'Please fill in the address, recipient name, and phone number before continuing.',
      );
      return;
    }

    // Make sure we have a real located drop-off before advancing. Without coords
    // the draft dropoff is null, the fare can't be computed, and Quote Summary's
    // button stays disabled. (The text field alone isn't enough — the auto-geocode
    // is debounced and may not have run when the user taps Continue.)
    let located = dropoff;

    // Prefer the map pin if the user moved it without selecting a city.
    if (!located && mapCenter) {
      const pinned = {
        address: `Pinned location (${mapCenter.lat.toFixed(5)}, ${mapCenter.lng.toFixed(5)})`,
        lat: mapCenter.lat,
        lng: mapCenter.lng,
      };
      setDropoff(pinned);
      located = { ...pinned };
    }

    // Otherwise geocode the typed address right now so we never advance unlocated.
    if (!located) {
      const q = citySearch.query.trim();
      if (q.length > 0) {
        setResolving(true);
        try {
          const place = await geocodeAddress(q);
          if (place?.lat != null) {
            setDropoff({ address: place.address || q, lat: place.lat, lng: place.lng });
            located = { address: place.address || q, lat: place.lat, lng: place.lng };
          }
        } catch {
          // fall through to the alert below
        } finally {
          setResolving(false);
        }
      }
    }

    if (!located) {
      Alert.alert(
        'Location not found',
        'We could not locate that address. Pick it from the suggestions list or set it on the map.',
      );
      return;
    }

    updateDropoff({ detail, contactName: name, contactPhone: phone, notes });
    router.push('/size-weight');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/pickup-address'))}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>STEP 2 OF 2</Text>
          <Text style={styles.headerTitle}>Drop-off address</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 + keyboardPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Map preview */}
        <MapPreview
          lat={mapCenter?.lat}
          lng={mapCenter?.lng}
          tint={COLORS.dropoff}
          kind="dropoff"
          onMovePress={openMapPicker}
          onCoordinateChange={handlePinMove}
          showMoveButton={!!mapCenter}
          spanDelta={mapSpan}
        />

        {/* City */}
        <Text style={styles.sectionTitle}>Enter Location (Drop-Off Location)</Text>
        <View style={styles.field} onLayout={registerField('city')}>
          <MaterialIcons name="location-city" size={20} color={COLORS.dropoff} />
          <TextInput
            value={citySearch.query}
            onChangeText={citySearch.onChangeText}
            onFocus={() => focusField('city')}
            placeholder="Enter Your Address"
            placeholderTextColor={COLORS.outline}
            style={styles.input}
          />
          {citySearch.loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : citySearch.query.length > 0 ? (
            <Pressable
              onPress={() => citySearch.onChangeText('')}
              hitSlop={8}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Clear address">
              <MaterialIcons name="close" size={16} color={COLORS.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>
        {citySearch.unavailable ? (
          <Text style={styles.hint}>City search is temporarily unavailable.</Text>
        ) : null}
        {citySearch.predictions.length > 0 ? (
          <View style={styles.suggestions}>
            {citySearch.predictions.map((p) => (
              <Pressable
                key={p.place_id}
                onPress={() => handleCitySelect(p.place_id, p.description)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                accessibilityRole="button">
                <MaterialIcons name="location-city" size={18} color={COLORS.outline} />
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {p.main_text || p.description}
                  </Text>
                  {p.secondary_text ? (
                    <Text style={styles.suggestionSecondary} numberOfLines={1}>
                      {p.secondary_text}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Recipient contact */}
        <Text style={styles.sectionTitle}>Recipient details</Text>
        <View style={styles.field} onLayout={registerField('recipientName')}>
          <MaterialIcons name="person" size={20} color={COLORS.outline} />
          <TextInput
            value={name}
            onChangeText={(text) => setName(sanitizeName(text))}
            onFocus={() => focusField('recipientName')}
            placeholder="Recipient name"
            placeholderTextColor={COLORS.outline}
            autoCapitalize="words"
            style={styles.input}
          />
        </View>
        <View style={styles.field} onLayout={registerField('recipientPhone')}>
          <MaterialIcons name="call" size={20} color={COLORS.outline} />
          <TextInput
            value={phone}
            onChangeText={(text) => setPhone(sanitizePhone(text))}
            onFocus={() => focusField('recipientPhone')}
            placeholder="Phone number"
            placeholderTextColor={COLORS.outline}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Delivery instructions (optional)</Text>
        <View style={[styles.field, styles.fieldNote]} onLayout={registerField('notes')}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onFocus={() => focusField('notes')}
            placeholder="e.g. Leave at the reception desk"
            placeholderTextColor={COLORS.outline}
            style={[styles.input, styles.inputNote]}
            multiline
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Continue */}
        <Pressable
          disabled={resolving}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.next,
            (!isComplete || resolving) && styles.nextDisabled,
            pressed && isComplete && !resolving && styles.nextPressed,
          ]}
          accessibilityRole="button">
          <Text style={[styles.nextText, !isComplete && styles.nextTextDisabled]}>
            {resolving ? 'Locating address…' : 'Confirm addresses'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  progressActive: {
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  map: {
    height: 180,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceContainerLow,
    opacity: 0.6,
  },
  mapPin: {
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
  mapBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  mapBtnPressed: {
    opacity: 0.8,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 12,
  },
  fieldNote: {
    alignItems: 'flex-start',
    minHeight: 88,
  },
  hint: {
    fontSize: 13,
    color: COLORS.outline,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  suggestions: {
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 12,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  suggestionPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  suggestionSecondary: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  clearBtnPressed: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputNote: {
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  next: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    marginTop: 24,
  },
  nextDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  nextPressed: {
    transform: [{ scale: 0.98 }],
  },
  nextText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#000000',
  },
  nextTextDisabled: {
    color: COLORS.outline,
  },
});
