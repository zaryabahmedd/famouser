import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { Sidebar } from '@/components/sidebar';
import type { Delivery } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#f0edf1',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  secondaryContainer: '#e2e2e2',
  onSecondaryContainer: '#646464',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};

const TABS = ['Active', 'Scheduled', 'Completed'];

const ACTIVE_STATUSES = ['searching', 'accepted', 'picked_up'];
const COMPLETED_STATUSES = ['delivered', 'cancelled'];

function getStatusDisplay(status: string) {
  switch (status) {
    case 'scheduled':
      return { label: 'Scheduled', bg: '#E9E1FF', color: '#6750A4' };
    case 'searching':
      return { label: 'Finding rider', bg: '#E9E1FF', color: '#6750A4' };
    case 'accepted':
      return { label: 'Rider on way', bg: '#E1F5FE', color: '#01579B' };
    case 'picked_up':
      return { label: 'In transit', bg: '#E9E1FF', color: '#6750A4' };
    case 'delivered':
      return { label: 'Delivered', bg: COLORS.secondaryContainer, color: COLORS.onSecondaryContainer };
    case 'cancelled':
      return { label: 'Cancelled', bg: COLORS.errorContainer, color: COLORS.onErrorContainer };
    default:
      return { label: status, bg: COLORS.secondaryContainer, color: COLORS.onSecondaryContainer };
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

function orderCode(id: string): string {
  return `FAMO-${id.replace(/-/g, '').slice(-5).toUpperCase()}`;
}

export function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState('Active');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId || !active) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('user_id', userId)
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

  const filtered = deliveries.filter((d) => {
    if (tab === 'Active') return ACTIVE_STATUSES.includes(d.status);
    if (tab === 'Completed') return COMPLETED_STATUSES.includes(d.status);
    if (tab === 'Scheduled') return d.status === 'scheduled';
    return false;
  });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Sidebar visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => setMenuOpen(true)}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Menu">
            <MaterialIcons name="menu" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Image
            source={require('@/assets/images/FAMO-logo-dark.png')}
            style={styles.brandLogo}
            contentFit="contain"
            accessibilityLabel="FAMO"
          />
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Orders</Text>

        <View style={styles.tabs}>
          {TABS.map((t) => {
            const isActive = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, isActive && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primary} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="inventory-2" size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>
              {tab === 'Scheduled' ? 'No scheduled orders yet' : `No ${tab.toLowerCase()} orders`}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((order) => {
              const status = getStatusDisplay(order.status);
              const isActiveOrder = ACTIVE_STATUSES.includes(order.status);
              const isScheduledOrder = order.status === 'scheduled';
              const onPress = () => {
                if (isScheduledOrder) {
                  router.push({ pathname: '/orders-schedule', params: { deliveryId: order.id } });
                } else if (isActiveOrder) {
                  router.push({ pathname: '/live-tracking', params: { deliveryId: order.id } });
                } else {
                  router.push({ pathname: '/order-details', params: { deliveryId: order.id } });
                }
              };
              return (
                <Pressable
                  key={order.id}
                  onPress={onPress}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  accessibilityRole="button">
                  <View style={styles.cardTop}>
                    <View style={styles.cardIcon}>
                      <MaterialIcons
                        name={isScheduledOrder ? 'event' : 'inventory-2'}
                        size={20}
                        color={COLORS.onSurfaceVariant}
                      />
                    </View>
                    <View style={styles.cardTopText}>
                      <Text style={styles.cardCode}>{orderCode(order.id)}</Text>
                      <Text style={styles.cardTime} numberOfLines={1}>
                        {isScheduledOrder && order.scheduled_at
                          ? `For ${formatTime(order.scheduled_at)}`
                          : formatTime(order.created_at)}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
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
                        {order.pickup_address ?? 'Pickup location'}
                      </Text>
                      <Text style={styles.routePoint} numberOfLines={1}>
                        {order.dropoff_address ?? 'Drop-off location'}
                      </Text>
                    </View>
                    <Text style={styles.cardPrice}>
                      {order.price != null ? `₦${Number(order.price).toLocaleString()}` : '—'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.promo}>
          <View style={styles.promoContent}>
            <Text style={styles.promoEyebrow}>COMING NEXT</Text>
            <Text style={styles.promoTitle}>Express Inter-city{'\n'}Deliveries</Text>
            <Pressable
              style={({ pressed }) => [styles.promoBtn, pressed && styles.promoBtnPressed]}
              accessibilityRole="button">
              <Text style={styles.promoBtnText}>Notify Me</Text>
            </Pressable>
          </View>
          <MaterialIcons
            name="local-shipping"
            size={120}
            color={COLORS.onPrimaryContainer}
            style={styles.promoIcon}
          />
        </View>
      </ScrollView>
      <BottomNav active="orders" />
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
  brandLogo: {
    width: 84,
    height: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: COLORS.primaryContainer,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurfaceVariant,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
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
  cardCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardTime: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  statusPill: {
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
    alignItems: 'center',
    gap: 10,
  },
  routeDots: {
    alignItems: 'center',
    paddingTop: 4,
    alignSelf: 'stretch',
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
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    alignSelf: 'flex-end',
  },
  promo: {
    marginTop: 32,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 12,
    padding: 24,
    overflow: 'hidden',
  },
  promoContent: {
    zIndex: 10,
  },
  promoEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.onPrimaryContainer,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
    marginBottom: 16,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.onPrimaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoBtnPressed: {
    transform: [{ translateY: 2 }],
  },
  promoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.primaryContainer,
  },
  promoIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    opacity: 0.2,
    transform: [{ rotate: '12deg' }],
  },
});
