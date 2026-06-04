import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';

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

type Status = {
  label: string;
  bg: string;
  color: string;
};

const STATUS: Record<string, Status> = {
  transit: { label: 'In transit', bg: '#E9E1FF', color: '#6750A4' },
  picked: { label: 'Picked', bg: '#E1F5FE', color: '#01579B' },
  delivered: { label: 'Delivered', bg: COLORS.secondaryContainer, color: COLORS.onSecondaryContainer },
  cancelled: { label: 'Cancelled', bg: COLORS.errorContainer, color: COLORS.onErrorContainer },
};

type Order = {
  id: string;
  code: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  from: string;
  to: string;
  time: string;
  price: string;
  status: keyof typeof STATUS;
  highlight?: boolean;
};

const ORDERS: Order[] = [
  { id: 'o1', code: 'FAMO-94821', icon: 'inventory-2', from: 'DHA Phase 5', to: 'Gulberg III', time: 'Today · 10:32 AM', price: '₦566', status: 'transit' },
  { id: 'o2', code: 'FAMO-94815', icon: 'inventory', from: 'Office', to: 'Lahore Cantt', time: 'Today · 09:18 AM', price: '₦420', status: 'picked' },
  { id: 'o3', code: 'FAMO-94800', icon: 'inventory-2', from: 'Home', to: "Mom's House", time: 'Yesterday · 6:40 PM', price: '₦380', status: 'delivered', highlight: true },
  { id: 'o4', code: 'FAMO-94782', icon: 'inventory-2', from: 'Warehouse', to: 'Shop', time: 'May 12 · 2:15 PM', price: '₦1,240', status: 'delivered' },
  { id: 'o5', code: 'FAMO-94771', icon: 'inventory', from: 'DHA', to: 'Bahria', time: 'May 10 · 11:00 AM', price: '₦0', status: 'cancelled' },
];

export function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState('Active');

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

        {/* Tabs */}
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

        {/* Orders list */}
        <View style={styles.list}>
          {ORDERS.map((order) => {
            const status = STATUS[order.status];
            return (
              <Pressable
                key={order.id}
                onPress={() =>
                  order.status === 'delivered' || order.status === 'cancelled'
                    ? router.push('/order-details')
                    : router.push('/live-tracking')
                }
                style={({ pressed }) => [
                  styles.card,
                  order.highlight && styles.cardHighlight,
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button">
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <MaterialIcons name={order.icon} size={20} color={COLORS.onSurfaceVariant} />
                  </View>
                  <View style={styles.cardTopText}>
                    <Text style={styles.cardCode}>{order.code}</Text>
                    <Text style={styles.cardTime} numberOfLines={1}>
                      {order.time}
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
                      {order.from}
                    </Text>
                    <Text style={styles.routePoint} numberOfLines={1}>
                      {order.to}
                    </Text>
                  </View>
                  <Text style={styles.cardPrice}>{order.price}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Promo card */}
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
  brand: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
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
  cardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryContainer,
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
  cardTime: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
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
