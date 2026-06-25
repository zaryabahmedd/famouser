import { useGoBack } from '@/hooks/use-go-back';
import { useAuth } from '@/hooks/use-auth';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BottomNav } from '@/components/bottom-nav';
import { useProfile } from '@/hooks/use-profile';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
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
  error: '#ba1a1a',
};

type Route = '/orders' | '/edit-profile' | '/help-support' | '/settings';

type MenuItem = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route?: Route;
};

const MENU: MenuItem[] = [
  { key: 'orders', icon: 'inventory-2', label: 'My Orders', route: '/orders' },
  { key: 'settings', icon: 'settings', label: 'Settings', route: '/settings' },
  { key: 'support', icon: 'contact-support', label: 'Help & support', route: '/help-support' },
];


export function UserProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const { logout } = useAuth();
  const { profile, reload } = useProfile();

  // Refresh the profile each time this screen regains focus (e.g. returning
  // from Edit profile) so name/photo changes show immediately.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const displayName = profile?.full_name?.trim() || 'Your profile';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.brandLogo}
          contentFit="contain"
          accessibilityLabel="FAMO"
        />
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profile}>
          <View style={styles.avatarRing}>
            <Avatar uri={profile?.avatar_url} size={120} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="verified" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>Verified</Text>
          </View>
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
            accessibilityRole="button">
            <Text style={styles.editBtnText}>Edit profile</Text>
          </Pressable>
        </View>

        {/* Menu list */}
        <View style={styles.menu}>
          {MENU.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.route ? () => router.push(item.route!) : undefined}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              accessibilityRole="button">
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <MaterialIcons name={item.icon} size={22} color={COLORS.onSurface} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurfaceVariant} />
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.push('/delete-account')}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            accessibilityRole="button">
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, styles.menuIconDanger]}>
                <MaterialIcons name="delete-outline" size={22} color={COLORS.error} />
              </View>
              <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Delete Account</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.error} />
          </Pressable>
        </View>

        {/* Logout */}
        <View style={styles.footer}>
          <Pressable
            onPress={logout}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
            accessibilityRole="button">
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          <Text style={styles.version}>Version 4.12.0</Text>
        </View>
      </ScrollView>

      <BottomNav active="profile" />
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
    paddingTop: 32,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  profile: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: COLORS.primaryContainer,
    padding: 4,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  metaDot: {
    color: COLORS.outline,
  },
  editBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(253, 224, 71, 0.25)',
  },
  editBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  menu: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
  },
  menuItemPressed: {
    borderColor: COLORS.primary,
    transform: [{ scale: 0.98 }],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: '#ffdad6',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  menuLabelDanger: {
    color: COLORS.error,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  logoutBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  logoutBtnPressed: {
    borderColor: 'rgba(186, 26, 26, 0.2)',
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  version: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
});
