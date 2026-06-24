import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { useGoBack } from '@/hooks/use-go-back';
import type { Delivery } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

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
  onPrimaryContainer: '#726300',
};

const ACTIVE_STATUSES = ['searching', 'accepted', 'picked_up'];

function orderCode(id: string): string {
  return `FAMO-${id.replace(/-/g, '').slice(-5).toUpperCase()}`;
}

function getStatusDisplay(status: string) {
  switch (status) {
    case 'searching':
      return { label: 'Finding rider', bg: '#E9E1FF', color: '#6750A4' };
    case 'accepted':
      return { label: 'Rider on way', bg: '#E1F5FE', color: '#01579B' };
    case 'picked_up':
      return { label: 'In transit', bg: '#f3e8ff', color: '#6b21a8' };
    default:
      return { label: status, bg: COLORS.surfaceContainer, color: COLORS.onSurfaceVariant };
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yest = new Date();
  yest.setDate(now.getDate() - 1);
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (d.toDateString() === now.toDateString()) return `Today · ${t}`;
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${t}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${t}`;
}

// Extract the 5-character code suffix from user input, tolerating the
// "FAMO-" prefix, lowercase, dashes, and stray whitespace.
function parseTrackingCode(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/^FAMO-?/, '').replace(/[^0-9A-F]/g, '');
  if (cleaned.length < 5) return null;
  return cleaned.slice(-5).toLowerCase();
}

export function TrackPackage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const [trackingId, setTrackingId] = useState('');
  const [searching, setSearching] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('user_id', userId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false });
      if (active) {
        setDeliveries((data as Delivery[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleTrack = async () => {
    const suffix = parseTrackingCode(trackingId);
    if (!suffix) {
      Alert.alert('Invalid tracking number', 'Enter a code like FAMO-549BF.');
      return;
    }

    setSearching(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      // `id` is a Postgres `uuid` column, so pattern-matching it on the server
      // (e.g. ilike) fails without an explicit cast. Fetch the user's orders
      // and match the code suffix client-side using the same logic that
      // generates the displayed FAMO-XXXXX code.
      const { data } = await supabase.from('deliveries').select('id, status').eq('user_id', userId);

      const match = (data ?? []).find(
        (d) => d.id.replace(/-/g, '').slice(-5).toLowerCase() === suffix,
      );

      if (!match) {
        Alert.alert('Not found', `No order matches tracking number FAMO-${suffix.toUpperCase()}.`);
        return;
      }

      router.push({ pathname: '/order-details', params: { deliveryId: match.id } });
    } finally {
      setSearching(false);
    }
  };

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
          <Text style={styles.headerTitle}>Track package</Text>
        </View>
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={COLORS.onSurface} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
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
              placeholder="e.g. FAMO-549BF"
              placeholderTextColor={COLORS.outline}
              style={styles.searchInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          <Pressable
            onPress={handleTrack}
            disabled={searching}
            style={({ pressed }) => [
              styles.trackBtn,
              pressed && styles.trackBtnPressed,
              searching && styles.trackBtnDisabled,
            ]}
            accessibilityRole="button">
            {searching ? (
              <ActivityIndicator color={COLORS.onPrimaryContainer} />
            ) : (
              <Text style={styles.trackBtnText}>Track</Text>
            )}
          </Pressable>
        </View>

        {/* Active deliveries */}
        <Text style={styles.sectionHeading}>ACTIVE DELIVERIES</Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primary} />
        ) : deliveries.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="local-shipping" size={40} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>No active deliveries right now</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {deliveries.map((d) => {
              const status = getStatusDisplay(d.status);
              return (
                <Pressable
                  key={d.id}
                  onPress={() =>
                    router.push({ pathname: '/live-tracking', params: { deliveryId: d.id } })
                  }
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  accessibilityRole="button">
                  <View style={styles.cardTop}>
                    <View style={styles.cardIcon}>
                      <MaterialIcons name="inventory-2" size={20} color={COLORS.onSurfaceVariant} />
                    </View>
                    <View style={styles.cardTopText}>
                      <Text style={styles.cardTracking}>{orderCode(d.id)}</Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {formatTime(d.created_at)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
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
                        {d.pickup_address ?? 'Pickup location'}
                      </Text>
                      <Text style={styles.routePoint} numberOfLines={1}>
                        {d.dropoff_address ?? 'Drop-off location'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </KeyboardAwareScrollView>
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
  trackBtnDisabled: {
    opacity: 0.7,
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
  loader: {
    marginTop: 32,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
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
});
