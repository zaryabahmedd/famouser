import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  surfaceContainer: '#f0edf1',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  primaryFixed: '#ffe24c',
  onPrimaryContainer: '#726300',
};

type Delivery = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  status: string;
  statusBg: string;
  statusColor: string;
  trackingId: string;
  from: string;
  to: string;
  meta: string;
  progress: number;
};

const DELIVERIES: Delivery[] = [
  {
    key: 'd1',
    icon: 'inventory-2',
    status: 'In transit',
    statusBg: '#f3e8ff',
    statusColor: '#6b21a8',
    trackingId: 'FAMO-94821',
    from: 'DHA Phase 5',
    to: 'Gulberg III',
    meta: 'Rashid · ETA 14 min',
    progress: 0.75,
  },
  {
    key: 'd2',
    icon: 'inventory',
    status: 'Picked up',
    statusBg: '#e0e0e0',
    statusColor: '#616363',
    trackingId: 'FAMO-94815',
    from: 'Lekki Phase 1',
    to: 'Ikeja City Mall',
    meta: 'Faisal · Picked up',
    progress: 0.25,
  },
  {
    key: 'd3',
    icon: 'calendar-today',
    status: 'Scheduled',
    statusBg: '#e0e7ff',
    statusColor: '#3730a3',
    trackingId: 'FAMO-94800',
    from: 'Victoria Island',
    to: 'Surulere',
    meta: 'Tomorrow · 9:00 AM',
    progress: 0,
  },
];

export function TrackPackage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Track package</Text>
        </View>
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={COLORS.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>TRACKING NUMBER</Text>
          <View style={styles.searchField}>
            <MaterialIcons name="search" size={22} color={COLORS.outline} />
            <TextInput
              value={trackingId}
              onChangeText={setTrackingId}
              placeholder="Enter tracking ID"
              placeholderTextColor={COLORS.outline}
              style={styles.searchInput}
              autoCapitalize="characters"
            />
          </View>
          <Pressable
            onPress={() => router.push('/live-tracking')}
            style={({ pressed }) => [styles.trackBtn, pressed && styles.trackBtnPressed]}
            accessibilityRole="button">
            <Text style={styles.trackBtnText}>Track</Text>
          </Pressable>
        </View>

        {/* Active deliveries */}
        <Text style={styles.sectionHeading}>ACTIVE DELIVERIES</Text>
        <View style={styles.list}>
          {DELIVERIES.map((d) => (
            <Pressable
              key={d.key}
              onPress={() => router.push('/live-tracking')}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button">
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <MaterialIcons name={d.icon} size={20} color={COLORS.onSurfaceVariant} />
                </View>
                <View style={styles.cardTopText}>
                  <Text style={styles.cardTracking}>{d.trackingId}</Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {d.meta}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: d.statusBg }]}>
                  <Text style={[styles.statusText, { color: d.statusColor }]}>{d.status}</Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeDots}>
                  <View style={styles.dotOrigin} />
                  <View style={styles.routeLine} />
                  <MaterialIcons name="place" size={14} color={COLORS.onSurface} />
                </View>
                <View style={styles.routeText}>
                  <Text style={styles.routePoint} numberOfLines={1}>
                    {d.from}
                  </Text>
                  <Text style={styles.routePoint} numberOfLines={1}>
                    {d.to}
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${d.progress * 100}%` }]} />
              </View>
            </Pressable>
          ))}
        </View>
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
    fontWeight: '900',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  searchSection: {
    marginBottom: 28,
    gap: 12,
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  trackBtn: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  trackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.onPrimaryContainer,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.onSurfaceVariant,
    marginBottom: 14,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopText: {
    flex: 1,
    minWidth: 0,
  },
  cardTracking: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  routeDots: {
    alignItems: 'center',
    paddingTop: 4,
  },
  dotOrigin: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.onSurfaceVariant,
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 14,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 2,
  },
  routeText: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  routePoint: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryFixed,
  },
});
