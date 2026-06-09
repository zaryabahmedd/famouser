import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Delivery } from '@/lib/delivery-types';
import { supabase } from '@/lib/supabase';

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
  success: '#1a7d4b',
  errorBg: 'rgba(186,26,26,0.1)',
  errorText: '#ba1a1a',
};

type RiderInfo = {
  full_name: string;
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
};

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

type TimelineStep = { label: string; time: string; done: boolean };

function buildTimeline(delivery: Delivery): TimelineStep[] {
  const cancelled = delivery.status === 'cancelled';

  const steps: TimelineStep[] = [
    { label: 'Order placed', time: formatTime(delivery.created_at), done: true },
  ];

  if (cancelled) {
    steps.push({ label: 'Cancelled', time: formatTime(delivery.updated_at), done: true });
    return steps;
  }

  const riderAssigned = ['accepted', 'picked_up', 'delivered'].includes(delivery.status);
  steps.push({
    label: 'Rider assigned',
    time: delivery.accepted_at ? formatTime(delivery.accepted_at) : '',
    done: riderAssigned,
  });

  const pickedUp = ['picked_up', 'delivered'].includes(delivery.status);
  steps.push({ label: 'Picked up', time: '', done: pickedUp });

  const delivered = delivery.status === 'delivered';
  steps.push({
    label: 'Delivered',
    time: delivered ? formatTime(delivery.updated_at) : '',
    done: delivered,
  });

  return steps;
}

export function OrderDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams<{ deliveryId?: string }>();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [rider, setRider] = useState<RiderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliveryId) { setLoading(false); return; }
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (!active) return;
      if (data) {
        const d = data as Delivery;
        setDelivery(d);

        if (d.rider_id) {
          const { data: riderData } = await supabase
            .from('riders')
            .select('full_name, vehicle_type, vehicle_brand, vehicle_model')
            .eq('id', d.rider_id)
            .single();
          if (active && riderData) setRider(riderData as RiderInfo);
        }
      }
      if (active) setLoading(false);
    })();

    return () => { active = false; };
  }, [deliveryId]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Order not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const steps = buildTimeline(delivery);
  const isCancelled = delivery.status === 'cancelled';
  const vehicleLabel = rider
    ? [rider.vehicle_type, rider.vehicle_brand, rider.vehicle_model].filter(Boolean).join(' · ')
    : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Order details</Text>
        <Pressable
          onPress={() => Share.share({ message: `FAMO delivery ${orderCode(delivery.id)}` })}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Share receipt">
          <MaterialIcons name="ios-share" size={22} color={COLORS.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>

        <View style={[styles.banner, isCancelled && styles.bannerCancelled]}>
          <View style={styles.bannerIcon}>
            <MaterialIcons
              name={isCancelled ? 'cancel' : 'check-circle'}
              size={28}
              color={isCancelled ? COLORS.errorText : COLORS.success}
            />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{isCancelled ? 'Cancelled' : 'Delivered'}</Text>
            <Text style={styles.bannerSub}>
              {orderCode(delivery.id)} · {formatTime(delivery.updated_at)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeTimeline}>
              <View style={styles.dotStart} />
              <View style={styles.routeLine} />
              <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.routePoints}>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeValue}>{delivery.pickup_address ?? 'Pickup location'}</Text>
              </View>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>DROP-OFF</Text>
                <Text style={styles.routeValue}>{delivery.dropoff_address ?? 'Drop-off location'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          {steps.map((s, i) => (
            <View key={s.label} style={styles.stepRow}>
              <View style={styles.stepCol}>
                <View style={[styles.stepDot, s.done && styles.stepDotDone]}>
                  {s.done && <MaterialIcons name="check" size={12} color={COLORS.onPrimaryFixed} />}
                </View>
                {i < steps.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                {s.time ? <Text style={styles.stepTime}>{s.time}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {rider && (
          <>
            <Text style={styles.sectionTitle}>Rider</Text>
            <View style={[styles.card, styles.riderCard]}>
              <View style={styles.riderAvatar}>
                <MaterialIcons name="two-wheeler" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.riderText}>
                <Text style={styles.riderName}>{rider.full_name}</Text>
                {vehicleLabel ? <Text style={styles.riderMeta}>{vehicleLabel}</Text> : null}
              </View>
            </View>
          </>
        )}

        {delivery.price != null && (
          <>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.card}>
              <View style={styles.fareRow}>
                <Text style={styles.totalLabel}>Total paid</Text>
                <Text style={styles.totalValue}>₦{Number(delivery.price).toLocaleString()}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.push('/help-support')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="report-problem" size={20} color={COLORS.onSurface} />
          <Text style={styles.secondaryText}>Report issue</Text>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onPrimaryFixed,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 125, 75, 0.1)',
    marginBottom: 20,
  },
  bannerCancelled: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  bannerSub: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 24,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  routeTimeline: {
    alignItems: 'center',
    paddingTop: 4,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 4,
  },
  routePoints: {
    flex: 1,
    gap: 16,
  },
  routePoint: {
    gap: 2,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.secondary,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepCol: {
    alignItems: 'center',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 18,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 2,
  },
  stepText: {
    flex: 1,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  stepTime: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderText: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  riderMeta: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
