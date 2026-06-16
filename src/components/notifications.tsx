import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
import { StatusBar } from 'expo-status-bar';
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#646464',
  outlineVariant: '#f0edf1',
  outline: '#cec6ad',
};

export function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => goBack()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Pressable
          onPress={() => router.push('/notification-settings')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notification settings">
          <MaterialIcons name="more-vert" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={styles.empty}>
        <MaterialIcons name="notifications-none" size={48} color={COLORS.outline} />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyText}>
          We&apos;ll let you know here when there&apos;s an update on your deliveries or account.
        </Text>
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
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.onSurfaceVariant,
  },
});
