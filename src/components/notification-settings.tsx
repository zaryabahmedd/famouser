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
  onPrimaryFixed: '#211b00',
};

type ToggleRow = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
};

type Section = {
  title: string;
  rows: ToggleRow[];
};

const SECTIONS: Section[] = [
  {
    title: 'Delivery updates',
    rows: [
      { key: 'rider_assigned', icon: 'two-wheeler', label: 'Rider assigned', description: 'When a rider accepts your delivery' },
      { key: 'status', icon: 'local-shipping', label: 'Status changes', description: 'Pickup, in transit and delivered alerts' },
      { key: 'eta', icon: 'schedule', label: 'ETA changes', description: 'When your delivery time is updated' },
      { key: 'chat', icon: 'chat', label: 'Messages from rider', description: 'New chat messages during a delivery' },
    ],
  },
  {
    title: 'Payments',
    rows: [
      { key: 'receipts', icon: 'receipt-long', label: 'Receipts', description: 'Get a receipt after each delivery' },
      { key: 'refunds', icon: 'currency-exchange', label: 'Refunds', description: 'Updates on refunds and adjustments' },
    ],
  },
  {
    title: 'Promotions',
    rows: [
      { key: 'offers', icon: 'local-offer', label: 'Offers & discounts', description: 'Personalized promo codes and deals' },
      { key: 'news', icon: 'campaign', label: 'Product news', description: 'New features and announcements' },
    ],
  },
];

const CHANNELS: ToggleRow[] = [
  { key: 'push', icon: 'notifications', label: 'Push notifications', description: 'Alerts on this device' },
  { key: 'email', icon: 'mail', label: 'Email', description: 'Updates to your inbox' },
  { key: 'sms', icon: 'sms', label: 'SMS', description: 'Text messages to your phone' },
];

const DEFAULTS: Record<string, boolean> = {
  rider_assigned: true,
  status: true,
  eta: true,
  chat: true,
  receipts: true,
  refunds: true,
  offers: false,
  news: false,
  push: true,
  email: true,
  sms: false,
};

export function NotificationSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULTS);

  const set = (key: string, value: boolean) =>
    setToggles((prev) => ({ ...prev, [key]: value }));

  const renderRow = (row: ToggleRow) => (
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
        onValueChange={(v) => set(row.key, v)}
        trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryContainer }}
        thumbColor={toggles[row.key] ? COLORS.primary : COLORS.surfaceLowest}
      />
    </View>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>{section.rows.map(renderRow)}</View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Channels</Text>
        <View style={styles.card}>{CHANNELS.map(renderRow)}</View>
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  rowDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
});
