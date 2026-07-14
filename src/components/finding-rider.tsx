import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    BackHandler,
    Easing,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGoBack } from '@/hooks/use-go-back';
import { BottomNav } from '@/components/bottom-nav';
import { useDeliveryStatus } from '@/hooks/use-delivery-status';
import { supabase } from '@/lib/supabase';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#f0edf1',
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
  onPrimary: '#ffffff',
  error: '#ba1a1a',
};

const RADAR_SIZE = 300;

function PulseRing({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        delay,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.6] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return <Animated.View style={[styles.pulseRing, { opacity, transform: [{ scale }] }]} />;
}

function PingDot() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.stepDotInner}>
      <Animated.View style={[styles.pingDot, { opacity, transform: [{ scale }] }]} />
      <View style={styles.pingDotCore} />
    </View>
  );
}

export function FindingRider() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const params = useLocalSearchParams<{ deliveryId?: string }>();
  const deliveryId = typeof params.deliveryId === 'string' ? params.deliveryId : null;
  const { delivery } = useDeliveryStatus(deliveryId);

  // Human-readable label for the package category badge.
  const CATEGORY_LABELS: Record<string, string> = {
    documents: 'Documents',
    electronics: 'Electronics',
    fragile: 'Fragile',
    food: 'Food',
    other: 'Other',
  };
  const packageBadge =
    (delivery?.package_category === 'other' && delivery?.package_description) ||
    (delivery?.package_category ? CATEGORY_LABELS[delivery.package_category] : null) ||
    'Standard';

  useEffect(() => {
    // Preview fallback: without a real delivery id, simulate assignment.
    if (deliveryId) return;
    const timer = setTimeout(() => router.replace('/rider-assigned'), 4000);
    return () => clearTimeout(timer);
  }, [deliveryId, router]);

  // Backing out of this screen means abandoning the search, so intercept the
  // Android hardware/gesture back and confirm before cancelling the ride.
  // (There is no back arrow here, and the root layout uses a Slot — no iOS
  // swipe-back — so the hardware back press is the only back path.)
  const cancellingRef = useRef(false);
  const cancelRideAndGoHome = useCallback(async () => {
    if (cancellingRef.current) return;
    cancellingRef.current = true;
    try {
      // Preview mode (no real delivery): nothing to cancel server-side.
      if (deliveryId) {
        const { error } = await supabase.rpc('user_cancel_delivery', {
          p_delivery_id: deliveryId,
        });
        // Already-cancelled is fine (e.g. dispatch timed out meanwhile); any
        // other failure keeps the user here so the search isn't silently lost.
        if (error && !error.message?.includes('cannot_cancel_cancelled')) {
          Alert.alert('Unable to cancel', 'We could not cancel your ride. Please try again.');
          return;
        }
      }
      router.dismissTo('/');
    } finally {
      cancellingRef.current = false;
    }
  }, [deliveryId, router]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        Alert.alert(
          'Cancel ride?',
          'Are you sure you want to cancel the ride?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', style: 'destructive', onPress: () => cancelRideAndGoHome() },
          ],
          { cancelable: true },
        );
        // Returning true suppresses the default back navigation so the dialog
        // decides what happens instead.
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [cancelRideAndGoHome]),
  );

  useEffect(() => {
    if (!delivery) return;
    if (delivery.status === 'accepted' || delivery.status === 'picked_up') {
      router.replace({
        pathname: '/rider-assigned',
        params: { deliveryId: delivery.id, riderId: delivery.rider_id ?? '' },
      });
    } else if (delivery.status === 'cancelled') {
      goBack();
    } else if (delivery.status === 'no_riders') {
      Alert.alert(
        'No riders available',
        "We couldn't find a rider for this delivery right now. Please try again in a few minutes.",
        [{ text: 'OK', onPress: () => router.replace('/orders') }],
      );
    }
  }, [delivery, router]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/FAMO-logo-dark.png')}
            style={styles.brandLogo}
            contentFit="contain"
            accessibilityLabel="FAMO"
          />
        </View>
        <Pressable
          onPress={() => router.push('/help-support')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Help">
          <MaterialIcons name="help-outline" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Radar + bike */}
        <View style={styles.radar}>
          <PulseRing delay={0} />
          <PulseRing delay={1000} />
          <PulseRing delay={2000} />
          <Image
            source={require('@/assets/images/Bike4.png')}
            style={styles.bike}
            contentFit="contain"
          />
        </View>

        {/* Text info */}
        <View style={styles.textInfo}>
          <Text style={styles.title}>Finding your rider...</Text>
          <Text style={styles.subtitle}>
            Assigning the nearest FAMO courier to your delivery.
          </Text>
        </View>

        {/* Progress timeline */}
        <View style={styles.timeline}>
          <View style={styles.timelineTrack} />
          <View style={styles.timelineProgress} />
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <MaterialIcons name="check" size={18} color={COLORS.onPrimary} />
            </View>
            <Text style={styles.stepLabel}>Received</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <PingDot />
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Searching</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotPending]}>
              <MaterialIcons name="local-shipping" size={18} color={COLORS.outline} />
            </View>
            <Text style={styles.stepLabel}>Arriving</Text>
          </View>
        </View>

        {/* Shipment summary */}
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>SHIPMENT SUMMARY</Text>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{packageBadge}</Text>
            </View>
          </View>
          <View style={styles.route}>
            <View style={styles.routeIndicator}>
              <View style={styles.routeDotStart} />
              <View style={styles.routeLine} />
              <View style={styles.routeDotEnd} />
            </View>
            <View style={styles.routeText}>
              <View style={styles.routeBlock}>
                <Text style={styles.routeLabel}>Pick-up</Text>
                <Text style={styles.routeValue} numberOfLines={1}>
                  {delivery?.pickup_address ?? 'Pickup location'}
                </Text>
              </View>
              <View style={styles.routeBlock}>
                <Text style={styles.routeLabel}>Drop-off</Text>
                <Text style={styles.routeValue} numberOfLines={1}>
                  {delivery?.dropoff_address ?? 'Drop-off location'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cancel */}
        <Pressable
          onPress={() =>
            router.push({ pathname: '/cancel-delivery', params: { deliveryId: deliveryId ?? '' } })
          }
          style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
          accessibilityRole="button">
          <MaterialIcons name="cancel" size={20} color={COLORS.secondary} />
          <Text style={styles.cancelText}>Cancel Request</Text>
        </Pressable>
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
    letterSpacing: -1,
    color: COLORS.primary,
  },
  brandLogo: {
    width: 84,
    height: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  radar: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  bike: {
    width: 240,
    height: 240,
    zIndex: 10,
  },
  textInfo: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },
  timeline: {
    width: '100%',
    maxWidth: 360,
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    marginBottom: 48,
  },
  timelineTrack: {
    position: 'absolute',
    top: 16,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: COLORS.outlineVariant,
  },
  timelineProgress: {
    position: 'absolute',
    top: 16,
    left: 8,
    width: '50%',
    height: 2,
    backgroundColor: COLORS.primary,
  },
  step: {
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: COLORS.primary,
  },
  stepDotActive: {
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stepDotPending: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  pingDotCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  summary: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.onSurfaceVariant,
  },
  summaryBadge: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  route: {
    flexDirection: 'row',
    gap: 12,
  },
  routeIndicator: {
    alignItems: 'center',
    paddingTop: 4,
  },
  routeDotStart: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 4,
  },
  routeDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.onSurfaceVariant,
  },
  routeText: {
    flex: 1,
    gap: 16,
  },
  routeBlock: {
    gap: 2,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 48,
  },
  cancelPressed: {
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.secondary,
  },
});
