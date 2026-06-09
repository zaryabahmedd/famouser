import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVATAR_FALLBACK = 'https://randomuser.me/api/portraits/lego/1.jpg';

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
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

type Route =
  | '/'
  | '/orders'
  | '/track-package'
  | '/instant-quote'
  | '/profile'
  | '/settings'
  | '/help-support';

type DrawerItem = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route?: Route;
  active?: boolean;
};

const ITEMS: DrawerItem[] = [
  { key: 'home', icon: 'home', label: 'Home', route: '/', active: true },
  { key: 'orders', icon: 'inventory-2', label: 'My Orders', route: '/orders' },
  { key: 'track', icon: 'local-shipping', label: 'Track Package', route: '/track-package' },
  { key: 'quote', icon: 'request-quote', label: 'Get a Quote', route: '/instant-quote' },
  { key: 'profile', icon: 'person', label: 'My Profile', route: '/profile' },
  { key: 'settings', icon: 'settings', label: 'Settings', route: '/settings' },
];

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
};

export function Sidebar({ visible, onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { width } = useWindowDimensions();

  const avatarUri = profile?.avatar_url ?? AVATAR_FALLBACK;
  const displayName = profile?.full_name ?? 'Customer';
  const drawerWidth = Math.min(320, width * 0.85);

  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -drawerWidth,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth, translateX, overlay]);

  const go = (route?: Route) => {
    onClose();
    if (route) {
      setTimeout(() => {
        if (route === '/') {
          router.dismissTo('/');
        } else {
          router.push(route);
        }
      }, 180);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlay }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            { width: drawerWidth, paddingTop: insets.top + 24, transform: [{ translateX }] },
          ]}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}>
            {/* Profile */}
            <View style={styles.profile}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{displayName}</Text>
                <View style={styles.ratingRow}>
                  <MaterialIcons name="verified" size={16} color={COLORS.primary} />
                  <Text style={styles.ratingText}>Verified Customer</Text>
                </View>
              </View>
            </View>

            {/* Customer ID card */}
            <View style={styles.idCard}>
              <View>
                <Text style={styles.idLabel}>CUSTOMER ID</Text>
                <Text style={styles.idValue}>#FAM-29384</Text>
              </View>
              <MaterialIcons name="qr-code-2" size={28} color={COLORS.outline} />
            </View>

            {/* Navigation */}
            <View style={styles.nav}>
              {ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => go(item.route)}
                  style={({ pressed }) => [
                    styles.navItem,
                    item.active && styles.navItemActive,
                    pressed && !item.active && styles.navItemPressed,
                  ]}
                  accessibilityRole="button">
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={item.active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
                  />
                  <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}

              <View style={styles.divider} />

              <Pressable
                onPress={() => go('/help-support')}
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                accessibilityRole="button">
                <MaterialIcons name="help" size={24} color={COLORS.onSurfaceVariant} />
                <Text style={styles.navLabel}>Help &amp; Support</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onClose();
                  logout();
                }}
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemDanger]}
                accessibilityRole="button">
                <MaterialIcons name="logout" size={24} color={COLORS.error} />
                <Text style={[styles.navLabel, styles.navLabelDanger]}>Logout</Text>
              </Pressable>
            </View>

            <Image
              source={require('@/assets/images/FAMO-logo-dark.png')}
              style={styles.brand}
              contentFit="contain"
              accessibilityLabel="FAMO"
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 27, 30, 0.45)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  scroll: {
    flexGrow: 1,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  profileInfo: {
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.outline,
  },
  idValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  nav: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  navItemPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  navItemDanger: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  navLabelActive: {
    color: COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
  navLabelDanger: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 16,
  },
  brand: {
    marginTop: 'auto',
    marginLeft: 16,
    marginVertical: 24,
    width: 110,
    height: 40,
    opacity: 0.4,
  },
});
