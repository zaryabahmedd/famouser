// Web fallback for the map picker. react-native-maps is native-only, so on web
// we show a short message and let the user return to the address form.
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  onSurface: '#1b1b1e',
  secondary: '#5e5e5e',
  primary: '#6d5e00',
  onPrimary: '#ffffff',
};

export function MapPicker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isDropoff = params.mode === 'dropoff';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isDropoff ? 'Set drop-off location' : 'Set pickup location'}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.body}>
        <MaterialIcons name="map" size={48} color={COLORS.secondary} />
        <Text style={styles.message}>
          Picking a location on the map is available on the FAMO mobile app. Please enter the
          address in the search field instead.
        </Text>
        <Pressable
          onPress={() => goBack()}
          style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
          accessibilityRole="button">
          <Text style={styles.confirmText}>Back to address</Text>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: COLORS.secondary,
  },
  confirm: {
    marginTop: 8,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPressed: {
    opacity: 0.9,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
});
