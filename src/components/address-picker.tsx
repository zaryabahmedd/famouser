import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
};

type Suggestion = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  tag?: string;
};

const SAVED: Suggestion[] = [
  { key: 'home', icon: 'home', title: 'Home', subtitle: 'DHA Phase 5, Lahore', tag: 'Home' },
  { key: 'work', icon: 'work', title: 'Work', subtitle: 'Gulberg III, Lahore', tag: 'Work' },
];

const RECENT: Suggestion[] = [
  { key: 'r1', icon: 'history', title: 'Ikeja City Mall', subtitle: 'Obafemi Awolowo Way, Ikeja' },
  { key: 'r2', icon: 'history', title: 'Packages Mall', subtitle: 'Walton Road, Lahore Cantt' },
  { key: 'r3', icon: 'history', title: 'Emporium Mall', subtitle: 'Trade Centre, Johar Town' },
];

export function AddressPicker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const [pickup, setPickup] = useState('Victoria Island, Lagos');
  const [dropoff, setDropoff] = useState('');

  const choose = (value: string) => {
    if (!dropoff) {
      setDropoff(value);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Set location</Text>
        <View style={styles.iconButton} />
      </View>

      {/* Route inputs */}
      <View style={styles.inputs}>
        <View style={styles.timeline}>
          <View style={styles.dotStart} />
          <View style={styles.timelineLine} />
          <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.inputFields}>
          <View style={styles.inputRow}>
            <TextInput
              value={pickup}
              onChangeText={setPickup}
              placeholder="Pickup location"
              placeholderTextColor={COLORS.outline}
              style={styles.input}
            />
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}>
            <TextInput
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Where to? Drop-off location"
              placeholderTextColor={COLORS.outline}
              style={styles.input}
              autoFocus
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Map shortcut */}
        <Pressable
          onPress={() => choose('Pinned location on map')}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.rowPressed]}
          accessibilityRole="button">
          <MaterialIcons name="map" size={22} color={COLORS.primary} />
          <Text style={styles.mapBtnText}>Set location on map</Text>
        </Pressable>

        {/* Saved */}
        <Text style={styles.sectionTitle}>Saved places</Text>
        {SAVED.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => choose(s.subtitle)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button">
            <View style={styles.rowIcon}>
              <MaterialIcons name={s.icon} size={22} color={COLORS.onSurface} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{s.title}</Text>
              <Text style={styles.rowSubtitle}>{s.subtitle}</Text>
            </View>
            {s.tag ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{s.tag}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}

        {/* Recent */}
        <Text style={styles.sectionTitle}>Recent</Text>
        {RECENT.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => choose(s.subtitle)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button">
            <View style={styles.rowIcon}>
              <MaterialIcons name={s.icon} size={22} color={COLORS.onSurfaceVariant} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{s.title}</Text>
              <Text style={styles.rowSubtitle}>{s.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Confirm */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.push('/schedule')}
          disabled={!dropoff}
          style={({ pressed }) => [
            styles.confirm,
            !dropoff && styles.confirmDisabled,
            pressed && dropoff && styles.confirmPressed,
          ]}
          accessibilityRole="button">
          <Text style={styles.confirmText}>Confirm locations</Text>
        </Pressable>
      </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  inputs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  timeline: {
    alignItems: 'center',
    paddingTop: 18,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  timelineLine: {
    width: 2,
    height: 34,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 2,
  },
  inputFields: {
    flex: 1,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  inputRow: {
    height: 52,
    justifyContent: 'center',
  },
  inputDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  input: {
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    marginBottom: 8,
  },
  mapBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  rowSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  confirm: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmPressed: {
    transform: [{ scale: 0.98 }],
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
});
