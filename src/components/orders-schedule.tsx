import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGoBack } from '@/hooks/use-go-back';
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
  accent: '#6750A4',
  accentBg: 'rgba(103, 80, 164, 0.1)',
  errorText: '#ba1a1a',
};

const CATEGORY_LABELS: Record<string, string> = {
  documents: 'Documents',
  electronics: 'Electronics',
  fragile: 'Fragile Items',
  food: 'Food',
  other: 'Other',
};

function orderCode(id: string): string {
  return `FAMO-${id.replace(/-/g, '').slice(-5).toUpperCase()}`;
}

function formatScheduledDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatScheduledTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function paymentLabel(method: Delivery['payment_method']): string {
  if (method === 'bank_transfer') return 'Bank transfer';
  if (method === 'cod') return 'Cash on delivery';
  return 'Not set';
}

export function OrdersSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack();
  const { deliveryId } = useLocalSearchParams<{ deliveryId?: string }>();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!deliveryId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();
      if (!active) return;
      if (data) setDelivery(data as Delivery);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [deliveryId]);

  const handleDelete = () => {
    if (!deliveryId || deleting) return;
    Alert.alert('Delete scheduled order', 'This will cancel the request. This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Delete order',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const { error } = await supabase.rpc('user_cancel_delivery', {
            p_delivery_id: deliveryId,
          });
          setDeleting(false);
          if (error) {
            Alert.alert('Unable to delete', 'We could not delete this order. Please try again.');
            return;
          }
          router.replace('/orders');
        },
      },
    ]);
  };

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
        <Text style={styles.errorText}>Scheduled order not found.</Text>
        <Pressable onPress={() => goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const packageLabel =
    (delivery.package_category === 'other' && delivery.package_description) ||
    (delivery.package_category ? CATEGORY_LABELS[delivery.package_category] : null) ||
    'Package';

  const scheduledIso = delivery.scheduled_at ?? delivery.created_at;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.iconButton} />
        <Text style={styles.headerTitle}>Scheduled order</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <MaterialIcons name="event-available" size={28} color={COLORS.accent} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Scheduled</Text>
            <Text style={styles.bannerSub}>{orderCode(delivery.id)}</Text>
          </View>
        </View>

        {/* Schedule date & time */}
        <Text style={styles.sectionTitle}>Pickup schedule</Text>
        <View style={styles.card}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleIcon}>
              <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.scheduleText}>
              <Text style={styles.scheduleLabel}>DATE</Text>
              <Text style={styles.scheduleValue}>{formatScheduledDate(scheduledIso)}</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleIcon}>
              <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.scheduleText}>
              <Text style={styles.scheduleLabel}>TIME</Text>
              <Text style={styles.scheduleValue}>{formatScheduledTime(scheduledIso)}</Text>
            </View>
          </View>
        </View>

        {/* Route */}
        <Text style={styles.sectionTitle}>Route</Text>
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
                {delivery.sender_name ? (
                  <Text style={styles.routeMeta}>
                    {delivery.sender_name}
                    {delivery.sender_phone ? ` · ${delivery.sender_phone}` : ''}
                  </Text>
                ) : null}
              </View>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>DROP-OFF</Text>
                <Text style={styles.routeValue}>
                  {delivery.dropoff_address ?? 'Drop-off location'}
                </Text>
                {delivery.recipient_name ? (
                  <Text style={styles.routeMeta}>
                    {delivery.recipient_name}
                    {delivery.recipient_phone ? ` · ${delivery.recipient_phone}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Package */}
        <Text style={styles.sectionTitle}>Package</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{packageLabel}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size & weight</Text>
            <Text style={styles.detailValue}>
              {(delivery.package_size ?? '—').toUpperCase()}
              {delivery.weight != null ? ` · ${delivery.weight}kg` : ''}
            </Text>
          </View>
          {delivery.special_instructions ? (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.detailRowStacked}>
                <Text style={styles.detailLabel}>Instructions</Text>
                <Text style={styles.detailValueWrap}>{delivery.special_instructions}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Payment */}
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{paymentLabel(delivery.payment_method)}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {delivery.price != null ? `₦${Number(delivery.price).toLocaleString()}` : '—'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.replace('/orders')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          accessibilityRole="button">
          <Text style={styles.primaryText}>Go to My Orders</Text>
        </Pressable>
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteBtn,
            (pressed || deleting) && styles.btnPressed,
          ]}
          accessibilityRole="button">
          {deleting ? (
            <ActivityIndicator color={COLORS.errorText} />
          ) : (
            <Text style={styles.deleteText}>Delete order</Text>
          )}
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
    backgroundColor: COLORS.accentBg,
    marginBottom: 4,
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
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 14,
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
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleText: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.secondary,
  },
  scheduleValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
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
  routeMeta: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailRowStacked: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  detailValueWrap: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.onSurface,
    lineHeight: 21,
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
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  deleteBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.errorText,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.errorText,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
