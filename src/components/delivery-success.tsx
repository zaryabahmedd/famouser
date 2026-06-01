import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Alert,
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
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  primaryFixedDim: '#e2c62d',
  onPrimaryContainer: '#726300',
};

const AVATAR_URI = 'https://randomuser.me/api/portraits/men/75.jpg';

type SummaryRow = {
  label: string;
  value: string;
  total?: boolean;
};

const SUMMARY: SummaryRow[] = [
  { label: 'Content', value: 'Electronics' },
  { label: 'Weight', value: '5.5kg' },
  { label: 'Total Paid', value: 'Rs 566', total: true },
];

export function DeliverySuccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rating, setRating] = useState(0);

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
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Delivery Status</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert('Options', undefined, [
              {
                text: 'Share',
                onPress: () =>
                  Share.share({ message: 'My FAMO delivery is complete.' }),
              },
              { text: 'Help & support', onPress: () => router.push('/help-support') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="More options">
          <MaterialIcons name="more-vert" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/box.png')}
            style={styles.heroImage}
            contentFit="contain"
          />
          <Text style={styles.heroTitle}>Delivered Successfully</Text>
          <Text style={styles.heroSub}>Your package has been handed over safely.</Text>
        </View>

        {/* Rider section */}
        <View style={styles.card}>
          <View style={styles.riderRow}>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            <View>
              <Text style={styles.riderName}>Rashid Ahmed</Text>
              <Text style={styles.riderRole}>FAMO Prime Rider</Text>
            </View>
          </View>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Rate your rider</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setRating(i + 1)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${i + 1} stars`}>
                  <MaterialIcons
                    name={i < rating ? 'star' : 'star-border'}
                    size={28}
                    color={COLORS.primaryFixedDim}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Shipment summary */}
        <View style={styles.card}>
          <Text style={styles.summaryHeading}>Shipment Summary</Text>
          <View style={styles.summaryRows}>
            {SUMMARY.map((row) => (
              <View
                key={row.label}
                style={[styles.summaryRow, row.total && styles.summaryRowTotal]}>
                <Text style={[styles.summaryLabel, row.total && styles.summaryLabelTotal]}>
                  {row.label}
                </Text>
                <Text style={[styles.summaryValue, row.total && styles.summaryValueTotal]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>BACK TO HOME</Text>
        </Pressable>
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
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  heroImage: {
    width: 192,
    height: 192,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 360,
  },
  card: {
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  riderRole: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  ratingSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    gap: 8,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: 12,
  },
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  summaryLabelTotal: {
    fontSize: 14,
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  summaryValueTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cta: {
    marginTop: 4,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: COLORS.primaryFixedDim,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.onPrimaryContainer,
  },
});
