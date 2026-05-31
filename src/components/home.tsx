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
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { Sidebar } from '@/components/sidebar';

const AVATAR_URI = 'https://randomuser.me/api/portraits/men/32.jpg';
const RIDER_AVATAR_URI = 'https://randomuser.me/api/portraits/men/75.jpg';
const BANNER_URI =
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=70';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerHigh: '#f5f7fb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b5563',
  secondary: '#5e5e5e',
  outline: '#9ca3af',
  outlineVariant: '#edf0f5',
  primary: '#d6a900',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#665400',
  onPrimaryFixed: '#211b00',
};

type ActionCard = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  image?: number;
  title: string;
  subtitle: string;
  href?: '/schedule' | '/track-package' | '/instant-quote' | '/help-support';
};

const ACTIONS: ActionCard[] = [
  {
    key: 'schedule',
    icon: 'event',
    image: require('@/assets/images/truck.png'),
    title: 'Schedule',
    subtitle: 'Now or later',
    href: '/schedule',
  },
  {
    key: 'track',
    icon: 'local-shipping',
    image: require('@/assets/images/box.png'),
    title: 'Track Package',
    subtitle: 'Live updates',
    href: '/track-package',
  },
  {
    key: 'quote',
    icon: 'request-quote',
    image: require('@/assets/images/get a quote.png'),
    title: 'Get Quote',
    subtitle: 'Instant pricing',
    href: '/instant-quote',
  },
  {
    key: 'support',
    icon: 'support-agent',
    image: require('@/assets/images/support .png'),
    title: 'Support',
    subtitle: '24/7 help',
    href: '/help-support',
  },
];

export function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Sidebar visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Open menu">
            <MaterialIcons name="menu" size={26} color={COLORS.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={styles.avatarRing}
            accessibilityRole="button"
            accessibilityLabel="Open menu">
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
          </Pressable>
          <View>
            <Text style={styles.greeting}>Hello, Ahmed</Text>
            <Text style={styles.greetingSub}>Where shall we deliver today?</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={COLORS.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Search */}
        <Pressable
          onPress={() => router.push('/address-picker')}
          style={styles.search}
          accessibilityRole="button"
          accessibilityLabel="Set delivery destination">
          <MaterialIcons name="location-on" size={22} color={COLORS.onSurfaceVariant} />
          <TextInput
            editable={false}
            pointerEvents="none"
            placeholder="Where to send your package?"
            placeholderTextColor="rgba(75, 71, 52, 0.7)"
            style={styles.searchInput}
          />
        </Pressable>

        {/* Bento grid */}
        <View style={styles.grid}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.href ? () => router.push(action.href!) : undefined}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button">
              <View style={[styles.cardIcon, action.image ? styles.cardIconImage : null]}>
                {action.image ? (
                  <Image source={action.image} style={styles.cardImage} contentFit="contain" />
                ) : (
                  <MaterialIcons name={action.icon} size={36} color={COLORS.primary} />
                )}
              </View>
              <Text style={styles.cardTitle}>{action.title}</Text>
              <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        {/* Active delivery */}
        <View style={styles.delivery}>
          <View style={styles.deliveryTop}>
            <Text style={styles.badge}>IN TRANSIT</Text>
            <Text style={styles.eta}>
              ETA <Text style={styles.etaBold}>14 min</Text>
            </Text>
          </View>
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryLeft}>
              <View style={styles.courierRing}>
                <Image
                  source={{ uri: RIDER_AVATAR_URI }}
                  style={styles.courierAvatar}
                  contentFit="cover"
                />
                <View style={styles.courierBadge}>
                  <Text style={styles.courierBadgeText}>R</Text>
                </View>
              </View>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryTitle}>DHA Phase 5 → Gulberg</Text>
                <Text style={styles.deliverySub}>Rashid · Electric Scooter · 4.9★</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/live-tracking')}
              style={({ pressed }) => [styles.trackBtn, pressed && styles.trackBtnPressed]}
              accessibilityRole="button">
              <Text style={styles.trackBtnText}>Track</Text>
            </Pressable>
          </View>
        </View>

        {/* Promo banner */}
        <View style={styles.promo}>
          <Image source={{ uri: BANNER_URI }} style={styles.promoImage} contentFit="cover" />
          <View style={styles.promoOverlay} />
          <View style={styles.promoContent}>
            <Text style={styles.promoEyebrow}>FIRST DELIVERY</Text>
            <Text style={styles.promoTitle}>Professional pickup, simple pricing.</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" />
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
    borderBottomColor: 'rgba(229, 231, 235, 0.85)',
    backgroundColor: '#ffffff',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)' } as object) : null),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    padding: 2,
    backgroundColor: COLORS.surfaceLowest,
  },
  avatar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  greeting: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  greetingSub: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.55)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)' } as object) : null),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    padding: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    height: 176,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.5)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)' } as object) : null),
  },
  cardPressed: {
    transform: [{ translateY: -3 }],
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceLowest,
  },
  cardIcon: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardIconImage: {
    backgroundColor: 'transparent',
    width: 88,
    height: 88,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  delivery: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.55)',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 6,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)' } as object) : null),
  },
  deliveryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.onPrimaryContainer,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  eta: {
    fontSize: 14,
    color: COLORS.onSurface,
  },
  etaBold: {
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deliveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  courierRing: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    padding: 2,
    backgroundColor: COLORS.surfaceLowest,
  },
  courierAvatar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  courierBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  courierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  deliveryInfo: {
    flex: 1,
    gap: 2,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  deliverySub: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  trackBtn: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 999,
  },
  trackBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  trackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
  promo: {
    height: 128,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.5)',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
  promoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 27, 30, 0.55)',
  },
  promoContent: {
    paddingHorizontal: 24,
  },
  promoEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.primaryContainer,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 220,
  },
});
