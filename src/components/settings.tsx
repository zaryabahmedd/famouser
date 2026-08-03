import { useAuth } from '@/hooks/use-auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
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
  error: '#ba1a1a',
};

type Route =
  | '/edit-profile'
  | '/saved-addresses'
  | '/payment-methods'
  | '/notification-settings'
  | '/help-support';

type LinkRow = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  route?: Route;
};

type ToggleRow = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
};

const ACCOUNT: LinkRow[] = [
  { key: 'profile', icon: 'person', label: 'Edit profile', route: '/edit-profile' },
  { key: 'addresses', icon: 'location-on', label: 'Saved addresses', route: '/saved-addresses' },
  { key: 'payments', icon: 'account-balance-wallet', label: 'Payment methods', route: '/payment-methods' },
  { key: 'notifications', icon: 'notifications', label: 'Notifications', route: '/notification-settings' },
];

const PREFERENCES: LinkRow[] = [
  { key: 'language', icon: 'translate', label: 'Language', value: 'English' },
  { key: 'currency', icon: 'payments', label: 'Currency', value: 'NGN (₦)' },
];

const PRIVACY: ToggleRow[] = [
  { key: 'location', icon: 'my-location', label: 'Location services', description: 'Allow live tracking during deliveries' },
  { key: 'biometric', icon: 'fingerprint', label: 'Biometric unlock', description: 'Use Face ID or fingerprint to open the app' },
  { key: 'data', icon: 'insights', label: 'Personalized experience', description: 'Use my activity to improve recommendations' },
];

const SUPPORT: LinkRow[] = [
  { key: 'help', icon: 'help-outline', label: 'Help & support', route: '/help-support' },
  { key: 'terms', icon: 'description', label: 'Terms of service' },
  { key: 'privacy', icon: 'privacy-tip', label: 'Privacy policy' },
];

export function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    location: true,
    biometric: false,
    data: true,
  });

  const renderLink = (row: LinkRow) => (
    <Pressable
      key={row.key}
      onPress={row.route ? () => router.push(row.route!) : undefined}
      style={({ pressed }) => [styles.row, pressed && row.route && styles.rowPressed]}
      accessibilityRole="button">
      <View style={styles.rowIcon}>
        <MaterialIcons name={row.icon} size={22} color={COLORS.onSurface} />
      </View>
      <Text style={styles.rowLabel}>{row.label}</Text>
      {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
      <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
    </Pressable>
  );

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
        <Text style={styles.headerTitle}>Settings </Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>{ACCOUNT.map(renderLink)}</View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>{PREFERENCES.map(renderLink)}</View>

        {/* Privacy & security */}
        <Text style={styles.sectionTitle}>Privacy & security</Text>
        <View style={styles.card}>
          {PRIVACY.map((row) => (
            <View key={row.key} style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialIcons name={row.icon} size={22} color={COLORS.onSurface} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowDescription}>{row.description}</Text>
              </View>
              <Switch
                value={toggles[row.key]}
                onValueChange={(v) => setToggles((prev) => ({ ...prev, [row.key]: v }))}
                trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryContainer }}
                thumbColor={toggles[row.key] ? COLORS.primary : COLORS.surfaceLowest}
              />
            </View>
          ))}
        </View>

        {/* Support & legal */}
        <Text style={styles.sectionTitle}>Support & legal</Text>
        <View style={styles.card}>{SUPPORT.map(renderLink)}</View>

        {/* Logout */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          accessibilityRole="button">
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Text style={styles.version}>FAMO · Version 4.12.0</Text>
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
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  rowPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  rowDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.secondary,
    marginRight: 4,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 20,
  },
});
