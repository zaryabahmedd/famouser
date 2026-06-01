import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
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

import { useDraftOrder } from '@/hooks/use-draft-order';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { autocompletePlaces, getPlaceDetails, newPlacesSession } from '@/lib/geo';

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
  pickup: '#1f7a3d',
  pickupContainer: '#c8f0d4',
};

type SavedPlace = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  address: string;
};

const SAVED: SavedPlace[] = [
  { key: 'home', icon: 'home', label: 'Home', address: 'House 21, DHA Phase 5, Lahore' },
  { key: 'work', icon: 'work', label: 'Work', address: 'Office 12, Gulberg III, Lahore' },
];

export function PickupAddress() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setPickup, updatePickup } = useDraftOrder();
  const search = usePlaceSearch();
  const [picked, setPicked] = useState(false);
  const [detail, setDetail] = useState('');
  const [name, setName] = useState('Ahmed Khan');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [notes, setNotes] = useState('');

  const canContinue =
    (picked || search.query.trim().length > 1) &&
    name.trim().length > 0 &&
    phone.trim().length > 0;

  const handleSavedSelect = (address: string) => {
    search.setQuery(address);
    setPicked(true);
    // Set Lahore center coordinates as initial fallback
    setPickup({
      address,
      lat: 31.5204,
      lng: 74.3587,
    });
    // Dynamically look up full coordinates in the background
    autocompletePlaces(address, newPlacesSession())
      .then((results: any[]) => {
        if (results.length > 0) {
          getPlaceDetails(results[0].place_id, newPlacesSession())
            .then((place: any) => {
              if (place) {
                setPickup(place);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  };

  const handleSelect = async (placeId: string, description: string) => {
    const place = await search.select({
      place_id: placeId,
      description,
      main_text: description,
      secondary_text: '',
    });
    if (place) {
      setPickup(place);
      setPicked(true);
    }
  };

  const handleContinue = async () => {
    if (!picked && search.query.trim().length > 0) {
      // Set Lahore center coordinates as initial fallback
      setPickup({
        address: search.query,
        lat: 31.5204,
        lng: 74.3587,
      });

      try {
        const results = await autocompletePlaces(search.query, newPlacesSession());
        if (results.length > 0) {
          const place = await getPlaceDetails(results[0].place_id, newPlacesSession());
          if (place) {
            setPickup(place);
          }
        }
      } catch (err) {
        console.warn('Geocoding fallback failed:', err);
      }
    }

    updatePickup({ detail, contactName: name, contactPhone: phone, notes });
    router.push('/dropoff-address');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>STEP 1 OF 2</Text>
          <Text style={styles.headerTitle}>Pickup address</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Map placeholder */}
        <View style={styles.map}>
          <View style={styles.mapGrid} />
          <View style={styles.mapPin}>
            <View style={[styles.pinBadge, { backgroundColor: COLORS.pickup }]}>
              <MaterialIcons name="trip-origin" size={18} color="#ffffff" />
            </View>
            <View style={[styles.pinStem, { backgroundColor: COLORS.pickup }]} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.mapBtn, pressed && styles.mapBtnPressed]}
            accessibilityRole="button">
            <MaterialIcons name="my-location" size={18} color={COLORS.onSurface} />
            <Text style={styles.mapBtnText}>Move on map</Text>
          </Pressable>
        </View>

        {/* Saved places */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.savedRow}>
          {SAVED.map((place) => (
            <Pressable
              key={place.key}
              onPress={() => handleSavedSelect(place.address)}
              style={({ pressed }) => [styles.savedChip, pressed && styles.savedChipPressed]}
              accessibilityRole="button">
              <MaterialIcons name={place.icon} size={18} color={COLORS.primary} />
              <Text style={styles.savedChipText}>{place.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Address */}
        <Text style={styles.sectionTitle}>Pickup location</Text>
        <View style={styles.field}>
          <MaterialIcons name="place" size={20} color={COLORS.pickup} />
          <TextInput
            value={search.query}
            onChangeText={search.onChangeText}
            placeholder="Search or enter address"
            placeholderTextColor={COLORS.outline}
            style={styles.input}
            multiline
          />
          {search.loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
        </View>
        {search.unavailable ? (
          <Text style={styles.hint}>Address search is temporarily unavailable.</Text>
        ) : null}
        {search.predictions.length > 0 ? (
          <View style={styles.suggestions}>
            {search.predictions.map((p) => (
              <Pressable
                key={p.place_id}
                onPress={() => handleSelect(p.place_id, p.description)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                accessibilityRole="button">
                <MaterialIcons name="place" size={18} color={COLORS.outline} />
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
        <View style={styles.field}>
          <MaterialIcons name="apartment" size={20} color={COLORS.outline} />
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="Apartment, floor, building (optional)"
            placeholderTextColor={COLORS.outline}
            style={styles.input}
          />
        </View>

        {/* Sender contact */}
        <Text style={styles.sectionTitle}>Sender details</Text>
        <View style={styles.field}>
          <MaterialIcons name="person" size={20} color={COLORS.outline} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Sender name"
            placeholderTextColor={COLORS.outline}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <MaterialIcons name="call" size={20} color={COLORS.outline} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={COLORS.outline}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Pickup instructions</Text>
        <View style={[styles.field, styles.fieldNote]}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Call when you arrive at the gate"
            placeholderTextColor={COLORS.outline}
            style={[styles.input, styles.inputNote]}
            multiline
          />
        </View>

        {/* Continue */}
        <Pressable
          disabled={!canContinue}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.next,
            !canContinue && styles.nextDisabled,
            pressed && canContinue && styles.nextPressed,
          ]}
          accessibilityRole="button">
          <Text style={[styles.nextText, !canContinue && styles.nextTextDisabled]}>
            Continue to drop-off
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
  savedRow: {
    gap: 10,
    paddingTop: 16,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  savedChipPressed: {
    opacity: 0.8,
  },
  savedChipText: {
    fontSize: 14,
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
