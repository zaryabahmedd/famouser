import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
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
  success: '#1a7d4b',
};

type Step = {
  label: string;
  time: string;
  done: boolean;
};

const STEPS: Step[] = [
  { label: 'Order placed', time: 'Today · 10:02 AM', done: true },
  { label: 'Rider assigned', time: 'Today · 10:08 AM', done: true },
  { label: 'Picked up', time: 'Today · 10:21 AM', done: true },
  { label: 'Delivered', time: 'Today · 10:32 AM', done: true },
];

const FARE: { label: string; value: string }[] = [
  { label: 'Base fare', value: '₦320' },
  { label: 'Distance (12.4 km)', value: '₦186' },
  { label: 'Service fee', value: '₦60' },
];

export function OrderDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
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
        <Text style={styles.headerTitle}>Order details</Text>
        <Pressable
          onPress={() =>
            Share.share({ message: 'Here is my FAMO delivery receipt.' })
          }
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
        {/* Status banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <MaterialIcons name="check-circle" size={28} color={COLORS.success} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Delivered</Text>
            <Text style={styles.bannerSub}>Order #FAM-29384 · Today, 10:32 AM</Text>
          </View>
        </View>

        {/* Route */}
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
                <Text style={styles.routeValue}>DHA Phase 5, Lahore</Text>
              </View>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>DROP-OFF</Text>
                <Text style={styles.routeValue}>Gulberg III, Lahore</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          {STEPS.map((s, i) => (
            <View key={s.label} style={styles.stepRow}>
              <View style={styles.stepCol}>
                <View style={[styles.stepDot, s.done && styles.stepDotDone]}>
                  {s.done && <MaterialIcons name="check" size={12} color={COLORS.onPrimaryFixed} />}
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepTime}>{s.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rider */}
        <Text style={styles.sectionTitle}>Rider</Text>
        <View style={[styles.card, styles.riderCard]}>
          <View style={styles.riderAvatar}>
            <MaterialIcons name="two-wheeler" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.riderText}>
            <Text style={styles.riderName}>Rashid Ahmed</Text>
            <Text style={styles.riderMeta}>Electric Scooter · 4.9★</Text>
          </View>
          <Pressable
            onPress={() => router.push('/chat')}
            style={styles.riderBtn}
            accessibilityRole="button"
            accessibilityLabel="Message rider">
            <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.onPrimaryContainer} />
          </Pressable>
        </View>

        {/* Fare */}
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          {FARE.map((row) => (
            <View key={row.label} style={styles.fareRow}>
              <Text style={styles.fareLabel}>{row.label}</Text>
              <Text style={styles.fareValue}>{row.value}</Text>
            </View>
          ))}
          <View style={styles.fareDivider} />
          <View style={styles.fareRow}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalValue}>₦566</Text>
          </View>
          <View style={styles.payMethod}>
            <MaterialIcons name="credit-card" size={18} color={COLORS.onSurfaceVariant} />
            <Text style={styles.payMethodText}>Visa •••• 4242</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.push('/help-support')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="report-problem" size={20} color={COLORS.onSurface} />
          <Text style={styles.secondaryText}>Report issue</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/instant-quote')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          accessibilityRole="button">
          <Text style={styles.primaryText}>Reorder</Text>
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
  riderBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fareLabel: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
  },
  fareValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  fareDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 8,
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
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  payMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
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
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
